/// <reference path="../Application.js" />

DefineModule("CodeEngine",

     {
         singleInstance: true,
         depends: ["IDEngine"],
         requiresVersion: '3.0',
         created: new Date(2013, 09, 03),
         version: '1.0',
         author: 'Paul Fisher',
         copyright: 'Copyright 2015, Paul Fisher',

         changelog: [
            '03/09/13   PF  Created class.',
            '26/09/13   PF  Updated language.',
            '02/10/13   PF  Changed thread timer to 10ms from 500ms'
        ]

     },

    function () {

        //#region Members

        var _self = this;
        var m_running = true;
        var m_currentThread = 0;
        var m_queue = [];
        var m_priority = [];
		var m_killed = [];

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.CodeEngine = this;

            //Global Assign
            $wait = Application.CodeEngine.Wait;
            $code = Application.CodeEngine.Code;
            $codeblock = Application.CodeEngine.CodeBlock;
            $codeinsert = Application.CodeEngine.CodeInsert;
            $loop = Application.CodeEngine.Loop;
            $next = "<NEXTLOOP>"; 
            $stopallthreads = Application.CodeEngine.StopAllThreads;
            $thread = Application.CodeEngine.CreateThread;
            $locked = Application.CodeEngine.Locked;
            $flag = "<FLAG>";

            Application.On("Login", function () {
                m_killed = [];
            });
        };

        this.Wait = function () {
            return new $.Deferred();
        };

        this.Code = function () {

            //Create a new queue.
            m_queue[m_queue.length] = [];

            //Check for argument array.
            if (arguments.length > 0 && $.isArray(arguments[0])) {

                //Add the async functions to the new queue.
                for (var i = 0; i < arguments[0].length; i++) {
                    m_queue[m_queue.length - 1].push(arguments[0][i]);
                };

            } else {

                //Add the async functions to the new queue.
                for (var i = 0; i < arguments.length; i++) {
                    m_queue[m_queue.length - 1].push(arguments[i]);
                };
            }

            Application.LogDebug(Application.StrSubstitute("%LANG:S_NEWQUEUE%", (m_queue.length - 1), arguments.length));

            //Resolve the first function.
            setZeroTimeout(function () { _self.ResolveQueue() });

        };

        this.CodeBlock = function () {

            var w = $wait();

            var arr = new Array();

            for (var i = 0; i < arguments.length; i++) {
                arr.push(arguments[i]);
            };
            //Bug fix for code insert.
            arr.push(function (r) { return r });

            _self.Code(arr);

            return w.promise();
        };

        this.CodeInsert = function () {

            //Create a queue if one does not exist.
            if (m_queue.length == 0)
                m_queue[m_queue.length] = [];

            var currQueue = m_queue[m_queue.length - 1];

            //Find insert point in current block.
            var index = 0;
            for (index = 1; index < currQueue.length; index++) {
                var method = currQueue[index];
                if (method != null)
                    if (method.toString().indexOf("$flag") == -1)
                        break;
            }

            if (index == 0)
                index += 1;

            //Add the async functions to the existing queue.
            for (var i = 0; i < arguments.length; i++) {
                currQueue.splice(index, 0, arguments[i]);
                index += 1;
            };
        };

        this.RemoveLevel = function () {
            m_queue.splice(m_queue.length - 1, 1);
        };

        this.IsNested = function () {
            return m_queue.length > 1
        };

        this.ResolveQueue = function (result_) {

            if (m_queue.length == 0) return;

            var i = m_queue.length - 1;

            Application.LogDebug(Application.StrSubstitute("%LANG:S_NEXTMETHOD%", i));

            //Save result.
            var arr = [];
            arr.push(result_);

            var method = m_queue[i][0];
            if (m_queue[i].length <= 1) {
                Application.LogDebug(Application.StrSubstitute("%LANG:S_LASTMETHOD%", i));
                _self.RemoveLevel();
            }

            //Don't run null methods.
            if (method == null) {
                Application.LogDebug("%LANG:S_NOMETHOD%");
                _self.RunNextFunction();
                return;
            }

            Application.Fire("CodeBlockFire", method.toString());

            Application.LogDebug(method.toString());

            try {

                $.when(

                //Run method.
		        method.apply(null, arr)

            ).then(

                function (result2) { //Sucess.     

                    Application.LogDebug("%LANG:S_FINISHEDMETHOD%");

                    //Check if this thread is still running.
                    if (!_self.CheckStatus())
                        return;

                    //Run next function.
                    _self.RunNextFunction(result2);

                },

			    function (e) { //Error.
			    }

            );

            } catch (e) {
				
				//Log the method for debugging purposes.
				Application.Log.LogObject(method);
				
                if (e != "")
                    Application.Error(e);
                if (Application.testMode)
                    _self.RunNextFunction(result_);
            }
        };

        this.RunNextFunction = function (param_) {

            if (m_queue.length > 0) {
                m_queue[m_queue.length - 1].shift();
                setZeroTimeout(function () {
                    _self.ResolveQueue(param_)
                });
            }

        };

        this.Loop = function (func) {

            var recfunc = function (i) {

                var w2 = $wait();

                $code(

                    function () {
                        return func(i);
                    },

                    function (ret) {
                        if (ret != null) {
                            if (ret == $next) {
                                return recfunc(i + 1);
                            } else {
                                return ret;
                            }
                        }
                    }
                );

                return w2.promise();
            };

            var w = $wait();

            //Start recursion
            $code(
		        function () {
		            return recfunc(0);
		        }
	        );

            return w.promise();
        };

        this.CheckStatus = function () {

            if (!m_running) {

                _self.ClearThread();
                _self.Start();

                return false
            }
            return true;
        };

        this.StopAllThreads = function () {

            Application.LogDebug("%LANG:S_CLEARINGMETHODS%");
            m_killed = m_killed.concat(m_priority);
            if (m_killed.indexOf(m_currentThread) != -1)
                m_killed.splice(m_killed.indexOf(m_currentThread), 1);
            _self.Stop();            
			m_priority = [];

        };

        this.CreateThread = function (func, id, i, skipDelay, threaduid) {

            if (skipDelay)
                return $codeblock(func);

            if (id == null || threaduid != null) {
                id = Default(threaduid, $id());
                if (m_priority.indexOf(id) != -1)
                    return;
                m_priority.push(id);
                Application.Fire("ThreadCreated");
                Application.LogDebug(Application.StrSubstitute("%LANG:S_CREATEDTHREAD%", id));
            }
			
			//Check killed threads.
            if (m_killed.indexOf(id) != -1) {
                m_killed.splice(m_killed.indexOf(id), 1);
                if (m_priority.indexOf(id) != -1) {
                    m_priority.splice(m_priority.indexOf(id), 1);
                }
                return;
            }

            if (i == null) i = 0;
            if (m_priority.length > 0) {

                //A different thread is still running.    
                if (m_priority[0] != id || m_running == false) {				
					
                    setTimeout(function () {
                        //Application.LogInfo(Application.StrSubstitute("%LANG:S_QUEUEDTHREAD%", id));
                        $thread(func, id, i + 1);
                    },1);
                    return;
                }
            }

            //Run this thread!
            m_currentThread = id;
            Application.LogDebug(Application.StrSubstitute("%LANG:S_STARTEDTHREAD%", id));
            Application.Fire("ThreadCreated");

            $code(

                Application.ThreadStart,

                function () {
                    return func();
                },

                Application.ThreadEnd,

                function () {					
                    Application.LogDebug(Application.StrSubstitute("%LANG:S_STOPPEDTHREAD%", id));
                    _self.Stop();
                    Application.Fire("ThreadFinished");					
                }                

            );

        };

        this.ClearThread = function () {
            if (m_currentThread != 0) {
                if (m_priority.length > 0)
                    m_priority.splice(0, 1);
                m_currentThread = 0;
                m_queue = [];
            }
        };

        this.Start = function () {
            if (m_queue.length <= 0) {
                _self.ClearThread();
                m_running = true;
            }
        };

        this.Stop = function () {
            m_running = false;
            _self.Start();
        };

        this.Restart = function () {
            m_queue = [];
            _self.StopAllThreads();
            //_self.Start();
        };

        this.Locked = function () {
            return m_queue.length != 0;
        };

        //#endregion

    });


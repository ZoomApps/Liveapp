
/**
 * Code engine module.
 * @module CodeEngine 
 * @description
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * **CONTENTS**
 * - [Description](#description)
 * - [Accessing this module](#accessing-this-module)
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Description
 * 
 * The Code Engine module is loaded by default when an application is started. 
 * 
 * This module allows execution of async functions in a certain order.
 * 
 * <div style='background: #f9f2f4; padding: 5px'>**NOTE: Methods that return a `JQueryPromise` should be returned into a {@link $codeblock}**</div>
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Accessing this module
 * 
 * The module is assigned to {@link module:Application.Application.CodeEngine Application.CodeEngine} for access. 
 * 
 * Eg: {@link module:CodeEngine.this.Wait this.Wait} is accessed via `Application.CodeEngine.Wait`.
 * 
 * The following global shortcuts are created:
 * - {@link $wait}                  
 * - {@link $code} 
 * - {@link $codeblock}
 * - {@link $codeinsert}
 * - {@link $loop}
 * - {@link $thread}
 */
DefineModule("CodeEngine",

     {
         singleInstance: true,
         depends: ["IDEngine"],
         requiresVersion: '3.0',
         created: new Date(2013, 9, 3),
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

        /**
         * Runs automatically when the module is loaded. Assigns module functions to globals.                  
         * @memberof module:CodeEngine
         * @returns {void}
         */
        this.OnLoad = function () {

            /** 
             * Code engine module access.
             * @see {@link module:CodeEngine CodeEngine}  
             * @memberof module:Application             
             */
            //Assign Module
            Application.CodeEngine = this;

            //Global Assign
            $wait = Application.CodeEngine.Wait;
            $code = Application.CodeEngine.Code;
            $codeblock = Application.CodeEngine.CodeBlock;
            $codeinsert = Application.CodeEngine.CodeInsert;
            $loop = Application.CodeEngine.Loop;

            /**
             * Return into a {@link $loop} to goto the next iteration.
             * @global
             * @type {string}
             */
            $next = "<NEXTLOOP>"; 
            $stopallthreads = Application.CodeEngine.StopAllThreads;
            $thread = Application.CodeEngine.CreateThread;
            $locked = Application.CodeEngine.Locked;

            /**
             * Use as the first line of a function when using {@link $codeinsert}.
             * @global
             * @type {string}
             */
            $flag = "<FLAG>";

            Application.On("Login", function () {
                m_killed = [];
            });
        };

        /**
         * Create a new promise.
         * @name $wait
         * @method
         * @global
         * @returns {JQueryPromise} Returns a new promise.
         * @example
         * var w = $wait();
         * return w.promise();
         */

        /**
         * Create a new promise. See the shortcut method {@link $wait} for examples.
         * @memberof module:CodeEngine
         * @returns {JQueryPromise} Returns a new promise.
         */
        this.Wait = function () {
            return new $.Deferred();
        };

        /**
         * Define a group of functions to execute.
         * @name $code
         * @method
         * @global
         * @param {...Function} args One or more functions to execute.
         * @returns {void}
         * @example
         * var w = $wait();
         * $code(
         *  function(){
         *      // This will execute first.
         *      return 1;
         *  },
         *  function(ret){
         *      // This will execute second.
         *      // The return value from the previous function is passed into this function.
         *      // ret = 1
         * 
         *      // Resolve the wait.
         *      w.resolve();
         *  }
         * );
         * return w.promise();
         */

        /**
         * Define a group of functions to execute. See the shortcut method {@link $code} for examples.         
         * @memberof module:CodeEngine
         * @param {...Function} args One or more functions to execute.
         * @returns {void}
         */
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
            _self.ResolveQueue();

        };

        /**
         * Define a group of functions to execute. Automatically wraps the code with a wait.
         * @name $codeblock
         * @method
         * @global
         * @param {...Function} args One or more functions to execute.
         * @returns {JQueryPromise} Promises to return after executing all of the functions.
         * @example
         * return $codeblock(
         *  function(){
         *      // This will execute first.
         *      return 1;
         *  },
         *  function(ret){
         *      // This will execute second.
         *      // The return value from the previous function is passed into this function.
         *      // ret = 1
         *  }
         * );
         */

        /**
         * Define a group of functions to execute. Automatically wraps the code with a wait. See the shortcut method {@link $codeblock} for examples.         
         * @memberof module:CodeEngine
         * @param {...Function} args One or more functions to execute.
         * @returns {JQueryPromise} Promises to return after executing all of the functions.
         */
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

        /**
         * Insert functions into the currently executing code block.
         * 
         * **NOTE: The first line of each function needs to be {@link $flag}; so they are not overridden by
         * subsequent calls to `$codeinsert`**
         * @name $codeinsert
         * @method
         * @global
         * @param {...Function} args One or more functions to insert.
         * @returns {void}
         * @example
         * return $codeblock(
         *  function(){
         *      
         *      // This is executed first.
         * 
         *      $codeinsert(
         *          function(){
         *              $flag;
         *              // This will now be executed second.
         *          }
         *      );
         *  },
         *  function(){
         *      // This is now executed third.
         *  }
         * );
         */

        /**
         * Insert functions into the currently executing code block. See the shortcut method {@link $codeinsert} for examples.
         * @memberof module:CodeEngine
         * @param {...Function} args One or more functions to insert.
         * @returns {void}
         */
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

        /**
         * Removes a level from the current code queue.
         * @memberof module:CodeEngine
         * @protected
         * @returns {void}
         */
        this.RemoveLevel = function () {
            m_queue.splice(m_queue.length - 1, 1);
        };

        /**
         * @deprecated Since v5.4.0
         * @memberof module:CodeEngine
         */
        this.IsNested = function () {
            Application.LogWarn('CodeEngine.IsNested has been deprecated since v5.4.0');
            return m_queue.length > 1
        };

        /**
         * Executes the code queue at the current position.
         * @memberof module:CodeEngine
         * @protected
         * @param {*} result_ Argument to pass into the executing function.
         * @returns {void}
         */
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

                function finishedRun(result2) { //Sucess.     

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

        /**
         * Run the next function in the code queue.
         * @memberof module:CodeEngine
         * @protected
         * @param {*} param_ Argument to pass into the next function.
         * @returns {void}
         */
        this.RunNextFunction = function (param_) {

            if (m_queue.length > 0) {
                m_queue[m_queue.length - 1].shift();    
                setTimeout(function(){          
                    _self.ResolveQueue(param_);  
                },1);              
            }

        };

        /**
         * A loop that supports code blocks.
         * 
         * **NOTE: Return {@link $next} into the last function to move to the next loop iteration.**
         * @name $loop
         * @method
         * @global         
         * @param {function(number)} func Function to execute on each iteration. The iterator is passed in as an argument.
         * @returns {JQueryPromise} Promises to return after the loop is completed.
         * @example
         * return $loop(function(i){
         *  return $codeblock(
         *      function(){
         *          // Execute some stuff.
         *      },
         *      function(){
         *          if(i < 10)
         *              return $next;
         *      }
         *  );
         * });
         */

        /**
         * A loop that supports code blocks. See the shortcut method {@link $loop} for examples.
         * @memberof module:CodeEngine
         * @param {function(number)} func Function to execute on each iteration. The iterator is passed in as an argument.
         * @returns {JQueryPromise} Promises to return after the loop is completed.
         */
        this.Loop = function (func) {

            var recfunc = function (i) {

                var w2 = $wait();

                $code(

                    function loopIterator() {
                        return func(i);
                    },

                    function finishLoop(ret) {
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
		        function startLoop() {
		            return recfunc(0);
		        }
	        );

            return w.promise();
        };

        /**
         * Get the status of the current code thread.
         * @memberof module:CodeEngine
         * @protected
         * @returns {boolean} Returns `true` if the current code thread is running.
         */
        this.CheckStatus = function () {

            if (!m_running) {

                _self.ClearThread();
                _self.Start();

                return false
            }
            return true;
        };

        /**
         * Stops all code threads (including the current).
         * @name $stopallthreads
         * @method
         * @global
         * @protected
         * @returns {void}
         */

        /**
         * Stops all code threads (including the current).
         * @memberof module:CodeEngine
         * @protected
         * @returns {void}
         */
        this.StopAllThreads = function () {

            Application.LogDebug("%LANG:S_CLEARINGMETHODS%");
            m_killed = m_killed.concat(m_priority);
            if (m_killed.indexOf(m_currentThread) != -1)
                m_killed.splice(m_killed.indexOf(m_currentThread), 1);
            _self.Stop();            
			m_priority = [];

        };

        /**
         * Create a new code thread.
         * @name $thread
         * @method
         * @global
         * @param {Function} func Function to execute in the thread.
         * @param {number} [id] Internal use only.
         * @param {number} [i] Internal use only. 
         * @param {boolean} [skipDelay=false] Executes the function straight away.
         * @param {*} [threaduid] Unique id for the thread. A thread will not execute if another thread has the same id. 
         * @returns {void}
         * @example
         * $thread(function(){
         *  // This will execute first.
         * });
         * $thread(function(){
         *  // This will run after the thread above finishes.
         * });
         */

        /**
         * Create a new code thread. See the shortcut method {@link $thread} for examples.
         * @memberof module:CodeEngine
         * @param {Function} func Function to execute in the thread.
         * @param {number} [id] Internal use only.
         * @param {number} [i] Internal use only. 
         * @param {boolean} [skipDelay=false] Executes the function straight away.
         * @param {*} [threaduid] Unique id for the thread. A thread will not execute if another thread has the same id. 
         * @returns {void}
         */
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
					
                    setTimeout(function queueThread() {
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

                function runThread() {
                    return func();
                },

                function(){
                    if(Application.transactionStarted > 0){
                        if(Application.developerMode)
                            Application.Message('Transactions out of sync!!! Fixing...');
                        Application.LogWarn('Transactions out of sync!!! Fixing...');
                        Application.transactionStarted = 1;
                        return Application.CommitTransaction();
                    }
                },
                
                function finishThread() {					
                    Application.LogDebug(Application.StrSubstitute("%LANG:S_STOPPEDTHREAD%", id));
                    _self.Stop();
                    Application.Fire("ThreadFinished");					
                }                

            );

        };

        /**
         * Clear the current thread.
         * @memberof module:CodeEngine
         * @protected
         * @returns {void}
         */
        this.ClearThread = function () {
            if (m_currentThread != 0) {
                if (m_priority.length > 0)
                    m_priority.splice(0, 1);
                m_currentThread = 0;
                m_queue = [];
            }
        };

        /**
         * Start the code engine.
         * @memberof module:CodeEngine
         * @protected
         * @returns {void}
         */
        this.Start = function () {
            if (m_queue.length <= 0) {
                _self.ClearThread();
                m_running = true;
            }
        };

        /**
         * Stop the code engine.
         * @memberof module:CodeEngine
         * @protected
         * @returns {void}
         */
        this.Stop = function () {
            m_running = false;
            _self.Start();
        };

        /**
         * Restart the code engine.
         * @memberof module:CodeEngine
         * @protected
         * @returns {void}
         */
        this.Restart = function () {
            m_queue = [];
            _self.StopAllThreads();
            //_self.Start();
        };

        /**
         * @deprecated Since v5.4.0 
         * @memberof module:CodeEngine
         */
        this.Locked = function () {
            Application.LogWarn('CodeEngine.Locked has been deprecated since v5.4.0');
            return m_queue.length != 0;
        };

        //#endregion

    });


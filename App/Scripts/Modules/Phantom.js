/// <reference path="../Application.js" />

DefineModule("PhantomManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 09, 03),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: []
    },

    function () {

        //#region Members

        var _self = this;
        var m_running = false;
		var m_blocks = [];
		var m_recording = false;
		var m_ghostFinger = null;
		var m_lastElem = null;
		var m_timestamp = null;
		var m_docTitle = "";
		var m_timerID = null;
		var m_currentBlock = "";
		var m_currentAction = null;
		
		var m_toASCII = {
        '188': '44',
        '109': '45',
        '190': '46',
        '191': '47',
        '192': '96',
        '220': '92',
        '222': '39',
        '221': '93',
        '219': '91',
        '173': '45',
        '187': '61', //IE Key codes
        '186': '59', //IE Key codes
        '189': '45'  //IE Key codes
		}

		var m_shiftUps = {
			"96": "~",
			"49": "!",
			"50": "@",
			"51": "#",
			"52": "$",
			"53": "%",
			"54": "^",
			"55": "&",
			"56": "*",
			"57": "(",
			"48": ")",
			"45": "_",
			"61": "+",
			"91": "{",
			"93": "}",
			"92": "|",
			"59": ":",
			"39": "\"",
			"44": "<",
			"46": ">",
			"47": "?"
		};
		
        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.Phantom = this;
			
			$handleclick = _self.HandleClick;
			
			$(window).on('click',_self.HandleClick);
			$(window).on('keydown', _self.HandleKeys);

			Application.On("Error", function (msg) {
			    if (m_running) {
			        if (m_recording) {
			            m_blocks[m_blocks.length - 1].errors += 1;
			        } else {
                        //Log Error
			        }
			    }
			});
        };
		
		this.Open = function(){
			var win = window.open(window.location,"phantom","width=1820px,height=980px,resizable=0");					
		};

		this.Running = function () {
		    return m_running;
		};

		this.HandleClick = function(e){
			if(m_recording){
				var d = new Date();
				m_blocks[m_blocks.length - 1].actions.push({ t: 'click', x: e.pageX, y: e.pageY, d: d.getTime() - m_timestamp });
			}
		};
		
		this.HandleKeys = function(e){
			if(m_recording){
				if(e.keyCode == 16 || e.keyCode == 17) //Ctrl or Shift
					return;
				if (e.ctrlKey && (e.which || e.keyCode) == 82) //Ctrl+R
					return;
				if (e.ctrlKey && (e.which || e.keyCode) == 66) //Ctrl+B
				    return;
				if (e.ctrlKey && (e.which || e.keyCode) == 75) //Ctrl+K
				    return;
				var d = new Date();				
				m_blocks[m_blocks.length - 1].actions.push({ t: 'key', key: e.keyCode, s: e.shiftKey, c: e.ctrlKey, d: d.getTime() - m_timestamp });
			}
		};
		
		this.ToggleRecording = function(){
			
			if(m_recording){
				
				_self.EndRecording();
				
				clearInterval(m_timerID);
				document.title = m_docTitle;
				
			}else{
				
				_self.StartRecording();
				
				m_docTitle = document.title;
				document.title = "( •_•)O RECORDING";
				m_timerID = setInterval(function(){
					if(document.title == "( •_•)O RECORDING"){
						document.title = "Q(•_• ) RECORDING";						
					}else{						
						document.title = "( •_•)O RECORDING";
					}
				},1000);
			}
		};
		
		this.StartRecording = function () {		
			m_running = true;
			m_blocks = [];						
			m_recording = true;
			m_currentBlock = "";
			_self.NewBlock();
			var d = new Date();
			m_timestamp = d.getTime();						
        };  
		
		this.EndRecording = function () {
			m_recording = false;	
			m_timestamp = null;
			m_running = false;
			Application.FileDownload.DownloadText("PhantomRecording-"+$id()+".txt",$.toJSON(m_blocks),"application/txt");
        };  
		
		this.NewBlock = function(){
			if(m_recording){
				m_recording = false;
				var name = prompt("Block Name");
				m_blocks.push({ name: name, actions: [], errors: 0 });
				m_currentBlock = name;
				m_recording = true;
			}
		};

		this.InsertTest = function () {
		    if (m_recording) {
		        m_recording = false;
		        var name = prompt("Test Name");
		        var test = prompt("Test Code");
		        var d = new Date();		        
		        m_blocks[m_blocks.length - 1].actions.push({ t: 'code', n: name, c: test, d: d.getTime() - m_timestamp });
		        m_recording = true;
		    }
		};
		
		this.StartPlayback = function(pb){
		
			Application.FileDownload.ShowUploadDialog("Select Phantom File", function (filename, data) {
				
			    m_running = true;
				m_lastElem = null;
				m_currentBlock = "";
				m_blocks = $.parseJSON(atob(data.split(",")[1]));
				m_currentBlock = m_blocks[0].name;
				
				m_docTitle = document.title;
				document.title = "( •_•)O PLAYBACK";
					m_timerID = setInterval(function(){
						if(document.title == "( •_•)O PLAYBACK"){
							document.title = "Q(•_• ) PLAYBACK";						
						}else{						
							document.title = "( •_•)O PLAYBACK";
						}
					},1000);
													
				setTimeout(function(){
					_self.PlayBack();
				},1000);
				
			},true);
		};		

		this.PlayBack = function(i){
		
			i = Default(i, 0);
			
			if(!m_ghostFinger){
				m_ghostFinger = $("<div style='background-color: #9B59B6; width: 10px; height: 10px; border-radius: 50%; position: absolute; z-index: 9999999; top: 0px; left: 0px; border: 1px solid #8E44AD; opacity: 0.8;'></div>");
				$("body").append(m_ghostFinger);
			}
			
			var action = m_blocks[0].actions[i];
			m_currentAction = action;
				
			if(action.t == 'click'){
				
				if(m_lastElem != null){					
					$(m_lastElem).change();
					$(m_lastElem).blur();
				}
				
				m_lastElem = document.elementFromPoint(action.x, action.y);
				m_ghostFinger.animate({
					left: action.x - 5,
					top: action.y - 5
				},500);			
			}
			
			setTimeout(function(){
				
				if(m_lastElem != null){

					var ele = $(m_lastElem);
					
					if (action.t == 'code') {

					    Application.RunNext(function () {
					        return $codeblock(
                                function () {
                                    eval("var func = function(rec, viewer){" + action.c + "};");
                                    var viewer = ThisViewer();
                                    var rec = null;
                                    if (viewer)
                                        rec = viewer.Record();
                                    return func(rec, viewer);
                                },
                                function () {
                                    FinishAction(action, i);
                                }
                            );
					    });

					}else if(action.t == 'click'){

						ele.trigger('click').trigger('mousedown');

					    FinishAction(action, i);

					}else if(action.t == 'key'){		
					
						var send = '';
						if(action.key == 37){ send = "{leftarrow}"; }
						else if(action.key == 38){ send = "{uparrow}"; }
						else if(action.key == 39){ send = "{rightarrow}"; }
						else if(action.key == 40){ send = "{downarrow}"; }
						else if(action.key == 46){ send = "{del}"; }
						else if(action.key == 8){ send = "{backspace}"; }
						else if(action.key == 9){ send = "{tab}"; }
						else if(action.key == 13){ send = "{enter}"; }
						else{
							
							if (m_toASCII.hasOwnProperty(action.key)) {
								action.key = m_toASCII[action.key];
							}

							if (!action.s && (action.key >= 65 && action.key <= 90)) {
								send = String.fromCharCode(action.key + 32);
							} else if (action.s && m_shiftUps.hasOwnProperty(action.key)) {								
								send = m_shiftUps[action.key];
							} else {
								send = String.fromCharCode(action.key);
							}
							
							if(!action.s)
								send = send.toLowerCase();
						}

						ele.sendkeys(send);

						FinishAction(action, i);
					}									
				
				}								
			
			},(action.t == 'click' ? 500 : 0));
		
		};

        //#endregion

        //#region Private Methods

		function ok(exp, desc) {

		};

		function notOk(exp, desc) {

		};

		function equals(val1, val2, desc) {

		};

		function notEquals(val1, val2, desc) {

		};

		function FinishAction(action, i) {

		    if (i < m_blocks[0].actions.length - 1) {
		        var j = i + 1;
		        var delay = m_blocks[0].actions[j].d - action.d;
		        if (action.t == "code")
		            delay = 10;
		        setTimeout(function () {
		            _self.PlayBack(j);
		        }, delay)
		    } else {

		        m_blocks.splice(0, 1);
		        if (m_blocks.length > 0) {
		            m_currentBlock = m_blocks[0].name;
		            setTimeout(function () {
		                _self.PlayBack();
		            }, 1000);
		            return;
		        }

		        m_ghostFinger.remove();
		        m_ghostFinger = null;

		        clearInterval(m_timerID);
		        document.title = m_docTitle;

		        m_running = false;

		        Application.Message("Finished Playback");
		    }

		};

        //#endregion

    });

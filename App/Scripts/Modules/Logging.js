/// <reference path="../Application.js" />

DefineModule("Logging",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 9, 3),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '03/09/13   PF  Created class.',
            '26/09/13   PF  Updated language.'
        ]

    },

    function (type_, errors_, info_) {

        //#region Members

        var _self = this;
        var m_type = 0; //0 = Console Log, 1 = Internal Log
        var m_log = [];
        var m_showErrors = true;
        var m_showInfo = true;

        var m_remote = Application.remoteStatus.Disconnected;
        var m_remoteWindow = null;
        var m_remoteOrigin = "%REMOTEDEBUGURL%"

        //#endregion

        //#region Public Methods

        this.Constructor = function (type_, errors_, info_) {
            m_type = type_;
            if (errors_ != null)
                m_showErrors = errors_;
            if (info_ != null)
                m_showInfo = info_;
        };

        this.OnLoad = function () { 

            //Assign Module
            Application.Log = this;
        };

        this.Info = function (msg) {
            if (m_showInfo)
                Output(msg);
        };

        this.Error = function (msg) {
            if (m_showErrors)
                Output(msg, 1);
        };

        this.Debug = function (msg) {
            if (Application.debugMode)
                Output(msg);
        };

        this.Warn = function (msg) {
            Output(msg, 2);
        };

        this.ClearLog = function () {
            m_log = [];
        };

        this.ShowLog = function (callback) {

            var msg = ""

            if ($moduleloaded("AppUI")) {
                msg = "<div style='text-align: left; width: 100%; height: 300px;'>";
                for (var i = 0; i < m_log.length; i++)
                    msg += m_log[i] + "<br/>";
                msg += "</div>";
            } else {
                for (var i = 0; i < m_log.length; i++)
                    msg += m_log[i] + "/n";
            }

            Application.Message(msg, callback, "%LANG:S_APPLOG%");
        };

        this.LogObject = function (obj) {
            SendRemote("log", stringify(obj), "remote object");
			if(window.console && window.console.dir){
			    console.dir(obj);			    
				return;
			}
			Output($.toJSON(obj));
		};
		
		this.ToggleRemoteDebug = function () {

		    if (m_remote == Application.remoteStatus.Disconnected) {
		        
				if (Application.connected == false)
		            Application.Error("An internet connection is required for remote debug");
		        
				m_remote = Application.remoteStatus.Connecting;
		        
				Application.Message('Please quote to remote support:<p><h2 style="font-family: Times New Roman">' + UID + '</h2></p><small>Note: This code is cAsEsEnSiTive</small>');
				
				var id = $id();
				UI.StatusBar(true, UI.IconImage("bug_green") + " Remote Debug Mode - Code: " + UID + " <a id='"+id+"' style='cursor:pointer;'>(click here to stop debugging)</a>","#A6ECFF");
				$("#"+id).on("click",_self.ToggleRemoteDebug);							
				
		    } else {
				
				SendRemote("error", 'Connection lost with ' + _self.GetUserInfo(), "remote disconnect");
				
		        m_remote = Application.remoteStatus.Disconnected;
				
		        Application.Message('Your remote debug session has now ended');
				
				UI.StatusBar(false);
		    }

		};
		
		this.RemoteStatus = function(){
			return m_remote;
		};
        
		this.HandleMessage = function(event){
			
			  try {
				_self.LogObject(eval(event.data)); 	
			  } catch (e) {
				_self.Error(e);
				_self.LogObject(event.data);
			  }
		};
		
		this.GetUserInfo = function(){
		
			var browser = 'Internet Explorer ';
			if(Application.IsSafari()) browser = 'Safari ';
			if(Application.IsChrome()) browser = 'Chrome ';
			if(Application.IsOpera()) browser = 'Opera ';
			if(Application.IsFirefox()) browser = 'Firefox ';
			
			var mode = 'Desktop Mode';
			if(Application.IsInMobile()) mode = 'Mobile Mode';
			
			var device = 'desktop';
			if(Application.IsDevice()) device = 'mobile';
			
			return Application.auth.Username + '\nScreen Mode: '+mode+'\nBrowser: ' + browser + device + ' version '+ $.browser.version + '\nURL: '+window.location.toString();
			
		};
		
        //#endregion

        //#region Private Methods

        function Output(msg, type) {

            //Add date and time to msg.      
			if(typeof msg == "string")
				msg = Application.FormatDate(new Date(), '%LANG:FORMAT_LONGDATE% %LANG:FORMAT_TIME%') + " - " + msg;

            //Console log.
            if (m_type == 0) {
                try {
                    if (window.console != null) {
                        if (type == 1) {
                            console.error(msg);                            
                        } else if (type == 2) {
                            console.warn(msg);                            
                        } else {
                            console.log(msg);                            
                        }
                    }
                } catch (e) { }

                try{
                    if (type == 1) {                        
                        SendRemote("error", msg, "remote error");
                    } else if (type == 2) {                        
                        SendRemote("log", "WARNING: " + msg, "remote warning");
                    } else {                        
                        SendRemote("log", msg);
                    }
                } catch (e) {
                }
            }

            //Internal log.
            if (m_type == 1) {
                m_log.splice(0, 0, msg);
            }
        };

        function SendRemote(msgType, message, info) {

            info = Default(info, "remote info");

            if (m_remote == Application.remoteStatus.Disconnected || !Application.connected) {
                return;
            }

            try {
                if (!m_remoteWindow)
                    m_remoteWindow = $("#remoteSupport")[0].contentWindow;
            } catch (e) {
                return;
            }

            if (m_remote == Application.remoteStatus.Connecting) {		
			
                m_remoteWindow.postMessage('__init__', m_remoteOrigin);                
                m_remote = Application.remoteStatus.Connected;							
				
            }

            var msg = $.toJSON({ response: " " + message + " ", cmd: info, type: msgType });

            m_remoteWindow.postMessage(msg, m_remoteOrigin);

        };	
		
        function sortci(a, b) {
            return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
        };

        function stringify(o, simple) {
            var json = '', i, type = ({}).toString.call(o), parts = [], names = [];

            if (type == '[object String]') {
                json = '"' + o.replace(/\n/g, '\\n').replace(/"/g, '\\"') + '"';
            } else if (type == '[object Array]') {
                json = '[';
                for (i = 0; i < o.length; i++) {
                    parts.push(stringify(o[i], simple));
                }
                json += parts.join(', ') + ']';
                json;
            } else if (type == '[object Object]') {
                json = '{';
                for (i in o) {
                    names.push(i);
                }
                names.sort(sortci);
                for (i = 0; i < names.length; i++) {
                    parts.push(stringify(names[i]) + ': ' + stringify(o[names[i]], simple));
                }
                json += parts.join(', ') + '}';
            } else if (type == '[object Number]') {
                json = o + '';
            } else if (type == '[object Boolean]') {
                json = o ? 'true' : 'false';
            } else if (type == '[object Function]') {
                json = o.toString();
            } else if (o === null) {
                json = 'null';
            } else if (o === undefined) {
                json = 'undefined';
            } else if (simple == undefined) {
                json = type + '{\n';
                for (i in o) {
                    names.push(i);
                }
                names.sort(sortci);
                for (i = 0; i < names.length; i++) {
                    parts.push(names[i] + ': ' + stringify(o[names[i]], true)); // safety from max stack
                }
                json += parts.join(',\n') + '\n}';
            } else {
                try {
                    json = o + ''; // should look like an object
                } catch (e) { }
            }
            return json;
        };

        //#endregion

        this.Constructor(type_, errors_, info_);

    });
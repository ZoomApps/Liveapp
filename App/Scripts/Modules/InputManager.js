/// <reference path="../Application.js" />

DefineModule("InputManager",

    {

        singleInstance: true,
        requiresVersion: '3.0',
        depends: ["AppUI"],
        created: new Date(2013, 10, 01),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '01/10/13   PF  Created class.'
        ]

    },

    function () {

        //#region Members

        var _self = this;
        var m_keyBindings = [];
        var m_protectedKeys = ['o', 'p', ' ', 'c', 'v'];

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign module.
            UI.InputManager = this;
        };

        this.OnKeyPress = function (ev) {

            if (ev.isDefaultPrevented())
                return;

            if (!Application.UnsupportedIE()) {

                if ($moduleloaded("PhantomManager") && window.opener) {									
										
					if (ev.ctrlKey && (ev.which || ev.keyCode) == 82) { //Ctrl+R						
						Application.Phantom.ToggleRecording();
						ev.preventDefault();
						return false;
					}									
					
					if (ev.ctrlKey && (ev.which || ev.keyCode) == 66) { //Ctrl+B
						Application.Phantom.NewBlock();
						ev.preventDefault();
						return false;
					}

					if (ev.ctrlKey && (ev.which || ev.keyCode) == 75) { //Ctrl+K
					    Application.Phantom.InsertTest();
					    ev.preventDefault();
					    return false;
					}
					
					if (ev.ctrlKey && (ev.which || ev.keyCode) == 80) { //Ctrl+P
						Application.Phantom.StartPlayback();
						ev.preventDefault();
						return false;
					}
					
				}

                if (ev.ctrlKey && ev.key) {
                    var bind = m_keyBindings[ev.key.toLowerCase() + "0"];
                    if ($moduleloaded("WindowManager")) {
                        if (!bind && UI.WindowManager.ActiveWindow())
                            bind = m_keyBindings[ev.key.toLowerCase() + UI.WindowManager.ActiveWindow().ID()];
                    }
                    if (bind) {
                        $("#" + bind["obj"]).click();
                        ev.preventDefault();
                        return false;
                    }
                }

            }

            //Send the key to the window manager.
            if ($moduleloaded("WindowManager")) {
                return UI.WindowManager.OnKeyPress(ev);
            }

        };

        this.AddKeyBinding = function (text_, selector_, winid_) {

            return text_;

            //Removed code as it only worked in IE (boooo)
            /*
            if (Application.UnsupportedIE())
                return text_;

            text_ = Default(text_, "");
            if (winid_ == null) winid_ = 0;

            var bind = GetNextKey(text_, winid_);
            if (bind != null) {
                bind["obj"] = selector_;
                return text_.replace(bind["key"], "<u>" + bind["key"] + "</u>");
            }
            return text_;
            */
        };

        //#endregion

        //#region Private Methods

        function GetNextKey(text_, winid_) {
            for (var i = 0; i < text_.length; i++) {
                var c = text_[i];
                if (m_keyBindings[c.toLowerCase() + winid_] == null && m_keyBindings[c.toLowerCase() + "0"] == null && m_protectedKeys.indexOf(c.toLowerCase()) == -1) {
                    m_keyBindings[c.toLowerCase() + winid_] = { key: c, obj: null };
                    return m_keyBindings[c.toLowerCase() + winid_];
                }
            }
            return null;
        };

        //#endregion

    });
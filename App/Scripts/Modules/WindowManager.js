/// <reference path="../Application.js" />

DefineModule("WindowManager",

    {

        singleInstance: true,
        requiresVersion: '3.0',
        depends: ['AppUI', 'IDEngine', 'Logging'],
        created: new Date(2013, 09, 03),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '03/09/13   PF  Created class.'
        ]

    },

    function () {

        //#region Members

        var _self = this;
        var m_queue = [];
        var m_selectedWindow = null;
        var m_focusWindow = null;
        var m_hasHome = false;
        var m_uiHeight = 0;
        var m_uiWidth = 0;
        var m_uiSideWidth = 0;

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign module.
            UI.WindowManager = this;

            UI.Width = _self.Width;
            UI.Height = _self.Height;
            UI.SideWidth = _self.SideWidth;
        };

        this.Add = function (win) {
            m_queue.push(win);
        };

        this.Count = function () {
            return m_queue.length;
        };

        this.SelectedWindow = function (value_) {
			if(typeof value_ == "undefined"){
				return m_selectedWindow;
			}else{
				 m_selectedWindow = value_;
			}
        };

        this.ActiveWindow = function () {
            return m_focusWindow;
        };

        this.Remove = function (id_) {

            for (var i = 0; i < m_queue.length; i++) {
                if (m_queue[i].ID() == id_) {
                    m_queue.splice(i, 1);
                }
            }
        };

        this.GoHome = function () {

            if (!m_hasHome) {

                if (m_queue.length == 0)
                    return;

                _self.CloseAll(false);

                return;
            }

            if (m_queue.length == 1)
                return;

            _self.CloseAll(true);
        };

        this.CloseAll = function (keephome_) {
                      
            if (m_selectedWindow && m_selectedWindow.Save) {
                m_selectedWindow.Save();
            }
            
            if(m_queue.length > 0)
                Application.RunNext(function () {
                    return $loop(function (i) {
                        return $codeblock(

                            function () {

                                var id = m_queue[m_queue.length - 1].ID();                                
                                
                                //_self.Open(id);
                                return _self.Close(id, true);
                            },

                            function (r) {

                                var id = m_queue[m_queue.length - 1].ID();

                                if (r == true) //cancelled
                                    return;

                                if (m_queue.length != 0 && !keephome_)
                                    return $next;

                                if (keephome_) {
                                    if (m_queue.length != 1) {
                                        return $next;
                                    } else {
                                        return _self.Open(m_queue[0].ID());
                                    }
                                }
                            }
                        );
                    });
                },null,"CLOSEALLWINDOWS");
        };

        this.RemoveAll = function () {

            if (Application.IsInMobile())
                $("#divSideMenu,#divFactbox").panel("close");

            $("#btnCloseAll").remove();
            ShowScroll();

            for (var i = 0; i < m_queue.length; i++) {
                var win = m_queue[i];
                win.Remove();
            }
            m_queue = [];
            m_selectedWindow = null;
            m_focusWindow = null;
        };

        this.HideAll = function () {

            if (Application.IsInMobile())
                $("#divSideMenu,#divFactbox").panel("close");

            $("#lnkActions").hide();
            $("#btnCloseAll").remove();
            ShowScroll();

            if (Application.App.SideVisible() && !Application.restrictedMode)
                Application.App.ToggleSide();

            _self.FocusWindow(0);
            m_selectedWindow = null;

            for (var i = 0; i < m_queue.length; i++) {
                m_queue[i].Hide();
            }

            _self.GetUIDimensions();
        };

        this.GetWindow = function (id_) {

            var win = null;
            for (var i = 0; i < m_queue.length; i++) {
                if (m_queue[i].ID() == id_) {
                    win = m_queue[i];
                    return win;
                }
            }
            return null;
        };

        this.PreLoad = function (id_) {

            var win = _self.GetWindow(id_);
            if (win == null) {
                return;
            }

            if (!win.Dialog())
                _self.HideAll();

            m_selectedWindow = win;
            if (win.LastFocus() == 0)
                win.LastFocus(id_);
            _self.FocusWindow(win.LastFocus());

            win.PreLoad();

        };

        this.Open = function (id_) {

            var win = _self.GetWindow(id_);
            if (win == null) {
                return;
            }

            if (!win.Dialog())
                _self.HideAll();

            win.Show();

            //Close all button.

            var check = 0;
            if (m_hasHome)
                check = 1;

            if (m_queue.length != check && $("#btnCloseAll").length == 0) {

                var winbtn = $("<div id='btnCloseAll' class='main-windowsbtn ui-widget ui-state-default app-closeall-btn'><table><tr><td class='unselectable' style='font-weight: normal; font-size: 14px;'>" + UI.IconImage("mdi-close-circle",null,15) + " Close All</td><td></td></tr></table></div>");
                if (Application.IsInMobile()) {
                    var winbtn = $("<div id='btnCloseAll' class='main-windowsbtn ui-page-theme-a ui-btn app-closeall-btn'><table><tr><td class='unselectable' style='font-weight: normal; font-size: 14px;'>" + UI.IconImage("mdi-close-circle",null,15) + " Close All</td><td></td></tr></table></div>");
                }
                $("#AppWindows").append(winbtn);
                winbtn.on("click", function () {
                    _self.GoHome();
                }).slideDown(300);

                ShowScroll();
            }

            m_selectedWindow = win;
            if (win.LastFocus() == 0)
                win.LastFocus(id_);
            _self.FocusWindow(win.LastFocus());

			if (win.Dialog())
				_self.FocusWindow(id_);
			
            _self.OnOpen(win);

            if (Application.IsInMobile()) {

                //Left Side Button
                $('#lnkMenu').text("Menu");
                $("#lnkMenu").buttonMarkup({ icon: "bars", mini: Application.MiniMode() });
                $("#lnkMenu").unbind("click");
                $("#lnkMenu").click(function () {
                    $("#divSideMenu").panel("toggle");
                });

                //Right Side Button 
                $("#lnkInfo").unbind("click");
                $("#lnkInfo").click(function () {
                    $("#divFactbox").panel("toggle");
                });
				$("#lnkInfo").addClass("app-header-btn");

                $.mobile.resetActivePageHeight();
            }

            return win;
        };

        this.OnResize = function () {

            Application.LogInfo(Application.StrSubstitute("%LANG:S_RESIZEWINDOWS%", m_queue.length));

            _self.GetUIDimensions();

            if (m_selectedWindow)
                m_selectedWindow.Resize();
        };

        this.BeforeClose = function (id_, okclicked_) {

            //Get the window.
            var win = _self.GetWindow(id_);
            if (win && win.OnBeforeClose) {
                return win.OnBeforeClose(okclicked_);
            }
            return true;
        };

        this.Close = function (id_, skipOpen_, skipFunc_, okClicked_) {

			if($("#powertour-mask").is(":visible"))
				return;
				
            //Get the window.
            var win = _self.GetWindow(id_);

			//Focus the window.
			if(win){
				m_selectedWindow = win;
				if (win.LastFocus() == 0)
					win.LastFocus(id_);
				_self.FocusWindow(win.LastFocus());
			}
			
            var w = $wait();

            $code(

                function () {

					if(skipFunc_)
						return;
				
                    if (win && win.Dialog() && win.OnSave)
                        return win.OnSave(true, true, okClicked_);

                    //Run on close?
                    if (win && win.OnClose) {
                        return win.OnClose();
                    }
                },

                function () {

                    if (win && win.CancelClose()) {
                        win.CancelClose(false);
                        return true;
                    }

					var parentwin = null;
					if (win && win.GetParentWindow())
						parentwin = win.GetParentWindow().ID();
					
                    //Remove the window.
                    if (win)
                        win.Remove();

                    _self.FocusWindow(0);
                    m_selectedWindow = null;
                    _self.Remove(id_);

					if(m_queue.length == 0)
						$("#btnCloseAll").remove();
					
                    //Try to open the next window.
                    if (!skipOpen_) {
                        if (m_queue.length > 0) {
                            if (parentwin) {
                                return _self.Open(parentwin);
                            } else {
                                return _self.Open(m_queue[m_queue.length - 1].ID());
                            }
                        }
                    }
                }
            );

            return w.promise();
        };

        this.FocusWindow = function (id_) {

            if (m_selectedWindow != null) {

                if (m_focusWindow != null)
                    m_focusWindow.Focus(false);

                if (m_selectedWindow.ID() == id_) {
                    m_focusWindow = m_selectedWindow;
                } else {
                    m_focusWindow = m_selectedWindow.GetSubWindow(id_);
                }

                if (m_focusWindow != null) {
                    m_selectedWindow.LastFocus(m_focusWindow.ID());
                    m_focusWindow.Focus(true);
                }
            }
        };

        this.UpdateWindow = function (id_) {

            var win = _self.GetWindow(id_);
            if (!win && m_selectedWindow != null)
                win = m_selectedWindow.GetSubWindow(id_);

            if (win && win.Update)
                Application.RunNext(function () {
                    return win.Update(true, true, true);
                });
        };

        this.PinWindow = function (id_) {            
        };

        this.Error = function (err) {
            if (m_focusWindow != null) {
                if (typeof m_focusWindow.OnError != 'undefined') {
                    m_focusWindow.OnError(err);
                    return true;
                }
            }
            return false;
        };

        this.OpenClick = function (id_) {

            Application.RunNext(function () {
                return _self.Open(id_);
            },null,null,null,true);

        };

        this.CloseClick = function (id_) {

            //Get the window.
            var win = _self.GetWindow(id_);

            //Run before close?
            if (win && win.Save) {
                win.Save();
            }

            Application.RunNext(function () {
                return _self.Close(id_);
            },null,null,null,true);

        };

        this.PreviousWindow = function () {
            if (m_selectedWindow == null)
                return;
            for (var i = 0; i < m_queue.length; i++) {
                if (m_queue[i].ID() == m_selectedWindow.ID()) {
                    if (i > 0) {
                        return m_queue[i - 1];
                    }
                    break;
                }
            }
            return null;
        };

        this.Previous = function () {
            if (_self.PreviousWindow() == null)
                return;
            Application.RunNext(function () {
                return _self.Open(_self.PreviousWindow().ID());
            });
        };

        this.NextWindow = function () {
            if (m_selectedWindow == null)
                return;
            for (var i = 0; i < m_queue.length; i++) {
                if (m_queue[i].ID() == m_selectedWindow.ID()) {
                    if (i != m_queue.length - 1) {
                        return m_queue[i + 1];
                    }
                    break;
                }
            }
            return null;
        };

        this.Next = function () {
            if (_self.NextWindow() == null)
                return;
            Application.RunNext(function () {
                return _self.Open(_self.NextWindow().ID());
            });
        };

        this.OnKeyPress = function (ev) {

            //Ctrl+PageUp.
            if (ev.which == 33 && ev.ctrlKey) {
                _self.Previous();
                ev.preventDefault();
                return false;
            }

            //Ctrl+PageDown.
            if (ev.which == 34 && ev.ctrlKey) {
                _self.Next();
                ev.preventDefault();
                return false;
            }

            //Ctrl+Home.
            if (ev.which == 36 && ev.ctrlKey) {
                if (m_selectedWindow != null) {
                    m_selectedWindow.FocusPrevious();
                }
                ev.preventDefault();
                return false;
            }

            //Ctrl+End.
            if (ev.which == 35 && ev.ctrlKey) {
                if (m_selectedWindow != null) {
                    m_selectedWindow.FocusNext();
                }
                ev.preventDefault();
                return false;
            }

            if (m_focusWindow != null) {
                if (typeof m_focusWindow.OnKeyPress != 'undefined') {
                    return m_focusWindow.OnKeyPress(ev);
                }
            }
        };

        this.ClearLayout = function () {
            if (m_focusWindow != null) {
                m_focusWindow.ClearLayout();
            }
        };

        this.ClearCache = function () {
            if (m_focusWindow != null) {
                m_focusWindow.ClearCache();
            }
        };

        this.GetWindowInfo = function () {

            if (m_focusWindow != null) {
                return m_focusWindow.GetInfo();
            }

            return null;
        };

        this.GetWindowByUID = function (uid_) {
            for (var i = 0; i < m_queue.length; i++) {
                if (m_queue[i].UID() == uid_) {
                    return m_queue[i].ID();
                }
            }
            return -1;
        };

        this.OnSave = function (close, addnew) {

            if (m_focusWindow != null) {

                if (addnew) {

                    var viewer = null;
                    if (m_focusWindow.Options().parentviewer)
                        viewer = m_focusWindow.Options().parentviewer;

                    if (viewer) {
                        setTimeout(function () {
                            Application.RunNext(function () {
                                return viewer.OnNew();
                            });
                        }, 1000);
                    }
                }

                if (m_focusWindow.Dialog()) {
                    if (!close)
                        return m_focusWindow.OnSave(close, true, true);
                    m_focusWindow.HideDialog(true);
                    return;
                    //return m_focusWindow.OnSave(close, true);
                }

                return m_focusWindow.OnSave(close);
            }
        };

        this.HasHome = function (value_) {
            if (value_ !== undefined) {
                m_hasHome = value_;
            } else {
                return m_hasHome;
            }
        };

        this.GetUIDimensions = function () {

            $("#AppWorkspace,#AppSideWorkspace").hide();
            m_uiHeight = GetHeight();
            m_uiWidth = GetWidth();
            m_uiSideWidth = GetSideWidth();
            $("#AppWorkspace").show();
            if (Application.App.SideVisible())
                $("#AppSideWorkspace").show();
        };

        this.Height = function () {            
            return m_uiHeight;
        };

        this.Width = function () {
            return m_uiWidth;
        };

        this.SideWidth = function () {
            return m_uiSideWidth;
        };

        function GetHeight() {

            var padding = 20;

            if ($("#divWarning").is(":visible"))
                padding += $("#divWarning").outerHeight(true);

			if (Application.IsInMobile())
                return $(window).height() - $("#divMobileHeader").outerHeight(true) - 20 - padding;
			
            return ($('#tdMain').innerHeight() - padding);
        };

        function GetWidth() {
            return $("#tdMain").width() - 5;
        };

        function GetSideWidth() {
			
            if (Application.IsInMobile())
                return $("#divFactbox").innerWidth() - 5;

            return $("#tdSide").innerWidth() - 5;
        };

        function ShowScroll() {

            if (!Application.IsInMobile())
                return;

            $(".windows-navigate").remove();
            $("#AppWindows").css("padding-left", "0px").css("padding-right", "0px");

            if ($("#btnCloseAll").length > 0) {

                //Check for a scrollbar.
                if (($("#btnCloseAll").position().left + $("#btnCloseAll").width()) > $("#AppWindows").width()) {
                    $("#tdMain").append("<div class='windows-navigate' style='position: fixed; top: 47px; right: 0px; z-index: 950; background-color: rgb(249, 249, 249); height: 30px; padding-top: 13px;'><img src='%SERVERADDRESS%Images/ActionIcons/navigate_right.png' /></div>");
                    $("#tdMain").append("<div class='windows-navigate' style='position: fixed; top: 47px; left: 5px; z-index: 950; background-color: rgb(249, 249, 249); height: 30px; padding-top: 13px;'><img src='%SERVERADDRESS%Images/ActionIcons/navigate_left.png' /></div>");
                    $("#AppWindows").css("padding-left", "15px").css("padding-right", "15px");
                }
            }
        };

        //#endregion

        //#region Overrideable Methods

        this.OnOpen = function (win) {
        };

        //#endregion

    });

/// <reference path="../Application.js" />

DefineModule("App",

    {

        singleInstance: true,
        requiresVersion: '3.0',
        depends: ['AppUI', 'CookieManager', 'CodeEngine', 'IDEngine', 'UpdateManager'],
        created: new Date(2013, 09, 03),
        version: '1.3',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '03/09/13   PF  Created class.',
            '16/09/13   PF  Added main menu.',
            '26/09/13   PF  Updated language.',
            '10/10/13   PF  Added support for frame version',
            '20/11/13   PF  Added menu favorites.',
            '28/11/13   PF  Fixed login bug.',
            '11/03/14   PF  Removed Control Manager Module'
        ]

    },

    function () {

        //#region Members

        var _self = this;
        var m_params = [];
        var m_timer = null; //Timer
        var m_loaded = false;
        var m_serverInfo = null;
        var m_hideErrors = false;
        var m_sideVisible = true;
        var m_menuVisible = true;
        var m_sessionID = "";
        var m_favorites = new Array();
        var m_popular = new Array();
        var m_mainMenu = null;
        var m_skipHome = false;
        var m_currentMenu = 0;
        var m_lastMenu = null;
        var m_processing = false;
        var m_layout = new Object();
        var m_runningStartup = false;
        var m_maintenanceMode = false;		
        var m_searchQueue = [];
        var m_hideSearch = false;

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            Application.App = this;

            //Backwards compatability
            Application.XpressApp = this;

            if (Application.testMode) return;

            $thread(function () {

                return $codeblock(
                    function () {

                        Application.On("ThreadFailed", function () {
                            Application.Loading.Hide("tdMain");
                        });

                        //Setup the title bar.
                        $("#divTop").css("width", $(window).width());
                        $("#divTop").css("display", "");

                        //Load footer.
                        $("#tdCopyright").text(Application.copyright + '. ' + Application.name + ' v' + Application.version);

                        _self.ToggleSide(false);

                        //Error handling.
                        Application.OnError = _self.Error;

                        //Load params.
                        m_params["title"] = '';
                        m_params["img"] = '';
                        m_params["instance"] = '';
                        m_params["pageid"] = null;
                        m_params["rid"] = null;
                        m_params["frame"] = "false";
                        m_params["initview"] = null;
                        m_params["updates"] = "false";
                        m_params["user"] = null;
                        m_params["pass"] = null;
                        m_params["debug"] = "false";
                        m_params["generate"] = "false";
                        m_params["auth"] = null;
                        m_params["windowsauth"] = "false";
                        m_params["custom"] = null;
                        Application.LoadParams(m_params, PAGE_PARAMETERS);

                        //Check if browser is supported.
                        if (Application.UnsupportedIE(true) && !Application.IsInFrame()) {
                            Application.NavigateToPage(Application.pages.ErrorBrowser);
                            return;
                        }

                        return Application.FireWait("Load", m_params);						
					},
					
					function(){

                        //Set logo.
                        m_params["img"] = decodeURIComponent(m_params["img"]).replace(/\+/g, ' ');
                        $("#imgLogo").attr("src", m_params["img"]);
                        $("#imgHeader").attr("src", m_params["img"]);

                        if (Application.IsInMobile())
                            $("#AppWindows").css("background-color", $("#divContent").parent().css("background-color"));

                        //Set title.
                        m_params["title"] = decodeURIComponent(m_params["title"]).replace(/\+/g, ' ');
                        window.document.title = m_params["title"];
                        if (Application.IsInMobile() && m_params["img"].indexOf("Portrait") == -1)
                            m_params["title"] = '<img src="' + m_params["img"] + '" style="max-height: 20px;" />';
                        $("#windowTitle").html(m_params["title"]);

						//Setup icons.
						$("#menuToggle").attr("class","mdi mdi-arrow-left-drop-circle-outline");
						$("#sideToggle").attr("class","mdi mdi-arrow-right-drop-circle-outline");
						
                        if (Application.IsInMobile()) {

                            $('#lnkMenu .ui-btn-text').text("Menu");
                            $("#lnkMenu").buttonMarkup({ icon: "bars" });
                            $("#lnkMenu").unbind("click");
                            $("#lnkMenu").click(function () {
                                $("#divSideMenu").panel("toggle");
                            });
                            $("#lnkMenu").addClass("app-header-btn");
                        }

                        //Setup tips.
                        if (!Application.IsInMobile()) {
                            $("#menuToggle").qtip({ position: { at: 'bottom right' },
                                content: 'Hide/Show Main Menu',
                                style: { tip: { corner: false} }
                            });
                            $("#sideToggle").qtip({ position: { at: 'bottom left', my: 'bottom right' },
                                content: 'Hide/Show Factbox',
                                style: { tip: { corner: false} }
                            });
                        }

                        //Events.
                        Application.On("Connected", function () {
                            UI.StatusBar(false);
                            if (Application.IsOffline())
                                UI.StatusBar(true, "Offline mode", "#FF6666");
                            $(window).resize();
                        });
                        Application.On("ConnectionLost", function () {
                            if (m_loaded) {
                                UI.StatusBar(true);
                                $(window).resize();
                            }
                        });
                        Application.On("ExecutedWebservice", function (m, success) {
                            if (m == "GetServerInfo")
                                m_processing = false;
                        });

                        var search = $("#txtGlobalSearch");	
						search.on("keyup",function(ev){				
							if(ev.which == 13)
								_self.OnSearch($(this));
                        });						
                        search.on("keyup click",
							app_debouncer(function () {	
								if(arguments[0].which != 13)
									_self.OnSearch($(this));
							},1000)
                        );
						
						$("body").on("click",function(){
							$(".searchdropdown").remove();
							$(".lineactions").animate({
                                top: $(window).height()
                            },null,null,function(){
                                $(".lineactions,.lineactionsoverlay").remove();
                            });	
						});											

                        m_timer = new Timer(10000, _self.OnTimer);

                        if (m_params["debug"] == "true")
                            Application.debugMode = true;

						if (m_params["returnurl"] != null) {
							$("#lnkLogout").html("<i class='mdi mdi-logout'></i> Exit");							
						}
								
                        //Windows auth.
                        if (m_params["windowsauth"] == "true") {
                            return _self.LoginFromWindowsAuth();
                        }

                        //Auto login.
                        if (m_params["user"] != null && m_params["pass"] != null) {
                            $("#txtUsername").val(m_params["user"]);
                            $("#txtPassword").val(m_params["pass"]);
                            return _self.Login();
                        }

                        //Login from secret.
                        if (m_params["auth"] != null) {
                            return _self.LoginFromAppSecret(m_params["auth"].replace(/ /g,"+"));
                        }

						 //Login from token.
                        if (m_params["token"] != null && !Application.IsOffline()) {							
                            return _self.LoginFromToken(m_params["token"]);
                        }
						
                        //Attempt to login from cookie.
						return _self.LoginFromCookie();
                    }
                );
            });
        };

		this.OnSearch = function(search){
			m_searchQueue = [];			
			m_searchQueue.push(search.val());
			Application.RunNext(function () {
				if(m_searchQueue.length == 0)
					return;
				return $codeblock(
					function () {													
						$("#imgGlobalSearch").show();
						var s = m_searchQueue[0];
						m_searchQueue.splice(0,1);
						return Application.Search(s);
					},
					function (ret) {										
						$(".searchdropdown").remove();														
						if(ret.length != 0){											
							var dd = $("<div style='position:absolute; background-color: white; max-width: 400px; border: 1px solid gainsboro; max-height: 400px; overflow-y: auto; z-index: 1001;' class='searchdropdown'>");
							dd.css("width",UI.Width() - 5);
							$("body").append(dd);
							dd.css("top",search.offset().top+40).css("left",search.offset().left);
							for(var i = 0; i < ret.length; i++){
								var item = $("<div style='font-size: 10pt; padding: 5px; border-bottom: 1px solid gainsboro; cursor: pointer;'>"+UI.IconImage(ret[i][2])+" "+ret[i][0]+"</div>");
								dd.append(item);
							var code = 'Application.App.LoadPage("'+ret[i][3]+'","'+ret[i][1]+'",{searchmode:true});';
								if(Default(ret[i][4],"") != "")
									code = ret[i][4].replace(/\&quot\;/g,'"');
								eval('item.on("click",function(){'+code+'m_searchQueue=[];$(".searchdropdown").remove();});');
							}											
						}										
						$("#imgGlobalSearch").hide();
					}
				);
			});
		};
		
		this.UploadExtension = function () {

		    Application.FileDownload.ShowUploadDialog("Upload Extension", function (filename, data) {
		        Application.RunNext(function () {
		            return Application.FileDownload.UploadFile(filename, data, function (file) {

		                var callbacks = new Object();
		                callbacks.onerror = function (e) {
		                    setTimeout(function () {
		                        Application.Error(e);
		                    }, 1000);
		                };
		                callbacks.onsuccess = function (r) {
		                    
		                    setTimeout(function () {

		                        if (r && r.Message)
		                            Application.Error(r.Message);
		                        Application.Message(r);

		                        w.resolve();

		                    }, 1000);
		                };
		                callbacks.onsend = function () { };		                

		                var w = $wait();
		                Application.ExecuteWebService("UploadExtension", { auth: Application.auth, name_: file.Name }, null, true, null, true, callbacks);
		                return w.promise();
		            });
		        });
		    });

		};

        this.UploadObjects = function () {

            Application.FileDownload.ShowUploadDialog("Import Objects", function (filename, data) {
                Application.RunNext(function () {
                    return Application.FileDownload.UploadFile(filename, data, function (file) {

                        var callbacks = new Object();
                        callbacks.onerror = function (e) { 
							setTimeout(function () {                                
								Application.Error(e);
                            }, 1000);
						};
                        callbacks.onsuccess = function (r) {

                            UI.HideServerProgress();
                            setTimeout(function () {

                                if (r && r.Message)
                                    Application.Error(r.Message);
                                Application.Message(r);

                                w.resolve();

                            }, 1000);
                        };
                        callbacks.onsend = function () { };

                        UI.ShowServerProgress();

                        var w = $wait();
                        Application.ExecuteWebService("UploadObjects", { auth: Application.auth, name_: file.Name }, null, true, null, true, callbacks);
                        return w.promise();
                    });
                });
            });

        };

        this.MergeObjects = function () {

            Application.FileDownload.ShowUploadDialog("Upload Zip File", function (filename, data) {
                Application.RunNext(function () {
                    return Application.FileDownload.UploadFile(filename, data, function (file) {

                        Application.RunNext(function () {
                            return $codeblock(
                                function () {
                                    return Application.WebServiceWait("MergeObjects", { auth: Application.auth, name_: file.Name });
                                },
                                function (name) {
                                    window.open('%SERVERADDRESS%File/' + name);
                                }
                            );
                        });
                    });
                });
            });

        };

        this.SplitObjects = function () {

            Application.FileDownload.ShowUploadDialog("Split Objects", function (filename, data) {
                Application.RunNext(function () {
                    return Application.FileDownload.UploadFile(filename, data, function (file) {

                        var callbacks = new Object();
                        callbacks.onerror = function () { };
                        callbacks.onsuccess = function (r) {
                            Application.Message("Done. Please download from the File list");
                            w.resolve();
                        };
                        callbacks.onsend = function () { };

                        var w = $wait();
                        Application.ExecuteWebService("SplitObjects", { auth: Application.auth, name_: file.Name }, null, true, null, true, callbacks);
                        return w.promise();
                    });
                });
            });

        };

        this.StartMaintenanceMode = function () {

            Application.RunNext(function () {

                var options = new OptionsWindow({
                    caption: 'Start Maintenance',
                    fields: [
                        { Name: "Message", Caption: "Message", Type: "Text", Size: 1000, Mandatory: true },
                        { Name: "Time", Caption: "Time", Type: "DateTime", Mandatory: true }
                    ]
                });

                options.CloseFunction(function (okclicked) {
                    if (okclicked) {
                        return Application.StartMaintenanceMode(options.GetOption("Message"),options.GetOption("Time"));
                    }
                });
                return options.Open();

            });
        };

        this.EndMaintenanceMode = function () {
            Application.RunNext(Application.EndMaintenanceMode);
        };        

        this.ExportUserLayout = function (user_) {
            return $codeblock(
                function () {
                    return Application.ExportUserLayout(user_);
                },
                function (name) {
                    window.open('%SERVERADDRESS%File/' + name);
                }
            );
        };

        this.ImportUserLayout = function () {

            Application.FileDownload.ShowUploadDialog("Import User Layout", function (filename, data) {
                Application.RunNext(function () {

                    var options = new OptionsWindow({
                        caption: 'Select a User to Import to',
                        fields: [
                          {
                              Name: "User",
                              Caption: "Username",
                              Type: "Code",
                              LookupTable: "Xpress User",
                              LookupField: "Username",
                              LookupColumns: "Username",
                              LookupColumnCaptions: "Username",
                              Mandatory: true
                          }
                        ]
                    });

                    options.CloseFunction(function (okclicked) {
                        if (okclicked) {
                            return Application.FileDownload.UploadFile(filename, data, function (file) {

                                var callbacks = new Object();
                                callbacks.onerror = function () { };
                                callbacks.onsuccess = function (r) {

                                    UI.HideServerProgress();
                                    setTimeout(function () {

                                        if (r && r.Message)
                                            Application.Error(r.Message);
                                        Application.Message("Imported Successfully");
                                        w.resolve();

                                    }, 1000);
                                };
                                callbacks.onsend = function () { };

                                UI.ShowServerProgress();

                                var w = $wait();
                                Application.ExecuteWebService("ImportUserLayout", { auth: Application.auth, user_: options.GetOption("User"), name_: file.Name }, null, true, null, true, callbacks);
                                return w.promise();
                            });
                        }
                    });
                    return options.Open();
                });
            });

        };

        this.RefreshProfileImages = function () {
            $("#imgProfile").css("background-image","url("+_self.ProfileImageURL()+"?r="+(new Date()).getTime()+")");
        };

        this.LoadProfileImage = function(){

            if (Application.UnsupportedIE() || Application.IsOffline() || Application.restrictedMode)
                return;

            $("#imgProfile").css("background-image","url("+_self.ProfileImageURL()+"?r="+(new Date()).getTime()+")")
            .unbind("click")
            .on("click", function () {
                _self.ProfileImageOnClick();                    
            });

        };
		
		this.ProfileImageOnClick = function(){
			
			_self.LoadPage("Xpress User Card","WHERE(Username=CONST("+Application.auth.Username+"))",{dialog: true});
			
		};

        this.Authorize = function (options_) {

            var w = $wait();

            $code(

                function () {

                    //Show load.
                    Application.Loading.Show("tdMain");
                    m_hideErrors = false;

                    //Create a new auth object.
                    Application.auth = new Application.Objects.AuthInfo();
                    Application.auth.Instance = m_params["instance"];

                    if (options_ != null) {
                        if (options_.type == "Windows") { //Windows Auth.

                            Application.auth.Type = Application.authType.Login;
                            Application.auth.Username = "";
                            Application.auth.Password = "";
                            if (options_.remember == true)
                                Application.auth.Remember = true;

                        } else if (options_.type == "Login") { //Login form.

                            Application.auth.Type = Application.authType.Login;
                            Application.auth.Username = options_.username;
                            Application.auth.Password = options_.password;
                            if (options_.remember == true)
                                Application.auth.Remember = true;

                        } else if (options_.type == "AuthSecret") {

                            Application.auth.Type = Application.authType.Login;
                            Application.auth.AppSecret = options_.secret;
							
						} else if (options_.type == "Token") {

                            Application.auth.Type = Application.authType.Token;
                            Application.auth.AppSecret = options_.token;

						} else if (options_.type == "Tile") { //Login tile.

                            Application.auth.Type = 999;
                            Application.auth.Username = options_.username;
                            Application.auth.Password = options_.passcode;                            
							
                        } else { //Cookie.

                            Application.auth.Type = Application.authType.Cookie;
                            Application.auth.OfflineAuth = options_.offlineAuth;
                        }
                    }

                    return Application.Authorize();
                },

                function (a) {

                    // Liveware 04/03/14 3.2.9.10 AS
                    if (a.SessionID == null) {
                        parent.window.location.reload();
                    }
                    Application.auth = a;
                    m_sessionID = a.SessionID;

                    Application.Fire("Authorized");

                    _self.LoadProfileImage();

                    return Application.GetUserLayout(Application.auth.Username, "MAINMENU");
                },

                function (layout) {

                    if (layout != "") {
                        m_layout = $.parseJSON(layout);
                        m_layout.Favourites = Default(m_layout.Favourites, []);
                        m_layout.Popular = Default(m_layout.Popular, []);
                    }
                    
                }

            );

            return w.promise();

        };

        this.LoadPage = function (id_, view_, options_, parent_, singleThread_, callback_) {

			//Close search.
			m_searchQueue=[];
			$(".searchdropdown").remove();
		
            if (!Application.CheckOfflineObject("PAGE", id_))
                return;

            if (m_params["generate"] == "true")
                return;

            //Open the page viewer.
            Application.RunNext(function () {

                return $codeblock(
                    function () {

                        options_ = Default(options_, new Object());
                        options_.id = id_;
                        view_ = Default(view_, "");
                        if (view_ != "")
                            options_.view = view_;

                        if (parent_ != null) {
                            var win = UI.WindowManager.GetWindow(parent_);
                            if (win)
                                options_.parentwin = win;
                        }

                        var form = new PageViewer(options_);
                        if (parent_ != null) {
                            form.CloseFunction(function () {
                                Application.RunNext(function () {
                                    var win = UI.WindowManager.GetWindow(parent_);
                                    if (win) {
                                        return win.Update(true,true,true);
                                    }
                                }, false, "UPDATEPAGE" + parent_);
                            });
                        }
                        return form.Open();
                    },
					function(form){
						if(callback_)
							callback_(form);							
					}					
                );
            }, null, "LOADPAGE" + id_, null, !singleThread_);

            if (Application.IsInMobile()) {
                $("#divSideMenu,#divFactbox").panel("close");
            }
        };

        this.LoadExternalPage = function (id_, home_) {

            if (!Application.CheckOfflineObject("PAGE", id_))
                return;

            Application.RunNext(function () {

                return $codeblock(

                        function () {
                            return new Page(id_);
                        },

                        function (obj) {

                            if (obj == null) {
                                Application.Error(Application.StrSubstitute("%LANG:ERR_FORMDOESNTEXIST%", id_));
                            }

                            if (obj.AllowExternal == false) {
                                Application.Error(Application.StrSubstitute("%LANG:ERR_NOTEXTERNAL%", id_));
                            }

                            var form = new PageViewer({ id: id_, recid: m_params["rid"], view: m_params["initview"], closebutton: !Application.IsInFrame(), homepage: home_ });
                            return form.Open();
                        }
                );
            },null,null,null,true);
        };

        this.LoadFrame = function () {

            //Load external page or home page.
            if (m_params["pageid"] != null) {
                _self.LoadExternalPage(m_params["pageid"], false);
                UI.WindowManager.HasHome(true);
            }

            $('.main-table').css('padding-top','0px');
            Application.Loading.Hide("tdMain");

            m_loaded = true;

        };

        this.Disconnect = function (clearcookie_) {

            Application.RunNext(function () {

                var w = $wait();

                $code(

                    function () {
                        m_sessionID = "";
                        Application.supressError = true;
                        //Application.auth.Layout = $.toJSON(m_layout); //Save layout.
                        if (!Application.IsOffline() && Application.connected)
                            return Application.Disconnect(true, clearcookie_);
                    },

                    function () {
                        Application.supressError = false;
                        _self.OnLogout();
                    }
                );

                return w.promise();
            });
        };

        this.SideVisible = function () {
            return m_sideVisible;
        };

        this.ToggleMainMenu = function (value_) {

            if (value_ != null)
                m_menuVisible = !value_;

            if (Application.IsInFrame())
                return;
            m_menuVisible = !m_menuVisible;
            SetWidths();
        };

        this.ToggleSide = function (value_) {

            if (Application.IsInMobile())
                return;

            if (value_ != null)
                m_sideVisible = !value_;

            m_sideVisible = !m_sideVisible;
            SetWidths();
        };

        function SetWidths() {

            if (Application.IsInMobile())
                return;

            //Set factbox width.
            if (!m_sideVisible) {
                $("#tdSide").css("min-width", "40px").width("1%").hide();
                $("#tdMain").css("max-width","100vw").width("100%");
                $("#AppSideWorkspace").hide();
            } else {
                $("#tdSide").css("max-width",$(window).width() * .24).css("min-width", "230px").width("24%").show();
                $("#tdMain").css("max-width",$(window).width() * .70).width("70%");
            }

            setTimeout(UI.WindowManager.OnResize, 100);
        };

        this.RememberOnClick = function () {
            if (RememberLogin())
                if (!_self.CheckCookie())
                    RememberLogin(false);
        };

        this.CheckCookie = function () {
            var check = true;
            if (!$moduleloaded('CookieManager'))
                check = false;
            if (check) {
                check = Application.CookieManager.Save('LIVEAPPTESTCOOKIE', 'test', 7);
                if (check) {
                    var cookie = Application.CookieManager.Get('LIVEAPPTESTCOOKIE');
                    check = (cookie != null);
                }
            }
            if (!check)
                Application.Message("%LANG:ERR_NOCOOKIES%");
            return check;
        };

        this.SearchHidden = function(){
            return m_hideSearch;
        };

        this.Params = function () {
            return m_params;
        };

        this.ProfileImageURL = function (user) {
            var url = Application.Fire("GetProfileImageURL", user);
            if (url)
                return url;
            user = Default(user, Application.auth.Username);
            return '%SERVERADDRESS%' + Application.auth.Instance + '/ProfileImage/' + user;
        };

        this.UpdateSolution = function (url_, force_) {
            Application.RunNext(function () {
                Application.Loading.Show("tdMain");
                return $codeblock(
                  function () {
                      Application.Loading.Hide("tdMain");
                      UI.ShowServerProgress();
                      return Application.WebServiceWait((force_ ? "SolutionUpdateForce" : "SolutionUpdate"), { auth: Application.auth, url_: url_ });
                  },
                  function (msg) {
                      Application.Cache.RemoveAll();
                      UI.HideServerProgress();
                      UI.WindowManager.RemoveAll();
                      UI.StatusBar(false);
                      setTimeout(function () {
                          Application.Message(msg);
                      }, 50);
                  }
                );
            });
        };

        this.ShowLoad = function () {
            Application.Loading.Show(Application.IsInMobile() ? "AppWorkspace" : "tdMain");
        };

        this.HideLoad = function () {
            Application.Loading.Hide(Application.IsInMobile() ? "AppWorkspace" : "tdMain");
        };

        this.Loaded = function () {
            return m_loaded;
        };

        this.GetInstance = function () {
            if (Application.auth.Instance == "")
                return m_params["instance"];
            return Application.auth.Instance;
        };

        //#endregion

        //#region Events

        this.Error = function (e) {

            try {

                if (m_hideErrors)
                    return;

                //Hide all throbbers.
                if ($moduleloaded("LoadingManager")) {
                    Application.Loading.Hide("divLogin");
                    Application.Loading.Hide("tdMain");
                }

                //Startup error.
                if (m_runningStartup) {
                    m_runningStartup = false;
                    Application.ShowError(e, function () {
                        Application.RunNext(function () {
                            if (Application.IsInFrame() || Application.restrictedMode) {
                                _self.LoadFrame();
                            } else {
                                return _self.LoadMainMenu();
                            }
                        });
                    });
                    return;
                }

                //Lost connection to server.
                if (typeof e.indexOf != 'undefined') {
                    if (e == "%LANG:SYS_ERR%" ||
                    e.toLowerCase() == "%LANG:SYS_SERVERTOOBUSY%" ||
                    e.toLowerCase() == "%LANG:SYS_INTERNALSERVERERR%" ||
                    e.toLowerCase() == "unknown" ||
                    e.toLowerCase() == "ok" ||
                    e.toLowerCase() == "not found") {
                        Application.connected = false;
                        return;
                    } else if (Application.HasDisconnected(e)) {					
						if (m_params["returnurl"] != null) 
							window.location = m_params["returnurl"]+(Application.IsInMobile() ? "?mobile=true" : "");
                        m_hideErrors = true;
                        if (Application.restrictedMode) {
                            window.location = Application.url + m_params["instance"];
                            return;
                        }
                        Application.ShowError(e, function () {
                            Application.RunSilent(function () {
                                if(Application.serviceWorkerReg){
                                    Application.serviceWorkerReg.update();
                                }
                            });
                            if (e.indexOf("%LANG:ERR_INVREQ%") == -1) {
                                //Auto log in.
                                Application.RunNext(function () {
                                    return _self.LoginFromCookie();
                                });
                            }
                        });
                        _self.OnLogout();
                        return;
                    }
                }

                if ($moduleloaded("WindowManager")) {
                    if (UI.WindowManager.Error(e) == true) {
                        return;
                    }
                }

                Application.ShowError(e, function () {
                    if (typeof e.indexOf != 'undefined') {
                        if (e.indexOf("%LANG:ERR_BADLOGIN%") != -1) {
                            _self.ShowLogin(true);
                            setTimeout(function () { $("#txtUsername").select(); }, 500);
                        }
                    }
                });

                if (!m_loaded) {
                    //m_hideErrors = true;
                    _self.Disconnect();
                    setTimeout(function () { $("#txtUsername").select(); }, 1000);
                    _self.OnLogout();
                    return;
                }

            } catch (err) {
            }
        };

        this.Close = function () {

            try {

                Application.Fire("Exit");

                if (Application.auth.SessionID != "") {
                    //Application.auth.Layout = $.toJSON(m_layout); //Save layout.
                    Application.Disconnect();
                }

            } catch (e) {
            }
            return;
        };

        //#endregion

        //#region Main Menu Functions

        this.AddPopular = function (def_) {

            for (var i = 0; i < m_popular.length; i++) {
                if (m_popular[i].name == def_.name) {
                    m_popular[i].count += 1;
                    _self.RefreshFavorites();
                    return;
                }
            }

            def_.count = 1;
            m_popular.push(def_);
            _self.RefreshFavorites();			
            _self.SavePopular();
        };

        this.RefreshFavorites = function () {

            $(".favoritemenu").remove();

            for (var i = 0; i < m_favorites.length; i++) {
                for (var j = 0; j < m_popular.length; j++) {
                    if (m_popular[j].name == m_favorites[i].name) {
                        m_popular.splice(j, 1);
                        break;
                    }
                }
                if (Application.CheckOfflineObject("PAGE", m_favorites[i].formid)){
                    var li = _self.PrintSideLink(m_mainMenu, m_favorites[i].icon, m_favorites[i].name, m_favorites[i].action, true);
                    li.addClass('favoritemenu');
                }
            }

            if (m_popular.length > 0) {

                m_popular.sort(function (a, b) {
                    if (a.count == b.count)
                        return 0;
                    if (a.count > b.count) {
                        return -1;
                    } else {
                        return 1;
                    }
                });

                var added = false;
                for (var i = 0; (i < m_popular.length && i <= 5); i++) {
                    if (Application.CheckOfflineObject("PAGE", m_popular[i].formid)) {
                        if (!added){
                            var st = _self.PrintSideText(m_mainMenu, UI.IconImage('mdi-star',null,14) + ' <b>Popular</b>', true);
                            st.addClass('favoritemenu');
                        }
                        added = true;
                        var li = _self.PrintSideLink(m_mainMenu, m_popular[i].icon, m_popular[i].name, m_popular[i].action, false, true);
                        li.addClass('favoritemenu');
                    }
                }
                if (added){
                    var li = _self.PrintSideLink(m_mainMenu, 'close', '%LANG:S_CLEARPOPULAR%', "Application.App.ClearPopular();", false, true);
                    li.addClass('favoritemenu');
                }
            }

            _self.RefreshMenu();
        };

        this.RefreshMenu = function () {
        };

        this.LoadMainMenu = function () {

            //Clear menu.
            $("#divSide").html('');

            //Load favorites.
            _self.LoadFavorites();

            //Load popular.
            _self.LoadPopular();

            UI.WindowManager.HasHome(false);

            var w = $wait();

            $code(

				function () {

				    var id = "VP$RoleCenterPage" //Dynamic Virtual Page.

                    var mnu = _self.PrintSideGroup('%LANG:S_MAINMENU%');

				    if (id != 0 && !Application.IsInMobile()) {
                        _self.PrintSideLink(mnu, 'home', "%LANG:S_HOME%", "Application.App.LoadPage('" + id + "',null,{homepage:true});");
                        _self.PrintSideLink(mnu, 'mdi-logout', "Logout", "Application.App.Logout();");
				    }
					
					var mnu2 = Application.Fire("CreateMenu", mnu);		    
					if (mnu2)
					    mnu = mnu2;

                    m_mainMenu = mnu;

                    if (!Application.IsInMobile())
                        _self.RefreshFavorites();

                    if (Application.IsInMobile()) {

                        m_mainMenu.children().first().html(Application.auth.Username).addClass("mnuUser");

                        if(!Application.IsOffline())                        
                            _self.PrintSideLink(mnu, 'key3', (m_params["returnurl"] != null ? 'Exit' : 'Logout'), "Application.App.Logout();");
                    }	

                    //Load external page or home page.
                    if (m_params["pageid"] != null) {

                        if (id != "") {
                            _self.LoadPage(id, null, { homepage: true });
                            UI.WindowManager.HasHome(true);
                        }
                        _self.LoadExternalPage(m_params["pageid"]);

                    } else if (id != "") {
                        _self.LoadPage(id, null, { homepage: true });
                        UI.WindowManager.HasHome(true);
                    }
                },

                Application.LoadMainMenu,

                function (m) {

                    //Load menu groups.
                    for (var i = 0; i < m.length; i++) {

                        var mnu2 = _self.PrintSideGroup(m[i].Name);

                        var added = false;

                        //Load menu items.
                        for (var j = 0; j < m[i].Items.length; j++) {

                            var item = m[i].Items[j];
							
							var skip = false;
							if(Application.IsInMobile() && Application.HasOption(item.Options,"desktoponly"))
								skip = true;
							if(!Application.IsInMobile() && Application.HasOption(item.Options,"mobileonly"))
								skip = true;

                            if (Application.CheckOfflineObject(item.Type, item.ID) && !skip) {
                                added = true;
                                if (item.Icon == "")
                                    item.Icon = "window";
                                _self.PrintSideLink(mnu2, item.Icon,  Application.ProcessCaption(item.Name), "Application.App.LoadPage('" + item.ID + "');", false, false, item.ID);
                            }
                        }

                        if (m[i].Name == "Admin" && !Application.IsOffline() && !Application.IsInMobile()) {
                            added = true;
                            _self.PrintSideLink(mnu2, 'mailbox_empty', 'Send Message', "Application.Notifications.ShowMessageForm();");
                            _self.PrintSideLink(mnu2, 'media_play', 'Start Maintenance', "Application.App.StartMaintenanceMode();");
                            _self.PrintSideLink(mnu2, 'media_stop', 'Finish Maintenance', "Application.App.EndMaintenanceMode();");
                            _self.PrintSideLink(mnu2, 'box_software', 'Update Platform', "Application.RunNext(function(){return Application.UpdateManager.CheckForUpdates(true);});");
                        }

                        if (!added && mnu2)
                            mnu2.remove();
                    }

                    if (!Application.IsInMobile()) {

                        var mnu3 = _self.PrintSideGroup('%LANG:S_TOOLS%', 'mnuTools');
                        _self.PrintSideLink(mnu3, 'document_certificate', '%LANG:S_LINKLICENSE%', "Application.App.LoadPage('VP$LicenseViewer');");
                        if (!Application.IsOffline()) {

                            _self.PrintSideLink(mnu3, 'window_edit', 'Clear Layout', "UI.WindowManager.ClearLayout();");
                            _self.PrintSideLink(mnu3, 'box_next', 'Clear Cache', "UI.WindowManager.ClearCache();");
                            _self.PrintSideLink(mnu3, 'window_edit', 'Split Objects', "Application.App.SplitObjects();");
                            _self.PrintSideLink(mnu3, 'window_edit', 'Merge Objects', "Application.App.MergeObjects();");

                            var mnu4 = _self.PrintSideGroup('%LANG:S_SERVERINFO%', 'mnuServerInfo');
                            $("#mnuMain").append('<li><div id="divServerInfo" style="font-weight: normal; font-size: 12px; padding: 3px; height: auto; width: 200px; overflow-x: auto;"></div></li>');
                        }
                    }
                    m_serverInfo = $("#divServerInfo");

                    Application.Loading.Hide("tdMain");

                    _self.RefreshMenu();

                    //Auto check for updates.
                    if (m_params["updates"].toLowerCase() == "true")
                        Application.RunNext(Application.UpdateManager.CheckForUpdates);

                    Application.Fire("MenuLoaded", m);

                    m_loaded = true;
                }

            );

            return w.promise();
        };

        this.PrintSideGroup = function (name_, id_) {
            Application.LogInfo("Creating menu group: " + name_);
            var li = $('<ul class="menu-items"><li class="menu-item-group">'+name_+'</li></ul>');
            $("#mnuMain").append(li);
            return li;
        };

        this.PrintSideLink = function (mnu_, img_, name_, action_, fav_, pop_, id_) {
            
            Application.LogInfo("Creating menu item: " + name_);

            if (fav_ == null) fav_ = false;
            if (pop_ == null) pop_ = false;

            var image = "";
            if(img_){
                var path = img_.split("/");
                img_ = path[path.length-1];
                img_ = img_.split(".")[0];
                image = "<i class='mdi "+UI.MapMDIcon(UI.MapIcon(img_))+"' style='color: black; font-size: " + 
                    (Application.IsInMobile()?'20':'14')+"px'></i>";
            }

            var li = $('<li onclick="'+action_+'" data-ripple>'+image+
                (Application.IsInMobile()?' ':'&nbsp;&nbsp;')+name_+'</li>');
            if(!Application.IsInMobile()){
                if (!name_.within(["%LANG:S_HOME%", "%LANG:S_OFFLINE%", "%LANG:S_CLEARPOPULAR%"]))
                    li.on('click', function () {
                        _self.AddPopular({
                            id: 1,
                            icon: img_,
                            name: name_,
                            action: action_,
                            formid: id_
                        });
                    });
            }
            mnu_.append(li);
            li.ripple({ color: "gainsboro"});

            var evname = 'contextmenu';
            if (Application.IsInMobile())
                return li;

            if (name_ == "%LANG:S_HOME%" || pop_ || name_ == "%LANG:S_OFFLINE%" || name_ == "%LANG:S_CLEARPOPULAR%") {
                li.bind(evname, function (e) {
                    return false;
                });
                return li;
            }

            li[0].definition = {
                id: 1,
                icon: img_,
                name: name_,
                action: action_,
                formid: id_
            };

            if (!fav_) {
                li.bind(evname, function (e) {

                    for (var i = 0; i < m_favorites.length; i++) {
                        if (m_favorites[i].name == this.definition.name) {
                            return false;
                        }
                    }

                    Application.Confirm("%LANG:S_ADDLINK%", function (r) {
                        if (r == true) {
                            m_favorites.push(li[0].definition);
                            _self.RefreshFavorites();
							_self.SaveFavorites();
                        }
                    }, "Main Menu");
                    return false;
                });
            } else {
                li.bind(evname, function (e) {

                    Application.Confirm("%LANG:S_REMOVELINK%", function (r) {
                        if (r == true) {
                            for (var i = 0; i < m_favorites.length; i++) {
                                if (m_favorites[i].name == li[0].definition.name) {
                                    m_favorites.splice(i, 1);
                                    break;
                                }
                            }
                            _self.RefreshFavorites();
							_self.SaveFavorites();
                        }
                    }, "Main Menu");
                    return false;
                });
            }

            return li;
        };

        this.PrintSideText = function (mnu_, name_, pop_) {
            if (pop_ == null) pop_ = false;
            var li = $('<li class="menu-item-group">'+name_+'</li>');
            mnu_.append(li);
            return li;
        };

        this.SaveLayout = function () {

            Application.RunNext(function () {
                return Application.SaveUserLayout(Application.auth.Username, "MAINMENU", $.toJSON(m_layout));
            },null,null,true);
        };

        this.LoadFavorites = function () {

            m_favorites = new Array();

            if (m_layout && m_layout.Favourites) {
                m_favorites = m_layout.Favourites;
                return;
            }
        };

        this.SaveFavorites = function () {            
            m_layout.Favourites = m_favorites;
            _self.SaveLayout();
        };

        this.LoadPopular = function () {

            m_popular = new Array();

            if (m_layout && m_layout.Popular) {
                m_popular = m_layout.Popular;
                return;
            }
        };

        this.SavePopular = function () {            
            m_layout.Popular = m_popular;
            _self.SaveLayout();
        };

        this.ClearPopular = function () {
            Application.Confirm("%LANG:S_CLEAPPOPCONFIRM%", function (r) {
                if (r) {
                    m_popular = [];
                    _self.SavePopular();
                    _self.RefreshFavorites();
                }
            }, "Main Menu");
        };

        //#endregion

        //#region Login Functions

        this.ShowLogin = function (fromError_, skipFocus_) {

            Application.Loading.Hide("divLogin");

            if (Application.IsInMobile())
                $("#mainPage,.ui-panel-wrapper").css("background-color", $("#divMobileHeader").css("background-color"));

            Application.auth.Type = Application.authType.Login;
            $("#divMobileHeader,#AppWindows").hide();
            $("#divLogin,#imgHeader").show();

            $("#AppWorkspace").css("height","");

            $("#txtUsername, #txtPassword, #chkRemember").unbind("keyup", _self.LoginClick);
            $("#txtUsername, #txtPassword, #chkRemember").keyup(_self.LoginClick);
            
			if(!skipFocus_)
				$("#txtUsername").focus();

            Application.Fire("ShowLogin");
			
			if(Application.IsMobileDisplay()){
				$("#divLogin").css("max-width",$(window).width()-20);
			}

            $(window).resize();
        };

        this.LoginClick = function (ev) {
            if (ev.isDefaultPrevented())
                return;
            if (ev.keyCode == 13 && !UI.DialogVisible()) {
                Application.RunNext(_self.Login);
            }
        };

        this.Login = function () {

            if ($("#txtUsername").val() == "" || $("#txtPassword").val() == "") {

                //Check required fields.
                Application.ShowError("%LANG:S_FIELDSREQUIRED%", function () {
                    if ($("#txtUsername").val() == "")
                        setTimeout(function () { $("#txtUsername").select(); }, 500);
                    else if ($("#txtPassword").val() == "")
                        setTimeout(function () { $("#txtPassword").select(); }, 500);
                });

            } else {

                return $codeblock(

					function(){						
						if($moduleloaded("OfflineManager")){
							Application.auth.Username = $("#txtUsername").val();
							Application.auth.Username = Application.auth.Username.toUpperCase();
							var w = $wait();
							Application.Offline.HasDataPack(function(r){
								if(Application.IsOffline() == false && r){									
									Application.Confirm("You have an offline data package. Please select an option.",function(ret){
										if(ret == false){
											$("#offlineIndicatorText").click();	
											Application.Error("");										
										}else{
											w.resolve();
										}
									},null,"Go online and load the data to the server","Continue to work offline with the current data package")									
								}else{
									w.resolve();
								}	
							});
							return w.promise();												
						}
					},
				
                    function () {

                        return _self.Authorize({
                            type: "Login",
                            username: $("#txtUsername").val(),
                            password: $("#txtPassword").val(),
                            remember: RememberLogin()
                        });
                    },

                    function () {

                        //Clear the password.
                        $("#txtPassword").val("");

                        //Show the app.                        
                        return _self.OnLogin();
                    }
                );
            }

        };

        this.LoginFromCookie = function () {

            //#90 - Rewrite for secure cookies.

            return $codeblock(

                function () {
                    if (Application.IsOffline()) {
                        return true;
                    } else {
						Application.supressServiceErrors = true;
						return Application.LoginCookieExists(_self.GetInstance() + Application.authType.Login);
                    }
                },

                function (ret) {

					Application.supressServiceErrors = false;
				
                    if (ret) {

                        return $codeblock(

                            function () {

                                return _self.Authorize({
                                    type: "Cookie",
                                    offlineAuth: m_params["user"]
                                });
                            },

                            function () {

                                $("#txtUsername").val(Application.auth.Username);

                                //Show the app.                        
                                return _self.OnLogin();
                            }

                        );

                    } else {

                        //Show the login form.
                        _self.ShowLogin();

                    }

                }
            );
        };

        this.LoginFromWindowsAuth = function () {

            if (!Application.IsOffline()) {

                var w = $wait();

                $code(

                    function () {

                        return _self.Authorize({
                            type: "Windows"
                        });
                    },

                    function () {

                        //Show the app.                        
                        return _self.OnLogin();
                    }
                );

                return w.promise();

            } else {

                //Show the login form.
                _self.ShowLogin();
            }

        };

        this.LoginFromAppSecret = function (secret) {

            if (secret && !Application.IsOffline()) {

                var w = $wait();

                $code(

                    function () {

                        return _self.Authorize({
                            type: "AuthSecret",
                            secret: secret
                        });
                    },

                    function () {

                        //Show the app.                        
                        return _self.OnLogin();
                    }
                );

                return w.promise();

            } else {

                //Show the login form.
                _self.ShowLogin();
            }

        };

		this.LoginFromToken = function (token) {

            if (token && !Application.IsOffline()) {

                var w = $wait();

                $code(

                    function () {

                        return _self.Authorize({
                            type: "Token",
                            token: token
                        });
                    },

                    function () {

                        //Show the app.                        
                        return _self.OnLogin();
                    }
                );

                return w.promise();

            } else {

                //Show the login form.
                _self.ShowLogin();
            }

        };

        this.OnLogin = function () {

            //Can be used to hijack session!
            //$("#divStatus").html('%LANG:S_SESSIONID%: ' + Application.auth.SessionID);
            if (!Application.restrictedMode)
                $("#divStatus").html(Application.auth.Username);

            //Start the page timer.
            m_serverInfo = $("#divServerInfo");
            if(m_timer)
            m_timer.Start(true);

            if ($moduleloaded("FileDownloadManager"))
                Application.FileDownload.Start();

            //Show Elements.           
            if (!Application.restrictedMode)
                $("#lnkMenu,#lnkLogout,#sideToggle,#menuToggle,#txtGlobalSearch,#imgProfile,.search-container,#menuMain").show();
            $("#divMobileHeader,#AppWindows").show();

            //Hide Elements.
            Application.Loading.Hide("divLogin");
            $("#divLogin,#divAutoLogin").hide();
            if (Application.IsInMobile())
                $("#imgHeader").hide();

            if (Application.IsInMobile())
                $("#mainPage,.ui-panel-wrapper").css("background-color", '');

            if (!Application.restrictedMode) {

                //Show menu.            
                _self.ToggleMainMenu(true);
                //Hide side.            
                _self.ToggleSide(false);
            }

            Application.Fire("Login");

            return $codeblock(

                function () { //Load startup scripts
                    return $codeblock(
                        function () {

                            m_runningStartup = true;

                            var r = new Record();
                            r.Table = "%DBIDENTIFIER% Object";
                            r.View = "WHERE(Type=CONST(CODE),Startup=CONST(True))";
                            return r.FindFirst();
                        },
                        function (r) {
                            if (r.Count > 0)
                                return $loop(function (i) {
                                    return $codeblock(
                                        function () {
                                            return new CodeModule(r.Name);
                                        },
                                        function (cm) {
                                            if (cm.OnRun)
                                                return cm.OnRun(Application.auth);
                                        },
                                        function () {
                                            if (r.Next())
                                                return $next;
                                        }
                                    );
                                });
                        }
                    );
                },

				function(){
					
					m_runningStartup = false;									
                        
                    if (!Application.IsInFrame())
                        return $codeblock(

                            _self.CheckChangePassword,

                            function(){
                                COUNT("Xpress Global Search Setup",null,function(r){
                                    if(r.Count === 0){
                                        m_hideSearch = true;
                                        $(".search-container").hide();
                                    }
                                });
                            }
                            
                        );
                },

                function(){
                    if($moduleloaded("OfflineManager"))
                        return Application.Offline.LoadDatapack();
                },
				
                function () { //Load the main menu.                      

                    if (Application.IsInFrame() || Application.restrictedMode) {
                        _self.LoadFrame();
                    } else {
                        return _self.LoadMainMenu();
                    }
                }
            );
        };

        //#endregion

        //#region Logout Functions

        this.Logout = function () {

            if (Application.auth.SessionID == "") {
                _self.OnLogout();
                return;
            }

            Application.RunNext(function () {

				var msg = "%LANG:S_LOGOUTPROMPT%";
				if(m_params["returnurl"] != null)
					msg = "Do you want to exit?"
				
                Application.Confirm(msg, function (r) {
                    if (r == true) {
                        if (Application.IsOffline())
                            Application.Offline.RemoveLoginCookie();
                        if (m_params["returnurl"] != null) {
							window.location = m_params["returnurl"]+(Application.IsInMobile() ? "?mobile=true" : "");
						}else{
                            _self.Disconnect(true);
                        }
                    }
                }, "We'll miss you..");

            });
        };

        this.CheckChangePassword = function(){ 
            //Check if password needs changing.
            FINDSET("Xpress User",{Username: Application.auth.Username},function(r){
                if(r["Change Password On Login"]){
                    OPENPAGE("Change User Password", null, {
                        dialog: true
                    });
                }
            });
        };

        this.OnLogout = function () {

            _self.ToggleSide(false);

            if (Application.IsInMobile())
                $("#divSideMenu,#divFactbox").panel("close");

            //Hide menu.
            _self.ToggleMainMenu(true);

            if ($moduleloaded("WindowManager")) {
                UI.WindowManager.RemoveAll();
            }

            Application.Fire("Logout");

            m_loaded = false;

            //Page timer finish.
            if(m_timer)
            m_timer.Stop(true);

            if (m_serverInfo != null) {
                if ($moduleloaded("LoadingManager") && m_serverInfo.length > 0 && !Application.IsInMobile())
                    Application.Loading.Hide(m_serverInfo[0].id);
                m_serverInfo.html('');
            }
            m_serverInfo = null;

            if ($moduleloaded("FileDownloadManager"))
                Application.FileDownload.Finish();

            $("#menuToggle,#sideToggle,#lnkActions,#lnkMenu,#lnkLogout,#divMobileFooter,#txtGlobalSearch,#imgProfile,.search-container,#menuMain").hide();
            UI.StatusBar(false);
            $("#divSide,#divStatus,#tdImg,#mnuMain").html('');
            m_maintenanceMode = false;

            Application.auth = Application.Objects.AuthInfo();

            //Show login.
            _self.ShowLogin(true);
        };

        //#endregion        

        //#region Timer Functions

        this.OnTimer = function () {

            if (Application.IsOffline() || m_processing)
                return;

            var start_time = new Date().getTime();

            if (Application.auth.SessionID != "") {

                if ($moduleloaded("OfflineManager"))
                    if (Application.Offline.DownloadRequest() != null)
                        return;

                m_processing = true;
                Application.ExecuteWebService("GetServerInfo", { auth: Application.auth }, function (r) {                    

                    //Check for new website version.
                    try {
                        if(Application.serviceWorkerReg){
                            Application.serviceWorkerReg.update();
                        }
                    } catch (e) {
                        Application.LogError(e);
                    }

                    if (r == null)
                        return;

                    if (r[2]) {
                        if (!m_maintenanceMode)
                            Application.Message(r[2], null, "Scheduled Maintenance");
                        m_maintenanceMode = true;
                    } else if (m_maintenanceMode) {
                        m_maintenanceMode = false;
                    }

                    //Notifications.
                    if ($moduleloaded("NotificationManager"))
                        Application.Notifications.OnTimer(r[3]);

                    //Print server info.        
                    if (m_serverInfo != null && !Application.IsInFrame()) {
                        _self.PrintServerInfo(r, start_time);
                    }

                }, true, null, true);
            }
        };

        this.PrintServerInfo = function (r, time) {

            var html = "";
            html += '<b>%LANG:S_USER%:</b> ' + Application.auth.Username + "<br/>";
            html += '<b>%LANG:S_LOGINTIME%:</b> ' + $.format.date(Application.auth.LoginTime, 'hh:mm a') + "<br/>";
            html += '<b>%LANG:S_IDLETIME%:</b> ' + r[0] + "<br/>";
            html += _self.PrintServerLoad(r[1], time) + "<br/>";

            var info = UI.WindowManager.GetWindowInfo();
            if (info != null) {
                html += '<br/><b>%LANG:S_PAGEID%:</b> ' + info.ID + "<br/>";
                html += '<b>%LANG:S_VIEW%:</b> ' + info.View + "<br/>";
            }

            m_serverInfo.html(html);
        };

        this.PrintServerLoad = function (str, time) {

            var ms = new Date().getTime() - time;

            if (ms < 0)
                ms = ms * -1;
            var color = "#00CC00";
            var text = "%LANG:S_GOOD%";
            if (ms > 300) {
                color = "#FF9999";
                text = "%LANG:S_BAD%";
            }
            return '<b>%LANG:S_SERVERLOAD%: <span style="color: ' + color + '">' + text + "</span></b>";
        };

        //#endregion

        //#region UI Functions

        this.Height = function () {

            var padding = 0;

            if (Application.IsInFrame()) {
                padding += 30;
            }

            if ($("#divWarning").is(":visible"))
                padding += $("#divWarning").outerHeight();

            return ($('#tdMain').outerHeight() - $("#AppWindows").outerHeight() - 30 - padding);
        };

        this.Width = function () {
            if (Application.IsInFrame()) {
                return $("#AppWorkspace").width() - 15;
            } else {
                return $("#tdMain").width() - 5;
            }
        }

        this.SideWidth = function () {
            return $("#AppSideWorkspace").width() - 5;
        }

        //#endregion                        

        //#region Private Functions        

        function CookieID(extra) {
            extra = Default(extra, "");
            var u = Application.auth.Username.replace("\\", "").replace("/", "");
            return "%APPNAME%" + Application.auth.Instance + u + extra;
        };

        function RememberLogin(value) {

            if (value === undefined) {
                return $("#chkRemember").prop('checked');
            } else {
                $("#chkRemember").prop('checked', value);                
            }
        };

        //#endregion        

    });
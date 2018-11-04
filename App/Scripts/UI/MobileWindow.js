/// <reference path="../Application.js" />

Define("Window", null, function () {

    //#region Members

    var _self = this;
    var m_title = "";
    var m_id = 0;
    var m_uid = "";
    var m_options = null;
    var m_window = null;
    var m_subWindows = [];
    var m_childWindows = [];
    var m_active = false;
    var m_hidden = false;
    var m_visible = false;
    var m_singleColumn = false;
    var m_okClicked = false;
    var m_cancelClose = false;
    var m_spinner = null;
    var m_preLoading = true;
    var m_parentWindow = null;
	var m_state = 0;
    var m_dialog = false;
    var m_boxy = null;
    var m_optionalActions = [];
	var m_tabName = "";

    //#endregion

    //#region Public Methods

    this.Constructor = function () {
    };

    this.Create = function (title_, options_) {

        if (Application.testMode && arguments[0] == null) return;

        //Fix options.
        if (options_ == null) {
            options_ = new Object();
            options_.closebutton = true;
            options_.workspace = null;
            options_.shortcutWorkspace = null;
            options_.position = Application.position.normal;
        }
        if (options_.closebutton == null)
            options_.closebutton = true;

        m_title = title_;
        m_options = options_;

        if (m_options.hidden && m_options.hidden == true)
            m_hidden = true;

        //Generate a new id for the window.
        m_id = $id();

        //Create the window.
        if (m_options.workspace != null) {

            if (m_options.dialog != true) {

				var btnwidth = 84;
                var closebtn = "";
                if (m_options.closebutton == true && m_options.shortcutWorkspace) {
                    closebtn = "<div class='closebutton" + m_id + " app-window-icon'>X</div>";
					btnwidth += 42;
                }

                var title = "";
                var windowclass = "";
				
				var alt = ""
				if(m_options.shortcutWorkspace == null && !m_options.homepage)
					alt = "app-window-title-alt";
				
                if (m_options.editormode == null) {
                    title = "<div class='ui-bar-a xpress-window-title app-window-titlebar title" + m_id + " "+alt+"' style='"+(m_options.removetitle ? 'display: none; ' : '')+"'>" +
                "<div id='title" + m_id + "' class='app-window-title' style='max-width: calc(98% - "+btnwidth+"px);'>" + m_title + "</div>" +
				closebtn + 
				"<div class='maxbutton" + m_id + " app-window-icon'>&#x25B2;</div>" +
				"<div class='refreshpge" + m_id + " app-window-icon'>&#8635;</div>" +
				"<div class='helppge" + m_id + " app-window-icon'>?</div>" +				
                "</div>";
                    if (Application.IsMobileDisplay()) {
                        windowclass = " class='xpress-window ui-corner-all'";
                    } else {
                        windowclass = " class='xpress-window ui-corner-all xpress-window-tablet'";
                    }
                }							

                m_window = $("<div id='" + m_id + "'" + windowclass + ">" + title +
                    "<div id='" + m_id + "actions' class='ui-bar ui-bar-b' style='border-width: 0px; padding: 0px; overflow: visible;'>" +
	                "</div>" +
					"<div id='" + m_id + "toolbar2' style='display: none;'>" +
	                "</div>" +
                    "<div id='" + m_id + "main' class='app-window-main'"+(Application.IsMobileDisplay() ? "style='padding-bottom: 600px;' ": "")+"></div></div>");
                m_options.workspace.append(m_window);
				
				//Window style.
				if (m_options.position == Application.position.right && !Application.IsMobileDisplay()) {
                    m_window.addClass("xpress-window-right");
                } else if (m_options.position == Application.position.block && !Application.IsMobileDisplay()) {
                    m_window.addClass("xpress-window-block");
                } else if (m_options.position == Application.position.rolehalf && !Application.IsMobileDisplay()) {
                    m_window.addClass("xpress-window-rolehalf");
                } else if (m_options.position == Application.position.rolequarter && !Application.IsMobileDisplay()) {
                    m_window.addClass("xpress-window-rolequarter");
                } else {
					m_window.addClass("xpress-window-default");
				}

                if (Application.IsMobileDisplay() && m_options.editormode == null) {
                    m_window.addClass("xpress-window-mobile");										
					m_window.css("max-width",UI.Width()-5);
                    $("#" + m_id + "main").css("padding", "5px").css("text-align", "center");                    
                }

            } else {

				var w = UI.MagicWidth();
				var h = w-50;
				if(Application.IsMobileDisplay())
					h = UI.MagicHeight()-60;
				
                var win = "<div id='" + m_id + "' class='app-dialog' style='" +
					"max-width: "+w+"px;  min-width: "+w+"px; height: " + h + "px; max-height: " + h + "px'>" +
                    "<div id='" + m_id + "actions' class='ui-bar ui-bar-b' style='border-width: 0px; padding: 0px; overflow: visible;'>" +
	                "</div>" +
                    "<div id='" + m_id + "main' style='padding: 10px; "+(Application.IsMobileDisplay() ? "padding-bottom: 600px; ": "")+"'></div><div class='dialog-placeholder' style='height: 1px;'></div> " +
                    "</div>";

                m_boxy = new Boxy(win, {
                    title: "Loading...",
                    closeText: "X",
                    modal: true,
                    unloadOnHide: true,
                    show: false,
                    beforeHide: function (closeclicked) {
                        if (closeclicked)
                            m_okClicked = false;
                        var ret = UI.WindowManager.BeforeClose(m_id, m_okClicked);
                        if (!ret) {
                            m_okClicked = false;
                            return false
                        }
                        Application.RunNext(function () {
                            m_okClicked = false;
                            return UI.WindowManager.Close(m_id, m_options.cancelopenonclose);
                        });
                        return false;
                    }
                });

                m_window = $("#" + m_id);
                $("#okbtn" + m_id).buttonMarkup().click(function () {
                    m_okClicked = true;
                    m_boxy.hide();
                });
                m_dialog = true;

                return this;
            }

            //Create the window shortcut.
            if (m_options.shortcutWorkspace != null) {
                var closebtn2 = "";
                if (m_options.closebutton == true) {
                    //closebtn2 = '<a class="closebutton' + m_id + '" style="color: gray; font-size: 11pt;">x</a>';
                }
                var winbtn = $("<div id='btn" + m_id + "' class='main-windowsbtn ui-page-theme-a ui-btn openbutton" + m_id + " app-window-button' style='display: none;'><table><tr><td id='titleShortcut" + m_id + "' class='unselectable' style='font-weight: normal; font-size: 14px;'>" + m_title + "</td>" +
                    "<td>" + closebtn2 + "</td>" +
                    "</tr></table></div>");
                m_options.shortcutWorkspace.append(winbtn);
                winbtn.slideDown(UI.WindowManager.Count() == 0 ? 0 : 300);


            }

            $('.closebutton' + m_id).on("click", function () {
                $(this).css("color", "Gray");
                setTimeout(function () {
                    $(this).css("color", "");
                }, 100);
                Application.RunNext(function () { return UI.WindowManager.CloseClick(m_id) });
            });

            $('.openbutton' + m_id).on("click", function () {
                UI.WindowManager.OpenClick(m_id);
            });
        }

		$('.refreshpge' + m_id).on("click", function () {
            UI.WindowManager.UpdateWindow(m_id);
        });
		
		$('.maxbutton' + m_id).on("click", function () {
            _self.ToggleState();
        });
		
		_self.HideHelp();
		
        if (m_window) {
            m_window.height('auto');
        } else {
            m_window = $('#nowindow');
        }

        return this;
    };

    this.SetTitle = function (title_) {

        title_ = Default(title_, "");
		
		title_ = Application.ProcessCaption(title_);
		
        m_title = title_.replace('ActionIcon', 'Icon').replace('width:15px;height:15px', 'width:20px;height:20px');

        if (m_options.dialog == true) {
            m_boxy.setTitle(m_title);
            return;
        }

        $("#title" + m_id).html(m_title);
        $("#titleShortcut" + m_id).html(title_);
    };

    this.SetStatus = function (status_) {
    };

    this.Hide = function () {

        if (m_options.dialog == true)
            return;

        m_visible = false;

        $('#' + m_id).css("display", "none");

        $('#btn' + m_id).addClass("app-window-button-inactive").removeClass("app-window-button-active");
        

        for (var i = 0; i < m_subWindows.length; i++) {
            m_subWindows[i].Hide();
        }
    };

    this.TogglePin = function (on_) {
    };

    this.Pin = function () {
		return false;
    };

    this.PinMode = function () {
        return false;
    };

    this.Show = function (w) {

        if (m_options.dialog == true) {
            if (m_boxy.isVisible() == false) {
                m_boxy.center();
                m_boxy.show();                
            }
            return;
        }

		$("#" + m_id + "loader").remove();
        m_preLoading = false;
		
        m_visible = true;

        if (!m_hidden) {
            $('#' + m_id).css("display", "");
        }

        //Only show the sub windows if the main window is visible.
        if (this.Visible()) {
            for (var i = 0; i < m_subWindows.length; i++) {
                $('#' + m_id + "LeftColumn").css("padding-bottom", "0px");
                $('#' + m_id + "RightColumn").css("padding-bottom", "0px");
                w = m_subWindows[i].Show(w);                
            }
        }

        $("#divFactbox").trigger("updatelayout");

        $('#btn' + m_id).scrollintoview();
        $('#btn' + m_id).css("border-color", $("#title" + m_id).parent().css("background-color")).addClass("app-window-button-active").removeClass("app-window-button-inactive");

        if (Application.IsMobileDisplay())
            return;

        this.OnShow();
    };

    this.Remove = function () {

        if (m_options.dialog == true) {
            m_boxy.unload();
            Application.Loading.Hide(m_id);
			 m_parentWindow = null;
			_base = null;
			_self = null;
            return;
        }

        $('#' + m_id).remove();
        $('#btn' + m_id).remove();
		$("#" + m_id + "loader").remove();

        $("#divFooter,divMobileFooter").hide();
        Application.Loading.Hide(m_id);

        for (var i = 0; i < m_subWindows.length; i++) {
            m_subWindows[i].Remove();						
        }
		m_subWindows = [];
		
        for (var i = 0; i < m_childWindows.length; i++) {
            UI.WindowManager.Remove(m_childWindows[i].ID());
            m_childWindows[i].Remove();					
        }
		m_childWindows = [];
		
		m_parentWindow = null;
		_base = null;
		_self = null;
    };

    this.Progress = function () {
    };

    this.PreLoad = function () {
		
		if (m_options.dialog == true)
            return;
		
		if(Application.IsMobileDisplay()){			
			var loader = $("<div id='" + m_id + "loader' style='text-align: center;padding-top: 50%;font-size: 20px;'><img src='%SERVERADDRESS%Images/loader.gif' /> Loading</div>");
			if (m_options.workspace)
				m_options.workspace.append(loader);
			loader.width(UI.Width()-20);
			loader.height(UI.Height());
			return;
		}

        $('#btn' + m_id).addClass("ui-state-hover");
        var loader = $("<div id='" + m_id + "loader' class='xpress-window ui-corner-all xpress-window-tablet' style='max-width: 2000px; width: 10; height: auto; margin-bottom: 5px; margin-right: 5px; background: white; border-width: 4px; font-weight: Normal; display:none;'></div>");
        if (m_options.workspace)
            m_options.workspace.append(loader);

        loader.width(UI.Width()-20);
        loader.height(UI.Height());
        loader.slideDown(300, function () {
            Application.Loading.Show(m_id + 'loader');
        });
    };

    this.AddControl = function (cont) {

        $('#' + m_id + 'main').append(cont);

    };

    this.AddColumns = function () {

        $('#' + m_id + 'main').append("<div id='" + m_id + "LeftColumn' style='width: 47%; display: inline-block; vertical-align: top; padding-bottom: 50px'></div>");
        $('#' + m_id + 'main').append("<div id='" + m_id + "RightColumn' style='width: 47%; display: inline-block; vertical-align: top; padding-left: 6%; padding-bottom: 50px'></div>");
    };

    this.GetColumn = function (left_) {
        if (left_) {            
            return $("#" + m_id + "LeftColumn");
        } else {            
            return $("#" + m_id + "RightColumn");
        }
    };

    this.SingleColumn = function (val) {

        if (val == true) {
            $("#" + m_id + "LeftColumn").css("width", "100%").css("padding-bottom", "");
            $("#" + m_id + "RightColumn").css("width", "100%").css("padding-left", "");
        } else {
            $("#" + m_id + "LeftColumn").css("width", "47%");
            $("#" + m_id + "RightColumn").css("width", "47%");
        }
        m_singleColumn = val;
    };

    this.ShowLoad = function () {        
        Application.Loading.Show(m_id);
    };

    this.HideLoad = function () {        
        Application.Loading.Hide(m_id);
        Application.Loading.Hide("tdMain");
    };

    this.ShowOverlay = function () {
        Application.Loading.ShowOverlay(m_id);
        if (m_state != 0) {
            var overlay = $('#' + m_id + 'Overlay2').children();
            overlay.css("top", "0%");
        }
    };

    this.HideOverlay = function () {
        Application.Loading.HideOverlay(m_id);
        Application.Loading.HideOverlay("tdMain");
    };

    this.Resize = function (w) {

        if (m_options.dialog == true)
            m_boxy.center();

		//Only resize the sub windows if the main window is visible.
        if (this.Visible()) {
            for (var i = 0; i < m_subWindows.length; i++) {
                w = m_subWindows[i].Resize(w);                
            }
        }
		
        return w;
    };

    this.SetHeight = function (val, setmax) {
        $('#' + m_id + 'main').css('min-height', val - this.HeaderHeight());
        if (setmax) {
            $('#' + m_id + 'main').css('max-height', val - this.HeaderHeight());
            $('#' + m_id + 'main').css('overflow-y', 'auto');
        }
    };

    this.ToggleState = function (skipevent) {
        if (m_state == 0) {
			$(".maxbutton" + m_id).html("&#x25BC;");            
            $("#" + m_id + "main,#" + m_id + "actions,#" + m_id + "toolbar2").hide();
            m_state = 1;
        } else {            
			$(".maxbutton" + m_id).html("&#x25B2;");
            $("#" + m_id + "main,#" + m_id + "actions,#" + m_id + "toolbar2").show();
            m_state = 0;
        }
		
		if(!skipevent)
			_self.OnToggle();
    };
	
	this.State = function(){
		return m_state;
	};
	
	this.ShowHelp = function(func){
		$(".helppge" + m_id).show();
		$(".helppge" + m_id).click(func);
    };

	this.HideHelp = function(){
		$(".helppge" + m_id).hide();
    };

	this.ShowExportCSV = function (func) {	    
	};

	this.HideExportCSV = function () {	    
	};
	
    //#endregion

    //#region Sub Window Methods

    this.AddSubWindow = function (win) {

        if (win)
            m_subWindows.push(win);

    };

    this.GetSubWindow = function (id_) {

        for (var i = 0; i < m_subWindows.length; i++) {
            if (m_subWindows[i].ID() == id_) {
                return m_subWindows[i];
            } else {
                var win = m_subWindows[i].GetSubWindow(id_);
                if (win)
                    return win;
            }
        }
        return null;
    };
	
	this.RemoveSubWindow = function (id_) {

        for (var i = 0; i < m_subWindows.length; i++) {
            if (m_subWindows[i].ID() == id_) {
                m_subWindows.splice(i,1);
				return;
            } else {
                m_subWindows[i].RemoveSubWindow(id_);
            }
        }        
    };

    this.AddChildWindow = function (win) {

        if (win) {
            m_childWindows.push(win);
            win.SetParentWindow(_self);
        }
    };
	
	this.RemoveChildWindow = function(id_){
				
		for (var i = 0; i < m_childWindows.length; i++) {
			if (m_childWindows[i].ID() == id_){				
				UI.WindowManager.Remove(m_childWindows[i].ID());
				m_childWindows.splice(i,1);
				return;
			}
		}			
	};

    this.GetChildWindow = function (id_) {

        for (var i = 0; i < m_childWindows.length; i++) {
            if (m_childWindows[i].ID() == id_)
                return m_childWindows[i];
        }
        return null;
    };

    this.GetParentWindow = function () {
        return m_parentWindow;
    };

    this.SetParentWindow = function (win) {
        m_parentWindow = win;
    };

    //#endregion

    //#region Dialog Methods

    this.CenterDialog = function () {
		if(m_boxy)
			m_boxy.center();
    };

    this.HideDialog = function (save_) {
        if (save_)
            m_okClicked = save_;
		if(m_boxy)
			m_boxy.hide();
    };

    this.GetDialog = function () {
        return m_boxy;
    };

    //#endregion

    //#region Action Methods

    this.AddButton = function (name, image, text, func) {

        var id = m_id + "action" + $id();

        var imgcode = ""
        if (image != "") {
            imgcode = UI.IconImage(image) + "&nbsp;"; //Issue #70 - Offline icons
        }
        var $action = $("<div id='" + id + "' class='app-button' style='border-width: 0px; padding: 8px; width: auto; display: inline-block; background: "+$("#" + m_id + "actions").css("background-color")+"'>" + imgcode + text + "</div>");

        $action.click(function () {
            $action.css("background-color", "Gainsboro");
            setTimeout(function () {
                $action.css("background-color", "");
            }, 50);
            func();
        });

        $("#" + m_id + "actions").append($action);
        
        return $action;
    };

    this.ShowActions = function () {
        $("#" + m_id + "actions").show();
    };

    this.HideActions = function () {
        $("#" + m_id + "actions").hide();
    };

    this.AddAdditionalAction = function (name, image, text, func) {
        m_optionalActions.push({ text: text, value: m_optionalActions.length, selected: false, imageSrc: "%SERVERADDRESS%Images/ActionIcons/" + image + ".png", func: func });
    };

    this.LoadedActions = function () {

        if (m_optionalActions.length == 0)
            return;

        var id = $id();
        $("#" + m_id + "actions").append("<select id='" + id + "'></select>");

        $('#' + id).ddslick({
            data: m_optionalActions,
            selectText: "Actions",
            width: 100,
            miniMode: true,
            dropwidth: 200,
            imagePosition: "left",
            onSelected: function (data) {
                $('#' + id).find('.dd-selected').html("Actions");
                data.selectedData.func();
            }
        });

    };

    //#endregion

    //#region Focus Methods

    this.Focus = function (focus_) {
        //Not used in mobile.
    };

    this.FocusNext = function () {
        //Not used in mobile.
    };

    this.FocusPrevious = function () {
        //Not used in mobile.
    };

    //#endregion

    //#region Public Properties

    this.GetSingleColumn = function () {
        return m_singleColumn;
    };

    this.Dialog = function () {
        return m_dialog;
    };

    this.Width = function () {
        return m_window.width();
    };

    this.Height = function () {
        return m_window.outerHeight(true);
    };

    this.InnerWidth = function () {
		var main = this.Main();
        return main.innerWidth();
    };

    this.InnerHeight = function () {
        return this.Height() - this.HeaderHeight();
    };

    this.HeaderHeight = function () {
        return $("#" + m_id + "actions").outerHeight(true) + $("#" + m_id + "toolbar2").outerHeight(true) + $("#" + m_id + "toolbar3").outerHeight(true) + $(".title" + m_id).outerHeight(true);
    };

    this.Active = function () {
        return m_active;
    };

    this.LastFocus = function (value_) {
        return m_id;
    };

    this.Pinned = function (value_) {
		return false;
    };

    this.CancelClose = function (value_) {

        if (value_ !== undefined) {
            m_cancelClose = value_;
        } else {
            return m_cancelClose;
        }
    };

    this.Title = function () {

        return m_title;
    };

    this.Visible = function (value_) {

        if (value_ !== undefined) {
            m_visible = value_;
        } else {
            return m_visible;
        }
    };

    this.Hidden = function () {
        return m_hidden;
    };

    this.ID = function () {
        return m_id;
    };

	this.TabName = function(value_){
		if (value_ !== undefined) { //SET
            m_tabName = value_;
        } else { //GET
            return m_tabName;
        }
	};
	
    this.Position = function () {
        return m_options.position;
    };

    this.UID = function (value_) {
        if (value_ !== undefined) { //SET
            m_uid = value_;
        } else { //GET
            return m_uid;
        }
    };

    this.Toolbar2 = function () {        
        return $("#" + m_id + "toolbar2");
    };

    this.Toolbar3 = function () {
        //Not used in mobile.
        return $('#' + m_id + 'toolbar3');
    };

    this.Main = function () {
        return $('#' + m_id + 'main');
    }

    //#endregion

    //#region Overrideable Methods

    this.OnError = function (e) {
    };

    this.OnResize = function (width, height) {
    };

    this.OnKeyPress = function (ev) {
    };

    this.Save = function () {
    };

    this.OnShow = function () {
    };

    this.OnBeforeClose = function () {
    };

    this.OnClose = function () {
    };

    this.ClearLayout = function () {
    };

    this.ClearCache = function () {
    };

    this.GetInfo = function () {
        return null;
    };

    this.Update = function () {
    };

    this.OnSave = function () {
    };

	this.OnToggle = function(){
	};
	
    //#endregion

    this.Constructor();
});

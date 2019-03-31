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
    var m_lastFocus = 0;
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
		
                var closebtn = "";
                if (m_options.closebutton == true && m_options.shortcutWorkspace && m_options.shortcutWorkspace.length > 0) {
                    closebtn = "<a href='#' class='ui-dialog-titlebar-close ui-corner-all unselectable closebutton" + m_id + "'><span class='ui-icon ui-icon-closethick ui-icon-white'>%LANG:S_CLOSE%</span></a>";
                }

                var pos = 5;

                if (closebtn != "")
                    pos += 25;

                var maxbtn = GenerateIcon("maxbutton" + m_id, "style='right: " + pos + "px;'", "ui-icon-carat-1-n");
                pos += 25;

                var editpge = GenerateIcon("editpge" + m_id, "style='right: " + pos + "px;'", "ui-icon-pencil");
                if (!m_options.editpage)
                    editpge = "";

                if (editpge != "")
                    pos += 25;

                var refreshpge = GenerateIcon("refreshpge" + m_id, "style='right: " + pos + "px;'", " ui-icon-arrowrefresh-1-e");

                pos += 25;
				
                var export_csv = GenerateIcon("exportcsv" + m_id, "style='right: " + pos + "px;'", " ui-icon-calculator");
                if (m_options.type == "List") {
                    pos += 25;
                } else {
                    export_csv = "";
                }

                var helppge = GenerateIcon("helppge" + m_id, "style='right: " + pos + "px;'", " ui-icon-help");				
				
                if (Application.restrictedMode) {
                    export_csv = "";
                    helppge = "";
                    refreshpge = "";
                    editpge = "";
                    maxbtn = "";
                    closebtn = "";
                }

				var alt = ""
				if(m_options.shortcutWorkspace == null && !m_options.homepage)
					alt = "app-window-title-alt";
				
                m_window = $("<div id='" + m_id + "' class='ui-dialog ui-dialog-content ui-widget ui-widget-content ui-corner-all app-window'>" +
                    "<div class='ui-dialog-titlebar ui-widget-header app-window-titlebar ui-helper-clearfix unselectable title" + m_id + " "+alt+"' style='"+(m_options.removetitle ? 'display: none; ' : '')+"'>" +
                    "<span class='ui-dialog-title app-window-title unselectable' id='title" + m_id + "' style='max-width: calc(98% - "+(pos+4)+"px);'>" + m_title + "</span>" +                    
                    export_csv +
                    helppge +
                    refreshpge +
                    editpge +
                    maxbtn +                    
                    closebtn +
                    "<div id='status" + m_id + "' style='color:gray;font-size:10px;float:right;line-height:25px;padding:5px'></div>"+
                    "</div>" +
                    "<div id='" + m_id + "actions' class='ui-widget ui-state-default unselectable' style='border-width: 0px;'>" +
	                "</div>" +
                    "<div id='" + m_id + "toolbar2' style='display: none;'>" +
	                "</div>" +
                    "<div id='" + m_id + "main' class='ui-widget-content app-window-main'></div>" +
                    "<div id='" + m_id + "toolbar3' style='display: none;' class='unselectable'>" +
	                "</div></div>");
                m_options.workspace.append(m_window);
				
				//Window style.
				if (m_options.position == Application.position.right) {
                    m_window.addClass("xpress-window-right");
                } else if (m_options.position == Application.position.block) {
                    m_window.addClass("xpress-window-block");
                } else if (m_options.position == Application.position.rolehalf) {
                    m_window.addClass("xpress-window-rolehalf");
                } else if (m_options.position == Application.position.rolequarter) {
                    m_window.addClass("xpress-window-rolequarter");
                } else {
					m_window.addClass("xpress-window-default");
				}

            } else {

                var win = "<div id='" + m_id + "' class='app-dialog' style='max-height: "+($(window).height()-150)+"px;"+(Application.IsInFrame() ? "max-width: "+($(window).width()-80)+"px;":"")+"'><div id='" + m_id + "actions' class='ui-widget ui-state-default' style='border: 0px;'>" +
	                "</div>" +
                    "<div id='" + m_id + "toolbar2' style='display: none;'>" +
	                "</div>" +
                    "<div id='" + m_id + "main' class='ui-widget-content' style='border-width: 0px; height: 98%; width: 100%;'></div>" +
                    "</div>";

                m_boxy = new Boxy(win, {
                    title: "Loading...",
                    closeText: "X",
                    modal: true,
                    unloadOnHide: true,
                    show: false,
                    beforeHide: function (closeclicked) {
                        if(closeclicked)
                            m_okClicked = false;
                        var ret = UI.WindowManager.BeforeClose(m_id, m_okClicked);
                        if (!ret) {
                            m_okClicked = false;
                            return false
                        }
                        Application.RunNext(function () {
                            var okclicked = m_okClicked;
                            m_okClicked = false;
                            return UI.WindowManager.Close(m_id, m_options.cancelopenonclose,null,okclicked);
                        });                        
                        return false;
                    },
                    toolbar: "<a id='okbtn" + m_id + "' style='float: right; font-size: 11pt; width: 100px; margin: 10px;'>OK</a>"
                });

                m_window = $("#" + m_id);
                $("#okbtn" + m_id).button().click(function () {
                    m_okClicked = true;
                    m_boxy.hide();
                });
                m_dialog = true;

                return this;
            }
        }

        //Create the window shortcut.
        if (m_options.shortcutWorkspace != null) {
            var closebtn2 = "";
            if (m_options.closebutton == true) {
                closebtn2 = "<a href='#' class='ui-dialog-titlebar-close ui-corner-all closebutton" + m_id + "'><span class='ui-icon ui-icon-closethick'>Close</span></a>";
            }
            var winbtn = $("<div id='btn" + m_id + "' class='main-windowsbtn ui-widget ui-state-default app-window-button openbutton" + m_id + "' style='display: none;'><table><tr><td id='titleShortcut" + m_id + "' class='unselectable' style='font-weight: normal; font-size: 14px;'>" + m_title + "</td>" +
        "<td>" + closebtn2 + "</td>" +
        "</tr></table></div>");
            m_options.shortcutWorkspace.append(winbtn);
            winbtn.slideDown(UI.WindowManager.Count() == 0 ? 0 : 300);
        }

        if (!Application.restrictedMode) {

            $('.closebutton' + m_id).on("click", function () {
				setTimeout(function(){
					Application.RunNext(function () { return UI.WindowManager.CloseClick(m_id) });
				},500); //Bug Fix
            });

            $('.openbutton' + m_id).on("click", function () {
                UI.WindowManager.OpenClick(m_id);
            });

            //Min/Max Button
            $('.maxbutton' + m_id).on("click", function () {
                _self.ToggleState();
            });
            $('.title' + m_id).on("dblclick", function () {
                _self.ToggleState();
            });
            $('.maxbutton' + m_id).qtip({
                position: { at: 'bottom right' },
                content: 'Minimize/Maximize the Tab',
                style: { tip: { corner: false } }
            });

            $('#' + m_id).on("click", function () {
                UI.WindowManager.FocusWindow(m_id);
            });

            if (m_options.editpage) {

                $('.editpge' + m_id).qtip({ position: { at: 'bottom right' },
                    content: 'Design ' + m_options.editpage.type.replace("Custom",""),
                    style: { tip: { corner: false} }
                });

                $('.editpge' + m_id).on("click", function () {
                    if (m_options.editpage.type == "Page")
                        Application.App.LoadPage("VP$PageDesigner", "WHERE(Name=CONST(" + m_options.editpage.name + "))", null, m_id);
                    if (m_options.editpage.type == "Table")
                        Application.App.LoadPage("VP$TableDesigner", "WHERE(Name=CONST(" + m_options.editpage.name + "))", null, m_id);
					if (m_options.editpage.type == "PageCustom")
                        Application.App.LoadPage("VP$PageDesignerCustomizer", "WHERE(Name=CONST(" + m_options.editpage.name + "))", null, m_id);
                });
            
            }
        
            $('.refreshpge' + m_id).qtip({ position: { at: 'bottom right' },
                content: 'Refresh Page',
                style: { tip: { corner: false} }
            });

            $('.refreshpge' + m_id).on("click", function () {
                UI.WindowManager.UpdateWindow(m_id);
            });

            _self.HideHelp();
            $('.helppge' + m_id).qtip({
                position: { at: 'bottom right' },
                content: 'Start a Page Tour',
                style: { tip: { corner: false } }
            });

            //Export csv button.      
            if (m_options.type == "List") {
                _self.HideExportCSV();
                $('.exportcsv' + m_id).qtip({
                    position: { at: 'bottom right' },
                    content: 'Export to CSV',
                    style: { tip: { corner: false } }
                });
            }
        }

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
		
        m_title = title_.replace('ActionIcon', 'Icon').replace('width:15px;height:15px', 'width:30px;height:30px');

        if (m_options.dialog == true) {
            m_boxy.setTitle(m_title);
            return;
        }

        $("#title" + m_id).html(m_title);
        $("#titleShortcut" + m_id).html(title_);
    };

    this.SetStatus = function (status_) {

        status_ = Default(status_, "");		
		status_ = Application.ProcessCaption(status_);		        
        $("#status" + m_id).html(status_);
    };

    this.Hide = function () {

        if (m_options.dialog == true)
            return;

        m_visible = false;

        $('#' + m_id).css("display", "none");
        $('#btn' + m_id).removeClass("ui-state-hover").addClass("app-window-button-inactive").removeClass("app-window-button-active");

        //Fix for CIMSability
        $(".dhtmlXTooltip").remove();


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
            $('#' + m_id).css("display", "inline-block");
        }
        $('#btn' + m_id).addClass("ui-state-hover").addClass("app-window-button-active").removeClass("app-window-button-inactive");

        //Only show the sub windows if the main window is visible.
        if (this.Visible()) {
            for (var i = 0; i < m_subWindows.length; i++) {
                w = m_subWindows[i].Show(w);                
            }
        }

        this.OnShow();        

        if (!Application.IsInMobile())
            $("#SideWindows").css("min-height", $("#AppWindows").height());
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

    this.Progress = function (value_) {

        if (m_preLoading) {
            return Application.Loading.Progress(m_id + "loader", value_);
        } else {
            return Application.Loading.Progress(m_id, value_);
        }
    };

    this.PreLoad = function () {

        if (m_options.dialog == true)
            return;

        $('#btn' + m_id).addClass("ui-state-hover");
        var loader = $("<div id='" + m_id + "loader' class='ui-dialog ui-dialog-content ui-widget ui-widget-content ui-corner-all app-preloader'></div>");
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

        $('#' + m_id + 'main').append("<div id='" + m_id + "LeftColumn' style='width: 50%; display: inline-block; vertical-align: top;'></div>");
        $('#' + m_id + 'main').append("<div id='" + m_id + "RightColumn' style='width: 50%; display: inline-block; vertical-align: top;'></div>");
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
            $("#" + m_id + "LeftColumn").css("width", "100%");
            $("#" + m_id + "RightColumn").css("width", "100%");
        } else {
            $("#" + m_id + "LeftColumn").css("width", "50%");
            $("#" + m_id + "RightColumn").css("width", "50%");
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
			$('.maxbutton' + m_id).children(0).removeClass("ui-icon-carat-1-n");
			$('.maxbutton' + m_id).children(0).addClass("ui-icon-carat-1-s");
            $("#" + m_id + "main,#" + m_id + "actions,#" + m_id + "toolbar2,#" + m_id + "toolbar3").hide();
            m_state = 1;
        } else {            
			$('.maxbutton' + m_id).children(0).addClass("ui-icon-carat-1-n");
			$('.maxbutton' + m_id).children(0).removeClass("ui-icon-carat-1-s");
            $("#" + m_id + "main,#" + m_id + "actions,#" + m_id + "toolbar2,#" + m_id + "toolbar3").show();

            //Scroll into view.
            setTimeout(function () {
                var offset = $("#" + m_id).offset().top;
                $('html, body').scrollTop(offset - 60);
            }, 50);

            m_state = 0;
        }		
		_self.OnToggle(skipevent);
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
	    $(".exportcsv" + m_id).show();
	    $(".exportcsv" + m_id).click(func);
	};

	this.HideExportCSV = function () {
	    $(".exportcsv" + m_id).hide();
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
        var $action = $("<button id='" + id + "' class='unselectable app-button' style='border-width: 0px;'>" + imgcode + UI.InputManager.AddKeyBinding(text, id, m_id) + "</button>");

        $action.button().on('mousedown',func);
        $("#" + m_id + "actions").append($action);

        return $action;

    };

    this.ShowActions = function () {
        $("#" + m_id + "actions").show();
    };

    this.HideActions = function () {
        $("#" + m_id + "actions").hide();
    };

    //#endregion

    //#region Focus Methods

    this.Focus = function (focus_) {
        if (m_dialog)
            return;
        if (focus_) {
            m_window.addClass("ui-state-active");
            m_active = true;
        } else {
            m_window.removeClass("ui-state-active");
            m_active = false;
        }
    };

    this.FocusNext = function () {
        if (m_active) {
            if (m_subWindows.length > 0) {
                UI.WindowManager.FocusWindow(m_subWindows[0].ID());
            }
        } else {
            for (var i = 0; i < m_subWindows.length; i++) {
                if (m_subWindows[i].Active()) {
                    if (i != m_subWindows.length - 1) {
                        UI.WindowManager.FocusWindow(m_subWindows[i + 1].ID());
                    }
                    break;
                }
            }
        }
    };

    this.FocusPrevious = function () {
        if (m_active) {
            return;
        } else {
            for (var i = 0; i < m_subWindows.length; i++) {
                if (m_subWindows[i].Active()) {
                    if (i != 0) {
                        UI.WindowManager.FocusWindow(m_subWindows[i - 1].ID());
                    } else {
                        UI.WindowManager.FocusWindow(this.ID());
                    }
                    break;
                }
            }
        }
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

        if (value_ !== undefined) { //SET
            m_lastFocus = value_;
        } else { //GET
            return m_lastFocus;
        }
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
        return $("#" + m_id + "toolbar3");
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

    //#region Private Methods

    function GenerateIcon(id, style, icon) {
        return "<a class='ui-dialog-titlebar-close ui-corner-all unselectable " + id + "'" + style + "><span class='ui-icon " + icon + " ui-icon-white'></span></a>";
    };

    //#endregion

    this.Constructor();
});
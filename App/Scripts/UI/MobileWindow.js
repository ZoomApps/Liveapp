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
    var m_container = null;
    var m_prevContainer = null;
    var m_actionCount = 0;
    var m_moreID = null;
    var m_showMore = false;
    var m_searchShown = false;
    var m_maxActions = 4;

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

                m_window = $("<div id='" + m_id + "' class='window window-width-full' style='" + (m_options.type == "Card" ? "padding: 10px;" : "") + "'>" + 
                    "<div class='title-bar-text unselectable'><span id='title" + m_id + "' class='title unselectable'></span></div>" +
                    "<div id='" + m_id + "toolbar2' style='display: none;'>" +
	                "</div>" +
                    "<div id='" + m_id + "main' class='window-main'></div></div>");

                if(m_options.shortcutWorkspace){

                    var id = m_id+'container';

                    m_options.workspace.append('<div id="'+id+'" class="app-container" style="left: 100vw"><header class="header"> '+
                    '<nav id="'+id+'nav" class="navbar"> <div class="navbar-inner"> '+
                    (m_options.homepage ? '<div id="'+id+'menu" class="menu-icon" data-ripple><i class="mdi mdi-menu" style="font-size: 30px"></i></div>' :
                    '<div id="'+id+'back" class="menu-icon" data-ripple><i class="mdi mdi-keyboard-backspace" style="font-size: 30px"></i></div> ')+
                    '<div id="'+id+'title" class="navbar-brand" style="'+(m_options.homepage ? "text-align: center; width: calc(100vw - 100px);" : "")+''+(Application.IsMobileDisplay() ? "font-size: 14px;" : "")+'"> </div> '+
                    (m_options.homepage && !Application.App.SearchHidden() ? '<div id="'+id+'search" class="menu-icon" style="float: right;" data-ripple><i class="mdi mdi-magnify" style="font-size: 30px"></i></div>' : 
                    '<div id="'+id+'ok" class="menu-icon" style="float: right; display:none;" data-ripple><i class="mdi mdi-check" style="font-size: 30px"></i></div> ')+
                    '</div> </nav> </header> <div id="'+id+'workspace" class="app-main">'+(!m_options.homepage && m_options.type == "Card" ? '<div id="'+id+'placeholder" style="padding-bottom: 600px;"></div>' : '')+' </div>'+
                    '<div id="' + m_id + 'actions" class="actions-bar-bottom hidden"></div></div>');
                                    
                    if(m_options.homepage){                        
                        $('#'+id+'search').ripple().on('click', function(){
                            if(!m_searchShown){
                                var search = $("<input class='navbar-search' style='color: white !important;' placeholder='Search' data-clear-btn='true'></input>");
                                $('#'+id+'title').html("").append(search);
                                search.textinput().on('keyup tap',app_debouncer(function(){
                                    Application.App.OnSearch($(this));
                                },1000)).focus().parent().css({
                                    'background-color': 'transparent',
                                    margin: '0px'
                                }).children().next().addClass("navbar-search");
                            }else{
                                _self.SetTitle(m_title);
                            }
                            m_searchShown = !m_searchShown;
                        });
                        var menushown = false;
                        $('#'+id+'menu').ripple().on('click', function() {
                            menushown = true;
                            $('.menu').show().animate({
                                left: '0px'
                            }, null);
                        });
                        $(window).on('click', function(event) {
                            if(menushown){
                                if (!$(event.target).closest('.menu-icon').length) {
                                    $('.menu').animate({
                                        left: '-300px'
                                    }, null, function() {
                                        $('.menu').hide();
                                        menushown = false;
                                    });
                                    event.preventDefault();
                                    return false;
                                }
                            }
                        });
                    }else{
                        $("#"+id+"back").ripple().click(function(){
                            Application.RunNext(function () { return UI.WindowManager.CloseClick(m_id) });
                        });
                    }

                    m_prevContainer = Default(Application.App.currentContainer,null);
                    Application.App.currentContainer = id;
                    m_container = id;

                    if(Default(m_prevContainer,null) !== null){
                        $("#"+m_prevContainer+"nav,#"+m_prevContainer+"workspace").removeClass("fixed");
                        $("#"+m_prevContainer).animate({
                            left: "-100vw"
                        });
                    }

                    if(m_options.homepage){
                            $("#"+id+"nav,#"+id+"workspace").addClass("fixed");
                            $("#"+id).css({
                                "left": "0px"
                            });
                    }else{
                        $("#"+id).animate({
                            left: "0px"
                        },null,null,function(){
                            $("#"+id+"nav,#"+id+"workspace").addClass("fixed");
                        });
                    }                    
                }

                if(m_options.workspace.attr("id") == "AppWorkspace"){
                    m_options.workspace = $("#"+Application.App.currentContainer+"workspace");
                }
                
                if(m_options.homepage || m_options.type !== "Card"){
                    m_options.workspace.append(m_window);	
                }else{
                    m_window.insertBefore("#"+Application.App.currentContainer+"placeholder");
                }

                _self.SetTitle(m_title);

            } else {
                
                var win = "<div id='" + m_id + "' class='app-dialog' style='width: 100vw; height: calc(100vh - 50px);'>" +
                    "<div id='" + m_id + "main' style='padding: 10px; padding-bottom: 600px;'></div>" +
                    "</div>";

                m_boxy = new Boxy(win, {
                    id: m_id,
                    title: "Loading...",
                    closeText: "<i class='mdi mdi-keyboard-backspace' style='font-size: 30px;'></i>",
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
                            return UI.WindowManager.Close(m_id);
                        });
                        return false;
                    },
                    toolbar: "<div id='" + m_id + "actions' class='actions-bar-bottom' style='bottom: -999px'></div>"
                });

                m_window = $("#" + m_id);
                $("#okbtn" + m_id).ripple().click(function () {
                    m_okClicked = true;
                    m_boxy.hide();
                });
                $("#closebtn" + m_id).ripple().click(function () {
                    m_okClicked = false;
                    m_boxy.hide();
                });
                m_dialog = true;

                return this;
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
		
        m_title = title_;
        if(m_title.indexOf('> ') != -1)
            m_title = m_title.substr(m_title.indexOf('> ')+2);

        if (m_options.dialog == true) {
            m_boxy.setTitle(m_title);
            return;
        }

        $("#"+m_id+"containertitle").html(m_options.homepage ? '<img class="navbar-logo" src="'+Application.App.Params()["img"]+'" />'
             : m_title);

        if(m_options.shortcutWorkspace || m_options.homepage){
            $("#title" + m_id).parent().hide();
        }else{
            $("#title" + m_id).html(m_title);
        }
    };

    this.SetStatus = function (status_) {
    };

    this.Hide = function () {

        if (m_options.dialog == true)
            return;
        
        m_visible = false;

        if(m_options.homepage && m_searchShown){
            m_searchShown = false;
            _self.SetTitle(m_title);
        }
        $("#"+m_id+",#" + m_id + "actions").hide();

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

        if(m_actionCount == (m_maxActions+1) && m_moreID)
            $("#"+m_moreID).remove();

        if(m_actionCount > 0)
            $("#" + m_id + "actions").show().animate({
                bottom: 60 - $("#" + m_id + "actions").height()
            });

		$("#" + m_id + "loader").remove();
        m_preLoading = false;

        $("#" + m_id + "containeroverlay").hide();
		
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

        var DestroyWindow = function(){

            $('#' + m_id).remove();
            $('#btn' + m_id).remove();
            $("#" + m_id + "loader").remove();
            $('#' + m_id + "container").remove();
            $("#" + m_id + "containeroverlay").remove();

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
        }

        if(!m_container){
            DestroyWindow();
        }else{
            if(m_prevContainer){
                $("#"+m_prevContainer+"nav,#"+m_prevContainer+"workspace").removeClass("fixed");
                $("#"+m_prevContainer).animate({
                    left: "0px"
                },null,null,function(){
                    $("#"+m_prevContainer+"nav,#"+m_prevContainer+"workspace").addClass("fixed");
                });  
            }
            _self.HideActions();
            $("#"+m_container+"nav,#"+m_container+"workspace").removeClass("fixed");
            $("#"+m_container).animate({
                left: "100vw"
            },null,null,function(){
                Application.App.currentContainer = m_prevContainer;
                DestroyWindow();
            });
        }
    };

    this.Progress = function (value_) {
        return Application.Loading.Progress(m_id+'container', value_);        
    };

    this.PreLoad = function () {
		
		if (m_options.dialog == true)
            return;				
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
        Application.Loading.Show(m_id+'container');
    };

    this.HideLoad = function () {
        Application.Loading.Hide(m_id+'container');                
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

        if (m_options.dialog == true && Application.IsTabletDisplay())
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
		if(m_boxy && Application.IsTabletDisplay())
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

        m_actionCount += 1;

        if(m_actionCount == m_maxActions)
            _self.AddButton("More","mdi-chevron-right","More");

        var id = m_id + "action" + $id();

        image = "<i class='mdi "+UI.MapMDIcon(UI.MapIcon(image))+"' style='color: white; font-size: 25px'></i>";

        var $action = $("<div id='" + id + "' class='action-button-bottom cut-text' data-ripple>" + image + "<br/>" + text + "</div>");

        if(name == "More" && !func){
            m_moreID = id;
            func = _self.ShowMore;
            $action.ripple({ color: "gainsboro"}).click(func);
        }else{
            $action.ripple({ color: "gainsboro"}).click(function(){
                if(m_showMore)
                    _self.ShowMore();
                func();
            });
        }

        $("#" + m_id + "containerworkspace").css("height","calc(100vh - 110px)");

        $("#" + m_id + "actions").append($action);

        return $action;
    };

    this.ShowMore = function(){
        m_showMore = !m_showMore;
        if(m_showMore){
            $("#" + m_id + "actions").animate({
                bottom: 0
            });
            $("#"+m_moreID).html("<i class='mdi mdi-chevron-left' style='color: white; font-size: 25px'></i><br/>Less");
        }else{
            $("#" + m_id + "actions").animate({
                bottom: 60 - $("#" + m_id + "actions").height()
            });
            $("#"+m_moreID).html("<i class='mdi mdi-chevron-right' style='color: white; font-size: 25px'></i><br/>More");
        }
    }

    this.ShowActions = function () {
        $("#" + m_id + "containerworkspace").css("height","calc(100vh - 110px)");
        $("#" + m_id + "actions").show();
    };

    this.HideActions = function () {
        $("#" + m_id + "containerworkspace").css("height","calc(100vh - 50px)");
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
        var actionheight = $("#" + m_id + "actions").outerHeight(true);
        if(actionheight > 60)
            actionheight = 60;
        return actionheight + $("#" + m_id + "toolbar2").outerHeight(true) + $("#" + m_id + "toolbar3").outerHeight(true) + $(".title" + m_id).outerHeight(true);
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

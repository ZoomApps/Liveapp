/**
 * @typedef PageViewerSettings
 * @type {object}
 * @property {string} [id] Page id to open. 
 * @property {string} [caption] Page viewer caption.
 * @property {string} [view] Default filters. 
 * @property {boolean} [dialog] If `true` opens the page in a dialog window.
 * @property {string} [mode] Open the page in a different mode (ie. New). 
 * @property {number} [height] Set the height of the page in pixels.
 * @property {PageViewer} [parent] Parent page. 
 * @property {PageViewer} [parentwin] Parent window. 
 * @property {Page} [page] Sets the page definition.
 * @property {Table} [table] Sets the table definition.
 * @property {Record} [record] Sets the page record.
 * @property {boolean} [singleColumn] If `true` makes the card page, single column only.
 * @property {boolean} [factbox] Adds the page to the factbox section.
 * @property {boolean} [block] Makes the page half the width of the window.
 * @property {boolean} [cancelopenonclose] Cancel the opening of the parent page after closing this page.
 * @property {Application.position} [position] Set the window position.
 * @property {boolean} [closebutton] If `true` adds a close button to the page.
 * @property {boolean} [homepage] If `true` sets the page to dashboard mode.
 * @property {string} [workspace] Workspace to add the page to.
 * @property {boolean} [editlinemode] If `true` allow row edits in mobile mode.
 * @property {boolean} [removetitle] Removes the page caption.
 * @property {string} [tableid] Table id to open (table viewer only).
 * @property {boolean} [mobilegrideditor] If `true` sets the page to grid editor mode.
 */

/**
 * @description
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * **CONTENTS**
 * - [Description](#description)
 * - [Constructor](#constructor)
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Description
 * 
 * PageViewer Class. 
 * 
 * Open a page to view.
 * 
 * <div style='background: #f9f2f4; padding: 5px'>**NOTE: Methods that return a `JQueryPromise` should be returned into a {@link $codeblock}**</div>
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Constructor
 * 
 * Params:
 * @class PageViewer
 * @global
 * @param {PageViewerSettings} [options_] Page viewer settings.
 * @returns {PageViewer} Returns a new `PageViewer` object.
 */
 Define("PageViewer",

    function (options_) {
        return new Window();
    },

    function (options_) {

        //#region Members

        var _self = this;
        var _base = null;
        var m_id = null;
        var m_ouid = "";
        var m_uid = "";
        var m_loaded = false;
        var m_view = "";
        var m_parent = null; //PageViewer
        var m_openedFrom = null; //PageViewer
        var m_form = null; //Page
        var m_table = null; //Table
        var m_record = null; //Record    
        var m_controls = new Array();
        var m_filterToolbar = null; //FilterToolbar
        var m_tabs = new Array();
        var m_subPages = new Array(); //PageViewer
        var m_closeFunc = null;
        var m_closeAction = null;
        var m_disableKeys = false;
        var m_col = null;
        var m_row = null;
        var m_lastValue = null;
        var m_focusControl = null;
        var m_xFocusControl = null;
        var m_layout = null;
        var m_options = null;
        var m_okClicked = false;
        var m_actionsQueue = 0;
        var m_delete = null;
        var m_customControl = null; //Control
        var m_temp = false;
        var m_tempChanged = false;
        var m_nextPageOptions = null;
        var m_lineEditor = null; //PageViewer
        var m_enableEditMode = false;
        var m_changed = false; //Change tracking.
        var m_designerPages = ["VP$TableDesigner", "VP$PageDesigner", "VP$CodeModuleDesigner"];
        var m_designerPages2 = ["VP$ColumnDesigner", "VP$TableKeysDesigner", "VP$PageFieldsDesigner"];
        var m_designerPages3 = ["VP$PageActionsDesigner", "VP$PageTabsDesigner"];
        var m_comboSelected = false;
		var m_buttons = new Object();
		var m_causedUpdate = null;	
		var m_lineActions = [];
		var m_lastView = null;
        var m_pagingCurrentPage = 1;
        var m_pagingRecordsPerPage = 50;
        var m_pagingNoOfPages = 1;

        //#endregion

        //#region Public Functions

        this.Constructor = function (options_) {

            if (Application.testMode && arguments[0] == null) return;

            //Set the base and get the options.
            _base = Base("PageViewer");
            m_options = options_;

            m_id = Default(m_options.id, null);
            m_view = Default(m_options.view, "");            
            m_parent = m_options.parent;
            m_options.caption = Default(m_options.caption, null);
            m_options.tableid = Default(m_options.tableid, null);
            m_ouid = (m_id || 'VIEWER'+m_options.tableid);
        };

        /**
         * Open the page viewer.
         * @memberof! PageViewer#
         * @returns {JQueryPromise<PageViewer>} Promises to open the page viewer.
         */
        this.Open = function () {

            Application.LogDebug("%LANG:S_OPENPAGEVIEWER%: " + m_id);

            //Check if window is already open.
            var winid = UI.WindowManager.GetWindowByUID(m_id + m_view);
            if (winid != -1 && m_options.dialog != true) { //&& !Application.IsInMobile()) {
                Application.LogDebug("%LANG:S_OPENPREVPAGEVIEWER%: " + winid);
                var win = UI.WindowManager.Open(winid);
                Application.RunNext(win.Update);
                return win;
            }

            var w = $wait();

            $code(

            function () {
                if (m_options.page != null)
                    return m_options.page;
                if (m_id != null)
                    return new Page(m_id);
            },

            function (obj) {

                //Create the window.
                if (obj == null && m_id != null) {
                    Application.Error(Application.StrSubstitute("%LANG:ERR_FORMDOESNTEXIST%", m_id));
                }

                //Save the application form.
                m_form = obj;

                //Table viewer mode.
                if (m_form == null && m_options.tableid != null) {
                    m_id = "VIEWER" + m_options.tableid;
                    m_form = new Page();
                    m_form.SourceID = m_options.tableid;
                    m_form.Icon = "mdi-play";
                    m_form.ShowFilters = true;
                    m_form.ShowSorting = true;
                    m_form.Type = "List";
                    m_form.InsertAllowed = true;
                    m_form.DeleteAllowed = true;
                    m_form.Options = 'recordsperpage:50';                   

                    var act1 = Application.Objects.PageActionInfo();
                    act1.Name = "New";
                    act1.Type = "New";
                    m_form.Actions.push(act1);

                    var act2 = Application.Objects.PageActionInfo();
                    act2.Name = "Delete";
                    act2.Type = "Delete";
                    m_form.Actions.push(act2);

                    var act3 = Application.Objects.PageActionInfo();
                    act3.Name = "Design Table";
                    act3.Type = "Open Page";
                    act3.Image = "mdi-table-edit";
                    act3.ReferencePage = "VP$TableDesigner";
                    act3.ActionView = "WHERE(Name=CONST(" + m_options.tableid + "))";
                    m_form.Actions.push(act3);
                }

                m_pagingRecordsPerPage = +(Application.OptionValue(m_form.Options,'recordsperpage') || m_pagingRecordsPerPage);

                if (m_options.table != null)
                    return m_options.table;

                return new Table(m_form.SourceID);
            },

            function (tbl) {

                //Save the table.
                m_table = tbl;

                //Table viewer mode.
                if (m_options.tableid != null) {
                    for (var i = 0; i < m_table.Columns.length; i++) {
                        var field = Application.Objects.PageFieldInfo();
                        //field.ID = i + 1;
                        field.Name = m_table.Columns[i].Name;
                        field.Caption = m_table.Columns[i].Caption;
                        if (m_table.Columns[i].FlowField == "" && m_table.Columns[i].Formula == "" && m_table.Columns[i].Identity == false) {
                            field.Editable = true;
                            //field.Validate = true;
                        }
                        field.Type = m_table.Columns[i].Type;
                        field.Width = 100;
                        m_form.Fields.push(field);
                    }
                }

                //Merge fields.
                for (var i = 0; i < m_table.Columns.length; i++) {
                    for (var j = 0; j < m_form.Fields.length; j++) {
                        if (m_form.Fields[j].Name == m_table.Columns[i].Name) {
                            m_form.Fields[j].LookupTable = m_table.Columns[i].LookupTable;
                            m_form.Fields[j].LookupField = m_table.Columns[i].LookupField;
                            m_form.Fields[j].LookupDisplayField = m_table.Columns[i].LookupDisplayField;
                            m_form.Fields[j].LookupCategoryField = m_table.Columns[i].LookupCategoryField;
                            m_form.Fields[j].LookupFilters = m_table.Columns[i].LookupFilters;
                            m_form.Fields[j].LookupColumns = m_table.Columns[i].LookupColumns;
                            m_form.Fields[j].LookupColumnCaptions = m_table.Columns[i].LookupColumnCaptions;
                            m_form.Fields[j].LookupAdvanced = m_table.Columns[i].LookupAdvanced;
                            m_form.Fields[j].OptionCaption = m_table.Columns[i].OptionCaption;
                            m_form.Fields[j].OptionString = m_table.Columns[i].OptionString;
                            m_form.Fields[j].Size = m_table.Columns[i].Size;
                            if (m_form.Fields[j].Size == 0)
                                m_form.Fields[j].Size = 1000000;
                            if (m_form.Fields[j].OptionCaption != "" && m_form.Fields[j].OptionString == "") {
                                var capts = m_form.Fields[j].OptionCaption.split(",");
                                for (var k = 0; k < capts.length; k++) {
                                    if (m_form.Fields[j].OptionString == "") {
                                        m_form.Fields[j].OptionString = k + "";
                                    } else {
                                        m_form.Fields[j].OptionString += "," + k;
                                    }
                                }
                            }

                            if(m_form.Fields[j].OptionCaption)
                                m_form.Fields[j].OptionCaption = Application.ProcessCaption(m_form.Fields[j].OptionCaption);

                            m_form.Fields[j].FlowField = m_table.Columns[i].FlowField;

                            if (m_table.Columns[i].Options != null && m_table.Columns[i].Options != '') {
                                if (m_form.Fields[j].Options == null || m_form.Fields[j].Options == "") {
                                    m_form.Fields[j].Options = m_table.Columns[i].Options;
                                } else {
                                    m_form.Fields[j].Options += ";" + m_table.Columns[i].Options;
                                }
                            }
                            break;
                        }
                    }
                }
				
				//Bug fix.
				for (var j = 0; j < m_form.Fields.length; j++) {
					
					m_form.Fields[j].Caption = Application.ProcessCaption(m_form.Fields[j].Caption);
					
					if(typeof m_form.Fields[j].LookupTable == "undefined"){
						m_form.Fields[j].LookupTable = "";
						m_form.Fields[j].LookupField = "";
						m_form.Fields[j].LookupDisplayField = "";
						m_form.Fields[j].LookupCategoryField = "";
						m_form.Fields[j].LookupFilters = "";
						m_form.Fields[j].LookupColumns = "";
						m_form.Fields[j].LookupColumnCaptions = "";
						m_form.Fields[j].LookupAdvanced = "";
						m_form.Fields[j].OptionCaption = "";
						m_form.Fields[j].OptionString = "";
						m_form.Fields[j].Size = 1000000;
					}
                }
                
                if(Application.IsInMobile() && !m_options.homepage)
                    return $codeblock(
                        function(){
                            if(m_form.TabList.length > 0)
                                return $loop(function(i){
                                    return $codeblock(
                                        function(){
                                            var tab = m_form.TabList[i];
                                            if (tab.ID != "" && !Application.HasOption(tab.Options, "desktoponly") && (!Application.IsOffline() || !Application.HasOption(tab.Options, "onlineonly"))) {
                                                return $codeblock(
                                                    function(){
                                                        return new Page(tab.ID);
                                                    },
                                                    function(pge){
                                                        var act = new Application.Objects.PageActionInfo();
                                                        act.Name = tab.Name;
                                                        act.Type = "Open Page";
                                                        act.ReferencePage = tab.ID;
                                                        act.ActionView = tab.View;
                                                        act.Image = pge.Icon;
                                                        act.Sort = 2;
                                                        if(m_form.Type == "List")
                                                            act.Options = "lineaction";
                                                        m_form.Actions.push(act);
                                                    }
                                                );
                                            }
                                        },
                                        function(){
                                            if(i < m_form.TabList.length - 1)
                                                return $next;
                                            for(var j = 0; j < m_form.TabList.length; j++){
                                                if(m_form.TabList[j].ID != ''){
                                                    m_form.TabList.splice(j, 1);
                                                    j -= 1;
                                                }
                                            }
                                            for(var j = 0; j < m_form.Actions.length; j++){
                                                var sort = Application.OptionValue(m_form.Actions[j].Options,'sort');
                                                if(sort)
                                                    sort = +sort;
                                                if(m_form.Actions[j].Type == "New")
                                                    m_form.Actions[j].Sort = 1;
                                                if(m_form.Actions[j].Type == "Delete")
                                                    m_form.Actions[j].Sort = 4;
                                                if(!m_form.Actions[j].Sort)
                                                    m_form.Actions[j].Sort = sort || 3;
                                            }
                                            m_form.Actions.sort(function (a, b) {
                                                if (a.Sort == b.Sort)
                                                    return 0;
                                                if (a.Sort > b.Sort) {
                                                    return 1;
                                                } else {
                                                    return -1;
                                                }
                                            });
                                        }
                                    );
                                });
                        },
                        function(){
                            return Application.FireWait("PageFetch", m_form);
                        }
                    );

                return Application.FireWait("PageFetch", m_form); //Issue #83 - Add event to manipulate page before load.
            },

            function () {

                if (m_form.Icon == "") {
                    m_form.Icon = "window";
                }                

                m_uid = m_id + m_view;

                //Initialize the form view.
                if (m_view == null || m_view == "") {
                    m_view = m_form.View;
                }
                m_form.View = Default(m_form.View, "");
                m_view = Default(m_view, "");

                //Load the layout.
                return _self.LoadLayout();
            },

            function () {

                //#100 - Check fields on open.
				if(Application.HasOption(m_form.Options,"skipfieldcheck") == false)
					for (var i = 0; i < m_form.Fields.length; i++) {
						var c = m_table.Column(m_form.Fields[i].Name);
						if (!c)
							Application.Error("Field " + m_form.Fields[i].Name + " does not exist in Table "+m_table.Name);
                }
			
                m_form.View = Application.CombineViews(m_form.View, m_view);
                m_view = m_form.View;

                if (
                    (m_form.Type == "Card" && Application.IsInMobile()) ||
                    (m_options.mobilegrideditor != null) ||
                    m_options.dialog == true ||
                    m_form.CloseAction != null ||
                    Application.HasOption(m_form.Options, "temp")
                )
                    m_temp = true;

				if(Application.HasOption(m_form.Options, "nottemp"))
					m_temp = false;
					
                if (m_options.record != null)
                    m_options.record.Temp = m_temp;

                if (m_options.caption != null) {
                    m_form.Caption = m_options.caption;
                }
                m_options.caption = m_form.Caption;
                m_form.Caption = "Loading...";

                var clsebtn = true;
                if (m_options.closebutton == false) clsebtn = false;

                var pos = Application.position.normal;
                if (m_options.factbox && !Application.IsInMobile())
                    pos = Application.position.right;
                if (m_options.block == true)
					if (!Application.IsInMobile())
						pos = Application.position.block;
                if (m_options.position != null) {
                    pos = m_options.position;
                }

                var diag = false;
                if(m_form.Option("dialog"))
                    m_options.dialog = true;
                //if (Application.IsInMobile())
                //    m_options.dialog = false;
                if (m_options.dialog == true)
                    diag = true;

                //Apply form options.
                if (m_form.Option("singleColumn") || Application.IsInMobile())
                    m_options.singleColumn = true;

                if(m_form.Option("cancelopenonclose"))
                    m_options.cancelopenonclose = true;

                //Tabname
                if (m_options.tabname == null && Application.IsInMobile())
                    m_options.tabname = "";

                var editpage = null;
                if (m_form.GetAction("Design Page") != null)
                    editpage = { type: "Page", name: m_form.Name };
                if (m_form.GetAction("Design Table") != null)
                    editpage = { type: "Table", name: m_options.tableid };
				if (m_form.GetAction("Customize Page") != null)
                    editpage = { type: "PageCustom", name: m_form.Name };
		    
                //Create the window.
                if (m_options.workspace != null) {
                    _base.Create(UI.IconImage(m_form.Icon) + ' ' + m_form.Caption, {
                        closebutton: clsebtn,
                        workspace: m_options.workspace,
                        shortcutWorkspace: null,
                        hidden: m_form.Fields.length == 0,
                        position: pos,
                        dialog: diag,
                        editpage: editpage,
                        editormode: m_options.editlinemode,
						removetitle: m_options.removetitle,
                        type: m_form.Type,
                        homepage: m_options.homepage,
                        windowid: m_options.windowid,                        
                        showtitles: m_options.showtitles,
                        cancelopenonclose: m_options.cancelopenonclose
                    });
                } else if (m_parent == null) {
                    _base.Create(UI.IconImage(m_form.Icon) + ' ' + m_form.Caption, {
                        closebutton: clsebtn,
                        workspace: $("#AppWorkspace"),
                        shortcutWorkspace: $("#AppWindows"),
                        hidden: m_form.Fields.length == 0,
                        position: pos,
                        dialog: diag,
                        editpage: editpage,
                        editormode: m_options.editlinemode,
						removetitle: m_options.removetitle,
                        type: m_form.Type,
                        homepage: m_options.homepage,
                        showtitles: m_options.showtitles,
                        cancelopenonclose: m_options.cancelopenonclose
                    });
                } else {

                    var workspace = "#AppWorkspace";
                    if (m_options && m_options.factbox == true && !Application.IsInMobile())
                        workspace = "#AppSideWorkspace";

                    _base.Create(UI.IconImage(m_form.Icon) + ' ' + m_form.Caption, {
                        closebutton: false,
                        workspace: m_parent.Options().workspace || $(workspace),
                        shortcutWorkspace: null,
                        hidden: m_form.Fields.length == 0,
                        position: pos,
                        dialog: diag,
                        editpage: editpage,
                        editormode: m_options.editlinemode,
						removetitle: m_options.removetitle,
                        type: m_form.Type,
                        homepage: m_options.homepage,
                        showtitles: m_options.showtitles,
                        cancelopenonclose: m_options.cancelopenonclose
                    });
                }
                
                Application.Fire("WindowCreated", _self);

				//Removed as jquery widgets trigger this
				if(Application.IsInMobile() && window.history && window.history.pushState && (diag || m_parent == null))
				    window.history.pushState({ windowid: _base.ID() }, window.title);
				
                if (m_form.Type == "List" && Default(m_form.CustomControl,"") == "")
                    _base.ShowExportCSV(_self.ExportCSV);

				_base.OnToggle = _self.OnToggle;

                _self.UpdateCaption();

                //Set close action.                
                if (m_form.CloseAction && !m_form.CustomControl && (m_options.dialog != true || Application.IsInMobile()))
                    _self.CreateOKButton();
                m_closeAction = function () {
                    return $codeblock(
                        function () {

                            if (!Application.HasOption(m_form.Options, "temp")) {

                                if (m_loaded && !_base.Visible()) //Show window (incase close all is called)
                                    UI.WindowManager.Open(_base.ID());

                                var w = $wait();
								
								var unsaved = false;
								if((m_record && m_record.UnsavedChanges() && m_record.Count > 0) || m_changed == true)
									unsaved = true;
								for(var i = 0; i < m_subPages.length; i++){
									var rec = m_subPages[i].Record();
									if((rec && rec.UnsavedChanges() && rec.Count > 0) || m_subPages[i].Changed() == true)
										unsaved = true;
								}

                                if (m_tempChanged == true) {

                                    //Changes need saving.
                                    Application.Confirm("You have unsaved changes. Do you wish to save?", function (r) {

                                        if (r) {

                                            //Save the page and close.
                                            Application.RunNext(function () {
                                                if (_base.Dialog()) {
                                                    _base.HideDialog(true);
                                                } else {
                                                    m_okClicked = true;
                                                    return _self.OnSave(true);
                                                }
                                            });

                                            //Cancel this close.
                                            _base.CancelClose(true);
                                            _self.HideLoad();
                                            w.resolve(false);

                                        } else {

                                            //Continue with the close.
                                            w.resolve(true);

                                        }
                                    }, "Save changes?","Yes","No");

                                } else if (unsaved) {

                                    //Record not filled out yet...
                                    Application.Confirm("Your changes have not been saved. Close anyway?", function (r) {
                                        if (!r) {
                                            _base.CancelClose(true);
                                            _self.HideLoad();
                                        }
                                        w.resolve(r);
                                    }, (m_changed ? "Don't leave yet..." : "Mandatory Fields Required"));
                                } else {
                                    return true;
                                }

                                return w.promise();
                            }
                            return true;
                        },
                        function (r) {
                            if (!m_okClicked && !m_form.RunFunctionOnCancel)
                                return;
                            if (r && m_form.CloseAction)
                                return _self.RunAction(m_form.CloseAction.Name, true);
                        }
                    );
                };

                //Add the window to the manager and open it.                
                if (m_parent == null) {
                    UI.WindowManager.Add(_self);
                    UI.WindowManager.PreLoad(_base.ID());
                } else {
                    if (m_options.mobilegrideditor == null)
                        m_parent.AddSubpage(_self);
                    _base.Hide();
                }

                //Set the window UID.
                _base.UID(m_uid);

                if (m_options.parentwin != null) {
                    m_openedFrom = m_options.parentwin;
                    if(m_openedFrom.AddChildWindow)
                        m_openedFrom.AddChildWindow(_base);
                }

                //Show filters?
                if (m_form.Type != "List")
                    m_form.ShowFilters = false;
                if (m_form.ShowFilters && m_form.Fields.length > 0) {
                    m_filterToolbar = new FilterToolbar(_self);
                    m_filterToolbar.Create(_base, m_form, m_table);
                }

                _base.ShowLoad();

                _base.Progress(0);

                //Form actions.                
                var added = false;                
                for (var i = 0; i < m_form.Actions.length; i++) {

                    var action = m_form.Actions[i];

                    var skip = false;
                    if (_self.ReadOnly() && (action.Type == "New" || action.Type == "Delete"))
                        skip = true;

                    if (Application.HasOption(action.Options, "desktoponly") && Application.IsInMobile())
                        skip = true;

                    if (Application.HasOption(action.Options, "mobileonly") && !Application.IsInMobile())
                        skip = true;

                    if (Application.HasOption(action.Options, "onlineonly") && Application.IsOffline())
                        skip = true;

                    if (Application.HasOption(action.Options, "offlineonly") && !Application.IsOffline())
                        skip = true;

                    if (m_options.tabname != null && m_options.tabname != "")
                        skip = true;

                    if (m_options.mobilegrideditor != null)
                        skip = true;

                    if (action.Name.within(["Design Page", "Design Table", "Customize Page"]) && (!Application.IsInMobile() || Application.IsMobileDisplay()))
                        skip = true;

                    if (action.Name != "" && !skip) {

                        var func;
                        eval("func = function runAction() {Application.RunNext(function () {return _self.RunAction('" + action.Name + "',true);},null,'ACTION" + action.Name + "');}");

                        if (action.Type == "New")
                            action.Image = "document_new";
                        if (action.Type == "Delete")
                            action.Image = "delete";
                        if (action.Type == "Filters")
                            action.Image = "row_add";
                        if (action.Type == "Refresh")
                            action.Image = "refresh";
                        if (action.Image == "")
                            action.Image = "nav_plain_blue";

						if(Application.IsInMobile() && Application.HasOption(action.Options,"lineaction")){
							
							m_lineActions.push(action);
							
						}else{
						
                            var btn = _base.AddButton(action.Name, action.Image, Application.ProcessCaption(action.Name), func);                            
                            m_buttons[action.Name] = btn;                            
							added = true;
						
						}
                    }
                }

                if (Application.IsInMobile()) {
                    _base.LoadedActions();
                    var children = $('#'+_base.ID()+'actions').children();
                    if(children.length <= 3)
                        $.each(children,function(index,val){
                            $(val).css('width',children.length <= 2 ? '50vw' : '32vw');
                        });
                }                

                //Add special mobile actions.
                if (!m_form.CustomControl || m_form.CustomControl == "") {

                    if (Application.IsInMobile() && m_form.Type == "List" && !m_form.Option("noedit") && !_self.ReadOnly()) {
                        for (var i = 0; i < m_form.Fields.length; i++) {
                            if (m_form.Fields[i].Editable == true && (!Application.HasOption(m_form.Fields[i].Options,"desktoponly") || !Application.IsInMobile()) && (!Application.HasOption(m_form.Fields[i].Options,"mobileonly") || Application.IsInMobile())) {
                                m_enableEditMode = true;
                                break;
                            }
                        }
                    }
                }

                if (!added)
                    _base.HideActions();
            },

            function () {

                //Readonly?
                if (_self.ReadOnly()) {
                    for (var i = 0; i < m_form.Fields.length; i++) {
                        m_form.Fields[i].Editable = false;
                    }
                }

                //Load the page.
                return _self.Load();
            },
			
			function(){
				return Application.TourManager.CheckTour(_self);
			},
			
			function(ret){
				if(ret){
					var win = _base;
					if(m_form.Fields.length == 0 && m_subPages.length > 0)
						win = m_subPages[0];
					win.ShowHelp(function(){
						Application.RunNext(function(){
							Application.TourManager.RunTour(_self);
						});
					});				
				}else{
					_base.HideHelp();
				}
				
				//Load toggle state
				if((m_layout && m_layout.state && m_layout.state > 0) || m_options.minimized)
					_base.ToggleState(true);
				
				return _self;
			}

        );

            return w.promise();

        };

        /**
         * Load the page viewer.
         * @memberof! PageViewer#
         * @protected
         * @returns {JQueryPromise} Promises to load the page viewer.
         */
        this.Load = function () {

            Application.LogDebug("%LANG:S_LOADINGPAGE%: " + m_id);

            var w = $wait();

            $code(

                function () {

                    if (m_options.record != null)
                        return m_options.record;

                    //Create a record set for this page.
                    return new Record(m_form.SourceID);
                },

                function (r) {

                    m_record = r;
                    m_record.Temp = m_temp;

                    //Add mandatory fields.
                    for (var i = 0; i < m_form.Fields.length; i++) {
                        if (m_form.Fields[i].Mandatory)
                            m_record.AddMandatoryField(m_form.Fields[i].Name);
                    }

                    //Load page columns only.
                    if (m_form.Option("loadColumnsOnly")){
                        for (var i = 0; i < m_form.Fields.length; i++) {                                                        
                            m_record.AddLookupField(m_form.Fields[i].Name);
                        }
                        //Add primary keys if they aren't on the page.
                        if(m_record.DatabaseTable()){
                            for (var i = 0; i < m_record.DatabaseTable().Columns.length; i++) {
                                var col = m_record.DatabaseTable().Columns[i];
                                if(col.PrimaryKey && m_form.GetField(col.Name) === null)
                                    m_record.AddLookupField(col.Name);
                            }
                        }
                    }

                    //Set the view.                                
                    m_record.View = m_view;

                    //Retrieve filters.
                    if ((m_form.ShowFilters || m_form.Option('savefilters')) && m_layout && m_layout.Filters && !Application.IsInMobile() && !Application.HasOption(m_form.Options,"clearfilters") && !m_options.searchmode) {
                        for (var i in m_layout.Filters) {
							if(m_layout.Filters[i] != null)
								m_record.Filter(i, m_layout.Filters[i]);
                        }
                    }                                           

                    //Load the form.
                    if (m_form.CustomControl && m_form.CustomControl != "") {

                        eval("m_customControl = new " + m_form.CustomControl + "(null, _self);");
                        m_controls.push(m_customControl);

                        m_customControl.View = _self.View;
                        m_customControl.MergeView = _self.MergeView;
                        m_customControl.FocusControl = _self.FocusControl;
                        m_customControl.XFocusControl = _self.XFocusControl;
                        m_customControl.Page = _self.Page;
                        m_customControl.Type = _self.Type;
                        m_customControl.AddChildWindow = _self.AddChildWindow;

                        if (Application.IsInMobile()) {
                            return m_customControl.CreateMobile(_base, m_form);
                        } else {
                            return m_customControl.CreateDesktop(_base, m_form);
                        }
                    }
                    if (m_form.Type == "Card") {
                        return _self.LoadCardForm();
                    } else {
                        return _self.LoadListForm();
                    }
                },

                function () {

                    //Hide additional fields.
                    _self.HideAdditonal(true);

                    //Resize window (mobile only)
                    if (Application.IsInMobile()) {

                        $.mobile.resetActivePageHeight();

                        //Hide child tabs.
                        //if (Application.IsMobileDisplay() && m_parent && m_options.mobilegrideditor != true && m_options.promoted != true)
                        //    _base.ToggleState();
                    }

                    //Update the page.
                    if (m_parent == null || m_options.record != null)
                        return _self.Update(true,null,false);
                },

                function () {

                    //Open the window.
                    if (m_parent == null) {
                        UI.WindowManager.Open(_base.ID());
                    } else if (m_options.dialog == true) {
                        _base.Show();
                    }				
					
					_self.Resize();
					
                    //_self.HideLoad();
                    if(m_parent == null)
                    	Application.Fire("PageLoad", _self);

                    return _self;
                }

            );

            return w.promise();

        };
        
        /**
         * Detect if a page refresh should occur.
         * @memberof! PageViewer#
         * @protected
         * @returns {boolean} Returns `true` if a page refresh should not occur.
         */
		this.SkipPageRefresh = function(){
			
			var skipupdate = false;
			if(m_causedUpdate && m_record){
				
				skipupdate = true;														

				if(Application.HasOption(m_form.Options,"skiprefresh"))				
					return true;
				
				//Check page options.
				if(Application.HasOption(m_form.Options,"refresh"))
					skipupdate = false;
				
				//Check field options.
				var field = m_form.GetField(m_causedUpdate);
				if(field && (Application.HasOption(field.Options,"refresh") || field.CustomControl == "ImageLookup"))
					skipupdate = false;
				
				if(field && Application.HasOption(field.Options,"skiprefresh"))				
                    return true;
                    
                //Check lookup display.
                if(field && field.LookupDisplayField !== '')
                    skipupdate = false;
				
				//Check the view.
				if(m_record.View && (m_record.View.indexOf(m_causedUpdate+'=')!=-1 || m_record.View.indexOf('('+m_causedUpdate+')') != -1))
					skipupdate = false;				
				
				//Check code;
				if(skipupdate){
					var col = m_table.Column(m_causedUpdate);
					if(col){																						
						if(col.PrimaryKey)
							skipupdate = false;
					}
				}
				
				//Check flowfields.
				if(skipupdate){
					for (var i = 0; i < m_table.Columns.length; i++) {
						var col = m_table.Columns[i];
						if(col.LookupFilters && (col.LookupFilters.indexOf(m_causedUpdate+'=')!=-1 || col.LookupFilters.indexOf('('+m_causedUpdate+')') != -1))
							skipupdate = false;				
					}
				}
				
				//Check record validate.
				if(skipupdate){
					for (var i = 0; i < m_record.Functions.length; i++) {
						if (m_record.Functions[i][0] == m_causedUpdate) {
							if(m_record.Functions[i][1].indexOf("rec") != -1)
								skipupdate = false;
							break;
						}
					}
				}
				
			}
			return skipupdate;
			
        };	
        
        this.PagingPage = function(val){
            if(typeof val === 'undefined'){
                return m_pagingCurrentPage;
            }else{
                m_pagingCurrentPage = val;
                Application.RunNext(function(){
                    return _self.Update();
                });
            }
        };
        
        /**
         * Update the page viewer.
         * @memberof! PageViewer#
         * @param {boolean} [first_=false] Pass `true` if this is the first update.
         * @param {boolean} [showProgress_=true] If `true`, shows the progress bar.
         * @param {boolean} [skipOpenFunc_=true] If `true`, skips the open page trigger.
         * @returns {JQueryPromise} Promises to return after updating the page.
         */
        this.Update = function (first_, showProgress_, skipOpenFunc_) {

            _base.SetStatus("");

			if(m_form && Application.HasOption(m_form.Options,"norefresh") && first_ && skipOpenFunc_){
				return;
			}
					
            first_ = Default(first_, false);
            showProgress_ = Default(showProgress_, true);		
			skipOpenFunc_ = Default(skipOpenFunc_, true);

			//Partial refresh.
			var skipupdate = _self.SkipPageRefresh();
					
			
            //_self.SaveLayout();

            var w2 = $wait();

            $code(

            function () {                
                if (!Application.HasOption(m_form.Options,"noupdatetrans"))
                    return Application.BeginTransaction();
            },

            function () {

				if(!_self || skipupdate)return;
			
                if (!m_temp)
                    _self.ShowLoad();
                _self.LoadControls(false);

                if (showProgress_)
                    _base.Progress(20);

                //Set the view.                
                m_record.View = Application.ViewSubstitute(m_record.View);

                //On open action.
                if (first_ && m_form.OpenAction && !skipOpenFunc_) {		
					Application.Fire("OpenPage");				
                    return _self.RunIndividualAction(m_form.OpenAction.Name, false, false);
                }
            },

            function () {

                if(!_self || skipupdate)return;

                if(_self.GetPageGrid() && 
                    m_table.Name.indexOf('VT$') !== 0 && 
                    !m_options.factbox &&
                    !Application.IsInMobile() &&
                    !Application.HasOption(m_form.Options,"nopaging")){    

                    _self.GetPageGrid().OnSortCol = function(){
                        var currsort = Application.GetSorting(m_record.View);
                        m_record.View = m_record.View.replace(currsort,'').trim();
                        var sort = _self.GetPageGrid().GetSort();
                        try{
                            var cols = sort.split(',');                            
                            var view_cols = [];
                            var view_order = [];
                            for(var i = 0; i < cols.length; i++){
                                var c = cols[i];
                                c = c.trim();
                                var o = 'asc';
                                if(c.indexOf(' desc') !== -1)
                                    o = 'desc';
                                c = c.replace(' asc','').replace(' desc','');
                                var fld = m_form.GetField(c);
                                if(fld){
                                    if(fld.LookupDisplayField || fld.FlowField)
                                        c = 'FF$' + c;
                                    var skip = false;
                                    if(fld.FlowField && fld.FlowField.indexOf('function') === 0)
                                        skip = true;
                                    if(!skip){
                                        view_cols.push(c);
                                        if(o === 'asc'){
                                            view_order.push('Ascending');
                                        }else{
                                            view_order.push('Descending');
                                        }
                                    }
                                }
                            }
                            if(view_cols.length > 0)
                                m_record.View = 'SORTING('+view_cols.join(',')+') ORDER('+view_order.join(',')+') '+m_record.View;
                            Application.RunNext(_self.Update);
                        }catch(e){                        
                        }                        
                    };
                    
                    var toolbar = _self.Toolbar2();
                    toolbar.addClass("ui-widget ui-state-default");
                    toolbar.css("padding-top", "10px");
                    toolbar.css("padding-bottom", "10px");
                    toolbar.css("display", "inline-block");
                    toolbar.css("width", "100%");
                    toolbar.css("border-width", "0px");
                    toolbar.css("font-size", "13px");

                    m_record.View = Application.RemovePagingFromView(m_record.View);
                    var countview = m_record.View;
                    for (var i = 0; i < m_record.GroupFilters.length; i++) {
                        var filter = m_record.GroupFilters[i];
                        countview = Application.AddFilter(countview,filter.Name,filter.Value);
                    }
                    COUNT(m_table.Name,countview,function(recordcount){

                        m_pagingNoOfPages = Math.ceil(recordcount.Count / m_pagingRecordsPerPage);
                        if(m_pagingCurrentPage > m_pagingNoOfPages || m_pagingCurrentPage < 1)
                            m_pagingCurrentPage = 1;  

                        var offset = ((m_pagingCurrentPage-1)*m_pagingRecordsPerPage);
                        var endoffset = Math.min(offset + m_pagingRecordsPerPage, recordcount.Count);
                        var startoffset = Math.min(offset+1,recordcount.Count);

                        m_record.View = 'OFFSET('+offset+') FETCH('+m_pagingRecordsPerPage+') ' + m_record.View;
                        var pagingdiv = $('#paging'+_self.ID());
                        if(pagingdiv.length === 0)
                            pagingdiv = $('<div id="paging'+_self.ID()+'" style="float:left;"></div>').appendTo(_self.Toolbar2());
                        pagingdiv.html('');          
                                                
                        $('<div class="app-button"><<</div>')
                        .on('click',function(){
                            _self.PagingPage(1);
                        }).appendTo(pagingdiv);

                        $('<div class="app-button">Prev</div>')
                        .on('click',function(){
                            _self.PagingPage(m_pagingCurrentPage - 1);
                        }).appendTo(pagingdiv);

                        $('<div style="display:inline-block;">Page: </div>').appendTo(pagingdiv);

                        var html = '<select style="width: auto; max-width: 100px; display: inline-block; margin: 0 5px 0 5px;border: 1px solid #ccc;padding: 3px;border-radius: 4px;">'
                        for(var i = 1; i <= m_pagingNoOfPages; i++){
                            html += '<option value="'+i+'" '+(i === m_pagingCurrentPage ? 'selected':'')+'>'+i+'</option>';                                                      
                        }
                        html += '</select>'

                        $(html).on('change',function(){
                            _self.PagingPage(+$(this).val());
                        }).appendTo(pagingdiv);

                        $('<div class="app-button">Next</div>')
                        .on('click',function(){
                            _self.PagingPage(m_pagingCurrentPage + 1);
                        }).appendTo(pagingdiv);

                        $('<div class="app-button">>></div>')
                        .on('click',function(){
                            _self.PagingPage(m_pagingNoOfPages);
                        }).appendTo(pagingdiv);      
                        
                        $('<div style="display:inline-block;margin-left:5px;">Records per Page: </div>').appendTo(pagingdiv);

                        var rpphtml = '<select style="width: auto; max-width: 100px; display: inline-block; margin: 0 5px 0 5px;border: 1px solid #ccc;padding: 3px;border-radius: 4px;">';
                        rpphtml += '<option value="50" '+(50 === m_pagingRecordsPerPage ? 'selected':'')+'>50</option>';
                        for(var i = 1; i <= 5; i++){
                            var val = i * 100;
                            rpphtml += '<option value="'+val+'" '+(val === m_pagingRecordsPerPage ? 'selected':'')+'>'+val+'</option>';                                                      
                        }
                        rpphtml += '</select>';

                        $(rpphtml).on('change',function(){
                            m_pagingRecordsPerPage = +$(this).val();
                            if (!Application.IsInMobile()) 
                                _self.SaveLayout();   
                            _self.PagingPage(m_pagingCurrentPage);
                        }).appendTo(pagingdiv);                        
                        
                        $('<div style="display:inline-block;margin-left:5px;">'+startoffset+' - '+endoffset+' of '+recordcount.Count+'</div>').appendTo(pagingdiv);
          
                    });
                }

            },
			
            function () {

				if(!_self || skipupdate)return m_record;
			
                if (m_form.SkipRecordLoad) {

                    var clear = true;
                    var filters = _self.Filters();
                    for (var i = 0; i < filters.length; i++) {
                        var pagefield = m_form.GetField(filters[i].Name.replace("FF$", ""));
                        if (pagefield)
                            clear = false;
                    }

                    var g = _self.GetPageGrid();

                    if (clear) {
                        if (g)
                            Application.Loading.ShowOverlay("gbox_" + g.ID() + "table", "Please apply a filter to continue");
                        m_record.Clear();
                        return m_record;
                    } else {
                        if (g)
                            Application.Loading.HideOverlay("gbox_" + g.ID() + "table");
                    }
                                                
                }

				var isnew = true;
				if(m_record.Record)
					isnew = m_record.Record.NewRecord;
                if (m_options.mode && m_options.mode == "New" && first_ && isnew)
                    return m_record.New();

                if (m_form.Fields.length == 0)
                    return m_record;

                if (m_options.record != null)
                    return m_record;

                if (Application.HasOption(m_form.Options,"refresh") || first_ || m_form.Type == "List" || (!Application.restrictedMode && m_options.homepage) || (!m_tempChanged && m_temp))
                    if (!Application.HasOption(m_form.Options, "temp"))
                        return m_record.FindFirst();

				if (!Application.HasOption(m_form.Options, "skipfirst"))
					m_record.First();
				
                return m_record;
            },

            //Liveapp #75 - Offline flowfield
           function (r) {			  			  

               if (!_self || skipupdate) return r;

               if(_self.GetPageGrid()){            
                    m_record.View = Application.RemovePagingFromView(m_record.View);
               }

			   if(m_options.pos && first_)
					r.SetPosition(m_options.pos);
			   
               if (!Application.IsOffline() && !Application.HasOption(m_form.Options, "calcclientfields"))
                   return r.CalcClientSideFields();
			   
			   if(m_form.Type == "Card")
				    return r.CalcClientSideFields();

               //Loop records in offline mode.
               if (r.Count > 0) {
                   r.First();
                   return $loop(function () {
                       return $codeblock(
                           function () {
                               return r.CalcClientSideFields();
                           },
                           function () {
                               if (r.Next())
                                   return $next;
                               r.First();
                               return r;
                           }
                       );
                   });
               }

               return r;
           },

            function (r) {

                if (!_self || skipupdate) return;

                if (showProgress_)
                    _base.Progress(30);

                if (r == null)
                    Application.Error("Invalid record");			
				
                m_record = r;
                m_record.Temp = m_temp;

                //No records found.
                if (m_record.Count == 0) {

                    _self.EnableControls(false);

                } else { //Records found.                    

                    _self.EnableControls(true);

                }

                _self.UpdateCaption();

                //Update filters.
                if (m_form.ShowFilters && m_filterToolbar)
                    m_filterToolbar.SetFilters(null, first_ && !skipOpenFunc_);

                return _self.UpdateControls(first_, showProgress_);
            },

            function () {

				if(!_self)return;
			
                //Focus on first row                
                var grd = _self.GetPageGrid();
                if (grd) {
                    if (first_ && !skipOpenFunc_) {
                        if (m_record.Count > 0) {
                            grd.SelectRow(1);							
                            grd.ScrollToRow(1);
                            _self.GetRecordByRowId(1);
                        }
                    } else {
                        if (grd.SelectedRow()) {
							grd.SelectRow(grd.SelectedRow());
                            grd.ScrollToRow(grd.SelectedRow());
                            _self.GetRecordByRowId(grd.SelectedRow());
                        }
                    }
                }

                return _self.UpdateSubPages(true, showProgress_,skipOpenFunc_);
            },

            function () {                
                if (!Application.HasOption(m_form.Options,"noupdatetrans"))
                    return Application.CommitTransaction();
            },

            function () {
				
				if(!_self)return;
				
                if (!Application.IsInMobile())
                    _self.LoadControls(true);

                _self.HideLoad();

                //Focus on first editable field.                
                if (first_ && m_form.Type == "Card" && !Application.IsInMobile() && !Application.HasOption(m_form.Options,"skipfocus")) {                    
					for (var i = 0; i < m_form.Fields.length; i++) {
                        var c = _self.GetControl(m_form.Fields[i].Name);
                        if (m_form.Fields[i].Editable && c && !c.NoFocus) {
                            Application.RunNext(_self.GetControl(m_form.Fields[i].Name).Focus);
                            break;
                        }
                    }
                }

                if (m_form.Type == "Card")
                    _self.DisableKeys(false);

                if (m_options.editlinemode != null) {
                    $('#' + _base.ID() + "LeftColumn").css("padding-bottom", "0px");
                    $('#' + _base.ID() + "RightColumn").css("padding-bottom", "0px");
                }

                if (showProgress_)
                    _base.Progress(100);

				if (_base.Dialog())
					Application.RunNext(_base.CenterDialog);
					
                if ((m_options.homepage != true || Application.IsInFrame()) && m_options.mobilegrideditor != true && m_parent && m_parent.Record()) {
                    if (m_parent.Record().NewRecord && !Application.HasOption(m_parent.Page().Options, "temp")) {
                        _base.ShowOverlay();
                    } else {
                        _base.HideOverlay();
                    }
                }
				
				//_self.ResizeParent();

				m_lastView = m_record.View;
				
                m_loaded = true;
            }
        );

            return w2.promise();
        };

        /**
         * Update the page viewer's sub pages.
         * @memberof! PageViewer#
         * @protected
         * @param {boolean} [first_] Pass `true` if this is the first update.
         * @param {boolean} [showProgress_] If `true`, shows the progress bar.
         * @param {boolean} [skipOpenFunc_] If `true`, skips the open page trigger.
         * @returns {JQueryPromise} Promises to return after updating the sub pages.
         */
        this.UpdateSubPages = function (first_, showProgress_, skipOpenFunc_) {

			first_ = Default(first_, true);
		
            Application.LogDebug("Updating Subpages");

            if (m_subPages.length > 0)
                return $loop(function (i) {

                    if (showProgress_)
                        _base.Progress(_base.Progress() + ((i + 1) / m_subPages.length * 25));

                    Application.LogDebug("Updating Subpage: " + i);

                    var w = $wait();

                    $code(

                            function (v) {

								var page = m_subPages[i];
							
								var skipupdate = false;
								if(m_causedUpdate){
									
									skipupdate = true;
									
									//Check page options.
									if(Application.HasOption(m_form.Options,"refresh"))
										skipupdate = false;
									
									//Check field options.
									var field = m_form.GetField(m_causedUpdate);
									if(field && Application.HasOption(field.Options,"refresh"))
										skipupdate = false;
									
									//Check view.
									var view = page.FormView();
									if(view && (view.indexOf(m_causedUpdate+'=')!=-1 || view.indexOf('('+m_causedUpdate+')') != -1))
										skipupdate = false;
								}
								
								if(skipupdate)
									return;
							                                
                                var v = Application.MergeView(page.FormView(), m_record);
                                if(page.View())
                                    v = Application.CombineViews(v, page.View(),false);
                                page.View(v);
                                return page.Update(first_, showProgress_, skipOpenFunc_);
                            },

                            function () {
                                //Continue?
                                if (i < m_subPages.length - 1)
                                    return $next;
                            }
                        );

                    return w.promise();

                });
        };

        /**
         * Function that runs when showing the page viewer.
         * @memberof! PageViewer#
         * @returns {void}
         */
        this.OnShow = function () {

            var grd = _self.GetPageGrid();
            if (grd && grd.SelectedRow())
                grd.ScrollToRow(grd.SelectedRow());

            if (m_parent == null) //Only run this on parent
                $("#lnkInfo").hide();

            try {
                for (var i = 0; i < m_form.TabList.length; i++) {
                    if (m_form.TabOption(m_form.TabList[i], "factbox")) {
                        if (Application.IsInMobile()) {
                            $("#lnkInfo").show();
                        } else {
                            if (!Application.App.SideVisible())
                                Application.App.ToggleSide();
                        }
                    }
                }
            } catch (e) {
            }

            if (Application.IsInMobile() && (m_parent == null || _base.Dialog())) {
                
                $("#okbtn"+_base.ID()).hide();

                function ShowTick(){

                    if(Application.HasOption(m_form.Options,"hidesave"))
                        return;

                    $("#okbtn"+_base.ID()).show();
                    $("#"+_base.ID()+"containertitle").css("width","calc(100vw - 100px)");
                    if(!$("#"+_base.ID()+"containerok").is(":visible")){
                        $("#"+_base.ID()+"containerok").click(function () { 
                            setTimeout(function(){
                                Application.RunNext(function(){                    
                                    return UI.WindowManager.OnSave(!Application.HasOption(m_form.Options,"saveonly"));
                                });
                            },500); //Delay here to wait for field validation
                            return false;
                        }).show().ripple(); 
                    }
                }
                
                if (m_form.Type == "Card" && !m_options.homepage && (m_parent == null || _base.Dialog())){
                    ShowTick();
                }else if (m_form.CloseAction && !m_customControl) {                    
                    ShowTick();
                }

            }					

            if (m_customControl && m_customControl.OnShow)
                m_customControl.OnShow();

        };

        /**
         * @deprecated Since v5.0.0
         * @memberof! PageViewer#
         * @param {string} tabName_ Tab to open.
         * @returns {JQueryPromise<PageViewer>} Promises to return after opening the tab.
         */
        this.OpenPageTab = function (tabname_) {

            Application.LogWarn('PageViewer.OpenPageTab has been deprecated since v5.0.0');

            return $codeblock(
                function () {

                    var rec = new Record();
                    rec.Copy(m_record);

                    var page = new PageViewer({ id: m_id, view: m_view, record: rec, tabname: tabname_ });

                    page.CloseFunction(function () {
                        var w = $wait();
                        $code(_self.Update);
                        return w.promise();
                    });

                    return page.Open();
                }
            );
        };

        /**
         * Get page viewer information.
         * @memberof! PageViewer#
         * @returns {object} Returns the page viewer information (like ID and view).
         */
        this.GetInfo = function () {

            if (m_form == null) {
                return
            }

			var view = "";
			if(m_record)
				view = Application.MergeView(m_record.View, m_record);
			
            return {
                ID: m_form.Name,
                View: view
            };
        };

        /**
         * Set the page caption.
         * @memberof! PageViewer#
         * @param {string} caption New page caption.
         * @returns {void}
         */
        this.Caption = function (caption) {
            m_options.caption = caption;
            _self.UpdateCaption();
        };

        /**
         * Update the page caption from the page options.         
         * @memberof! PageViewer#
         * @protected
         * @param {string} [extra] Extra string to append to the end of the caption.
         * @returns {void}
         */
        this.UpdateCaption = function (extra) {

            extra = Default(extra, "");
            var caption = m_options.caption;
            caption = Default(caption, "New Window");

            if (caption.indexOf("{") != -1) {

                //Update caption from record.
                var check = new RegExp('(\{)(.*?)(\})', 'g');
                var consts = caption.match(check);
                if (consts) {
                    for (j = 0; j < consts.length; j++) {
                        var name = consts[j].replace(check, '$2');
                        if (m_record && name != "" && m_record[name] != null) {
                            caption = caption.replace("{" + consts[j].replace(check, '$2') + "}", m_record[name]);
                        }
                    }
                }

                //Update caption from filters.
                var filters = Application.GetFilters(m_view);
                for (var i = 0; i < filters.length; i++) {
                    var filter = filters[i];
                    caption = caption.replace("{" + filter[0] + "}", filter[1].replace(">", "").replace("<", "").replace("=", "").replace(".", ""));
                }

                //Hide unmerged fields. 
                var check = new RegExp('(\{)(.*?)(\})', 'g');
                var consts = caption.match(check);
                if (consts)
                    for (j = 0; j < consts.length; j++)
                        caption = caption.replace("{" + consts[j].replace(check, '$2') + "}", "");

            }

            caption = caption + extra;
            if (caption.indexOf(" - ") == caption.length - 3)
                caption = caption.substr(0, caption.indexOf(" - "));

            //Update caption.
            if (m_options.mobilegrideditor != true) {
                _base.SetTitle(UI.IconImage(m_form.Icon) + ' ' + caption);
            } else {
                _base.SetTitle(caption);
            }
        };

        /**
         * Update the page controls.
         * @memberof! PageViewer#
         * @param {boolean} [first_] Pass `true` if this is the first update. 
         * @param {boolean} [showProgress_] If `true`, shows the progress bar.
         * @returns {JQueryPromise} Promises to return after updating the controls. 
         */
        this.UpdateControls = function (first_, showProgress_) {

            Application.LogDebug("Updating Controls.");

            if (m_controls.length > 0)
                return $loop(function (i) {

                    if (showProgress_)
                        _base.Progress(_base.Progress() + ((i + 1) / m_controls.length * 25));

                    Application.LogDebug("Updating Control: " + i);

                    var w = $wait();

                    $code(

                    function () {

                        var cont = m_controls[i];

                        //Grid control.
                        if (cont.ObjectType() == "Grid") {

                            //Set Selected.
                            var selectedrec = cont.DataSourceById(cont.SelectedRow());
                            if (selectedrec != null)
                                selectedrec = selectedrec.Record.RecID;

                            return _self.UpdateGrid(cont, selectedrec);

                        } else {
                            return cont.Update(m_record);
                        }

                    },

                    function () {
                        //Continue?
                        if (i < m_controls.length - 1)
                            return $next;
                    }
                );

                    return w.promise();

                });

        };

        /**
         * Set the page controls as loaded/unloaded.
         * @memberof! PageViewer#
         * @param {boolean} loaded_ If `true`, marks the page controls as loaded.
         * @returns {void}
         */
        this.LoadControls = function (loaded_) {

            for (var i = 0; i < m_controls.length; i++) {
                m_controls[i].Loaded(loaded_);
            }
        };

        /**
         * Hide additional fields on a tab.
         * @memberof! PageViewer#
         * @param {boolean} hide_ If `true` hides the additional fields, else show the fields.
         * @param {string} [tab_] Name of the tab.
         * @returns {void}
         */
        this.HideAdditonal = function (hide_, tab_) {

            tab_ = Default(tab_, null);

            for (var i = 0; i < m_controls.length; i++) {
                if (m_controls[i].Field().Importance == "Additional" && (tab_ == null || m_controls[i].Field().TabName == tab_)) {
                    if (hide_) {
                        m_controls[i].Hide();
                    } else {
                        m_controls[i].Show();
                    }
                }
            }
        };

        /**
         * Set the page controls as enabled/disabled.
         * @memberof! PageViewer#
         * @param {boolean} enable_ If `true`, marks the page controls as enabled.
         * @returns {void}
         */
        this.EnableControls = function (enable_) {

            for (var i = 0; i < m_controls.length; i++) {
                m_controls[i].Enabled(enable_, false);
            }
        };

        /**
         * Hide dropdowns from combos.
         * @memberof! PageViewer#
         * @protected
         * @returns {void}
         */
        this.HideDropdowns = function () {

            for (var i = 0; i < m_controls.length; i++) {
                if (m_controls[i].HideDropdown) {
                    m_controls[i].HideDropdown();
                }
            }
        };

        /**
         * Disable/enable key presses on the page.
         * @memberof! PageViewer#
         * @protected
         * @param {boolean} value If `true` disables key presses.
         * @returns {void}
         */
        this.DisableKeys = function (value) {

            if (Application.IsInMobile())
                return;

            m_disableKeys = value;
            if (m_parent && m_parent.DisableKeys) {
                m_parent.DisableKeys(value);
            }
        };

        /**
         * Show the page load overlay.
         * @memberof! PageViewer#
         * @returns {void}
         */
        this.ShowLoad = function () {

            _base.ShowLoad();            

            for (var i = 0; i < m_tabs.length; i++) {
                m_tabs[i].ShowLoad();
            }

            if (m_options.homepage == true)
                return;
                
            for (var i = 0; i < m_subPages.length; i++) {
                m_subPages[i].ShowLoad();
            }					
        };

        /**
         * Hide the page load overlay.
         * @memberof! PageViewer#
         * @returns {void}
         */
        this.HideLoad = function (all) {

            _base.HideLoad(all);
            for (var i = 0; i < m_tabs.length; i++) {
                m_tabs[i].HideLoad(all);
            }
            for (var i = 0; i < m_subPages.length; i++) {
                m_subPages[i].HideLoad(all);
            }
        };

        /**
         * Trigger a resize of the parent page.
         * @memberof! PageViewer#
         * @protected
         * @returns {void}
         */
        this.ResizeParent = function () {
            if (m_parent) {
                m_parent.Resize();
            } else {
                _self.Resize();
            }
        };

        /**
         * Set outer height of the page.
         * @memberof! PageViewer#
         * @protected
         * @param {number} height Height in pixels.
         * @returns {void}
         */
        this.SetOuterHeight = function (height) {
            _base.SetOuterHeight(height);
        };

        /**
         * Close the page.
         * @memberof! PageViewer#         
         * @returns {JQueryPromise} Promises to return after closing the page.
         */
        this.Close = function () {
            if (m_options.closebutton == false) return;
            return UI.WindowManager.Close(_base.ID());
        };
        
        /**
         * Close the page and skip any errors.
         * @memberof! PageViewer#         
         * @returns {JQueryPromise} Promises to return after closing the page.
         */
		this.CloseSilent = function () {
            if (m_options.closebutton == false) return;
            return UI.WindowManager.Close(_base.ID(), true, true);
        };

        /**
         * Load the page layout (desktop only).
         * @memberof! PageViewer#         
         * @protected
         * @returns {JQueryPromise} Promises to return after loading the layout.
         */
        this.LoadLayout = function () {

            m_layout = null;

			if (Application.IsInMobile() || Application.HasOption(m_form.Options,"nolayout") || m_form.Type === 'Card')
                return;

            var uidlayout = Application.HasOption(m_form.Options,"uidlayout");
			
            return $codeblock(

                function () {
                    return Application.GetUserLayout(Application.auth.Username, uidlayout ? m_uid : m_ouid);
                },

                function (layout) {

                    if (layout != "") {
                        m_layout = $.parseJSON(layout);
                        m_layout.Filters = Default(m_layout.Filters, null);
                        m_pagingRecordsPerPage = m_layout.recordsPerPage || 50;
                    }

                }

            );

        };

        /**
         * Save the page layout (desktop only).
         * @memberof! PageViewer#         
         * @protected
         * @returns {JQueryPromise} Promises to return after saving the layout.
         */
        this.SaveLayout = function () {

            if (Application.IsInMobile() || Application.HasOption(m_form.Options,"nolayout") || m_form.Type === 'Card')
                return;
                            
            var uidlayout = Application.HasOption(m_form.Options,"uidlayout");

            Application.RunNext(function () {

				if(!_self) return;
				
                var filters = null;
                if (m_layout)
                    filters = m_layout.Filters;

                m_layout = new Object();
                m_layout.columns = null;

                var grd = _self.GetPageGrid();
                if (grd) {
                    m_layout.columns = new Array();
                    var cols = grd.GetColumns();
                    for (var i = 0; i < cols.length; i++) {
                        var col = new Object();
                        col.name = cols[i].name;
                        col.width = cols[i].width;
                        col.hidden = cols[i].hidden;
                        m_layout.columns.push(col);
                    }
                }

                if (m_form.ShowFilters || m_form.Option('savefilters'))
                    m_layout.Filters = filters;

				m_layout.state = _base.State();	

				m_layout.tabs = [];
				for(var i = 0; i < m_tabs.length; i++){
					m_layout.tabs.push(m_tabs[i].State());
				}

                m_layout.recordsPerPage = m_pagingRecordsPerPage;
				
                return Application.SaveUserLayout(Application.auth.Username, uidlayout ? m_uid : m_ouid, $.toJSON(m_layout));                 

            },null,null,true);
        };

        /**
         * Get/set the user layout.
         * @memberof! PageViewer#
         * @param {object} [value] If specified, sets the use rlayout.
         * @returns {object|void} Returns the user layout if `value` is not specified.
         */
        this.UserLayout = function (value) {

            if (typeof value != "undefined") {

                m_layout = value;                

            } else {

                return m_layout;
            }
        };

        /**
         * Clear the page layout.
         * @memberof! PageViewer#         
         * @protected
         * @returns {void}
         */
        this.ClearLayout = function () {

            m_layout = null;
            var uidlayout = Application.HasOption(m_form.Options,"uidlayout");

            Application.RunNext(function () {

                return $codeblock(

                    Application.BeginTransaction,

                    function () {
                        return Application.DeleteUserLayout(Application.auth.Username, uidlayout ? m_uid : m_ouid)
                    },

                    Application.CommitTransaction,

                    function () {
                        Application.Message("%LANG:S_REOPENPAGE%");
                    }

                );

            });

        };

        /**
         * Add an OK button to the page.
         * @memberof! PageViewer#         
         * @protected
         * @returns {void}
         */
        this.CreateOKButton = function () {

            if (!Application.IsInMobile()) {

                var toolbar = _base.Toolbar3();
                toolbar.addClass("ui-widget ui-state-default");
                toolbar.css("display", "inline-block");
                toolbar.css("width", "100%");
                toolbar.css("text-align", "right");

                var btn = $("<button id='" + $id() + "' style='width: 100px; margin: 10px;'><b>OK</b></button>");
                btn.button().click(function () {
                    Application.RunNext(function () {
                        m_okClicked = true;
                        return _self.OnSave(true);
                    });
                });
                toolbar.append(btn);

            } else {

                // $("#okBtn").unbind("tap");
                // $("#okBtn").on("tap", function () {
                    // Application.RunNext(function () {
                        // m_okClicked = true;
                        // return _self.OnSave(true);
                    // });
                // });

            }
        };

        /**
         * Function that runs on save of the page (temp pages only).
         * @memberof! PageViewer#         
         * @protected
         * @param {boolean} [close=false] Close the page after saving.
         * @param {boolean} [skipcheck=false] Skip the before close check.
         * @param {boolean} [okclicked=false] If `true` the OK button was clicked.
         * @returns {JQueryPromise} Promises to return after saving the page.
         */
        this.OnSave = function (close, skipcheck, okclicked) {

            close = Default(close, false);

            if (!skipcheck)
                if (!_self.OnBeforeClose(true))
                    return false;

            if (okclicked)
                m_okClicked = okclicked;

            //m_okClicked = true;
            _self.Save();

            return $codeblock(

                Application.BeginTransaction,

                function () {

                    _self.ShowLoad();				
					
                    //Don't save temp records.
                    if (Application.HasOption(m_form.Options, "temp") || m_okClicked == false)
                        if (!Application.HasOption(m_form.Options, "savetemp"))
                            return false;

					if(_self.ReadOnly() || m_temp === false)
						return false;
						
                    //Allow for temp list pages.
                    if (m_form.Type == "List") {
                        m_record.First();
                        if (m_record.Count > 0)
                            return $loop(function (i) {
                                return $codeblock(
                                    function () {
                                        m_record.Temp = false;
                                        //m_record.ClearXRec(false, m_table.TableKeys[0].Columns.split(",")); //Issue #78 - Xrec issue in mobile
                                        if (m_record.NewRecord == true) {
                                            return m_record.Insert(true, null, _self);
                                        } else {
                                            return m_record.Modify(true, _self);
                                        }
                                    },
                                    function () {
                                        if (m_record.Next())
                                            return $next;
                                        return m_record;
                                    }
                                );
                            });
                        return m_record;
                    }

                    m_record.Temp = false;
                    //m_record.ClearXRec(false, m_table.TableKeys[0].Columns.split(",")); //Issue #78 - Xrec issue in mobile
                    if (m_record.NewRecord == true) {
                        return m_record.Insert(true, null, _self);
                    } else {
                        return m_record.Modify(true, _self);
                    }
                },
                function (r) {

                    _self.HideLoad();

                    if (r != false) {

                        m_record = r;
                        m_record.Temp = m_temp;

                        //Update filters.
                        var filters = Application.GetFilters(m_view);
                        for (var i = 0; i < filters.length; i++) {
                            var f = m_record.GetField(filters[i][0]);
                            if (f){

                                //Date filter fix.
                                if(f.Type=="Date" && f.Value){
                                    if(Object.prototype.toString.call(f.Value) === "[object Date]"){
                                        f.Value = Application.FormatDate(f.Value);
                                    }
                                }

                                if(filters[i][1] != f.Value && f.Value !== null) {
                                    m_record.Filter(filters[i][0], f.Value);
                                }
                            }
                        }

                        m_tempChanged = false;

                    }

                    return Application.CommitTransaction();
                },

                function () {

                    if (close && m_options.dialog != true)
                        if (!m_parent) {
                            return _self.Close();
                        } else {
                            return m_parent.Close();
                        }

                    if (close)
                        return _self.OnClose(m_okClicked);

                    m_okClicked = true;                    

                    if (m_options.mobilegrideditor == null && !Application.HasOption(m_form.Options,"skipupdate")) {
                        return _self.Update();
                    } else {
                        return _self.UpdateControls();
                    }
                }
            );

            return true;
        };

        /**
         * Save the page grid data.
         * @memberof! PageViewer#         
         * @protected
         * @returns {void}
         */
        this.Save = function () {

            var grd = _self.GetPageGrid();
            if (grd)
                grd.Save();

        };

        /**
         * Clear the page cache.
         * @memberof! PageViewer#         
         * @protected
         * @returns {void}
         */
        this.ClearCache = function () {
            m_form.ClearCache();
            Application.Message("%LANG:S_REOPENPAGE%");
        };

        /**
         * Merge a view with the current page view.
         * @memberof! PageViewer#
         * @param {string} view View to merge with the page view.
         * @returns {string} Returns the merged views.
         */
        this.MergeView = function (view) {
            return Application.MergeView(view, m_record);
        };

        /**
         * Flag the page that a change has been made.
         * @memberof! PageViewer#
         * @protected
         * @returns {void}
         */
        this.ChangeMade = function () {
            if (m_form.Name.within(m_designerPages))
                m_changed = true;
            if (m_form.Name.within(m_designerPages2))
                m_parent.Changed(true);
            if (m_form.Name.within(m_designerPages3) && !Application.IsInMobile())				
				m_openedFrom.Changed(true);				             
        };

        /**
         * Get a page control by name.
         * @memberof! PageViewer#
         * @protected
         * @param {string} id Control name.
         * @returns {Control} Returns the control if it is found, otherwise returns `null`.
         */
        this.GetControl = function (id) {
            for (var j = 0; j < m_controls.length; j++) {
                if (m_controls[j].Field().Name == id) {
                    return m_controls[j];
                }
            }
            return null;
        };

        /**
         * Check mandatory fields for values. Displays an error if one or more mandatory fields are `null`.
         * @memberof! PageViewer#
         * @protected
         * @returns {void}
         */
        this.MandatoryCheck = function () {
            //Check mandatory.
            for (var j = 0; j < m_form.Fields.length; j++) {
                var field = m_form.Fields[j];
                if (field.Mandatory) {
                    if (m_record[field.Name] == 0 || m_record[field.Name] == null || m_record[field.Name] == "null") {
                        var cont = _self.GetControl(field.Name);
                        if (cont)
                            _self.XFocusControl(cont.Control());
                        Application.Error(field.Caption + " must have a value.");
                    }
                }
            }
        };

        /**
         * Check fields for valid values. Displays an error if one or more fields are invalid.
         * @memberof! PageViewer#
         * @protected
         * @returns {void}
         */
        this.ValidCheck = function () {
            //Check valid.
            for (var j = 0; j < m_form.Fields.length; j++) {
                var field = m_form.Fields[j];
                var cont = _self.GetControl(field.Name);
                if (cont) {
                    if (cont.Invalid()) {
                        _self.XFocusControl(cont.Control());
                        Application.Error(field.Caption + " has an invalid value.");
                    }
                }
            }
        };

        //#endregion

        //#region Record Functions

        /**
         * Function that runs when the `New` button is clicked.
         * @memberof! PageViewer#
         * @protected
         * @returns {JQueryPromise} Promises to return after creating the new record.
         */
        this.OnNew = function () {

            var grd = _self.GetPageGrid();

            return $codeblock(

            function () {

                _self.ShowLoad();

                //New record.                
                return m_record.New();
            },

            function (r) {

                if (r == null)
                    Application.Error("Invalid record");

                m_record = r;
                m_record.Temp = m_temp;

                var action = m_form.OnNewAction();
                if (action) {
                    return $codeblock(
                        Application.BeginTransaction,
                        function () {
                            return m_form.RunActionCode(m_record, action, _self);
                        },
                        Application.CommitTransaction
                    );
                }
            },

            function () {

                if (m_form.Type == "Card") {

                    //Update the form.
                    return _self.Update();

                } else {

                    if (m_customControl)
                        return m_customControl.OnNew(m_record);

                    if (grd) {
                        //Add the grid row.
                        var data = _self.ConvertRecordToData();
                        return grd.AddRow(data.RowId, data);
                    }
                }
            },

            function () {

                //Edit first cell.
                if (grd) {
                    grd.EditFirstCell();
                    if (!Application.IsInMobile()) {
                        grd.ScrollToRow(m_record.Count);
                        return _self.UpdateSubPages(true, false);
                    }
                }

            },

            function () {

                _self.HideLoad();

                //Change was made.
                _self.ChangeMade();

                if (m_enableEditMode) {
                    var data = _self.ConvertRecordToData();
                    return _self.GridDoubleClick(data.RowId);
                }

                //Run the double click action.
                if (m_form.DoubleClickAction() && m_form.RunDblClickOnNew) {
                    if (m_record.Blank == true)
                        m_nextPageOptions = { mode: 'New' };
                    return _self.RunAction(m_form.DoubleClickAction().Name, true);
                }
            }

        );
        };

        /**
         * Function that runs when the `delete` button is clicked.
         * @memberof! PageViewer#
         * @protected
         * @returns {JQueryPromise} Promises to return after deleting the current record/s.
         */
        this.OnDelete = function () {

            return $codeblock(
            function () {

                var msg = "%LANG:S_DELETEREC%";
                if (m_actionsQueue > 1)
                    msg = "Do you wish to delete these records?";

                if (m_delete == null) {

                    var w2 = $wait();

                    Application.Confirm(msg, function (r) {
                        m_delete = r;
                        w2.resolve(r);
                    }, "Are you sure?");

                    return w2.promise();

                } else {
                    return m_delete;
                }
            },
            function (r) {
                if (r == true)
                    return _self.DeleteRecord();
            }
        );
        };

        /**
         * Delete the current record.
         * @memberof! PageViewer#
         * @protected
         * @returns {JQueryPromise} Promises to return after deleting the current record.
         */
        this.DeleteRecord = function () {

            var w = $wait();

            $code(

                    Application.BeginTransaction,

                    function () {

                        _self.ShowLoad();

                        //Get the record (List form only).
                        //if (m_form.Type == "List") {
                        //    var grd = _self.GetPageGrid();
                        //    _self.GetRecordByRowId(grd.SelectedRow());
                        //}

                        return m_record.Delete(true, _self);
                    },

                    function (r) {

                        if (r == null)
                            Application.Error("Invalid record");

                        m_record = r;
                        m_record.Temp = m_temp;

                        var action = m_form.OnDeleteAction();
                        if (action)
                            return m_form.RunActionCode(m_record, action, _self);
                    },

					Application.CommitTransaction,

					function () {

					    m_actionsQueue -= 1;
					    if (!_self.ActionsFinished())
					        return;

					    _self.HideLoad();

					    //Change was made.
					    _self.ChangeMade();

					    if (m_form.Type == "Card") {

					        //Close the form.
					        _self.Save();
					        return _self.Close();

					    } else {

					        //Select previous row.                            
					        var grd = _self.GetPageGrid();																			
					        if (grd) {
								
								//Clear selected rows.
								grd.ClearSelected();
								
					            var prevrow = grd.SelectedRow(-1);
					            if (prevrow != null)
					                grd.SelectRow(prevrow);
					        }
					        //Update the form.
					        return _self.Update();
					    }
					}
                );

            return w.promise();

        };

        /**
         * Parse a value based on the field type.
         * @memberof! PageViewer#
         * @protected
         * @param {PageField} field Page field definition.
         * @param {any} value_ Value to parse.
         * @returns {void}
         */
        this.FixValue = function (field, value_) {

            //Check for nulls
            if (value_ == "" || value_ == "null" || (value_ && value_.trim && value_.trim() == "" && field.OptionCaption == ""))
                value_ = null;

            if (value_ != null && field.OptionCaption == "") {

                if (field.Type == "Date") {

                    var dte = Application.ParseDate(value_);
                    if (dte == null)
                        Application.Error("Invalid date: " + value_);
                    value_ = dte;

                } else if (field.Type == "Time") {

                    if(typeof value_ === 'string'){
                        value_ = moment('1900/01/01 '+value_,Application.HasOption(field.Options,'24hours') ? 'YYYY-MM-DD HH:mm':'YYYY-MM-DD hh:mm a').toDate();
                    }else{
                        var tme = Application.ParseTime(value_);
                        if (tme == null)
                            Application.Error("Invalid time: " + value_);
                        value_ = tme;
                    }

                } else if (field.Type == "DateTime") {

                    var dte = Application.ParseDateTime(value_);
                    if (dte == null)
                        Application.Error("Invalid date time: " + value_);
                    value_ = dte;

                } else if (field.Type == "Integer") {

                    if(value_ && value_.replace)
                        value_ = value_.replace(/\,/g,'').replace(/\$/g,'');
                    var i = parseInt(value_);
                    if (isNaN(i))
                        Application.Error("Invalid integer: " + value_);
                    value_ = (i === 0 ? null : i);
                    if(Application.HasOption(field.Options,'nonull') && !value_)
                        value_ = 0;

                } else if (field.Type == "Decimal") {

                    if(value_ && value_.replace)
                        value_ = value_.replace(/\,/g,'').replace(/\$/g,'');
                    var i = parseFloat(value_);
                    if (isNaN(i))
                        Application.Error("Invalid decimal: " + value_);
                    value_ = (i === 0 ? null : i);
                    if(Application.HasOption(field.Options,'nonull') && !value_)
                        value_ = 0;

                } else if (field.Type == "Code") {

                    value_ = value_.toString().toUpperCase();

                } else if (field.Type == "Boolean") {

                    if (value_ == "Yes" || value_ == true || value_ == "true") {
                        value_ = true;
                    } else {
                        value_ = false;
                    }
                }
            }

            if (field.OptionCaption != "" && value_ != null && field.Type != "BigText" && field.CustomControl === '') {

                var found = false;
                var vals = field.OptionString.split(",");
                var captions = field.OptionCaption.split(",");
                for (var i = 0; i < vals.length; i++) {
                    if (value_ == captions[i]) {
                        if (field.Type == "Integer") {
                            value_ = parseInt(vals[i]);
                        } else {
                            value_ = vals[i];
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    for (var i = 0; i < vals.length; i++) {
                        if (captions[i].toLowerCase().indexOf(value_.toLowerCase()) != -1) {
                            value_ = vals[i];
                            found = true;
                            break;
                        }
                    }
                    if (!found)
                        Application.Error("Invalid value: " + value_);
                }
            }

            if (!Application.IsInMobile() && field.LookupDisplayField != "" && value_ == null)
                m_record["FF$" + field.Name] = null;		

            return value_;
        };

        /**
         * Validate a record field.
         * @memberof! PageViewer#
         * @param {string} name_ Field name.
         * @param {any} value_ Value to validate.
         * @param {string} [rowid_] Current row id (grid mode only).
         * @param {boolean} [showLoad_=true] If `true`, show the loading overlay.
         * @returns {void}
         */
        this.RecordValidate = function (name_, value_, rowid_, showLoad_) {
            
            if(!m_record.Temp)
                _base.SetStatus("Saving changes...");

			//Partial refresh.
			m_causedUpdate = null;			
		
            var field = m_form.GetField(name_);
            if (field == null) {
                Application.Error("%LANG:S_FIELDNOTFOUND%: " + name_);
            }

            //#85 - Sanitize value.			
            if (!Application.HasOption(field.Options, "SkipSanitze") && !Application.HasOption(field.Options, "skipsanitize"))
                value_ = Application.SanitizeString(value_);		    
			
			if (value_ == "" || value_ == "null")
                value_ = null;
			
			//Partial refresh.
			if(m_record.NewRecord == false || m_record.Temp)
				m_causedUpdate = name_;
			var skipupdate = _self.SkipPageRefresh();
			
            //Show load?
            showLoad_ = Default(showLoad_, true);
            if (showLoad_ && !skipupdate)
                _self.ShowLoad();

            _self.DisableKeys(true);
            _self.HideDropdowns();

            m_col = name_;
            m_row = rowid_;

            //Check lookup value.			
            if (field.LookupTable != "" && !m_form.FieldOption(field, "anyvalue") && value_ != null && value_ != "") {
                Application.RunNext(function () {
                    return $codeblock(
                        function () {
                            return Application.LookupRecord(field, _self, value_, function () { });
                        },
                        function (vals) {

                            //if (m_form.Type == "List")
                            //    _self.GetRecordByRowId(rowid_);

                            var f = field.LookupField;
                            if (field.LookupDisplayField != "")
                                f = field.LookupDisplayField;

                            for (var i = 0; i < vals.length; i++) {
                                if (vals[i][f] == value_) {
                                    if (field.LookupDisplayField != "") {
                                        m_record["FF$" + field.Name] = vals[i][field.LookupDisplayField];
                                        m_record.SaveCurrent(null, true);
                                        m_record[field.Name] = vals[i][field.LookupField];
                                        m_comboSelected = true;
                                    }
                                    return vals[i][f];
                                }
                            }

                            for (var i = 0; i < vals.length; i++) {
                                if (vals[i][f].toLowerCase().indexOf(value_.toLowerCase()) != -1) {
                                    if (field.LookupDisplayField != "") {
                                        m_record["FF$" + field.Name] = vals[i][field.LookupDisplayField];
                                        m_record.SaveCurrent(null, true);
                                        m_record[field.Name] = vals[i][field.LookupField];
                                        m_comboSelected = true;
                                    }
                                    return vals[i][f];
                                }
                            }

                            return null;
                        },
                        function (ret) {
                            if (ret == null)
                                Application.Error("Invalid value: " + value_);
                            value_ = ret;
                        },
                        function () {
                            return _self.FinishValidate(name_, value_, rowid_, showLoad_, field);
                        }
                    );
                });
                return;
            }

            Application.RunNext(function () {                
                return _self.FinishValidate(name_, value_, rowid_, showLoad_, field);
            },null,'VALIDATE'+name_);

        };

        /**
         * Validate a record field (used by the RecordValidate function).
         * @memberof! PageViewer#
         * @protected
         * @param {string} name_ Field name.
         * @param {any} value_ Value to validate.
         * @param {string} rowid_ Current row id (grid mode only).
         * @param {boolean} showLoad If `true`, show the loading overlay.
         * @param {PageField} field_ Page field definition.
         * @returns {JQueryPromise} Promises to return after validating the field.
         */
        this.FinishValidate = function (name_, value_, rowid_, showLoad_, field_) {            

			//Partial refresh.			
            var skipupdate = _self.SkipPageRefresh(),
                skiptrans = m_record.Temp && Application.HasOption(m_form.Options,"noupdatetrans");
			
            if (field_.LookupDisplayField != "" && value_ != "" && value_ != null && field_.CustomControl == "" && m_comboSelected) {
                value_ = m_record[name_];
            }			

            m_comboSelected = false;            

            return $codeblock(

            function(){
                if(!skiptrans)
                    return Application.BeginTransaction();
            },

            function () {
                //Get the record (List form only).                    
                if (m_form.Type == "List") {
                    _self.GetRecordByRowId(rowid_);
                }
                return _self.Validate(name_, value_, rowid_, field_);
            },

            function(){
                if(!skiptrans)
                    return Application.CommitTransaction();
            },

            function () {

                m_col = null;
                m_row = null;									

                if (m_form.Type == "List")
                    _self.DisableKeys(false);

                //A change has been made.
                _self.ChangeMade();

                //Reload page?
                if (field_.ReloadOnValidate || m_form.Type == "Card") {
                        if(m_record.UnsavedChanges() || Application.HasOption(m_form.Options,"skipupdate")){
                            return $codeblock(
                                function(){
                                    return _self.UpdateControls(false);
                                },
                                function(){
                                    _self.HideLoad();
                                }
                            );
                        }else{
                            return _self.Update(false, false);
                        }                    
					} else {
						if(!skipupdate)
							_self.HideLoad();
					}
				},
				
				function(){
					
					//Partial refresh.
                    m_causedUpdate = null;	
                    if(!m_record.Temp)
                        _base.SetStatus("Changes have been saved");
				}

			);
        };

        /**
         * Run the record validate trigger and insert/modify the record.
         * @memberof! PageViewer#
         * @protected
         * @param {string} name_ Field name.
         * @param {any} value_ Value to validate.
         * @param {string} rowid_ Current row id (grid mode only).
         * @param {PageField} field_ Page field definition.
         * @returns {void}
         */
        this.Validate = function (name_, value_, rowid_, field_) {

            if (!m_form.FieldOption(field_, "anyvalue"))
                value_ = _self.FixValue(field_, value_);

            return $codeblock(

            function () {

                if (m_temp) {
                    if (!field_.Mandatory || (value_ != null && value_ != "null" && value_ != 0 && value_ != "") || field_.OptionCaption != "") {
                        _self.TempChanged(true, true);
                    }
                }

                //Validate field.
                return m_record.Validate(name_, value_, _self);
            },

            function (r) {

                if (r == false)
                    return false;

                //OK Button handles modify.
                if (m_temp)
                    return r;

                if (r.NewRecord == true) {
                    return r.Insert(true, null, _self);
                } else {
                    return r.Modify(true, _self);
                }

                return r;
            },

            function (r) {

                if (r == false)
                    return;

                if (m_temp) {
                } else {
                    _self.TempChanged(false, false);
                }

                //Save the record.
                if (r == null)
                    Application.Error("Invalid record");

                m_record = r;
                m_record.Temp = m_temp;

				//Update filters.
				if(!Application.HasOption(m_form.Options,"skipupdatefilters")){
					var filters = Application.GetFilters(m_view);
					for (var i = 0; i < filters.length; i++) {
                        var f = m_record.GetField(filters[i][0]);
                        if(f){

                            //Date filter fix.
                            if(f.Type=="Date" && f.Value){
                                if(Object.prototype.toString.call(f.Value) === "[object Date]"){
                                    f.Value = Application.FormatDate(f.Value);
                                }
                            }

                            var field = m_table.Column(f.Name);
                            if (field && filters[i][1] != f.Value && field.PrimaryKey && f.Value !== null){
                                m_record.Filter(filters[i][0], f.Value);
                            }
                        }
					}
				}
				
				//Update UID
				if(!m_record.UnsavedChanges()){
					m_uid = m_id + m_record.View;
					_base.UID(m_uid);
				}
				
                //Update xrec. 
                if (!m_temp && !m_record.UnsavedChanges()) //Issue #78 - Xrec issue in mobile
                    m_record.UpdateXRec();

				var skipupdate = _self.SkipPageRefresh();
					
                //Refresh the row.								
                if (m_form.Type == "List" && !skipupdate) {

                    m_record.RowId = rowid_;
                    var grd = _self.GetPageGrid();
                    grd.SetDataRow(rowid_, _self.ConvertRecordToData());

                    //Refresh totals.
                    if (grd.Footer() == true)
                        _self.GridLoadFooter(grd);

					return _self.UpdateSubPages(true, false);
                }
            }
        );

        };

        /**
         * Clear the record filters and refresh the page.
         * @memberof! PageViewer#
         * @returns {void}
         */
        this.ClearFilters = function () {

            //m_record.Filters = new Array();
            //m_record.View = m_view;

            for (var i = 0; i < m_form.Fields.length; i++) {
                m_record.Filter(m_form.Fields[i].Name);
                m_record.Filter("FF$" + m_form.Fields[i].Name);
                if (m_layout) {                    
                    m_layout.Filters[m_form.Fields[i].Name] = null;
                    m_layout.Filters["FF$"+m_form.Fields[i].Name] = null;
                }
            }

            if (!Application.IsInMobile()) 
                _self.SaveLayout();            
                
            Application.RunNext(_self.Update);
        };

        /**
         * Filter the current record set.
         * @memberof! PageViewer#
         * @param {string} col Column to filter.
         * @param {string} value Value to filter.
         * @param {boolean} [update=true] Update the page after filtering.
         * @param {boolean} [applywildcard=false] Wrap `value` in wild cards.
         * @returns {JQueryPromise|void} Promises to return after updating the page (if `update` = true).
         */
        this.Filter = function (col, value, update, applywildcard) {

            update = Default(update, true);
            applywildcard = Default(applywildcard, false);

            //#42 - Add wildcard to filter
            var field = m_record.GetField(col);
            if (field && applywildcard) {
                if (field.Type.within(["Code", "Char", "Text", "BigText"]) || col.indexOf("FF$") == 0) {
                    if (value && !Application.HasFilterChar(value)) {
                        if (value.indexOf("*") != 0)
                            value = "*" + value;
                        if (value[value.length - 1] != "*")
                            value += "*";
                    }
                }
            }

            m_record.Filter(col, value);

            if (!Application.IsInMobile()) {
                if (!m_layout) {
                    m_layout = new Object();                    
                }
                m_layout.Filters = Default(m_layout.Filters,new Object());
                m_layout.Filters[col] = value;
                _self.SaveLayout();
            }

            if (update)
                return _self.Update();
        };

        //#endregion

        //#region Temp Record Functions

        /**
         * Get/set the temp changed flag.
         * @memberof! PageViewer#
         * @param {boolean} [value] If specified, sets the temp changed flag.
         * @returns {boolean|void} Returns the temp changed flag if `value` is not specified.
         */
        this.TempChanged = function (value) {

            if (typeof value != "undefined") {

                m_tempChanged = value;
                m_okClicked = false;

            } else {

                return m_tempChanged;
            }
        };

        //#endregion

        //#region Card Form Functions

        /**
         * Load a card style page.
         * @memberof! PageViewer#
         * @protected
         * @returns {JQueryPromise} Promises to return after loading the card page.
         */
        this.LoadCardForm = function () {

            var w = $wait();

            $code(

            _self.LoadTabs,

            function () {

                //Add padding to the top.
                if(!Application.IsInMobile()){
                    $('#' + _base.ID() + "main").css("padding-top", "10px");
                    $('#' + _base.ID() + "main").css("padding-bottom", "10px");
                }
        
                _base.AddColumns();

                $('#' + _base.ID() + "LeftColumn").css("display", "none");
                $('#' + _base.ID() + "RightColumn").css("display", "none");

                if (m_options.factbox || m_options.dialog == true || m_options.singleColumn == true)
                    _base.SingleColumn(true);

                var tabindex = 10;
                var tabs = m_form.GetTabs();

                //Apply field options.
                for (var j = 0; j < m_form.Fields.length; j++) {

                    if (m_form.FieldOption(m_form.Fields[j], "mobileonly") && !Application.IsInMobile())
                        m_form.Fields[j].Hidden = true;
                    if (m_form.FieldOption(m_form.Fields[j], "desktoponly") && Application.IsInMobile())
                        m_form.Fields[j].Hidden = true;
					
					if (m_form.FieldOption(m_form.Fields[j], "offlineonly") && !Application.IsOffline())
                        m_form.Fields[j].Hidden = true;
                    if (m_form.FieldOption(m_form.Fields[j], "onlineonly") && Application.IsOffline())
                        m_form.Fields[j].Hidden = true;

                    if (Application.IsInMobile()) {
                        if (m_form.Fields[j].Importance == "Additional" && m_options.mobilegrideditor != null) {
                            m_form.Fields[j].Importance = "Standard";
                        }
                    }
                }

                for (var j = 0; j < tabs.length; j++) { //Tab Loop

                    var skiptab = false;
                    if (!skiptab) {
                        for (var add = 0; add < 2; add++) { //Additonal Fields Loop

                            if (add == 1 && Application.IsInMobile())
                                break;

                            var fields = m_form.GetFieldsByTab(tabs[j].Name, add);

                            //Used for tab index calclulation.
                            var half = Math.round(fields.length / 2);
                            var left = false;
                            var hasAdditonal = false;

                            for (var k = 0; k < fields.length; k++) { //Field Loop

                                //Get the field.
                                var field = fields[k];

                                if (field.Hidden == false) {

                                    if (field.Importance == "Additional")
                                        hasAdditonal = true;

                                    field.TabIndex = tabindex;
                                    tabindex += 1;

                                    left = false;
                                    if (k + 1 <= half || m_form.FieldOption(field, "leftcolumn") == true)
                                        left = true;
                                    if (m_form.FieldOption(field, "rightcolumn") == true)
                                        left = false;

                                    if (field.CustomControl && field.CustomControl != "") {
                                        _self.AddCustomControl(field, left);
                                    } else if (field.LookupTable != '' || field.OptionCaption != "") {
                                        _self.AddComboField(field, left);
                                    } else if (field.IncrementDelta != 0 && !Application.IsInMobile()) {
                                        _self.AddSpinnerField(field, left);
                                    } else if (field.Type == "Date") {
                                        _self.AddDateField(field, left);
                                    } else if (field.Type == "DateTime" && !Application.IsInMobile()) {
                                        _self.AddDateTimeField(field, left);
                                    } else if (field.Type == "Boolean") {
                                        _self.AddCheckboxField(field, left);
                                    } else if (field.Type == "Time") {
                                        _self.AddTimeField(field, left);
                                    } else {
                                        _self.AddTextField(field, left);
                                    }
                                }
                            }

                            if (hasAdditonal) {
                                var tab = _self.GetTab(tabs[j].Name);
                                var tabname = tabs[j].Name;
                                if (tabname == "")
                                    tabname = "General";
                                tab.Main().append("<div id='additional" + _base.ID() + tabname + "' style='cursor: pointer; padding: 5px; width: 200px;'><table><tr><td><img src='%SERVERADDRESS%Images/Icons/icon-arrowright.png' /></td><td id='addtext" + _base.ID() + tabname + "'> Show more fields</td></tr></table></div>");
                                $("#additional" + _base.ID() + tabname).on("click", function () {
                                    var tabname = $(this).attr("id").replace("additional" + _base.ID(), "");
                                    if ($("#addtext" + _base.ID() + tabname).text() == " Show more fields") {
                                        _self.HideAdditonal(false, tabname);
                                        $("#addtext" + _base.ID() + tabname).text(" Hide additional fields");
                                    } else {
                                        _self.HideAdditonal(true, tabname);
                                        $("#addtext" + _base.ID() + tabname).text(" Show more fields");
                                    }
                                    _self.Resize();
                                });
                            }
                        }
                    }
                }
            }
        );

            return w.promise();

        };

        /**
         * Load the page tabs.
         * @memberof! PageViewer#
         * @protected
         * @returns {JQueryPromise} Promises to return after loading the tabs.
         */
        this.LoadTabs = function () {

			if(m_options.mobilegrideditor)
				return;
		
            var w2 = $wait();

            var subpages = 0;

            $code(

            function () {

                if (m_form.TabList.length > 0)
                    return $loop(function (i) {

                        var w = $wait();

                        $code(

                            function () {

                                var tab = m_form.TabList[i];

                                if (Application.IsInMobile() && m_form.TabOption(tab, "desktoponly"))
                                    return;

                                if (!Application.IsInMobile() && m_form.TabOption(tab, "mobileonly"))
                                    return;

                                if (!Application.IsOffline() && m_form.TabOption(tab, "offlineonly"))
                                    return;

                                if (Application.IsOffline() && m_form.TabOption(tab, "onlineonly"))
                                    return;

                                if (tab.ID != "") {

                                    _self.OnShow();
                                    var block = false;
                                    subpages += 1;

                                    if (m_form.TabOption(tab, "block"))
                                        block = true;

                                    var pos = null;
                                    if (m_options.homepage == true) {

										if (m_form.SubPages() == 1) {
											pos = Application.position.rolefull;
                                        }else if (m_form.SubPages() <= 2) {
                                            pos = Application.position.rolehalf;
                                        } else if (m_form.SubPages() == 3) {
                                            if (subpages <= 2) {
                                                pos = Application.position.rolequarter;
                                            } else {
                                                pos = Application.position.rolehalf;
                                            }
                                        } else {
                                            pos = Application.position.rolequarter;
                                        }

                                    }

                                    var subpage = new PageViewer({ 
										id: tab.ID, 
										parent: _self, 
										factbox: m_form.TabOption(tab, "factbox"), 
										caption: tab.Name, 
										block: block, 
										view: tab.View, 
                                        position: pos, 
                                        workspace: m_options.workspace,
										homepage: m_options.homepage,
                                        showtitles: m_options.showtitles, 
										promoted: m_form.TabOption(tab, "promoted"), 
										height: Application.OptionValue(tab.Options, "height"),
										minimized: Application.OptionValue(tab.Options, "minimized"),
										removetitle: m_form.TabOption(tab,"removetitle")										
									});
									subpage.TabName(tab.Name);
                                    return subpage.Open();

                                } else {
                                    _self.CreateTab(tab);
                                }
                            },

                            function (pge) {

                                //if (pge && Application.IsMobileDisplay() && m_options.homepage == true && subpages == 1) {
                                //    pge.ToggleState();
                                //}
																
                                //Continue?
                                if (i < m_form.TabList.length - 1)
                                    return $next;															
                            }
                        );

                        return w.promise();

                    });

            }
        );

            return w2.promise();

        };

        /**
         * Create a tab window and add to the current page.
         * @memberof! PageViewer#
         * @protected
         * @returns {void}
         */
        this.CreateTab = function (tab_) {

            //var icon = Default(Application.OptionValue(tab_.Options, "icon"), m_form.Icon);

            var pos = Application.position.normal;
            var workspace = "#AppWorkspace";
            if (m_form.TabOption(tab_, "factbox") && !Application.IsInMobile()) {
                workspace = "#AppSideWorkspace";
                pos = Application.position.right;
            } else if (m_form.TabOption(tab_, "block")) {
                pos = Application.position.block;
            }

			var title = tab_.Name;
            //var title = UI.IconImage(icon) + ' ' + tab_.Name;
            //title = title.replace('ActionIcon', 'Icon').replace('width:15px;height:15px', 'width:30px;height:30px');
            var win = new Window();
            win.Create(title, {
                closebutton: false,
                workspace: m_options.workspace || $(workspace),
                shortcutWorkspace: null,
                position: pos,
                removetitle: m_form.TabOption(tab_,"removetitle"),
                type: "Card",
                homepage: m_options.homepage,
                showtitles: m_options.showtitles
            });

            var h = Application.OptionValue(tab_.Options, "height");
            if(!Application.IsInMobile() && h)
                $('#' + win.ID()).height(h+"px");

            //Add padding to the top.
            if(!Application.IsInMobile()){
                $('#' + win.ID() + "main").css("padding-top", "10px");
                $('#' + win.ID() + "main").css("padding-bottom", "10px");
            }

            win.Caption = tab_.Name;
            win.AddColumns();
            if (m_form.TabOption(tab_, "factbox") || Application.IsInMobile() || m_options.singleColumn)
                win.SingleColumn(true);
            win.HideActions();
            win.ShowLoad();

            if (Application.IsInMobile()) {
                win.Hide();
                //if (Application.IsMobileDisplay())
                    //win.ToggleState();
            }
			
			//Load toggle state
			if((m_layout && m_layout.tabs && m_layout.tabs.length >= m_tabs.length && m_layout.tabs[m_tabs.length] > 0) || Application.HasOption(tab_.Options,"minimized"))
				win.ToggleState(true);


            //Override window methods.       
            win.OnError = _self.OnError;
            win.GetInfo = _self.GetInfo;
            win.ClearLayout = _self.ClearLayout;
            win.ClearCache = _self.ClearCache;
            win.OnKeyPress = _self.OnKeyPress;
			win.OnToggle = _self.OnToggle;
			
			win.TabName(tab_.Name);

            m_tabs.push(win);
            _base.AddSubWindow(win);
        };

        /**
         * Get a tab by name.
         * @memberof! PageViewer#
         * @protected
         * @param {string} name_ Tab name.
         * @returns {Window} Returns the tab window if found.
         */
        this.GetTab = function (name_) {
            if (name_ != "General") {
                for (var i = 0; i < m_tabs.length; i++) {
                    if (m_tabs[i].Caption == name_) {
                        return m_tabs[i];
                    }
                }
            }
            return _base;
        };

        /**
         * Get a tab column (for placing a control).
         * @memberof! PageViewer#
         * @protected
         * @param {string} tab_ Tab name.
         * @param {Control} cont_ Control to place.
         * @param {boolean} left_ If `true` gets the left column.
         * @returns {JQueryStatic} Returns the column.
         */
        this.GetTabColumn = function (tab_, cont_, left_) {
			
			var ignore = cont_.IgnoreColumns();
			if(!ignore && cont_.Field() && Application.HasOption(cont_.Field().Options,"ignorecolumns"))
                ignore = true;
			
            if (ignore) {
                $('#' + tab_.ID() + "LeftColumn").css("padding-bottom", "0px");
                $('#' + tab_.ID() + "RightColumn").css("padding-bottom", "0px");
                return tab_.Main();
            } else {
                $('#' + tab_.ID() + "LeftColumn").css("display", "inline-block");
                $('#' + tab_.ID() + "RightColumn").css("display", "inline-block");
                return tab_.GetColumn(left_);
            }
        };

        /**
         * Add a custom control to the page.
         * @memberof! PageViewer#
         * @param {PageField} field_ Page field definition.
         * @param {boolean} left_ If `true` adds the control to the left column.
         * @returns {void}
         */
        this.AddCustomControl = function (field_, left_) {

            var tab = _self.GetTab(field_.TabName);

            var cont = null;
            eval("cont = new " + field_.CustomControl + "(field_, _self);");
            cont.OnValueChange = this.RecordValidate;
            if (Application.IsInMobile()) {
                cont.CreateMobile(this.GetTabColumn(tab, cont, left_));
            } else {
                cont.CreateDesktop(this.GetTabColumn(tab, cont, left_));
            }

            m_controls.push(cont);
        };

        /**
         * Add a text control to the page.
         * @memberof! PageViewer#
         * @param {PageField} field_ Page field definition.
         * @param {boolean} left_ If `true` adds the control to the left column.
         * @returns {void}
         */
        this.AddTextField = function (field_, left_) {

            var tab = _self.GetTab(field_.TabName);

            var txt = new Textbox(field_, _self);
            txt.OnValueChange = this.RecordValidate;
            txt.Create(this.GetTabColumn(tab, txt, left_));

            m_controls.push(txt);
        };

        /**
         * Add a time control to the page.
         * @memberof! PageViewer#
         * @param {PageField} field_ Page field definition.
         * @param {boolean} left_ If `true` adds the control to the left column.
         * @returns {void}
         */
        this.AddTimeField = function (field_, left_) {

            var tab = _self.GetTab(field_.TabName);

            var txt = new TimePicker(field_, _self);
            txt.OnValueChange = this.RecordValidate;
            txt.Create(this.GetTabColumn(tab, txt, left_));

            m_controls.push(txt);
        };

        /**
         * Add a spinner control to the page.
         * @memberof! PageViewer#
         * @param {PageField} field_ Page field definition.
         * @param {boolean} left_ If `true` adds the control to the left column.
         * @returns {void}
         */
        this.AddSpinnerField = function (field_, left_) {

            var tab = _self.GetTab(field_.TabName);

            var txt = new Spinner(field_, _self);
            txt.OnValueChange = this.RecordValidate;
            txt.Create(this.GetTabColumn(tab, txt, left_));

            m_controls.push(txt);
        };

        /**
         * Add a date control to the page.
         * @memberof! PageViewer#
         * @param {PageField} field_ Page field definition.
         * @param {boolean} left_ If `true` adds the control to the left column.
         * @returns {void}
         */
        this.AddDateField = function (field_, left_) {

            var tab = _self.GetTab(field_.TabName);

            var dte = new DatePicker(field_, _self);
            dte.OnValueChange = this.RecordValidate;
            dte.Create(this.GetTabColumn(tab, dte, left_));

            m_controls.push(dte);
        };

        /**
         * Add a date time control to the page.
         * @memberof! PageViewer#
         * @param {PageField} field_ Page field definition.
         * @param {boolean} left_ If `true` adds the control to the left column.
         * @returns {void}
         */
        this.AddDateTimeField = function (field_, left_) {

            var tab = _self.GetTab(field_.TabName);

            var dte = new DateTimePicker(field_, _self);
            dte.OnValueChange = this.RecordValidate;
            dte.Create(this.GetTabColumn(tab, dte, left_));

            m_controls.push(dte);
        };

        /**
         * Add a combobox control to the page.
         * @memberof! PageViewer#
         * @param {PageField} field_ Page field definition.
         * @param {boolean} left_ If `true` adds the control to the left column.
         * @returns {void}
         */
        this.AddComboField = function (field_, left_) {

            var tab = _self.GetTab(field_.TabName);

            var cmb = new Combobox(field_, _self);
            cmb.OnValueChange = this.RecordValidate;
            cmb.Create(this.GetTabColumn(tab, cmb, left_));

            m_controls.push(cmb);
        };

        /**
         * Add a checkbox control to the page.
         * @memberof! PageViewer#
         * @param {PageField} field_ Page field definition.
         * @param {boolean} left_ If `true` adds the control to the left column.
         * @returns {void}
         */
        this.AddCheckboxField = function (field_, left_) {

            var tab = _self.GetTab(field_.TabName);

            var chk = new Checkbox(field_, _self);
            chk.OnValueChange = this.RecordValidate;
            chk.Create(this.GetTabColumn(tab, chk, left_));

            m_controls.push(chk);
        };

        /**
         * Add a sub page to the window.
         * @memberof! PageViewer#
         * @protected
         * @param {PageViewer} page_ Page to add.
         * @returns {void}
         */
        this.AddSubpage = function (page_) {
            m_subPages.push(page_);
            _base.AddSubWindow(page_);
        };
        
        /**
         * Remove a sub page from the window.
         * @memberof! PageViewer#
         * @protected
         * @param {number} index_ Index of the page to remove.
         * @returns {void}
         */
		this.RemoveSubpage = function (index_) {
            for(var i = 0; i < m_subPages.length; i++){
				if(i == index_){
					m_subPages[i].Remove();
					_base.RemoveSubWindow(m_subPages[i].ID());					
					m_subPages.splice(i,1);
					return;
				}
			}            
        };
        
        /**
         * Remove a tab from the window.
         * @memberof! PageViewer#
         * @protected
         * @param {number} index_ Index of the tab to remove.
         * @returns {void}
         */
		this.RemoveTab = function (index_) {
            for(var i = 0; i < m_tabs.length; i++){
				if(i == index_){
					m_tabs[i].Remove();
					_base.RemoveSubWindow(m_tabs[i].ID());					
					m_tabs.splice(i,1);
					return;
				}
			}            
        };

        //#endregion

        //#region List Form Functions

        /**
         * Load a list style page.
         * @memberof! PageViewer#
         * @protected
         * @returns {JQueryPromise} Promises to return after loading the list page.
         */
        this.LoadListForm = function () {

            return $codeblock(

                _self.LoadTabs,

                function () {
                    //Load the page grid.
                    _self.LoadPageGrid();
                }
            );

        };

        /**
         * Convert the current record set to grid data.
         * @memberof! PageViewer#
         * @protected
         * @returns {object[]} Returns the grid data.
         */
        this.GenerateGridData = function () {

            var recs = new Array();
            if (m_record.Count > 0){
				m_record.First();
                do {
                    recs.push(_self.ConvertRecordToData());
                }
                while (m_record.Next())
			}
            return recs;
        };

        /**
         * Convert the current record to grid data.
         * @memberof! PageViewer#
         * @protected
         * @returns {object} Returns the grid data.
         */
        this.ConvertRecordToData = function () {

            var r = new Record();
            r.Copy(m_record);
            r.RowId = r.Position;
            r.RowId++;
            return r;
        };

        //#endregion

        //#region Grid Functions

        /**
         * Export the current page data to a CSV file.
         * @memberof! PageViewer#
         * @returns {void}
         */
        this.ExportCSV = function () {

            Application.RunNext(function(){
                return $codeblock(
                    function(){
                        
                        var flds = m_form.Fields.map(function(col){
                            return col.Name;
                        });
                        
                        var vw = Application.RemovePagingFromView(m_record.View);
                        Application.maxRecords = 100000;
                        var r = [];
                        FINDSET(m_record.Table,vw,function(recs){
                            recs.DatabaseTable(m_record.DatabaseTable());
                            Application.maxRecords = 10000;
                            if(recs.Count > 0)
                                do{
                                    var r2 = new Record();
                                    r2.Copy(recs);
                                    r.push(r2);
                                }while(recs.Next());
                            return r;
                        },flds);
                    },
                    function(r){
                        var csv_data = _self.GenerateCSVData(r);
                        Application.FileDownload.DownloadText(m_record.Table+".csv", csv_data, "text/csv;charset=utf-8;");
                    }
                );
            });            

        };

        /**
         * Convert record data to csv format.
         * @memberof! PageViewer#
         * @protected
         * @param {object[]} data_ Record data to convert.
         * @returns {string} Returns the csv string.
         */
        this.GenerateCSVData = function (data_) {

            var csvFile = '';

            var hdrrow = [];
            for (var j = 0; j < m_form.Fields.length; j++) {    
                if(!m_form.Fields[j].Hidden)            
                    hdrrow.push(m_form.Fields[j].Caption);
            }
            csvFile += ProcessCSVRow(hdrrow);

            for (var i = 0; i < data_.length; i++) {
                var row = [];
                for (var j = 0; j < m_form.Fields.length; j++) {  
                    if(!m_form.Fields[j].Hidden){                  
                        var val = Default(data_[i]["FF$" + m_form.Fields[j].Name], data_[i][m_form.Fields[j].Name]);                    
                        row.push(FormatData(val, m_form.Fields[j].Type));                    
                    }
                }
                csvFile += ProcessCSVRow(row);
            }
            return csvFile;
        };

        /**
         * Format data value to CSV format.
         * @param {any} value_ Value to convert.
         * @param {string} type_ Data type.
         * @returns {string} Returns the formatted value.
         */
        function FormatData(value_, type_) {

            if (value_ == null || typeof value_ == "undefined")
                return "";

            //Dates and times
            if (type_ == "Date") {
                return Application.FormatDate(value_);
            } else if (type_ == "DateTime") {
                return Application.FormatDate(value_, "DD/MM/YYYY hh:mm a");
            } else if (type_ == "Time") {
                return Application.FormatDate(value_, "hh:mm a");            
            }

            return value_;
        };

        /**
         * Convert a row of strings to a CSV row.
         * @param {string[]} row Row of strings to convert.
         * @returns {string} Returns the CSV row.
         */
        function ProcessCSVRow(row) {
            var finalVal = '';
            for (var j = 0; j < row.length; j++) {
                var innerValue = row[j] === null ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };
                var result = innerValue.replace(/"/g, '""');
				result = result.replace(/\<br\>/g,'\n');
				result = result.replace(/\<br\/\>/g,'\n');
				
				result = Application.SanitizeString(result);
				
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\r\n';
        };

        /**
         * Load the page grid.
         * @memberof! PageViewer#
         * @protected
         * @returns {void} 
         */
        this.LoadPageGrid = function () {

            var grd = new Grid(null, _self);

            //Add fields.        
            var totals = false;
            for (var i = 0; i < m_form.Fields.length; i++) {

                //Get the field.
                var field = m_form.Fields[i];

                var skip = false;
                if (Application.IsInMobile() && field.Importance == "Additional")
                    skip = true;

                if (m_form.FieldOption(field, "mobileonly") && !Application.IsInMobile())
                    skip = true;
                if (m_form.FieldOption(field, "desktoponly") && Application.IsInMobile())
                    skip = true;

                if (m_form.FieldOption(field, "cardonly") && Application.IsInMobile())
                    skip = true;

                if (!skip) {

                    //Check totals.
                    if (field.Totals == true)
                        totals = true;

                    //Get width from layout.
                    if (m_layout && m_layout.columns) {
                        for (var j = 0; j < m_layout.columns.length; j++) {
                            if (m_layout.columns[j].name == field.Name) {
                                field.Width = m_layout.columns[j].width;
                                break;
                            }
                        }
                    }

                    //Add the field to the grid.
                    grd.AddColumn(field);
                }
            }
            
            grd.Create(_base, totals);            

            //Load layout.
            if (m_layout && m_layout.columns) {
                for (var i = 0; i < m_layout.columns.length; i++) {
                    try {
                        grd.SetColumnHidden(m_layout.columns[i].name, m_layout.columns[i].hidden);
                    } catch (e) {
                    }
                }
            }

            //Overrides.
            grd.OnCellSubmit = _self.GridCellSubmit;
            grd.OnDoubleClick = _self.GridDoubleClick;
            grd.OnLoadFooter = _self.GridLoadFooter;
            grd.OnResizeCol = _self.SaveLayout;
            grd.OnColumnChooserDone = _self.SaveLayout;
            grd.OnRowSelect = _self.GridRowSelect;

            //Add the grid to controls.
            m_controls.push(grd);
        };

        /**
         * Function that runs on select of a grid row.
         * @memberof! PageViewer#
         * @protected
         * @param {number} rowid Row ID of the selected row.
         * @returns {void}
         */
        this.GridRowSelect = function (rowid) {
            setTimeout(function () {                
                Application.RunNext(function () {
                    if(_self){
                        _self.GetRecordByRowId(rowid);
                        if (m_subPages.length > 0) {
                            return _self.UpdateSubPages(true, false);
                        }
                    }
                });
            }, 500);
        };

        /**
         * Get the page grid.
         * @memberof! PageViewer#
         * @returns {Grid} Returns the page grid.
         */
        this.GetPageGrid = function () {

            for (var i = 0; i < m_controls.length; i++) {

                if (m_controls[i].ObjectType() == "Grid")
                    return m_controls[i];

            }

            return null;
        };

        /**
         * Get a record by row id.
         * @memberof! PageViewer#
         * @param {number} rowid Row ID of the record.
         * @returns {void}
         */
        this.GetRecordByRowId = function (rowid) {

            if (m_record.Count == 0 || rowid == null)
                return;

            m_record.First();
            do {
                if (rowid == (m_record.Position + 1))
                    break;
            } while (m_record.Next());

        };

        /**
         * Get a record by rec id.
         * @memberof! PageViewer#
         * @param {string} recid Rec ID of the record.
         * @returns {void}
         */
        this.GetRecordByRecId = function (recid) {

            if (m_record.Count == 0 || recid == null)
                return;

            m_record.First();
            do {
                if (m_record.Record.RecID == recid)
                    break;
            } while (m_record.Next());

        };

        /**
         * Update the page grid.
         * @memberof! PageViewer#
         * @protected
         * @param {Grid} cont Grid control.
         * @param {string} selectedrec Selected record.
         * @returns {JQueryPromise} Promises to return after updating the grid.
         */
        this.UpdateGrid = function (cont, selectedrec) {

            var w = $wait();

            $code(

                _self.GenerateGridData,

                function (data) {

                    if (data == null)
                        data = new Array();
                    cont.DataSource(data);
                    return cont.Bind(selectedrec);
                }

            );

            return w.promise();
        };

        /**
         * Select a grid row by record id.
         * @memberof! PageViewer#
         * @protected
         * @param {Grid} cont Grid control.
         * @param {string} selectedrec Selected record.
         * @returns {number} Returns the index of the selected row.
         */
        this.SelectRowByRec = function (cont, selectedrec) {
            var data = cont.DataSource();
            for (var i = 0; i < data.length; i++) {
                if (data[i].Record.RecID == selectedrec) {
                    cont.SelectRow(data[i].RowId);
                    return i;
                }
            }
            return 0;
        };

        /**
         * Function to run on resize of a grid column.
         * @memberof! PageViewer#
         * @protected
         * @returns {void}
         */
        this.GridResizeCol = function () {
            _self.SaveLayout();
        };

        /**
         * Function to run on double click of a grid row.
         * @memberof! PageViewer#
         * @protected
         * @param {number} rowid Row ID of the clicked on row.
         * @param {number} iRow Row index.
         * @param {number} iCol Column index.
         * @param {Event} e Click event.
         * @returns {void}
         */
        this.GridDoubleClick = function (rowid, iRow, iCol, e) {

            if (!m_form.DoubleClickAction() && !m_enableEditMode)
                return;

			_self.ShowLoad();
			
            $thread(function () {

                var w = $wait();

                $code(

                function () {

                    _self.GetRecordByRowId(rowid);

                    if (Application.IsInMobile() && m_enableEditMode) {
                        return $codeblock(
                            function () {
                                
                                var p = new Page();
                                p.Name = m_id;
                                p.Copy(m_form);
                                p.Type = "Card";
								
                                var rec = new Record();
                                rec.Copy(m_record);
                                rec.Count = 1;
                                rec.Position = 0;
								
								var t = new Object();
								app_deepTransferObjectProperties.call(t, m_table);
								
                                var pv = new PageViewer({ id: m_id, caption: _base.Title(), page: p, table: t, dialog: true, record: rec, view: m_record.View, mobilegrideditor: true, parentviewer: _self });
                                pv.CloseFunction(function(){
									
									if (Application.HasOption(m_form.Options, "temp") && !Application.HasOption(m_form.Options, "savetemp")){
										m_record.TransferFields(pv.Record());
										m_record.SaveCurrent();
									}
									
									return _self.Update();
								});
                                return pv.Open();
                            }
                        );
                    }

                    return _self.RunAction(m_form.DoubleClickAction().Name, true);
                },
				
				_self.HideLoad
            );

                return w.promise();

            });

        };

        /**
         * Function to run on submit of a grid cell.
         * @memberof! PageViewer#
         * @protected
         * @param {number} rowid Row ID of the clicked on row.
         * @param {string} cellname Name of the column.
         * @param {any} value Value of the cell.
         * @param {number} iRow Row index.
         * @param {number} iCol Column index.         
         * @returns {void}
         */
        this.GridCellSubmit = function (rowid, cellname, value, iRow, iCol) {

            _self.RecordValidate(cellname, value, rowid);

            return value; //Must return the value.
        };

        /**
         * Function to run on load of the grid footer.
         * @memberof! PageViewer#
         * @protected
         * @param {Grid} grd Grid control.
         * @returns {void}
         */
        this.GridLoadFooter = function (grd) {
            var data = new Object();
            for (var i = 0; i < m_form.Fields.length; i++) {
                var field = m_form.Fields[i];
                if (field.Totals == true) {
                    var d = Application.Fire("SumColumn", field.Name, m_record);
                    d = Default(d, null);
                    if (d != null) {
						if(d.toFixed){
							data[field.Name] = d.toFixed(2);
						}else{
							data[field.Name] = d;
						}
                    } else {
                        
						data[field.Name] = grd.SumColumn(field.Name);
						
						//Decimal fix.
						if(field.Type == "Integer")
							data[field.Name] = parseInt(data[field.Name]);
						if(field.Type == "Decimal")
							data[field.Name] = +parseFloat(data[field.Name]).toFixed(2);
                    }
                }
            }
            grd.Footer(data);
        };

        //#endregion

        //#region Action Functions

        /**
         * Run a page action.
         * @memberof! PageViewer#
         * @param {string} name_ Action name.
         * @param {boolean} [trans_=false] If `true`, uses a database transaction. 
         * @returns {JQueryPromise} Promises to return after running the action.
         */
        this.RunAction = function (name_, trans_) {

            _self.Save();
            m_delete = null;

            var action = m_form.GetAction(name_);
            if (action == null)
                Application.Error("%LANG:S_ACTIONNOTFOUND%: " + name_);

            m_actionsQueue = 1;

            if (m_form.Type == "Card") {

                return _self.RunIndividualAction(name_, trans_, false);

            } else {

                if (m_customControl != null)
                    return _self.RunIndividualAction(name_, trans_, false);

                var grd = _self.GetPageGrid();
                var id = grd.SelectedRow();
                _self.GetRecordByRowId(id);

                var skipmulti = false;
                if(Application.HasOption(m_form.Options,"rowtemplate"))
                    skipmulti = !Application.HasOption(action.Options,"lineaction");                

                if (grd.SelectedRows().length == 0 || action.Type == "New" || Application.HasOption(action.Options, "singleaction"))
                    return _self.RunIndividualAction(name_, trans_, false);

                if(skipmulti){
                    _self.GetRecordByRecId(grd.SelectedRows()[0]);
                    return _self.RunIndividualAction(name_, trans_, false);
                }

                m_actionsQueue = grd.SelectedRows().length;

                return $loop(function (i) {

                    var w2 = $wait();

                    $code(

                        function () {
                            _self.GetRecordByRecId(grd.SelectedRows()[i]);
                            return _self.RunIndividualAction(name_, trans_, false);
                        },

                        function () {
                            //Continue?
                            if (i < grd.SelectedRows().length - 1)
                                return $next;
                        }
                    );

                    return w2.promise();

                });  
            }             
        };

        /**
         * Run an individual page action.
         * @memberof! PageViewer#
         * @protected
         * @param {string} name_ Action name.
         * @param {boolean} [trans_=false] If `true`, uses a database transaction. 
         * @param {boolean} [hideLoad_=true] If `true`, hide the page loading overlay after the function runs.
         * @returns {JQueryPromise} Promises to return after running the action.
         */
        this.RunIndividualAction = function (name_, trans_, hideLoad_) {

            if (name_ == null || name_ == "")
                return;

            trans_ = Default(trans_, false);
            hideLoad_ = Default(hideLoad_, true);

            //Refresh?
            if (name_ == "Refresh") {
                return _self.Update();
            }

            var action = m_form.GetAction(name_);
            if (action == null)
                Application.Error("%LANG:S_ACTIONNOTFOUND%: " + name_);

            //Reset action view.
            action.View = "";

            //Built in actions.
            if (action.Type == "New") {
                var grd = _self.GetPageGrid();
                if (grd && grd.Loading())
                    Application.Error("Please wait for all the records to load.");
                return _self.OnNew();
            } else if (action.Type == "Delete") {
                return _self.OnDelete();
            } else if (action.Type == "Refresh") {
                return _self.Update();
            }

            if (action.RecordRequired == true && (m_record.Count == 0 || m_record.Record.NewRecord) && !m_nextPageOptions) {
                if (m_record.Count == 0) {
                    Application.Error("Please select a record.");
                } else {
                    Application.Error("The current record must be saved before you can run this action.");
                }
            }

            var w = $wait();

            $code(

            function () {

                if (!hideLoad_)
                    _self.ShowLoad();

                if (trans_)
                    return Application.BeginTransaction();
            },

            function () {

                if (Application.IsInMobile() && action.Type == "Open Page") {
                    window.scrollTo(0, 0);
                    document.body.scrollTop = 0;
                }

                //Get View.
                action.View = m_form.GetActionView(m_record, action);
                action.View = action.View.replace('\\', '\\\\');
				action.View = action.View.replace(/\'/g, '\\\'');

                //Run action code.
                return m_form.RunActionCode(m_record, action, _self);
            },

            function (msg) {

                if (m_form.Name.within(m_designerPages)) {
                    if (action.Name.indexOf("Save") != -1) {
                        m_changed = false;
                    }
                }

                m_actionsQueue -= 1;

                //Show the return message (if any).
                if (msg && msg != "" && _self.ActionsFinished())
                    Application.Message(msg);

                //Open Page action.
                if (action.Type == "Open Page") {
                    eval("Application.RunNext(function openPage() { return _self.OpenPageAction(action, action.ReferencePage, '" + action.View + "');});");
                }
            },

            function () {
                if (trans_)
                    return Application.CommitTransaction();
            },

            function () {

                if (!_self.ActionsFinished())
                    return;

                _self.HideLoad();

                if (action.Type != "Open Page") {
                    if (action.Reload == true) {
                        return _self.Update(true,true,true);
                    } else if (action.ReloadParent == true) {
                        if (m_parent != null) {
                            return m_parent.Update(true,true,true);
                        }
                    }
                }
            }
        );

            return w.promise();
        };

        /**
         * Check if all actions have finished running.
         * @memberof! PageViewer#
         * @protected
         * @returns {boolean} Returns `true` if the actions have finished running.
         */
        this.ActionsFinished = function () {
            return (m_actionsQueue <= 0);
        };

        /**
         * Run an Open Page action.
         * @memberof! PageViewer#
         * @protected
         * @param {PageAction} action Page action definition.
         * @param {string} id Page name to open.
         * @param {string} view Page view to use.
         * @returns {JQueryPromise<PageViewer>} Promises to return after the page has opened.
         */
        this.OpenPageAction = function (action, id, view) {

            if (Application.IsInMobile())
                $("#divSideMenu,#divFactbox").panel("close");

			//Remove search.
			$(".searchdropdown").remove();
		
            return $codeblock(
                function () {

                    var opts = { id: id, view: view, readonly: action.OpenFormReadOnly };
                    if (m_form.ActionOption(action, "dialog") || _base.Dialog())
                        opts.dialog = true;
                    if (_self.ParentWindow() && _self.ParentWindow().Dialog())
                        opts.dialog = true;
                    if (m_nextPageOptions != null && m_nextPageOptions.mode != null)
                        opts.mode = m_nextPageOptions.mode;
                    opts.parentwin = _self.ParentWindow();

                    var flags = Application.OptionValue(action.Options,"flags");
                    if(flags)
                        opts.flags = flags;

                    m_nextPageOptions = null;

                    var page = new PageViewer(opts);

                    //Setup the close function.
                    if (action.Reload == true) {
                        page.CloseFunction(function () {
                            return $codeblock(function(){
                                return _self.Update(true,true,true);
                            });
                        });
                    } else if (action.ReloadParent == true) {
                        page.CloseFunction(function () {
                            var w = $wait();
                            $code(
                                function () {
                                    if (m_parent != null) {
                                        return m_parent.Update(true,true,true);
                                    }
                                }
                            );
                            return w.promise();
                        });
                    }

                    return page.Open();
                }
            );
        };

        /**
         * Show line actions for a grid row (mobile only).
         * @memberof! PageViewer#
         * @protected
         * @param {object} row Row data.
         * @param {number} rowid Row ID.
         * @returns {void}
         */
		this.ShowLineActions = function(row,rowid){
			
			$(".lineactions,.lineactionsoverlay").remove();	
			
			var dd = $("<div class='lineactions'>");
			$("body").append(dd);						
            
            var fieldname = Application.OptionValue(m_form.Options,"hyperlink");
            var field = null;
            if(fieldname !== null)
                field = m_form.GetField(fieldname);
            if(!field)
                for (var j = 0; j < m_form.Fields.length; j++) {
                    var f = m_form.Fields[j];
                    if(Application.HasOption(f.Options,"primary")){
                        field = f;
                        break;
                    }                        
                }
            if(!field)
                field = m_form.GetField('Code');
            if(!field)
                field = m_form.GetField('Description');            
            if(!field)
                Application.Error('Please specify a hyperlink option');
            fieldname = field.Name;
            dd.append("<div class='lineactions-title cut-text'>" +
            FormatData((row["FF$"+fieldname] ? row["FF$"+fieldname] : row[fieldname]),field.Type) + 
            "</div>");

			if(_self.EnableEditMode()){
				var func;
				eval("func = function () {$('.lineactions,.lineactionsoverlay').remove();_self.GridDoubleClick("+rowid+");}");
				_self.AddLineAction("EditRow", "redo", "Edit", func);
			}
			
			var j = 0;
			for(var i = 0; i < m_lineActions.length; i++){
				
				var action = m_lineActions[i];
				
				if(!action.Hide){
					
					var func;
					eval("func = function () {$('.lineactions,.lineactionsoverlay').remove();Application.RunNext(function () {return _self.RunAction('" + action.Name + "',true);},null,'ACTION" + action.Name + "');}");

					var pos = j;
					if(_self.EnableEditMode())
						pos += 1;
					j += 1;
					
					_self.AddLineAction(action.Name, action.Image, Application.ProcessCaption(Default(action.HTML,action.Name)), func, pos);
					
				}
			}
            
            var h = (j * 50) + 50 + (_self.EnableEditMode() ? 50 : 0);
			dd.css("left","0").css("top","100vh").animate({
                top: $(window).height() - h
            });
			
			var o = $('<div class="ui-widget-overlay app-overlay lineactionsoverlay"></div>');
			$("body").append(o);		
			o.width('100%').height('100%');
            o.show();
			
			o.on("click",function(){	
                $(".lineactions").animate({
                    top: $(window).height()
                },null,null,function(){
                    $(".lineactions,.lineactionsoverlay").remove();
                });	
			});
		};
        
        /**
         * Add a line action to the line actions menu (mobile only).
         * @memberof! PageViewer#
         * @protected
         * @param {string} name Action name.
         * @param {string} image Action icon.
         * @param {string} text Action caption.
         * @param {Function} func Action function.
         * @param {number} i Action index.
         * @returns {JQueryStatic} Returns the line action div.
         */
		 this.AddLineAction = function (name, image, text, func, i) {

			var id = $id();

			var imgcode = ""
			if (image != "") {
                imgcode = "<i class='mdi "+UI.MapMDIcon(UI.MapIcon(image))+"' style='font-size: 20px'></i>&nbsp;";
			}
			var $action = $("<div id='" + id + "' data-ripple class='lineactions-btn'>" + imgcode + text + "</div>");

			$action.ripple({ color: 'gainsboro' }).click(func);

			$(".lineactions").append($action);
			
			return $action;
		};
	
        //#endregion       

        //#region Public Properties

        /**
         * Get the page custom control.
         * @memberof! PageViewer#
         * @returns {Control} Returns the page custom control.
         */
        this.CustomControl = function () {
            return m_customControl;
        };

        /**
         * Get the page viewer options.
         * @memberof! PageViewer#
         * @returns {PageViewerSettings} Returns the page viewer options.
         */
        this.Options = function () {
            return m_options;
        };

        /**
         * Add a page viewer option.
         * @memberof! PageViewer#
         * @param {string} name Name of the option.
         * @param {any} value Option value.
         * @returns {void}
         */
        this.AddOption = function (name, value) {
            m_options[name] = value;
        };

        /**
         * Get the page type (Card or List).
         * @memberof! PageViewer#
         * @returns {string} Returns the page type.
         */
        this.Type = function () {
            return m_form.Type;
        };

        /**
         * Get the page window.
         * @memberof! PageViewer#
         * @returns {Window} Returns the page window.
         */
        this.Window = function () {
            return _base;
        };

        /**
         * Get the page's parent window.
         * @memberof! PageViewer#
         * @returns {PageViewer} Returns the page's parent window.
         */
        this.ParentWindow = function () {
            if (m_parent != null)
                return m_parent; //.Window();
            return _self;
        };

        /**
         * Get the page that opened this page.
         * @memberof! PageViewer#
         * @returns {PageViewer} Returns the page that opened this page.
         */
        this.OpenedFrom = function () {
            return m_openedFrom;
        };

        /**
         * Get/set the page record.
         * @memberof! PageViewer#
         * @param {Record} [value] If specified, sets the page record.
         * @returns {Record|void} Returns the page record if `value` is not specified.
         */
        this.Record = function (value) {
            if (typeof value == "undefined") {
                //Get the record (List form only).
                if (m_form.Type == "List") {
                    var grd = _self.GetPageGrid();
					if(grd){
						_self.GetRecordByRowId(grd.SelectedRow());
					}
                }
                return m_record;
            } else {
                m_record = value;
            }
        };

        /**
         * Get the original page view.
         * @memberof! PageViewer#
         * @returns {string} Returns the original page view.
         */
        this.FormView = function () {
            return m_form.View;
        };
        
        /**
         * Get/set the page loaded flag.
         * @memberof! PageViewer#
         * @param {boolean} [value_] If specified, sets the page loaded flag.
         * @returns {boolean|void} Returns the page loaded flag if `value_` is not specified.
         */
		this.Loaded = function(value_) {

            if (value_ !== undefined) { //SET                
				m_loaded = value_;
            } else { //GET                
                return m_loaded;
            }
        };

        /**
         * Get/set the page view.
         * @memberof! PageViewer#
         * @param {string} [value_] If specified, sets the page view.
         * @returns {string|void} Returns the page view if `value_` is not specified.
         */
        this.View = function (value_) {

            if (value_ !== undefined) { //SET
                if (m_record)
                    m_record.View = value_;
            } else { //GET
                if (m_record)
                    return m_record.View;
                return m_view;
            }
        };

        /**
         * Get/set the cancel close flag.
         * @memberof! PageViewer#
         * @param {boolean} [value_] If specified, sets the cancel close flag.
         * @returns {boolean|void} Returns the cancel close flag if `value_` is not specified.
         */
        this.CancelClose = function (value_) {

            if (value_ !== undefined) {
                _base.CancelClose(value_);
            } else {
                return _base.CancelClose();
            }
        };
        
        /**
         * Check of the page is in grid edit mode (mobile only).
         * @memberof! PageViewer#
         * @returns {boolean} Returns `true` if the page is in grid edit mode.
         */
		this.GridEditMode = function(){
			return m_options.mobilegrideditor != null;
		};

        /**
         * Get the record filters.
         * @memberof! PageViewer#
         * @returns {RecordFieldInfo[]} Returns the record filters.
         */
        this.Filters = function () {
            return m_record.Filters();
        };

        /**
         * Get the line editor.
         * @memberof! PageViewer#
         * @returns {JQueryStatic} Returns the line editor.
         */
        this.LineEditor = function () {
            return m_lineEditor;
        };

        /**
         * Get/set the focus control.
         * @memberof! PageViewer#
         * @param {Control} [cont] If specified, sets the focus control.
         * @returns {Control|void} Returns the focus control if `cont` is not specified.
         */
        this.FocusControl = function (cont) {             
            if (cont !== undefined) {
                m_focusControl = cont;
            } else {
                return m_focusControl;
            }
        };

        /**
         * Set the previous focus control.
         * @memberof! PageViewer#
         * @param {Control} cont Sets the previous focus control.
         * @returns {void}
         */
        this.XFocusControl = function (cont) {
            m_xFocusControl = cont;
        };

        /**
         * Set the close page action.
         * @memberof! PageViewer#
         * @param {Function} func_ Sets the close page action.
         * @returns {void}
         */
		this.CloseAction = function (func_) {
            m_closeAction = func_;
        };
        
        /**
         * Set the close function.
         * @memberof! PageViewer#
         * @param {Function} func_ Sets the close function.
         * @returns {void}
         */
        this.CloseFunction = function (func_) {
            m_closeFunc = func_;
        };

        /**
         * Check if the page is readonly.
         * @memberof! PageViewer#
         * @returns {boolean} Returns `true` if the page is readonly.
         */
        this.ReadOnly = function () {

            if (m_options && m_options.readonly && m_options.readonly == true)
                return true;
			
			if(Application.HasOption(m_form.Options,"mobilereadonly") && Application.IsInMobile())
				return true;

			var editable = false;
			for (var i = 0; i < m_form.Fields.length; i++) {
				if(m_form.Fields[i].Editable)
					editable = true;
			}
			
			if(m_form.Actions.length > 0)
				editable = true;			
			
            return !editable;
        };

        /**
         * Get the window position.
         * @memberof! PageViewer#
         * @returns {Application.position} Returns the window position. Returns values from {@link module:Application.Application.position Application.position}.
         */
        this.Position = function () {
            return _base.Position();
        };

        /**
         * Get the page definition.
         * @memberof! PageViewer#
         * @returns {Page} Returns the page definition.
         */
        this.Page = function () {
            return m_form;
        };

        /**
         * Get the table definition.
         * @memberof! PageViewer#
         * @returns {Page} Returns the table definition.
         */
		this.Table = function () {
            return m_table;
        };
        
        /**
         * Get the filter toolbar control.
         * @memberof! PageViewer#
         * @returns {FilterToolbar} Returns the filter toolbar control.
         */
        this.FilterToolbar = function () {
            return m_filterToolbar;
        };

        /**
         * Get a control by field name.
         * @memberof! PageViewer#
         * @param {string} name_ Name of the field.
         * @returns {Control} Returns the control if it is found.
         */
        this.Control = function (name_) {

            if (m_customControl && m_customControl.Control)
                return m_customControl.Control(name_);

            for (var i = 0; i < m_controls.length; i++) {
                if (m_controls[i].Field().Name == name_)
                    return m_controls[i];
            }			
			for (var i = 0; i < m_subPages.length; i++) {
				var cont = m_subPages[i].Control(name_);
				if(cont != null)
					return cont
			}		    
            return null;
        };

        /**
         * Get a button by action name.
         * @memberof! PageViewer#
         * @param {string} name Name of the action.
         * @returns {JQueryStatic} Returns the button if it is found.
         */
		this.Button = function(name){			
		    var btn = Default(m_buttons[name],null);
		    if (!btn) {
		        for (var i = 0; i < m_subPages.length; i++) {
		            var btn2 = m_subPages[i].Button(name);
		            if(btn2 != null)
                        return btn2
		        }
		    }
			if(!btn){
				for(var i = 0; i < m_lineActions.length; i++){				
					var action = m_lineActions[i];
					if(action.Name == name)
						return {
							hide: function(){
								m_lineActions[i].Hide = true;
							},
							show: function(){
								m_lineActions[i].Hide = false;
							},
							html: function(val){
								m_lineActions[i].Image = "";
								m_lineActions[i].HTML = val;
							}
						};
				}			
			}
			return btn;
		};

        /**
         * Set a field as valid/invalid.
         * @memberof! PageViewer#
         * @param {string} name Name of the field.
         * @param {boolean} valid If `true` the field is marked as valid.
         * @param {string} [msg] Optional message to display.
         * @returns {void}
         */
        this.ValidValue = function (name, valid, msg) {

            var cont = _self.Control(name);
            if (cont) {
                if (cont.Valid)
                    cont.Valid(valid, msg);
            }
        };

        /**
         * Set the current column.
         * @memberof! PageViewer#
         * @protected
         * @param {string} value_ Column name.
         * @returns {void}
         */
        this.Col = function (value_) {
            m_col = value_;
        };

        /**
         * Set the current row.
         * @memberof! PageViewer#
         * @protected
         * @param {number} value_ Row ID.
         * @returns {void}
         */
        this.Row = function (value_) {
            m_row = value_;
        };

        /**
         * Check if the layout cause an error.
         * @memberof! PageViewer#
         * @protected
         * @param {PageViewer} pge Page to check.
         * @returns {boolean} Returns `true` if the layout may have caused an error.
         */
        this.CheckLayout = function (pge) {
            if (m_layout && m_layout.Filters) {
                Application.Confirm("One or more filters may have caused an error. Do you wish to clear them?", function (r) {
                    if (r == true) {
                        m_record.Filters = null;
                        _self.SaveLayout();
                    }
                    Application.RunNext(pge.Close);
                }, "Bad filters");
                return true;
            }
            return false;
        };

        /**
         * Get the parent viewer.
         * @memberof! PageViewer#
         * @returns {PageViewer} Returns the parent viewer.
         */
        this.ParentPage = function () {
            return m_parent;
        };

        /**
         * Get the sub pages.
         * @memberof! PageViewer#
         * @returns {PageViewer[]} Returns the sub pages.
         */
        this.SubPages = function () {
            return m_subPages;
        };

        /**
         * Get the page tabs.
         * @memberof! PageViewer#
         * @returns {Window[]} Returns the page tabs.
         */
		this.Tabs = function () {
            return m_tabs;
        };
        
        /**
         * Get a page tab/subpage by name.
         * @memberof! PageViewer#
         * @param {string} name Name of the tab.
         * @returns {Window|PageViewer} Returns the page tab/subpage if found.
         */
		this.GetTabByName = function(name){
			for(var i = 0; i < m_subPages.length; i++){
				if(m_subPages[i].TabName() == name)
				    return m_subPages[i];
				var nme = m_subPages[i].GetTabByName(name);
				if (nme)
				    return nme;
			}
			for(var i = 0; i < m_tabs.length; i++){
				if(m_tabs[i].TabName() == name)
					return m_tabs[i];
			}
			return null;
		};
        
        /**
         * Get a page tab/subpage by id.
         * @memberof! PageViewer#
         * @protected
         * @param {number} id ID of the tab.
         * @returns {Window|PageViewer} Returns the page tab/subpage if found.
         */
		this.GetTabByID = function(id){
			for(var i = 0; i < m_subPages.length; i++){
				if(m_subPages[i].ID() == id)
					return m_subPages[i];
			}
			for(var i = 0; i < m_tabs.length; i++){
				if(m_tabs[i].ID() == id)
					return m_tabs[i];
			}
			return null;
		};
        
        /**
         * Get the OK clicked flag.
         * @memberof! PageViewer#
         * @protected
         * @returns {boolean} Returns the OK clicked flag.
         */
        this.OKClicked = function () {
            return m_okClicked;
        };

        /**
         * Get/set the changed flag.
         * @memberof! PageViewer#
         * @param {boolean} [value_] If specified, sets the changed flag.
         * @returns {boolean|void} Returns the changed flag if `value_` is not specified.
         */
        this.Changed = function (value_) {

            if (value_ !== undefined) {
                m_changed = value_;
            } else {
                return m_changed;
            }

        };

        /**
         * Get the enable edit mode flag.
         * @memberof! PageViewer#
         * @protected
         * @returns {boolean} Returns the enable edit mode flag.
         */
        this.EnableEditMode = function () {
            return m_enableEditMode;
        };

        /**
         * Get/set the selected combobox.
         * @memberof! PageViewer#
         * @protected
         * @param {Control} [value_] If specified, sets the selected combo.
         * @returns {Control|void} Returns the selected combo if `value_` is not specified.
         */
        this.ComboSelected = function (value_) {
            if (typeof value_ == "undefined") {
                return m_comboSelected;
            } else {
                m_comboSelected = value_;
            }
        };
        
        /**
         * Get the line actions (mobile only).
         * @memberof! PageViewer#
         * @protected
         * @returns {PageAction[]} Returns the line actions.
         */
		this.LineActions = function () {
            return m_lineActions;
        };

        //#endregion          

        //#region Events

        /**
         * Function to run on error of the page.
         * @memberof! PageViewer#
         * @param {string} e Error message.
         * @returns {void}
         */
        this.OnError = function (e) {

            m_record.Temp = m_temp; //Reset this if the error occurs on save.            			

            //Partial refresh.            
            m_causedUpdate = null;

            if(Application.transactionStarted > 0)
                Application.RunNext(function () {
                    return $codeblock(
                        function () {
                            if (Application.auth.SessionID != "") { 
                                Application.supressServiceErrors = true;
                                return Application.RollbackTransaction();
                            }
                        },
                        function () {
                            Application.supressServiceErrors = false;
                        }
                    );
                });

            _self.LoadControls(true);
            m_okClicked = false;
            _self.HideLoad(true);
            _self.DisableKeys(false);

            if (Application.restrictedMode && m_loaded == false) {
                Application.ShowError(e, function () {
					window.location = Application.url + Application.auth.Instance;
				});
            } else {

                if (m_loaded && !_base.Visible()) //Show window (incase close all is called)
                    UI.WindowManager.Open(_base.ID());

                Application.ShowError(e, function () {

                    _base.SetStatus("An Error Occurred");
					
					//Update filters.
					m_view = m_lastView;
					m_record.View = m_view;
					if (m_form.ShowFilters && m_filterToolbar)
						m_filterToolbar.SetFilters(true);

					if (!Application.IsInMobile() && m_form.Type !== 'Card') {
						if (!m_layout) {
							m_layout = new Object();                    
						}
						var filters = Application.GetFilters(m_view);
						m_layout.Filters = {};
						for (var i = 0; i < filters.length; i++) {
						    m_layout.Filters[filters[i][0]] = filters[i][1];
						}
						_self.SaveLayout();
					}					
					
                    if (m_loaded == false) {                        
                        if(m_layout){
                            if (_self.CheckLayout(_self))
                                return;
                            for (var i = 0; i < m_subPages.length; i++) {
                                if (m_subPages[i].CheckLayout(_self))
                                    return;
                            }
                        }
                        Application.RunNext(_self.Close);
                        return;
                    }

                    if (m_form.Type == "List" && m_col == null) return;
                    if (m_form.Type == "Card" && m_xFocusControl == null) return;                    

                    if (m_form.Type == "List") {

                        var grd = _self.GetPageGrid();

                        if (grd) {

                            //Get record that caused the error.
                            _self.GetRecordByRowId(m_row);

                             //Rollback record.
                            if (!m_temp && !m_record.UnsavedChanges())
                                m_record.RollBack();

                            grd.SetDataRow(m_row, _self.ConvertRecordToData()); //Error record.                            

                            //Go back to the error cell.
                            grd.SelectRow(m_row);
                            grd.EditCellByName(m_col);
                        }
                        m_col = null;
                        m_row = null;

                    } else {

                        //Rollback record.
                        if (!m_temp && !m_record.UnsavedChanges())
                            m_record.RollBack();

                        m_focusControl = m_xFocusControl;
                        try {
                            m_focusControl.select();
                        } catch (e) {
                        }
                        Application.RunNext(_self.UpdateControls);
                    }
					
                });
            }
        };

        /**
         * Function to run on key press on the page.
         * @memberof! PageViewer#
         * @param {Event} ev Key press event.
         * @returns {void}
         */
        this.OnKeyPress = function (ev) {

            try {

                //F2.
                if (ev.which == 113) {
                    if (m_form.Type == "List") {
                        var grd = _self.GetPageGrid();
                        if (grd != null) {
                            grd.EditCurrentCell();
                        }
                    }
                    ev.preventDefault();
                    return false;
                }

                //F3.
                if (ev.which == 114 && m_form.InsertAllowed) {
                    Application.RunNext(function () { return _self.OnNew(); });
                    ev.preventDefault();
                    return false;
                }

                //F4.
                if (ev.which == 115 && m_form.DeleteAllowed) {
                    Application.RunNext(function () { return _self.OnDelete(); });
                    ev.preventDefault();
                    return false;
                }

                //F5.
                if (ev.which == 116 && !ev.ctrlKey) {					
                    Application.RunNext(function () { return _self.Update(true,true,true); }); //Issue #37 - Refresh flowfields.
                    ev.preventDefault();
                    return false;
                }

                //F7
                if (ev.which == 118) {
                    var grd = _self.GetPageGrid();
                    if (grd) {
                        var col = grd.CurrentColumn();
                        if (col) {
                            var frmfield = m_form.GetField(col.name);
                            var fld = $("#" + _base.ID() + "filterfields");
                            if (frmfield) {
                                fld.val(frmfield.Name);
                                m_filterToolbar.GetFilter(fld.val());
                            }
                        }
                    }
                    var input = $("#" + _base.ID() + "filterinput");
                    input.select();
                    ev.preventDefault();
                    return false;
                }

                //F8
                if (ev.which == 119) {

                    if (m_form.Type == "List") {
                        var grd = _self.GetPageGrid();
                        if (grd) {
                            var col = grd.CurrentColumn();
                            var rw = grd.SelectedRow(-1);
                            if (rw && col) {
                                var data = grd.DataSourceById(rw);
                                if (data) {
                                    var editor = grd.CurrentEditor(parseInt(rw) + 1);
                                    if (editor) {
                                        var val = data[col.name];
                                        var field = m_table.Column(col.name);
                                        if (field.Type == "DateTime")
                                            val = Application.FormatDate(val, '%LANG:FORMAT_LONGDATE% HH:mm');
                                        if (field.Type == "Time")
                                            val = Application.FormatDate(val, 'HH:mm');
                                        if (field.Type == "Date")
                                            val = Application.FormatDate(val, '%LANG:FORMAT_LONGDATE%');
                                        if (field.LookupDisplayField != "")
                                            val = data["FF$" + col.name];
                                        editor.val(val);
                                        editor.change();
                                        if (editor.attr("skipSelect") != "true")
                                            setTimeout(function () { editor.select(); }, 10);
                                    }
                                }
                            }
                        }
                    }

                    ev.preventDefault();
                    return false;
                }

            } catch (e) {
                _self.OnError(e);
            }

        };

        /**
         * Function to run before closing the page.
         * @memberof! PageViewer#
         * @param {boolean} okclicked If `true` the OK button was clicked.
         * @returns {void}
         */
        this.OnBeforeClose = function (okclicked) {

            if (okclicked != null)
                m_okClicked = okclicked;

            this.Save();

            if (!okclicked || m_record.Count === 0)
                return true;

            try {
                _self.MandatoryCheck();
                _self.ValidCheck();
            } catch (e) {
                return false;
            }

            return true;
        };

        /**
         * Function to run on close of the page.
         * @memberof! PageViewer#
         * @param {boolean} okclicked If `true` the OK button was clicked.
         * @returns {void}
         */
        this.OnClose = function (okclicked) {

			if(m_options.homepage && Application.IsInMobile())
				Application.Error("You cannot close the dashboard");
		
            _self.Save();

            if (okclicked != null)
                m_okClicked = okclicked;

            _self.ShowLoad();

            var w = $wait();

            $code(

                function () {

                    if (m_closeAction != null && !_base.CancelClose()) {
                        return m_closeAction();
                    }
                },

                function () {
                    if (m_closeFunc != null && !_base.CancelClose()) {
                        return m_closeFunc(m_okClicked);
                    }
                },

                function () {

                    //Stop grid load.
                    var grd = _self.GetPageGrid();
                    if (grd)
                        grd.StopLoad();

                    _self.HideLoad();
                }
            );

            return w.promise();
        };

        /**
         * Function to run on resize of the page.
         * @memberof! PageViewer#
         * @param {number} width Width of the page.
         * @returns {void}
         */
        this.OnResize = function (width) {

                var j = 0;
                var totalheight = _base.Height();
                if (_base.Hidden() == true)
                    totalheight = 0;

                for (var i = 0; i < m_tabs.length; i++) {
                    if (m_tabs[i].Position() == Application.position.normal || m_tabs[i].Position() == Application.position.rolefull) {
                        j += 1;
                        totalheight += m_tabs[i].Height();
                    }
                }

                for (var i = 0; i < m_subPages.length; i++) {
                    m_subPages[i].ResizeList(10);
                    if (m_subPages[i].Position() == Application.position.normal || m_subPages[i].Position() == Application.position.block || m_subPages[i].Position() == Application.position.rolefull) {
                        j += 1;
                    }
                }

                if (m_form.Type == "List") {
                    if (j == 0) {
                        totalheight = UI.Height();
                    } else {
                        totalheight = 300;
                    }
                }

                var uiheight = UI.Height();

                if (j <= 0)
                    j = 1;

                var minheight = 300;
                if (Application.IsInMobile())
                    minheight = 400;

                for (var i = 0; i < m_subPages.length; i++) {

                    var optionheight = Application.OptionValue(m_subPages[i].Page().Options, "height");
                    if (optionheight) {

                        m_subPages[i].ResizeList(optionheight);

                    } else {

                        if (m_subPages[i].Position() == Application.position.normal ||m_subPages[i].Position() == Application.position.rolefull) {
                            m_subPages[i].ResizeList(10);
                            var subheight = (uiheight - totalheight) / j;
                            if (subheight < minheight)
                                subheight = minheight;
                            m_subPages[i].ResizeList(subheight - 8);
                        } else if (m_subPages[i].Position() == Application.position.right) {
                            m_subPages[i].ResizeList(uiheight / 2);
                        } else if (m_subPages[i].Position() == Application.position.block) {
                            m_subPages[i].ResizeList(300);
                        } else if (m_subPages[i].Position() == Application.position.rolequarter || m_subPages[i].Position() == Application.position.rolehalf) {
                            if(Application.IsInMobile()){
								m_subPages[i].ResizeList(uiheight);
							}else if (m_form.SubPages() <= 4) {
                                m_subPages[i].ResizeList(uiheight / 2);
                            } else {
                                m_subPages[i].ResizeList(500);
                            }
                        }
                    }
                }

                if (m_parent == null && m_form.Type == "List") {
                    this.ResizeList(10);
                    var height = totalheight;
                    if (height < minheight)
                        height = minheight;
                    if (m_options.dialog && !Application.IsInMobile())
                        height = (UI.Height() / 2) - _base.HeaderHeight();
                    this.ResizeList(height);
                }

            for (var i = 0; i < m_controls.length; i++) {

                var cont = m_controls[i];

                if (m_customControl && m_customControl.ObjectType() == cont.ObjectType()) {

                    cont.Width(width);

                } else if (cont.ObjectType() == "Grid") {

                    cont.Width(width);

                } else {

                    var w = width / 2 - 5;

                    var ignore = cont.IgnoreColumns();
                    if(!ignore && cont.Field() && Application.HasOption(cont.Field().Options,"ignorecolumns"))
                        ignore = true;

                    if(ignore)
                        w = width;

                    if (_base.GetSingleColumn())
                        w = width - 10;

                    if (m_form.Type == "Card") {
                        var tab = _self.GetTab(cont.Field().TabName);
                        if (tab.GetSingleColumn())
                            w = tab.InnerWidth() - 10;
                    }

                    cont.SetSize(w, height);
                }

            }
        };

        //#endregion        

        //#region Window Functions

        /**
         * Show the page viewer.
         * @memberof! PageViewer#
         * @param {number} w Width of the window.
         * @returns {void}
         */
        this.Show = function (w) {

            w = _base.Show(w);				
				
			_self.OnShow();
				
			setTimeout(function(){
                    
                if(_self){
                    
                    _self.Resize();				
                    
                    for (var i = 0; i < m_tabs.length; i++) {
                        m_tabs[i].OnShow();								
                    }
                    
                    for (var i = 0; i < m_subPages.length; i++) {
                        m_subPages[i].OnShow();					
                    }	
                }
				
			},100);
			
            return w;
        };
        
        /**
         * Remove the page viewer from the DOM.
         * @memberof! PageViewer#
         * @protected
         * @returns {void}
         */
		this.Remove = function(){
			
			for(var i = 0; i < m_controls.length; i++){
				var cont = m_controls[i];
				cont.Dispose();
				cont = null;				
			}
			m_controls = null;
			
			if(m_filterToolbar){
				m_filterToolbar.Dispose();
				m_filterToolbar = null;
			}
			
			if(m_openedFrom)
				m_openedFrom.RemoveChildWindow(_base.ID());
			
			//if(m_parent)
			//		m_parent.RemoveSubpage(_base.ID());							
			
			_base.Remove();		
			if(m_table) m_table.Dispose();	
			if(m_record) m_record.Dispose();
			
			//Remove references.
			m_closeAction = null;			
			m_record = null;
			m_table = null;
			//m_form = null;
			m_layout = null;
			//m_options = null;
			m_designerPages = null;
			m_designerPages2 = null;
			m_designerPages3 = null;
			m_subPages = null;
			m_tabs = null;
			
			_base = null;
			_self = null;
		};

        /**
         * Trigger a resize on the page viewer.
         * @memberof! PageViewer#
         * @returns {void}
         */
        this.Resize = function () {
			
            _base.Resize();
            _self.OnResize(_base.InnerWidth());			
        };

        /**
         * Resize the list page.
         * @memberof! PageViewer#
         * @protected
         * @param {number} height Height of the page.
         * @returns {void}
         */
        this.ResizeList = function (height) {

            var h = m_options.height;
            if (h){
                height = h;
            }

            if(height <= 350)
                height = 350;

            var grd = _self.GetPageGrid();
            if (grd != null) {
				
                grd.Height(height - _base.HeaderHeight());
				
            } else {

                if (m_form && (_self.Position() == Application.position.block || _self.Position() == Application.position.rolehalf || _self.Position() == Application.position.rolequarter || _self.Position() == Application.position.rolefull))
					_base.SetHeight(height, true); //Set height and max
            }

            if (m_customControl)
                m_customControl.Height(height - _base.HeaderHeight());

            if (_base.Dialog())
                _base.CenterDialog();
        };

        this.Pin = function () {
        };	

        /**
         * Function to run on minimize/maximize of the page.
         * @memberof! PageViewer#
         * @param {boolean} skipevent If `true` don't save the page layout.
         * @returns {void}
         */
		this.OnToggle = function(skipevent){
			if(!skipevent)
			_self.SaveLayout();
			_self.ResizeParent();
		};

        //#endregion

        this.Constructor(options_);
    });

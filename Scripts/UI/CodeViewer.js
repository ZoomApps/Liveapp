/// <reference path="../Application.js" />

Define("CodeViewer", null, function (options_) {

    //#region Members

    var _self = this;
    var m_type = '';
    var m_id = null;
    var m_loaded = false;
    var m_window = null; //Window
    var m_openedFrom = null; //PageViewer
    var m_obj = null;
    var m_options = null;
    var m_closeFunc = null;
    var m_container = null;
    var m_groups = [];
    var m_changed = false;

    //#endregion

    //#region Public Functions

    this.Constructor = function (options_) {

        if (Application.testMode && arguments[0] == null) return;

        m_id = options_.id;
        m_type = options_.type;
        m_options = options_;
    };

    this.Open = function (parent_) {

        //Check if window is already open.
        var winid = UI.WindowManager.GetWindowByUID(m_type + m_id);
        if (winid != -1) {
            var win = UI.WindowManager.Open(winid);
            Application.RunNext(win.Update);
            return;
        }

        return $codeblock(

            function () {
                if (m_type == "TABL") {
                    Application.Cache.Remove("TableFetch", m_id);
                    return new Table(m_id);
                }
                if (m_type == "PAGE") {
                    Application.Cache.Remove("PageFetch", m_id);
                    return new Page(m_id);
                }
                if (m_type == "CODE")
                    return new CodeModule(m_id, true);
            },

            function (obj) {

                //Save the object.
                m_obj = obj;

                if (!m_options.icon) {
                    m_options.icon = "window";
                }

                var uid = m_type + m_id;

                //Create the window.
                m_window = new Window();
                m_window.Create(UI.IconImage(m_options.icon) + ' ' + m_options.caption, {
                    closebutton: true,
                    workspace: $("#AppWorkspace"),
                    shortcutWorkspace: $("#AppWindows")
                });

                //Override window methods.
                m_window.OnError = _self.OnError;
                m_window.OnResize = _self.OnResize;
                m_window.OnKeyPress = _self.OnKeyPress;
                m_window.OnClose = _self.OnClose;
                m_window.Update = _self.Update;

                m_window.AddButton('Save', 'disk_blue', 'Save', _self.SaveCode);
                m_window.AddButton('Save and Close', 'disk_blue_ok', 'Save and Close', function () { _self.SaveCode(true); });

                //Add the window to the manager and open it.
                UI.WindowManager.Add(m_window);
                UI.WindowManager.Open(m_window.ID());

                m_window.Viewer = function () {
                    return _self;
                };

                //Set the window UID.
                m_window.UID(uid);

                m_window.ShowLoad();

                if (!Application.IsInMobile()) {
                    $('#' + m_window.ID() + 'main').css('max-height', UI.Height() - m_window.HeaderHeight() - 10);
                    $('#' + m_window.ID() + 'main').css('overflow-y', 'scroll');
                }

                if (parent_) {
                    m_openedFrom = parent_;
                    parent_.AddChildWindow(m_window);
                }

                //Load the page.
                return _self.Load();
            }

        );
    };

    this.SaveCode = function (closethis_) {

        Application.RunNext(function () {

            return $codeblock(

                function () {
                    _self.ShowLoad();

                    var code = new Application.Objects.ArrayList();
                    for (var i = 0; i < m_groups.length; i++) {
                        code[i] = m_groups[i].editor.Value();
                    }

                    return Application.SaveSource(m_type, m_id, code);
                },

                function () {

                    m_changed = false;

                    _self.HideLoad();
                    if (closethis_ == true)
                        Application.RunNext(_self.Close);
                }

            );

        });
    }

    this.Load = function () {

        Application.LogInfo('Loading Code Viewer: ' + m_id);

        return $codeblock(

            function () {

                //Create the container.
                m_container = $('<div style="width: 100%; padding: 4px; box-sizing: border-box;"></div>');
                m_window.AddControl(m_container);

                //Update the page.           
                return _self.Update(true);
            },
            function () {
                _self.HideLoad();
            }

        );
    };

    this.AddGroup = function (name_, caption_, code_) {

        var id = 'grp' + $id();
        var mnu = $('<div class="ui-widget ui-state-default unselectable" style="border-width: 4px; padding: 4px; width: 100%; box-sizing: border-box; margin: 0px; text-align: left;">' + caption_ + '</div><textarea id="' + id + 'txt"></textarea>');
        m_container.append(mnu);

        $("#" + id + "txt").val(code_);

        var editor = new CodeEditor($("#" + id + "txt")[0], _self.Changed);
        m_groups.push({ name: name_, id: id, editor: editor });

        return $("#" + id);
    };

    this.Changed = function () {
        m_changed = true;
        if (m_openedFrom)
            m_openedFrom.Changed(true);
    };

    this.Update = function (first_) {

        Application.LogInfo('Updating Code Viewer: ' + m_id);

        if (first_ == null) first_ = false;

        return $codeblock(

            function () {

                _self.ShowLoad();

                m_container.html('');
                m_groups = [];

                if (m_type == "TABL") {

                    _self.AddGroup("Insert", "OnInsert", m_obj.InsertCode);
                    _self.AddGroup("Modify", "OnModify", m_obj.ModifyCode);
                    _self.AddGroup("Delete", "OnDelete", m_obj.DeleteCode);

                    for (var i = 0; i < m_obj.Columns.length; i++) {
                        _self.AddGroup(m_obj.Columns[i].Name, m_obj.Columns[i].Name + " - OnValidate", m_obj.Columns[i].ValidateCode);
                    }
                }

                if (m_type == "PAGE") {

                    if (m_obj.OpenAction)
                        _self.AddGroup(m_obj.OpenAction.Name, m_obj.OpenAction.Name + "(rec)", m_obj.OpenAction.ActionCode);

                    if (m_obj.CloseAction)
                        _self.AddGroup(m_obj.CloseAction.Name, m_obj.CloseAction.Name + "(rec)", m_obj.CloseAction.ActionCode);

                    for (var i = 0; i < m_obj.Actions.length; i++) {
                        if (m_obj.Actions[i].Name != "Design Page" && m_obj.Actions[i].Name != "Design Table")
                            _self.AddGroup(m_obj.Actions[i].Name, m_obj.Actions[i].Name + " - OnClick(rec)", m_obj.Actions[i].ActionCode);
                    }
                }

                if (m_type == "CODE") {

                    _self.AddGroup("Code", "Code", m_obj.Code);
                }

                m_loaded = true;
                _self.HideLoad();

                m_window.Resize();
            }
        );
    };

    this.ShowLoad = function () {
        m_window.ShowLoad();
    };

    this.HideLoad = function () {
        m_window.HideLoad();
    };

    this.Resize = function () {
        m_window.Resize();
    };

    this.Close = function () {
        if (m_options.closeButton == false) return;
        return UI.WindowManager.Close(m_window.ID());
    };

    this.CloseFunction = function (func_) {
        m_closeFunc = func_;
    };

    this.OpenedFrom = function () {
        return m_openedFrom;
    };

    //#endregion

    //#region Public Properties

    this.ID = function () {
        return m_id;
    };

    this.Type = function () {
        return m_type;
    };

    this.Window = function () {
        return m_window;
    };

    //#endregion          

    //#region Events

    this.OnError = function (e) {

        _self.HideLoad();

        try {

            if (Application.auth.SessionID != "")
                Application.Rollback();

        } catch (e) {
        }

        Application.ShowError(e, function () {



        });

        if (m_loaded == false)
            return _self.Close();
    };

    this.OnResize = function (width, height) {

    };

    this.OnKeyPress = function (ev) {

        try {

        } catch (e) {
            _self.OnError(e);
        }

    };

    this.OnClose = function () {

        _self.ShowLoad();

        return $codeblock(

            function () {
                if (m_changed == true) {
                    if (m_loaded && !m_window.Visible()) //Show window (incase close all is called)
                        UI.WindowManager.Open(m_window.ID());
                    var w = $wait();
                    Application.Confirm("You have unsaved changes. Close anyway?", function (r) {
                        if (!r) {
                            m_window.CancelClose(true);
                            _self.HideLoad();
                        }
                        w.resolve(r);
                    }, "Don't leave yet...");
                    return w.promise();
                }
                return true;
            },

            function (r) {
                if (m_closeFunc != null && r) {
                    return m_closeFunc();
                }
            }
        );
    };

    //#endregion        

    this.Constructor(options_);

});


Define("Page", null, function (id_, useCache_) {

    //#region Members

    var _self = this;
    var m_id = null;

    //#endregion

    //#region Public Methods

    this.Constructor = function (id_, useCache_) {

        m_id = id_;
        if (m_id != null)
            return this.Init(useCache_);

        var p = Application.Objects.PageInfo();
        app_transferObjectProperties.call(this, p);
        return this;
    };

    this.Init = function (cache_) {

        if (cache_ == null) cache_ = true;

        var w = $wait();

        //Check the client side cache for the page.
        var cr = Application.Cache.Check("PageFetch", m_id);
        if (cr && cache_) {

            //Save the record.
            app_transferObjectProperties.call(_self, cr);
            cr = _self;
            return cr;
        }

        //Execute the web service.
        Application.ExecuteWebService("PageFetch",
        { auth: Application.auth, id_: m_id, cache_: cache_ }, function (r) {
            try {

                //Save the page to the client side cache.
                Application.Cache.Save("PageFetch", m_id, r);

                //Save the record.
                app_transferObjectProperties.call(_self, r);
                r = _self;
                w.resolve(r);

            } catch (e) {
                Application.Error(e);
            }
        });

        return w.promise();

    };

    this.Rename = function (id_) {

        var oldname = this.Name;
        this.Name = id_;

        var w = $wait();

        Application.ExecuteWebService("PageRename",
        { auth: Application.auth, page_: this, oldName_: oldname }, function (r) {

            w.resolve(r);

        });

        return w.promise();

    };

    this.Copy = function (p) {
        app_transferObjectProperties.call(_self, p);
    };

    this.GetField = function (name_) {

        for (var i = 0; i < this.Fields.length; i++) {
            if (this.Fields[i].Name == name_)
                return this.Fields[i];
        }
        return null;
    };

    this.GetActionView = function (rec, action) {
        if (action.ActionView && action.ActionView != "")
            return Application.MergeView(action.ActionView, rec);
        return "";
    };

    this.RunActionCode = function (rec, action, viewer) {

        return $codeblock(

            function () {
                if (action.ServerAction)
                    return Application.WebServiceWait("PageRunAction", { auth: Application.auth, rec_: rec.Record, page_: _self, action_: action });
            },
            function (msg) {

                if (action.ServerAction && (m_id == "VP$PageDesigner" || m_id == "VP$ReportDesigner"))
                    Application.Cache.Remove("PageFetch", rec.Name);

                if (action.ServerAction && m_id == "VP$TableDesigner") {
                    Application.Cache.Remove("TableFetch", rec.Name);
                    Application.Cache.Remove("RecordInit", rec.Name);
                }

                if (action.ActionCode && action.ActionCode != "") {
                    eval("var func = function runAction(rec){" + action.ActionCode + "};");
                    var page = _self;
                    var win = null;
                    if (viewer)
                        win = viewer.Window();
                    return $codeblock(
                        function () {
                            return func(rec);
                        },
                        function (ret) {
                            rec.SaveCurrent();
                            if (typeof ret == "string")
                                return ret;
                        }
                    );
                } else {
                    return msg;
                }
            }
        );
    };

    this.GetAction = function (name_) {

        for (var i = 0; i < this.Actions.length; i++) {
            if (this.Actions[i].Name == name_)
                return this.Actions[i];
        }

        if (this.CloseAction != null)
            if (this.CloseAction.Name == name_)
                return this.CloseAction;

        if (this.OpenAction != null)
            if (this.OpenAction.Name == name_)
                return this.OpenAction;

        return null;
    };

    this.OnNewAction = function () {

        for (var i = 0; i < this.Actions.length; i++) {
            if (this.Actions[i].Type == "New")
                return this.Actions[i];
        }
        return null;
    };

    this.OnDeleteAction = function () {

        for (var i = 0; i < this.Actions.length; i++) {
            if (this.Actions[i].Type == "Delete")
                return this.Actions[i];
        }
        return null;
    };

    this.DoubleClickAction = function () {

        for (var i = 0; i < this.Actions.length; i++) {
            var skip = false,
                action = this.Actions[i];
            if (Application.HasOption(action.Options, "desktoponly") && Application.IsInMobile())
                skip = true;
            if (Application.HasOption(action.Options, "mobileonly") && !Application.IsInMobile())
                skip = true;
            if (action.OnDoubleClick && !skip)
                return action;
        }
        return null;
    };

    this.SubPages = function () {
        var subpages = 0;
        for (var i = 0; i < this.TabList.length; i++) {
            var tab = this.TabList[i];
            if (tab.ID != "") {
                if ((Application.IsInMobile() && !this.TabOption(tab, "desktoponly")) || (!Application.IsInMobile() && !this.TabOption(tab, "mobileonly")))
                    subpages += 1;
            }
        }
        return subpages;
    };
	
	this.GetSubPages = function () {
        var subpages = [];
        for (var i = 0; i < this.TabList.length; i++) {
            var tab = this.TabList[i];
            if (tab.ID != "") {
                if ((Application.IsInMobile() && !this.TabOption(tab, "desktoponly")) || (!Application.IsInMobile() && !this.TabOption(tab, "mobileonly")))
                    subpages.push(tab);
            }
        }
        return subpages;
    };

    this.GetTabs = function () {
        var tabs = [];
        var gentab = new Object();
        gentab.ID = "";
        gentab.Name = "";
        gentab.View = "";
        tabs.push(gentab);
        for (var i = 0; i < this.TabList.length; i++) {
            if (this.TabList[i].ID == "")
                tabs.push(this.TabList[i]);
        }
        return tabs;
    };

    this.GetFieldsByTab = function (tab_, additional_, hideNonEditable_) {
        var f = [];
        for (var i = 0; i < this.Fields.length; i++) {
            this.Fields[i].TabName = Default(this.Fields[i].TabName, "");
            if (this.Fields[i].TabName == tab_ || (tab_ == "" && this.Fields[i].TabName == "General"))
                if (this.Fields[i].Hidden == false && (!hideNonEditable_ || (hideNonEditable_ && (this.Fields[i].Editable || Application.HasOption(this.Fields[i].Options,"showineditor"))))) {
                    if (this.Fields[i].Importance != "Additional" && !additional_)
                        f.push(this.Fields[i]);
                    if (this.Fields[i].Importance == "Additional" && additional_)
                        f.push(this.Fields[i]);
                }
        }
        return f;
    };

    this.ClearCache = function () {
        return Application.ClearCache(this.Name);
    };
    
    this.Option = function (name) {
        return Application.HasOption(_self.Options, name);
    };

    this.FieldOption = function (field, name) {
        return Application.HasOption(field.Options, name);
    };

    this.TabOption = function (tab, name) {
        return Application.HasOption(tab.Options, name);
    };

    this.ActionOption = function (action, name) {
        return Application.HasOption(action.Options, name);
    };

    //#endregion        

    return this.Constructor(id_, useCache_);

});

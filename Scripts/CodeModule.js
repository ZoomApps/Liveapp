

Define("CodeModule", null, function (id_, design_) {

    //Members

    var _self = this;
    var m_id = null;
    var m_design = false;

    //Methods

    this.New = function (id_, design_) {

        var w = $wait();

        m_id = id_;
        m_design = Default(design_, false);

        if (m_id == null)
            return this.Init();

        return $codeblock(

            function () {
                return _self.Fetch();
            },

            function (r) {
                if (r == null) {
                    return _self.Init()
                } else {
                    return r;
                }
            }
        );        

    };

    this.Init = function () {

        var tempcodemodule = Application.Objects.CodeModuleInfo();
        app_transferObjectProperties.call(this, tempcodemodule);
        //this.Name = m_id;

        return this;
    };

    this.Fetch = function () {

        if (this.Name == null)
            this.Name = m_id;

        var w = $wait();

        Application.ExecuteWebService("CodeModuleFetch",
        { auth: Application.auth, name_: this.Name, design_: m_design }, function (r) {

            if (r == null || r.Message) {
                w.resolve(null);
                return;
            }

            app_transferObjectProperties.call(_self, r);

            if (m_design == false) {

                try {
                    var ret = new Object();
                    eval("ret = new function(){var _self = this; " + r.Code + "};");
                    w.resolve(ret);
                } catch (e) {
                    Application.Error(e);
                }

                return;
            };
            w.resolve(_self);
        });

        return w.promise();
    };

    this.Rename = function (id_) {

        var oldname = this.Name;
        this.Name = id_;

        var w = $wait();

        Application.ExecuteWebService("CodeModuleRename",
        { auth: Application.auth, code_: this, oldName_: oldname }, function (r) {

            w.resolve(r);

        });

        return w.promise();

    };

    //Constructor

    return this.New(id_, design_);

});



Define("CodeModule", null, function (id_, design_, useCache_) {

    //Members

    var _self = this;
    var m_id = null;
    var m_design = false;
    var m_cache = null;

    //Methods

    this.New = function (id_, design_, useCache_) {

        var w = $wait();

        m_id = id_;
        m_design = Default(design_, false);
        m_cache = useCache_;

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

        if (m_cache == null)
            m_cache = true;

        var w = $wait();

        //Check the client side cache for the table.
        var cr = Application.Cache.Check("CodeModuleFetch", this.Name);
        if (cr && m_cache) {

            app_transferObjectProperties.call(_self, cr);
            
            if (m_design == false) {

                try {
                    var ret = Function("var _self = this; " + cr.Code);
                    return new ret();
                } catch (e) {
                    Application.Error(e);
                }

                return null;
            };

            return _self;
        }

        Application.ExecuteWebService("CodeModuleFetch",
        { auth: Application.auth, name_: this.Name, design_: m_design }, function (r) {

            if (r == null || r.Message) {
                w.resolve(null);
                return;
            }

            //Save the table to the client side cache.
            Application.Cache.Save("CodeModuleFetch", _self.Name, r);

            app_transferObjectProperties.call(_self, r);

            if (m_design == false) {

                try {
                    var ret = Function("var _self = this; " + r.Code);
                    w.resolve(new ret());
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

    return this.New(id_, design_, useCache_);

});

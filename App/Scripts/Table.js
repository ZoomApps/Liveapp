

Define("Table", null, function (id_, useCache_) {

    //#region Members

    var _self = this;
    var m_id = null;
    var m_cache = null;
    var m_blockChange = false;
    var m_blank = true;

    //#endregion

    //#region Public Methods

    this.Constructor = function (id_, useCache_) {

        var w = $wait();

        m_id = id_;
        m_cache = useCache_;

        if (m_id == null)
            return this.Init();

        $code(

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

        return w.promise();

    };
	
	this.Dispose = function(){		
		//if(_self) _self.Columns = null;
		_self = null;		
	};

    this.Init = function () {

        var temptable = Application.Objects.TableInfo();
        app_transferObjectProperties.call(this, temptable);
        this.Name = m_id;

        this.Columns = Application.Objects.ArrayList();
        this.Keys = Application.Objects.ArrayList();

        m_blank = true;

        return this;
    };

    this.Fetch = function () {

        if (this.Name == null)
            this.Name = m_id;

        if (m_cache == null)
            m_cache = true;

        var w = $wait();

        //Check the client side cache for the table.
        var cr = Application.Cache.Check("TableFetch", this.Name);
        if (cr && m_cache) {

            app_transferObjectProperties.call(_self, cr);

            for (var i in _self.Columns) {

                var tempcol = new TableColumn();
                app_transferObjectProperties.call(tempcol, _self.Columns[i]);
                tempcol.XName = tempcol.Name;
                _self.Columns[i] = tempcol;

            }

            m_blank = false;
            return _self;
        }

        Application.ExecuteWebService("TableFetch",
        { auth: Application.auth, name_: this.Name, cache_: m_cache }, function (r) {

            if (r == null || r.Message) {
                w.resolve(null);
                return;
            }

            //Save the table to the client side cache.
            Application.Cache.Save("TableFetch", _self.Name, r);

            app_transferObjectProperties.call(_self, r);

            for (var i in _self.Columns) {

                var tempcol = new TableColumn();
                app_transferObjectProperties.call(tempcol, _self.Columns[i]);
                tempcol.XName = tempcol.Name;
                _self.Columns[i] = tempcol;

            }
            
            m_blank = false;
            w.resolve(_self);
        });

        return w.promise();
    };

    this.Modification = function (func_) {

        var w = $wait();

        Application.ExecuteWebService(func_,
        { auth: Application.auth, table_: this }, function (r) {

            w.resolve(r);

        });

        return w.promise();

    };

    this.Insert = function () {

        return this.Modification("TableInsert");

    };

    this.Modify = function () {

        return this.Modification("TableModify");

    };

    this.Delete = function () {

        return this.Modification("TableDelete");

    };

    this.Rename = function (id_) {

        var oldname = this.Name;
        this.Name = id_;

        var w = $wait();

        Application.ExecuteWebService("TableRename",
        { auth: Application.auth, table_: this, oldName_: oldname }, function (r) {

            w.resolve(r);

        });

        return w.promise();

    };

    this.Blank = function () {
        return m_blank;
    };

    this.Column = function (key_) {
        try {
            for (var i in this.Columns) {
                if (this.Columns[i].Name == key_) {
                    return this.Columns[i];
                }
            }
        }
        catch (e) {
        }

        return null;
    }

    this.RenameColumn = function (key_, newkey_) {
        try {
            for (var i in this.Columns) {
                if (this.Columns[i].Name == key_) {
                    this.Columns[i].Name = newkey_;
                }
            }
        }
        catch (e) {
        }

        return null;
    }

    this.AddColumn = function (col_) {
        try {
            if (this.Column(col_.Name) != null) {
                return false;
            }

            this.Columns[this.Columns.length] = col_;
            return true;
        }
        catch (e) {
            return false;
        }
    }

    this.Key = function (key_) {
        try {
            for (var i in this.Keys) {
                if (this.Keys[i] == key_) {
                    return this.Keys[i];
                }
            }
        }
        catch (e) {
        }

        return null;
    }

    this.AddKey = function (key_) {
        try {
            if (this.Key(key_) != null) {
                return false;
            }

            this.Keys[this.Keys.length] = key_;
            return true;
        }
        catch (e) {
            return false;
        }
    };

    this.UpdateProperty = function (property_, value_) {

        if (m_blockChange == true) {
            return false;
        }

        if (this[property_] != null) {
            if (value_ == null) {
                this[property_] = '';
            }
            else {
                this[property_] = value_;
            }
        }
    };
	
	this.HasView = function(){
		for(var i = 0; i < this.Columns.length; i++){
			var c = this.Columns[i];
			if(c.LookupDisplayField != "" || (c.FlowField != "" && c.FlowField.indexOf("function") == -1) || c.Formula != "" || c.FlowFilter){
                return true;
            }
		}
		return false;
	};

    //#endregion

    return this.Constructor(id_, useCache_);

});

Define("TableColumn", null, function () {

    //#region Members

    var m_blockChange = false;

    //#endregion

    //#region Public Methods

    this.Constructor = function () {
        this.Init();
    };

    this.Init = function () {

        var tempcol = Application.Objects.ColumnInfo();
        app_transferObjectProperties.call(this, tempcol);
    };

    this.UpdateProperty = function (property_, value_) {
    
        if (m_blockChange == true) {
            return false;
        }

        if (this[property_] != null) {
            if (value_ == null) {
                this[property_] = '';
            }
            else {
                this[property_] = value_;
            }
        }
    };

    //#endregion

    this.Constructor();

});
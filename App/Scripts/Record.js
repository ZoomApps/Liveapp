/**
 * @description
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * **CONTENTS**
 * - [Description](#description)
 * - [Instantiating a Record object](#instantiating-a-record-object)
 * - [Accessing column values](#accessing-column-values)
 * - [Data Type Mappings](#data-type-mappings)
 * - [Constructor](#constructor)
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Description
 * 
 * Record Class. Represents one or more records from a table.
 * 
 * Contains functions to query and manipulate database records.
 * 
 * <div style='background: #f9f2f4; padding: 5px'>**NOTE: Methods that return a `JQueryPromise` should be returned into a {@link $codeblock}**</div>
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Instantiating a Record object
 * 
 * If a record with table definition is required, a {@link $codeblock} must be used. Eg:
 * ```javascript
 * return $codeblock(
 *  function(){
 *      return new Record('Test Table');
 *  },
 *  function(r){
 *      // r is a record object with table definition.
 *  }
 * );
 * ```
 * 
 * If table definition is not needed, the constructor must be called with zero arguments. A `$codeblock` is not required for this method. Eg:
 * 
 * ```javascript
 * var r = new Record();
 * ```
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Accessing column values
 * 
 * If the table definition is loaded, each column in the table will be added to the object as a property. Eg:
 * 
 * If Test Table has 2 columns (ID (int) and Name (text)), the following properties are available:
 * ```javascript
 * return $codeblock(
 *  function(){
 *      return new Record('Test Table');
 *  },
 *  function(r){
 *      // r.ID is a number property representing the ID column
 *      // r.Name is a string property representing the Name column
 *  }
 * );
 * ```
 * 
 * **NOTE: If the column name contains spaces, the property will also conatin spaces. Eg. [Start Date] column can be accessed as a property via `r['Start Date']`**
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Data Type Mappings
 * 
 * Here is a list of data type mappings.
 * 
 * Column Type | Javascript Type
 * ---------- | --------- |
 * BigBlob | string (base64) |
 * BigText | string |
 * Blob | string (base64) |
 * Boolean | boolean |
 * Char | string |
 * Code | string |
 * Date | date |
 * Decimal | number |
 * Integer| number |
 * Option | string |
 * Text | string |
 * Time | date |
 * Image | string (base64) |
 * DateTime | date |
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Constructor
 * 
 * Params:
 * @class Record
 * @global
 * @param {string} [name_] Name of the table. If `null`, the table definition will not be loaded.
 * @returns {Record|JQueryPromise(Record)} Returns a new `Record` object or a promise to return a new `Record` object.
 */
Define("Record", null, function (name_) {

    //#region Members

    var _self = this;
    var m_name = null;    
    var m_records = [];
    var m_xrecords = [];
    var m_mandatory = [];
    var m_table = null; //TableInfo
    var m_flowfields = [];
	var m_fieldsToCalc = null;

    //#endregion

    //#region Public Methods

    this.Constructor = function (name_) {

        m_name = name_;
        if (m_name != null)
            return $codeblock(
                function(){
                    return new Table(m_name);
                },
                function(t){
                    m_table = t;
                    return _self.Init();
                }                
            );        

        /**
         * Number of records in the record set.         
         * @memberof! Record#
         * @type {number}
         * @default 0
         */
        this.Count = 0;

        /**
         * The current position in the record set.         
         * @memberof! Record#
         * @type {number}
         * @default 0
         */
        this.Position = 0;

        /**
         * If `true`, the current record is empty.        
         * @memberof! Record#
         * @type {boolean}
         * @default true
         */
        this.Blank = true;

        /**
         * If `true`, the current record set is temporary.        
         * @memberof! Record#
         * @type {boolean}
         * @default false
         */
        this.Temp = false;

        /**
         * Database table name.
         * @memberof! Record#
         * @type {string}
         */
        this.Table = null;

        /**
         * Table view.
         * @memberof! Record#
         * @type {string}
         */
        this.View = null;

        /**
         * Primary keys for the table.
         * @memberof! Record#
         * @type {string[]}
         */
        this.Keys = [];

        /**
         * Lookup columns.
         * @memberof! Record#
         * @type {string[]}
         */
        this.LookupFields = [];

        /**
         * Current record.        
         * @memberof! Record#
         * @type {RecordInfo}         
         */
        this.Record = null;

        /**
         * Current xrecord (record before any changes were made).        
         * @memberof! Record#
         * @type {RecordInfo}         
         */
        this.xRecord = null;

        var r = Application.Objects.RecordSetInfo();
        app_transferObjectProperties.call(this, r);

        return this;
    };

    /**
     * Disposes the record object.
     * @memberof! Record#
     * @returns {void}
     */
	this.Dispose = function(){		
		if(m_table) m_table.Dispose();
		m_table = null;
		_self = null;		
	};
    
    /**
     * Checks that the table name property has been set. An error will occur if a table name is not set.
     * @memberof! Record#
     * @returns {void}
     */
    this.CheckTableName = function () {
        if (m_name == null)
            m_name = this.Table;
        if (m_name == null)
            Application.Error("Please specify a table name");
    };

    /**
     * Retrieve the table definition for the record object. This is called automatically when the object is instantiated.
     * @memberof! Record#
     * @returns {JQueryPromise(Record)} Promises to return after the definition has been fetched. Returns the `Record` object.
     */
    this.Init = function () {

        var w = $wait();

        //Save the set information.
        var count = this.Count;
        var position = this.Position;
        var view = Default(this.View, "");
        var groupfilters = Default(this.GroupFilters, []);
        var lookupcols = Default(this.LookupFields, []);

        this.CheckTableName();

        //Check the client side cache for the record.
        var cr = Application.Cache.Check("RecordInit", m_name);
        if (cr) {

            cr.Count = Default(count, 0);
            cr.Position = Default(position, 0);
            cr.NewRecord = false;
            cr.View = view;
            cr.GroupFilters = groupfilters;
            cr.LookupFields = lookupcols;

            //Save the record.
            app_transferObjectProperties.call(_self, cr);
            _self.GetCurrent();
            cr = _self;
            return cr;
        }

        //Execute the web service.
        Application.ExecuteWebService("RecordInit",
        { auth: Application.auth, name_: m_name, view_: view }, function (r) {
            try {

                //Save the record to the client side cache.
                if (m_name.indexOf("VT$") == -1)
                    Application.Cache.Save("RecordInit", m_name, r);

                //Load the set info back in.
                
                r.Count = Default(count, 0);
                r.Position = Default(position, 0);
                r.NewRecord = false;
                r.View = view;
                r.GroupFilters = groupfilters;
                r.LookupFields = lookupcols;

                //Save the record.
                app_transferObjectProperties.call(_self, r);
                _self.GetCurrent();
                r = _self;
                w.resolve(r);

            } catch (e) {
                Application.Error(e);
            }
        });

        return w.promise();

    };

    /**
     * Create a blank record and add it to the end of the set.
     * @memberof! Record#
     * @returns {JQueryPromise(Record)} Promises to return after the record is created. Returns the `Record` object.
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      return r.New();
     *  },
     *  function(r){
     *      // r will be a new blank record for Test Table
     *  }
     * );
     */
    this.New = function () {

        var w = $wait();

        $code(

            function () {
                return _self.Init();
            },

            function (r) {

                //Add init values.
                if (m_table) {
                    for (var j = 0; j < r.Record.Fields.length; j++) {
                        var col = m_table.Column(r.Record.Fields[j].Name);
                        if (col && Default(col.InitValue, "") != "") {
                            if (r.Record.Fields[j].Type == "Date") {
                                r.Record.Fields[j].Value = Application.ParseDate(col.InitValue);
                            } else {
                                r.Record.Fields[j].Value = col.InitValue;
                            }
                        }
                    }
                }

                //Add view as filters.
                var filters = Application.GetFilters(r.View);
                for (var i = 0; i < filters.length; i++) {
                    var filter = filters[i];
                    for (var j = 0; j < r.Record.Fields.length; j++) {
                        if (filter[0] == r.Record.Fields[j].Name) {
                            if (!Application.HasFilterChar(filter[1])) //#42 - Use new check function
                                if (r.Record.Fields[j].Type == "Date") {
                                    r.Record.Fields[j].Value = Application.ParseDate(filter[1]); //#111 - Date incorrect.
                                } else {
                                    r.Record.Fields[j].Value = filter[1];
                                }
                            break;
                        }
                    }
                }
				
				//Add hidden filters.
				for (var i = 0; i < _self.GroupFilters.length; i++) {
                    var filter = _self.GroupFilters[i];
                    for (var j = 0; j < r.Record.Fields.length; j++) {
                        if (filter[0] == r.Record.Fields[j].Name) {
                            if (!Application.HasFilterChar(filter[1])) //#42 - Use new check function
                                if (r.Record.Fields[j].Type == "Date") {
                                    r.Record.Fields[j].Value = Application.ParseDate(filter[1]); //#111 - Date incorrect.
                                } else {
                                    r.Record.Fields[j].Value = filter[1];
                                }
                            break;
                        }
                    }
				}                

                r.NewRecord = true;
                r.Record.RecID = $id();
                r.xRecord.RecID = r.Record.RecID;

                _self.Record = CloneRecord(r.Record);
                m_records.push(CloneRecord(r.Record));
                _self.xRecord = CloneRecord(r.Record);
                m_xrecords.push(CloneRecord(r.Record));

                _self.Position = m_records.length - 1;
                _self.Count += 1;

                _self.GetCurrent();
                r = _self;
                return r;
            }

        );

        return w.promise();
    };

    /**
     * Remove all filters and refetch the record set data.
     * @memberof! Record#
     * @returns {JQueryPromise(Record)} Promises to return after the new record set data has been fetched. Returns the `Record` object.
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      r.Filter('ID','1');
     *      return r.FindFirst();
     *  },
     *  function(r){
     *      // r.Count = 1
     *      return r.Reset();
     *  },
     *  function(r){
     *      // r.Count > 1 (contains all records from Test Table)      
     *  }
     * );
     */
    this.Reset = function () {

        var w = $wait();

        $code(

            function () {
                return _self.FindSet(true, true);
            },

            function (r) {
                //Save the record.
                app_transferObjectProperties.call(_self, r);
                _self.GetCurrent();
                r = _self;
                return r;
            }

        );

        return w.promise();
    };

    /**
     * Get a record by it's primary key/s.
     * @memberof! Record#
     * @param {...string} keys Primary key values.
     * @returns {JQueryPromise(Record)} Promises to return after the record has been fetched. Returns the `Record` object.
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      return r.Get('1');
     *  },
     *  function(r){
     *      // r will contain a Test Table record with ID = 1     
     *  }
     * );
     */
    this.Get = function () {

        var w = $wait();

        var keys = null;
        if (arguments.length > 0 && $.isArray(arguments[0])) {
            keys = arguments[0];
        } else {
            keys = arguments;
        }

        //Save the filters.
        var filters = "";
        for (var i = 0; i < keys.length; i++) {
            if (filters == "") {
                filters = keys[i];
            }
            else {
                filters += "|" + keys[i];
            }
        }

        Application.LogDebug("Getting " + m_name + " Record: Filters - " + filters);

        //Get the record.
        Application.ExecuteWebService("RecordGet",
        { auth: Application.auth, table_: m_name, filters_: filters }, function (r) {

            if (r) {
                try {
                    m_records = CloneRecordSet(r);
                    m_xrecords = CloneRecordSet(r);
                    if (r.length == 0) { //No record.
                        Application.LogDebug("No " + m_name + " records found.");
                        _self.Clear();
                        _self.GetCurrent();
                        r = _self;
                    } else { //1 record.
                        Application.LogDebug(m_name + " record found.");
                        _self.Record = CloneRecord(m_records[0]);
                        _self.xRecord = CloneRecord(m_xrecords[0]);
                        _self.Position = 0;
                        _self.Count = 1;
                        _self.Blank = false;
                        _self.GetCurrent();
                        r = _self;
                    }
                } catch (e) {
                    Application.Error(e);
                }
            }

            w.resolve(r);

        });

        return w.promise();
    };

    /**
     * Fetch a set of records.
     * @memberof! Record#
     * @param {boolean} first_ If `true`, the position will be set to the first record otherwise, the last.
     * @param {boolean} [reset_=false] If `true`, all filters will be removed.
     * @returns {JQueryPromise(Record)} Promises to return after the records have been fetched. Returns the `Record` object.
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      return r.FindSet(true);
     *  },
     *  function(r){
     *      // r will contain all Test Table records and the current record
     *      // position will be set to the first record.
     *  }
     * );     
     */
    this.FindSet = function (first_, reset_) {

        if (reset_ == null) reset_ = false;

        this.CheckTableName();

        //Check if we have the table definition.
        if (!m_table) {
            return $codeblock(
                function () {
                    return new Table(m_name);
                },
                function (t) {
                    m_table = t;
                    return _self.FindSet(first_, reset_);
                }
            );
        }

        Application.LogDebug("Getting " + m_name + " RecordSet");

        var w = $wait();

        Application.ExecuteWebService("RecordSet",
        { auth: Application.auth, table_: m_name, view_: Default(this.View, ""), reset_: reset_, calcfields_: this.CalculatedFields, groupFilters_: this.GroupFilters, lookupCols_: this.LookupFields, group_: false }, function (r) {

            if (r) {
                try {

                    if (Application.maxRecords > 0) {
                        var i = r.length - Application.maxRecords;
                        if (i > 0)
                            r.splice(Application.maxRecords, i);
                    }

                    m_records = CloneRecordSet(r);
                    m_xrecords = CloneRecordSet(r);
                    if (r.length == 0) { //No records.
                        Application.LogDebug("No " + m_name + " records found.");
                        _self.Clear();
                        _self.GetCurrent();
                        r = _self;
                    } else if (first_) { //First record.
                        Application.LogDebug(m_records.length + " " + m_name + " records found.");
                        _self.Record = CloneRecord(m_records[0]);
                        _self.xRecord = CloneRecord(m_xrecords[0]);
                        _self.Position = 0;
                        _self.Count = m_records.length;
                        _self.Blank = false;
                        _self.GetCurrent();
                        r = _self;
                    } else { //Last record.
                        Application.LogDebug(m_records.length + " " + m_name + " records found.");
                        _self.Record = CloneRecord(m_records[m_records.length - 1]);
                        _self.xRecord = CloneRecord(m_xrecords[m_xrecords.length - 1]);
                        _self.Position = m_records.length - 1;
                        _self.Count = m_records.length;
                        _self.Blank = false;
                        _self.GetCurrent();
                        r = _self;
                    }
                } catch (e) {
                    Application.Error(e);
                }
            }
            w.resolve(r);

        });

        return w.promise();
    };

    /**
     * Count the number of records in a table.
     * @memberof! Record#     
     * @param {boolean} [reset_=false] If `true`, all filters will be removed.
     * @returns {JQueryPromise(Record)} Promises to return after the record count has been fetched. Returns the `Record` object.
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){     
     *      return r.CountRecords();
     *  },
     *  function(r){
     *      // r.Count = The record count for Test Table
     *  }
     * );     
     */
    this.CountRecords = function (reset_) {

        if (reset_ == null) reset_ = false;

        this.CheckTableName();

        //Check if we have the table definition.
        if (!m_table) {
            return $codeblock(
                function () {
                    return new Table(m_name);
                },
                function (t) {
                    m_table = t;
                    return _self.CountRecords(reset_);
                }
            );
        }

        Application.LogDebug("Getting " + m_name + " Count");

        var w = $wait();

        Application.ExecuteWebService("RecordSet",
        { auth: Application.auth, table_: m_name, view_: Default(this.View, ""), reset_: reset_, calcfields_: this.CalculatedFields, groupFilters_: this.GroupFilters, lookupCols_: this.LookupFields, group_: true }, function (r) {

            if (r) {
                try {

					if(Application.IsOffline())
						r = r.length;
				
                    Application.LogDebug(r + " " + m_name + " records found.");
                    _self.Count = r;
                                            
                } catch (e) {
                    Application.Error(e);
                }
            }
            w.resolve(_self);

        });

        return w.promise();
    };

    /**
     * Fetch a set of records and set the position to the first record.
     * @memberof! Record#     
     * @returns {JQueryPromise(Record)} Promises to return after the records have been fetched. Returns the `Record` object.
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      return r.FindFirst();
     *  },
     *  function(r){
     *      // r will contain all Test Table records and the current record
     *      // position will be set to the first record.
     *  }
     * );     
     */
    this.FindFirst = function () {
        return this.FindSet(true);
    };

    /**
     * Fetch a set of records and set the position to the last record.
     * @memberof! Record#     
     * @returns {JQueryPromise(Record)} Promises to return after the records have been fetched. Returns the `Record` object.
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      return r.FindLast();
     *  },
     *  function(r){
     *      // r will contain all Test Table records and the current record
     *      // position will be set to the last record.
     *  }
     * );     
     */
    this.FindLast = function () {
        return this.FindSet(false);
    };

    /**
     * Perform a database operation.
     * @memberof! Record#
     * @protected
     * @param {*} obj_ `Record` object to perform the operation on.
     * @param {string} func_ Operation to perform (RecordInsert,RecordModify,RecordDelete,RecordModifyAll,RecordDeleteAll).
     * @param {string} [col_] Column name to modify (RecordModifyAll only). 
     * @param {*} [value_] Value to modify (RecordModifyAll only).
     * @param {boolean} [ignoreExisting_=false] Ignore Primary Key or Unique Key errors (RecordInsert only).
     * @returns {JQueryPromise(Record)} Promises to return after the database operation completes. Returns the `Record` object.          
     */
    this.Modification = function (obj_, func_, col_, value_, ignoreExisting_) {

        var w = $wait();

        //Save the current record properties.
        this.SaveCurrent(obj_);

        if (_self.Temp && func_ != "RecordDelete") {
            return _self;
        }

		//Speed fix?
		var o = new Object();
		app_deepTransferObjectProperties.call(o, obj_);
		
		if(m_table){
			
			var hasView = m_table.HasView();
			for(var i = 0; i < o.Record.Fields.length; i++){
                
                var col = m_table.Column(o.Record.Fields[i].Name);
                
                if(col){
                    o[col.Name] = null;
                    delete o[col.Name];
                    o.xRec[col.Name] = null;
                    delete o.xRec[col.Name];
                }

				if(col && col.FlowField && col.FlowField != "" && !Application.IsOffline()){
					o.Record.Fields[i].Value = null;
					o.xRecord.Fields[i].Value = null;
                }
                if (func_ == "RecordDelete" && col && col.PrimaryKey == false){
					o.Record.Fields[i].Value = null;
					o.xRecord.Fields[i].Value = null;
				}			
				if(hasView && col && col.PrimaryKey == false && (col.Type == "Image" || col.Type == "Blob" || col.Type == "BigBlob") && !Application.IsOffline()){
					if(o.Record.Fields[i].Value == o.xRecord.Fields[i].Value){											
						o.Record.Fields.splice(i,1);
						o.xRecord.Fields.splice(i,1);
						i -= 1;
                    }else if(o.Record.Fields[i].Value == null && o.xRecord.Fields[i].Value !== null){
                        o.xRecord.Fields[i].Value = '1';
                    }						
				}								
			}
			o.Functions = [];			
		}
		
        var params = { auth: Application.auth, rec_: o };
        if (func_ == "RecordModifyAll") { //Bug Fix
            params.col_ = col_;
            params.value_ = value_;
        }

        //#103 - Add ignoreExisting param.
        if (func_ == "RecordInsert") {
            ignoreExisting_ = Default(ignoreExisting_, false);
            params.ignoreExisting_ = ignoreExisting_;
        }

        Application.ExecuteWebService(func_, params, function (r) {

            if (r && r.Message) {
                w.resolve(_self);
                return;
            }

            Application.Fire("RecordModification",{func: func_, params: params});

            try {

                if (func_ == "RecordDelete") {

                    obj_.Count -= 1;

                    if (obj_.Count == 0) {
                        obj_.Clear();
                    }
                    else {
                        obj_.RemoveRecord();
                    }

                } else if (func_ == "RecordDeleteAll") {

                    obj_.Clear();

                } else if (func_ == "RecordModifyAll") {

                    //Do we need to do anything here?

                } else {

                    if (func_ == "RecordInsert" && !Application.IsOffline()) {
                        r.NewRecord = true; //#99 - Keep this true incase of errors.
                    }
                    
                    obj_.Record = CloneRecord(r);                    
                    m_records[obj_.Position] = CloneRecord(obj_.Record);
                    
                    obj_.xRecord = CloneRecord(obj_.Record);
                    m_xrecords[obj_.Position] = CloneRecord(obj_.Record);

                }

                //Load the record.
                obj_.GetCurrent();

            } catch (e) {
                Application.Error(e);
            }

            w.resolve(obj_);

        });

        return w.promise();
    };

    /**
     * Insert the current record into the database. 
     * 
     * **NOTE: If the Primary Key fields are not specified, nothing will happen.**
     * @memberof! Record#     
     * @param {boolean} [trigger_=false] If `true`, run the Insert trigger of the table.
     * @param {boolean} [ignoreExisting_=false] Ignore Primary Key or Unique Key errors.
     * @param {PageViewer} [viewer] `PageViewer` to pass to the Insert trigger.
     * @returns {JQueryPromise(Record)} Promises to return after the record is inserted. Returns the `Record` object.  
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      return r.New(); // Create a new blank record.
     *  },
     *  function(r){
     *      r.Name = 'Test Insert';
     *      return r.Insert(true); // Insert the record and run the insert trigger.
     *  }
     * );        
     */
    this.Insert = function (trigger_, ignoreExisting_, viewer) {

		if(_self.TempRecord() && m_table && Application.IsOffline() && _self.Record.RecID){
			for(var i = 0; i < _self.Record.Fields.length; i++){
				var col = m_table.Column(_self.Record.Fields[i].Name);
				if(col && col.Identity)
					_self[col.Name] = _self.Record.RecID;
			}
		}
		
        //Save the current record properties.
        _self.SaveCurrent();			

        if (_self.NoKeys()) {
            m_records[_self.Position] = CloneRecord(_self.Record);
            return _self;
        }

        _self.DelayInsert = Default(_self.DelayInsert, false);

        return $codeblock(
            function () {
                if (trigger_ && _self.DelayInsert == false)
                    return _self.Trigger("Insert", viewer);
                return _self;
            },
            function (rec) {
                return _self.Modification(rec, "RecordInsert", null, null, ignoreExisting_); //#103 - Ignore existing param
            },
            function () {
                if (trigger_ && _self.DelayInsert == true)
                    return _self.Trigger("Insert", viewer);
                return _self;
            },
            function (rec) {

                //#99 - Fix for error on insert
                _self.Record.NewRecord = false;
                m_records[_self.Position].NewRecord = false;
                m_xrecords[_self.Position] = CloneRecord(_self.Record);
                //_self.GetCurrent();

                if (trigger_ && _self.DelayInsert == true)
                    return _self.Modification(rec, "RecordModify", null, null, ignoreExisting_); //#103 - Ignore existing param
                return _self;
            }
        );
    };

    /**
     * Modify the current record in the database.
     * @memberof! Record#     
     * @param {boolean} [trigger_=false] If `true`, run the Modify trigger of the table.
     * @param {PageViewer} [viewer] `PageViewer` to pass to the Modify trigger.
     * @returns {JQueryPromise(Record)} Promises to return after the record is modified. Returns the `Record` object.  
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      r.Filter('ID','1');
     *      return r.FindFirst(); // Get the record where ID = 1
     *  },
     *  function(r){
     *      r.Name = 'Test Modify';
     *      return r.Modify(true); // Modify the record and run the modify trigger.
     *  }
     * );        
     */
    this.Modify = function (trigger_, viewer) {

        //Save the current record properties.
        _self.SaveCurrent();

        if (_self.NoKeys()) {
            m_records[_self.Position] = CloneRecord(_self.Record);
            return _self;
        }

        return $codeblock(
            function () {
                if (trigger_)
                    return _self.Trigger("Modify", viewer);
                return _self;
            },
            function (rec) {
                return _self.Modification(rec, "RecordModify");
            }
        );
    };

    /**
     * Modify all records matching the current filters.
     * 
     * **NOTE: The table's modify trigger will not be run.**
     * @memberof! Record#     
     * @param {string} col_ Column name to modify.
     * @param {*} value_ Value to modify.
     * @returns {JQueryPromise(Record)} Promises to return after the records are modified. Returns the `Record` object.  
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      r.Filter('ID','>1');
     *      return r.ModifyAll('Name','Test Modify All'); // All records with an ID > 1 will have Name = 'Test Modify All'
     *  }
     * );        
     */
    this.ModifyAll = function (col_, value_) {
        if(Application.GetFilters(_self.View).length === 0)
            return _self;
        return $codeblock(
            function () {
                return _self.Modification(_self, "RecordModifyAll", col_, value_);
            }
        );
    };

    /**
     * Delete the current record from the database.
     * @memberof! Record#     
     * @param {boolean} [trigger_=false] If `true`, run the Delete trigger of the table.
     * @param {PageViewer} [viewer] `PageViewer` to pass to the Delete trigger.
     * @returns {JQueryPromise(Record)} Promises to return after the record is deleted. Returns the `Record` object.  
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      r.Filter('ID','1');
     *      return r.FindFirst(); // Get the record where ID = 1
     *  },
     *  function(r){     
     *      return r.Delete(true); // Delete the record and run the delete trigger.
     *  }
     * );        
     */
    this.Delete = function (trigger_, viewer) {
        return $codeblock(
            function () {
                if (trigger_ && !_self.NoKeys()) //#113 - Don't run trigger without keys.
                    return _self.Trigger("Delete", viewer);
                return _self;
            },
            function (rec) {
                return _self.Modification(rec, "RecordDelete");
            }
        );
    };

    /**
     * Delete all records matching the current filters.
     * 
     * **NOTE: The table's delete trigger will not be run.**
     * @memberof! Record#
     * @returns {JQueryPromise(Record)} Promises to return after the records are deleted. Returns the `Record` object.  
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      r.Filter('ID','10..20');
     *      return r.DeleteAll(); // All records with an ID between 10 and 20 will be deleted.
     *  }
     * );        
     */
    this.DeleteAll = function () {
        if(Application.GetFilters(_self.View).length === 0)
            return _self;
        return $codeblock(
            function () {
                return _self.Modification(_self, "RecordDeleteAll");
            }
        );
    };

    /**
     * Goto the next record in the record set.
     * @memberof! Record#
     * @returns {boolean} Returns `false` when there are no more records.
     * @example
     * r.First();
     * do{
     *   // this will loop through each record in the record set.
     * }while(r.Next());
     */
    this.Next = function () {

        if (this.Count == 0)
            return false;

        this.Position += 1;

        Application.LogDebug("Getting next " + m_name + " Record: #" + this.Position);

        if (this.Position < 0) {
            this.Position = 0;
            return false;
        }
        else if (this.Position >= this.Count) {
            this.Position = this.Count - 1;
            return false;
        }

        this.Record = CloneRecord(m_records[this.Position]);
        this.xRecord = CloneRecord(m_xrecords[this.Position]);
        this.GetCurrent();
        return true;
    };

    /**
     * Goto the previous record in the record set.
     * @memberof! Record#
     * @returns {boolean} Returns `false` when there are no more records.
     * @example
     * r.Last();
     * do{
     *   // this will loop through each record in the record set (backwards).
     * }while(r.Prev());
     */
    this.Prev = function () {

        if (this.Count == 0)
            return false;

        this.Position -= 1;

        Application.LogDebug("Getting previous " + m_name + " Record: #" + this.Position);

        if (this.Position < 0) {
            this.Position = 0;
            return false;
        }
        else if (this.Position >= this.Count) {
            this.Position = this.Count - 1;
            return false;
        }

        this.Record = CloneRecord(m_records[this.Position]);
        this.xRecord = CloneRecord(m_xrecords[this.Position]);
        this.GetCurrent();
        return true;
    };

    /**
     * Goto the first record in the record set.
     * @memberof! Record#
     * @returns {boolean} Returns `false` if there are no records.
     * @example
     * r.First();
     * // the current record will be the first in the set.
     */
    this.First = function () {

        if (this.Count == 0)
            return false;

        this.Position = 0;
        this.Record = CloneRecord(m_records[this.Position]);
        this.xRecord = CloneRecord(m_xrecords[this.Position]);
        this.GetCurrent();
        return true;
    };

    /**
     * Goto the last record in the record set.
     * @memberof! Record#
     * @returns {boolean} Returns `false` if there are no records.
     * @example
     * r.Last();
     * // the current record will be the last in the set.
     */
    this.Last = function () {

        if (this.Count == 0)
            return false;

        this.Position = m_records.length - 1;
        this.Record = CloneRecord(m_records[this.Position]);
        this.xRecord = CloneRecord(m_xrecords[this.Position]);
        this.GetCurrent();
        return true;
    };
    
    /**
     * Goto the record at a certain position in the record set.
     * @memberof! Record#
     * @param {number} pos The position to go to (zero based).
     * @returns {boolean} Returns `false` if there are no records.
     * @example
     * r.SetPosition(2);
     * // the current record will be the third in the set.
     */
	this.SetPosition = function (pos) {

        if (this.Count == 0)
            return false;

        this.Position = pos;
        this.Record = CloneRecord(m_records[this.Position]);
        this.xRecord = CloneRecord(m_xrecords[this.Position]);
        this.GetCurrent();
        return true;
    };

    /**
     * Get a filter value.
     * @memberof! Record#
     * @param {string} col_ Column name to check.
     * @param {boolean} [filterGroup_=false] If `true` check hidden filters for the value.
     * @returns {string} Returns the filter value if found, otherwise returns a blank string.
     * @example
     * r.Filter('ID','>1');
     * // r.GetFilter('ID') = '>1'
     * // r.GetFilter('Name') = ''
     */
    this.GetFilter = function (col_, filterGroup_) {
        if (!filterGroup_) {
			return Application.GetFilter(col_, _self.View);
        } else {
			for (var i = 0; i < _self.GroupFilters.length; i++) {
                if (_self.GroupFilters[i].Name == col_) {
                    return _self.GroupFilters[i].Value;
                }
            }
		}
    };

    /**
     * Set/remove a filter value.
     * @memberof! Record#
     * @param {string} col_ Column to filter.
     * @param {string} [filter_] Filter value. If `null`, removes the filter for the column.
     * @param {boolean} [filterGroup_=false] If `true`, adds the filter as a hidden filter.
     * @returns {void}
     * @example
     * r.Filter('ID','>1'); // Add a filter for where ID > 1.
     * r.Filter('Name'); // Remove the filter on the Name column.
     */
    this.Filter = function (col_, filter_, filterGroup_) {

        filterGroup_ = Default(filterGroup_, null);

        if (filterGroup_ == null) {

            //Add to the view.    
            _self.View = Application.AddFilter(_self.View, col_, filter_);

        } else {

            //Add a group filter.
            for (var i = 0; i < _self.GroupFilters.length; i++) {
                if (_self.GroupFilters[i].Name == col_) {
                    _self.GroupFilters.splice(i, 1);
                    i--;
                }
            }
            if (filter_ != null) {
                var f = new Application.Objects.RecordFieldInfo();
                f.Name = col_;
                f.Value = filter_;
                _self.GroupFilters.push(f);
            }
        }
    };

    /**
     * Get the current filters.
     * @memberof! Record#
     * @returns {RecordFieldInfo[]} Returns an array of filters.
     */
    this.Filters = function () {
        var filters = Application.GetFilters(_self.View);
        var ret = new Array();
        for (var i = 0; i < filters.length; i++) {
            var f = new Application.Objects.RecordFieldInfo();
            f.Name = filters[i][0];
            f.Value = filters[i][1];
            ret.push(f);
        }
        return ret;
    };

    /**
     * Determine if the current record was created in offline mode.
     * @memberof! Record#
     * @returns {boolean} Returns `true` if the current record was created in offline mode.
     */
	this.TempRecord = function(){
		if(!_self.Record.RecID)
			return false;
		return _self.Record.RecID.toString().indexOf(":") == -1;
	};
    
    /**
     * Get the table name.
     * @memberof! Record#
     * @returns {string} Returns the table name.
     */
	this.Name = function(){
		return m_name;
	};
    
    /**
     * Get the caption for a record field.
     * @memberof! Record#
     * @param {string} field_ Field name.
     * @returns {string} Returns the field caption if found, otherwise returns a blank string.
     */
    this.Caption = function (field_) {

        //Get the Field caption.
        for (var i = 0; i < this.Record.Fields.length; i++) {
            if (this.Record.Fields[i].Name == field_) {
                return this.Record.Fields[i].Caption;
            }
        }

        return "";
    };

    /**
     * Copies record field values to the `Record` object properties.
     * @memberof! Record#
     * @returns {void}
     * @see [Accessing column values](#accessing-column-values)
     * @example
     * r.GetField('Name').Value = 'Test 123';
     * r.GetCurrent();
     * // r.Name = 'Test 123'
     */
    this.GetCurrent = function () {

        //Clear the xRec.
        this.xRec = new Object;

        DeFriendifyValues(this);

        for (var i = 0; i < this.Record.Fields.length; i++) {

            //Create/update the record set property.
            this[this.Record.Fields[i].Name] = this.Record.Fields[i].Value;

            //Create/update the xRec property.
            this.xRec[this.Record.Fields[i].Name] = this.xRecord.Fields[i].Value;
        }

        this.NewRecord = this.Record.NewRecord;

        _self.Calcfields();
    };

    /**
     * Copies the `Record` object properties to record field values.
     * @memberof! Record#
     * @param {Record} [rec_] `Record` object to use. If `null` will use the current `Record` object.
     * @param {boolean} [skipff=false] If `false` flowfields will be blanked out.
     * @param {boolean} [skipxrec=false] If `false` the xrecord will be processed too.
     * @returns {void}
     * @see [Accessing column values](#accessing-column-values)
     * @example
     * r.Name = 'Test 123'
     * r.SaveCurrent();
     * // r.GetField('Name').Value = 'Test 123';
     */
    this.SaveCurrent = function (rec_, skipff, skipxrec) {

        rec_ = Default(rec_, _self);
        for (var i = 0; i < rec_.Record.Fields.length; i++) {
            if (rec_[rec_.Record.Fields[i].Name] == null && _self.GetField("FF$" + rec_.Record.Fields[i].Name) != null && !skipff) {
                rec_["FF$" + rec_.Record.Fields[i].Name] = "";
            }
            rec_.Record.Fields[i].Value = rec_[rec_.Record.Fields[i].Name];
			if(!skipxrec)
				rec_.xRecord.Fields[i].Value = rec_.xRec[rec_.Record.Fields[i].Name];
        }

        if (this.Count == 0)
            return;

        m_records[_self.Position] = CloneRecord(rec_.Record);
		if(!skipxrec)
			m_xrecords[_self.Position] = CloneRecord(rec_.xRecord);
    };

    /**
     * Remove the record at the current position from the record set.
     * @memberof! Record#
     * @returns {void}
     */
    this.RemoveRecord = function () {

        m_records.splice(this.Position, 1);
        m_xrecords.splice(this.Position, 1);

        if (this.Position >= this.Count) {
            this.Position = this.Count - 1;
        }

        this.Record = CloneRecord(m_records[this.Position]);
        this.xRecord = CloneRecord(m_xrecords[this.Position]);
    };

    /**
     * Clear the `Record` object (removes all records from the record set and blanks all properties).
     * @memberof! Record#
     * @returns {void}
     */
    this.Clear = function () {

        this.Blank = true;
        //this.View = "";
        this.NewRecord = true;
        this.Record.UnAssigned = false;
        this.Record.NewRecord = true;
        this.Record.RecID = "";
        this.xRecord.NewRecord = true;
        this.xRecord.UnAssigned = false;
        this.xRecord.RecID = "";
        this.Count = 0;
        this.Position = 0;
        this.Temp = false;
        m_records = [];
        m_xrecords = [];

        for (var i = 0; i < this.Record.Fields.length; i++) {
            var val = this.Record.Fields[i].Value;
            if (typeof val == "string")
                this.Record.Fields[i].Value = null;
            if (typeof val == "number")
                this.Record.Fields[i].Value = null;
            if (typeof val == "boolean")
                this.Record.Fields[i].Value = false;
            if (Object.prototype.toString.call(val) == "[object Date]")
                this.Record.Fields[i].Value = null;
        }
        this.xRecord = CloneRecord(this.Record);
    };

    /**
     * Clear the xrecord. 
     * @memberof! Record#
     * @param {boolean} [clearkeys=false] If `true`, the primary key fields will be cleared.
     * @param {string[]} [keys] Array of primary keys. If `null` will use `this.Keys`.
     * @returns {void}
     */
    this.ClearXRec = function (clearkeys, keys) {

        clearkeys = Default(clearkeys, false);
        keys = Default(keys, _self.Keys);

        this.xRecord.NewRecord = true;
        this.xRecord.UnAssigned = false;
        this.xRecord.RecID = "";

        for (var i = 0; i < this.xRecord.Fields.length; i++) {
            if (keys && !clearkeys && keys.indexOf(this.xRecord.Fields[i].Name) != -1) {
            } else {
                var val = this.xRecord.Fields[i].Value;
                if (typeof val == "string")
                    this.xRecord.Fields[i].Value = "";
                if (typeof val == "number")
                    this.xRecord.Fields[i].Value = 0;
                if (typeof val == "boolean")
                    this.xRecord.Fields[i].Value = false;
                if (Object.prototype.toString.call(val) == "[object Date]")
                    this.xRecord.Fields[i].Value = null;
                this.xRec[this.xRecord.Fields[i].Name] = this.xRecord.Fields[i].Value;
            }
        }
    };

    /**
     * Validate a value using the column's validate trigger.
     * @memberof! Record#
     * @param {string} col Column to validate.
     * @param {*} value Value to validate.
     * @param {PageViewer} [viewer] `PageViewer` to pass into the validate trigger.
     * @returns {JQueryPromise(Record)} Promise to return after validating the value. Returns the `Record` object.
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){
     *      return r.Validate('Name','Test Validate');
     *  }
     * ); 
     */
    this.Validate = function (col, value, viewer) {

        var func_code = null;
        for (var i = 0; i < this.Functions.length; i++) {
            if (this.Functions[i][0] == col) {
                func_code = this.Functions[i][1];
                break;
            }
        }

        return $codeblock(
            function () {
                _self[col] = value;
                if (func_code != null) {

                    var table = _self;

                    //Issue #46 Error when using validate function.
                    var win = null;
                    if (viewer)
                        win = viewer.Window();

                    eval("var func = function validateRecord(rec){return $codeblock(" +
                    "function(){" + func_code + "}, " +
                    "function(){rec.SaveCurrent();return rec;}" +
                    ");}");
                    return func(_self);
                } else {
                    _self.SaveCurrent();
                    return _self;
                }
            }
        );
    };

    /**
     * Execute a table trigger.
     * @memberof! Record#
     * @protected
     * @param {string} trigger Table trigger name.
     * @param {PageViewer} [viewer] `PageViewer` to pass into the trigger.
     * @returns {JQueryPromise(Record)} Promise to return after executing the trigger. Returns the `Record` object.
     */
    this.Trigger = function (trigger, viewer) {

        var func_code = null;
        for (var i = 0; i < this.Functions.length; i++) {
            if (this.Functions[i][0] == trigger) {
                func_code = this.Functions[i][1];
                break;
            }
        }

        return $codeblock(
            function () {
                if (func_code != null) {
                    eval("var func = function runTrigger(rec,viewer){return $codeblock(" +
                    "function(){" + func_code + "}, " +
                    "function(){return rec;}" +
                    ");}");
                    return func(_self,viewer);
                } else {
                    return _self;
                }
            }
        );
    };

    /**
     * Test a field value. If the test fails, an error will occur.
     * @memberof! Record#
     * @param {string} col Coulumn to test.
     * @param {*} [value] Value to test for. If `null`, the column will be tested for a non `null` value.
     * @returns {void}
     * @example
     * r.Name = 'Test';
     * r.TestField('Name'); // This will pass as Name has a non null value.
     * r.TestField('Name','123') // This will error as the value of Name is not '123'.
     */
    this.TestField = function (col, value) {

        if (value == null) {
            var err = Application.StrSubstitute("You must specify $1.", col);
			
			if (this[col] == null)
				Application.Error(err);
            if (typeof this[col] == "number" && this[col] == 0)
                Application.Error(err);
            if (typeof this[col] == "string" && this[col] == "")
                Application.Error(err);
			
        } else {

            if ($.isArray(value)) {
                if (value.indexOf(this[col]) == -1)
                    Application.Error(Application.StrSubstitute("$1 must be in $2.", col, value.list()));
            } else {
                if (this[col] != value)
                    Application.Error(Application.StrSubstitute("$1 must be $2.", col, value));
            }
        }
    };

    /**
     * Update the xrecord with the current record values.
     * @memberof! Record#
     * @returns {void}
     */
    this.UpdateXRec = function () {
        _self.xRecord = CloneRecord(_self.Record);
		m_xrecords[_self.Position] = CloneRecord(_self.Record);
        _self.GetCurrent();
    };

    /**
     * Rollback the record values to the xrecord values.
     * @memberof! Record#
     * @returns {void}
     */
    this.RollBack = function () {
        if (_self.Record.UnAssigned || _self.Record.NewRecord)
            return;
        _self.Record = CloneRecord(_self.xRecord);
		m_records[_self.Position] = CloneRecord(_self.Record);
        _self.GetCurrent();
    };

    /**
     * Copy a record into the `Record` object.
     * @memberof! Record#
     * @param {Record} r `Record` to copy into this `Record` object.
     * @returns {void}
     * @example
     * return $codeblock(
     *  function(){
     *      return new Record('Test Table');
     *  },
     *  function(r){     
     *      return r.FindFirst();
     *  },
     *  function(r){
     *      var r2 = new Record();
     *      r2.Copy(r);
     *      // r2 will contain the current record from r      
     *  }
     * );
     */
    this.Copy = function (r) {

		var t = new Object();
		app_deepTransferObjectProperties.call(t, r.DatabaseTable());
								
		m_table = t;
		
        this.Table = r.Table;
        this.Record = CloneRecord(r.Record);
        m_records = [CloneRecord(r.Record)];
        this.xRecord = CloneRecord(r.xRecord);
        m_xrecords = [CloneRecord(r.xRecord)];
        this.Position = r.Position;
        this.Count = r.Count;
        this.Blank = false;
        this.Temp = r.Temp;
        this.Functions = [];
        for (var i = 0; i < r.Functions.length; i++) {
            this.Functions.push(r.Functions[i]);
        }
        m_mandatory = [];
        for (var i = 0; i < r.MandatoryFields().length; i++) {
            m_mandatory.push(r.MandatoryFields()[i]);
        }
        this.GroupFilters = [];
        for (var i = 0; i < r.GroupFilters.length; i++) {
            this.GroupFilters.push(r.GroupFilters[i]);
        }
        this.LookupFields = [];
        for (var i = 0; i < r.LookupFields.length; i++) {
            this.LookupFields.push(r.LookupFields[i]);
        }
        this.Keys = [];
        for (var i = 0; i < r.Keys.length; i++) {
            this.Keys.push(r.Keys[i]);
        }
        this.GetCurrent();
    };
    
    /**
     * Get this records `Table` object.
     * @memberof! Record#
     * @returns {Table} Returns this records `Table` object.
     */
	this.DatabaseTable = function(){
		return m_table;
	};

    /**
     * Add a new field to the record.
     * @memberof! Record#
     * @param {string} name_ Name of the field.
     * @param {string} caption_ Field caption.
     * @param {string} type_ Column type.
     * @param {*} value_ Value of the field.
     * @returns {void}
     */
    this.AddValue = function (name_, caption_, type_, value_) {
        this.Record.Fields.push({ Name: name_, Caption: caption_, Value: value_, Type: type_ });
        this.UpdateXRec();
        this.GetCurrent();
    };

    /**
     * Transfer field values from another record.
     * @memberof! Record#
     * @param {Record} rec_ `Record` to copy field values from.
     * @param {string} [exclude_] Comma seperated list of columns to exclude from the transfer.
     * @param {function(string,*)} [callback_] Callback function that is executed for each field transferred. The field name and new value is passed in.
     * @returns {void}
     * @example
     * // Transfer all fields except ID and log the changes.
     * r2.TransferFields(r,'ID',function(field,value){
     *  Application.LogInfo('Field '+field+' value has changed: '+value.toString());
     * });
     */
    this.TransferFields = function (rec_, exclude_, callback_) {

        exclude_ = Default(exclude_, "");
        exclude_ = exclude_.split(",");
        for (var i = 0; i < rec_.Record.Fields.length; i++) {
            for (var j = 0; j < _self.Record.Fields.length; j++) {
                if (_self.Record.Fields[j].Name == rec_.Record.Fields[i].Name) {
                    if (exclude_.indexOf(_self.Record.Fields[j].Name) == -1) {
                        _self.Record.Fields[j].Value = rec_[rec_.Record.Fields[i].Name];
                        if (callback_)
                            callback_(_self.Record.Fields[j].Name, _self.Record.Fields[j].Value);
                    }
                    break;
                }
            }
        }
        this.GetCurrent();
    };

    /**
     * Get a record field.
     * @memberof! Record#
     * @param {string} name_ Field name.
     * @returns {RecordFieldInfo} Returns the record field if found, otherwise returns `null`.
     * @example
     * var f = r.GetField('Name');
     * // f.Name = 'Name'
     * // f.Type = 'Text'
     */
    this.GetField = function (name_) {

        for (var i = 0; i < this.Record.Fields.length; i++) {
            if (this.Record.Fields[i].Name == name_)
                return this.Record.Fields[i];
        }
        return null;
    };

    /**
     * Calculate client-side flowfield values.
     * @memberof! Record#
     * @returns {void}
     */
    this.Calcfields = function () {

        if (!m_table)
            return;

        var fields = [];
        if (arguments.length == 0) {
			if(!m_fieldsToCalc){
				m_fieldsToCalc = [];
				for (var i = 0; i < this.Record.Fields.length; i++) {
					var col = m_table.Column(this.Record.Fields[i].Name);
					if (col && col.FlowField && col.FlowField.indexOf("function") == 0) //Only add functions.
						m_fieldsToCalc.push(this.Record.Fields[i].Name);
				}				
			}
			fields = m_fieldsToCalc;
        } else {
            fields = arguments;
        }

        if (fields.length == 0)
            return;

        for (var i = 0; i < fields.length; i++) {

            var f = fields[i];
            var field = m_table.Column(f);

            //Liveapp #75 - Offline flowfield 
            if (field && field.FlowField && field.FlowField.indexOf("FINDSET") == -1 && field.FlowField.indexOf("COUNT") == -1) {

                if (field.FlowField.indexOf("function") == 0) { //Function.

                    eval("var func = " + field.FlowField);
                    var ret = func(_self);
                    _self[f] = ret;

                } else { //Record

                    return $codeblock(
                        function () {
                            return new Record(m_id);
                        },
                        function (r) {
                            var rid = _self.Record.RecID;
                            var parts = rid.split(": ");
                            var keys = parts[1].split(",");
                            return r.Get(keys);
                        },
                        function (r) {
                            _self[f] = r[f];
                        }
                    );

                }
            }
        }
    };

    /**
     * Determine if Primary Keys and Mandatory fields have values.
     * @memberof! Record#
     * @returns {boolean} Returns `true` if one or more primary keys or mandatory fields have no value.
     */
    this.NoKeys = function () {

        if (_self.Keys == null && m_mandatory.length == 0)
            return false;

        var blankrec = new Record();
        blankrec.Copy(_self);
        blankrec.Clear();
        blankrec.GetCurrent();

        if (_self.Keys != null)
            for (var i = 0; i < _self.Keys.length; i++) {
                if (_self[_self.Keys[i]] == blankrec[_self.Keys[i]]) {
                    return true;
                }
            }

        for (var i = 0; i < m_mandatory.length; i++) {
            if (_self[m_mandatory[i]] == blankrec[m_mandatory[i]]) {
                return true;
            }
        }

        return false;
    };

    /**
     * Determine if there are unsaved changes in the record set.
     * @memberof! Record#
     * @returns {boolean} Returns `true` if there are unsaved changes in the record set.
     */
    this.UnsavedChanges = function () {
		if(_self.NoKeys())
			return true;
        for (var i = 0; i < m_records.length; i++) {
            if (m_records[i].UnAssigned || m_records[i].NewRecord)
                return true;
        }
        return false;
    };

    /**
     * Add a mandatory field to the `Record` object.
     * @memberof! Record#
     * @param {string} col_ Column to add as a mandatory field.
     * @returns {void}
     * @example
     * r.AddMandatoryField('Name');
     * // The Name field is now mandatory.
     */
    this.AddMandatoryField = function (col_) {
        m_mandatory.push(col_);
    };

    /**
     * Get a list of mandatory fields.
     * @memberof! Record#
     * @returns {string[]} Returns an array of mandatory field names.
     */
    this.MandatoryFields = function () {
        return m_mandatory;
    };

    /**
     * Add a field to the list of lookup fields.
     * 
     * **NOTE: If one or more lookup fields exist, they will be the only fields fetched from the database.**
     * @memberof! Record#
     * @param {string} col_ Column to add as a lookup field.
     * @returns {void}
     * @example
     * r.AddLookupField('Name');
     * return r.FindFirst(); // Only the Name column will be fetched from the database.
     */
    this.AddLookupField = function (col_) {
        this.LookupFields.push(col_.replace("FF$", ""));
    };

    /**
     * Add run-time flow fields to be calculated when CalcClientSideFields is run.
     * @memberof! Record#
     * @param {string} field_ Field name to add.
     * @returns {void}
     */
    this.AddFlowField = function (field_) {
        m_flowfields.push(field_);
    };

    /**
     * Add a calculated field. Table columns with the property 'Calculated' will only be fetched if added to the `Record` object calculated field list.
     * @memberof! Record#
     * @param {strinig} col_ Calculated column to add.
     * @returns {void}
     */
    this.CalculateField = function (col_) {
        _self.CalculatedFields.push(col_);
    };

    /**
     * Checks the record set for a certain record by recid.
     * @memberof! Record#
     * @param {string} recid Recid to check.
     * @returns {boolean} Returns `true` if the record was found in the record set.
     * @example
     * var exists = r.Exists('Test Table: 1');
     * // exists = true if a record exists where ID = 1.
     */
    this.Exists = function (recid) {
        for (var i = 0; i < m_records.length; i++) {
            if (m_records[i].RecID == recid)
                return true;
        }
        return false;
    };

    /**
     * Add all records from one record set into this record set. If a certain record is already in the record set, it will be skipped.
     * @memberof! Record#
     * @param {Record} rec Record set to copy from.
     * @returns {void}
     */
    this.AddRecords = function (rec) {
        do {
            if (!_self.Exists(rec.Record.RecID)) {
                m_records.push(CloneRecord(rec.Record));
                m_xrecords.push(CloneRecord(rec.Record));
                _self.Count += 1;
            }
        } while (rec.Next());
    };

    //Liveapp #75 - Offline flowfield
    /**
     * Calculate client-side flow fields that contain a FINDSET or COUNT function.
     * @memberof! Record#
     * @returns {JQueryPromise(Record)} Promises to return after calculating the client-side flow fields. Returns the `Record` object.
     */
    this.CalcClientSideFields = function () {

        if (!m_table || _self.Count == 0)
            return _self;

        var fields = [];
        for (var i = 0; i < m_table.Columns.length; i++) {
            
            var f = m_table.Columns[i];

            if (f) {

                var code = f.FlowField;                
                if (Application.IsOffline() && f.OfflineCode != "")
                    code = f.OfflineCode;

                if (code != "" && code != null && code.indexOf("function") == 0 && (code.indexOf("FINDSET") != -1 || code.indexOf("COUNT") != -1))
                    fields.push(f);

            }

        }

        //Add run time flow fields.
        for (var i = 0; i < m_flowfields.length; i++) {
            fields.push(m_flowfields[i]);
        }

        if (fields.length > 0)
            return $loop(function (i) {

                return $codeblock(

                    function () {

                        var code = fields[i].FlowField;                        
                        if (Application.IsOffline() && fields[i].OfflineCode != "")
                            code = fields[i].OfflineCode;

                        eval("var func = " + code);
                        return func(_self);
                    },

                    function (ret) {
						if(fields[i].LookupDisplayField != ""){
							_self["FF$"+fields[i].Name] = ret;
						}else{
							_self[fields[i].Name] = ret;	
						}                        
                        _self.SaveCurrent();
                        if (i < fields.length - 1)
                            return $next;
                        return _self;
                    }

                );

            });

        return _self;
    };

    /**
     * Convert the record set to an array.
     * @memberof! Record#
     * @returns {Record[]} Returns the `Record` set as an array.
     */
    this.toArray = function() {
        return m_records.map(function(rec){
            var r = {};
            rec.Fields.forEach(function(f){     
                if (typeof f.Value == "string" && f.Type == "Date" || f.Type == "Time" || f.Type == "DateTime"){
                    r[f.Name] = Application.ConvertDate(f.Value);       
                }else{
                    r[f.Name] = f.Value;
                }
            });
            return r;
        });
    }

    //#endregion

    //#region Private Methods

    function DeFriendifyValues(rec) {

        for (var i = 0; i < rec.Record.Fields.length; i++) {
            
            //Fix dates.
            if (typeof rec.Record.Fields[i].Value == "string") {                
                if (rec.Record.Fields[i].Type == "Date" || rec.Record.Fields[i].Type == "Time" || rec.Record.Fields[i].Type == "DateTime") {
                    rec.Record.Fields[i].Value = Application.ConvertDate(rec.Record.Fields[i].Value);                
                }     
            }
            if (typeof rec.xRecord.Fields[i].Value == "string") {                          
                if (rec.xRecord.Fields[i].Type == "Date" || rec.xRecord.Fields[i].Type == "Time" || rec.xRecord.Fields[i].Type == "DateTime") {                    
                    rec.xRecord.Fields[i].Value = Application.ConvertDate(rec.xRecord.Fields[i].Value);
                }
            }
        }
    };

    function CloneRecordSet(recs) {
        var recs2 = [];
        for (var i = 0; i < recs.length; i++) {
            recs2.push(CloneRecord(recs[i]));
        }
        return recs2;
    };

    function CloneRecord(rec) {
        var rec2 = new Object();
        rec2.NewRecord = rec.NewRecord;
        rec2.UnAssigned = rec.UnAssigned;
        rec2.RecID = rec.RecID;
        rec2.Table = rec.Table;
        rec2.Fields = [];
        for (var i = 0; i < rec.Fields.length; i++) {
            var col = new Application.Objects.RecordFieldInfo();
            app_transferObjectProperties.call(col, rec.Fields[i]);
            rec2.Fields.push(col);
        }
        return rec2;
    };

    //#endregion

    return this.Constructor(name_);

});

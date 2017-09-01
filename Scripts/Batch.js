

Define("Batch", null, function () {

    //#region Members

    var _self = this;
    var m_insert = [];
	var m_modify = [];
	var m_delete = [];
	var m_offlineRecords = [];

    //#endregion

    //#region Public Methods

    this.Constructor = function () {
        return _self;
    };

    this.Insert = function(r){	        

		if(r.Count > 0 && r.Record){

		    if (Application.IsOffline()) {
		        m_offlineRecords.push({ type: "INS", rec: r });
		        return;
		    }

			r.SaveCurrent();
			var rec = CloneRecord(r.Record);			
			rec.Timestamp = $id();
			m_insert.push(rec);
		}			
	};
	
	this.Modify = function(r, table){
		
		if(r.Count > 0 && r.Record){

		    if (Application.IsOffline()) {
		        m_offlineRecords.push({ type: "MOD", rec: r });
		        return;
		    }

			r.SaveCurrent();
			var rec = CloneRecord(r.Record,r.xRecord,table);			
			rec.Timestamp = $id();
			m_modify.push(rec);
		}			
	};
	
	this.Delete = function(r){
		
		if(r.Count > 0 && r.Record){

		    if (Application.IsOffline()) {
		        m_offlineRecords.push({ type: "DEL", rec: r });
		        return;
		    }

			r.SaveCurrent();
			var rec = CloneRecord(r.Record);			
			rec.Timestamp = $id();
			m_delete.push(rec);
		}			
	};

	this.Clear = function(){
		m_insert = [];
		m_modify = [];
		m_delete = [];
		m_offlineRecords = [];
	};
	
	this.Process = function () {

	    if (Application.IsOffline()) {
	        if (m_offlineRecords.length > 0)
	            return $loop(function (i) {
	                return $codeblock(
                        function () {
                            if (m_offlineRecords[i].type == "INS")
                                return m_offlineRecords[i].rec.Insert(true);
                            if (m_offlineRecords[i].type == "MOD")
                                return m_offlineRecords[i].rec.Modify(true);
                            if (m_offlineRecords[i].type == "DEL")
                                return m_offlineRecords[i].rec.Delete(true);
                        },
                        function () {
                            if (i < m_offlineRecords.length - 1)
                                return $next;
                        }
                    );
	            });
            return;
	    }

		return Application.BatchProcess(m_insert,m_modify,m_delete);
	};
	
	this.ProcessAsync = function (timeout, onsuccess, onerror) {

		var callbacks = new Object();
	
		callbacks.onsend = function (xhr) {
		};

		callbacks.onsuccess = function (r) {

			if (r != null)
				if (r.Message)
					if (r.Message != "FALSE") {
						callbacks.onerror(r.Message);
						return;
					}

			if(onsuccess)
				onsuccess(r);
		};

		callbacks.onerror = function (e) {				
			if(onerror)
				onerror(e);
		};

		Application.ExecuteWebService("BatchProcess", { auth: Application.auth, insert_: m_insert, modify_: m_modify, delete_: m_delete }, null, true, null, true, callbacks, timeout);				
	};
	
    //#endregion    

	function CloneRecord(rec, xrec, table) {
        var rec2 = new Object();
        rec2.NewRecord = rec.NewRecord;
        rec2.UnAssigned = rec.UnAssigned;
        rec2.RecID = rec.RecID;
        rec2.Table = rec.Table;
        rec2.Fields = [];		
        for (var i = 0; i < rec.Fields.length; i++) {
			
			var skip = false;
			if(table){
				var c = table.Column(rec.Fields[i].Name);
				if(c && c.PrimaryKey == false)
					skip = true;				
				if(c && c.FlowField && c.FlowField != "")
					skip = true
				if(xrec && rec.Fields[i].Value != xrec.Fields[i].Value)
					skip = false;
			}
			if(!skip){
				var col = new Application.Objects.RecordFieldInfo();
				app_transferObjectProperties.call(col, rec.Fields[i]);
				rec2.Fields.push(col);
			}
			
        }
        return rec2;
    };
	
    return this.Constructor();

});
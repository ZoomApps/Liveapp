/// <reference path="../Application.js" />

DefineModule("LocalStorageManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 09, 03),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',
        changelog: []

    },

    function () {

        //#region Members

        var _self = this;
		var m_mode = -1; //-1 = No Storage, 0 = IndexedDB, 1 = LocalStorage, 2 = Web SQL
		var m_database = null;
		var m_storeName = "keyvaluepairs";
		
		var ERR_STORAGE = "Local Storage is not supported by your browser, some functions may not work. Please make sure your browser is not in Private mode.";

        //#endregion

        //#region Public Methods

        this.OnLoad = function () { 
			
            //Assign Module
            Application.Storage = this;

			try{
			
				if(IndexedDBSupported()){
					m_mode = 0;
				}else if(window.openDatabase){
					m_mode = 2;
				}else if(LocalStorageSupported()){
					m_mode = 1;
				}else{
					m_mode = -1;
				}

				//IndexedDB Mode
				if(m_mode == 0) {
					
					var openRequest = indexedDB.open("%SERVERADDRESS%",1);

					openRequest.onupgradeneeded = function(e) {
						
						Application.LogInfo("Upgrading...");
						
						//Create the object store.
						var thisDB = e.target.result; 
						if(!thisDB.objectStoreNames.contains(m_storeName)) {
							thisDB.createObjectStore(m_storeName);
						}
					}

					openRequest.onsuccess = function(e) {
						
						Application.LogInfo("Success!");
						
						//Save the database connection.
						m_database = e.target.result;
					}

					openRequest.onerror = function(e) {
						
						if(LocalStorageSupported()){
							m_mode = 1;
						}else{
							m_mode = -1;
							//Application.Message(ERR_STORAGE);
						}
						Application.LogError(e);
					}

				}

				//Web SQL
				if(m_mode == 2){
					
					m_database = openDatabase("%SERVERADDRESS%", "1", "%APPNAME%", 2 * 1024 * 1024);
					m_database.transaction(function (t) {
						
						t.executeSql('CREATE TABLE IF NOT EXISTS ' + m_storeName + ' (id INTEGER PRIMARY KEY, key unique, value)', [], function () {
							
							Application.LogInfo("Success!");
							
						}, function (t, error) {
							
							if(LocalStorageSupported()){
								m_mode = 1;
							}else{
								m_mode = -1;
								//Application.Message(ERR_STORAGE);
							}						
							Application.LogError(error);
							
						});
					});
				}
			
			}catch(e){							
				
				m_mode = -1;
				//Application.Message(ERR_STORAGE);
				
			}			
			
        };
		
		this.Set = function(key_, value_, callback_){
		
			if(m_mode == -1){
				if(callback_) callback_();
				return;
			}
			
			//IndexedDB Mode
			if(m_mode == 0){
				
				if(!m_database){
					if(callback_) callback_();
					return;
				}
				
				var transaction = m_database.transaction([m_storeName],"readwrite");
				var store = transaction.objectStore(m_storeName);
				
				var req = store.put(value_, key_);
				
				transaction.oncomplete = function () {
					if(callback_) callback_();
				};
				transaction.onabort = transaction.onerror = function () {
					var err = req.error ? req.error : req.transaction.error;
					if(callback_) callback_(err);					
				};
				
			}else if(m_mode == 1){ //Local storage
				
				try{
					localStorage.setItem(key_,value_);				
					if(callback_) callback_();
				}catch(ex){
					if(callback_) callback_(ex);
				}
				
			}else if(m_mode == 2){ //Web SQL
				
				value_ = $.toJSON(value_);
				
				m_database.transaction(function (t) {
					t.executeSql('INSERT OR REPLACE INTO ' + m_storeName + ' (key, value) VALUES (?, ?)', [key_, value_], function () {
						if(callback_) callback_();
					}, function (t, error) {
						if(callback_) callback_(error);
					});
				}, function (sqlError) {
					if (sqlError.code === sqlError.QUOTA_ERR) {
						if(callback_) callback_(sqlError);
					}
				});
				
			}else{		
				Application.Error(ERR_STORAGE);
			}
		
		};
		
		this.Get = function(key_, callback_){
		
			if(m_mode == -1){
				if(callback_) callback_();
				return;
			}
			
			//IndexedDB Mode
			if(m_mode == 0){
				
				if(!m_database){
					if(callback_) callback_();
					return;
				}
				
				var transaction = m_database.transaction([m_storeName],"readwrite");
				var store = transaction.objectStore(m_storeName);
				
				var req = store.get(key_);

				req.onsuccess = function () {
					var value = req.result;
					if (value === undefined) {
						value = null;
					}					
					if(callback_) callback_(null,value);
				};

				req.onerror = function () {
					if(callback_) callback_(req.error);
				};
				
			}else if(m_mode == 1){ //Local storage
				
				try{
					var value = localStorage.getItem(key_);				
					if(callback_) callback_(null,value);
				}catch(ex){
					if(callback_) callback_(ex);
				}
			
			}else if(m_mode == 2){ //Web SQL
				
				m_database.transaction(function (t) {
					t.executeSql('SELECT * FROM ' + m_storeName + ' WHERE key = ? LIMIT 1', [key_], function (t, results) {						
						var result = results.rows.length ? results.rows.item(0).value : null;
						
						if(result)
							result = $.parseJSON(result);
						
						if(callback_) callback_(null,result);						
					}, function (t, error) {
						if(callback_) callback_(error);
					});
				});
				
			}else{		
				Application.Error(ERR_STORAGE);
			}
		
		};

		this.Remove = function(key_, callback_){
		
			if(m_mode == -1){
				if(callback_) callback_();
				return;
			}
			
			//IndexedDB Mode
			if(m_mode == 0){
				
				if(!m_database){
					if(callback_) callback_();
					return;
				}
				
				var transaction = m_database.transaction([m_storeName],"readwrite");
				var store = transaction.objectStore(m_storeName);
				
				var req = store['delete'](key_);
				
				transaction.oncomplete = function () {
					if(callback_) callback_();
				};

				transaction.onerror = function () {
					if(callback_) callback_(req.error);
				};

				transaction.onabort = function () {
					var err = req.error ? req.error : req.transaction.error;
					if(callback_) callback_(err);
				};
				
			}else if(m_mode == 1){ //Local Storage
				
				try{
					localStorage.removeItem(key_);				
					if(callback_) callback_();
				}catch(ex){
					if(callback_) callback_(ex);
				}
				
			}else if(m_mode == 2){ //Web SQL
					
				m_database.transaction(function (t) {
					t.executeSql('DELETE FROM ' + m_storeName + ' WHERE key = ?', [key_], function () {
						if(callback_) callback_();
					}, function (t, error) {
						if(callback_) callback_(error);
					});
				});
					
			}else{		
				Application.Error(ERR_STORAGE);
			}
		
		};
		
		this.Mode = function(){
			return m_mode;
		};
		
        //#endregion

        //#region Private Methods
        
		function IndexedDBSupported(){
			
			var self = window;
			var indexedDB = indexedDB || self.indexedDB || self.webkitIndexedDB || self.mozIndexedDB || self.OIndexedDB || self.msIndexedDB;	        

	        var result =  !!(function () {
	            if (typeof self.openDatabase !== 'undefined' && self.navigator && self.navigator.userAgent && /Safari/.test(self.navigator.userAgent) && !/Chrome/.test(self.navigator.userAgent)) {
	                return false;
	            }
	            try {
	                return indexedDB && typeof indexedDB.open === 'function' &&
	                typeof self.IDBKeyRange !== 'undefined';
	            } catch (e) {
	                return false;
	            }
	        })();
			
			return result;
		};		

		function LocalStorageSupported(){
			try{
				return window.localStorage && 'setItem' in window.localStorage && window.localStorage.setItem;	
			}catch(e){
				false;
			}			
		};
						
		//#endregion        

    });
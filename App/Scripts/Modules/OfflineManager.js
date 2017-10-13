// <reference path="../Application.js" />

DefineModule("OfflineManager",

{

    singleInstance: true,
    requiresVersion: '3.0',
    created: new Date(2013, 10, 03),
    version: '1.0',
    author: 'Paul Fisher',
    copyright: 'Copyright 2015, Paul Fisher',

    changelog: [
        '16/04/14   PF  Created class.'
    ]

},

function () {

    //#region Members

    var _self = this;
    var m_instance = "";
    var m_offline = false;
    var m_recordSets = [];
    var m_modifiedRecords = [];
    var m_deletedRecords = [];
    var m_insertedRecords = [];
    var m_pack = null;    
    var m_downloadReq = null;
    var m_downloadInfo = null;
    var m_offlineInfo = null;
    var m_info = { mainsize: 0, subsize: 0 };
	var m_save = false;
	var m_params = [];
	var m_zipDataPacks = true;
	var m_showsuccess = true;
	var m_offlineMode = 0; //0 = Classic Offline, 1 = Toggle Offline 
	var m_datapackid = 0;
	var m_lastSwitchCallback = null;

    //#endregion

    //#region Public Methods

    this.OnLoad = function () {

		Application.LoadParams(m_params, PAGE_PARAMETERS);
		
        //this.Clear();

        //Global assign.
        Application.Offline = this;

        //Hook events.
		if(m_params["offline"] == "true"){
			Application.On("Load", _self.LoadEvent);
			Application.On("CreateMenu", _self.CreateMenuEvent);
			Application.On("MenuLoaded", _self.MenuLoadedEvent);
			Application.On("ShowLogin", _self.ShowLoginEvent);
			Application.On("Login", _self.LoginEvent);		
			Application.On("Logout", _self.LogoutEvent);			
		}
		
		Application.On("Connected", function () {
			if(m_offline == false && m_offlineMode == 1){
				
				//Reset transactions
				Application.transactionStarted = 0;			
				
				function Reconnect(){
					Application.Confirm("You have an existing offline data package to upload.", function (r) {
							if(!r){										
								Application.RunNext(function(){
									return $codeblock(
									  _self.CheckForUpload,
									  function(){
										  _self.HideLoad();
										  if(ThisViewer()) ThisViewer().HideLoad();
										  if(m_lastSwitchCallback) return m_lastSwitchCallback();
									  }
									)
								});
							}else{
								Application.Confirm("Please confirm that you want to delete the existing data package.", function (r2) {
									if(r2){
										//Clear packs.
										RemoveDataPack(MainPackName());
										RemoveDataPack(SecondaryPackName());
										Reset();
										Application.RunNext(function(){
											_self.HideLoad();
											if(ThisViewer()) ThisViewer().HideLoad();
											if(m_lastSwitchCallback) return m_lastSwitchCallback();
										});
									}else{
										Reconnect();
									}
								});
							}
						},null,"Delete the data pack","Upload the data pack");
				}
				
				_self.HasDataPack(function(ret){
					UI.Progress(false);	
					if(ret){
						Reconnect();
					}else{
						_self.HideLoad();
						if(ThisViewer()) ThisViewer().HideLoad();
					}
				});
			}
		});
		
		Application.On("ConnectionLost", function () {
			if(m_offline == false && m_offlineMode == 1){
				_self.ShowLoad();
				UI.StatusBar(false);
				UI.Progress(true, "%LANG:S_CONNECTIVITY% Offline data package saved. <br/><br/>Attempting to reconnect... <br/><br/><a onclick='Application.App.OnTimer();'><u>Click here to reconnect now</u></a><br/><br/>", "Connection Lost", null, null, null, true);						
			}
		});
    };
	
    this.Clear = function () {
		//Not Used
    };

	this.ShowLoad = function(){
		Application.Loading.Show("ui-mobile-viewport",".");
	};
	
	this.HideLoad = function(){
		Application.Loading.Hide("ui-mobile-viewport");
	};
	
    this.Load = function (callback) {

        GetDataPack(SecondaryPackName(), null, function(pack){
			
			if (pack == null || pack == ""){
				callback();
				return;
			}				
			
            m_info.subsize = pack.length;

            try {
				if(m_zipDataPacks)
					pack = LZString.decompressFromBase64(pack);				
                pack = $.parseJSON(pack);
                m_modifiedRecords = pack.Modified;
                m_deletedRecords = pack.Deleted;
                m_insertedRecords = pack.Inserted;
            } catch (e) {
            }
			
			callback();
		});
        
    };

    this.Save = function () {

        if (m_offline) {

            var pack = new Object();
            pack.Modified = m_modifiedRecords;
            pack.Deleted = m_deletedRecords;
            pack.Inserted = m_insertedRecords;

            pack = $.toJSON(pack);
            //pack = Application.Zip.Encode(pack);//, CreateKey());

            m_info.subsize = pack.length;

            SaveDataPack(SecondaryPackName(), pack);
        }
    };

    this.DeleteSecondaryData = function () {

        Application.Confirm("Are you sure you wish to delete this data? All offline modifications will be cleared.", function (r) {
            if (r) {
                Reset();
                _self.Save();
                m_info.subsize = 0;
                m_recordSets = [];
            }
        }, "Delete offline data?");

    };

    this.Info = function () {
		
        var id = $id();
        Application.Message("<h3>Data Packs</h3>" +
        "<span style='padding-left: 400px;'></span><br/>" +		
        UI.IconImage("package_ok") + " <b>Main Data</b><br/>... " + PrintLength(m_info.mainsize) + "<br/>" +
        UI.IconImage("package_add") + " Secondary Data<br/>... " + PrintLength(m_info.subsize) + " <a id='" + id + "' style='cursor: pointer;' onclick='UI.CloseDialog();Application.Offline.DeleteSecondaryData();'><u><b>delete</b></u></a><br/><br/>" +
        "Used <b>" + PrintLength(m_info.mainsize + m_info.subsize) + "</b><br/><br/>" +
        "<h3>Records</h3>" +
        "New: " + m_insertedRecords.length + ", " +
        "Modified: " + m_modifiedRecords.length + ", " +
        "Deleted: " + m_deletedRecords.length, null, "Offline Info");
    };

    this.GoOnline = function () {

        if (!Application.App.Loaded()) {

            //_self.Save();
            _self.LogoutEvent();
            _self.SetOffline(false);
            Application.App.ShowLogin();

            //if (Application.App.GetLoginCookie() == null)
            //    Application.Message("You are now online. Please login to continue.");

            Application.RunNext(Application.App.LoginFromCookie);
            return;
        }

        _self.Logout();
    };

    this.Logout = function () {
		//_self.Save();        
        _self.LogoutEvent();
        _self.SetOffline(false);
        Application.App.OnLogout();
        Application.RunNext(Application.App.LoginFromCookie);
    };

    this.CheckForUpload = function () {
		
        var uploading = false;
        if ((m_insertedRecords.length + m_modifiedRecords.length + m_deletedRecords.length) > 0) {   

            return Application.FileDownload.UploadFile("DataPack" + m_datapackid, $.toJSON([m_insertedRecords, m_modifiedRecords, m_deletedRecords]), function (file) {

                if (uploading == true)
                    return;

                uploading = true;

                //Clear packs.
                RemoveDataPack(MainPackName());
                RemoveDataPack(SecondaryPackName());
                Reset();

                var int_id = null;
                var callbacks = new Object();
                callbacks.onerror = function (err) {			
                    Application.Error(err);
                };
                callbacks.onsuccess = function (err) {

                    if (err.length == 0) {
						if (m_showsuccess)
							Application.Message('Offline data has been successfully processed');
                    } else {
                        var msg = "<p>The following errors have occurred:</p>";
                        for (var i = 0; i < err.length; i++) {
                            msg += "<p>" + err[i] + "</p>";
                        }
                        Application.Message(msg, null, "Upload Error");
                    }
					w.resolve();
                };
                callbacks.onsend = function () { };
				
				var w = $wait();
                Application.ExecuteWebService("UploadDataPack", { auth: Application.auth, name_: file.Name }, null, true, null, true, callbacks);
				
                return w.promise();
            });            
        }else{
			Application.RunNext(function(){
				RemoveDataPack(MainPackName());
				RemoveDataPack(SecondaryPackName());		
			});			
		}
    };

    this.GoOffline = function (remove_) {

		m_offlineMode = 0;
	
        if (!Application.App.Loaded()) {
            _self.SetOffline(true);
            Application.App.ShowLogin();
            return;
        }

        _self.CancelDownload("A download has already started, do you wish to cancel?", function () {
            Application.RunNext(function () {
                Application.Confirm("Do you wish to download offline data?", function (r) {
                    if (r)
                        _self.Download();
                }, "Data download", "Yes", "No");
            });
        });
		
		if (m_downloadReq != null)
			return;
		    
         _self.Download();
    };

    this.GetObject = function (type_, name_) {

        var o;

        if (type_ == "PAGE") {
            o = m_pack[0];
        } else if (type_ == "TABL") {
            o = m_pack[1];
        } else if (type_ == "CODE") {
            o = m_pack[2];
        }

        for (var i = 0; i < o.length; i++) {
			if (o[i].Name && name_ && o[i].Name.toLowerCase() == name_.toLowerCase()) {
                return o[i];
            }
        }
        
        return null;
    };

    this.RemoveRecordFromSet = function (id_, view_, recid_) {
        for (var i = 0; i < m_recordSets.length; i++) {
            var recs = m_recordSets[i][2];
            for (var j = 0; j < recs.length; j++) {
                if (recs[j].RecID == recid_) {
                    recs.splice(j, 1);
                    j -= 1;
                }
            }
        }
    };

    this.GetRecordSet = function (id_, view_) {

        //Add the records from pack to memory.
        var r = [];
        r[0] = id_;
        r[1] = view_;
        r[2] = GetRecordsFromPack(id_, view_);

        //Return the record set.
        return r[2];
    };

	this.HasDataPack = function(callback){
		GetDataPack(MainPackName(), null, function(pack){
			if(pack == null || pack == ""){
				callback(false);
				return;
			}
			callback(true);
		});		
	};
	
	this.CheckOfflineObject = function(type, id) {

		if (!Application.IsOffline())
			return true;
		
		var f = Application.Offline.GetObject(type, id);
		if (f != null)
			return true;
		
		return false;
	};
	
    this.Process = function (method, args, callback) {

        if (method == "GetLastMessage" || method == "SendNotification" || method == "BeginTransaction") {
            callback(null);
            return true;
        }

        if (method == "CheckUpdates") {
            callback("");
            return true;
        }

        if (method == "Authorize") {

            setTimeout(function () {

                if (Default(Application.auth.OfflineAuth,"") == "") {
                    Application.auth.Username = Application.auth.Username.replace(/\/{1,}/g, "\\");                    
                } else {
                    Application.auth.Username = Application.auth.OfflineAuth.split("|")[0];                    
                }

                GetDataPack(MainPackName(), null, function(pack){
					
                if (pack == null || pack == ""){
					Application.Confirm("You do not have an offline data package. Would you like to change to online mode?", function(ret){
						if(ret){
							_self.Toggle();						
						}
					});
					Application.Error("");
				}                   

                m_info.mainsize = pack.length;

				if(m_zipDataPacks)
					pack = LZString.decompressFromBase64(pack);											               
				if (pack == "" )
                    Application.Error("%LANG:ERR_BADLOGIN%");
                m_pack = $.parseJSON(pack);
					
                Application.auth.Password = '';
                Application.auth.LoginDate = new Date();
                Application.auth.SessionID = "OFFLINEMODE";

                //Issue #77 - Date and time in wrong format offline
                var d = new Date()
                Application.auth.TZ = d.getTimezoneOffset();

					//Load secondary data pack.
					_self.Load(function(){

                Application.connected = true;
                Application.Fire("Connected");
                callback(Application.auth);

					}); 				
					
				});
				                

            }, 50);
            return true;

        } else if (method == "CommitTransaction"){
			
			if(m_save){
				//Application.RunNext(_self.Save);
				_self.Save();
				m_save = false;
			}
			callback(null);
            return true;
		
		} else if (method == "RollbackTransaction"){
			
			_self.Load(function(){
			callback(null);
			});
			
            return true;
			
		} else if (method == "RecordInit") {

            var tbl = _self.GetObject("TABL", args.name_);
            if (!tbl)
                Application.Error("Offline table not found: " + args.name_);

            callback(InitRecord(tbl));
            return true;

        } else if (method == "RecordSet") {

            var r = [];

            r = _self.GetRecordSet(args.table_, args.view_);

            //Get the table.
            //var tbl = _self.GetObject("TABL", args.table_);           

            callback(r);
            return true;

        } else if (method == "RecordInsert") {

            var rec = new Object();
            args.rec_.Record.NewRecord = false;
            CloneRecord(args.rec_.Record, rec, true);
			
			rec.Timestamp = $id();
            m_insertedRecords.push(rec);
			m_save = true;
			
            callback(rec);
            return true;

        } else if (method == "RecordModify") {

            var rec = new Object();
            CloneRecord(args.rec_.Record, rec);

			rec.Timestamp = $id();
            ModifyRecord(rec, callback); //Issue #78 - Bug Fix
			m_save = true;

			var rec2 = new Object();
            CloneRecord(args.rec_.Record, rec2, true);
			
            callback(rec2);
            return true;

        } else if (method == "RecordModifyAll") {

            var r = args.rec_;
            if (r.Count > 0) {
                r.First();
                do {
                    var rec = new Object();
                    CloneRecord(r.Record, rec);
					rec.Timestamp = $id();
                    ModifyRecord(rec, callback); //Issue #78 - Bug Fix
                } while (r.Next());
            }
			m_save = true;
						
            callback(true);
            return true;

        } else if (method == "RecordDelete") {

			var rec = new Object();
			CloneRecord(args.rec_.Record, rec);
			
			rec.Timestamp = $id();				
            DeleteRecord(rec);
			m_save = true;

            callback(null);
            return true;

        } else if (method == "RecordDeleteAll") {

            var r = args.rec_;
            if (r.Count > 0) {
                r.First();
                do {
					var rec = new Object();
                    CloneRecord(r.Record, rec);
					rec.Timestamp = $id();
                    DeleteRecord(rec);
                } while (r.Next());
            }
			m_save = true;
						
            callback(true);
            return true;

        } else if (method == "LoadMainMenu") {

            Application.Storage.Get(("XpressMenu-" + m_instance).toLowerCase(), function(err, mnu){
				mnu = Default(mnu, "[]");
				callback($.parseJSON(mnu));
			});            
			
            return true;

        } else if (method == "PageFetch") {

            var f = _self.GetObject("PAGE", args.id_);
            if (f != null) {
                callback(f);
                return true;
            }

            Application.Error("Offline page not found: " + args.id_);

        } else if (method == "TableFetch") {

            var f = _self.GetObject("TABL", args.name_);
            if (f != null) {
                callback(f);
                return true;
            }

            Application.Error("Offline table not found: " + args.name_);

        } else if (method == "CodeModuleFetch") {

            var f = _self.GetObject("CODE", args.name_);
            if (f != null) {
                callback(f);
                return true;
            }

            Application.Error("Offline codemodule not found: " + args.name_);
			
        } else if (method == "BatchProcess"){
		
			var recs = [];
			
			for(var i = 0; i < args.insert_.length; i++){
				recs.push([args.insert_[i],"INS",args.insert_[i].Timestamp]);
			}
		
			for(var i = 0; i < args.modify_.length; i++){
				recs.push([args.modify_[i],"MOD",args.modify_[i].Timestamp]);
			}
			
			for(var i = 0; i < args.delete_.length; i++){
				recs.push([args.delete_[i],"DEL",args.delete_[i].Timestamp]);
			}
			
			recs.sort(function (a, b) {
				if (a[2] == b[2])
					return 0;
				if (a[2] > b[2]) {
					return 1;
				} else {
					return -1;
				}
			});
			
			for(var i = 0; i < recs.length; i++){				
				if(recs[i][1] == "DEL"){
					_self.Process("RecordDelete",{rec_: {Record: recs[i][0]}},function(){});
				}
				if(recs[i][1] == "INS"){
					_self.Process("RecordInsert",{rec_: {Record: recs[i][0]}},function(){});
				}
				if(recs[i][1] == "MOD"){
					_self.Process("RecordModify",{rec_: {Record: recs[i][0]}},function(){});
				}
			}
			
			callback(null);
			return true;
		}

        return false;
    };

    this.Toggle = function () {

        if (Application.IsInMobile()) {
            $("#divSideMenu").panel("close");
        }

        if (m_offline) {

			if(Application.auth.SessionID != ""){
				var len = $.toJSON([m_insertedRecords, m_modifiedRecords, m_deletedRecords]).length;
				if ((m_insertedRecords.length + m_modifiedRecords.length + m_deletedRecords.length) > 0) {
					Application.Confirm("A data package of size " + PrintLength(len) + " will be sent over your current internet connection. Do you want to continue?", function (ret) {
						if (ret == true) {
							Application.RunNext(function () {
								return _self.GoOnline();
							});
						}
					});
				}else{
					Application.RunNext(function () {
						return _self.GoOnline();
					});
				}
			}else{
				Application.RunNext(function () {
					return _self.GoOnline();
				});
			}

        } else {

            Application.RunNext(function () {
                return _self.GoOffline();
            });

        }
    };

    this.Download = function () {

        if (!CheckStorage())
            Application.Error("Local storage is not supported in your browser.");

        //Get the offline cookie.
		_self.RemoveLoginCookie();
		if(Application.auth.Remember)
			Application.RunNext(function () {
				return $codeblock(
					Application.GetOfflineCookie,
					function (c) {
						_self.SaveLoginCookie(c);
					}
            );
        });

		UI.StatusBar(true, "<img src='%SERVERADDRESS%Images/loader.gif' /> Processing offline data");
		
		_self.DownloadDataPack(function(){
			Application.App.Disconnect();
			Application.RunNext(function () {
				_self.SetOffline(true);
				return Application.App.LoginFromCookie();
			});
		});  

    };
	
	this.SwitchOffline = function(offline_, callback_){
		
		m_instance = Application.auth.Instance;
		m_offlineMode = 1;
		m_lastSwitchCallback = callback_;
		Application.FileDownload.ShowProgress(false);
		_self.ShowLoad();
		
		function DownloadTempDataPack(){
			
			Reset();
			_self.DownloadDataPack(function(f){
				
				m_offline = true;
				m_info.mainsize = f.length;

				m_pack = null;
				try {								
					m_pack = $.parseJSON(f);						
				}catch(e){					
				}
				if(!m_pack)
					Application.Error("Data pack corruption");									

				//Load secondary data pack.
				_self.Load(function(){

					$("#AppWindows").hide();
					$("#AppWorkspace").css("margin-top","0px");
			
					Application.RunNext(function(){
						return $codeblock(
							function(){
								_self.HideLoad();
								if(callback_) return callback_();
							}
						);
					});

				}); 											
				
			});
		};
		
		if(offline_){	

			_self.HasDataPack(function(ret){
				if(ret){
					Application.Confirm("You have an existing offline data package to upload.", function (r) {
						if(!r){
							Application.RunNext(function(){
								return $codeblock(
								  _self.CheckForUpload,
								  function(){
									  DownloadTempDataPack();				  
								  }
								)
							});
						}else{
							Application.Confirm("Please confirm that you want to delete the existing data package.", function (r2) {
								if(r2){
									DownloadTempDataPack();
								}else{
									Application.Error("");
								}
							});
						}
					},null,"Delete the data pack","Upload the data pack");
				}else{
					DownloadTempDataPack();
				}
			});
			
		}else{
			$("#AppWindows").show();
			if (!Application.IsMobileDisplay() && Application.IsInMobile())
				$("#AppWorkspace").css("margin-top","45px");
			m_offline = false;
			Application.RunNext(function(){
				return $codeblock(
				  _self.CheckForUpload,
				  function(){
					_self.HideLoad();
					if (callback_) return callback_();					  
				  }
				)
			});
		}
	};
	
	this.DownloadDataPack = function(callback_){
		
		Application.RunNext(function () {

			var w = $wait();
		
            UI.ScrollToTop();
            
            var callback = new Object();

            callback.onsend = function (xhr) {
                m_downloadReq = xhr;
            };

            callback.onsuccess = function (info) {

                if (info != null)
                    if (info.Message)
                        if (info.Message != "FALSE") {
                            callback.onerror(info.Message);
                            return;
                        }

                m_downloadInfo = info;

                UI.ScrollToTop();
				
				if(m_offlineMode == 0)
					UI.StatusBar(true, "<img src='%SERVERADDRESS%Images/loader.gif' /> Downloading offline data (" + PrintLength(m_downloadInfo.Length) + ")", "#99FF66");

                Application.FileDownload.DownloadFile(info, function (file) { //Download success.

                    var f = Application.FileDownload.GetFileData(file);

                    m_downloadReq = null;

                    //Clear packs.
                    RemoveDataPack(MainPackName());
                    RemoveDataPack(SecondaryPackName());
                    Reset();

					Application.FileDownload.RemoveFile(m_downloadInfo);
                    m_downloadInfo = null;
					
					Application.ExecuteWebService("DownloadedDataPack",{ auth: Application.auth, name_: file.Name },function(){
						
						_self.SetDataPackID(file.Name.replace("DataPack","").replace(".pak",""));
						
						UI.StatusBar(false);
					
						//Save datapack.                                        
						SaveDataPack(MainPackName(), f, function(){
							
							w.resolve();							
							
							Application.RunNext(function(){
								if(callback_) callback_(f);
							});							
						}); 
						
					});										                                    

                }, function () { //Cancel download.
                    if (m_downloadInfo)
                        Application.FileDownload.RemoveFile(m_downloadInfo);
                    m_downloadInfo = null;
                    m_downloadReq = null;
                    UI.StatusBar(false);
					w.resolve();
                }, false);

            };

            callback.onerror = function (e) {
                if (m_downloadInfo)
                    Application.FileDownload.RemoveFile(m_downloadInfo);
                m_downloadInfo = null;
                m_downloadReq = null;
                UI.StatusBar(false);
				Application.HideProgress();        	
				Application.Offline.HideLoad();						
                if (e != "abort")
                    Application.Error(e);
            };

            Application.ExecuteWebService("DownloadDataPack", { auth: Application.auth }, null, true, null, false, callback);
			
			return w.promise();
			
        },null,null,true);
		
	};

    this.SetOffline = function (value) {

        m_offline = value;
        Application.Storage.Set("IsOffline-" + m_instance, value.toString());
	
	};
	
	this.SetDataPackID = function (value) {

        m_datapackid = value;
        Application.Storage.Set("DataPackID-" + m_instance, value.toString());
	
	};

    this.UpdateMenuItem = function () {
        if (m_offline) {
            $('.Offline').text('Go Online');
            m_offlineInfo.show();
        } else {
            $('.Offline').text('Go Offline');
            m_offlineInfo.hide();
        }
    };

    this.CancelDownload = function (msg, callback, cancel) {

        if (m_downloadReq != null) {
            Application.Confirm(msg, function (r) {
                if (r) {
                    m_downloadReq.abort();
                    if (m_downloadInfo)
                        Application.FileDownload.RemoveFile(m_downloadInfo);
                    m_downloadInfo = null;
                    m_downloadReq = null;
                    if (callback) callback();
                } else {
                    if (cancel) cancel();
                }
            }, "Cancel?", "Yes", "No");
        }
    };

    this.AddOfflineAction = function (action_) {

    };

    this.RemoveOfflineAction = function (action_) {

    };

    this.SaveLoginCookie = function (cookie) {

        if (!$moduleloaded("CookieManager"))
            return;

        Application.CookieManager.Save('XPRESSOFFLINE' + Application.auth.Instance, cookie, 100);
    };
	
	this.RemoveLoginCookie = function () {

        if (!$moduleloaded("CookieManager"))
            return;

        Application.CookieManager.Remove('XPRESSOFFLINE' + Application.auth.Instance, 100);
    };

    this.GetLoginCookie = function () {
        var cookie = Application.CookieManager.Get('XPRESSOFFLINE' + Application.App.Params()['instance']);
        if (cookie == "")
            cookie = null;
        return cookie;
    };

    //#endregion      

    //#region Temp Records

    this.FindTempRecordSet = function (formID_, view_) {

    };

    this.DeleteTempRecord = function (recid) {

    };

    this.InsertTempRecord = function (rec) {

    };

    //#endregion        

    //#region Public Properties

    this.IsOffline = function () {
        return m_offline;
    };

    this.DownloadRequest = function () {
        return m_downloadReq;
    };

    this.DownloadInfo = function () {
        return m_downloadInfo;
    };
	
	this.ZipDataPacks = function (value_) {

		if (value_ !== undefined) {
			m_zipDataPacks = value_;
		} else {
			return m_zipDataPacks;
		}
	};

	this.ShowSuccess = function (value_) {

		m_showsuccess = value_;
	};

    //#endregion        

    //#region Application Events

    this.LoadEvent = function (params) {

        if (!CheckStorage())
            return;

        m_instance = params["instance"];

        //_self.Clear(); //Temp.

		var w = $wait();
		
        Application.Storage.Get("IsOffline-" + m_instance, function(err, lastState){
			
			lastState = Default(lastState, "false");
			if (lastState != "false") {
				m_offline = true;
			}
			
			Application.Storage.Get("DataPackID-" + m_instance, function(err, dpid){
				
				m_datapackid = dpid;
				
				w.resolve();
				
			});
			
		});   

		return w.promise();
    };

    this.CreateMenuEvent = function (mnu) {

        //Application.App.PrintSideLink(mnu, Application.executionPath + 'Images/ActionIcons/replace2.png', "Offline", "Application.Offline.Toggle();");
        m_offlineInfo = Application.App.PrintSideLink(mnu, Application.executionPath + 'Images/ActionIcons/preferences.png', "Offline Info", "Application.Offline.Info();");
        _self.UpdateMenuItem();
    };

    this.MenuLoadedEvent = function (mnu) {

        if (!CheckStorage())
            return;

        if (!m_offline)
            Application.Storage.Set(("XpressMenu-" + m_instance).toLowerCase(), $.toJSON(mnu));
    };

    this.ShowLoginEvent = function () {

        if (m_offline) {
            $("#spanRemember").hide();
        } else {
            $("#spanRemember").show();
        }

        $("#txtPassword").val('');
        $("#tdOffline").show();
    };

    this.LoginEvent = function () {
	};
	
	this.LoadDatapack = function(){
		
		return $codeblock(
		
			function(){
				
				//Load the datapack.
				var w = $wait();				
				_self.Load(function () {			
					w.resolve();
				});  
				return w.promise();
			},
			function(){
				
				//Check for upload.       
				if (!m_offline)          				
					return _self.CheckForUpload();			
			}
		);
	};

    this.LogoutEvent = function () {

		//_self.Save();
	
        m_recordSets = [];
        m_pack = null;        
        m_info = { mainsize: 0, subsize: 0 };
        Reset();

    };

    //#endregion

    //#region Private Methods

	function StripFlowFields(rec){
		
		var table = _self.GetObject("TABL", rec.Table);
		if(!table)
			return rec;
		
		for(var i = 0; i < rec.Fields.length; i++){
			
			var col = GetColumnFromTable(table,rec.Fields[i].Name);
			if(col && col.FlowField && col.FlowField != ""){
				rec.Fields[i].Value = null;				
			}					
		}
		return rec;
	}
	
	function GetColumnFromTable(table, col_){
		
		for (var j in table.Columns) {
			if (table.Columns[j].Name == col_) {
				return  table.Columns[j];
			}
		}			
			
		return null;
	};
	
    function CreateKey() {
        var u = Application.auth.Username;
        if (u.indexOf("\\") != -1)
            u = u.substr(u.indexOf("\\") + 1);
        u = u.toLowerCase();
        return CryptoJS.SHA1(u + Application.auth.Password).toString(CryptoJS.enc.Base64);
    };

    function CheckStorage() {
        return (localStorage != null);
    };

    function SaveDataPack(name, pack, callback) {

        name = name.toLowerCase();

		if(m_zipDataPacks)
			pack = LZString.compressToBase64(pack);
		
		Application.Storage.Set(name, pack, function(err){
			if(err){				
				Application.Error(err);
            }
			if(callback)callback();
		});
    };

    function GetDataPack(name, err, callback) {

        name = name.toLowerCase();

        err = Default(err, false);

		Application.Storage.Get(name, function(err, value) {
			if(err){				
				Application.Error(err);
            }
			if(callback)callback(value);
		});			
    };

    function RemoveDataPack(name) {
		name = name.toLowerCase();
		Application.Storage.Remove(name);
    };

    function MainPackName() {
        return ("MainPak-" + m_datapackid).toLowerCase();
    };

    function SecondaryPackName() {
        return ("SubPak-" + m_datapackid).toLowerCase();
    };

    function GetRecord(recid_, arr_) {

        //        for (var i = 0; i < arr_.length; i++) {
        //            if (arr_[i].RecID == recid_)
        //                return arr_[i];
        //        }
        //        return null;
    };

    function InitRecord(table_) {

        var rec_ = Application.Objects.RecordSetInfo();

        //Clear the current record.
        rec_.Record = Application.Objects.RecordInfo();
        rec_.Record.NewRecord = true;
        rec_.Record.Table = table_.Name;
        rec_.xRecord = Application.Objects.RecordInfo();
        rec_.xRecord.NewRecord = true;
        rec_.xRecord.Table = table_.Name;

        //Setup the record set.
        rec_.Position = 0;
        rec_.Blank = true;
        rec_.Count = 0;
        rec_.View = "";
        rec_.Keys = [];

        if (table_.InsertCode != "") {
            rec_.Functions.push(["Insert", table_.InsertCode]);
        }

        if (table_.ModifyCode != "") {
            rec_.Functions.push(["Modify", table_.ModifyCode]);
        }

        if (table_.DeleteCode != "") {
            rec_.Functions.push(["Delete", table_.DeleteCode]);
        }

        rec_.DelayInsert = table_.DelayInsert

        for (var i = 0; i < table_.Columns.length; i++) {

            var col = table_.Columns[i];

            //Setup the record column.
            var reccol = Application.Objects.RecordFieldInfo();
            reccol.Name = col.Name;
            reccol.Value = ConvertColumnInfoTypeToObject(col.Type);
            reccol.Caption = col.Caption;
            //reccol.FlowField = col.FlowField;
            reccol.Type = col.Type;

            //Add the column to the record set.
            rec_.Record.Fields.push(reccol);
            rec_.xRecord.Fields.push(reccol);

            if (col.LookupDisplayField != "") {
                var reccol2 = Application.Objects.RecordFieldInfo();
                reccol2.Name = "FF$" + col.Name;
                reccol2.Value = null;
                reccol2.Caption = col.Caption;
                //reccol2.FlowField = col.FlowField;
                reccol2.Type = col.Type;
                rec_.Record.Fields.push(reccol2);
                rec_.xRecord.Fields.push(reccol2);
            }

            //Add functions.
            if (col.ValidateCode != "") {
                rec_.Functions.push([col.Name, col.ValidateCode]);
            }

            if (col.PrimaryKey && !col.Identity) {
                rec_.Keys.push(col.Name);
            }
        }

        return rec_;
    };

    function ModifyRecord(rec, callback) {

        for (var i = 0; i < m_modifiedRecords.length; i++) {
            if (m_modifiedRecords[i].RecID == rec.RecID && m_modifiedRecords[i].Table == rec.Table) {
                m_modifiedRecords[i] = rec;
                callback(rec);
                return true;
            }
        }

        m_modifiedRecords.push(rec);
    };

    function DeleteRecord(rec) {

        m_deletedRecords.push(rec);

        for (var i = 0; i < m_modifiedRecords.length; i++) {
            if (m_modifiedRecords[i].RecID == rec.RecID) {
                m_modifiedRecords.splice(i, 1);
                i -= 1;
            }
        }

        for (var i = 0; i < m_insertedRecords.length; i++) {
            if (m_insertedRecords[i].RecID == rec.RecID) {
                m_insertedRecords.splice(i, 1);
                i -= 1;
            }
        }
    };

    function ConvertColumnInfoTypeToObject(type_) {
        if (type_ == "Integer") {
            return null;
        } else if (type_ == "Decimal") {
            return null;
        } else if (type_ == "Text") {
            return null;
        } else if (type_ == "Char") {
            return null;
        } else if (type_ == "Code") {
            return null;
        } else if (type_ == "Date") {
            return null;
        } else if (type_ == "DateTime") {
            return null;
        } else if (type_ == "Time") {
            return null;
        } else if (type_ == "BLOB") {
            return null;
        } else if (type_ == "BigBlob") {
            return null;
        } else if (type_ == "Image") {
            return null;
        } else if (type_ == "Boolean") {
            return false;
        }
        return "";
    };

    function GetTableIndex(id_) {
        for (var i = 0; i < m_pack[1].length; i++) {
            if (m_pack[1][i].Name == id_)
                return i;
        }
        return -1;
    };

    function GetRecordsFromPack(id_, view_) {

        var recs = [];

        var tbl = _self.GetObject("TABL", id_);

        var index = GetTableIndex(id_);
        if (index == -1)
            return recs;

        //Get Records.
        recs = m_pack[3][index];

        var ret = [];

		//Add all table records.
		for (var i = 0; i < recs.length; i++) {
			ret.push(recs[i]);
		}
		
		//Update with inserts.
		for (var i = 0; i < m_insertedRecords.length; i++) {
			if (m_insertedRecords[i].Table == tbl.Name) {				
				var rec2 = new Object();
				CloneRecord(m_insertedRecords[i], rec2, true);
				ret.push(rec2);						
			}
		}		
		
		//Update with modifications.
		for (var i = 0; i < m_modifiedRecords.length; i++) {
			if (m_modifiedRecords[i].Table == tbl.Name) {					
				for (var j = 0; j < ret.length; j++) {					
					if (m_modifiedRecords[i].RecID == ret[j].RecID) {
						CloneRecord(m_modifiedRecords[i], ret[j]);
						found = true;
						break;
					}					
				}														
			}				
		}
		
		//Update deleted records.
		for (var i = 0; i < m_deletedRecords.length; i++) {
			if (m_deletedRecords[i].Table == tbl.Name) {	
				for (var j = 0; j < ret.length; j++) {
					if (m_deletedRecords[i].RecID == ret[j].RecID) {
						ret.splice(j, 1);
						break;
					}
				}
			}
		}
						
		var ret2 = [];
		
        //Filter records by view.
        for (var i = 0; i < ret.length; i++) {
            if (ApplyViewToRec(tbl, ret[i], view_))
                ret2.push(ret[i]);
        }

        return ret2;
    };

    function ApplyViewToRec(table_, rec_, view_) {

        var filters = Application.GetFilters(view_);
        if (filters.length == 0) return true;

        //Added back in 11/05/15 - Need for temp records.
        if (rec_.UnAssigned) {
            for (var k = 0; k < filters.length; k++) {
                if (filters[k][1] != "") {
                    var value = GetKeyValue(table_, rec_, filters[k][0]);
                    if (value) {
                        try {
                            eval("var match = (\"" + value.toString().toLowerCase() + "\" " + Application.FilterType(filters[k][1]) + " \"" + Application.StripFilters(filters[k][1]).toString().toLowerCase() + "\");");
                            if (!match)
                                return false;
                        } catch (e) { };
                    }
                }
            }
        }

        for (var i = 0; i < rec_.Fields.length; i++) {

            var field = rec_.Fields[i];

            for (var j = 0; j < filters.length; j++) {

				if (filters[j][0] == field.Name && filters[j][1] != "") {
				
					var subfilters = filters[j][1].split("|");
					var pipes = "OR";
					if(filters[j][1].indexOf("&") != -1){
						subfilters = filters[j][1].split("&");
						pipes = "AND";
					}
				
					var found = false;
					for(var k = 0; k < subfilters.length; k++){
												
						try {
							
							eval("var match2 = (\"" + FormatValue(table_, field) + "\" " + Application.FilterType(subfilters[k]) + " \"" + Application.StripFilters(subfilters[k]).toString().toLowerCase() + "\");");
							
							if (subfilters[k].indexOf("*") != -1 && Application.FilterType(subfilters[k]) == "==")
								eval("var match2 = (\"" + FormatValue(table_, field) + "\".toLowerCase().indexOf(\"" + Application.StripFilters(subfilters[k]).replace(/\*/g, "") + "\".toLowerCase()) != -1);");
							
							if (subfilters[k].indexOf("*") != -1 && Application.FilterType(subfilters[k]) == "!=")
								eval("var match2 = (\"" + FormatValue(table_, field) + "\".toLowerCase().indexOf(\"" + Application.StripFilters(subfilters[k]).replace(/\*/g, "") + "\".toLowerCase()) == -1);");
							
							if (!match2 && pipes == "AND")
								return false;
							
							if(match2){
								found = true;								
							}
							
						} catch (e) {
						};											
					}
					
					if(!found && pipes == "OR")
						return false
				
					break;
				}
            }
        }
        return true;
    };

    function FormatValue(tbl, field) {
        var f = GetField(tbl, field.Name);
        if (f) {
            if (f.Type == "Option" && typeof field.Value == "number") {
                try {
                    return f.OptionString.split(",")[field.Value].toString().toLowerCase();
                } catch (e) {
                }
            }
            if (f.Type == "Date")
                return Application.FormatDate(field.Value);
			if (f.Type == "Integer" || f.Type == "Decimal")
				if(field.Value == null)
					return "0";
        }
        return field.Value.toString().toLowerCase();
    };

    function CloneRecord(rec, rec2,allowflowfields) {
        
		rec2.NewRecord = rec.NewRecord;
        rec2.UnAssigned = rec.UnAssigned;
        rec2.RecID = rec.RecID;
        rec2.Table = rec.Table;
		if(!allowflowfields){
			rec2.Fields = Default(rec2.Fields, []);
		}else{
			rec2.Fields = [];
		}
		
		var table = _self.GetObject("TABL", rec.Table);		
		
        for (var i = 0; i < rec.Fields.length; i++) {
			
			//Check for field skip.
			var skip = false;
			if(table && !allowflowfields){
				var c = GetColumnFromTable(table,rec.Fields[i].Name);
				if(c && c.FlowField && c.FlowField != ""){
					skip = true;			
				}	
			}
			
			if(!skip){
				
				if(!allowflowfields){
				
					//Delete field if it exists.
					for(var j = 0; j < rec2.Fields.length; j++){
						if(rec2.Fields[j].Name == rec.Fields[i].Name){
							rec2.Fields.splice(j,1);
							break;
						}
					}				
				}				
				
				var col = new Application.Objects.RecordFieldInfo();
				app_transferObjectProperties.call(col, rec.Fields[i]);
				rec2.Fields.push(col);
			}
        }
    };

    function GetKeyValue(form_, rec_, name_) {
        try {
            var keys = form_.TableKeys;
            var subkeys = keys[0].Columns.split(',');
            for (var i = 0; i < subkeys.length; i++) {
                if (subkeys[i].trim() == name_)
                    return rec_.RecID.split(": ")[1].split(",")[i].trim();
            }
        } catch (e) {
        }
        return null;
    };

    function GetField(table_, name_) {
        for (var i = 0; i < table_.Columns.length; i++) {
            if (table_.Columns[i].Name == name_)
                return table_.Columns[i];
        }
        return null;
    };

    function PrintLength(len) {
        var len = len / 1000;
        var unit = "KB";
        if (len > 1000) {
            len = len / 1000;
            unit = "MB"
        }
        return len.toFixed(2) + unit;
    };

    function Reset() {

        m_modifiedRecords = [];
        m_deletedRecords = [];
        m_insertedRecords = [];
        m_offlineActions = [];

    };

    //#endregion

});
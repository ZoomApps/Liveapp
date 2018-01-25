
//Application Namespace.
if (typeof Application == 'undefined')
    var Application = new Object();

function Default(value_, default_) {
    if (value_ == null)
        return default_;
    return typeof (value_) != 'undefined' ? value_ : default_;
};

function Extend(obj, objExt){

    obj = Default(obj, new Object());
    for(var i in objExt){
        obj[i] = Default(obj[i],objExt[i]);
    }
    return obj;
};

//Global variables.
Application.name = "%APPNAME%";
Application.version = "%VERSION%";
Application.copyright = "%COPYRIGHT%";
Application.url = "%SERVERADDRESS%";

//All objects should use this or inherit this.
AppObject = function (type_) {

    //Members
    var m_type = null;    

    //Methods        
    this.Constructor = function (type_) {                
        m_type = type_;
    };

    //Properties        
    this.ObjectType = function () {         
        return m_type;
    };
              
    //Constructor
    this.Constructor(type_);
};

window.onpopstate = function(event) {
	if(event.state==null)
	    return;
	if(!event.state.windowid || typeof event.state.hash != "undefined") 
	    return;

	var homepage = false;
	if(ThisViewer().Options && ThisViewer().Options() && ThisViewer().Options()["homepage"])
		homepage = true;
	
	if(ThisViewer() && !homepage)
		Application.RunNext(function(){
			return UI.WindowManager.Close(ThisViewer().ID());
		});
};

//#region Speed Fixes

Application.timeouts = [];
(function () {

    var messageName = "ztm";

    // Like setTimeout, but only takes a function argument.  There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeout(fn) {
        Application.timeouts.push(fn);
        window.postMessage(messageName, "*");
    }

    function handleMessage(event) {
		
		if (event.origin == "%REMOTEDEBUGURL%"){
			Application.Log.HandleMessage(event);
			return;
		}
		
        if (event.source == window && event.data == messageName) {
            event.stopPropagation();
            if (Application.timeouts.length > 0) {
                var fn = Application.timeouts.shift();
                fn();
            }
        }
    }

    window.addEventListener("message", handleMessage, true);

    // Add the one thing we want added to the window object.
    window.setZeroTimeout = setZeroTimeout;
})();

function memoize(fn, resolver) {

  var memoized = function() {

    resolver  = resolver || JSON.stringify;

    var cache = memoized.cache;
    var args  = Array.prototype.slice.call(arguments);
    var key   = "";
	if(args.length > 0)
		key = resolver.apply(this, args);

    return (key in cache) ? cache[key] : (cache[key] = fn.apply(this, arguments));

  };

  memoized.cache = {};

  return memoized;
};

//#endregion

//#region Base Prototypes

String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.within = function (arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == this)
            return true;
    }
    return false;
};

String.prototype.trim = String.prototype.trim ||
function () {
    return this.replace(/^\s*|\s*$/g, '');
};

String.prototype.replaceall = function (str,rep) {
    var s = this;
	while(s.indexOf(str) != -1)
		s = s.replace(str,rep);
	return s;
};

if (!Array.indexOf) {
    Array.prototype.indexOf = function (obj) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == obj) {
                return i;
            }
        }
        return -1;
    }
}

Array.prototype.firstObject = function () {
    for (var i = 0; i < this.length; i++) {
        if (this[i] != null && this[i] != "") {
            return i;
        }
    }
    return -1;
}

Array.prototype.list = function (seperator) {
    seperator = Default(seperator,",");
    var str = "";
    for (var i = 0; i < this.length; i++) {
        if (i == 0) {
            str = this[i].toString();
        } else {
            str += seperator + this[i].toString();
        }
    }
    return str;
};

Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.dst = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

Date.prototype.toJSON = function(){
	if(!this)
		return "null";
    return moment(this).format("%LANG:FORMAT_DATE_JSON%");
}

if($.datepicker && $.datepicker._gotoToday){
	var old_goToToday = $.datepicker._gotoToday
	$.datepicker._gotoToday = function(id) {
	  old_goToToday.call(this,id)
	  this._selectDate(id)
	}
}

//#endregion

Application.coreFunctions = new Object();

Define = function (name, base, def) {    
    if (base == null)
        base = function () {
            return new AppObject(name);
        }
    var obj = window;
    var params = name.split(".");
    while (params.length > 1) {
        obj = obj[params[0]];
        if (obj == null) 
            obj = new Object();
        params.splice(0, 1);
    }
    Application.coreFunctions[params[0]] = def;
    obj[params[0]] = function (arg1, arg2, arg3, arg4, arg5) {
        Application.coreFunctions[params[0]].prototype = base(arg1, arg2, arg3, arg4, arg5);
        return new Application.coreFunctions[params[0]](arg1, arg2, arg3, arg4, arg5);
    };
    return obj[params[0]];
};

Base = function (name) {
    return Application.coreFunctions[name].prototype
};

//#region Application Objects

Application.Objects = new Object();

Application.Objects.ArrayList = function () {
    return [];
};

Application.Objects.AuthInfo = function () {
    return {"Username":"","Password":"","SessionID":"","Remember":false,"Type":0,"LoginTime":"","Instance":"","Role":"","UserData":"","Layout":"","OfflineAuth":"","AppSecret":""};
};

Application.Objects.RecordSetInfo = function () {
    return {"Table":"","View":"","Position":0,"Record":{"NewRecord":true,"Fields":[],"UnAssigned":false},"xRecord":{"NewRecord":true,"Fields":[],"UnAssigned":false},"Blank":true,"Count":0,"Temp":false,"Functions":[],"CalculatedFields":[],"GroupFilters":[]};
};

Application.Objects.RecordInfo = function () {
    return {"NewRecord":true,"Fields":[],"UnAssigned":false};
};

Application.Objects.RecordFieldInfo = function () {
    return {"Name":"","Caption":"","Value":null,"Type":""};
};

Application.Objects.ColumnInfo = function () {
    return {"Name":"","Type":0,"Size":0,"DecimalPlaces":"","PrimaryKey":false,"Modified":true,"XName":"","Caption":"","CodeField":"","OptionString":"","OptionCaption":"","OnValidate":"","OnLookup":"","LookupTable":"","LookupField":"","LookupFilters":"","LookupColumns":"","LookupCategoryField":"","LookupDisplayField":""};
};

Application.Objects.TableInfo = function () {
    return {"Name":"","LicensePart":"","Columns":[],"Keys":[]};
};

Application.Objects.PageInfo = function () {
    return {"Name":"","Caption":"","LicensePart":"","Type":"","Fields":[],"Actions":[],"View":"","DeleteAllowed":false,"InsertAllowed":false,"CloseFunction":null,"OpenFunction":null,"TabList":[],"ShowFilters":false,"RunFunctionOnCancel":false,"RunDblClickOnNew":false,"SkipRecordLoad":false,"SourceID":"","AllowExternal":false,"NoCache":false,"GlobalCache":false,"Icon":""};
};

Application.Objects.PageFieldInfo = function () {
    return {"Name":"","Caption":"","Editable":false,"Validate":false,"Type":"","Width":0,"TabName":"","FieldMask":"","Tooltip":"","Hidden":false,"IncrementDelta":0,"Totals":false,"CustomControl":"","Sort":0,"OptionString":"","OptionCaption":"","OnValidate":"","OnLookup":"","LookupTable":"","LookupField":"","LookupFilters":"","LookupColumns":"","LookupCategoryField":"","LookupDisplayField":""};
};

Application.Objects.PageActionInfo = function () {
    return {"Name":"","Type":"","ActionCode":"","Image":"","RecordRequired":false,"FormID":"","FormView":"","Reload":false,"ReloadParent":false,"OnDoubleClick":false};
};

Application.Objects.CodeModuleInfo = function () {
    return {"Name":"","LicensePart":"","Code":""};
};

Application.Objects.LicenseInfo = function () {
    return {"No":"","LicenseDate":"","Program":"","ProgramVersion":"","ClientName":"","ResellName":"","AuthCode":"","Address1":"","Address2":"","Address3":"","Address4":"","Address5":"","Address6":"","Address7":"","Address8":"","Developer":"","Password":"","UserCount":"","AvailableParts":{"AvailableParts":null}};
};


//#endregion

//#region Globals

//Application Structs
Application.windowType = {
    Normal: 1,
    Frame: 2,
    Mobile: 4
};
Application.position = {
    normal: 0,
    right: 1,
    block: 2,
    rolehalf: 3,    
    rolequarter: 4
};
Application.authType = {
    Login: 1,
    Cookie: 2,
    Token: 3
};
Application.pages = {
    ErrorBrowser: 8911
};
Application.remoteStatus = {
    Disconnected: 1,
    Connecting: 2,
    Connected: 3
};

Application.supressError = false;
Application.supressServiceErrors = false;
Application.noGUI = false;
Application.auth = Application.Objects.AuthInfo();
Application.scripts = Array();
Application.executionPath = "%SERVERADDRESS%";
Application.event = {};
Application.maxRecords = 10000; 
Application.connected = false;
Application.debugMode = false;
Application.developerMode = false;
Application.timezone = %TZOFFSET%;  
Application.testMode = false;
Application.transactionStarted = 0;
Application.restrictedMode = false;
Application.type = Application.windowType.Normal;
Application.license = null;
Application.Virtual = new Object(); //#35 Virtual Tables 
Application.lastExecute = {};

//Caching.
Application.cacheValues = ['uncached','idle','checking','downloading','updateready','obsolete'];

//Global functions.
ThisViewer = function () { 
 if (ThisWindow()) 
    if(ThisWindow().LineEditor && ThisWindow().LineEditor() != null){
        return ThisWindow().LineEditor().pv;
    }else{
        return ThisWindow();
    }
};
ThisPage = function () { 
    if (ThisWindow()) 
        return ThisViewer().Page() 
};
ThisWindow = function () { 
    if ($moduleloaded("WindowManager")) 
        return UI.WindowManager.SelectedWindow(); 
};

//Error Handling.
Application.OnError = null;

Application.MessageBox = null;
Application.ConfirmBox = null;
Application.ProgressBox = null;

//Offline.
Application.IsOffline = function () {
    if ($moduleloaded("OfflineManager"))
        return Application.Offline.IsOffline();
    return false;
};

Application.CheckOfflineObject = function(type, id){
	if($moduleloaded("OfflineManager"))
		return Application.Offline.CheckOfflineObject(type, id);
	return true;
};

//Logging.
Application.LogInfo = function (msg) {
    if ($moduleloaded("Logging"))
        Application.Log.Info(msg);
};
Application.LogError = function (msg) {
    if ($moduleloaded("Logging"))
        Application.Log.Error(msg);
};
Application.LogDebug = function (msg) {
    if ($moduleloaded("Logging"))
        Application.Log.Debug(msg);
};
Application.LogWarn = function (msg) {
    if ($moduleloaded("Logging"))
        Application.Log.Warn(msg);
};

//Application Events.

Application.On = function (name, handler) {
    if (Application.event[name] == null)
        Application.event[name] = [];
    Application.event[name].push(handler);
};

Application.FireWait = function () {

    __slice = [].slice;

    var args, handler, name;
    name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (Application.event[name] != null) {

        var ref = Application.event[name];

        if (ref.length > 0)
            return $loop(function (i) {

                return $codeblock(

                    function () {
                        handler = ref[i];
                        return handler.apply(null, args);
                    },

                    function () {
                        if (i < ref.length - 1)
                            return $next;
                    }
                );

            });
    }
};

Application.Fire = function () { 

    __slice = [].slice;

    var args, handler, name;
    name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (Application.event[name] != null) {

        var ref = Application.event[name];
        for (var i = 0; i < ref.length; i++) {
            handler = ref[i];
            if(ref.length==1 || (i == ref.length - 1 && name=="ProcessCaption")){
                return handler.apply(null, args);
            }else{
				if(name=="ProcessCaption"){
					args[0] = handler.apply(null, args);
				}else{
					handler.apply(null, args);	
				}
            }
        }
    }
};

//#endregion

//#region Web Service Functions

(function ($, window, undefined) {
    //is onprogress supported by browser?
    var hasOnProgress = ("onprogress" in $.ajaxSettings.xhr());

    //If not supported, do nothing
    if (!hasOnProgress) {
        return;
    }

    //patch ajax settings to call a progress callback
    var oldXHR = $.ajaxSettings.xhr;
    $.ajaxSettings.xhr = function () {
        var xhr = oldXHR();
        if (xhr instanceof window.XMLHttpRequest) {
            xhr.addEventListener('progress', this.progress, false);
        }

        if (xhr && xhr.upload) {
            xhr.upload.addEventListener('progress', this.progress, false);
        }

        return xhr;
    };
})(jQuery, window);

Application.GenerateWebService = function (method, args){
        
    var url = "%SERVERADDRESS%q/?m=" + method;
    var ret = new Object();
	ret.url = url;
	ret.data = args;
	return ret;
};

Application.ExecuteWebService = function (method, args, callback_, async_, progress_, ignoreConnection_, overrideCallbacks_, timeout_) {

	//Retry last service call
	if(!method){		
	
		method = Application.lastExecute.method;
		args = Application.lastExecute.args;
		callback_ = Application.lastExecute.callback_;
		async_ = Application.lastExecute.async_;
		progress_ = Application.lastExecute.progress_;
		ignoreConnection_ = Application.lastExecute.ignoreConnection_;
		overrideCallbacks_ = Application.lastExecute.overrideCallbacks_;
		timeout_ = Application.lastExecute.timeout_;
		
	}else{
		
		if (method != "GetServerInfo" && method != "GetNotifications" && method != "GetMessage")
			Application.lastExecute = {
				method:method, 
				args:args, 
				callback_:callback_, 
				async_:async_, 
				progress_:progress_, 
				ignoreConnection_:ignoreConnection_, 
				overrideCallbacks_:overrideCallbacks_, 
				timeout_:timeout_
			};
	
	}

    //#35 Virtual Tables
    if(method == "RecordSet" && Application.Virtual[args.table_]){
        if(Application.Virtual[args.table_].RecordSet(args, callback_))
            return;
    }

    if (Application.IsOffline() && $moduleloaded("OfflineManager")) {
        Application.LogInfo("Executing Offline Action: " + method + ", Session ID: " + Application.auth.SessionID);
        if (Application.Offline.Process(method, args, callback_))
            return;
        Application.Error("Offline action not found: " + method);
    }

    if (async_ == null) async_ = true;

    //Set the server URL and q extention.
    var url = "%SERVERADDRESS%q/";

	if (method != "GetServerInfo" && method != "GetNotifications" && method != "GetMessage"){
		
		Application.LogInfo("Executing Webservice: " + method + ", Session ID: " + Application.auth.SessionID);
	
		Application.LogDebug("Method: "+method+", Args: "+$.toJSON(args));
	
		if(Application.Log.RemoteStatus() == Application.remoteStatus.Connected)
			Application.LogInfo("Method: "+method+", Args: "+$.toJSON(args));
	}      
	
    var xhr = $.ajax({
        beforeSend: function (xhrObj) {
            xhrObj.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
            xhrObj.setRequestHeader("Accept", "application/json");
        },
        async: async_,
        type: "POST",
        url: url + '?m=' + method,
        dataType: 'json',
        data: encodeURIComponent($.toJSON(args)), //Encode the arguments.
		timeout: timeout_,
        error: (function (e) {
			
			Application.Fire("ExecutedWebservice", method, false);
			
			if (e.statusText)
                e = e.statusText;
			
			if ((method == "GetServerInfo" || method == "GetNotifications" || method == "GetMessage") && !Application.HasDisconnected(e))
				return;            		
            
            if (overrideCallbacks_ && overrideCallbacks_.onerror) {
                overrideCallbacks_.onerror(e);
                return;
            }
            if (!Application.supressServiceErrors)
                Application.Error(e);
            if (method != "GetServerInfo" && method != "GetNotifications")
                Application.supressServiceErrors = false;
			if (callback_) callback_(false);
        }),
        success: (function (result) {
			
            Application.Fire("ExecutedWebservice", method, true);            

            if (!Application.connected) {
                Application.Fire("Connected");
                Application.connected = true;
            }
            
            if (result != null) {
                if (result.Message) {
                    if (result.Message != "FALSE") {
						if ((method == "GetServerInfo" || method == "GetNotifications" || method == "GetMessage") && !Application.HasDisconnected(result.Message))
							return;
						 if (overrideCallbacks_ && overrideCallbacks_.onerror) {
							overrideCallbacks_.onerror(result.Message);
							return;
						}
                        if (!Application.supressServiceErrors)
                            Application.Error(result.Message);                                             
                    }
                }
            }
			
			if (overrideCallbacks_ && overrideCallbacks_.onsuccess) {
                overrideCallbacks_.onsuccess(result);
                return;
            }
			
            if (method != "GetServerInfo" && method != "GetNotifications")
                Application.supressServiceErrors = false;
            if (callback_) callback_(result);
        }),
        progress: function (e) {
            if (progress_)
                progress_(e.loaded);
        }
    });
    if (overrideCallbacks_ && overrideCallbacks_.onsend)
        overrideCallbacks_.onsend(xhr);
};

Application.WebServiceWait = function (func, params, async_, progress_, ignoreConnection_) {

    var w = $wait();

    Application.ExecuteWebService(func, params, function (r) {        
        w.resolve(r);
    }, async_, progress_, ignoreConnection_);

    return w.promise();

};

Application.Authorize = function () {

    var w = $wait();

    Application.ExecuteWebService("Authorize", { auth: Application.auth }, function (r) {
        
        //Save timezone and license.
        Application.timezone = r.TZ; 
        var license = new Object();
        app_transferObjectProperties.call(license, r.License);
        Application.license = license;
        r.License = null;

        if (r) r.LoginTime = Application.ConvertDate(r.LoginTime,true) //Bug fix	
                		        
        w.resolve(r);

    }, true, null, true);

    return w.promise();
};

Application.LoginCookieExists = function(instance_){
    return Application.WebServiceWait("LoginCookieExists", {instance: instance_});
};

Application.Disconnect = function (async_, clearcookie_) {
    Application.connected = false;    
    async_ = Default(async_, false);
    clearcookie_ = Default(clearcookie_, false);
    return Application.WebServiceWait("Disconnect", { auth: Application.auth, clearcookie_: clearcookie_}, async_, null, true);
};

Application.LoadMainMenu = function () {
    return Application.WebServiceWait("LoadMainMenu", { auth: Application.auth });
};

Application.GetUserLicense = function () {
    return Application.WebServiceWait("GetUserLicense", { auth: Application.auth });
};

Application.ClearCache = function (id) {
    return Application.WebServiceWait("ClearCache", { auth: Application.auth, id_: id });
};

Application.CheckUpdates = function () {    
    return Application.WebServiceWait("CheckUpdates", { auth: Application.auth });
};

Application.CheckUpdatesSkipVersion = function () {    
    return Application.WebServiceWait("CheckUpdatesSkipVersion", { auth: Application.auth });
};

Application.GetUpdates = function () {
    return Application.WebServiceWait("GetUpdates", { auth: Application.auth });
};

Application.ClearRecordCache = function () {
    return Application.WebServiceWait("ClearRecordCache", { auth: Application.auth });
};

Application.SyncSecurity = function (user_) {
    //#39 Not needed in new security model.
    return;
};

Application.AuthCode = function (instance_) {
    instance_ = Default(instance_,"");
    var w = $wait();
    Application.ExecuteWebService("AuthCode", { auth: Application.auth, instance_: instance_ }, function (r) {
        Application.Message(r, null, "Auth Code");
        w.resolve();
    });
    return w.promise();
};

Application.SaveSource = function (type, id, code) {
    return Application.WebServiceWait("SaveSource", { auth: Application.auth, type_: type, id_: id, code_: code });
};

Application.UpdateProfileImage = function (type, img) {
    return Application.WebServiceWait("UpdateProfileImage", { auth: Application.auth, type_: type, img_: img });
};

Application.ExecutePlugin = function (plugin, method, args) {
    args.auth = Application.auth;
    return Application.WebServiceWait("ExecutePlugin&pluginname="+plugin+"&pluginmethod="+method, args);
};

Application.DownloadDataPack = function (progress_) {
    return Application.WebServiceWait("DownloadDataPack", { auth: Application.auth }, true, progress_);
};

Application.UploadDataPack = function (name_) {
    return Application.WebServiceWait("UploadDataPack", { auth: Application.auth, name_: name_ });
};

Application.BeginTransaction = function () {    
    Application.LogWarn("Application.BeginTransaction is deprecated");      
};

Application.CommitTransaction = function () {   
    Application.LogWarn("Application.CommitTransaction is deprecated");
};

Application.RollbackTransaction = function () {        
    Application.LogWarn("Application.RollbackTransaction is deprecated");    
};

Application.ThreadStart = function () {  
    if(Application.auth.SessionID != "")
        return Application.WebServiceWait("ThreadStart", { auth: Application.auth });   
};

Application.ThreadEnd = function () {      
    if(Application.auth.SessionID != "")
        return Application.WebServiceWait("ThreadEnd", { auth: Application.auth });   
};

Application.ThreadError = function () {        
    if(Application.auth.SessionID != "")
        return Application.WebServiceWait("ThreadError", { auth: Application.auth });   
};

Application.CreateFileForUpload = function (name_, length_, chunkSize_, mime_) {
    return Application.WebServiceWait("CreateFileForUpload", { auth: Application.auth, name_: name_, length_: length_, chunkSize_: chunkSize_, mime_: mime_ });
};

Application.CreateUser = function (username_, password_) {
    return Application.WebServiceWait("CreateUser", { auth: Application.auth, username_: username_, password_: password_ });
};

Application.LicensePassword = function (pass_) {
    return Application.WebServiceWait("LicensePassword", { auth: Application.auth, pass_: pass_ });
};

Application.ExportObjects = function (view_,src_) {
    return Application.WebServiceWait("ExportObjects", { auth: Application.auth, view_: view_, src_: src_ });
};

Application.ExportIndividualObjects = function (view_,src_) {
    return Application.WebServiceWait("ExportIndividualObjects", { auth: Application.auth, view_: view_, src_: src_ });
};

Application.ExportObjectBackup = function (view_,src_) {
    return Application.WebServiceWait("ExportObjectBackup", { auth: Application.auth, view_: view_, src_: src_ });
};

Application.RollbackObject = function (view_) {
    return Application.WebServiceWait("RollbackObject", { auth: Application.auth, view_: view_ });
};

Application.GetDependencies = function (view_) {
    return Application.WebServiceWait("GetDependencies", { auth: Application.auth, view_: view_ });
};

Application.ResyncTables = function (view_) {
    return Application.WebServiceWait("ResyncTables", { auth: Application.auth, view_: view_ });
};

Application.GetOfflineCookie = function(){
    return Application.WebServiceWait("GetOfflineCookie", {auth: Application.auth});
};

Application.GetUserLayout = function (username_, page_) {
    if(Application.IsOffline())
        return "";
    return Application.WebServiceWait("GetUserLayout", { auth: Application.auth, username_: username_, page_: page_ });
};

Application.SaveUserLayout = function (username_, page_, layout_) {
    if(Application.IsOffline())
        return;
    return Application.WebServiceWait("SaveUserLayout", { auth: Application.auth, username_: username_, page_: page_, layout_: layout_ });
};

Application.DeleteUserLayout = function (username_, page_) {
    if(Application.IsOffline())
        return;
    return Application.WebServiceWait("DeleteUserLayout", { auth: Application.auth, username_: username_, page_: page_ });
};

Application.CanSelect = function (type_, name_) {
    return Application.WebServiceWait("CanSelect", { auth: Application.auth, type_:type_, name_:name_ });
};

Application.CanInsert = function (type_, name_) {
    return Application.WebServiceWait("CanInsert", { auth: Application.auth, type_:type_, name_:name_ });
};

Application.CanModify = function (type_, name_) {
    return Application.WebServiceWait("CanModify", { auth: Application.auth, type_:type_, name_:name_ });
};

Application.CanDelete = function (type_, name_) {
    return Application.WebServiceWait("CanDelete", { auth: Application.auth, type_:type_, name_:name_ });
};

Application.Search = function (search_) {
	
	//Protected characters.
	if(search_ && search_.replaceall)
		search_ = search_.replaceall("(","LB;").replaceall(")","RB;");
	
    return Application.WebServiceWait("Search", { auth: Application.auth, search_:search_ });
};

Application.StartMaintenanceMode = function (msg_, time_) {
    return Application.WebServiceWait("StartMaintenanceMode", { auth: Application.auth, msg_: msg_, time_: time_ });
};

Application.EndMaintenanceMode = function () {
    return Application.WebServiceWait("EndMaintenanceMode", { auth: Application.auth });
};

Application.ExportUserLayout = function(user_){
    return Application.WebServiceWait("ExportUserLayout", { auth: Application.auth, user_: user_ });
};

Application.BatchProcess = function(insert_, modify_, delete_){
	return Application.WebServiceWait("BatchProcess", { auth: Application.auth, insert_: insert_, modify_: modify_, delete_: delete_ });
};

//#endregion

//#region Public Functions

Application.ProcessCaption = function(caption_){
	var cap = Application.Fire("ProcessCaption", caption_);
	if(cap)
		return cap;
	return caption_;
};

//#85 - Sanitize string function.
Application.SanitizeString = function(input) {
    
    if (input == null || typeof input != "string") //Only sanitize strings.
        return input;

    //Decode loop.
    var oldinput = "";
    do{
        oldinput = input;
        input = Application.DecodeHTML(input);
    }while(oldinput !== input);

    var output = input.replace(/<script[^>]*?>.*?<\/script>/gi, '').
				    replace(/<[\/\!]*?[^<>]*?>/gi, '').
				    replace(/<style[^>]*?>.*?<\/style>/gi, '').
				    replace(/<![\s\S]*?--[ \t\n\r]*>/gi, '');
    return output;
};

Application.CreateArray = function(len,value){
    var obj = new Array();
    for(var i = 0; i < len; i++){
        obj.push(value);
    }
    return obj;
};

Application.GetUserData = function () {
    if (Application.auth.UserData != "") {
        try {
            var data = $.parseJSON(Application.auth.UserData);
            return data;
        } catch (e) {
        }
    }
    return null;
};

Application.SaveUserData = function (data) {
    Application.auth.UserData = $.toJSON(data);    
};

Application.SwitchMode = function (mobile, instance) {
    
	//This should be in the app module...
	var extra = "";
	if(Application.App.Params()["returnurl"])
		extra += "&returnurl="+Application.App.Params()["returnurl"];
	
    if (mobile) {
        window.location = "%SERVERADDRESS%" + instance + "?mobile=true"+extra;
    } else {
        window.location = "%SERVERADDRESS%" + instance + "?mobile=false"+extra;
    }   
};

Application.LoadModules = function (windowType_, engineonly_) {

    try {

        //Check if the module manager loaded.
        if (typeof Application.ModuleManager == 'undefined')
            throw "%LANG:ERR_LOADFAILED%";		         

        //Set window type.				
        Application.type = windowType_;

        var params = [];         
        Application.LoadParams(params, PAGE_PARAMETERS);

		//Set mini mode.
        if (Application.IsInMobile()){
			if (Application.IsMobileDisplay()) {
				$("#divContent,label").addClass("ui-mini");
				$("#lnkMenu,#lnkActions")
							.buttonMarkup({ iconpos: "notext" })
							.buttonMarkup("refresh");
				$("#windowTitle").css("margin-left", "50px").css("margin-right", "50px");					
			} else {
				$("#divContent,label").removeClass("ui-mini");
				$("#lnkMenu,#lnkActions")
							.buttonMarkup({ iconpos: "left" })
							.buttonMarkup("refresh");
				$("#windowTitle").css("margin-left", "30%").css("margin-right", "30%");
			}
		}  
		
        //Load Liveapp Engine Modules.	            
        Application.ModuleManager.LoadModule(new IDEngine());
        Application.ModuleManager.LoadModule(new CodeEngine());        
        Application.ModuleManager.LoadModule(new Logging(0)); //Console Logging
        Application.ModuleManager.LoadModule(new CookieManager());        
		Application.ModuleManager.LoadModule(new LocalStorageManager());
        Application.ModuleManager.LoadModule(new UpdateManager());
        Application.ModuleManager.LoadModule(new NotificationManager());        
        //if (params["offline"] == "true")
        Application.ModuleManager.LoadModule(new OfflineManager());
        Application.ModuleManager.LoadModule(new ZipManager());
        Application.ModuleManager.LoadModule(new FileDownloadManager());
        Application.ModuleManager.LoadModule(new CacheManager());

        //Load Liveapp UI Modules.        
        Application.ModuleManager.LoadModule(new AppUI());
        Application.ModuleManager.LoadModule(new WindowManager());
        Application.ModuleManager.LoadModule(new PhantomManager());
        Application.ModuleManager.LoadModule(new InputManager());        
        Application.ModuleManager.LoadModule(new LoadingManager());
        Application.ModuleManager.LoadModule(new ImageManager());
        Application.ModuleManager.LoadModule(new WrapperManager());
        Application.ModuleManager.LoadModule(new CameraManager());
		Application.ModuleManager.LoadModule(new TourManager());

        //Load Liveapp App Module.
        if(!engineonly_)
            Application.ModuleManager.LoadModule(new App());

    } catch (e) {
        if (e != "")
            Application.Error(e);
    }

};

Application.NavigateToPage = function (id_) {
    
    if(Application.IsInMobile()){
        window.location = "%SERVERADDRESS%Pages/"+id_+"?mobile=true";
    }else{
        window.location = "%SERVERADDRESS%Pages/"+id_;
    }
};

Application.HookCacheEvents = function(){

    if (window.applicationCache) {

        //Issue #41 - Application cache not working in firefox.
        function LogCacheEvent(e) {
            var online, status, type, message;
            online = (navigator.onLine) ? 'yes' : 'no';
            status = Application.cacheValues[cache.status];
            type = e.type;            
            message = 'online: ' + online;
            message += ', event: ' + type;
            message += ', status: ' + status;
            Application.LogDebug(message);
        }

        var cache = window.applicationCache;
        cache.addEventListener('cached', LogCacheEvent, false);
        cache.addEventListener('checking', LogCacheEvent, false);
        cache.addEventListener('downloading', LogCacheEvent, false);
        cache.addEventListener('error', LogCacheEvent, false);
        cache.addEventListener('noupdate', LogCacheEvent, false);
        cache.addEventListener('obsolete', LogCacheEvent, false);
        cache.addEventListener('progress', LogCacheEvent, false);
        cache.addEventListener('updateready', LogCacheEvent, false);        

        window.applicationCache.addEventListener('updateready',
			function () {
			    try {			        
					
			        window.applicationCache.swapCache();                    
                    Application.LogDebug('Swap cache has been called, yo!');			        
                    
                    if(Application.connected){
                        Application.Confirm("An updated version of the website has been downloaded. Load the new version?",function(r){
			          
						    if(!r)return;					  
						    Application.Reload();

                        },"Update Available");
                    }else{
                        Application.Reload();
                    }
			        
			    } catch (e) {
			        Application.LogError(e);
			    }
			},
			false
		);

    } else {
        Application.LogDebug('App cache not supported.');
    }
};

Application.Reload = function(){
    if(Application.IsIE()){
	    window.location = window.location;
    }else{
	    window.location.reload();
    }
};

Application.HookPageEvents = function () {

    Application.HookCacheEvents();

    if (!Application.IsInMobile()) {

        //On resize.
        $(window).resize(app_debouncer(function () {

            //Resize the app.
            $("#divTop").css("width", $(window).width());  

			//Setup controls for resize.
			$(".xpress-resize").css("max-width",10);

            //Resize windows.
            if ($moduleloaded("WindowManager")) {
                UI.WindowManager.OnResize();
            }

        },500));

        //On keypress.
        $(document).keydown(function (ev) {
            if ($moduleloaded("InputManager")) {
                return UI.InputManager.OnKeyPress(ev);
            }
        });

    } else {

	
		$(window).resize(app_debouncer(function () {
		
		    $("#AppWorkspace").css("width",$(window).width());

			//Resize windows.
            if ($moduleloaded("WindowManager")) {
				$(".xpress-window-mobile").css("max-width",10);
				$(".xpress-window-mobile").css("max-width","");
                UI.WindowManager.OnResize();
            }
		
		},500));
		
        //On resize.        
        $(window).on("orientationchange", app_debouncer(function() {

            $.mobile.resetActivePageHeight();
			
            $("#AppWorkspace").css("width",$(window).width());

			//Setup controls for resize.
			$(".xpress-resize").css("max-width",10);

            //Resize windows.
            if ($moduleloaded("WindowManager")) {
				$(".xpress-window-mobile").css("max-width",10);
				$(".xpress-window-mobile").css("max-width","");
                UI.WindowManager.OnResize();
            }
                       
        }));

		$("#okBtn").tap(function () { 
			//$("#divMobileFooter").hide();
             setTimeout(function(){
                Application.RunNext(function(){                    
                    return UI.WindowManager.OnSave(true);
                });
            },500); //Delay here to wait for field validation
        });        
        $("#saveBtn").tap(function () { 
            //$("#divMobileFooter").hide();
			setTimeout(function(){
                Application.RunNext(UI.WindowManager.OnSave);
            },500); //Delay here to wait for field validation
        });        
        $("#saveCloseBtn").tap(function () { 
			//$("#divMobileFooter").hide();
            setTimeout(function(){
                Application.RunNext(function(){                    
                    return UI.WindowManager.OnSave(true);
                });
            },500); //Delay here to wait for field validation
        }); 
         $("#saveNewBtn").tap(function () { 
            //$("#divMobileFooter").hide();			
			setTimeout(function(){
                Application.RunNext(function(){
                    return UI.WindowManager.OnSave(true,true);
                });
            },500); //Delay here to wait for field validation
        }); 
		$("#closeBtn").tap(function () { 
            //$("#divMobileFooter").hide();
			setTimeout(function(){
                Application.RunNext(function(){
					Application.RunNext(function () { if(ThisWindow()) return UI.WindowManager.CloseClick(ThisWindow().ID()) });
				});
            },500); //Delay here to wait for field validation
        });        
    }

    //OnClose.
    $(window).unload(function () {
        if ($moduleloaded("App")) {
            Application.App.Close();
        }
    });
};

Application.MergeView = function (view, rec) { 

    if(view == null) return "";

    var check = new RegExp('\=FIELD\\(((.*?))\\)', 'g');
    var consts = view.match(check);
    if (consts && rec) {
        for (var j = 0; j < consts.length; j++) {
            var name = consts[j].replace(check, '$2');
            var f = rec.GetField(name);            
            if (f) {
                if(f.Value == null || f.Value == "" || f.Value == 0)
                    f.Value = null;
                if(f.Value && f.Value.getMonth){           
                    view = view.replace("=FIELD(" + consts[j].replace(check, '$1') + ")", "=CONST(" + $.format.date(f.Value,"dd/MM/yyyy") + ")");
                }else{
                    view = view.replace("=FIELD(" + consts[j].replace(check, '$1') + ")", "=CONST(" + f.Value + ")");
                }
            }         
        }
    }

    view = Application.ViewSubstitute(view);

    return view;
};

Application.LicenseCheck = function(name, dev){

    dev = Default(dev,false);

    if(!Application.license || !Application.license.AvailableParts || !Application.license.AvailableParts.AvailableParts)
        return false;

    var parts = Application.license.AvailableParts.AvailableParts;
    for(var i = 0; i < parts.length; i++){
        if(parts[i].Name == name){
            if(dev && parts[i].Developer)
                return true;
            if(!dev)
                return true;
        }
    }
    return false;
};

$license = Application.LicenseCheck; //Add global access function.

Application.RunSilent = function(func){
    try{
        return func();
    }catch(e){
    }
};

Application.RunNext = function (func, skipDelay, id, trans) {
    
    if(skipDelay)
        return $codeblock(func);	
		
    setZeroTimeout(function () {
        $thread(function () {
			return $codeblock(func);
        },null,null,null,id);
    });
}

Application.TestNumber = function (n) {
    if (isNaN(parseInt(n))) 
        Application.Error("Value must be a number.");
};

Application.IsPortrait = function(){
	return $(window).height() > $(window).width();	
};

Application.IsInFrame = function(){
	return Application.type == Application.windowType.Frame;
};

Application.IsInMobile = function(){
	return Application.type == Application.windowType.Mobile;
};

Application.IsDevice = function () {
    return (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
};

Application.IsAndroid = function(){
	return /(android)/i.test(navigator.userAgent);
};

Application.IsMobileDisplay = function () {
    return $(window).width() <= 650;
};

Application.IsTabletDisplay = function () {
    return $(window).width() > 650;
};

Application.MiniMode = function () {
	//Backwards compat.
    return Application.IsMobileDisplay();
};

Application.IsIE = memoize(function () {
    return $.browser.msie == true;
});
Application.IsSafari = memoize(function () {
    return $.browser.safari == true;
});
Application.IsOpera = memoize(function () {
    return $.browser.opera == true;
});
Application.IsChrome = memoize(function () {
    return $.browser.webkit == true;
});
Application.IsFirefox = memoize(function () {
    return $.browser.mozilla == true;
});

Application.IsPrivate = function(){
	if(!$.browser.safari)
        return false;
	var storageTestKey = 'sTest',
		storage = window.sessionStorage;

	try {
	  storage.setItem(storageTestKey, 'test');
	  storage.removeItem(storageTestKey);
	} catch (e) {
	    return true;
	}
	return false;
};

Application.UnsupportedIE = memoize(function (strict_) {

    if(!$.browser.msie)
        return false;

    strict_ = Default(strict_, false);

    if (jQuery.browser.version.substring(0, 2) == "6.")
        return true;
    if (jQuery.browser.version.substring(0, 2) == "7.")
        return true;
    if (jQuery.browser.version.substring(0, 2) == "8.")
        return true;
    if (jQuery.browser.version.substring(0, 2) == "9." && strict_)
        return true;
    if (!Application.CanvasSupported() && strict_)
        return true;
    return false;
});

Application.CanvasSupported = memoize(function () {    
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));    
});

Application.HasDisconnected = function(e){
	if(!e || typeof e.indexOf == 'undefined')
		return false;	
	return e.indexOf("%LANG:SYS_SESSIONERROR%") != -1 || e.indexOf("%LANG:ERR_INVREQ%") != -1 || e.indexOf("open DataReader") != -1 || e.indexOf("transaction was rollbacked or commited") != -1;
};

Application.Error = function (msg) {

    //Kill the timeout queue.
    Application.timeouts = [];

    Application.LogError("Application Error: " + msg);    

    Application.Fire("Error",msg);    
    
    if($moduleloaded("AppUI")){
        Application.RunSilent(UI.HideServerProgress);
		UI.StatusBar(false);	
	}
    
    Application.HideProgress();        
	if($moduleloaded("OfflineManager")){
		Application.Offline.HideLoad();
	}

	if (typeof msg.indexOf != 'undefined') {
		if (msg == "%LANG:SYS_ERR%" || msg.toLowerCase() == "unknown") {
				
				//Lost Connection
				setTimeout(function(){
					Application.ExecuteWebService();
				},1000);
				
				Application.Fire("ConnectionLost");
				Application.connected = false;
				
				//Kill execution.
				throw "";
		}
	}
	
    //Restart code engine.
    if ($moduleloaded("CodeEngine")){
        Application.CodeEngine.Restart();
		if(!Application.HasDisconnected(msg))
			$code(Application.ThreadError);	
    }

    Application.Fire("ThreadFinished");

    //Use arguments to replace $ const values.
    for (var i = 1; i < arguments.length; i++)
        msg = msg.replace("$" + i, arguments[i]);

    //Lost connection to server.
    if (typeof msg.indexOf != 'undefined') {
        if (msg == "%LANG:SYS_ERR%" || msg.toLowerCase() == "%LANG:SYS_SERVERTOOBUSY%" || msg.toLowerCase() == "%LANG:SYS_INTERNALSERVERERR%" || msg.toLowerCase() == "unknown") {
            Application.Fire("ConnectionLost");
            Application.connected = false;
        }
    }

    //Run error handling.
    if (!Application.supressError) {        
        if (Application.OnError) {
            setTimeout(function(){
                Application.OnError(msg);
            },100);
        }
        //Kill execution.
        throw "";
    }
    Application.supressError = false;
    Application.supressServiceErrors = false;
};

Application.ShowError = function (msg, callback) {

    if (Application.noGUI || msg == ""){
        if (callback) 
            setTimeout(callback,50);
        return;
    }

    //Use arguments to replace $ const values.
    for (var i = 2; i < arguments.length; i++)
        msg = msg.replace("$" + i, arguments[i]);

    Application.Message(msg, callback, "%LANG:S_ERR%");
}

//Default error handling to ShowError.
Application.OnError = Application.ShowError;

Application.Message = function (msg, callback, title, icon) {

    //Don't show the message if we have no GUI access.
    if (Application.noGUI){
        if (callback) 
            setZeroTimeout(callback);
        return;
    }

    //Default values.
    title = title || '%LANG:S_APPMSG%';

    if (Application.MessageBox != null) {
        Application.MessageBox(msg, title, callback, icon);
    } else {
        alert(msg);
        if (callback) callback();
    }
};

Application.Confirm = function (msg, callback, title, yescaption, nocaption) {

    //Don't show the message if we have no GUI access.
    if (Application.noGUI){
        if (callback != null)
            setZeroTimeout(function(){
                callback(true);
            });
        return;
    }

    //Default values.
    title = title || '%LANG:S_APPCONFIRM%';

    if (Application.ConfirmBox != null) {
        Application.ConfirmBox(msg, title, callback, yescaption, nocaption);
    } else {
        if (confirm(msg) == true) {
            if (callback != null)
                callback(true);
        } else {
            if (callback != null)
                callback(false);
        }
    }
};

Application.ShowProgress = function (msg, title, i, num) {

    if (Application.noGUI)
        return;
    
    title = Default(title,'Progress');

    if (Application.ProgressBox) {
        Application.ProgressBox(true, msg, title, i, num);
    }
};

Application.HideProgress = function () {

    if (Application.noGUI)
        return;

    if (Application.ProgressBox) {
        Application.RunSilent(function(){
            Application.ProgressBox(false);
        });
    }
};

Application.StrSubstitute = function (msg) {

    //Use arguments to replace $ const values.
    for (var i = 1; i < arguments.length; i++)
        while (msg.indexOf("$" + i) != -1)
            msg = msg.replace("$" + i, arguments[i]);

    return msg;
};

Application.LoadParams = function (arr, paramstr) {

    if (paramstr == null)
        paramstr = window.location.search.substring(1);

    var parms = paramstr.split('&');

    for (var i = 0; i < parms.length; i++) {
        var pos = parms[i].indexOf('=');
        if (pos > 0) {
            var key = parms[i].substring(0, pos);
            var val = parms[i].substring(pos + 1);
            arr[key] = decodeURIComponent(val);
        }
    }

};

Application.LoadScript = function (id_, code_) {

    $('body').remove("#" + id_);

    if(code_.indexOf("http") == 0){

        var source = $('<script type="text/javascript" src="' + code_ + '"></script>');
        $('head').append(source);

    }else{

        var source = $('<script type="text/javascript" id="' + id_ + '">' + code_ + '</script>');
        $('body').append(source);

    }

};

Application.FriendifyDates = function (view_) {

    var check = new RegExp('([\(\.\<\=\\s])(\\d+)(\/)(\\d+)', 'g');
    var groups = view_.match(check);
    return view_.replace(check, "$1$4$3$2");
};

Application.CheckEmail = function (email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

Application.HasOption = function(opts,key){
    if (!opts) 
        return false;
    var options = opts.split(";");
    for (var i = 0; i < options.length; i++) {
        if (options[i] == key) {
            return true;
        }
    }
    return false;
};

Application.OptionValue = function(opts,key){
    if(!opts)
        return null;
    var opt_arr = opts.split(";");
    for(var i = 0; i < opt_arr.length; i++){
        var item = opt_arr[i];
        if(item != ""){
            var item_arr = item.split(":");
            if(item_arr.length > 1){
                if(item_arr[0] == key)
                    return item_arr[1].replace(/COMMA;/g,",");
            }
        }
    }
    return null;
};

Application.dateCache = {};
Application.ConvertDate = function(str,skipTZ) {
    
	if(Application.dateCache[str])
        return new Date(Application.dateCache[str]);
	
    var m = moment(str);
   
    var server_tz = 0;
    var local_tz = 0;    

    if(m._tzm){
		server_tz = m._tzm*-1;
    	local_tz = moment(str).zone();    
    }
	
	Application.dateCache[str] = m.zone(server_tz-local_tz).toDate();
	
    return new Date(Application.dateCache[str]);
};

Application.ExecuteAjax = function (url_, data_, callback_) {

    $.ajax({
        url: url_,
        data: data_,
        error: (function (e) {
            if (e.statusText)
                e = e.statusText;
            Application.Error(e);
        }),
        success: (function (result) {
            if (result != null) {
                if (result.Message) {
                    if (result.Message != "FALSE") {
                        Application.Error(result.Message);
                    }
                }
            }
            if (callback_) callback_(result);
        })
    });
};

Application.ExecuteEndpoint = function (url_, callback_, timeout_, type_) {  
		
    type_ = Default(type_,'json');
	
    var xhr = $.ajax({
        beforeSend: function (xhrObj) {			
            xhrObj.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
            if(type_ == 'json')
                xhrObj.setRequestHeader("Accept", "application/json");
        },
        async: true,
        crossDomain: true,
        type: "POST",
        url: url_,
        dataType: type_,        
        timeout: timeout_,
        error: (function (e) {
            if (e.statusText)
                e = e.statusText;            
            Application.Error(e);            
            if (callback_) callback_(false);
        }),
        success: (function (result) {
			
            if (result != null) {
                if (result.Message) {
                    if (result.Message != "FALSE") {                        
                        Application.Error(result.Message);                                             
                    }
                }
            }			            
            if (callback_) callback_(result);
        })
    });    
};

Application.RandomArray = function (myArray) {
    var i = myArray.length;
    if (i == 0) return false;
    while (--i) {
        var j = Math.floor(Math.random() * (i + 1));
        var tempi = myArray[i];
        var tempj = myArray[j];
        myArray[i] = tempj;
        myArray[j] = tempi;
    }
};

Application.CleanArray = function (array, deleteValue) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == deleteValue) {
            array.splice(i, 1);
            i--;
        }
    }
    return array;
};

var app_transferObjectProperties = function(obj_) {
    if (obj_ == null) {
        return false;
    }
    for (var i in obj_) {
        this[i] = obj_[i];
    }
    return true;
};

var app_deepTransferObjectProperties = function(obj_) {
    if (obj_ == null) {
        return false;
    }
    $.extend(true, this, obj_);    
    return true;
};

function app_debouncer(func, timeout) {

    var timeoutID, timeout = timeout || 200;
    return function () {
        var scope = this, args = arguments;
        clearTimeout(timeoutID);
        timeoutID = setTimeout(function () {
            func.apply(scope, Array.prototype.slice.call(args));
        }, timeout);
    }
};

Application.DecodeHTML = function(text){
	var decoded = $('<div/>').html(text).text();
	return decoded;
};

Application.DecryptData = function(inStr, inPass) {
    try {
        //Creating the Vector Key
        var iv = CryptoJS.enc.Hex.parse('d71741b0aa69380636689824d1156c05');
        //Encoding the Password in from UTF8 to byte array
        var Pass = CryptoJS.enc.Utf8.parse(inPass);
        //Encoding the Salt in from UTF8 to byte array
        var Salt = CryptoJS.enc.Utf8.parse("Your salt value");
        //Creating the key in PBKDF2 format to be used during the decryption
        var key128Bits1000Iterations = CryptoJS.PBKDF2(Pass.toString(CryptoJS.enc.Utf8), Salt, { keySize: 128 / 32, iterations: 1000 });

        //Enclosing the test to be decrypted in a CipherParams object as supported by the CryptoJS libarary
        var cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(inStr)
        });

        //Decrypting the string contained in cipherParams using the PBKDF2 key
        var decrypted = CryptoJS.AES.decrypt(cipherParams, key128Bits1000Iterations, { mode: CryptoJS.mode.CBC, iv: iv, padding: CryptoJS.pad.Pkcs7 });
        var plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        return plaintext;
    }
    //Malformed UTF Data due to incorrect password
    catch (err) {
        return "";
    }
}

Application.EncryptData = function(inStr, inPass) {
    try {
        //Creating the Vector Key
        var iv = CryptoJS.enc.Hex.parse('d71741b0aa69380636689824d1156c05');
        //Encoding the Password in from UTF8 to byte array
        var Pass = CryptoJS.enc.Utf8.parse(inPass);
        //Encoding the Salt in from UTF8 to byte array
        var Salt = CryptoJS.enc.Utf8.parse("Your salt value");
        //Creating the key in PBKDF2 format to be used during the decryption
        var key128Bits1000Iterations = CryptoJS.PBKDF2(Pass.toString(CryptoJS.enc.Utf8), Salt, { keySize: 128 / 32, iterations: 1000 });
        //Decrypting the string contained in cipherParams using the PBKDF2 key

        //Enclosing the test to be decrypted in a CipherParams object as supported by the CryptoJS libarary
        var cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Utf8.parse(inStr)
        });

        var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(inStr), key128Bits1000Iterations, { mode: CryptoJS.mode.CBC, iv: iv, padding: CryptoJS.pad.Pkcs7 });
        //var plaintext = decrypted.toString(CryptoJS.enc.Base64);
        var plaintext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        //var plaintext = encrypted.toString();
        return plaintext;
    }
    //Malformed UTF Data due to incorrect password
    catch (err) {
        return "";
    }
};

moment.locale("%LANG:CULTURE%");

Application.FormatDate = function(dte, format){
	if(dte == null)
		return "";
	format = Default(format,"dd/MM/yyyy");
	return $.format.date(dte,format);
};

Application.ParseDate = function(str){
	if(str && str.indexOf("T") != -1)
		return new Date(str);
	return moment(str,"%LANG:FORMAT_LONGDATE%".toUpperCase()).toDate();    
};

Application.ParseDateTime = function(str){
	if(str && str.indexOf("T") != -1)
		return new Date(str);
	return moment(str,"DD/MM/YYYY hh:mm:ss a").toDate();    
};


Application.ParseTime = function(timeStr, dt) {

    if (!dt) {
        dt = new Date();
    }
 
    var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
    if (!time) {
        return null;
    }
    var hours = parseInt(time[1], 10);
    if (hours == 12 && !time[3]) {
        hours = 0;
    }
    else {
        hours += (hours < 12 && time[3]) ? 12 : 0;
    }
 
    dt.setDate(1);
    dt.setMonth(0);
    dt.setYear(1900);

    dt.setHours(hours);
    dt.setMinutes(parseInt(time[2], 10) || 0);
    dt.setSeconds(0, 0);

    return dt;
};

Application.OffsetDate = function(dt){
	
	if(dt == null)
		return dt;
	
	//Apply server offset.
	var offset = Application.auth.TZ - moment().zone();
	dt.setTime(dt.getTime()+(offset*60*1000));
	return dt;
};

//#endregion

//#region Record Functions

Application.CombineViews = function(view1_, view2_, overwrite_){
    
	overwrite_ = Default(overwrite_,true);
	
    var ret = "";
    var filters = Application.GetFilters(view2_,false);
    var orgfilters = Application.GetFilters(view1_,false);

    //Handle top.
    var top = Application.GetTop(view2_);
    if(top == "")
        top = Application.GetTop(view1_);
    if(top != "")
        top += " ";

    //Handle sorting.
    var sorting = Application.GetSorting(view2_);
    if(sorting == "")
        sorting = Application.GetSorting(view1_);
    if(sorting != "")
        sorting += " ";

    for(var i = 0; i < filters.length; i++){
        try{
            
            var filts = filters[i].split("=");
            var found = false;

            for(var j = 0; j < orgfilters.length; j++){
                var orgfilts = orgfilters[j].split("=");
                if(orgfilts[0] == filts[0]){
					if(overwrite_)
						orgfilters[j] = filters[i];
                    found = true;
                }    
            }
            if(!found)
                orgfilters.push(filters[i]);

        }catch(e){
        }
    }
    for(var i = 0; i < orgfilters.length; i++){
        if(ret == ""){
            ret = orgfilters[i];
        }else{
            ret += ","+orgfilters[i];
        }
    }
        
    if(ret != "")
        ret = "WHERE("+ret+")";

    return top + sorting + ret;
};

Application.GetFilter = function (name_, view_) {

    if (view_) {
        var filters = Application.GetFilters(view_);
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            if (filter[0] == name_)
                return filter[1];
        }
    }

    if (Application.auth.UserData != "") {
        try {
            var data = $.parseJSON(Application.auth.UserData);
            if (data.filters)
                if (data.filters[name_] !== undefined)
                    return data.filters[name_];
        } catch (e) {
        }
    }

    return "";
};

Application.ViewSubstitute = function (view) {

    if (view == null)
        return;

    if (view.indexOf("%1") != -1)
        view = view.replace(/%1/g, Application.auth.Username);

    if (view.indexOf("%TODAY") != -1)
        view = view.replace(/%TODAY/g, $.format.date(new Date(), '%LANG:FORMAT_SHORTDATE%'));

    if (Application.auth.UserData != "" && view.indexOf("%") != -1) {
        try {
            var data = $.parseJSON(Application.auth.UserData);            
            if (data.filters) {
                for (var i in data.filters) {
                    eval("view = view.replace(/"+i+"/g, \""+data.filters[i]+"\");");
                }
            }
        } catch (e) {
        }
    }

    return view;
};

Application.GetTop = function(view){
    
    var top = ""
    if (view.indexOf("TOP") != -1) {        

        var check = new RegExp("TOP\\s*\\((.*?)\\)", 'g');
        var matches = view.match(check);
        if (matches) {
            if(matches.length > 0){
                top += "TOP(" + matches[0].replace(check, '$1') + ") ";
            }
        }
    }
    return top;
};

Application.GetSorting = function(view){
    
    var sorting = ""
    if (view.indexOf("SORTING") != -1) {        

        var check = new RegExp("SORTING\\s*\\((.*?)\\)", 'g');
        var matches = view.match(check);
        if (matches) {
            if(matches.length > 0){
                sorting += "SORTING(" + matches[0].replace(check, '$1') + ") ";
            }
        }
    }
    if (view.indexOf("ORDER") != -1) {        

        var check = new RegExp("ORDER\\s*\\((.*?)\\)", 'g');
        var matches = view.match(check);
        if (matches) {
            if(matches.length > 0){
                sorting += " ORDER(" + matches[0].replace(check, '$1') + ") ";
            }
        }
    }
    return sorting;
};

Application.GetFilters = function (view, friendify) {

    friendify = Default(friendify,true);

    var arr = new Array();
	
	view = Default(view,"");

    //Issue #36 - View errors when it contains a comma or equals sign.
    if (view.indexOf("WHERE") != -1) {

        view = view.replace("WHERE (", "WHERE(");

        var check = new RegExp("\\,*(.*?)\\=\\s*(\\w+)\\s*\\((.*?)\\)", 'g');
        var matches = view.substr(view.indexOf("WHERE(") + 6).match(check);
        if (matches) {
            for (var i = 0; i < matches.length; i++) {

                var name = matches[i].replace(check, '$1');
                var type = matches[i].replace(check, '$2');
                var filt = matches[i].replace(check, '$3');

                if(!friendify){
                    arr.push(name.trim()+"="+type+"("+filt+")");
                }else{
                    arr.push([name.trim(),filt]);
                }
            }
        }
    }

    return arr;
};

Application.AddFilter = function(view_,field_,filter_){

    filter_ = Default(filter_,"");
	
	//Protected characters.
	if(filter_ && filter_.replaceall)
		filter_ = filter_.replaceall("(","LB;").replaceall(")","RB;");

    var filter = "$1=FILTER($2)";
    filter = Application.StrSubstitute(filter,field_,filter_);

    var blank = (filter_ == "");
    var newview = "$5$1$2$3$4";
    var top = Application.GetTop(view_);
    var sorting = Application.GetSorting(view_);
    var wherebegin = "";
    var whereend = "";
    var filters = "";

    if(!blank){
        wherebegin = "WHERE(";
        whereend = ")";
    }

    var filterarray = Application.GetFilters(view_,false);
    for(var i = 0; i < filterarray.length; i++){
        var v = filterarray[i];
		v = v.trim();
        if(v.indexOf(field_+"=")!=0){
            wherebegin = "WHERE(";
            whereend = ")";
            if(filters == ""){
                filters = v;
            }else{
                filters += ","+v;
            }
        }
    }

    if(!blank){
        if(filters == ""){
            filters = filter;
        }else{
            filters += ","+filter;
        }
    }
    return Application.StrSubstitute(newview,sorting,wherebegin,filters,whereend,top);
};

Application.StripFilters = function (filter) {
    return filter.replace("<", "").replace(">", "").replace("..", "").replace("=", "").toString().toLowerCase();
};

Application.FilterType = function (filter) {

    if (filter.indexOf("<>") != -1) {
        return "!=";
    } else if (filter.indexOf("<") != -1) {
        return "<";
    } else if (filter.indexOf(">") != -1) {
        return ">";
    } else if (filter.indexOf("=") != -1) {
        return "==";
    } else if (filter.indexOf("..") != -1) {
        return "..";
    }

    return "==";
};

Application.MergeLookupView = function (field, viewer, term, value) {

    term = Default(term, "");
    value = Default(value, "");
    if (term != "") {
        if (field.Type == "Integer") {
            value = "<>0";
        } else {
            value = "<>''";
        }
    }

	var filters = field.LookupFilters;
	if(typeof filters == "function")
		filters = field.LookupFilters();
	
    var view = ""
    view = viewer.MergeView(filters);
    view = view.replace("%term", term);
    view = view.replace("%value", value);
    return view;
};

Application.LookupRecord = function (field, viewer, term, response, value) {

    return $codeblock(

        function () {

            Application.LogInfo("LookupRecord: Search: " + term);

            term = Default(term, "");
            value = Default(value, "");
            if (term != "") {
                if (field.Type == "Integer") {
                    value = "<>0";
                } else {
                    value = "<>''";
                }
            }

            var r = new Record();
            r.Table = field.LookupTable;
            r.View = Application.MergeLookupView(field, viewer, term, value);

            //Add lookup columns.
            var cols = field.LookupColumns.split(",");  
            for (var i = 0; i < cols.length; i++) {
                r.AddLookupField(cols[i]);
            }   
            if(field.LookupCategoryField != "")
                r.AddLookupField(field.LookupCategoryField);
            r.AddLookupField(field.LookupField);
			r.AddLookupField(field.LookupDisplayField);

            return r.FindFirst();
        },

        function (r) {

            var result = new Array();

            Application.LogInfo("Found " + r.Count + " records.");            

            var cols = field.LookupColumns.split(",");                        

            if (Application.IsInMobile() && cols.indexOf("Preview") != -1)
                cols.splice(cols.indexOf("Preview"), 1);                            

            var displcol = "";

            if (r.Count > 0)
                do {
                    
                    var item = new Object();
                    item.BlankRow = false;
                    item.BoldField = "";
                    item.DisplayCol = "";
					item.ValueCol = "";
                    item.RID = r.Record.RecID;
                    item.UID = $id();

                    var add = false;
                    for (var i = 0; i < r.Record.Fields.length; i++) {

                        if (r.Record.Fields[i].Name == field.LookupCategoryField)
                            item.BoldField = Default(r.Record.Fields[i].Value,'');													

                        var hidden = (cols.indexOf(r.Record.Fields[i].Name) == -1) && (r.Record.Fields[i].Name != field.LookupField) && (r.Record.Fields[i].Name != field.LookupDisplayField);                                                               
                                                                 
                        if(!hidden){                            

                            r.Record.Fields[i].Value = Default(r.Record.Fields[i].Value,'');
							
							//#120 Dont Search on hidden columns  
                            if (term == "" || 
							(r.Record.Fields[i].Value.toString().toLowerCase().indexOf(term.toLowerCase()) != -1 && 
							(r.Record.Fields[i].Name != field.LookupField || cols.indexOf(r.Record.Fields[i].Name) != -1)))
                                add = true;
                                                        
                            item[r.Record.Fields[i].Name] = r.Record.Fields[i].Value;

                            //Option values.
                            if(r.DatabaseTable()){
                                var df = r.DatabaseTable().Column(r.Record.Fields[i].Name);
                                if(df){
                                    if (df.OptionString != "") {
                                        var vals = df.OptionString.split(",");
                                        var captions = df.OptionCaption.split(",");
                                        for (var j = 0; j < vals.length; j++) {
                                            if (df.Type == "Integer") {
                                                if (parseInt(vals[j]) == r.Record.Fields[i].Value)
                                                    item[r.Record.Fields[i].Name] = captions[j];
                                            } else {
                                                if (vals[j] == r.Record.Fields[i].Value)
                                                    item[r.Record.Fields[i].Name] = captions[j];
                                            }
                                        }
                                    }
                                }
                            }
							
							//Display and value cols.
							if(r.Record.Fields[i].Name == field.LookupField){ 
								item.ValueCol = r.Record.Fields[i].Value;
								if(field.LookupDisplayField == "")
									item.DisplayCol = r.Record.Fields[i].Value;
							}
							if(r.Record.Fields[i].Name == field.LookupDisplayField)
								item.DisplayCol = r.Record.Fields[i].Value;    
                        }
                    }
                    if (add)
                        result.push(item);
                } while (r.Next());

            if (field.LookupCategoryField != "")
                result.sort(function (a, b) {
                    if (a.BoldField == b.BoldField)
                        return 0;
                    if (a.BoldField > b.BoldField) {
                        return 1;
                    } else {
                        return -1;
                    }
                });

            //Add blank row.            
            var insblank = (term == "" && !field.Mandatory);
            if(insblank){
                var blankrow = new Object();
                blankrow.BlankRow = true;
                blankrow[field.LookupField] = '';
                blankrow[field.LookupCategoryField] = '';
                blankrow[field.LookupDisplayField] = '';
                blankrow.DisplayCol = '';
				blankrow.ValueCol = '';
                for (var i = 0; i < cols.length; i++) {                
                    blankrow[cols[i]] = '';
                }
                result.splice(0,0,blankrow);            
            }

            var newpage = Application.OptionValue(field.Options,"addnewpage");
            if(newpage !== null){
                var newpagerow = new Object();
                newpagerow.NewRecordRow = true;
                newpagerow[field.LookupField] = '';
                newpagerow[field.LookupCategoryField] = '';
                newpagerow[field.LookupDisplayField] = '';
                newpagerow.DisplayCol = '';
                newpagerow.ValueCol = '';
                for (var i = 0; i < cols.length; i++) {     
                    if(i===0){
                        newpagerow[cols[i]] = '<span style="color: blue">&lt;Add New&gt;</span>';
                    }else{        
                        newpagerow[cols[i]] = '';
                    }
                }                
                result.splice((insblank ? 1 : 0),0,newpagerow);
            }

			if(viewer.AddFilterData){
				var name = field.Name;
				if(field.MapTo)
					name = field.MapTo;
				viewer.AddFilterData(name,result);
			}
			
            response(result, value, "DisplayCol");

            return result;
        }

    );
};

//#42 - Created new check function
Application.HasFilterChar = function(filter){
    return !(filter.indexOf("*") == -1 && filter.indexOf("=") == -1 && filter.indexOf("..") == -1 && filter.indexOf("|") == -1
    	&& filter.indexOf("<") == -1 && filter.indexOf(">") == -1 && filter != 'null');
};

Application.GetOptionFilter = function(filter, captions){
	var ret = "";
	if(filter.indexOf("|")){
		var filters = filter.split("|");
		for(var i = 0; i < filters.length; i++){
			if(ret==""){
				ret = captions.split(",")[filters[i]];
			}else{
				ret += "|"+captions.split(",")[filters[i]];
			}
		}
	}else if(filter.indexOf("&")){
		var filters = filter.split("|");
		for(var i = 0; i < filters.length; i++){
			if(ret==""){
				ret = captions.split(",")[filters[i]];
			}else{
				ret += "&"+captions.split(",")[filters[i]];
			}
		}
	}else{
		ret = captions.split(",")[filter];
	}	
	return ret;
};

Application.SetOptionFilter = function(filter, captions){
	var ret = "";
	if(filter.indexOf("|")){
		var filters = filter.split("|");
		for(var i = 0; i < filters.length; i++){
			if(ret==""){
				ret = captions.split(",").indexOf(filters[i]);
			}else{
				ret += "|"+captions.split(",").indexOf(filters[i]);
			}
		}
	}else if(filter.indexOf("&")){
		var filters = filter.split("|");
		for(var i = 0; i < filters.length; i++){
			if(ret==""){
				ret = captions.split(",").indexOf(filters[i]);
			}else{
				ret += "&"+captions.split(",").indexOf(filters[i]);
			}
		}
	}else{
		ret = captions.split(",").indexOf(filter);
	}	
	return ret;
};

Application.GenerateView = function(filters){
	var f = "";
    for (var i in filters) {
        if(f.length == 0){
            f += i + "=CONST("+filters[i]+")";
        }else{
            f += ", "+ i + "=CONST("+filters[i]+")";
        }
    }
    if(f.length > 0)
        f = "WHERE ("+f+")";
	return f;
};

//#endregion

//#region Global Functions

OPENPAGE = function (id, filters, options, parent, singleThread, sorting){    
    if(ThisWindow())
        parent = Default(parent,ThisWindow().ID());
    var f = "";
    for (var i in filters) {
        if(f.length == 0){
            f += i + "=CONST("+filters[i]+")";
        }else{
            f += ", "+ i + "=CONST("+filters[i]+")";
        }
    }
    if(f.length > 0)
        f = "WHERE ("+f+")";
	if(sorting)
		f = sorting + f;
    Application.App.LoadPage(id,f,options,parent,singleThread);
};
CONTROL = function(name_){
    if(ThisViewer())
        return ThisViewer().Control(name_);
    return null;
};
PARENTPAGE = function(){
    if(ThisViewer())
        return ThisViewer().ParentPage();    
    return null;
};
CLOSEPAGE = function(){
    if(ThisViewer())
        Application.RunNext(ThisViewer().Close);
};
REFRESH = function () {
    $codeinsert(
        function () {
            $flag;
            if(ThisViewer())
                return ThisViewer().Update();        
        }
    );    
};
PREVWINDOW = function(){
    if ($moduleloaded("WindowManager")) 
        return UI.WindowManager.PreviousWindow();
};
NEXTWINDOW = function(){
    if ($moduleloaded("WindowManager")) 
        return UI.WindowManager.NextWindow();
};

RECORD = function (id, callback) {
    $codeinsert(
        function () {
            $flag;
            return new Record(id);
        },        
		function (r) {
            $flag;
            return r.New();
        }, 
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};
FINDSET = function (id, filters, callback, lookupfields, calculatedfields) {
    $codeinsert(
        function () {
            $flag;
            return new Record(id);
		},
		function(r){
			$flag;
            if(filters){
                if (typeof filters === 'string') {
                    r.View = filters;
                }else{
                    for (var i in filters) {
                        r.Filter(i, filters[i]);
                    }
                }
            }
            if(lookupfields){
                for (var i = 0; i < lookupfields.length; i++) {
                    r.AddLookupField(lookupfields[i]);
                }
            }
			if(calculatedfields){
                for (var i = 0; i < calculatedfields.length; i++) {
                    r.CalculateField(calculatedfields[i]);
                }				
            }
            return r.FindFirst();
        },
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};
COUNT = function (id, filters, callback) {
    $codeinsert(
        function () {
            $flag;
            return new Record(id);
        },
		function(r){
		    $flag;
		    if(filters){
		        if (typeof filters === 'string') {
		            r.View = filters;
		        }else{
		            for (var i in filters) {
		                r.Filter(i, filters[i]);
		            }
		        }
		    }
		    return r.CountRecords();
		},
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};
GET = function (recid, callback) {
    var recinfo = recid.split(": ");
    $codeinsert(
        function () {
            $flag;
            return new Record(recinfo[0]);
        },
        function (r) {
            $flag;                        
            return r.Get(recinfo[1].split(","));
        },
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};
INSERT = function (id, values, callback, trigger, ignoreExisting, viewer) {
    $codeinsert(
        function () {
            $flag;
            return new Record(id);
        },
		function (r) {
            $flag;
            return r.New();
        }, 
        function(r){
            $flag;
            for (var i in values) {
                r[i] = values[i];
            }
            r.SaveCurrent();
            trigger = Default(trigger,true);
            return r.Insert(trigger, ignoreExisting, viewer);
        },
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};

//Issue #46 Error when using validate function.
VALIDATE = function (r, field, value, viewer) {
    $codeinsert(
        function () {
            $flag;
            return r.Validate(field, value, viewer);
        },
        function(rec){
            r = rec;
        }
    );    
};
MODIFY = function (r, field, value, callback, trigger, skipValidate, viewer) {
    $codeinsert(
        function () {
            $flag;
            if(field){
				if(!skipValidate){
					return r.Validate(field,value, viewer);
				}else{
					r[field] = value;
				}
			}
            return r;
        },
        function(r){
            $flag;
            trigger = Default(trigger,true);
            return r.Modify(trigger, viewer);
        },
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};
MODIFYALL = function (r, col_, value_, callback) {
    $codeinsert(        
        function(){
            $flag;
            return r.ModifyAll(col_, value_);
        },
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};
DELETE = function (r, callback, trigger, viewer) {
    $codeinsert(        
        function(){
            $flag;
            trigger = Default(trigger,true);
            return r.Delete(true, viewer);
        },
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};
DELETEALL = function (r, callback) {
    $codeinsert(        
        function(){
            $flag;
            return r.DeleteAll(true);
        },
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};
RESET = function (r, callback) {
    $codeinsert(        
        function(){
            $flag;
            return r.Reset();
        },
        function (r) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(r);
                    }
                );
        }
    );    
};

CODEMODULE = function (id, callback) {
    $codeinsert(
        function () {
            $flag;
            return new CodeModule(id);
        },
        function (c) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(c);
                    }
                );
        }
    );    
};

TABLE = function (id, callback) {
    $codeinsert(
        function () {
            $flag;
            return new Table(id);
        },
        function (t) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(t);
                    }
                );
        }
    );    
};

BEGINTRANSACTION = function (callback) {
    $codeinsert(
        function () {
            $flag;
            return Application.BeginTransaction();
        },
        function (c) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(c);
                    }
                );
        }
    );    
};

COMMITTRANSACTION = function (callback) {
    $codeinsert(
        function () {
            $flag;
            return Application.CommitTransaction();
        },
        function (c) {
            $flag;
            if(callback)
                return $codeblock(
                    function(){
                        return callback(c);
                    }
                );
        }
    );    
};
//#endregion

Define("Collection", null, function () {

    //#region Members

    var _self = this;
	var m_items = {};
	
    //#endregion

    //#region Public Methods

    this.Constructor = function () {		
    };

    this.Item = function (key_) {
		return Default(m_items[key_],null);
    };
	
	this.Remove = function (key_){
		m_items[key_] = null;
	};
	
	this.Add = function (key_, value_){		
		m_items[key_] = value_;		
	};

    //#endregion    

    return this.Constructor();

});
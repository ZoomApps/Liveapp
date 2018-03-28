
/**
 * Application module. Contains various utility methods.
 * @module Application
 * @description
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * **CONTENTS**
 * - [Description](#description)
 * - [Logging](#logging)
 * - [Events](#events)
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Description
 * 
 * The Application module is loaded by default when an application is started. 
 * 
 * This module contains several essential utilty functions and properties.
 * 
 * <div style='background: #f9f2f4; padding: 5px'>**NOTE: Methods that return a `JQueryPromise` should be returned into a `$codeblock`**</div>
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Logging
 * 
 * Several functions exist for writing messages and events to the debugger console.
 * 
 * Popular functions include: 
 * 
 * {@link module:Application.Application.LogInfo Application.LogInfo},
 * {@link module:Application.Application.LogDebug Application.LogDebug}, 
 * {@link module:Application.Application.LogError Application.LogError}
 * 
 * <div style='background: #f9f2f4; padding: 5px'>**NOTE: `Application.LogDebug` will only write messages if `Application.debugMode` is set to true:**</div>
 * 
 * ```
 * Application.debugMode = true;
 * ```
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Events
 * 
 * Application events can be defined and fired with the following functions:
 * 
 * {@link module:Application.Application.On Application.On},
 * {@link module:Application.Application.Fire Application.Fire}, 
 * {@link module:Application.Application.FireWait Application.FireWait}
 * 
 * Events can be handled for custom events or built-in events. A full list of built-in events can be found 
 * in the documentation for `Application.On`.
 * 
 */

//Application Namespace.
if (typeof Application == 'undefined')
    var Application = new Object();

/**
 * Default a value if `null` or `undefined`.
 * @global
 * @param {*} value_ Value to check.
 * @param {*} default_ Value to return if `value_` is `null` or `undefined`.
 * @returns {*} Value returned.
 * @example
 * var str = Default(null, 'Value');
 * // str = 'Value'
 */
function Default(value_, default_) {
    if (value_ == null)
        return default_;
    return typeof (value_) != 'undefined' ? value_ : default_;
};

/**
 * Extends an object with another object.
 * @global
 * @param {*} obj The object to extend.
 * @param {*} objExt The object to extend with.
 * @returns {*} Etended object returned.
 * @example
 * var obj = { foo: 'Value' };
 * var obj2 = { bar: 'Value2' };
 * obj = Extend(obj, obj2);
 * // obj.bar = 'Value2'
 */
function Extend(obj, objExt){

    obj = Default(obj, new Object());
    for(var i in objExt){
        obj[i] = Default(obj[i],objExt[i]);
    }
    return obj;
};

/** 
 * Name of the application.
 * @memberof module:Application
 * @type {string}
 * @example 
 * 'Liveapp'
 */
Application.name = "%APPNAME%";

/** 
 * Version of the application.
 * @memberof module:Application
 * @type {string}
 * @example
 * '5.4.0'
 */
Application.version = "%VERSION%";

/** 
 * Application copyright information.
 * @memberof module:Application
 * @type {string}
 * @example
 * 'Copyright (c) Zoom Apps 2018'
 */
Application.copyright = "%COPYRIGHT%";

/** 
 * URL of the application.
 * @memberof module:Application
 * @type {string}
 * @example
 * 'https://dev.liveapp.com.au/'
 */
Application.url = "%SERVERADDRESS%";

/**
 * @description
 * All objects should use this or inherit this.
 * 
 * Example:
 * ```javascript
 * var obj = new AppObject('Foo');
 * console.write(obj.ObjectType());
 * // Output: Foo
 * ```
 * @class AppObject
 * @global
 * @param {string} type_ Describes type of object.
 * @returns {AppObject} Returns a new `AppObject`.
 */
AppObject = function (type_) {

    //Members
    var m_type = null;    

    //Methods        
    this.Constructor = function (type_) {                
        m_type = type_;
    };

    //Properties   
    /**
     * Get the object type.
     * @memberof! AppObject#
     * @returns {string} Returns the object type.
     */     
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

/**
 * Stores functions ready to fire for the {@link setZeroTimeout} function.
 * @memberof module:Application
 * @type {Function[]}
 * @protected
 */
Application.timeouts = [];

(function () {

    var messageName = "ztm";

    /**
     * Delays code execution by 0 seconds (runs quicker than setTimeout).
     * @global
     * @param {Function} fn Function to run after 0 seconds.
     * @returns {void}
     */
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

/**
 * @deprecated Since v5.0.0
 * @global
 */
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

  Application.LogWarn('memoize has been deprecated since v5.0.0');
  return memoized;        
}

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



/**
 * Stores classes created with the {@link Define Define} function.
 * @memberof module:Application
 * @type {Object}
 * @protected
 */
Application.coreFunctions = new Object();

/** 
 * Define a new javascript class.
 * @global
 * @param {string} name Name of the class to be created.
 * @param {Function} [base] Inherit from another class.
 * @param {Function} def Definition of the class to be created.
 * @returns {Function} The class that was created.
 * @example
 * // Foo class.
 * Define('Foo', 
 *  null, // No inheritance.
 *  function() { // Class definition.
 *      this.bar = function() {
 *          return 'Value'
 *      }
 *  });
 * 
 * var obj = new Foo();
 * // obj.bar() = 'Value'
 */
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

/**
 * Returns the base class.
 * @global
 * @param {string} name The name of the class.
 * @returns {Function} Returns the inhereted class.
 * @example
 * // Foo class.
 * Define('Foo', 
 *  null, // No inheritance.
 *  function() { // Class definition.
 *      this.val = function() {
 *          return 'Value'
 *      }
 *  });
 * 
 * //Bar class.
 * Define('Bar', 
 *  function(){ // Inhert Foo class.   
 *      return new Foo();
 *  },
 *  function(){ // Class definition.
 *      this.baseval = function(){
 *          // Get the base class of Bar (which is Foo).
 *          var base = Base('Bar');
 *          return base.val()+' from Foo';
 *      }
 *  });
 * 
 * var obj = new Bar();
 * // obj.val = 'Value'
 * // obj.baseval = 'Value from Foo'
 */
Base = function (name) {
    return Application.coreFunctions[name].prototype
};

Application.Objects = new Object();

/**
 * Return a new array object.
 * @memberof module:Application
 * @returns {Array} Returns an array object.
 */
Application.Objects.ArrayList = function () {
    return [];
};

/**
 * AuthInfo object. Contains session information.
 * @typedef AuthInfo
 * @global
 * @property {string} Username Username.
 * @property {string} Password Password.
 * @property {string} SessionID Current session ID. Will be blank if a session is not active.
 * @property {boolean} Remember If `true` will save a login cookie.
 * @property {number} Type Login type. Uses values from {@link module:Application.Application.authType Application.authType}.
 * @property {string} LoginTime Time of login.
 * @property {string} Instance Application instance to connect to.
 * @property {string} Role Current user role.
 * @property {string} UserData User session data stored as a JSON string.
 * @property {string} Layout User layout data stored as a JSON string.
 * @property {string} OfflineAuth Offline authentication string.
 * @property {string} AppSecret Application auth secret (used instead of `Username` and `Password`).
 */

/**  
 * Return a new `AuthInfo` object. 
 * @memberof module:Application
 * @returns {AuthInfo} Returns an `AuthInfo` object.
 */
Application.Objects.AuthInfo = function () {
    return {"Username":"","Password":"","SessionID":"","Remember":false,"Type":0,"LoginTime":"","Instance":"","Role":"","UserData":"","Layout":"","OfflineAuth":"","AppSecret":""};
};

/**
 * RecordSetInfo object. Contains data for one or more records.
 * @typedef RecordSetInfo
 * @global
 * @property {string} Table Name of the database table.
 * @property {string} View Table view for the current record set.
 * @property {RecordInfo} Record Data for the record at the current position.
 * @property {RecordInfo} xRecord Pre-modified data for the record at the current position.
 * @property {boolean} Blank `true` if the record is blank.
 * @property {number} Count Number of records in the current set.
 * @property {boolean} Temp `true` if the current set is temporary.
 * @property {string[]} Functions Array of table functions.
 * @property {string[]} CalculatedFields Array of fields to be calculated.
 * @property {string[]} GroupFilters Array of filter group filters.
 */

/**
 * Return a new `RecordSetInfo` object.
 * @memberof module:Application
 * @return {RecordSetInfo} Returns a `RecordSetInfo` object.
 */
Application.Objects.RecordSetInfo = function () {
    return {"Table":"","View":"","Position":0,"Record":{"NewRecord":true,"Fields":[],"UnAssigned":false},"xRecord":{"NewRecord":true,"Fields":[],"UnAssigned":false},"Blank":true,"Count":0,"Temp":false,"Functions":[],"CalculatedFields":[],"GroupFilters":[]};
};

/**
 * RecordInfo object. Contains data for a single record.
 * @typedef RecordInfo
 * @global
 * @property {boolean} NewRecord `true` if the record is new.
 * @property {RecordFieldInfo[]} Fields Array of record fields.
 * @property {boolean} UnAssigned `true` if the record is unassigned.
 */

 /**
 * Return a new `RecordInfo` object.
 * @memberof module:Application
 * @return {RecordInfo} Returns a `RecordInfo` object.
 */
Application.Objects.RecordInfo = function () {
    return {"NewRecord":true,"Fields":[],"UnAssigned":false};
};

/**
 * RecordFieldInfo object. Contains record field information.
 * @typedef RecordFieldInfo
 * @global
 * @property {string} Name Field name.
 * @property {string} Caption Field caption.
 * @property {Object} Value Field value.
 * @property {string} Type Field type.
 */

 /**
 * Return a new `RecordFieldInfo` object.
 * @memberof module:Application
 * @return {RecordFieldInfo} Returns a `RecordFieldInfo` object.
 */
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

/**
 * LicenseInfo object. Contains license information.
 * @typedef LicenseInfo
 * @global
 * @property {string} No License number.
 * @property {string} LicenseDate License creation date.
 * @property {string} Program Program licensed.
 * @property {string} ProgramVersion Program version.
 * @property {string} ClientName Client name.
 * @property {string} ResellName License partner name.
 * @property {string} AuthCode License auth code.
 * @property {string} Address1 License address information.
 * @property {string} Address2 License address information.
 * @property {string} Address3 License address information.
 * @property {string} Address4 License address information.
 * @property {string} Address5 License address information.
 * @property {string} Address6 License address information.
 * @property {string} Address7 License address information.
 * @property {string} Address8 License address information.
 * @property {string} Password License password.
 * @property {string} UserCount Maximum user sessions allowed.
 * @property {string[]} AvailableParts License parts.
 */

 /**
 * Return a new `LicenseInfo` object.
 * @memberof module:Application
 * @return {LicenseInfo} Returns a `LicenseInfo` object.
 */
Application.Objects.LicenseInfo = function () {
    return {"No":"","LicenseDate":"","Program":"","ProgramVersion":"","ClientName":"","ResellName":"","AuthCode":"","Address1":"","Address2":"","Address3":"","Address4":"","Address5":"","Address6":"","Address7":"","Address8":"","Developer":"","Password":"","UserCount":"","AvailableParts":{"AvailableParts":null}};
};

/**
 * ApplicationFileInfo object. Contains data for a file.
 * @typedef ApplicationFileInfo
 * @global
 * @property {string} Name File name.
 * @property {number} Length File length (in bytes).
 * @property {date} Expires File expiry time.
 * @property {string} MimeType Mime type of the file.
 */

/**
 * Browser window type enum.
 * @enum {number}
 * @memberof module:Application
 */
Application.windowType = {
    Normal: 1,
    Frame: 2,
    Mobile: 4
};

/**
 * Window position enum.
 * @enum {number}
 * @memberof module:Application
 */
Application.position = {
    normal: 0,
    right: 1,
    block: 2,
    rolehalf: 3,    
    rolequarter: 4,
    rolefull: 5
};

/**
 * Authentication type enum.
 * @enum {number}
 * @memberof module:Application 
 */
Application.authType = {
    Login: 1,
    Cookie: 2,
    Token: 3
};

/**
 * Built-in app pages enum.
 * @enum {number}
 * @memberof module:Application 
 */
Application.pages = {
    ErrorBrowser: 8911
};

/**
 * Remote status enum.
 * @enum {number}
 * @memberof module:Application 
 */
Application.remoteStatus = {
    Disconnected: 1,
    Connecting: 2,
    Connected: 3
};

/** 
 * Supress the next application error.
 * @memberof module:Application
 * @type {boolean}
 * @default false
 * @example
 * Application.supressError = true;
 * Application.Error('This is an error'); // Will not throw or display this error.
 */
Application.supressError = false;

/** 
 * Supress all web service errors.
 * @memberof module:Application
 * @type {boolean}
 * @default false
 */
Application.supressServiceErrors = false;

/** 
 * `true` if user interfaces should not be shown.
 * @memberof module:Application
 * @type {boolean}
 * @default false
 */
Application.noGUI = false;

/** 
 * Stores the current session information for the application.
 * @memberof module:Application
 * @type {AuthInfo}
 * @example
 * // Set the username and password.
 * Application.auth.Username = 'test.user';
 * Application.auth.Password = 'Password123';
 */
Application.auth = Application.Objects.AuthInfo();

/** 
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.scripts = Array();

/** 
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.executionPath = "%SERVERADDRESS%";

/** 
 * Stores application events.
 * @protected
 * @memberof module:Application
 * @type {Object}
 */
Application.event = {};

/** 
 * The maximum amount of records that can be rendered at once.
 * @memberof module:Application
 * @type {number}
 * @default 10000
 */
Application.maxRecords = 10000; 

/** 
 * `true` if the application is connected to the server.
 * @protected
 * @memberof module:Application
 * @type {boolean}
 */
Application.connected = false;

/** 
 * `true` if the application is in debug mode (extra logging).
 * @memberof module:Application
 * @type {boolean}
 * @default false
 */
Application.debugMode = false;

/** 
 * `true` if the application is in developer mode (disables caching).
 * @memberof module:Application
 * @type {boolean}
 * @default false
 */
Application.developerMode = false;

/** 
 * Stores the server's timezone offset.
 * @memberof module:Application
 * @type {number}
 */
Application.timezone = parseInt("%TZOFFSET%");  

/** 
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.testMode = false;

/** 
 * Stores the number of times {@link module:Application.Application.BeginTransaction Application.BeginTransaction} is called.
 * @protected
 * @memberof module:Application
 * @type {number}
 */
Application.transactionStarted = 0;

/**
 * `true` if the application is in restricted mode (certain features are disabled, ie: Main Menu)
 * @memberof module:Application
 * @type {boolean}
 * @default false
 */
Application.restrictedMode = false;

/** 
 * Stores the browser window type. Uses values from {@link module:Application.Application.windowType Application.windowType}.
 * @protected
 * @memberof module:Application
 * @type {number}
 * @default Application.windowType.Normal
 */
Application.type = Application.windowType.Normal;

/**
 * Stores the current user license.
 * @protected
 * @memberof module:Application
 * @type {LicenseInfo}
 */
Application.license = null;

/**
 * Stores client side tables.
 * @memberof module:Application
 * @type {Object}
 */
Application.Virtual = new Object(); //#35 Virtual Tables 

/**
 * Contains the last web service call (incase of network dropout).
 * @protected
 * @memberof module:Application
 * @type {Object}
 */
Application.lastExecute = {};

/**
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.cacheValues = ['uncached','idle','checking','downloading','updateready','obsolete'];

//Global functions.
/**
 * Returns the current page viewer
 * @global
 * @returns {PageViewer} The current page viewer
 */
ThisViewer = function () { 
 if (ThisWindow()) 
    if(ThisWindow().LineEditor && ThisWindow().LineEditor() != null){
        return ThisWindow().LineEditor().pv;
    }else{
        return ThisWindow();
    }
};
/**
 * Returns the current page definition
 * @global
 * @returns {Page} The current page definition
 */
ThisPage = function () { 
    if (ThisWindow()) 
        return ThisViewer().Page() 
};
/**
 * Returns the current window
 * @global
 * @returns {Window} The current window
 */
ThisWindow = function () { 
    if ($moduleloaded("WindowManager")) 
        return UI.WindowManager.SelectedWindow(); 
};

/**
 * Function called on application error.
 * @memberof module:Application
 * @type {function(string)}
 * @default null
 * @example
 * Application.OnError = function(msg){
 *   alert(msg); // Alert the error message.
 * };
 */
Application.OnError = null;

/**
 * Function called when a message box needs to be displayed.
 * @memberof module:Application
 * @type {function(string)}
 * @default null
 * @example
 * Application.MessageBox = function(msg){
 *   alert(msg); // Alert the message.
 * };
 */
Application.MessageBox = null;

/**
 * Function called when a confirmation box needs to be displayed.
 * @memberof module:Application
 * @type {function(string)}
 * @default null
 * @example
 * Application.ConfirmBox = function(msg){
 *   return confirm(msg);
 * };
 */
Application.ConfirmBox = null;

/**
 * Function called when a progress box needs to be displayed.
 * @memberof module:Application
 * @type {function(boolean,string,string,number,number)}
 * @default null
 * @example
 * Application.ProgressBox = function(show, msg, title, i, num){
 * };
 */
Application.ProgressBox = null;

/**
 * Indicates if the application is in offline mode.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if in offline mode.
 */
Application.IsOffline = function () {
    if ($moduleloaded("OfflineManager"))
        return Application.Offline.IsOffline();
    return false;
};
/**
 * Indicates if an object has been saved in offline mode.
 * @memberof module:Application
 * @param {string} type Type of object.
 * @param {string} id ID of the object.
 * @returns {boolean} Returns `true` if the object is avaliable offline.
 */
Application.CheckOfflineObject = function(type, id){
	if($moduleloaded("OfflineManager"))
		return Application.Offline.CheckOfflineObject(type, id);
	return true;
};

/**
 * Logs a message to the console.
 * @memberof module:Application
 * @param {string} msg Message to log.
 * @returns {void}
 */
Application.LogInfo = function (msg) {
    if ($moduleloaded("Logging"))
        Application.Log.Info(msg);
};
/**
 * Logs an error message to the console.
 * @memberof module:Application
 * @param {string} msg Message to log.
 * @returns {void}
 */
Application.LogError = function (msg) {
    if ($moduleloaded("Logging"))
        Application.Log.Error(msg);
};
/**
 * Logs a debug message to the console. 
 * **NOTE: The message will only be logged if {@link module:Application.Application.debugMode Application.debugMode} is `true`.**
 * @memberof module:Application
 * @param {string} msg Message to log.
 * @returns {void}
 */
Application.LogDebug = function (msg) {
    if ($moduleloaded("Logging"))
        Application.Log.Debug(msg);
};
/**
 * Logs a warning message to the console.
 * @memberof module:Application
 * @param {string} msg Message to log.
 * @returns {void}
 */
Application.LogWarn = function (msg) {
    if ($moduleloaded("Logging"))
        Application.Log.Warn(msg);
};

/**
 * Add a new event handler. Custom events can be handled or any of the following **Built-in Events**:
 * 
 * Event Name | Arguments | Use FireWait |
 * ---------- | --------- | ----------------- |
 * Authorized | | 
 * CodeBlockFire | {string} code |  
 * Connected | | 
 * ConnectionLost | | 
 * ControlInit | {JQuery} control | 
 * CreateMenu | {Object} mnu | 
 * ExecutedWebService | {string} method, {boolean} errored | 
 * Exit | | 
 * Error | {string} msg | 
 * GetProfileImageURL | {string} user | 
 * Load | {Object} params | Yes
 * Login | |
 * Logout | | 
 * MenuLoaded | | 
 * ModalClose | | 
 * OpenPage | | 
 * PageFetch | {Page} page | Yes
 * PageLoad | {PageViewer} viewer | 
 * ProcessCaption | | 
 * RecordModification | {Object} params | 
 * ShowLogin | | 
 * SumColumn | {string} column, {Record} record | 
 * ThreadCreated | | 
 * ThreadFinished | | 
 * 
 * @memberof module:Application
 * @param {string} name The name of the event.
 * @param {Function} handler The function that is run when the event is fired.
 * @returns {void}
 * @example
 * Application.On('test-event',function(){
 *  Application.Message('test event fired');
 * });
 */
Application.On = function (name, handler) {
    if (Application.event[name] == null)
        Application.event[name] = [];
    Application.event[name].push(handler);
};

/**
 * Fires an event and wait for a response.
 * @memberof module:Application
 * @param {string} name The name of the event to fire.
 * @param {...*} [args] The arguments to pass into the event.
 * @returns {JQueryPromise(*)} Promises to return after the event is fired.
 * @example
 * Application.On('test-event',function(num){
 *  return num + 2;
 * })
 * return $codeblock(
 *  function(){
 *      return Application.FireWait('test-event',1);
 *  },
 *  function(ret){
 *      // ret = 3
 *  }
 * );
 */
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

/**
 * Fires an event.
 * @memberof module:Application
 * @param {string} name The name of the event firing.
 * @param {...*} [args] The arguments to pass into the event.
 * @returns {void|*} Returns from the event if 1 event exists for `name`. If multiple events exist, nothing is returned.
 */
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

/**
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.GenerateWebService = function (method, args){
        
    var url = "%SERVERADDRESS%q/?m=" + method;
    var ret = new Object();
	ret.url = url;
    ret.data = args;
    Application.LogWarn('Application.GenerateWebService has been deprecated since v5.0.0');
	return ret;        
};

/**
 * Calls the webservice.
 * 
 * **NOTE: All calls to the webservice require an `auth` argument. This allows the webservice to use the correct user session.**
 * @memberof module:Application
 * @param {string} method The method to call on the web service.
 * @param {Object} args The arguments to pass to the web service.
 * @param {function(*)} [callback_=null] The function to call after the service executes. The web servoce return value is passed into this function.
 * @param {boolean} [async_=true] Exectutes the service in async mode when `true`.
 * @param {Function} [progress_=null] Called when progress is made by the service.
 * @param {boolean} [ignoreConnection_] Not used.
 * @param {Object} [overrideCallbacks_=null] Override the callback function.
 * @param {number} [timeout_=null] The time before the service call times out.
 * @returns {void}
 * @example
 * Application.ExecuteWebService("GetMessage", { auth: Application.auth }, function (r) {
 *  if (r)
 *      Application.LogInfo("Server Message: "+r);
 * });
 */
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

/**
 * Calls the web service and waits for a response.
 * 
 * **NOTE: All calls to the webservice require an `auth` argument. This allows the webservice to use the correct user session.**
 * @memberof module:Application
 * @param {string} func The method to call on the web service.
 * @param {Object} params The arguments to pass to the web service.
 * @param {boolean} [async_=true] Exectutes the service in async mode when `true`.
 * @param {Function} [progress_=null] Called when progress is made by the service.
 * @param {boolean} [ignoreConnection_] Not used.
 * @returns {JQueryPromise(*)} Promises to return after the service is called. The web service return value is returned.
 * @example
 * return $codeblock(
 *  function () {
 *      return Application.WebServiceWait("MergeObjects", { auth: Application.auth, name_: file.Name });
 *  },
 *  function (name) {
 *      window.open('./File/' + name);
 *  }
 * );
 */
Application.WebServiceWait = function (func, params, async_, progress_, ignoreConnection_) {

    var w = $wait();

    Application.ExecuteWebService(func, params, function (r) {        
        w.resolve(r);
    }, async_, progress_, ignoreConnection_);

    return w.promise();

};

/**
 * Log into the application using details from {@link module:Application.Application.auth Application.auth}.
 * @memberof module:Application
 * @returns {JQueryPromise(AuthInfo)} Promises to return after authentication. Returns {@link AuthInfo} with current session information.
 * @example
 * Application.auth.Username = 'test.user';
 * Application.auth.Password = 'Password123';
 * Application.auth.Instance = 'Test';
 * return $codeblock(
 *  function(){
 *      return Application.Authorize();
 *  },
 *  function(auth){
 *      // auth contains current session info.
 *      // It is recommended to save this into Application.auth
 *      // for future web service calls.
 *      Application.auth = auth;
 *  }
 * );
 */
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

/**
 * Checks if there is a login cookie.
 * @memberof module:Application
 * @param {string} instance_ The instance to check.
 * @returns {JQueryPromise(boolean)} Promises to return after the login cookie is checked. Returns `true` if a login cookie exists.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.LoginCookieExists('Test');
 *  },
 *  function(ret){
 *      // ret = true if a login cookie exists for the Test instance.
 *  }
 * );
 */
Application.LoginCookieExists = function(instance_){
    return Application.WebServiceWait("LoginCookieExists", {instance: instance_});
};

/**
 * Disconnect from the application.
 * @memberof module:Application
 * @param {boolean} [async_=false] If `true` uses async mode.
 * @param {boolean} [clearcookie_=false] If `true` clears login cookie.
 * @returns {JQueryPromise(void)} Promises to return after disconnecting from the app.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.Disconnect();
 *  },
 *  function(){
 *      // We are now disconnected.
 *  }
 * );
 */
Application.Disconnect = function (async_, clearcookie_) {
    Application.connected = false;    
    async_ = Default(async_, false);
    clearcookie_ = Default(clearcookie_, false);
    return Application.WebServiceWait("Disconnect", { auth: Application.auth, clearcookie_: clearcookie_}, async_, null, true);
};

/**
 * Load the main menu.
 * @memberof module:Application
 * @returns {JQueryPromise(Object[])} Promises to return after the main menu is fetched. Returns an array of menu objects.
 */
Application.LoadMainMenu = function () {
    return Application.WebServiceWait("LoadMainMenu", { auth: Application.auth });
};

/**
 * Gets the user license.
 * @memberof module:Application
 * @returns {JQueryPromise(LicenseInfo)} Promises to return after getting the user licence. Returns the user license as {@link LicenseInfo}.
 */
Application.GetUserLicense = function () {
    return Application.WebServiceWait("GetUserLicense", { auth: Application.auth });
};

/**
 * Clears the server object cache for a page.
 * @memberof module:Application
 * @param {string} id The page id to be cleared.
 * @returns {JQueryPromise(void)} Promises to return after cache is cleared.
 */
Application.ClearCache = function (id) {
    return Application.WebServiceWait("ClearCache", { auth: Application.auth, id_: id });
};

/**
 * Checks for platform updates.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @returns {JQueryPromise(string)} Promises to return after updates are checked. Returns the update message if a new update is available.
 */
Application.CheckUpdates = function () {    
    return Application.WebServiceWait("CheckUpdates", { auth: Application.auth });
};

/**
 * Gets the update message, even if the current platform version is the newest.
 * 
 * **NOTE: Requires SUPER user role.**
 * @returns {JQueryPromise(string)} Promises to return after updates are checked. Returns the update message.
 */
Application.CheckUpdatesSkipVersion = function () {    
    return Application.WebServiceWait("CheckUpdatesSkipVersion", { auth: Application.auth });
};

/**
 * Updates the platform.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @returns {JQueryPromise(void)} Promises to return after the platform has updated.
 */
Application.GetUpdates = function () {
    return Application.WebServiceWait("GetUpdates", { auth: Application.auth });
};

/**
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.ClearRecordCache = function () {
    Application.LogWarn('Application.ClearRecordCache has been deprecated since v5.0.0');
    return Application.WebServiceWait("ClearRecordCache", { auth: Application.auth });        
};

/**
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.SyncSecurity = function (user_) {
    //#39 Not needed in new security model.
    Application.LogWarn('Application.SyncSecurity has been deprecated since v5.0.0');
    return;
};

/**
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.AuthCode = function (instance_) {
    instance_ = Default(instance_,"");
    var w = $wait();
    Application.ExecuteWebService("AuthCode", { auth: Application.auth, instance_: instance_ }, function (r) {
        Application.Message(r, null, "Auth Code");
        w.resolve();
    });    
    Application.LogWarn('Application.AuthCode has been deprecated since v5.0.0');
    return w.promise();
};

/**
 * Saves javascript code for an object.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @param {string} type The type of the object.
 * @param {string} id ID of the object.
 * @param {string[]} code Array of javascript code to save. 
 * @returns {JQueryPromise(boolean)} Promises to return after the javascript code is saved. Returns `true` if the code saved successfully.
 */
Application.SaveSource = function (type, id, code) {
    return Application.WebServiceWait("SaveSource", { auth: Application.auth, type_: type, id_: id, code_: code });
};

/**
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.UpdateProfileImage = function (type, img) {
    Application.LogWarn('Application.UpdateProfileImage has been deprecated since v5.0.0');
    return Application.WebServiceWait("UpdateProfileImage", { auth: Application.auth, type_: type, img_: img });
};

/**
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.ExecutePlugin = function (plugin, method, args) {
    args.auth = Application.auth;
    Application.LogWarn('Application.ExecutePlugin has been deprecated since v5.0.0');
    return Application.WebServiceWait("ExecutePlugin&pluginname="+plugin+"&pluginmethod="+method, args);        
};

/**
 * Downloads an offline data pack.
 * @memberof module:Application
 * @param {Function(ApplicationFileInfo)} progress_ Called after the Data Pack has completed downloading. Passes in the datapack as an {@link ApplicationFileInfo}.
 * @returns {void}
 */
Application.DownloadDataPack = function (progress_) {
    return Application.WebServiceWait("DownloadDataPack", { auth: Application.auth }, true, progress_);
};

/**
 * Uploads an offline data pack.
 * @memberof module:Application
 * @param {string} name_ The name of the file to be uploaded.
 * @returns {JQueryPromise(string[])} Promises to return after the data pack is uploaded. Returns an array of error messages.
 */
Application.UploadDataPack = function (name_) {
    return Application.WebServiceWait("UploadDataPack", { auth: Application.auth, name_: name_ });
};

/**
 * Begin a database transaction.
 * @memberof module:Application
 * @return {JQueryPromise(void)} Promises to return after starting a database transaction.
 * @example
 * return $codeblock(
 *  Application.BeginTransaction,
 *  function(){
 *      // We can make database changes here.
 *  },
 *  Application.CommitTransaction
 * );
 */
Application.BeginTransaction = function () {
    
    if(Application.transactionStarted > 0){    
        Application.transactionStarted += 1;    
        Application.LogWarn("A transaction was already started. Ignored BeginTransaction");
        return;
    }

    var w = $wait();

    Application.ExecuteWebService("BeginTransaction", { auth: Application.auth }, function (r) {
        Application.transactionStarted += 1;      
        w.resolve(r);
    });

    return w.promise();    
};

/**
 * Commit a database transaction.
 * @memberof module:Application
 * @return {JQueryPromise(void)} Promises to return after committing the database transaction.
 * @example
 * return $codeblock(
 *  Application.BeginTransaction,
 *  function(){
 *      // We can make database changes here.
 *  },
 *  Application.CommitTransaction
 * );
 */
Application.CommitTransaction = function () {   

    if(Application.transactionStarted > 1){
        Application.transactionStarted -= 1;
        Application.LogWarn("A transaction was already started. Ignored CommitTransaction");
		return;
    }else if(Application.transactionStarted <= 0){
        Application.transactionStarted = 0;
        Application.LogWarn("A transaction has not started. Ignored CommitTransaction");
		if(Application.developerMode){
			Application.Message("Tried to commit too many transactions!");
		}
        return;
    }

    var w = $wait();

    Application.ExecuteWebService("CommitTransaction", { auth: Application.auth }, function (r) {   
        Application.transactionStarted -= 1;       		        
		w.resolve(r);
    });

    return w.promise();         
};

/**
 * Rollback a database transaction.
 * 
 * **NOTE: The current transaction is rolled back automatically if an {@link module:Application.Application.Error Application.Error} occurs.**
 * @memberof module:Application
 * @return {JQueryPromise(void)} Promises to return after rolling back the database transaction.
 * @example
 * return $codeblock(
 *  Application.BeginTransaction,
 *  function(){
 *      // We can make database changes here.
 *  },
 *  Application.RollbackTransaction
 * );
 */
Application.RollbackTransaction = function () {    
    
    if(Application.transactionStarted <= 0){
        Application.transactionStarted = 0;
        Application.LogWarn("A transaction has not started. Ignored RollbackTransaction");
		if(Application.developerMode){
			Application.Message("Tried to rollback too many transactions!");
		}
        return;
    }

    var w = $wait();

    Application.ExecuteWebService("RollbackTransaction", { auth: Application.auth }, function (r) {   
        Application.transactionStarted = 0;       		        
		w.resolve(r);
    });

    return w.promise();    
};

/**
 * Creates a file to be uploaded to the server.
 * @memberof module:Application
 * @param {string} name_ Name of the file to be uploaded.
 * @param {number} length_ Length of the file to be uploaded (in bytes).
 * @param {number} chunkSize_ The size of individual chunks to upload (in bytes).
 * @param {string} mime_ The mime type of the file to be uploaded.
 * @returns {JQueryPromise(ApplicationFileInfo)} Promises to return after a file has been created. Returns an {@link ApplicationFileInfo} object.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.CreateFileForUpload('test.txt', 2000, 200, 'text/plain');
 *  },
 *  function(file){
 *      // file.Name = 'test.txt';
 *  }
 * );
 */
Application.CreateFileForUpload = function (name_, length_, chunkSize_, mime_) {
    return Application.WebServiceWait("CreateFileForUpload", { auth: Application.auth, name_: name_, length_: length_, chunkSize_: chunkSize_, mime_: mime_ });
};

/**
 * Creates a new user.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @param {string} username_ The username of the new user.
 * @param {string} password_ The password of the new user.
 * @returns {JQueryPromise(void)} Promises to return after a new user is created.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.CreateUser('test.user','Password123');
 *  }
 * );
 */
Application.CreateUser = function (username_, password_) {
    return Application.WebServiceWait("CreateUser", { auth: Application.auth, username_: username_, password_: password_ });
};

/**
 * Unlocks a licence with a password.
 * @memberof module:Application
 * @param {string} pass_  The password to unlock licence.
 * @returns {JQueryPromise(void)} Promises to return after the licence has been unlocked.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.LicensePassword('Password123');
 *  },
 *  function(){
 *      Application.Message('License unlocked. Please refresh your browser.');
 *  }
 * );
 */
Application.LicensePassword = function (pass_) {
    return Application.WebServiceWait("LicensePassword", { auth: Application.auth, pass_: pass_ });
};

/**
 * Exports objects to xml format.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @param {string} view_ The filters to apply to the `object` table.
 * @param {boolean} src_ Exports the source of the objects when `true`.
 * @returns {JQueryPromise(string)} Promises to return after the object has been exported. Returns the file name.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.ExportObjects('WHERE(Type=CONST(TABL))',true);
 *  },
 *  function(filename){
 *      // Open/download the file.
 *      window.open(Application.url + 'File/' + filename);
 *  }
 * );
 */
Application.ExportObjects = function (view_,src_) {
    return Application.WebServiceWait("ExportObjects", { auth: Application.auth, view_: view_, src_: src_ });
};

/**
 * Exports objects in separate xml files. Files will need to be downloaded from the files list in the ADMIN menu.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @param {string} view_ The filters to apply to the `object` table.
 * @param {boolean} src_ Exports the source of the object when `true`.
 * @returns {JQueryPromise(void)} Promises to return after objects have been exported.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.ExportIndividualObjects('WHERE(Type=CONST(TABL))',true);
 *  },
 *  function(){ 
 *      Application.Message('Done. Please download from the File list');
 *  }
 * );
 */
Application.ExportIndividualObjects = function (view_,src_) {
    return Application.WebServiceWait("ExportIndividualObjects", { auth: Application.auth, view_: view_, src_: src_ });
};

/**
 * Export an object backup to xml.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @param {string} view_ The filters to apply to the `object backup` table.
 * @param {boolean} src_ Exports the source of the object when `true`.
 * @returns {JQueryPromise(string)} Promises to return after object backup has been exported. Returns the file name.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.ExportObjectBackup('WHERE(Entry No=CONST(1))',true);
 *  },
 *  function(filename){
 *      // Open/download the file.
 *      window.open(Application.url + 'File/' + filename);
 *  }
 * );
 */
Application.ExportObjectBackup = function (view_,src_) {
    return Application.WebServiceWait("ExportObjectBackup", { auth: Application.auth, view_: view_, src_: src_ });
};

/**
 * Rollback an object to a previous backup.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @param {string} view_ The filters to apply to the `object backup` table.
 * @returns {JQueryPromise(void)} Promises to return after object has been rolled back.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.RollbackObject('WHERE(Entry No=CONST(1))');
 *  }
 * );
 */
Application.RollbackObject = function (view_) {
    return Application.WebServiceWait("RollbackObject", { auth: Application.auth, view_: view_ });
};

/**
 * Generate a text file with object dependencies info.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @param {string} view_ The filters to apply to the `object` table.
 * @returns {JQueryPromise(string)} Promises to return after dependencies have been generated. Returns the file name.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.GetDependencies('WHERE(Solution=CONST(System))');
 *  },
 *  function(filename){
 *      // Open/download the file.
 *      window.open(Application.url + 'File/' + filename);
 *  }
 * );
 */
Application.GetDependencies = function (view_) {
    return Application.WebServiceWait("GetDependencies", { auth: Application.auth, view_: view_ });
};

/**
 * Resyncs the tables with the database. 
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @param {string} view_ The filters to apply to the `object` table.
 * @returns {JQueryPromise(void)} Promises to return after the tables have been resynced.
 */
Application.ResyncTables = function (view_) {
    return Application.WebServiceWait("ResyncTables", { auth: Application.auth, view_: view_ });
};

/**
 * Get an offline login cookie.
 * @memberof module:Application
 * @returns {JQueryPromise(string)} Promises to return when the offline cookie has been fetched. Returns the offline cookie content.
 */
Application.GetOfflineCookie = function(){
    return Application.WebServiceWait("GetOfflineCookie", {auth: Application.auth});
};

/**
 * Gets page layout for a user.
 * @memberof module:Application
 * @param {string} username_ The username of the user.
 * @param {string} page_ The page id to be fetched.
 * @returns {JQueryPromise(string)} Promises to return after user layout has been fetched. Returns the layout as a JSON string.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.GetUserLayout('test.user','Test Page');
 *  },
 *  function(layoutstr){
 *      var layout = $.parseJSON(layoutstr);
 *  }
 * );
 */
Application.GetUserLayout = function (username_, page_) {
    if(Application.IsOffline())
        return "";
    return Application.WebServiceWait("GetUserLayout", { auth: Application.auth, username_: username_, page_: page_ });
};

/**
 * Saves the user page layout.
 * @memberof module:Application
 * @param {string} username_ The username of the user .
 * @param {string} page_ The page id to be saved.
 * @param {string} layout_ The layout to be saved (as a JSON string).
 * @returns {JQueryPromise(void)} Promises to return after layout has been saved.
 * @example
 * return $codeblock(
 *  function(){
 *      var layout = {filters: {id: '>1', name: '*test*'}};
 *      var layoutstr = $.toJSON(layout);
 *      return Application.SaveUserLayout('test.user','Test Page',layoutstr);
 *  }
 * );
 */
Application.SaveUserLayout = function (username_, page_, layout_) {
    if(Application.IsOffline())
        return;
    return Application.WebServiceWait("SaveUserLayout", { auth: Application.auth, username_: username_, page_: page_, layout_: layout_ });
};

/**
 * Deletes a page layout.
 * @memberof module:Application
 * @param {string} username_ The username of the user.
 * @param {string} page_ The page id to be deleted.
 * @returns {JQueryPromise(void)} Promises to return after user layout has been deleted.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.DeleteUserLayout('test.user','Test Page');
 *  }
 * );
 */
Application.DeleteUserLayout = function (username_, page_) {
    if(Application.IsOffline())
        return;
    return Application.WebServiceWait("DeleteUserLayout", { auth: Application.auth, username_: username_, page_: page_ });
};

/**
 * Checks if a user can select a record for an object.
 * @memberof module:Application
 * @param {string} type_ The type of object.
 * @param {string} name_ The name of the object.
 * @returns {JQueryPromise(boolean)} Promises to return after the user access has been checked. Returns `true` if the access is granted.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.CanSelect('PAGE','Test Page');
 *  },
 *  function(ret){
 *      // ret = true if access is allowed.
 *  }
 * );
 */
Application.CanSelect = function (type_, name_) {
    return Application.WebServiceWait("CanSelect", { auth: Application.auth, type_:type_, name_:name_ });
};

/**
 * Checks if a user can insert a record for an object.
 * @memberof module:Application
 * @param {string} type_ The type of object.
 * @param {string} name_ The name of the object.
 * @returns {JQueryPromise(boolean)} Promises to return after the user access has been checked. Returns `true` if the access is granted.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.CanInsert('PAGE','Test Page');
 *  },
 *  function(ret){
 *      // ret = true if access is allowed.
 *  }
 * );
 */
Application.CanInsert = function (type_, name_) {
    return Application.WebServiceWait("CanInsert", { auth: Application.auth, type_:type_, name_:name_ });
};

/**
 * Checks if a user can modify a record for an object.
 * @memberof module:Application
 * @param {string} type_ The type of object.
 * @param {string} name_ The name of the object.
 * @returns {JQueryPromise(boolean)} Promises to return after the user access has been checked. Returns `true` if the access is granted.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.CanModify('PAGE','Test Page');
 *  },
 *  function(ret){
 *      // ret = true if access is allowed.
 *  }
 * );
 */
Application.CanModify = function (type_, name_) {
    return Application.WebServiceWait("CanModify", { auth: Application.auth, type_:type_, name_:name_ });
};

/**
 * Checks if a user can delete a record for an object.
 * @memberof module:Application
 * @param {string} type_ The type of object.
 * @param {string} name_ The name of the object.
 * @returns {JQueryPromise(boolean)} Promises to return after the user access has been checked. Returns `true` if the access is granted.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.CanDelete('PAGE','Test Page');
 *  },
 *  function(ret){
 *      // ret = true if access is allowed.
 *  }
 * );
 */
Application.CanDelete = function (type_, name_) {
    return Application.WebServiceWait("CanDelete", { auth: Application.auth, type_:type_, name_:name_ });
};

/**
 * Searches the application based on the global search setup.
 * @memberof module:Application
 * @param {string} search_ The term that is being searched for.
 * @returns {JQueryPromise(object[])} Promises to return after the search is complete. Returns an array of results.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.Search('test');
 *  },
 *  function(ret){ 
 *      var dd = $('&lt;div&gt;');
 *      $('body').append(dd);
 *      $.each(ret,function(index,value){
 *          // value[0] = Result Description
 *          // value[1] = Result Page View
 *          // value[2] = Icon Image Name
 *          // value[3] = Result Page ID
 *          // value[4] = Custom OnClick Javascript Code
 *          var item = $('&lt;div&gt;').html(UI.IconImage(value[2])+' '+value[0]);
 *          dd.append(item);
 *          item.on('click',function(){
 *              if(value[4]){
 *                  eval(value[4].replace(/\&quot\;/g,'"'));
 *              }else{
 *                  Application.App.LoadPage(value[3],value[1],{searchmode:true});
 *              }
 *          });
 *      });
 *  }
 * );
 */
Application.Search = function (search_) {
	
	//Protected characters.
	if(search_ && search_.replaceall)
		search_ = search_.replaceall("(","LB;").replaceall(")","RB;");
	
    return Application.WebServiceWait("Search", { auth: Application.auth, search_:search_ });
};

/**
 * Puts the application into maintenance mode.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @param {string} msg_ The message displayed to users when application is in maintenance mode.
 * @param {date} time_ The time when the maintenance mode will begin.
 * @returns {JQueryPromise(void)} Promises to return when maintenance mode has been activated.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.StartMaintenanceMode('Application Update',new Date());
 *  }
 * );
 */
Application.StartMaintenanceMode = function (msg_, time_) {
    return Application.WebServiceWait("StartMaintenanceMode", { auth: Application.auth, msg_: msg_, time_: time_ });
};

/**
 * Deactivates maintenance mode within the application.
 * 
 * **NOTE: Requires SUPER user role.**
 * @memberof module:Application
 * @returns {JQueryPromise(void)} Promises to return when maintenance mode has been deactivated.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.EndMaintenanceMode();
 *  }
 * );
 */
Application.EndMaintenanceMode = function () {
    return Application.WebServiceWait("EndMaintenanceMode", { auth: Application.auth });
};

/**
 * Exports an entire user layout into an xml file.
 * @memberof module:Application
 * @param {string} user_ The user whose layout is being exported.
 * @returns {JQueryPromise(string)} Promises to return when user layout has been exported. Returns the file name.
 * @example
 * return $codeblock(
 *  function(){
 *      return Application.ExportUserLayout('test.user');
 *  },
 *  function(filename){
 *      // Open/download the file.
 *      window.open(Application.url + 'File/' + filename);
 *  }
 * );
 */
Application.ExportUserLayout = function(user_){
    return Application.WebServiceWait("ExportUserLayout", { auth: Application.auth, user_: user_ });
};

/**
 * Calls a batch of database functions.
 * @memberof module:Application
 * @param {Array} insert_ An array of insert functions to be run.
 * @param {Array} modify_ An array of modify functions to be run.
 * @param {Array} delete_ An array of delete functions to be run.
 * @returns {JQueryPromise(string[])} Promises to return when a batch of database functions have been called. Returns an array of error messages.
 */
Application.BatchProcess = function(insert_, modify_, delete_){
	return Application.WebServiceWait("BatchProcess", { auth: Application.auth, insert_: insert_, modify_: modify_, delete_: delete_ });
};

/**
 * Processes a caption (using the ProcessCaption event handler).
 * 
 * **NOTE: `Application.ProcessCaption` is automatically run on:**
 * * Message/Confirm/Error messages
 * * Combobox column captions
 * * Window titles
 * * Action button captions
 * * Page field captions
 * 
 * @memberof module:Application
 * @param {string} caption_ The caption to process.
 * @returns {string} The processed caption.
 * @example
 * Application.On("ProcessCaption", function(cap) {
 *  cap = cap.replace(/foo/g, 'bar');
 *  return cap;
 * });
 * var newcaption = Application.ProcessCaption('Testing foo'); 
 * // newcaption = 'Testing bar'
 */
Application.ProcessCaption = function(caption_){
	var cap = Application.Fire("ProcessCaption", caption_);
	if(cap)
		return cap;
	return caption_;
};

/**
 * Sanitizes a string (strips potential XSS code).
 * @memberof module:Application
 * @param {string} input The string to be sanitized.
 * @returns {string} Returns the sanitized string.
 * @example
 * var str = Application.SanitizeString('&lt;script&gt;alert("xss");&lt;/script&gt;');
 * // str = 'alert("xss");'
 */
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

/**
 * Creates an array and fills it with values.
 * @memberof module:Application
 * @param {number} len Length of the array to be created.
 * @param {*} value The value that fills each element in the array.
 * @returns {Array} The array that has been created.
 * @example
 * var arr = Application.CreateArray(10,'foo'); 
 */
Application.CreateArray = function(len,value){
    var obj = new Array();
    for(var i = 0; i < len; i++){
        obj.push(value);
    }
    return obj;
};
/**
 * Gets user data from the auth info.
 * @memberof module:Application
 * @returns {Object} Returns the user data as an object.
 */
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

/**
 * Saves user data into the auth info.
 * @memberof module:Application
 * @param {Object} data The user data object to save.
 * @returns {void}
 */
Application.SaveUserData = function (data) {
    Application.auth.UserData = $.toJSON(data);    
};

/**
 * Swaps the app between mobile and desktop mode.
 * @memberof module:Application
 * @param {boolean} mobile Swap into mobile mode if `true`.
 * @param {string} instance The name of the instance.
 * @returns {void}
 * @example
 * Application.SwitchMode(true,'test');
 */
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

/**
 * Loads the application modules based on the browser window type. Called automatically on appication startup.
 * @memberof module:Application
 * @param {string} windowType_ Browser window type. Should be a value from {@link module:Application.Application.windowType Application.windowType}.
 * @param {boolean} [engineonly_=false] Does not load any user interface modules if `true`.
 * @returns {void}
 * @example
 * Application.LoadModules(Application.windowType.Normal, false);
 */
Application.LoadModules = function (windowType_, engineonly_) {

    try {

        //Check if the module manager loaded.
        if (typeof Application.ModuleManager == 'undefined')
            throw "%LANG:ERR_LOADFAILED%";		         

        //Set window type.				
        Application.type = windowType_;

        var params = [];         
        Application.LoadParams(params, PAGE_PARAMETERS);
		
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

/**
 * Navigates to a built-in page.
 * @memberof module:Application
 * @param {string} id_ The id of a page.
 * @returns {void}
 */
Application.NavigateToPage = function (id_) {
    
    if(Application.IsInMobile()){
        window.location = "%SERVERADDRESS%Pages/"+id_+"?mobile=true";
    }else{
        window.location = "%SERVERADDRESS%Pages/"+id_;
    }
};

/** 
 * Stores the service worker registration object.
 * @protected
 * @memberof module:Application
 * @type {ServiceWorkerRegistration}
 */
Application.serviceWorkerReg = null;

/**
 * Registers the service worker. Called automatically on appication startup.
 * @memberof module:Application
 * @param {string} instance The name of the instance.
 * @returns {void}
 */
Application.HookCacheEvents = function(instance){

    function ShowUpdateMsg(onupdate){
        if(Application.connected){
            Application.Confirm("An updated version of the website has been downloaded. Load the new version?",function(r){
        
                if(!r)return;					  
                onupdate();

            },"Update Available");
        }else{
            onupdate();
        }
    }

    if ('serviceWorker' in navigator){
        
        navigator.serviceWorker.register('%SERVERADDRESS%service-worker'+(Application.IsInMobile()?'-mobile':'')+'.js?instance='+instance)
            .then(function(reg) {
                Application.serviceWorkerReg = reg;
                reg.onupdatefound = function() {
                    var installingWorker = reg.installing;
                    installingWorker.onstatechange = function() {
                        switch (installingWorker.state) {
                            case 'installed':
                            if (navigator.serviceWorker.controller) {
                                Application.LogInfo('New or updated content is available.');
                            } else {
                                Application.LogInfo('Content is now available offline!');
                            }
                            break;
                            case 'redundant':
                                Application.LogError('The installing service worker became redundant.');
                            break;
                        }
                    };
                };
                Application.LogInfo("Yes, it did.");
            }).catch(function(err) {
                Application.LogError("No it didn't. This happened: ", err)
            });

    }else{
        Application.LogDebug('Service worker not supported.');
    }
};

/**
 * Reloads the browser.
 * @memberof module:Application
 * @returns {void}
 * @example
 * Application.Reload();
 */
Application.Reload = function(){
    if(Application.IsIE()){
	    window.location = window.location;
    }else{
	    window.location.reload();
    }
};

/**
 * Register browser window events. Called automatically on appication startup.
 * @memberof module:Application
 * @param {string} instance The name of the instance.
 * @returns {void}
 */
Application.HookPageEvents = function (instance) {

    Application.HookCacheEvents(instance);

    if (!Application.IsInMobile()) {

        //On resize.
        $(window).resize(app_debouncer(function () {

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

	
		$(window).resize(function () {
		
			//Resize windows.
            if ($moduleloaded("WindowManager")) {
                UI.WindowManager.OnResize();
            }
		
		});
		
        //On resize.        
        $(window).on("orientationchange", function() {

            $.mobile.resetActivePageHeight();
			
            //Resize windows.
            if ($moduleloaded("WindowManager")) {
                UI.WindowManager.OnResize();
            }
                       
        });      
    }

    //OnClose.
    $(window).unload(function () {
        if ($moduleloaded("App")) {
            Application.App.Close();
        }
    });
};

/**
 * Merges a table view with record field values.
 * @memberof module:Application
 * @param {string} view The table view.
 * @param {Record} rec The record to merge into the view.
 * @returns {string} The merged view.
 * @example
 * var rec = new Record();
 * rec.Record.Fields = [
 *  { Name: "ID", Value: "1", Type: "Integer" },
 *  { Name: "Description", Value: "Value", Type: "Text" }
 * ];
 * var view = Application.MergeView("WHERE(ID=FIELD(ID))", rec);
 * // view = "WHERE(ID=CONST(1))";
 */
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

/**
 * Checks the licence for access to license parts.
 * @memberof module:Application
 * @param {string} name Name of the license part.
 * @param {boolean} [dev=false] Also check if the user has developer rights.
 * @returns {boolean} Returns `true` if the user can access the license part.
 * @example
 * var ret = Application.LicenseCheck('System',true);
 * // ret = true if the license has developer rights to the System part.
 */
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

/**
 * Checks the licence for access to license parts.
 * @function
 * @global
 * @param {string} name Name of the license part.
 * @param {boolean} [dev=false] Also check if the user has developer rights.
 * @returns {boolean} Returns `true` if the user can access the license part.
 * @example
 * var ret = $license('System');
 * // ret = true if the license has access rights to the System part.
 */
$license = Application.LicenseCheck;

/**
 * Run a function and catch any exceptions.
 * @memberof module:Application
 * @param {Function} func The function to run.
 * @returns {*} Returns the `func` return.
 * @example
 * Application.RunSilent(function(){
 *  throw 'This is an error';
 * });
 * // code down here will still run.
 * var val = true;
 */
Application.RunSilent = function(func){
    try{
        return func();
    }catch(e){
    }
};

/**
 * Runs a new code thread.
 * @memberof module:Application
 * @param {Function} func The function to run in the code thread.
 * @param {boolean} [skipDelay=false] If `true` will run the code thread straight away.
 * @param {string} [id=null] A unique identifier for the code thread
 * @param {boolean} [trans=false] Wraps the `func` with a database transaction.
 * @returns {void}
 * @example
 * Application.RunNext(function() {
 *  // this will run first.
 * });
 * Application.RunNext(function() {
 *  // this will run second and has a database transaction.
 * },null,null,true);
 */
Application.RunNext = function (func, skipDelay, id, trans) {
    
    if(skipDelay)
        return $codeblock(func);	
		
    setZeroTimeout(function () {
        $thread(function () {
			if(!trans){
				return $codeblock(func);
			}else{
				return $codeblock(
					Application.BeginTransaction,
					func,
					Application.CommitTransaction
				);
			}
        },null,null,null,id);
    });
};

/**
 * Tests if a string is a valid number.
 * @memberof module:Application
 * @param {string} n The string to be tested.
 * @returns {void}
 * @example
 * Application.TestNumber('foo'); // this will throw an Application.Error
 */
Application.TestNumber = function (n) {
    if (isNaN(parseInt(n))) 
        Application.Error("Value must be a number.");
};

/**
 * Determines if the mobile device is in portrait orientation.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the mobile device is in portrait orientation.
 */
Application.IsPortrait = function(){
	return $(window).height() > $(window).width();	
};

/**
 * Determines if the browser window type is `frame`.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the browser window type is `frame`.
 * @example
 * Application.LoadModules(Application.windowType.Frame);
 * var ret = Application.IsInFrame();
 * // ret = true
 */
Application.IsInFrame = function(){
	return Application.type == Application.windowType.Frame;
};

/**
 * Determines if the browser window type is `mobile`.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the browser window type is `mobile`.
 * @example
 * Application.LoadModules(Application.windowType.Mobile);
 * var ret = Application.IsInMobile();
 * // ret = true
 */
Application.IsInMobile = function(){
	return Application.type == Application.windowType.Mobile;
};

/**
 * Determines if the application is running on a mobile device.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the application is running on a mobile device.
 */
Application.IsDevice = function () {
    return (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
};

/**
 * Determines if the application is running on an android device.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the user is on an android device.
 */
Application.IsAndroid = function(){
	return /(android)/i.test(navigator.userAgent);
};

/**
 * Determines if the application is running on a mobile display.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the application is running on a mobile display.
 */
Application.IsMobileDisplay = function () {
    if(!Application.IsInMobile())
        return false;
    var w = $(window).width();
    if(w > $(window).height())
        w = $(window).height();
    return w <= 650;
};

/**
 * Determines if the application is running on a tablet display.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the application is running on a tablet diaplay.
 */
Application.IsTabletDisplay = function () {
    if(!Application.IsInMobile())
        return false;
    var w = $(window).width();
    if(w > $(window).height())
        w = $(window).height();
    return w > 650;
};

/** 
 * @deprecated Since v5.0.0
 * @memberof module:Application
*/
Application.MiniMode = function () {
    Application.LogWarn('Application.MiniMode has been deprecated since v5.0.0');
	//Backwards compat.
    return Application.IsMobileDisplay();
};

/**
 * Determines if the current browser is `Internet Explorer`.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the current browser is `Internet Explorer`.
 */
Application.IsIE = function () {
    return $.browser.msie == true;
};

/**
 * Determines if the current browser is `Safari`.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the current browser is `Safari`.
 */
Application.IsSafari = function () {
    return $.browser.safari == true;
};

/**
 * Determines if the current browser is `Opera`.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the current browser is `Opera`.
 */
Application.IsOpera = function () {
    return $.browser.opera == true;
};

/**
 * Determines if the current browser is `Chrome`.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the current browser is `Chrome`.
 */
Application.IsChrome = function () {
    return $.browser.webkit == true;
};

/**
 * Determines if the current browser is `Firefox`.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the current browser is `Firefox`.
 */
Application.IsFirefox = function () {
    return $.browser.mozilla == true;
};

/**
 * Determines if the current browser is in private mode.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if the current browser is in private mode.
 */
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

/**
 * Determines if the current browser is an unsupported version of `Internet Explorer`.
 * @memberof module:Application
 * @param {boolean} [strict_=false] If `true` checks if the version of `Internet Explorer` supports HTML5.
 * @returns {boolean} Returns `true` if the current browser is an unsupported version of `Internet Explorer`.
 */
Application.UnsupportedIE = function (strict_) {

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
};

/**
 * Determines if HTML5 is supported.
 * @memberof module:Application
 * @returns {boolean} Returns `true` if HTML5 is supported.
 */
Application.CanvasSupported = function () {    
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));    
};

/**
 * Checks an error message to see if the server connection has been disconnected.
 * @memberof module:Application
 * @param {string} e The error message to check.
 * @returns {boolean} Returns `true` if the error is a disconnection error.
 */
Application.HasDisconnected = function(e){
	if(!e || typeof e.indexOf == 'undefined')
		return false;	
	return e.indexOf("%LANG:SYS_SESSIONERROR%") != -1 || e.indexOf("%LANG:ERR_INVREQ%") != -1 || e.indexOf("open DataReader") != -1 || e.indexOf("transaction was rollbacked or commited") != -1;
};

/**
 * Throws an application error.
 * 
 * **NOTE: This will clear all code threads and stop the execution of the current code thread.**
 * 
 * @memberof module:Application
 * @param {string} msg The error message to be displayed.
 * @returns {void}
 * @example
 * var val = 1;
 * Application.Error('I am an error');
 * // the rest of this code will not run.
 * val = 2;
 */
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
    if ($moduleloaded("CodeEngine"))
        Application.CodeEngine.Restart();

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

/**
 * Shows an error message without clearing the code threads or stopping code execution.
 * @memberof module:Application
 * @param {string} msg The error message to be displayed.
 * @param {Function} [callback=null] The function to call after the user dismisses the error message.
 * @returns {void}
 * @example
 * var val = 1;
 * Application.ShowError('I am an error');
 * // the rest of this code will run.
 * val = 2;
 */
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

Application.OnError = Application.ShowError;

/**
 * Displays a message to the user.
 * @memberof module:Application
 * @param {string} msg The message to be displayed.
 * @param {Function} [callback=null] The function to call after the user dismisses the message.
 * @param {string} [title='Application Message'] The title of the message box.
 * @param {string} [icon=null] Custom image URL to use for the icon.
 * @returns {void}
 * @example
 * Application.Message('I am a message');
 * Application.Message('I am also a message',function(){
 *   // this will run after the user dismisses the message.
 * });
 * Application.Message('I am a message',null,'Custom Title');
 */
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

/**
 * Shows a confirmation message to the user.
 * @memberof module:Application
 * @param {string} msg The message to be displayed.
 * @param {function(boolean)} callback The functon to run after the user has made a choice. Passes in `true` if the user clicked `OK`.
 * @param {string} [title='Application Confirmation'] The title of the message box.
 * @param {string} [yescaption='OK'] The caption of the yes option.
 * @param {string} [nocaption='Cancel'] The caption of the no option.
 * @returns {void}
 * @example
 * Application.Confirm('Make a choice',function(ret){
 *  // ret = true if user clicked OK
 * });
 */
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

/**
 * Shows a progress dialog.
 * @memberof module:Application
 * @param {string} msg The message to be displayed.
 * @param {string} [title=null] the title of the message.
 * @param {number} [i=null] The current progress value.
 * @param {number} [num=null] The total progress value.
 * @returns {void}
 * @example
 * Application.ShowProgress('Showing progress',null,1,5);
 * Application.ShowProgress('Showing progress',null,2,5);
 * Application.ShowProgress('Showing progress',null,3,5);
 * Application.ShowProgress('Showing progress',null,4,5);
 * Application.ShowProgress('Showing progress',null,5,5);
 */
Application.ShowProgress = function (msg, title, i, num) {

    if (Application.noGUI)
        return;
    
    title = Default(title,'Progress');

    if (Application.ProgressBox) {
        Application.ProgressBox(true, msg, title, i, num);
    }
};

/**
 * Hides the progress dialog.
 * @memberof module:Application
 * @returns {void}
 */
Application.HideProgress = function () {

    if (Application.noGUI)
        return;

    if (Application.ProgressBox) {
        Application.RunSilent(function(){
            Application.ProgressBox(false);
        });
    }
};

/**
 * Substitutes placeholders in a string with values.
 * @memberof module:Application
 * @param {string} msg The string to format (use $ then the argument number for placeholders).
 * @param {...*} args Arguments to substitute.
 * @returns {string} The formatted string.
 * @example
 * var str = Application.StrSubstitute('This is a $1','message');
 * // str = 'This is a message'
 */
Application.StrSubstitute = function (msg) {

    //Use arguments to replace $ const values.
    for (var i = 1; i < arguments.length; i++)
        while (msg.indexOf("$" + i) != -1)
            msg = msg.replace("$" + i, arguments[i]);

    return msg;
};

/**
 * Loads URL style parameters into an object.
 * @memberof module:Application
 * @param {Object} arr The object to load parameters into.
 * @param {string} [paramstr=null] The parameters to pass into the object. If null will retrieve from the current URL.
 * @returns {void}
 * @example
 * // if url = %SERVERADDRESS%?param1=true&param2=false
 * var params = {};
 * Application.LoadParams(params);
 * // params.param1 = true
 * // params.param2 = false
 */
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

/**
 * Loads javascript code into the browser.
 * @memberof module:Application
 * @param {string} id_ The id of the script tag that is to be inserted.
 * @param {string} code_ The javascript code to insert.
 * @returns {void}
 * @example
 * Application.LoadScript('testcode', 'var foo = "bar";');
 * var script = $("#testcode");
 * // script.html() = 'var foo = "bar";'
 */
Application.LoadScript = function (id_, code_) {

    $("#" + id_).remove();

    if(code_.indexOf("http") == 0){

        var source = $('<script type="text/javascript" src="' + code_ + '"></script>');
        $('head').append(source);

    }else{

        var source = $('<script type="text/javascript" id="' + id_ + '">' + code_ + '</script>');
        $('body').append(source);

    }

};

/**
 * @deprecated Since v5.0.0
 * @memberof module:Application 
 */
Application.FriendifyDates = function (view_) {

    var check = new RegExp('([\(\.\<\=\\s])(\\d+)(\/)(\\d+)', 'g');
    var groups = view_.match(check);
    Application.LogWarn('Application.MiniMode has been deprecated since v5.0.0');
    return view_.replace(check, "$1$4$3$2");
};

/**
 * Checks a string to see if it is formatted as an email address.
 * @memberof module:Application
 * @param {string} email The string to be checked.
 * @returns {boolean} Returns `true` if the string is formatted like an email address.
 * @example
 * var ret = Application.CheckEmail('test@hi.com');
 * // ret = true
 * ret = Application.CheckEmail('foo bar');
 * // ret = false
 */
Application.CheckEmail = function (email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

/**
 * Checks an option string for a certain key.
 * @memberof module:Application
 * @param {string} opts The option string to check.
 * @param {string} key The key to be checked for.
 * @returns {boolean} Returns `true` if the key is in the option string, else returns `false`.
 * @example
 * var ret = Application.HasOption('factbox;height:200;view:WHERE(field=CONST(2))', 'factbox');
 * // ret = true
 */
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

/**
 * Checks an option string for a key value.
 * @memberof module:Application
 * @param {string} opts The option string to be checked.
 * @param {string} key The key value to be checked for.
 * @returns {string} Returns `null` if the key value is not available in `opts`, else returns the key value.
 * @example
 * var ret = Application.OptionValue('factbox;height:200;view:WHERE(field=CONST(2))', 'height');
 * // ret = '200'
 */
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

/**
 * Caches dates that have been parsed.
 * @memberof module:Application
 * @type {Object}
 * @protected
 */
Application.dateCache = {};

/**
 * Converts a date from a string to a javascript date, using the timezone difference between the server and client.
 * @memberof module:Application
 * @param {string} str The string to be converted.
 * @returns {date} Returns the javascript date.
 * @example
 * var dte = Application.ConvertDate('2012-04-21T18:25:43-05:00');
 */
Application.ConvertDate = function(str,skipTZ) {
    
    if(str.indexOf && str.indexOf('T') === -1)
        return str;
        
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

/**
 * Runs an ajax function.
 * @memberof module:Application
 * @param {string} url_ The url to run.
 * @param {Object} [data_=null] The data to send with the request.
 * @param {function(*)} [callback_=null] The function to run after the ajax has been executed.
 * @returns {void}
 */
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

/**
 * Executes an endpoint.
 * @memberof module:Application
 * @param {string} url_ The url of the endpoint.
 * @param {function(*)} [callback_=null] The function to be executed after the endpoint has been executed.
 * @param {number} [timeout_=null] The time after the request will timeout (in ms).
 * @param {string} [type_='json'] The data type of the request.
 * @returns {void}
 */
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

/**
 * Randomizes the elements of an array.
 * @memberof module:Application
 * @param {Array} myArray The array to be randomized.
 * @returns {void}
 */
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

/**
 * Removes empty elements from an array.
 * @memberof module:Application
 * @param {Array} array The array to be cleaned.
 * @param {*} [deleteValue=null] If an element is equal to the deletevalue, it will be removed.
 * @return {Array} The cleaned array.
 */
Application.CleanArray = function (array, deleteValue) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == deleteValue) {
            array.splice(i, 1);
            i--;
        }
    }
    return array;
};

/**
 * Clones one object into another object (shallow copy). Needs to be run with `.call` (see example).
 * @global
 * @param {Object} obj_ The object to be cloned.
 * @returns {boolean} Returns `true` if the object has been cloned, if not returns `false`.
 * @example
 * var obj = {};
 * var obj2 = {foo: {bar: true}};
 * app_transferObjectProperties.call(obj, obj2);
 * // obj.foo == obj2.foo
 */
var app_transferObjectProperties = function(obj_) {
    if (obj_ == null) {
        return false;
    }
    for (var i in obj_) {
        this[i] = obj_[i];
    }
    return true;
};

/**
 * Clones one object into another object (deep copy). Needs to be run with `.call` (see example).
 * @global
 * @param {Object} obj_ The object to be cloned.
 * @returns {boolean} Returns `true` if the object has been cloned, else returns `false`.
 * @example
 * var obj = {};
 * var obj2 = {foo: {bar: true}};
 * app_deepTransferObjectProperties.call(obj, obj2);
 * // obj.foo !== obj2.foo
 */
var app_deepTransferObjectProperties = function(obj_) {
    if (obj_ == null) {
        return false;
    }
    $.extend(true, this, obj_);    
    return true;
};

/**
 * Limits the rate at which a function can fire.
 * @global
 * @param {Function} func The function to run.
 * @param {number} [timeout=200] The time after which the function will run (in ms).
 * @returns {Function} Returns the debounced function.
 * @example
 * $(window).resize(app_debouncer(function () {
 *  // this will only run after the user stops resizing + 500 ms
 * },500));
 */
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

/**
 * Decodes a HTML string.
 * @memberof module:Application
 * @param {string} text HTML to be decoded.
 * @returns {string} Returns the decoded HTML string.
 * @example
 * var ret = Application.DecodeHTML('&amp;lt;html&amp;gt;&amp;lt;/html&amp;gt;')
 * // ret = '&lt;html&gt;&lt;/html&gt;'
 */
Application.DecodeHTML = function(text){
	var decoded = $('<div/>').html(text).text();
	return decoded;
};

/**
 * Decrypts a string using AES.
 * @memberof module:application
 * @param {string} inStr The string to decrypt.
 * @param {string} inPass The key to decrypt the string.
 * @returns {string} The decrypted string.
 * @example
 * var data = Application.DecryptData('Kvj9dRPD+xUC9z0xO0JMaQ==', 'password');
 * // data = 'Test Foo Bar'
 */
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

/**
 * Encrypts a string using AES.
 * @memberof module:Application
 * @param {string} inStr The string to encrypt.
 * @param {string} inPass The key to encrypt the string with.
 * @returns {string} The encrypted string.
 * @example
 * var data = Application.EncryptData('Test Foo Bar', 'password');
 * // data = 'Kvj9dRPD+xUC9z0xO0JMaQ=='
 */
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

/**
 * Formats a date into a string.
 * @memberof module:Application
 * @param {Date} dte The date to be formatted.
 * @param {string} [format='dd/MM/yyyy'] The format the date is to be changed into.
 * @returns {string} Returns the date formatted as a string.
 * @example
 * var str = Application.FormatDate(new Date());
 */
Application.FormatDate = function(dte, format){
	if(dte == null)
		return "";
	format = Default(format,"dd/MM/yyyy");
	return $.format.date(dte,format);
};

/**
 * Parses a string into a javascript date (no timezone conversion).
 * @memberof module:Application
 * @param {string} str The string to be parsed into a javascript date (formatted like a date).
 * @return {Date} Returns the javascript date.
 * @example
 * var dte = Application.ParseDate('13/02/2018');
 */
Application.ParseDate = function(str){
	if(str && str.indexOf("T") != -1)
		return new Date(str);
	return moment(str,"%LANG:FORMAT_LONGDATE%".toUpperCase()).toDate();    
};

/**
 * Parses a string into a javascript date (no timezone conversion).
 * @memberof module:Application
 * @param {string} str The string to be parsed into a javascript date (formatted like a date & time).
 * @returns {Date} Returns the javascript date.
 * @example
 * var dte = Application.ParseDateTime('13/02/2018 02:00 pm');
 */
Application.ParseDateTime = function(str){
	if(str && str.indexOf("T") != -1)
		return new Date(str);
	return moment(str,"DD/MM/YYYY hh:mm:ss a").toDate();    
};

/**
 * Parses a string into a javascript date (no timezone conversion).
 * @memberof module:Application
 * @param {string} timeStr The string to be parsed into a javascript date (formatted like a time).
 * @param {Date} [dt=null] The date part of the date time. If null will use todays date.
 * @returns {Date} Returns the javascript date.
 * @example
 * var dte = Application.ParseTime('14:00');
 */
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

/**
 * @deprecated Since v5.0.0
 * @memberof module:Application
 */
Application.OffsetDate = function(dt){
	
	if(dt == null)
		return dt;
	
	//Apply server offset.
	var offset = Application.auth.TZ - moment().zone();
    dt.setTime(dt.getTime()+(offset*60*1000));
    Application.LogWarn('Application.MiniMode has been deprecated since v5.0.0');
	return dt;
};

/**
 * Combines two record views together.
 * @memberof module:Application
 * @param {string} view1_ The first view to combine.
 * @param {string} view2_ The second view to combine.
 * @param {boolean} [overwrite_] If `false`, adds the first views filters to the second, else will overwrite.
 * @returns {string} Returns the merged views.
 */
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

/**
 * Gets a filter from a view.
 * @memberof module:Application
 * @param {string} name_ The name of the filter to get.
 * @param {string} view_ The view to to get the filter from.
 * @returns {string} Returns the filter if it is found, otherwise returns a blank string.
 */
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

/**
 * Merges keywords into the view.
 * @memberof module:Application
 * @param {string} view The view to merge.
 * @returns {string} Returns the merged view.
 */
Application.ViewSubstitute = function (view) {

    if (view == null)
        return;

    if (view.indexOf("%1") != -1)
        view = view.replace(/%1/g, Application.auth.Username);

    if (view.indexOf("%TODAY") != -1)
        view = view.replace(/%TODAY/g, $.format.date(new Date(), '%LANG:FORMAT_LONGDATE%'));

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

/**
 * Gets the TOP section of the view.
 * @memberof module:Application
 * @param {string} view The view to search.
 * @returns {string} The TOP section if found, else will return blank.
 */
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

/**
 * Returns the SORTING section of a view.
 * @memberof module:Application
 * @param {string} view The view to search.
 * @returns {string} Returns the sorting section if found, else will returns a blank string.
 */
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

/**
 * Returns an array of filters from a view.
 * @memberof module:Application
 * @param {string} view The view to search.
 * @param {boolean} friendify If `true` will returns the filter value, else will return the whole filter.
 * @returns {object[]} Returns the array of filters from a view.
 */
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

/**
 * Adds a filter to a view.
 * @memberof module:Application
 * @param {string} view_ The view to add a filter to.
 * @param {string} field_ The field to filter.
 * @param {string} filter_ The filter value for the field.
 * @returns {string} Returns the view with the filter added.
 */
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

/**
 * Removes a filter operator from a filter value.
 * @memberof module:Application
 * @param {string} filter The filter to be stripped.
 * @returns {string} Returns the stripped filter.
 */
Application.StripFilters = function (filter) {
    return filter.replace("<", "").replace(">", "").replace("..", "").replace("=", "").toString().toLowerCase();
};

/**
 * Converts a filter operator to a javascript operator.
 * @memberof module:Application
 * @param {string} filter The filter to convert.
 * @returns {string} Returns the javascript operator as a `string`.
 */
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

/**
 * Merges special key words into the view
 * @memberof module:Application
 * @param {PageField} field The page field to merge.
 * @param {PageViewer} viewer The page viewer.
 * @param {string} term The term to merge.
 * @param {string} value The value to merge.
 * @returns {string} Returns the merged view.
 */
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

/**
 * Looks up a record set.
 * @memberof module:Application
 * @param {PageField} field The page field.
 * @param {PageViewer} viewer The page viewer.
 * @param {string} term The term to be searched.
 * @param {function(object[])} response Returns the results into this function.
 * @param {string} value The current value of the field.
 * @returns {JQueryPromise(object[])} Promises to return after the record has been searched for. Returns an array of results.
 */
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

/**
 * Checks if there is a filter operator in a string.
 * @memberof module:Application
 * @param {string} filter The string to check.
 * @returns {boolean} Returns `true` if there is a filter operator in the string.
 */
Application.HasFilterChar = function(filter){
    return !(filter.indexOf("*") == -1 && filter.indexOf("=") == -1 && filter.indexOf("..") == -1 && filter.indexOf("|") == -1
    	&& filter.indexOf("<") == -1 && filter.indexOf(">") == -1 && filter != 'null');
};

/**
 * Converts an `Option` filter from ids to captions.
 * @memberof module:Application
 * @param {string} filter The `Option` filter.
 * @param {string} captions The captions for the `Option` field.
 * @returns {string} Returns the filter with captions instead of ids.
 */
Application.GetOptionFilter = function(filter, captions){
	var ret = "";
	if(filter.indexOf("|") !== -1){
		var filters = filter.split("|");
		for(var i = 0; i < filters.length; i++){
			if(ret==""){
				ret = captions.split(",")[filters[i]];
			}else{
				ret += "|"+captions.split(",")[filters[i]];
			}
		}
	}else if(filter.indexOf("&") !== -1){
		var filters = filter.split("&");
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

/**
 * Converts an `Option` filter from captions to ids.
 * @memberof module:Application
 * @param {string} filter The `Option` filter.
 * @param {string} captions The captions for the `Option` field.
 * @returns {string} Returns the filter with ids instead of captions.
 */
Application.SetOptionFilter = function(filter, captions){
	var ret = "";
	if(filter.indexOf("|") !== -1){
		var filters = filter.split("|");
		for(var i = 0; i < filters.length; i++){
			if(ret==""){
				ret = captions.split(",").indexOf(filters[i]).toString();
			}else{
				ret += "|"+captions.split(",").indexOf(filters[i]);
			}
		}
	}else if(filter.indexOf("&") !== -1){
		var filters = filter.split("&");
		for(var i = 0; i < filters.length; i++){
			if(ret==""){
				ret = captions.split(",").indexOf(filters[i]).toString();
			}else{
				ret += "&"+captions.split(",").indexOf(filters[i]);
			}
		}
	}else{
		ret = captions.split(",").indexOf(filter).toString();
	}	
	return ret;
};

/**
 * Creates a table view from an `Object` of filters.
 * @memberof module:Application
 * @param {Object} filters The object containing the filters.
 * @returns {string} Returns the table view.
 */
Application.GenerateView = function(filters){
	var f = "";
    for (var i in filters) {
        if(f.length == 0){
            f += i + "=FILTER("+filters[i]+")";
        }else{
            f += ","+ i + "=FILTER("+filters[i]+")";
        }
    }
    if(f.length > 0)
        f = "WHERE("+f+")";
	return f;
};

/**
 * Opens a page
 * @global
 * @param {string} id The page id to open
 * @param {Object} filters The filters to apply to the page
 * @param {Object} [options] The options for the page
 * @param {number} [parent] The id of the parent page
 * @param {boolean} [singleThread] Not used
 * @param {string} [sorting] The sorting to be used on the page
 * @returns {void}
 */
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

/**
 * Gets a control from the current page
 * @global
 * @param {string} name_ The name of the control
 * @returns {null|Control} Will return the control if found, otherwise `null`
 */
CONTROL = function(name_){
    if(ThisViewer())
        return ThisViewer().Control(name_);
    return null;
};

/**
 * Gets the parent page of the current page
 * @global
 * @returns {null|PageViewer} Will return the parent page if it is found, else `null`
 */
PARENTPAGE = function(){
    if(ThisViewer())
        return ThisViewer().ParentPage();    
    return null;
};

/**
 * Closes the curent page
 * @global
 * @returns {void}
 */
CLOSEPAGE = function(){
    if(ThisViewer())
        Application.RunNext(ThisViewer().Close);
};

/**
 * Refresges the current page
 * @global
 * @returns {void}
 */
REFRESH = function () {
    $codeinsert(
        function () {
            $flag;
            if(ThisViewer())
                return ThisViewer().Update();        
        }
    );    
};

/**
 * Returns the previous window
 * @global
 * @returns {Window} The previous window
 */
PREVWINDOW = function(){
    if ($moduleloaded("WindowManager")) 
        return UI.WindowManager.PreviousWindow();
};

/**
 * Returns the next window
 * @global
 * @returns {Window} The next window
 */
NEXTWINDOW = function(){
    if ($moduleloaded("WindowManager")) 
        return UI.WindowManager.NextWindow();
};

/**
 * Creates a new record
 * @global
 * @param {string} id The table id
 * @param {Function} callback The function to be called after the record is created
 * @returns {void}
 */
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

/**
 * Finds a record set
 * @global
 * @param {string} id The id of the table
 * @param {string|Object} filters The filters to apply to the table
 * @param {Function} callback The function to call after the record has been found
 * @param {Array} [lookupfields] The array of the fields to look up
 * @param {Array} [calculatedfields] The array of fields to be calculated
 * @returns {void}
 */
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

/**
 * Counts a set of records
 * @global
 * @param {string} id The id of the table
 * @param {string|Object} filters The filters to apply to the table
 * @param {Function} callback The function to run after the set of records have been counted
 * @returns {void}
 */
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

/**
 * Gets a record from a table
 * @global
 * @param {string} recid The record id to get
 * @param {Function} callback the Function to run after the record is found
 * @returns {void}
 */
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

/**
 * Inserts a record into the database
 * @global
 * @param {string} id The id of the table
 * @param {Object} values The field values to insert
 * @param {Function} [callback] The functions to run after the record has been inserted
 * @param {boolean} [trigger] If `true`, will run the insert trigger
 * @param {boolean} [ignoreExisting] If `true`, wont error if the record already exists in the table
 * @param {PageViewer} [viewer] the page viewer
 * @returns {void}
 */
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
/**
 * Validates a field in a table
 * @global
 * @param {Record} r The record to be validated
 * @param {string} field The field to validate
 * @param {*} value The value to validate
 * @param {PageViewer} [viewer] The page viewer
 * @returns {void}
 */
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

/**
 * Modifies a record in the database
 * @global
 * @param {Record} r The record to modify
 * @param {string} field The field to modify
 * @param {*} value The value to modify
 * @param {Function} [callback] the function to run after the record has been modified
 * @param {boolean} [trigger] If `true`, runs the modify trigger
 * @param {boolean} [skipValidate] If `true`, does not validate the field to be modified
 * @param {PageViwer} [viewer] the page viewer
 * @returns {void}
 */
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

/**
 * Modifies multiple fields in the database
 * @global
 * @param {Record} r Therecord to be modified
 * @param {string} col_ The field to be modified
 * @param {*} value_ The value to be modified
 * @param {Function} [callback] The function to run after the fields have been modified
 * @returns {void}
 */
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

/**
 * Deletes a record from the database
 * @global
 * @param {Record} r The record to be deleted
 * @param {Function} [callback] The function to run after the record has been deleted
 * @param {boolean} [trigger] If `true`, runs the delete trigger
 * @param {PageViewer} [viewer] The page viewer
 * @returns {void}
 */
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

/**
 * Deletes multiple records from the database
 * @global
 * @param {Record} r The record to be deleted
 * @param {Function} [callback] The function to run after the records have been deleted
 * @returns {void}
 */
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

/**
 * Resets the filters on a record
 * @global
 * @param {Record} r the record to reset
 * @param {Function} [callback] The function to run after the filters have been reset
 * @returns {void}
 */
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

/**
 * Gets a code module from the database
 * @global
 * @param {string} id The id of the code module
 * @param {Function} callback The function to be run when the code module has been found
 * @returns {void}
 */
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

/**
 * Gets a table from the database
 * @global
 * @param {string} id The id of the table
 * @param {Function} [callback] The function to be run after the table has been found
 * @returns {void}
 */
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

/**
 * Begins a database transation
 * @global
 * @param {Function} [callback] The function to be run after the database transaction has begun
 * @returns {void}
 */
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

/**
 * Commits a database transaction
 * @global
 * @param {Function} [callback] The function to be run after a database transaction has been commited
 * @returns {void}
 */
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
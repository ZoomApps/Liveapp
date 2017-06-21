

Define("Module", null, function (name_, options_) {

    //#region Members

    var _self = this;
    var m_name = "";
    var m_options = null;
    var m_loaded = false;

    //#endregion

    //#region Public Methods

    this.Constructor = function (name_, options_) {

        if (Application.testMode && arguments[0] == null) return;

        m_name = name_;

        //Default options.
        m_options = options_ || {};

        //Module options.
        m_options.depends = Default(options_.depends, null);
        m_options.singleInstance = Default(options_.singleInstance, false);
        m_options.requiresVersion = Default(options_.requiresVersion, '3.0');

        //Documentation options.
        m_options.created = Default(options_.created, new Date());
        m_options.version = Default(options_.version, '');
        m_options.author = Default(options_.author, '');
        m_options.copyright = Default(options_.copyright, '');
        m_options.changelog = Default(options_.changelog, []);

    };

    //#endregion

    //#region Public Properties
   
    this.Name = function () {
        return m_name;
    };
    
    this.Option = function (name_) {
        return m_options[name_];
    };
    
    this.Loaded = function (value_) {

        if (value_ !== undefined) { //SET
            m_loaded = value_;
        } else { //GET
            return m_loaded;
        }
    };

    //#endregion

    //#region Overrideable Methods
    
    this.OnLoad = function () {        
    };

    //#endregion

    this.Constructor(name_, options_);

});

DefineModule = function (name, options, def) {
    Define(name, function () {
        return new Module(name, options);
    }, def);
};

DefineModule("ModuleManager",

     {
         singleInstance: true,
         requiresVersion: '3.0',
         created: new Date(2013, 09, 03),
         version: '1.1',
         author: 'Liveware Soultions',
         copyright: 'Copyright 2013, Liveware Soultions',

         changelog: [
        '03/09/13   PF  Created class.',
        '03/09/13   PF  Added dependancy functionality.'
        ]
     },

    function () {

        //#region Members

        var _self = this;
        var m_modules = [];
        var m_excluded = [];

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Global assign.
            $moduleloaded = Application.ModuleManager.ModuleLoaded;
        };

        this.LoadModule = function (mod_) {

            try {

                //Check type.
                if (mod_.ObjectType() != "Module")
                    throw "Object must be typeof Module.";

                //Check excluded.
                if (m_excluded.indexOf(mod_.Name()) != -1)
                    return;

                mod_.Loaded(false);

                //Check application version.
                if (parseFloat(mod_.Option("requiresVersion")) > parseFloat(Application.version)) {
                    throw mod_.Name() + " requires application version " + mod_.Option("requiresVersion") + ". Current application version is " + Application.version;
                }

                //Check single instance.
                if (mod_.Option("singleInstance")) {
                    var exists = this.GetModule(mod_.Name());
                    if (exists != null)
                        throw "Module already loaded.";
                }

                m_modules.push(mod_);

                //Check depends.
                if (mod_.Option("depends") != null)
                    for (var i = 0; i < mod_.Option("depends").length; i++) {
                        if (this.ModuleLoaded(mod_.Option("depends")[i]) == false)
                            throw "Dependancy " + mod_.Option("depends")[i] + " is not loaded.";
                    }

                //Call the onload function.
                mod_.OnLoad();
                mod_.Loaded(true);

                Application.LogInfo("Module Loaded: " + mod_.Name());

            } catch (e) {
                Application.Error("Module Load Failed (" + mod_.Name() + "): " + e);
            }

        };

        this.GetModule = function (name_) {
            for (var i = 0; i < m_modules.length; i++) {
                if (m_modules[i].Name() == name_) {
                    return m_modules[i];
                }
            }
            return null;
        };

        this.ModuleLoaded = function (name_) {
            var mod = _self.GetModule(name_);
            if (mod != null)
                return mod.Loaded();
            return false;
        };

        this.Exclude = function (name) {
            m_excluded.push(name);
        };

        //#endregion

    });

//Assign module.
Application.ModuleManager = new ModuleManager();

//Load module.
Application.ModuleManager.LoadModule(Application.ModuleManager);
/// <reference path="../Application.js" />

DefineModule("CacheManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 9, 3),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '27/02/15   PF  Created class.'
        ]
    },

    function () {

        //#region Members

        var _self = this;
        var m_cache = new Object();

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.Cache = this;

            Application.On("Logout", _self.OnLogout);
        };

        this.OnLogout = function () {
            m_cache = new Object();
        };

        this.Check = function (cache_, key_) {
	
            if (Application.debugMode == true || Application.developerMode == true)
				return null;
		
            if (m_cache[cache_] == null)
                m_cache[cache_] = new Object();

            if (m_cache[cache_][key_] == null)
                return null;

            var r = new Object();
            app_deepTransferObjectProperties.call(r, m_cache[cache_][key_]);
            return r;
        };

        this.Save = function (cache_, key_, obj_) {

            if(Application.debugMode == true || Application.developerMode == true)
				return null;
			
            if (m_cache[cache_] == null)
                m_cache[cache_] = new Object();

            var r = new Object();
            app_deepTransferObjectProperties.call(r, obj_);
            m_cache[cache_][key_] = r;
        };

        this.Remove = function (cache_, key_) {
			
            if(Application.debugMode == true || Application.developerMode == true)
				return null;
			
            if (m_cache[cache_] == null)
                return;
            m_cache[cache_][key_] = null;
        };

        this.RemoveAll = function () {
            m_cache = new Object();
        };

        //#endregion

    });


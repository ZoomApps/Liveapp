/// <reference path="../Application.js" />

DefineModule("CookieManager",

    {

        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 09, 17),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '17/09/13   PF  Created class.'
        ]

    },

    function () {

        //#region Members

        var _self = this;

        //#endregion

        //#region Public Methods       

        this.OnLoad = function () {

            //Assign Module
            Application.CookieManager = this;
        };

        this.Get = function (name) {
            try {
                name = name.toLowerCase();
                //Get the cookie.
                var cookie = $.cookie(name);
                return cookie;
            } catch (e) {
                return null; //Cookies not allowed.
            }
        };

        this.Save = function (name, val, expires) {
            //Save the cookie.
            try {
                name = name.toLowerCase();
                $.cookie(name, val, { expires: expires, path: '/' });
            } catch (e) {
                return false;
            }
            return true;
        };

        this.Remove = function (name, expires) {

            try {
                name = name.toLowerCase();
                $.removeCookie(name, { expires: expires, path: '/' });
            } catch (e) {
            }
        };

        //#endregion

    });
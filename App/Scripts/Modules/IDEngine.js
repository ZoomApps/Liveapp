/// <reference path="../Application.js" />

//27/01/15      Issue #11       PF      Removed old code.

DefineModule("IDEngine",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 9, 3),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '03/09/13   PF  Created class.'
        ]
    },

    function () {

        //#region Members

        var _self = this;
        var m_lastID = 0;

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.IDEngine = this;

            //Global Assign
            $id = Application.IDEngine.AssignID;
        };

        this.GenerateID = function () {

            //Use date to generate new ID.
            var dte = new Date()
            return dte.getTime();

        };

        this.AssignID = function (c) {

            var id = _self.GenerateID();
            while (id <= m_lastID)
                id += 1;            

            m_lastID = id;
            return id;
        };

        //#endregion

    });

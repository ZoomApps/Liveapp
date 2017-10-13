/// <reference path="../Application.js" />

DefineModule("SolutionManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        depends: [],
        created: new Date(2013, 12, 11),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '11/12/13   PF  Created class.'            
        ]

    },

    function () {

        //#region Members

        var _self = this;        

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.SolutionManager = this;
        };
        
        //#endregion

    });
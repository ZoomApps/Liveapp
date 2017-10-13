/// <reference path="../Application.js" />

DefineModule("CodeEditor",

    {
        singleInstance: false,
        requiresVersion: '3.0',
        created: new Date(2014, 01, 31),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '31/01/14   PF  Created class.'
        ]

    },

    function (parent_, onchange_) {

        //#region Members

        var _self = this;
        var m_editor = null; //Codemirror

        //#endregion

        //#region Public Methods

        this.Constructor = function (parent_, onchange_) {

            if (Application.testMode && arguments[0] == null) return;

            m_editor = CodeMirror.fromTextArea(parent_, {
                mode: "javascript",
                lineNumbers: true,
                viewportMargin: Infinity,
                lineWrapping: true,
                extraKeys: {
                    "Ctrl-Space": "autocomplete"
                },
                gutters: ["CodeMirror-lint-markers"],
                lint: true
            });

            if(onchange_)
                m_editor.on("change", onchange_);
        };

        this.Value = function (value) {
            if (value == null) {
                return m_editor.getValue();
            } else {
                m_editor.setValue(value);
            }
        };

        this.OnLoad = function () {
        };

        //#endregion

        this.Constructor(parent_, onchange_);

    });
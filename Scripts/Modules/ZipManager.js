// <reference path="../Application.js" />

DefineModule("ZipManager",

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

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Global assign.
            Application.Zip = this;
        };

        this.Encode = function (s, password) {

            var dict = {};
            var data = (s + "").split("");
            var out = [];
            var currChar;
            var phrase = data[0];
            var code = 256;
            for (var i = 1; i < data.length; i++) {
                currChar = data[i];
                if (dict[phrase + currChar] != null) {
                    phrase += currChar;
                }
                else {
                    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                    dict[phrase + currChar] = code;
                    code++;
                    phrase = currChar;
                }
            }
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            out = $.toJSON(out);
            if (password)
                out = Application.EncryptData(out, password);
            return out;
        };

        this.Decode = function (data, password) {

            if (password) {
                data = Application.DecryptData(data, password);
                if (data == "")
                    return "";
            }

            data = $.parseJSON(data);

            var dict = {};
            var currChar = String.fromCharCode(data[0]);
            var oldPhrase = currChar;
            var out = [currChar];
            var code = 256;
            var phrase;
            for (var i = 1; i < data.length; i++) {
                var currCode = data[i];
                if (currCode < 256) {
                    phrase = String.fromCharCode(data[i]);
                }
                else {
                    phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
                }
                out += phrase;
                currChar = phrase[0];
                dict[code] = oldPhrase + currChar;
                code++;
                oldPhrase = phrase;
            }

            return out;
        };

        //#end region                

    });
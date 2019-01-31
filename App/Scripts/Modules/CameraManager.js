/// <reference path="../Application.js" />

DefineModule("CameraManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2014, 01, 31),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '27/01/15   PF  Created class.'
        ]

    },

    function () {

        //#region Members

        var _self = this;

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {
            Application.Camera = this;
        };

        this.TakePhoto = function (callback, quality, width) {

            quality = Default(quality, 20); //Issue #73: Lower quality of photos
            width = Default(width, 800);

            if (!window.FileReader)
                Application.Error("Unable to access camera. Please contact support");

            var id = $id();

            $("body").append('<input id="file' + id + '" type="file" style="display:none;" multiple />');
            
            $('#file' + id).fileReaderJS({
                on: {
                    load: function (url) {
                        $('#file' + id).remove();
                        UI.ImageManager.Resize(url, width, 0, 0, function (resimg) {
                            UI.ImageManager.ChangeQuality(resimg, quality, function (img) { //Issue #73: Lower quality of photos     			
								//alert(img.length);
                                callback(UI.ImageManager.Base64(img));
                            });
                        });
                    }
                }
            });
            $('#file' + id).click();
            
        };

        //#endregion

    });

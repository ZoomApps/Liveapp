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

        this.TakePhoto = function (callback, quality, width, onstart, onend) {

            quality = Default(quality, 20); //Issue #73: Lower quality of photos
            width = Default(width, 800);

            if (!window.FileReader)
                Application.Error("Unable to access camera. Please contact support");

            var id = $id();
            var noop = function () { };
            var filesprocessed = 0;

            var input = $('<input id="file' + id + '" type="file" style="opacity: 0;position:absolute;z-index:40000;" multiple />')
                .appendTo('body')
                .fileReaderJS({
                    on: {
                        groupstart: onstart || noop,
                        load: function (url, e, file, files) {
                            $('#file' + id).remove();
                            UI.ImageManager.Resize(url, width, 0, 0, function (resimg) {
                                UI.ImageManager.ChangeQuality(resimg, quality, function (img) { //Issue #73: Lower quality of photos     			                                
                                    //alert(img.length);                                
                                    callback(UI.ImageManager.Base64(img));
                                    filesprocessed += 1;
                                    if (filesprocessed === files && onend)
                                        onend();
                                });
                            });
                        }
                    }
                });

            if (Application.IsInMobile()) {
                var downloadlink = $('<div style="position: fixed; z-index: 50000; top: 0px; left: 0px; font-size: 30px; background-color: white; width: 100vw; height: 100vh; text-align: center; padding-top: 30vh;">Click here to Add Photos</div>');
                $('body').append(downloadlink);
                downloadlink.on('click', function () {
                    $('#file' + id).trigger('click');
                    downloadlink.remove();
                });
            }else{
                input.trigger('click');
            }
        };

        //#endregion

    });

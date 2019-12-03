/// <reference path="../Application.js" />

DefineModule("ImageManager",

    {

        singleInstance: true,
        requiresVersion: '3.0',
        depends: ['AppUI'],
        created: new Date(2014, 07, 07),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '07/07/14   PF  Created class.'
        ]

    },

    function () {

        //#region Members

        var _self = this;
        var m_canvas = null;

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign module.
            UI.ImageManager = this;
        };

        this.Resize = function (img_, maxWidth_, maxHeight_, angle_, callback_, quality_) {

            $.canvasResize(img_, {
                width: maxWidth_,
                height: maxHeight_,
                crop: false,
                rotate: angle_,
                quality: quality_,
                callback: function (img, width, height) {
                    callback_(img, width, height);
                }
            });

        };

        //Issue #73: Lower quality of photos
        this.ChangeQuality = function (img_, quality_, callback_) {

            var tempImg = new Image();
            tempImg.src = img_;
            tempImg.onload = function () {

                var canvas = document.createElement('canvas');
                canvas.width = tempImg.naturalWidth;
                canvas.height = tempImg.naturalHeight;
                var context = canvas.getContext("2d").drawImage(tempImg, 0, 0);
                var url = canvas.toDataURL(_self.GetMimeType(img_), quality_ / 100);
                delete context;
                delete canvas;
                setTimeout(function () {
                    callback_(url);
                },1);

            };

        };

        this.Crop = function (img_, destX_, destY_, destWidth_, destHeight_, callback_) {

            var tempImg = new Image();
            tempImg.src = img_;
            tempImg.onload = function () {

                var canvas = document.createElement('canvas');
                canvas.width = destWidth_;
                canvas.height = destHeight_;
                var context = canvas.getContext('2d'); 
			    if((destX_+destWidth_) > tempImg.width) destWidth_ = tempImg.width - destX_;
				if((destY_+destHeight_) > tempImg.height) destHeight_ = tempImg.height - destY_;
                context.drawImage(tempImg, destX_, destY_, destWidth_, destHeight_, 0, 0, destWidth_, destHeight_);
                var url = canvas.toDataURL()
                delete context;
                delete canvas;
                setTimeout(function () {
                    callback_(url);
                },1);
            };
        };

        this.Dimensions = function (img_, callback_) {

            var tempImg = new Image();
            tempImg.src = img_;
            tempImg.onload = function () {

                var tempW = tempImg.width;
                var tempH = tempImg.height;

                setTimeout(function () {
                    callback_(tempW, tempH);
                },1);
            };
        };

        this.Base64 = function (img_) {
            try {
                return img_.split(';')[1].substr(7);
            } catch (e) {
                return "";
            }
        };

        this.GetMimeType = function (img_) {
            try {
                return img_.split(';')[0].substr(5);
            } catch (e) {
                return "";
            }
        };

        //#endregion

    });

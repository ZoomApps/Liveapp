/// <reference path="../Application.js" />

DefineModule("LoadingManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 09, 03),
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
        var m_controls = [];
        var m_overlays = [];
        var m_loadersActive = 0;

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.Loading = this;
        };

        this.Show = function (cont, type) {

			type = Default(type,"#");
			
			var c = $(type + cont);
            if (c.length == 0)
                return;

            if (m_controls.indexOf(cont) == -1) {

                m_controls.push(cont);

                var o = $('<div id="' + cont + 'Overlay" class="app-overlay" style="background: #FFF; opacity: 0.5">'+
                '<div id="' + cont + 'OverlayProgress" class="md-linear" role="progressbar">'+
                '<div class="md-linear-bar md-linear-bar-1"></div>'+
                '<div class="md-linear-bar md-linear-bar-2"></div></div></div>');
                c.append(o);
            }
            
            //$("#" + cont + 'OverlayProgress').hide();

            var overlay = $("#" + cont + 'Overlay');
            overlay.width('100%').height('100%');
            overlay.show();
        };

        this.Progress = function (cont, value, type) {

            /*
            if (Application.UnsupportedIE())
                return;

			type = Default(type,"#");
			
            var c = $(type + cont);
            if (c.length == 0)
                return;

            var progressbar = $(type + cont + 'OverlayProgress');
            var overlay = $(type + cont + 'Overlay');

            if (value != null) {

                value = Math.round(value);

                progressbar.show();                           

            } else {
                return +progressbar.val();
            }
            */
        };

        this.Hide = function (cont) {            
            //$("#" + cont + 'OverlayProgress').hide();
            $("#" + cont + 'Overlay').hide();
        };

        this.ShowOverlay = function (cont, msg, type) {

            msg = Default(msg, "Please fill out required fields above "+(Application.IsInMobile() ? " and press Save" : ""));
			type = Default(type,"#");
			
            var c = $(type + cont);
            if (c.length == 0)
                return;

            if (m_overlays.indexOf(cont) == -1) {

                m_overlays.push(cont);

                var o = $('<div class="app-overlay" id="' + cont + 'Overlay2" style="width: 100%; height: 100%; color: black; font-size: 12pt; font-weight: bold; opacity: 0.5; text-align: center; z-index: 1;"><p style="top: 50%; position: relative;">' + msg + '</p></div>');
                c.append(o);
            }

            var overlay = $(type + cont + 'Overlay2');
            overlay.width('100%').height('100%');
			overlay.children().html(msg);			
            overlay.show();

        };

        this.HideOverlay = function (cont, type) {

			type = Default(type,"#");
			
            $(type + cont + 'Overlay2').hide();
        };

        //#endregion

    });


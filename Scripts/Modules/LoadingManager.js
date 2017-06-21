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

                var o;
                if (Application.UnsupportedIE() || Application.IsInMobile()) {
                    o = $('<div id="' + cont + 'Overlay" class="ui-widget-overlay app-overlay" style="opacity: .8"></div>');
                } else {
                    o = $('<div id="' + cont + 'Overlay" class="ui-widget-overlay app-overlay" style="opacity: .8"><input id="' + cont + 'OverlayProgress" type="text" data-thickness=".4" data-displayPrevious="true" data-linecap="round" readonly="true" data-min="0" data-max="100" style="position: absolute; opacity: .8" value="0"></div>');
                }
                c.append(o);
            }

            if (!Application.UnsupportedIE() && !Application.IsInMobile())
                $("#" + cont + 'OverlayProgress').knob().hide();

            var overlay = $("#" + cont + 'Overlay');
            overlay.width('100%').height('100%');
            overlay.show();
        };

        this.Progress = function (cont, value, type) {

            if (Application.IsInMobile() || Application.UnsupportedIE())
                return;

			type = Default(type,"#");
			
            var c = $(type + cont);
            if (c.length == 0)
                return;

            var progressbar = $(type + cont + 'OverlayProgress');
            var overlay = $(type + cont + 'Overlay');

            if (value != null) {

                value = Math.round(value);

                progressbar
                    .css("display", "")
                    .css("opacity", ".8")
                    .knob()
                    .show()
                    .css("display", "")
                    .css("opacity", ".8")
                .position({
                    'my': 'center',
                    'at': 'center',
                    'of': c[0]
                });
                progressbar.val(value).trigger('change');


            } else {
                return parseInt(progressbar.val());
            }
        };

        this.Hide = function (cont) {

            $("#" + cont + 'OverlayProgress').hide();
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

                var o = $('<div class="ui-widget-overlay" id="' + cont + 'Overlay2" style="width: 100%; height: 100%; color: black; font-size: 12pt; font-weight: bold; opacity: 0.5; text-align: center; z-index: 1;"><p style="top: 50%; position: relative;">' + msg + '</p></div>');
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


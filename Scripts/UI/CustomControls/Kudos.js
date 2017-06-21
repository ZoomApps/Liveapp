/// <reference path="../Application.js" />

Define("Kudos",

    function (field_, viewer_) {
        if (field_)
            field_.Enabled = false;
        return new Control("Kudos", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Kudos");
        };

        this.CreateDesktop = function (window_) {

            //Create the control.            
            var container = $('<div id="' + _base.ID() + '" class="ui-widget ui-state-default" style="-moz-border-radius: 5px;-webkit-border-radius: 5px;border-radius: 5px; padding-bottom: 100px; margin-left: 10px; "><figure class="kudo kudoable" data-id="1" id="kudos' + _base.ID() + '"><a class="kudobject"><div class="opening"><div class="circle">&nbsp;</div></div></a><a href="#kudo" class="count"><div id="count' + _base.ID() + '" style="margin-top:5px; color: white; text-shadow: black 0.1em 0.1em 0.2em; font-weight:bold; font-size: 20pt;"></div><label class="txt" id="lbl' + _base.ID() + '" style="margin-top:5px; color: white; text-shadow: black 0.1em 0.1em 0.2em; font-weight:bold; text-transform:uppercase; font-size: 20pt;"></label></a></figure></div>');

            if (Application.UnsupportedIE()) {
                container = _base.CreateUnsupported();
            }

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                if (Application.UnsupportedIE()) {
                    container.width("95%");
                    return;
                }

                container.width("95%");
                $("#kudos" + _base.ID()).kudoable();

                $("#kudos" + _base.ID()).unbind("kudo:added");
                $("#kudos" + _base.ID()).bind("kudo:added", function (e) {
                    _self.OnValueChange(_base.Field().Name, "Yes");
                });

                $("#kudos" + _base.ID()).unbind("kudo:removed");
                $("#kudos" + _base.ID()).bind("kudo:removed", function (e) {
                    _self.OnValueChange(_base.Field().Name, "No");
                });

                var bg = Application.OptionValue(_base.Field().Options, "background");
                if (bg)
                    container.css("background", "url(http://" + bg + ") no-repeat center");
            });
        };

        this.FormatValue = function (value_, count_) {

            if (Application.UnsupportedIE())
                return;

            if (count_)
                $("#count" + _base.ID()).html(count_);

            if (value_ == "Yes") {
                $("#kudos" + _base.ID()).removeClass("animate").addClass("complete");
            } else {
                $("#kudos" + _base.ID()).removeClass("complete").addClass("animate");
            }
        };

        this.Update = function (rec_) {

            if (Application.IsInMobile())
                return _base.Update(rec_);

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined')
                return;

            var count = null;
            var cntField = Application.OptionValue(_base.Field().Options, "countfield");
            if (cntField) {
                if (cntField == "TestCount") {
                    count = 12;
                } else {
                    count = rec_[cntField];
                }
            }

            _self.FormatValue(value, count);
        };

        this.SetSize = function (width, height) {

        };

        this.SetupTest = function () {
            _base.Field().Options = "background:richthediabetic.com/wp-content/uploads/2013/07/Pizza.jpg;countfield:TestCount";
        };

        //#endregion

        //#region Overrideable Methods

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
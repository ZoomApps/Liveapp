/// <reference path="../Application.js" />

Define("TimePicker",

    function (field_, viewer_) {
        return new Control("TimePicker", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("TimePicker");
        };

        this.Create = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50%; padding-right: 10px; vertical-align: top;"><input type="text" id="ctl' + _base.ID() + '" style="width: 100%;"></input></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                var mininterval = parseInt(Default(Application.OptionValue(_base.Field().Options,'mininterval'),5));

                //Setup timepicker.
                cont.timepicker({
                    showPeriod: !Application.HasOption(_base.Field().Options,'24hours'),
                    showLeadingZero: true,
                    showDeselectButton: true,
                    showNowButton: true,
                    deselectButtonText: "Clear",
                    minutes: {                                                
                        interval: mininterval
                    }
                });

            });
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var mininterval = parseInt(Default(Application.OptionValue(_base.Field().Options,'mininterval'),5));

            var cont = $('<input>')
            .appendTo(container)
            .timepicker({
                showPeriod: !Application.HasOption(_base.Field().Options,'24hours'),
                showLeadingZero: true,
                showDeselectButton: true,
                showNowButton: true,
                minutes: {                                                
                    interval: mininterval
                }
            })
            .addClass("ui-widget ui-widget-content ui-corner-left")
	        .css("width", "80%")
	        .css("width", "calc(100% - 2px)");

            cont.val(value_);

            //Call base method.
            return _base.CreateList(container, cont, value_);
        };

        //#endregion

        //#region Overloaded Methods

        this.Update = function (rec_) {

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined')
                return;

            if (value != null) {
                _base.Control().val(Application.FormatDate(value, Application.HasOption(_base.Field().Options,'24hours') ? 'HH:mm' : 'hh:mm a'));
            } else {
                _base.Control().val(null);
            }

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
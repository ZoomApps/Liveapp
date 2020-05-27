/// <reference path="../Application.js" />

Define("DateTimePicker",

    function (field_, viewer_) {
        return new Control("DateTimePicker", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("DateTimePicker");
        };

        this.Create = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50%; padding-right: 10px; vertical-align: top;"><input type="text" id="ctl' + _base.ID() + '" style="width: 100%;"></input></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                //Setup datepicker.
                cont.datetimepicker();
//                cont.click(function () {
//                    cont.datetimepicker.show());
//                });

                //Setup the date format from lang file.
                //cont.datetimepicker("option", "dateFormat", ("%LANG:FORMAT_SHORTDATE%").toLowerCase());

                //$("#ui-datepicker-div").addClass("ui-custom-combo");

            });
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input>')
            .appendTo(container)
            .datetimepicker()
            .addClass("ui-widget ui-widget-content ui-corner-left")
	        .css("width", "80%")
	        .css("width", "calc(100% - 2px)");

            //cont.datetimepicker("option", "dateFormat", ("%LANG:FORMAT_SHORTDATE%").toLowerCase());
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

            _base.Control().val(Application.FormatDate(value,"DD/MM/YYYY hh:mm a"));

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
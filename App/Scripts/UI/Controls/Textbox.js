/// <reference path="../Application.js" />

Define("Textbox",

    function (field_, viewer_) {
        return new Control("Textbox", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Textbox");
        };

        this.Create = function (window_) {

            var type = "text";
            if (Application.HasOption(_base.Field().Options, "password"))
                type = "password";

//            var validate = "";
//            if (_base.Viewer().Page().FieldOption(_base.Field(), "validator"))
//                validate = '<td id="validate' + _base.ID() + '" style="min-width: 50px;"></td>';

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50%; padding-right: 10px; vertical-align: top;"><input type="' + type + '" id="ctl' + _base.ID() + '" style="width: 100%;"></input></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                //Setup the textbox.
                cont.attr("maxlength", _base.Field().Size);

                if(type == "password")
                    cont.attr("autocomplete", "new-password");

            });
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input>')
            .appendTo(container)
            .val(value_)
            .attr("maxlength", _base.Field().Size)
            .addClass("ui-widget ui-widget-content ui-corner-left")
	        .css("width", "80%")
	        .css("width", "calc(100% - 2px)");

            //Call base method.
            return _base.CreateList(container, cont, value_);
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
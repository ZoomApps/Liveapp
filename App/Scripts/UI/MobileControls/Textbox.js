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

            //Create the control.
            var container = $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label><input type="'+type+'" id="ctl' + _base.ID() + '" value="">');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                cont.textinput();

                //Setup the textbox.
                cont.attr("maxlength", _base.Field().Size);

                if (_base.Field().Editable == false) {                    
                    cont.css("color", "#000");
                }
            });
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
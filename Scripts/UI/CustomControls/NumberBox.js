/// <reference path="../Application.js" />

Define("NumberBox",

    function (field_, viewer_) {
        return new Control("NumberBox", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("NumberBox");
        };

        this.CreateMobile = function (window_) {

            //Create the control.
            var container = $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label><input type="number" data-clear-btn="false" id="ctl' + _base.ID() + '" value="">');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                cont.textinput();

                //Setup the textbox.
                cont.attr("maxlength", _base.Field().Size);

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

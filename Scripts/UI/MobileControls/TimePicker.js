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
            var container = $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label><div class="ui-input-text ui-shadow-inset ui-corner-all ui-btn-shadow ui-body-a"><input type="text" id="ctl' + _base.ID() + '" value=""></div>');

            var mode = "timebox";
            if (_base.Field()) {
                mode = Default(Application.OptionValue(_base.Field().Options, "mode"), "timebox");
            }

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                cont.unbind("focus").unbind("blur");

                cont.datebox({
                    mode: mode,
                    useFocus: true,
                    useClearButton: true,
                    theme: "a",
                    minuteStep: 1,
                    popupPosition: 'window'
                });

            });
        };

        //#endregion

        //#region Overloaded Methods

        this.Update = function (rec_) {

            Application.LogInfo("Updating mobile control: " + _base.ID() + ", Caption: " + _base.Field().Caption);

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') {
                _self.Loaded(true);
                return;
            }

            _base.Control().val($.format.date(value, 'hh:mm a'));

            _self.Loaded(true);
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
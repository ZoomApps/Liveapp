/// <reference path="../Application.js" />

Define("Spinner",

    function (field_, viewer_) {
        return new Control("Spinner", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_lastValue = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Spinner");
        };

        this.Create = function (window_) {

            //Create the control.
            var container = $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label><div class="ui-input-text ui-shadow-inset ui-corner-all ui-btn-shadow ui-body-a"><input type="number" id="ctl' + _base.ID() + '" value="0"></div>');

            //Call base method.
            _base.Create(window_, container, null, function (cont) {
                cont.spinbox({
                    step: parseFloat(_base.Field().IncrementDelta),
                    repButton: true
                });
                cont.change(app_debouncer(function () {
                    cont.focus(true); //Issue #18 - Focus on input box.
                    if (cont.val() == m_lastValue)
                        return;
                    m_lastValue = cont.val();
                    _self.OnValueChange(_base.Field().Name, cont.val());
                }, 1000));
            });
        };

        this.Update = function (rec_) {

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') {
                _self.Loaded(true);
                return;
            }

            if (value == null)
                value = 0;
            _base.Control().val(value);
            _self.Loaded(true);
        };

        this.SetupTest = function () {
            _base.Field().IncrementDelta = 1;
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
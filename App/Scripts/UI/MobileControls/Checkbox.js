/// <reference path="../Application.js" />

Define("Checkbox",

    function (field_, viewer_) {
        return new Control("Checkbox", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Checkbox");
        };

        this.Create = function (window_) {

            //Create the control.
            var container = $('<label><input id="ctl' + _base.ID()+ '" type="checkbox" class="filled-in" /><span id="lbl' + _base.ID() + '"></span></label>');                                            

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                cont.unbind("change");
                cont.unbind("focus");
                cont.change(function () {
                    if (_base.Loaded() == false)
                        return;
                    _base.Viewer().XFocusControl(cont);
                    _self.OnValueChange(_base.Field().Name, _base.Control().is(":checked"));
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
            
            if(_base.Control().length > 0)
                _base.Control()[0].checked = value;

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

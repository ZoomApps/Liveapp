/// <reference path="../Application.js" />

Define("GoogleMap",

    function (field_, viewer_) {
        return new Control("GoogleMap", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_loaded = false;
        var m_address = "";

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("GoogleMap");
        };

        this.CreateMobile = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="padding: 15px;"><a id="btn' + _base.ID() + '" data-role="button" data-icon="location" data-theme="c" data-inline="true">View Map</a></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                $('#btn' + _base.ID()).bind("click", function () {

                    _self.OpenMap();

                }).buttonMarkup({ icon: "location" });
            });
        };

        this.OpenMap = function () {
            window.open('http://maps.google.com.au/maps?q=' + m_address);
        };

        this.Update = function (rec_) {

            if (!Application.IsInMobile())
                return _base.Update(rec_);

            Application.LogInfo("Updating control: " + _base.ID() + ", Caption: " + _base.Field().Caption);

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') {
                _self.Loaded(true);
                return;
            }

            m_address = value;
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
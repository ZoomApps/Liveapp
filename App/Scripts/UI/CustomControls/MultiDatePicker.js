/// <reference path="../Application.js" />

Define("MultiDatePicker",

    function (field_, viewer_) {
        return new Control("MultiDatePicker", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("MultiDatePicker");
        };

        this.CreateDesktop = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50%; padding-right: 10px;"><input type="text" id="ctl' + _base.ID() + '" style="width: 100%;"></input></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                //Setup MultiDatePicker.
                cont.multiDatesPicker({
                    showOn: "none",
                    showButtonPanel: true,
                    changeMonth: true,
                    changeYear: true,
                    dateFormat: ("%LANG:FORMAT_SHORTDATE%").toLowerCase(),
                    onClose: function (d) {
                        _self.OnValueChange(_base.Field().Name, d);
                    }
                });
                cont.click(function () {
                    cont.multiDatesPicker('show');
                });                

                $("#ui-datepicker-div").addClass("ui-custom-combo");

            });
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input>')
            .appendTo(container)
            .multiDatesPicker({
                showButtonPanel: true, 
                changeMonth: true, 
                changeYear: true,
                dateFormat: ("%LANG:FORMAT_SHORTDATE%").toLowerCase()
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

            value = Default(value, "");
            _base.Control().multiDatesPicker("value", value)

        };

        this.Loaded = function (value_) {

            if (value_ !== undefined) { //SET

                _base.Loaded(value_);
                this.HideDropdown();

            } else { //GET

                return _base.Loaded();

            }

        };

        this.HideDropdown = function () {
            //_base.Control().multiDatesPicker("hide");
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
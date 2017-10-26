/// <reference path="../Application.js" />

//27/01/15      Issue #12       PF      Add month and year dropdowns.

Define("DatePicker",

    function (field_, viewer_) {
        return new Control("DatePicker", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("DatePicker");
        };

        this.Create = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50%; padding-right: 10px; vertical-align: top;"><input type="text" id="ctl' + _base.ID() + '" style="width: 100%;"></input></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                var yearrange = Application.OptionValue(_base.Field().Options,'yearrange');
                if(yearrange)
                    yearrange = yearrange.replace('|',':');
                
                //Setup datepicker.
                cont.datepicker({
                    showOn: "none",
                    showButtonPanel: true, //Issue #12 
                    changeMonth: true, //Issue #12 
                    changeYear: true, //Issue #12 
                    yearRange: Default(yearrange,'c-10:c+10')
                }); //Don't show on focus.
                cont.click(function () {
                    cont.datepicker('show');
                });

                //Setup the date format from lang file.
                cont.datepicker("option", "dateFormat", ("%LANG:FORMAT_SHORTDATE%").toLowerCase());

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
            .datepicker({
                showButtonPanel: true, //Issue #12 
                changeMonth: true, //Issue #12 
                changeYear: true //Issue #12 
            })
            .addClass("ui-widget ui-widget-content ui-corner-left")
	        .css("width", "80%")
	        .css("width", "calc(100% - 2px)");

            cont.datepicker("option", "dateFormat", ("%LANG:FORMAT_SHORTDATE%").toLowerCase());
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

			if(typeof value == "string")
				value = Application.ParseDate(value);			
			
            _base.Control().datepicker("setDate", value)

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
            //_base.Control().datepicker("hide");
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
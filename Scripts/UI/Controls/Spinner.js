/// <reference path="../Application.js" />

Define("Spinner",

    function (field_, viewer_) {
        return new Control("Spinner", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_val = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Spinner");
        };

        this.Create = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50%; padding-right: 10px; vertical-align: top;"><input type="text" id="ctl' + _base.ID() + '" style="width: 100%;"></input></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                var align = "right";

                //Setup the spinner.
                cont.spinner({
                    step: _base.Field().IncrementDelta,
                    numberFormat: _base.Field().Mask,
                    alignment: align
                });
                cont.blur(function () {
                    if (cont.val() != m_val)
                        _self.OnValueChange(_base.Field().Name, cont.val());
                });
                cont.removeClass("app-control");
                $(".ui-spinner").addClass("app-control").addClass("app-spinner");
            });
        };

        this.CreateList = function (value_) {

            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input>')
            .appendTo(container)
            .val(value_)
            .spinner({
                step: _base.Field().IncrementDelta,
                numberFormat: _base.Field().Mask
            })
            .addClass("ui-widget ui-widget-content ui-corner-left")
	        .css("width", "80%")
	        .css("width", "calc(100% - 2px)");

            cont.on("blur", function () {
                if (value_ && $(this).val() == value_.toString())
                    return;
                var grd = _base.Viewer().GetPageGrid();
				if(grd)
					grd.Save();
            });
			
            //Call base method.
            return _base.CreateList(container, cont, value_);
        };

        this.SetupTest = function () {
            _base.Field().IncrementDelta = 1;
        };

        //#endregion

        //#region Overrideable Methods

        this.Update = function (rec) {
            _base.Update(rec);
            m_val = _base.Control().val();
        };

        this.SetSize = function (width, height) {
            _base.Container().width(width);
            _base.Control().width((width / 2) - 40);
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
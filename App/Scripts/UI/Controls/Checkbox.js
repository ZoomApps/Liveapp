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
            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 100%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50px; padding-right: 10px; text-align: right; vertical-align: top;"><input type="checkbox" id="ctl' + _base.ID() + '" style=""></input></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function(cont){
				cont.unbind("change");
				cont.change(function () {
                    if (_base.Loaded() == false)
                        return;
                    if(_base.Viewer())
                        _base.Viewer().XFocusControl(cont);
                    _self.OnValueChange(_base.Field().Name, cont[0].checked);
                });
			});
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input type="checkbox">')
            .appendTo(container)
            .val(value_)            

            //Call base method.
            return _base.CreateList(container, cont, value_);
        };

        //#endregion

        //#region Overloaded Methods

        this.SetSize = function (width, height) {
            //Only set container width.
            _base.Container().width(width);
        };
		
		this.Update = function (rec_) {

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined')
                return;

            _base.Control()[0].checked = value;
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
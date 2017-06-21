/// <reference path="../Application.js" />

Define("Drilldown",

    function (field_, viewer_) {
        if(field_)
        field_.Enabled = false;
        return new Control("Drilldown", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Drilldown");
        };

        this.FormatValue = function (value_, cont_) {

            var value = "";
            try {
                value = $.base64.decode(value_);
            } catch (e) {
            }

            //Remove control chars
            value = value.replace(/[\n\r\t\0\f\v]/g, '');

            value = value.split("~");

            if (value.length != 4) return "";

            var link = Application.StrSubstitute("Application.App.LoadPage(\"$1\",\"$2\",null,$3);", value[1], value[2].replace('\\', '\\\\'), _base.Viewer().ParentWindow().ID());
            var cont = "<center><a onclick='$1' style='cursor: pointer; text-decoration: underline; color: black;'>$2</a></center>";

            if (value[0] == "") return "";

            if (value[3].indexOf("b") == -1) {
                return Application.StrSubstitute(cont, link, value[0]);
            } else {
                return Application.StrSubstitute(cont, link, "<b>" + value[0] + "</b>");
            }
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input>')
            .appendTo(container)
            .addClass("ui-widget ui-widget-content ui-corner-left")
	        .css("width", "80%")
	        .css("width", "calc(100% - 2px)");

            cont.val(_self.FormatValue(value_));

            //Call base method.
            return _base.CreateList(container, cont, value_);
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
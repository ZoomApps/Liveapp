/// <reference path="../Application.js" />

Define("ColorPicker",

    function (field_, viewer_) {
        return new Control("ColorPicker", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("ColorPicker");
        };

        this.CreateDesktop = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50%; padding-right: 10px; vertical-align: top;"><input id="ctl' + _base.ID() + '" class="simple_color" style="width: 100px; display: inline-block;"></td></tr></table></div>');

            var colours;
            var colcount;
            if (Application.HasOption("ColorPicker_Dark", _base.Field().Options)) {
                colours = darkcolours();
                colcount = 8;
            }

            //Call base method.
            _base.Create(window_, container, function(col,value){
                _base.Control().setColor(value);            
                _self.OnValueChange(col,value);
            }, function (cont) {
                cont.simpleColor({
                    colors: colours,
                    columns: colcount,
                    chooserCSS: {
                        'z-index': 30005
                    }
                });
            });
        };

        this.CreateMobile = function (window_, form_) {
            
            //Create the control.
            var container = $('<label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="font-weight: bold"></label><input id="ctl' + _base.ID() + '" class="simple_color" style="width: 100px; display: inline-block;">');

            var colours;
            var colcount;
            if (Application.HasOption("ColorPicker_Dark", _base.Field().Options)) {
                colours = darkcolours();
                colcount = 8;
            }

            //Call base method.
            _base.Create(window_, container, function(col,value){
                _base.Control().setColor(value);            
                _self.OnValueChange(col,value);
            }, function (cont) {
                cont.textinput();
                cont.simpleColor({
                    colors: colours,
                    columns: colcount,
                    chooserCSS: {
                        'z-index': 30005
                    }
                });
            });

		};

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");
            var cont = $('<input class="simple_color" style="display: none; background-color: white; color: white;">').appendTo(container)
            .val(value_);
            var colours;
            var colcount;
            if (_base.Viewer().Page().FieldOption(_base.Field(), "ColorPicker_Dark")) {
                colours = darkcolours();
                colcount = 8;
            };
            setTimeout(function () {
                cont.simpleColor({
                    colors: colours, 
                    columns: colcount,                    
                    chooserCSS: {
                        'z-index': 30005
                    },
                    onSelect: function (hex, element) {
                        _base.Viewer().Save();
                    }
                });
                $(".simpleColorDisplay").trigger("click");
            }, 5);
            //Call base method.
            return _base.CreateList(container, cont, value_);
        };

        function darkcolours() {
            return [
			'000080', '0000CD', '0000FF', '006400', '008000', '008080', '008B8B', '00BFFF',
			'00CED1', '00FF00', '00FF7F', '00FFFF', '1E90FF', '20B2AA', '228B22', '2E8B57',
			'2F4F4F', '32CD32', '3CB371', '40E0D0', '4169E1', '4682B4', '483D8B', '48D1CC',
			'4B0082', '556B2F', '5F9EA0', '6495ED', '66CDAA', '696969', '6A5ACD', '6B8E23',
			'708090', '778899', '7B68EE', '7CFC00', '7FFFD4', '9ACD32', 'ADFF2F', '8FBC8F',
			'90EE90', '87CEEB', 'ADD8E6', 'AFEEEE', '800000', '800080', '808000', '808080',
			'8A2BE2', '8B0000', '8B008B', '8B4513', '9370DB', '9400D3', 'A52A2A', 'A9A9A9',
			'B22222', 'B8860B', 'BA55D3', 'BC8F8F', 'BDB76B', 'C71585', 'CD5C5C', 'CD853F',
			'D2691E', 'D2B48C', 'DA70D6', 'DAA520', 'DB7093', 'DC143C', 'DDA0DD', 'DEB887',
			'E9967A', 'EE82EE', 'F08080', 'F4A460', 'FA8072', 'FF0000', 'FF00FF', 'FF00FF',
			'FF1493', 'FF4500', 'FF6347', 'FF69B4', 'FF7F50', 'FF8C00', 'FFA07A', 'FFA500'
			];
        };

        //#endregion

        //#region Overloaded Methods

        this.Update = function (rec_) {

            var value = rec_[_base.Field().Name];            
            if (typeof value == 'undefined'){
                _base.Loaded(true);
                return;
            }

            _base.Control().val(value);
            _base.Control().setColor(value); 
            _base.Loaded(true);           
        };

        //#endregion

        //#region Overrideable Methods

        this.SetSize = function (width, height) {
            _base.Container().width(width);
            //m_control.width((width / 2) - 18);
        };

        this.FormatValue = function (value_, cont_) {

            try {
                value_ = $(value_)[0].firstChild.innerHTML;
            } catch (e) {
            }
            var val = Default(value_, 'White');
            var cont = "<center><div class='cp' style='width: 90%; height: 90%; background-color: $1; color: $1; border: 2px solid gray; -moz-border-radius: 5px; -webkit-border-radius: 5px; -khtml-border-radius: 5px; border-radius: 5px; font-size: 1; cursor: pointer'>" + val + "</div></center>";
            return Application.StrSubstitute(cont, val);
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
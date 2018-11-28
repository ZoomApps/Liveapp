/// <reference path="../Application.js" />

Define("NotesBox",

    function (field_, viewer_) {
        return new Control("NotesBox", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var showlabel = true;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("NotesBox");
        };

        this.CreateDesktop = function (window_) {

            //Create the control.
			Application.RunSilent(function(){
				if (_base.Viewer().Page().FieldOption(_base.Field(), "hidelabel"))
					showlabel = false;
			});
            var rows = Default(Application.OptionValue(_base.Field().Options, "rows"), 1);
            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td id="lbltd' + _base.ID() + '" style="width: 50%; vertical-align: top"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td id="ctltd' + _base.ID() + '" style="width: 50%; padding-right: 10px;"><textarea id="ctl' + _base.ID() + '" style="width: 100%;" rows="' + rows + '"></textarea></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.FixValue, function (cont) {

                if (showlabel == false) {
                    $("#lbltd" + _base.ID()).hide();                    
                    $("#ctltd" + _base.ID()).css("width", "100%").css("padding-left","6px");
                }

                //Setup the textbox.
                var size = Default(_base.Field().Size,0);
                if (size == 0)
                    size = 1000000;
                cont.attr("maxlength", size);

            });
        };

        this.CreateMobile = function (window_) {

            //Create the control.
            var rows = Default(Application.OptionValue(_base.Field().Options, "rows"), 1);
            var container = $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label><textarea cols="40" rows="'+rows+'" id="ctl' + _base.ID() + '"></textarea>');

            //Call base method.
            _base.Create(window_, container, _self.FixValue, function (cont) {

                cont.textinput();

                //Setup the textbox.
                if (_base.Field().Size > 0) {
                    cont.attr("maxlength", _base.Field().Size);
                }

                if (_base.Field().Editable == false) {
                    cont.css("color", "#000");
                }
            });
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input>')
            .appendTo(container)
            .val(value_)
            .attr("maxlength", _base.Field().Size)
            .attr("skipSelect", true) //Set this as we don't want to select the "base control"
            .focus(function (e) {
                CreateTextarea(cont);
            })
            .change(function () {
                $('#notes' + _base.ID()).val($(this).val());
                $('#notes' + _base.ID()).select();
            })
            .addClass("ui-widget ui-widget-content ui-corner-left")
	        .css("width", "80%")
	        .css("width", "calc(100% - 2px)");

            //Call base method.
            return _base.CreateList(container, cont, value_);
        };

        //#endregion

        //#region Private Methods

        function CreateTextarea(cont) {

            var val = cont.val();
            if (val != null)
                val = val.replace(/\<br\>/g, '\r\n');

            var txt = $('<textarea id="notes' + _base.ID() + '" rows="10" cols="50">')
            .css("position", "absolute")
            .css("left", cont.offset().left)
            .css("top", cont.offset().top)
            .appendTo("body")
            .val(val)
            .attr("maxlength", _base.Field().Size)
            .blur(function (ev) {				
                ReturnFocus(this);
            })
            .resizable({
                handles: "se"
            })
            .keydown(function (ev) {
                if (ev.keyCode === 27 || ev.keyCode === 9) {
                    ReturnFocus(this, ev);
                    ev.preventDefault();
                    return false;
                }
            })
            .addClass("ui-widget ui-widget-content ui-corner-left");
			
		setTimeout(function(){
			txt.select();
		},500); //Set timeout for Edge compat.

            function ReturnFocus(editor_, ev_) {

                if (ev_ == null) {
                    ev_ = jQuery.Event("keydown");
                    ev_.ctrlKey = false;
                    ev_.keyCode = 13;
                }

                var val = $(editor_).val();
                if (val != null)
                    val = val.replace(/(?:\r\n|\r|\n)/g, '<br>');

                if (ev_.keyCode != 27) {

                    cont.val(val);
                    cont.change();
                }

                if (_base.Viewer().Type() == "List")
                    cont.trigger(ev_);

                $(editor_).remove();
            }
        };

        //#endregion

        //#region Overrideable Methods

        this.Update = function (rec_) {
                
            Application.LogInfo("Updating control: " + _base.ID() + ", Caption: " + _base.Field().Caption);

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') {
                _self.Loaded(true);
                return;
            }	
            
			if(rec_[_base.Field().Name] && Application.HasOption(_base.Field().Options,"hashtml"))
				rec_[_base.Field().Name] = Application.DecodeHTML(rec_[_base.Field().Name]);
        
            if (value != null){
                value = value.replace(/\<br\>/g, '\r\n');
                if (!Application.IsInMobile()){
                    _base.Control().val($.fn.fmatter(_base.Field().Mask, value));
                }else{
                    _base.Control().val(value);
                }
            }

            if (Application.IsInMobile())
                Application.RunNext(function () {
                    _base.Control().keyup();
                });                                             							            						            

            _self.Loaded(true);
        };

        this.FixValue = function (name, value) {

            if (value != null)
                value = value.replace(/(?:\r\n|\r|\n)/g, '<br>');

            _self.OnValueChange(name, value);
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        this.SetSize = function (width, height) {
            if (showlabel == false) {
                _base.Container().width(width);
                _base.Control().css("width", width - 30);
            } else {
                _base.SetSize(width, height);
            }
        };

        //#endregion

        //Constructor
        this.Constructor();

    });

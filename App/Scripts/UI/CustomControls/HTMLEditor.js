/// <reference path="../Application.js" />

Define("HTMLEditor",

    function (field_, viewer_) {
        return new Control("HTMLEditor", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_okClicked = false;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("HTMLEditor");
        };

        this.CreateDesktop = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '"><table style="width: 100%"><tr><td id="ctltd' + _base.ID() + '" style="width: 100%; padding-right: 10px;"><div id="ctl' + _base.ID() + '" style="width: 100%;"></div></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {
                cont.trumbowyg({
                    svgPath: Application.url+'Images/trumbowyg/icons.svg',
                    btnsDef: {
                        save: {
                            fn: function() {
                                _self.OnValueChange(_base.Field().Name,cont.html());
                            },
                            title: 'Save HTML',
                            text: 'Save',
                            ico: 'save'   
                        }
                    },
                    btns: [
                        ['viewHTML'],                        
                        ['formatting'],
                        ['fontfamily','fontsize','foreColor', 'backColor'],
                        ['strong', 'em', 'del'],
                        ['superscript', 'subscript'],
                        ['link'],
                        ['table'],
                        ['insertImage'],
                        ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
                        ['unorderedList', 'orderedList'],
                        ['horizontalRule'],                        
                        ['removeformat'],
                        ['fullscreen'],
                        ['save']
                    ]
				});		
				cont.on("tbwblur",function(){					
					_self.OnValueChange(_base.Field().Name,cont.html());
				});
            });
        };

        this.CreateMobile = function (window_) {
            return _self.CreateDesktop(window_);
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input>')
            .appendTo(container)
            .val(value_)
            .attr("skipSelect", true) //Set this as we don't want to select the "base control"
            .focus(function (e) {
                CreateTextarea(cont);
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
            
            var boxy = new Boxy('<div id="html' + _base.ID() + '" style="padding: 10px; width: 100%;">'+val+'</div>', {
                title: "Edit HTML",
                closeText: "X",
                modal: true,
                unloadOnHide: true,
                show: false,
                beforeHide: function (closeclicked) {
                    if (closeclicked)
                        m_okClicked = false;
                    if (m_okClicked)
                        cont.val($('#html' + _base.ID()).html());
                },
                toolbar: "<a id='okbtn" + _base.ID() + "' style='float: right; font-size: 11pt; width: 100px; margin: 10px;'>OK</a>"
            });

            boxy.center();
            boxy.show();
            boxy.tween(UI.Width() / 2, UI.Height() / 2);

            $("#okbtn" + _base.ID()).button().click(function () {
                m_okClicked = true;
                boxy.hide();
            });

            $('#html' + _base.ID()).css("display","").trumbowyg({
                svgPath: Application.url+'Images/trumbowyg/icons.svg',
                btnsDef: {
                    save: {
                        fn: function() {
                            _self.OnValueChange(_base.Field().Name,cont.html());
                        },
                        title: 'Save HTML',
                        text: 'Save',
                        ico: 'save'   
                    }
                },
                btns: [
                    ['viewHTML'],                        
                    ['formatting'],
                    ['fontfamily','fontsize','foreColor', 'backColor'],
                    ['strong', 'em', 'del'],
                    ['superscript', 'subscript'],
                    ['link'],
                    ['table'],
                    ['insertImage'],
                    ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
                    ['unorderedList', 'orderedList'],
                    ['horizontalRule'],                        
                    ['removeformat'],
                    ['fullscreen'],
                    ['save']
                ]
            });
        };

        //#endregion

        //#region Overrideable Methods

		this.SetSize = function(w){
			_base.Container().width("100%");
		};
		
        this.Update = function (rec_) {
            
            Application.LogInfo("Updating control: " + _base.ID() + ", Caption: " + _base.Field().Caption);
            
			var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') {
                _self.Loaded(true);
                return;
            }					

			_base.Control().html(value);			

            _self.Loaded(true);
        };
		
		 this.IgnoreColumns = function () {
            return true;
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
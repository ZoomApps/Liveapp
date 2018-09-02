/// <reference path="../Application.js" />

Define("Combobox",

    function (field_, viewer_) {
        return new Control("Combobox", field_, viewer_);
    },

    function (field_) {

        //#region Members

        var _self = this;
        var _base = null;
        var m_button = null;
        var m_cols = [];
        var m_values = null;
        var m_data = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function (field_) {

            if (Application.testMode && arguments[0] == null) return;

            //Setup _base.            
            _base = Base("Combobox");

            field_.OptionCaption = Default((field_.OptionCaption == '' ? null : field_.OptionCaption), field_.OptionString);

            //Create option combo.
            if (field_.OptionString != "") {

                m_values = new Array();
                var vals = field_.OptionString.split(",");
                var captions = field_.OptionCaption.split(",");
                var colname = field_.Caption;

                for (var i = 0; i < vals.length; i++) {
                    var item = new Object();
                    item.Display = captions[i];
                    if (field_.Type == "Integer") {
                        item[colname] = parseInt(vals[i]);
                    } else {
                        item[colname] = vals[i];
                    }
                    m_values.push(item);
                }

                m_cols.push({ name: colname, width: '230px', valueField: "Display" });
                return;
            }

            field_.LookupColumns = Default((field_.LookupColumns == '' ? null : field_.LookupColumns), field_.LookupField);
            field_.LookupColumnCaptions = Default((field_.LookupColumnCaptions == '' ? null : field_.LookupColumnCaptions), field_.LookupColumns);

            var vals = field_.LookupColumns.split(",");
            var captions = field_.LookupColumnCaptions.split(",");

            //Create columns.        
            for (var i = 0; i < vals.length; i++) {

                var w = '100px';
                if (captions[i] == "City" || captions[i] == "Name" || captions[i] == "Description") {
                    w = '300px';
                }

                //Custom width.
                var width = Application.OptionValue(field_.Options, vals[i] + "Width");
                if (width)
                    w = width;

                m_cols.push({ name: Application.ProcessCaption(captions[i]), width: w, valueField: vals[i] });
            }
        };

        this.Create = function (window_) {

            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctrl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50%; padding-right: 10px; text-align: left; vertical-align: top;"><input type="text" id="ctl' + _base.ID() + '" style="width: 100%;"></input><button id="btn' + _base.ID() + '" type="button" style="display: none;">&nbsp;</button></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                //Setup combo.
                cont.mcautocomplete(GenerateOptions());
                cont.on("click", function () {
                    if (_base.Field().Editable == false)
                        return;
                    if (_base.Control().mcautocomplete("widget").is(":visible")) {
                        _base.Control().mcautocomplete("close");
                        return;
                    }
                    //$(this).blur();
                    _base.Control().mcautocomplete("search", "");
                    _base.Control().focus();
                });

                m_button = CreateDropdownButton($("#ctrl" + _base.ID() + "cont"));
            });
        };

        this.CreateList = function (value_,hidebutton_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input>')
            .val(value_)
            .appendTo(container)
            .mcautocomplete(GenerateOptions())
            .addClass("ui-widget ui-widget-content ui-corner-left")
	        .css("width", "80%")
	        .css("width", "calc(100% - 18px)");

			if(!hidebutton_){
				if (!Application.HasOption(_base.Field().Options, "menu")) {
					m_button = CreateDropdownButton(container);
				} else {
					cont.mcautocomplete("search", "");
					cont.css("visibility", "hidden");
					container.append("<span id='mnu" + _base.ID() + "'>" + value_ + "</span>");
				}
			}

            //Call base method.
            return _base.CreateList(container, cont, value_);
        };

        //#endregion

        //#region Private Methods

        function GenerateOptions() {

            var options = new Object();

            var viewer = _base.Viewer();
            var field = _base.Field();

            if (!viewer)
                return;

            //Default options.
            options.showHeader = true;
            options.autoFocus = true;
            options.columns = m_cols;
            options.minLength = 0;
            options.delay = 300;
            options.drilldown = field.LookupAdvanced;
			var filters = field.LookupFilters;
			if(typeof filters == "function")
				filters = field.LookupFilters();
            options.drilldownview = filters; //#44 - Apply lookup view
            options.menu = Application.HasOption(_base.Field().Options, "menu");
            options.drillheight = Application.OptionValue(_base.Field().Options, "drillheight");

            options.allowdelete = false;
            if (Application.HasOption(field.Options, "allowdelete"))
                options.allowdelete = true;

            options.select = function (event, ui) {

                //Skip if we are not loaded.
                if (viewer.Type() == "Card" && _base.Loaded() == false)
                    return false;
					
				if(viewer.ComboSelected)
					viewer.ComboSelected(true);

                //Option combo.
                if (m_values != null) {

                    this.value = (ui.item ? ui.item.Display : '');

                } else {

                    if(ui.item.NewRecordRow === true){
                        var newpage = Application.OptionValue(field.Options,"addnewpage");
                        if(newpage)
                            Application.RunNext(function () {
                                return $codeblock(
                                    function () {                                                
                                        var form = new PageViewer({
                                            id: newpage,
                                            view: Application.MergeView(field.LookupFilters,_base.Viewer().Record()),
                                            mode: "New",
                                            dialog: true
                                        });                            
                                        form.CloseFunction(function () {                                            
                                            var rec = form.Record();
                                            if(rec.Record.NewRecord === false){    
                                                if (field.LookupDisplayField != ""){
                                                    _base.Viewer().RecordValidate(field.Name,rec[field.LookupDisplayField]);
                                                }else{
                                                    _base.Viewer().RecordValidate(field.Name,rec[field.LookupField]);
                                                }
                                            }
                                        });                                    
                                        return form.Open();
                                    }			
                                );
                            });
                        return false;
                    }

                    if (typeof ui.item.DisplayCol == 'undefined') { //Made a selection

                        if (m_data) {
                            var f = field.LookupField;
                            if (field.LookupDisplayField != "")
                                f = field.LookupDisplayField;

                            var found = false;
                            for (var i = 0; i < m_data.length; i++) {
                                if (m_data[i][f] == this.value) {
                                    ui.item[field.LookupField] = m_data[i][field.LookupField];
                                    if (field.LookupDisplayField != "")
                                        ui.item[field.LookupDisplayField] = m_data[i][field.LookupDisplayField];
                                    found = true;
                                    break;
                                }
                            }

                            if (!found) {
                                for (var i = 0; i < m_data.length; i++) {
                                    if (m_data[i][f].toLowerCase().indexOf(this.value.toLowerCase()) != -1) {
                                        ui.item[field.LookupField] = m_data[i][field.LookupField];
                                        if (field.LookupDisplayField != "")
                                            ui.item[field.LookupDisplayField] = m_data[i][field.LookupDisplayField];
                                        break;
                                    }
                                }
                            }
                        }
                    }
					
					if (field.LookupDisplayField != "") {
                        if(ui.item && !ui.item.BlankRow)
                            this.value = (ui.item ? ui.item[field.LookupDisplayField] : '');                           		
						if(_base.Viewer().Record){
							var rec = _base.Viewer().Record();
							rec["FF$" + field.Name] = ui.item[field.LookupDisplayField];
							rec.SaveCurrent(null,true);
							rec[field.Name] = ui.item[field.LookupField];
						}else if(_base.Viewer().GetOptions){
							var rec = _base.Viewer().GetOptions();
							rec["FF$" + field.Name] = ui.item[field.LookupDisplayField];							
							rec[field.Name] = ui.item[field.LookupField];
							_base.Viewer().SetOptions(rec);
						}
					} else {
                        if(ui.item && !ui.item.BlankRow)
                            this.value = (ui.item ? ui.item[field.LookupField] : '');                        
					}
                }

                if (viewer.Type() == "Card") {
                    viewer.XFocusControl(_base.Control());
                    _self.OnValueChange(field.Name, this.value);
                }

                if (Application.HasOption(_base.Field().Options, "menu")) {
                    $("#mnu" + _base.ID()).remove();
                    _base.Container().append("<span id='mnu" + _base.ID() + "'>" + this.value + "</span>");
                    if (viewer.Type() == "List" && viewer.GetPageGrid())
                        viewer.GetPageGrid().Save();
                }

                return false;
            }

            //Dropdown source.
            options.source = function (request, response) {

				if(request.term == "" && Application.HasOption(_base.Field().Options,"skipload"))
					return;
			
                //Option combo.
                if (m_values != null) {
                    var vals = new Array();
                    for (var i = 0; i < m_values.length; i++)
                        if (m_values[i].Display.toLowerCase().indexOf(request.term.toLowerCase()) != -1)
                            vals.push(m_values[i]);
                    response(vals);
                    return;
                }

                //Cancel the prev request.
                var $this = $(this);
                var $element = $(this.element);
                var previous_request = $element.data("jqXHR");
                if (previous_request) {
                    previous_request.abort();
                }

                var view = viewer.View();

                $thread(function () {
                    return Application.LookupRecord(field, viewer, request.term, function (vals) {
                        m_data = vals;
                        response(vals);
                    });
                });
            }

            return options;
        };

        function CreateDropdownButton(parent_) {

            var btn = $("<a>")
	        .attr("tabIndex", -1)
	        .attr("title", "Show All Items")
	        .appendTo(parent_)
            .width(15)
            .height('90%')
	        .button({
	            icons: {
	                primary: "ui-icon-triangle-1-s"
	            },
	            text: false
	        })
	        .removeClass("ui-corner-all")
	        .addClass("ui-corner-right ui-button-icon ui-combobox-button")
	        .click(function () {
	            if (_base.Field().Editable == false)
	                return;
	            if (_base.Control().mcautocomplete("widget").is(":visible")) {
	                _base.Control().mcautocomplete("close");
	                return;
	            }
	            $(this).blur();
	            _base.Control().mcautocomplete("search", "");
	            _base.Control().focus();
	        });

            return btn;
        };

        //#endregion

        //#region Overloaded Methods

        this.SetSize = function (width, height) {
            _base.Container().width(width);
            if (_base.Viewer().Type == "List") {
                _base.Control().width((width / 2) - m_button.width() - 15);
            } else {
                _base.Control().width((width / 2) - 18);
            }
        };

        this.Update = function (rec_) {

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') //Issue #47 - Combo box does not display null value
                return;

            //Options combo.
            if (m_values != null) {
                var vals = _base.Field().OptionString.split(",");
                var captions = _base.Field().OptionCaption.split(",");
                for (var i = 0; i < vals.length; i++) {
                    if (vals[i] == value)
                        _base.Control().val(captions[i]);
                }
            } else {
                if (_base.Field().LookupDisplayField != "") {
					if(rec_.Record){
						for (var i = 0; i < rec_.Record.Fields.length; i++) {
							if (rec_.Record.Fields[i].Name == "FF$" + _base.Field().Name) {
								_base.Control().val(rec_.Record.Fields[i].Value);
								return;
							}
						}
					}else{
						_base.Control().val(rec_["FF$" + _base.Field().Name]);
						return;
					}
                }
                _base.Control().val(value);
            }
        };

        this.Enabled = function (value_, update_) {

            _base.Enabled(value_, update_);
            if (value_ == false) {
                m_button.hide();
            } else {
                m_button.show();
            }
        };

        //#endregion

        //#region Overrideable Methods

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor(field_);

    });
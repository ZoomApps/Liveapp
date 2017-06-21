/// <reference path="../Application.js" />

Define("OptionsWindow", null, function (options_) {

    //#region Members

    var _self = this;
    var m_loaded = false;
    var m_window = null; //Window
    var m_openedFrom = null; //PageViewer
	var m_closeFunc = null;
    var m_okClicked = false;
	var m_options = null; //Options
	
	//Option Members
    var m_record = new Object();    
    var m_controls = []; 
	var m_fields = [];
	
	//Filter Members
	var m_filterContainer = null;
	var m_filters = new Object();
	var m_page = null; //Page
    var m_table = null; //Table
    var m_view = null;
	var m_editors = []; //Controls
	var m_filterControls = []; //Controls

    //#endregion

    //#region Public Functions

    this.Constructor = function (options_) {
        
		if (Application.testMode && arguments[0] == null) return;
        
		m_options = options_;
		
		//Filtering
		m_page = options_.page;
        m_view = options_.view;
    };

    this.Open = function (parent_) {

        return $codeblock(

            function (obj) {

                if (!m_options.icon) {
                    m_options.icon = "window";
                }

                var uid = $id();

                //Create the window.
                m_window = new Window();
                m_window.Create('', {
                    closebutton: true,
                    workspace: $("#AppWorkspace"),
                    shortcutWorkspace: $("#AppWindows"),
                    dialog: true
                });

                m_options.caption = Default(m_options.caption, "Options");
				m_options.showclose = Default(m_options.showclose,false);
                m_window.SetTitle(m_options.caption);

                //Override window methods.
                m_window.OnError = _self.OnError;
                m_window.OnKeyPress = _self.OnKeyPress;
                m_window.OnClose = _self.OnClose;
                m_window.Update = _self.Update;
                m_window.OnBeforeClose = _self.OnBeforeClose;
                m_window.OnSave = null;
				m_window.OnShow = _self.OnShow;

                //Add the window to the manager and open it.
                UI.WindowManager.Add(m_window);
                m_window.Show();
				UI.WindowManager.SelectedWindow(m_window);
				UI.WindowManager.FocusWindow(m_window.ID());

                m_window.Viewer = function () {
                    return _self;
                };

                //Set the window UID.
                m_window.UID(uid);

                m_window.ShowLoad();

                if (parent_) {
                    m_openedFrom = parent_;
                    parent_.AddChildWindow(m_window);
                }

                //Load the page.
                return _self.Load();
            },

            function () {
                return _self.Update(true, true);
            },

            function () {
                m_loaded = true;
				_self.OnShow();
            }

        );
    };

    this.Load = function () {

        Application.LogInfo('Loading Options Window');

        return $codeblock(

			function () {
                //Get the table for filtering.
				if(m_page)
					return new Table(m_page.SourceID);
            },
			
            function (tbl) {

				if(tbl)
					m_table = tbl;
			
                //Create the container.
                m_container = $('<div style="width: 100%; padding: 4px; box-sizing: border-box;"></div>');
                m_window.AddControl(m_container);

				if(m_options.optionvalues)
					m_record = m_options.optionvalues;
				
				//Attach fake record functions.
				m_record.SaveCurrent = function(){};
				m_record.GetCurrent = function(){};
				
                //Add the options.
                if (m_options.fields) {
                    for (var i = 0; i < m_options.fields.length; i++) {

                        var f = m_options.fields[i];

                        var f2 = Extend(f, {
                            Name: "Option" + $id(),
                            Type: "Text",
                            Size: 1000000,
                            Editable: true,
                            Caption: "Option"
                        });											

						if(typeof m_record[f2.Name] == "undefined")
							m_record[f2.Name] = null;

						//Fix dates.
						if(m_record[f2.Name] && typeof m_record[f2.Name] == "string" && (f2.Type == "Date" || f2.Type == "Time" || f2.Type == "DateTime"))
							m_record[f2.Name] = Application.ConvertDate(m_record[f2.Name]);
						
                        var field = Extend(f2, Application.Objects.PageFieldInfo());

                        if (field.CustomControl && field.CustomControl != "") {
                            _self.AddCustomControl(field);
                        } else if (field.LookupTable != '' || field.OptionCaption != "") {
                            _self.AddComboField(field);
                        } else if (field.IncrementDelta != 0) {
                            _self.AddSpinnerField(field);
                        } else if (field.Type == "Date") {
                            _self.AddDateField(field);
                        } else if (field.Type == "DateTime" && !Application.IsInMobile()) {
                            _self.AddDateTimeField(field);
                        } else if (field.Type == "Boolean") {
                            _self.AddCheckboxField(field);
                        } else if (field.Type == "Time") {
                            _self.AddTimeField(field);
                        } else {
                            _self.AddTextField(field);
                        }
						m_fields.push(field);
                    }
                }

				//Filtering.
				if(m_page){
					
					//Create the container.
					m_filterContainer = $('<div style="width: 100%; padding: 4px; box-sizing: border-box;"></div>');
					m_container.append(m_filterContainer);
					
					if(!m_options.hideaddnew){
											
						//Add filtering fields.				
						var cmbFields = $("<select id='" + m_window.ID() + "fields' class='ui-widget ui-widget-content ui-corner-left' style='width: auto; max-width: 200px; font-size: 16px; margin-left: 10px; margin-bottom: 20px;' />");
						m_container.append(cmbFields);
						cmbFields.append("<option value='ADDNEW'>Add new filter...</option>");
						for (var i = 0; i < m_table.Columns.length; i++) {
							var col = m_table.Columns[i];
							var name = col.Name;
							cmbFields.append("<option value='" + name + "'>" + col.Caption + "</option>");
						}

						cmbFields.change(function () {
							_self.AddFilter(this.value);
						});
						
					}
					
					//Add the filters.
					var filters = Application.GetFilters(m_view, true);

					if (m_options.filtercolumns) {
						var cols = m_options.filtercolumns.split(",");
						for (var i = 0; i < cols.length; i++) {						
							filters.push([cols[i], ""]);
						}
					}

					for (var i = 0; i < filters.length; i++) {

						filters[i][0] = filters[i][0].replace("FF$","");											
						
						var field = m_table.Column(filters[i][0]);																	
						if (field && typeof m_filters[filters[i][0]] == "undefined") {
							
							if(field.OptionCaption != ""){
								filters[i][1] = Application.GetOptionFilter(filters[i][1], field.OptionCaption);
							}
							
							m_filters[filters[i][0]] = filters[i][1];
							_self.AddFilter(filters[i][0],true);
						}						
					}
				}
				
                m_window.CenterDialog();

            },
            function () {
                _self.HideLoad();
            }

        );
    };
	
	this.Options = function(){
		return m_options;
	};
	
	this.OnShow = function(){
		
		if (Application.IsInMobile()) {
			
			$("#okBtn").show();
			$("#saveBtn,#saveCloseBtn,#saveNewBtn,#customBtn1,#customBtn2,#closeBtn").hide();
			$("#divMobileFooter").show();
			
			if (m_options.showclose) 				
				$("#closeBtn").show();
		}
		
	};

    this.Update = function (first_, showProgress_) {

        Application.LogInfo('Updating Options Window');

        if (first_ == null) first_ = false;

        return $codeblock(

            function () {

                _self.ShowLoad();

                return _self.UpdateControls(first_);
            },

            function () {

                if (!Application.IsInMobile())
                    _self.LoadControls(true);

                m_window.CenterDialog();

                _self.HideLoad();
            }
        );
    };	
	
    this.UpdateControls = function (first_, showProgress_) {

        Application.LogDebug("Updating Controls.");

        if (m_controls.length > 0)
            return $loop(function (i) {

                if (showProgress_)
                    _base.Progress(_base.Progress() + ((i + 1) / m_controls.length * 25));

                Application.LogDebug("Updating Control: " + i);

                var w = $wait();

                $code(

                    function () {
                        var cont = m_controls[i];
                        return cont.Update(m_record);
                    },

                    function () {
                        //Continue?
                        if (i < m_controls.length - 1)
                            return $next;
                    }
                );

                return w.promise();

            });

    };

    this.LoadControls = function (loaded_) {

        for (var i = 0; i < m_controls.length; i++) {
            m_controls[i].Loaded(loaded_);
			m_controls[i].SetSize(690, 730);
        }
    };

	this.Control = function (name_) {

		for (var i = 0; i < m_controls.length; i++) {
			if (m_controls[i].Field().Name == name_)
				return m_controls[i];
		}
		return null;
	};
	
	this.AddFilterData = function(name, data){
		if(m_options.addfilterdata)
			m_options.addfilterdata(name,data);
	};
	
    this.AddCustomControl = function (field_, onchange_, editor_) {

        var cont = null;
        eval("cont = new " + field_.CustomControl + "(field_, _self);");
        cont.OnValueChange = (onchange_ ? onchange_ : _self.RecordValidate);
        if (Application.IsInMobile()) {
            cont.CreateMobile((editor_ ? m_filterContainer : m_container));
        } else {
            cont.CreateDesktop((editor_ ? m_filterContainer : m_container));
        }

		if(editor_){
			m_editors.push(cont);
		}else{
			m_controls.push(cont);
		}
    };

    this.AddTextField = function (field_, onchange_, editor_) {

        var txt = new Textbox(field_, _self);
        txt.OnValueChange = (onchange_ ? onchange_ : _self.RecordValidate);
        txt.Create((editor_ ? m_filterContainer : m_container));

        if(editor_){
			m_editors.push(txt);
		}else{
			m_controls.push(txt);
		}
    };

    this.AddTimeField = function (field_, onchange_, editor_) {

        var txt = new TimePicker(field_, _self);
        txt.OnValueChange = (onchange_ ? onchange_ : _self.RecordValidate);
        txt.Create((editor_ ? m_filterContainer : m_container));

        if(editor_){
			m_editors.push(txt);
		}else{
			m_controls.push(txt);
		}
    };

    this.AddSpinnerField = function (field_, onchange_, editor_) {

        var txt = new Spinner(field_, _self);
        txt.OnValueChange = (onchange_ ? onchange_ : _self.RecordValidate);
        txt.Create((editor_ ? m_filterContainer : m_container));

        if(editor_){
			m_editors.push(txt);
		}else{
			m_controls.push(txt);
		}
    };

    this.AddDateField = function (field_, onchange_, editor_) {

        var dte = new DatePicker(field_, _self);
        dte.OnValueChange = (onchange_ ? onchange_ : _self.RecordValidate);
        dte.Create((editor_ ? m_filterContainer : m_container));

        if(editor_){
			m_editors.push(dte);
		}else{
			m_controls.push(dte);
		}
    };

    this.AddDateTimeField = function (field_, onchange_, editor_) {

        var dte = new DateTimePicker(field_, _self);
        dte.OnValueChange = (onchange_ ? onchange_ : _self.RecordValidate);
        dte.Create((editor_ ? m_filterContainer : m_container));

        if(editor_){
			m_editors.push(dte);
		}else{
			m_controls.push(dte);
		}
    };

    this.AddComboField = function (field_, onchange_, editor_) {

        var cmb = new Combobox(field_, _self);
        cmb.OnValueChange = (onchange_ ? onchange_ : _self.RecordValidate);
        cmb.Create((editor_ ? m_filterContainer : m_container));

        if(editor_){
			m_editors.push(cmb);
		}else{
			m_controls.push(cmb);
		}
    };

    this.AddCheckboxField = function (field_, onchange_, editor_) {

        var chk = new Checkbox(field_, _self);
        chk.OnValueChange = (onchange_ ? onchange_ : _self.RecordValidate);
        chk.Create((editor_ ? m_filterContainer : m_container));

        if(editor_){
			m_editors.push(chk);
		}else{
			m_controls.push(chk);
		}
    };

	this.FixValue = function (field, value_) {

		//Check for nulls
		if (value_ == "")
			value_ = null;

		if (value_ != null && field.OptionCaption == "") {

			if (field.Type == "Date") {

				var dte = Application.ParseDate(value_);
				if (dte == null)
					Application.Error("Invalid date: " + value_);
				value_ = dte;

			} else if (field.Type == "Time") {

				value_ = Application.ParseTime(value_);

			} else if (field.Type == "DateTime") {

				var dte = Application.ParseDateTime(value_);
				if (dte == null)
					Application.Error("Invalid date time: " + value_);
				value_ = dte;

			} else if (field.Type == "Integer") {

				var i = parseInt(value_);
				if (isNaN(i))
					Application.Error("Invalid integer: " + value_);
				value_ = i;

			} else if (field.Type == "Decimal") {

				var i = parseFloat(value_);
				if (isNaN(i))
					Application.Error("Invalid decimal: " + value_);
				value_ = i;

			} else if (field.Type == "Code") {

				value_ = value_.toString().toUpperCase();

			} else if (field.Type == "Boolean") {

				if (value_ == "Yes" || value_ == true || value_ == "true") {
					value_ = true;
				} else {
					value_ = false;
				}
			}
		}

		if (field.OptionCaption != "" && value_ != null && field.Type != "BigText") {

			var found = false;
			var vals = field.OptionString.split(",");
			var captions = field.OptionCaption.split(",");
			for (var i = 0; i < vals.length; i++) {
				if (value_ == captions[i]) {
					if (field.Type == "Integer") {
						value_ = parseInt(vals[i]);
					} else {
						value_ = vals[i];
					}
					found = true;
					break;
				}
			}
			if (!found) {
				for (var i = 0; i < vals.length; i++) {
					if (captions[i].toLowerCase().indexOf(value_.toLowerCase()) != -1) {
						value_ = vals[i];
						found = true;
						break;
					}
				}
				if (!found)
					Application.Error("Invalid value: " + value_);
			}
		}

		if (!Application.IsInMobile() && field.LookupDisplayField != "" && value_ == null)
			m_record["FF$" + field.Name] = null;

		return value_;
	};
		
    this.RecordValidate = function (col, value) {
		
		var field = null;
		for(var i = 0; i < m_fields.length; i++){
			if(m_fields[i].Name == col){
				field = m_fields[i];
				break;
			}
		}
		
		if(field == null)
			Application.Error("Field not found: "+col);			
		
		if (field.LookupDisplayField != "" && value != "" && value != null && field.CustomControl == "") {
			value = m_record[col];
		}
				
		value = _self.FixValue(field,value);
        m_record[col] = value;
		
		if(field.OnValidate && field.OnValidate != ""){
			eval("var func = function(rec,viewer){" + field.OnValidate  + "};");
			Application.RunNext(function(){
				return $codeblock(					
					function(){
						_self.ShowLoad();
						return func(m_record,_self);
					},
					function(){					
						return _self.UpdateControls();
					},
					function(){
						_self.HideLoad();
					}
				);
			});
		}
				
		Application.RunNext(_self.Update);
    };       

    //#endregion

    //#region Filtering

    this.AddFilter = function (col, first) {

        if (typeof m_filters[col] == "undefined" || first) {
            var field = m_table.Column(col);
            if (field) {

                field.Size = 10000;

                if (typeof m_filters[col] == "undefined")
                    m_filters[col] = "";

                var txt = new Textbox(field, _self);
                txt.OnValueChange = _self.FilterChange;
                txt.Create(m_filterContainer);											
                txt.Update(m_filters);

                var del = $(UI.IconImage("delete"));
                del.css("cursor", "pointer").css("padding-left", "3px");

                var edit = $("<a style='padding:4px;font-weight:bold;cursor:pointer;'>...</a>");

                txt.Control().css("width", "60%").css("margin-right", "10px").after(del).after(edit);

                txt.Loaded(true);
                txt.Control().focus();

                m_filterControls.push(txt);

                var added = _self.AddAssistButton(field);
                if (added) {
                    eval('edit.button().click(function () {_self.ShowAssistEdit("' + field.Name + '");});');
                } else {
                    edit.remove();
                    txt.Control().css("width", "80%")
                }

                eval('del.click(function () {_self.RemoveFilter("' + field.Name + '");});');

                m_window.CenterDialog();
            }
        }
        $("#" + m_window.ID() + "fields").val("ADDNEW");
    };

    this.ShowAssistEdit = function (col) {

        var editor = _self.GetEditor(col);
        if (editor) {
            editor.Loaded(true);
            editor.Control().css("background-color", "#CCFF66").focus().trigger("click");
        }

        var cont = _self.GetFilterControl(col);
        if (cont) {
            cont.Container().hide();
        }
    };

    this.GetEditor = function (col) {
        for (var i = 0; i < m_editors.length; i++) {
            var cont = m_editors[i];
            if (cont.Field().Name == col) {
                return cont;
            }
        }
        return null;
    };

    this.GetFilterControl = function (col) {
        for (var i = 0; i < m_filterControls.length; i++) {
            var cont = m_filterControls[i];
            if (cont.Field().Name == col) {
                return cont;
            }
        }
        return null;
    };

    this.AssistChange = function (col, value) {

        var editor = _self.GetEditor(col);
        if (editor) {
            editor.Container().hide();
        }

        var cont = _self.GetFilterControl(col);
        if (cont) {
            cont.Control().val(value);
            _self.FilterChange(col, value);
            cont.Container().show();
        }
    };

    this.AddAssistButton = function (field) {

        var assistfield = Extend(field, Application.Objects.PageFieldInfo());
        assistfield.Editable = true;
        assistfield.Size = 10000;	
		
		if (assistfield.OptionCaption != "" && assistfield.OptionString == "") {
			var capts = assistfield.OptionCaption.split(",");
			for (var k = 0; k < capts.length; k++) {
				if (assistfield.OptionString == "") {
					assistfield.OptionString = k + "";
				} else {
					assistfield.OptionString += "," + k;
				}
			}
		}
		
        if (field.CustomControl && field.CustomControl != "") {
            _self.AddCustomControl(assistfield, _self.AssistChange, true);
        } else if (field.LookupTable != '' || field.OptionCaption != "") {
            _self.AddComboField(assistfield, _self.AssistChange, true);
        } else if (field.Type == "Date") {
            _self.AddDateField(assistfield, _self.AssistChange, true);
        } else if (field.Type == "DateTime" && !Application.IsInMobile()) {
            _self.AddDateTimeField(assistfield, _self.AssistChange, true);
        } else if (field.Type == "Time") {
            _self.AddTimeField(assistfield, _self.AssistChange, true);
        } else {
            return false;
        }

        return true;
    };

    this.FilterChange = function (col, value) {
        m_filters[col] = value;
    };

    this.RemoveFilter = function (col) {

        delete m_filters[col];

        var editor = _self.GetEditor(col);
        if (editor) {
            editor.Container().remove();
            for (var i = 0; i < m_editors.length; i++) {
                if (m_editors[i].Field().Name == col) {
                    m_editors.splice(i, 1);
                    break;
                }
            }
        }

        var cont = _self.GetFilterControl(col);
        if (cont) {
            cont.Container().remove();
            for (var i = 0; i < m_filterControls.length; i++) {
                if (m_filterControls[i].Field().Name == col) {
                    m_filterControls.splice(i, 1);
                    break;
                }
            }
        }

        m_window.CenterDialog();
    };

	this.CheckLayout = function (pge) {
		if (m_openedFrom && m_openedFrom.ReportOptions && m_openedFrom.ReportOptions() != null) {
			Application.Confirm("One or more options may have caused an error. Do you wish to clear them?", function (r) {
				if (r == true) {
					m_openedFrom.ReportOptions(null);
					_self.SaveReportOptions();
				}
				Application.RunNext(pge.Close);
			}, "Bad options");
			return true;
		}
		if (m_openedFrom && m_openedFrom.FilterOptions && m_openedFrom.FilterOptions() != '') {
			Application.Confirm("One or more filters may have caused an error. Do you wish to clear them?", function (r) {
				if (r == true) {
					m_openedFrom.FilterOptions('');
					_self.SaveReportOptions();
				}
				Application.RunNext(pge.Close);
			}, "Bad filters");
			return true;
		}
		return false;
	};
	
    //#endregion

    //#region Public Properties

    this.Window = function () {
        return m_window;
    };

    this.CloseFunction = function (func_) {
        if (typeof func_ == "undefined") {
            return m_closeFunc;
        } else {
            m_closeFunc = func_;
        }
    };

    this.OpenedFrom = function () {
        return m_openedFrom;
    };

	this.AddField = function(field){
		if(!m_options)
			m_options = new Object();
		if(!m_options.fields)
			m_options.fields = [];
		m_options.fields.push(field);
	};
	
    this.SetOptions = function (val) {
        m_record = val;
    }

    this.GetOptions = function () {
        return m_record;
    };

    this.GetOption = function (col) {
        return m_record[col];
    };
	
	this.GetView = function () {

        if (!m_okClicked)
            return "";

        var filters = "";
        for (var c in m_filters) {
            var skip = false;
			var filter = m_filters[c];
            if (filter == "" || filter == null)
                skip = true;
            var col = m_table.Column(c);
            if (!skip && col) {
                var name = col.Name;
                if (col.LookupDisplayField != "") {
                    name = "FF$" + col.Name;
                }
				if(col.OptionCaption != ""){
					filter = Application.SetOptionFilter(filter,col.OptionCaption);
				}
                if (filters == "") {
                    filters = name + "=FILTER(" + filter + ")";
                } else {
                    filters += "," + name + "=FILTER(" + filter + ")";
                }
            }
        }

        if (filters.length == 0)
            return Application.GetSorting(m_view) + "";
        return Application.GetSorting(m_view) + " WHERE(" + filters + ")";
    };

    //#endregion          

    //#region Overloaded Methods

    this.FocusControl = function () {
    };

    this.XFocusControl = function () {
    };

    this.Type = function () {
        return "Card";
    };

    this.MergeView = function (view) {
		
		if(m_record){
			
			var rec = m_record;
			if(view == null) return "";

			var check = new RegExp('\=FIELD\\(((.*?))\\)', 'g');
			var consts = view.match(check);
			if (consts) {
				for (var j = 0; j < consts.length; j++) {
					var name = consts[j].replace(check, '$2');
					var cont = _self.Control(name);					
					var f = Default(rec[name], null);            										
					if(f == "null" || f == "" || f == 0)
						f = null;
					if(f && cont && (cont.ObjectType() == "MultiCombobox" || cont.ObjectType() == "MultiSelect"))
						f = f.replace(/,/g,'|');
					if(f && f.getMonth){           
						view = view.replace("=FIELD(" + consts[j].replace(check, '$1') + ")", "=CONST(" + $.format.date(f,"dd/MM/yyyy") + ")");
					}else{
						view = view.replace("=FIELD(" + consts[j].replace(check, '$1') + ")", "=CONST(" + f + ")");
					}					      
				}
			}

			view = Application.ViewSubstitute(view);

			return view;
		}
        return view;
    };

    this.View = function () {
        return null;
    };
	
	this.Record = function(){
		return m_record;
	};

    this.ShowLoad = function () {
        m_window.ShowLoad();
    };

    this.HideLoad = function () {
        m_window.HideLoad();
    };

    this.Close = function (save) {
        if (m_options.closeButton == false) return;
        m_window.HideDialog(save);
    };

    //#endregion

    //#region Events

    this.OnError = function (e) {        

		_self.HideLoad(true);
		m_okClicked = false;
		
        Application.ShowError(e, function () {
			 if(!m_loaded){
								
				if (_self.CheckLayout(_self))
					return;
				Application.RunNext(_self.Close);
				return;                
			 }					
        });        
    };

    this.OnResize = function (width, height) {

    };

    this.OnKeyPress = function (ev) {

        try {

        } catch (e) {
            _self.OnError(e);
        }

    };

    this.OnBeforeClose = function (okclicked) {

        //Check mandatory.
        if(okclicked)
            for (var j = 0; j < m_controls.length; j++) {
                var field = m_controls[j].Field();
                if (field.Mandatory) {
                    if ((m_record[field.Name] == 0 || m_record[field.Name] == null || m_record[field.Name] == "null") && field.OptionCaption == "") {
                        Application.Error(field.Caption + " must have a value.");
                        return false;
                    }
                }
            }

        m_okClicked = okclicked;

        return true;
    };

    this.OnClose = function () {

        _self.ShowLoad();

        return $codeblock(

            function () {
                if (m_closeFunc != null) {
                    return m_closeFunc(m_okClicked);
                }
            }
        );
    };

    //#endregion        

    this.Constructor(options_);

});
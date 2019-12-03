/**
 * @typedef OptionsWindowSettings
 * @type {object}
 * @property {string} [caption=Options] Options window caption.
 * @property {string} [view] Default filters.
 * @property {string} [icon=window] Options window icon.
 * @property {Page} [page] Page settings.
 * @property {PageField[]} [fields] Fields to add to the options window.
 * @property {object} [optionvalues] Default values for the fields.
 * @property {boolean} [showclose=true] Show the close icon.
 * @property {boolean} [hideaddnew=false] Hide the `Add New` filter button.
 * @property {RecordFieldInfo[]} [filtercolumns] Add default filter fields to the options window.
 */

/**
 * @description
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * **CONTENTS**
 * - [Description](#description)
 * - [Constructor](#constructor)
 * - [Ask the user for options](#ask-the-user-for-options)
 * - [Ask the user for filters](#ask-the-user-for-filters)
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Description
 * 
 * OptionsWindow Class. 
 * 
 * Creates a dialog page which can be used to ask the user for options or to create a filter view.
 * 
 * <div style='background: #f9f2f4; padding: 5px'>**NOTE: Methods that return a `JQueryPromise` should be returned into a {@link $codeblock}**</div>
 *
 * <hr style='border-color: rgb(200, 201, 204)' /> 
 * 
 * ## Ask the user for options
 * 
 * Ask the user for event details (remember to run this code in a {@link $codeblock}):
 * 
 * ```javascript
 * var options = new OptionsWindow({
 *  caption: 'Event Options',
 *  // Options window fields.
 *  fields: [
 *      { Name: "StartTime", Caption: "Start Time", Type: "Time", Mandatory: true},
 *      { Name: "Duration", Caption: "Duration (hrs)", Type: "Decimal", Mandatory: true},
 *      { Name: "Description", Caption: "Description", Type: "Text"}
 *  ],
 *  // Default values.
 *  optionvalues: {StartTime: new Date()}
 * });
 * options.CloseFunction(function (okclicked) {
 *  if(okclicked){
 *      var desc = options.GetOption('Description');
 *      var starttime = options.GetOption('StartTime');
 *      var duration = options.GetOption('Duration');
 *  }
 * });
 * return options.Open();
 * ```
 <hr style='border-color: rgb(200, 201, 204)' /> 
 * 
 * ## Ask the user for filters
 * 
 * Ask the user for table filters (remember to run this code in a {@link $codeblock}):
 * 
 * ```javascript
 * var options = new OptionsWindow({
 *  caption: 'User Filters',
 *  // Source table.
 *  page: {SourceID:'Xpress User'},
 *  // Default filters.
 *  view: 'WHERE(Active=CONST(1))'
 * });
 * options.CloseFunction(function (okclicked) {
 *  if(okclicked){
 *      var view = options.GetView();
 *  }
 * });
 * return options.Open();
 * ```
 * 
 * <hr style='border-color: rgb(200, 201, 204)' />
 * 
 * ## Constructor
 * 
 * Params:
 * @class OptionsWindow
 * @global
 * @param {OptionsWindowSettings} [options_] Options window settings.
 * @returns {OptionsWindow} Returns a new `OptionsWindow` object.
 */
Define("OptionsWindow", null, function (options_) {

    //#region Members

    var _self = this;
    var m_loaded = false;
    var m_window = null; //Window
    var m_openedFrom = null; //PageViewer
	var m_closeFunc = null;
    var m_okClicked = false;
    var m_focusControl = null;
    var m_xFocusControl = null;
    var m_options = null; //Options    
	
	//Option Members
	var m_record = new Object();
	var m_xRecord = new Object();
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

    /**
     * Open the options window.
     * @memberof! OptionsWindow#
     * @param {PageViewer} [parent_] Parent viewer.
     * @returns {JQueryPromise} Promises to open the options window.
     */
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
				
				if(Application.IsInMobile())
					m_window.Main().css("margin-bottom","100px");

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

    /**
     * Load the options winow.
     * @memberof! OptionsWindow#
     * @protected
     * @returns {JQueryPromise} Promises to load the options window.
     */
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
                        if(m_record[f2.Name] && typeof m_record[f2.Name] == "string" && f2.Type == "Time")
							m_record[f2.Name] = moment(m_record[f2.Name],'YYYY/MM/DD HH:mm').toDate();
						if(m_record[f2.Name] && typeof m_record[f2.Name] == "string" && (f2.Type == "Date" || f2.Type == "DateTime"))
							m_record[f2.Name] = Application.ConvertDate(m_record[f2.Name]);
						
                        var field = Extend(f2, Application.Objects.PageFieldInfo());

                        if (field.Hidden == false) {

                            if (field.CustomControl && field.CustomControl != "") {
                                _self.AddCustomControl(field);
                            } else if (field.LookupTable != '' || field.OptionCaption != "") {
                                _self.AddComboField(field);
                            } else if (field.IncrementDelta != 0 && !Application.IsInMobile()) {
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
                        var f = [];
						for (var i = 0; i < m_table.Columns.length; i++) {
							var col = m_table.Columns[i];
                            var name = col.Name;
                            if(!Application.HasOption(col.Options,'hidefilter'))
							   f.push({
                                   name: name, 
                                   caption: col.Caption
                                }); 
                        }

                        f.sort(function (a, b) {
                            if (a.caption == b.caption)
                                return 0;
                            if (a.caption > b.caption) {
                                return 1;
                            } else {
                                return -1;
                            }
                        });
                        
                        $.each(f,function(index,value){
                            cmbFields.append("<option value='" + value.name + "'>" + value.caption + "</option>");
                        });                        

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

				app_transferObjectProperties.call(m_xRecord, m_record);
				
                m_window.CenterDialog();

            },
            function () {
                _self.HideLoad();
            }

        );
    };
    
    /**
     * Get the options window settings.
     * @memberof! OptionsWindow#
     * @returns {OptionsWindowSettings} Returns the options window settings.
     */
	this.Options = function(){
		return m_options;
	};
    
    /**
     * Function that runs when showing the options window.
     * @memberof! OptionsWindow#
     * @returns {void}
     */
	this.OnShow = function(){				
		
	};

    /**
     * Update the options window page.
     * @memberof! OptionsWindow#
     * @param {boolean} [first_] Pass `true` if this is the first update.
     * @param {boolean} [showProgress_] If `true`, shows the progress bar.
     * @returns {JQueryPromise} Promises to return after updating the page.
     */
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
    
    /**
     * Update the page controls.
     * @memberof! OptionsWindow#
     * @param {boolean} [first_] Pass `true` if this is the first update. 
     * @param {boolean} [showProgress_] If `true`, shows the progress bar.
     * @returns {JQueryPromise} Promises to return after updating the controls. 
     */
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

    /**
     * Set the page controls as loaded/unloaded.
     * @memberof! OptionsWindow#
     * @param {boolean} loaded_ If `true`, marks the page controls as loaded.
     * @returns {void}
     */
    this.LoadControls = function (loaded_) {

        for (var i = 0; i < m_controls.length; i++) {
            m_controls[i].Loaded(loaded_);
			m_controls[i].SetSize(m_window.InnerWidth(), 730);
        }
    };

    /**
     * Get a page conrol by name.
     * @memberof! OptionsWindow#
     * @param {string} name_ Name of the control.
     * @returns {Control} Returns the control if found, otherwise returns `null.
     */
	this.Control = function (name_) {

		for (var i = 0; i < m_controls.length; i++) {
			if (m_controls[i].Field().Name == name_)
				return m_controls[i];
		}
		return null;
	};
    
    /**
     * Add data for a filter field.
     * @memberof! OptionsWindow#
     * @param {string} name Name of the field.
     * @param {*} data Data for the field.
     * @returns {void}
     */
	this.AddFilterData = function(name, data){
		if(m_options.addfilterdata)
			m_options.addfilterdata(name,data);
	};
    
    /**
     * Add a custom control to the page.
     * @memberof! OptionsWindow#
     * @param {PageField} field_ Page field.
     * @param {Function} [onchange_] Function to call on value change. If `null`, uses the `RecordValidate` function.
     * @param {boolean} [editor_] If `true`, add the control as an assist editor.
     * @returns {void}
     */
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

    /**
     * Add a text field control to the page.
     * @memberof! OptionsWindow#
     * @param {PageField} field_ Page field.
     * @param {Function} [onchange_] Function to call on value change. If `null`, uses the `RecordValidate` function.
     * @param {boolean} [editor_] If `true`, add the control as an assist editor.
     * @returns {void}
     */
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

    /**
     * Add a time field control to the page.
     * @memberof! OptionsWindow#
     * @param {PageField} field_ Page field.
     * @param {Function} [onchange_] Function to call on value change. If `null`, uses the `RecordValidate` function.
     * @param {boolean} [editor_] If `true`, add the control as an assist editor.
     * @returns {void}
     */
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

    /**
     * Add a spinner control to the page.
     * @memberof! OptionsWindow#
     * @param {PageField} field_ Page field.
     * @param {Function} [onchange_] Function to call on value change. If `null`, uses the `RecordValidate` function.
     * @param {boolean} [editor_] If `true`, add the control as an assist editor.
     * @returns {void}
     */
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

    /**
     * Add a date field control to the page.
     * @memberof! OptionsWindow#
     * @param {PageField} field_ Page field.
     * @param {Function} [onchange_] Function to call on value change. If `null`, uses the `RecordValidate` function.
     * @param {boolean} [editor_] If `true`, add the control as an assist editor.
     * @returns {void}
     */
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

    /**
     * Add a date time control to the page.
     * @memberof! OptionsWindow#
     * @param {PageField} field_ Page field.
     * @param {Function} [onchange_] Function to call on value change. If `null`, uses the `RecordValidate` function.
     * @param {boolean} [editor_] If `true`, add the control as an assist editor.
     * @returns {void}
     */
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

    /**
     * Add a combobox control to the page.
     * @memberof! OptionsWindow#
     * @param {PageField} field_ Page field.
     * @param {Function} [onchange_] Function to call on value change. If `null`, uses the `RecordValidate` function.
     * @param {boolean} [editor_] If `true`, add the control as an assist editor.
     * @returns {void}
     */
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

    /**
     * Add a checkbox control to the page.
     * @memberof! OptionsWindow#
     * @param {PageField} field_ Page field.
     * @param {Function} [onchange_] Function to call on value change. If `null`, uses the `RecordValidate` function.
     * @param {boolean} [editor_] If `true`, add the control as an assist editor.
     * @returns {void}
     */
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

    /**
     * Convert a field value to the correct type.
     * @memberof! OptionsWindow#
     * @param {PageField} field Page field.
     * @param {*} value_ Field value to convert.
     * @returns {*} Returns the converted field value.
     */
	this.FixValue = function (field, value_) {

		//Check for nulls
		if (value_ == "" || value_ == "null" || (value_ && value_.trim && value_.trim() == ""))
			value_ = null;

		if (value_ != null && field.OptionCaption == "") {

			if (field.Type == "Date") {

				var dte = Application.ParseDate(value_);
				if (dte == null)
					Application.Error("Invalid date: " + value_);
				value_ = dte;

			} else if (field.Type == "Time") {

                if(typeof value_ === 'string'){
                    value_ = moment('1900/01/01 '+value_,Application.HasOption(field.Options,'24hours') ? 'YYYY-MM-DD HH:mm':'YYYY-MM-DD hh:mm a').toDate();
                }else{
                    var tme = Application.ParseTime(value_);
                    if (tme == null)
                        Application.Error("Invalid time: " + value_);
                    value_ = tme;
                }

			} else if (field.Type == "DateTime") {

				var dte = Application.ParseDateTime(value_);
				if (dte == null)
					Application.Error("Invalid date time: " + value_);
				value_ = dte;

			} else if (field.Type == "Integer") {

                if(value_ && value_.replace)
                    value_ = value_.replace(/\,/g,'');
				var i = parseInt(value_);
				if (isNaN(i))
					Application.Error("Invalid integer: " + value_);
				value_ = (i === 0 ? null : i);

			} else if (field.Type == "Decimal") {

                if(value_ && value_.replace)
                    value_ = value_.replace(/\,/g,'');
				var i = parseFloat(value_);
				if (isNaN(i))
					Application.Error("Invalid decimal: " + value_);
				value_ = (i === 0 ? null : i);

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

		if (field.OptionCaption != "" && value_ != null && field.Type != "BigText" && field.CustomControl === '') {

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
        
    /**
     * Validate a record field value.
     * @memberof! OptionsWindow#
     * @param {string} col Column name.
     * @param {*} value Value to validate.
     * @returns {void}
     */
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
			eval("var func = function onValidate(rec,viewer){" + field.OnValidate  + "};");
			Application.RunNext(function(){
				return $codeblock(					
					function(){
						_self.ShowLoad();
						return func(m_record,_self);
					},
					function () {
					    app_transferObjectProperties.call(m_xRecord, m_record);
						return _self.UpdateControls();
					},
					function(){
						_self.HideLoad();
					}
				);
			});
		} else {
		    app_transferObjectProperties.call(m_xRecord, m_record);
		}
				
		Application.RunNext(_self.Update);
    };       

    //#endregion

    //#region Filtering

    /**
     * Add a filter field control to the page.
     * @memberof! OptionsWindow#
     * @param {string} col Column name.
     * @param {boolean} [first] If `true`, adds a new control to the page.
     * @returns {void}
     */
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

    /**
     * Show the assist editor for a field.
     * @memberof! OptionsWindow#
     * @param {string} col Column name.
     * @returns {void}
     */
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

    /**
     * Get an assist editor by name.
     * @memberof! OptionsWindow#
     * @param {string} col Column name.
     * @returns {Control} Returns the control if found, otherwise returns `null`.
     */
    this.GetEditor = function (col) {
        for (var i = 0; i < m_editors.length; i++) {
            var cont = m_editors[i];
            if (cont.Field().Name == col) {
                return cont;
            }
        }
        return null;
    };

    /**
     * Get a filter control by name.
     * @memberof! OptionsWindow#
     * @param {string} col Column name.
     * @return {Control} Returns the control if found, otherwise returns `null`.
     */
    this.GetFilterControl = function (col) {
        for (var i = 0; i < m_filterControls.length; i++) {
            var cont = m_filterControls[i];
            if (cont.Field().Name == col) {
                return cont;
            }
        }
        return null;
    };

    /**
     * Assist editor on change event handler.
     * @memberof! OptionsWindow#
     * @param {string} col Column name.
     * @param {*} value Editor value.
     * @returns {void}
     */
    this.AssistChange = function (col, value) {

        var editor = _self.GetEditor(col);
        if (editor) {
            
            editor.Container().hide();

            var field = editor.Field();
            if (field.LookupTable != "" && value != null && value != "") {
                Application.RunNext(function () {
                    return $codeblock(
                        function () {
                            return Application.LookupRecord(field, _self, value, function () { });
                        },
                        function (vals) {
                            
                            var f = field.LookupField;
                            if (field.LookupDisplayField != "")
                                f = field.LookupDisplayField;

                            for (var i = 0; i < vals.length; i++) {
                                if (vals[i][f] == value) {
                                    if (field.LookupDisplayField != "") {
                                        _self.FilterChange(col, vals[i][field.LookupField]);
                                    }
                                    return vals[i][f];
                                }
                            }

                            for (var i = 0; i < vals.length; i++) {
                                if (vals[i][f].toLowerCase().indexOf(value.toLowerCase()) != -1) {
                                    if (field.LookupDisplayField != "") {
                                        _self.FilterChange(col, vals[i][field.LookupField]);
                                    }
                                    return vals[i][f];
                                }
                            }

                            return null;
                        },
                        function (ret) {
                            if (ret == null)
                                Application.Error("Invalid value: " + value);

                            var cont = _self.GetFilterControl(col);
                            if (cont) {
                                cont.Control().val(value);     
                                if (field.LookupDisplayField === "") {
                                    _self.FilterChange(col, value);
                                }                           
                                cont.Container().show();
                            }
                        }
                    );
                });
                return;
            }
        }

        var cont = _self.GetFilterControl(col);
        if (cont) {
            cont.Control().val(value);
            _self.FilterChange(col, value);
            cont.Container().show();
        }
    };

    /**
     * Add an assist editor button to a field.
     * @memberof! OptionsWindow#
     * @param {PageField} field Page field.
     * @returns {boolean} Returns `true` if the button was added.
     */
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

    /**
     * Filter on change event.
     * @memberof! OptionsWindow#
     * @param {string} col Column name.
     * @param {*} value Filter value.
     * @returns {void}
     */
    this.FilterChange = function (col, value) {
        m_filters[col] = value;
    };

    /**
     * Remove a filter field from the page.
     * @memberof! OptionsWindow#
     * @param {string} col Column name.
     * @returns {void}
     */
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

    /**
     * Check if the page layout caused an error.
     * @memberof! OptionsWindow#
     * @param {OptionsWindow} pge Options window reference.
     * @returns {boolean} Returns `true` if an error was found in the layout.
     */
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

    /**
     * Get the window reference.
     * @memberof! OptionsWindow#
     * @returns {Window} Returns the window reference.
     */
    this.Window = function () {
        return m_window;
    };

    /**
     * Get/set the on close function.
     * @memberof! OptionsWindow#
     * @param {Function} [func_] Set the on close function.
     * @returns {Function} Returns the on close function if `func_` is not specified.
     */
    this.CloseFunction = function (func_) {		
        if (typeof func_ == "undefined") {
            return m_closeFunc;
        } else {
            m_closeFunc = func_;
        }
    };

    /**
     * Get the opened from reference.
     * @memberof! OptionsWindow#
     * @returns {PageViewer} Returns the opened from reference.
     */
    this.OpenedFrom = function () {
        return m_openedFrom;
    };

    /**
     * Add a field to the options window setup.
     * @memberof! OptionsWindow#
     * @param {PageField} field Page field to add.
     * @returns {void}
     */
	this.AddField = function(field){
		if(!m_options)
			m_options = new Object();
		if(!m_options.fields)
			m_options.fields = [];
		m_options.fields.push(field);
	};
    
    /**
     * Set the options window values.
     * @memberof! OptionsWindow#
     * @param {object} val Values to set.
     * @returns {void}
     */
    this.SetOptions = function (val) {
        m_record = val;
    }

    /**
     * Get the options window values.
     * @memberof! OptionsWindow#
     * @returns {object} Returns the options window values.
     */
    this.GetOptions = function () {
        return m_record;
    };

    /**
     * Get an options window value by name.
     * @memberof! OptionsWindow#
     * @param {string} col Column name.
     * @returns {*} Returns the options window value.
     */
    this.GetOption = function (col) {
        return m_record[col];
    };
    
    /**
     * Get the filter view for the page.
     * @memberof! OptionsWindow#
     * @returns {string} Returns the filter view.
     */
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

				if(col.OptionCaption != "" && col.Type === "Integer"){
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

    /**
     * Get/set the focus control.
     * @memberof! OptionsWindow#
     * @param {Control} [cont] If specified, sets the focus control.
     * @returns {Control|void} Returns the focus control if `cont` is not specified.
     */
    this.FocusControl = function (cont) {             
        if (cont !== undefined) {
            m_focusControl = cont;
        } else {
            return m_focusControl;
        }
    };

    /**
     * Set the previous focus control.
     * @memberof! OptionsWindow#
     * @param {Control} cont Sets the previous focus control.
     * @returns {void}
     */
    this.XFocusControl = function (cont) {
        m_xFocusControl = cont;
    };

    /**
     * Get the page type.
     * @memberof! OptionsWindow#
     * @returns {string} Returns the page type.
     */
    this.Type = function () {
        return "Card";
    };

    /**
     * Merge the options window values with a filter view.
     * @memberof! OptionsWindow#
     * @param {string} view Filter view to merge with the options window values.
     * @returns {string} Returns the merged filter view.
     */
    this.MergeView = function (view) {
		
		if(m_record){
			
			var rec = m_record;
			if(view == null) return "";

            function MergeFields(keyword){       
                var check = new RegExp('\='+keyword+'\\(((.*?))\\)', 'g');
                var consts = view.match(check);
                if (consts) {
                    for (var j = 0; j < consts.length; j++) {
                        var name = consts[j].replace(check, '$2');
                        var cont = _self.Control(name);					
                        var f = rec[name] || m_filters[name] || null;            										
                        if(f == "null" || f == "" || f == 0)
                            f = null;
                        if(f && cont && (cont.ObjectType() == "MultiCombobox" || cont.ObjectType() == "MultiSelect"))
                            f = f.replace(/,/g,'|');
                        if(f && f.getMonth){           
                            view = view.replace("="+keyword+"(" + consts[j].replace(check, '$1') + ")", "="+(keyword === 'FIELD' ? 'CONST':'FILTER')+"(" + $.format.date(f,"dd/MM/yyyy") + ")");
                        }else{
                            view = view.replace("="+keyword+"(" + consts[j].replace(check, '$1') + ")", "="+(keyword === 'FIELD' ? 'CONST':'FILTER')+"(" + f + ")");
                        }					      
                    }
                }
            }

            MergeFields('FIELD');
            MergeFields('FILTERFIELD');

			view = Application.ViewSubstitute(view);

			return view;
		}
        return view;
    };

    /**
     * Get the record view.
     * @memberof! OptionsWindow#
     * @returns {string} Returns the record view.
     */
    this.View = function () {
        return null;
    };
    
    /**
     * Get the record reference.
     * @memberof! OptionsWindow#
     * @returns {Record} Returns the record reference.
     */
	this.Record = function(){
		return m_record;
	};

    /**
     * Show the page load overlay.
     * @memberof! OptionsWindow#
     * @returns {void}
     */
    this.ShowLoad = function () {
        m_window.ShowLoad();
    };

    /**
     * Hide the page load overlay.
     * @memberof! OptionsWindow#
     * @returns {void}
     */
    this.HideLoad = function () {
        m_window.HideLoad();
    };

    /**
     * Close the page.
     * @memberof! OptionsWindow#
     * @param {boolean} [save] If `true`, saves the page. 
     * @returns {void}
     */
    this.Close = function (save) {		
        if (m_options.closeButton == false) return;
        m_window.HideDialog(save);
    };

    //#endregion

    //#region Events

    /**
     * On error event handler.
     * @memberof! OptionsWindow#
     * @param {string} e Error message.
     * @returns {void}
     */
    this.OnError = function (e) {        

        if (Application.transactionStarted > 0)
            Application.RunNext(function () {
                return $codeblock(
				    function () {
				        if (Application.auth.SessionID != "") {
				            Application.supressServiceErrors = true;
				            return Application.RollbackTransaction();
				        }
				    },
				    function () {
				        Application.supressServiceErrors = false;
				    }
			    );
            });
            
		_self.HideLoad(true);
		m_okClicked = false;

		app_transferObjectProperties.call(m_record, m_xRecord);
		
        Application.ShowError(e, function () {
			 if(!m_loaded){
								
				if (_self.CheckLayout(_self))
					return;
				Application.RunNext(_self.Close);
				return;                
			 } else {
                if(m_xFocusControl){
                    m_focusControl = m_xFocusControl;
                    try {
                        m_focusControl.select();
                    } catch (e) {
                    }
                }
			     Application.RunNext(_self.UpdateControls);
			 }
        });        
    };

    /**
     * On resize event handler.
     * @memberof! OptionsWindow#
     * @param {number} width New width value.
     * @param {number} height New height value.
     * @returns {void}
     */
    this.OnResize = function (width, height) {

    };

    /**
     * On key press event handler.
     * @memberof! OptionsWindow#
     * @param {Event} ev Event reference.
     * @returns {void}
     */
    this.OnKeyPress = function (ev) {

        try {

        } catch (e) {
            _self.OnError(e);
        }

    };

    /**
     * On before close event handler.
     * @memberof! OptionsWindow#
     * @param {boolean} okclicked Pass `true` if the OK button was used to close the page.
     * @returns {boolean} Returns `false` if the page should not close.
     */
    this.OnBeforeClose = function (okclicked) {

        //Check mandatory.
        if(okclicked)
            for (var j = 0; j < m_controls.length; j++) {
                var field = m_controls[j].Field();
                if (field.Mandatory) {
                    if ((m_record[field.Name] === 0 || m_record[field.Name] === null || m_record[field.Name] === "null") && field.OptionCaption === "") {
                        Application.Error(field.Caption + " must have a value.");
                        return false;
                    }
                }
            }

        m_okClicked = okclicked;

        return true;
    };

    /**
     * On close event handler.
     * @memberof! OptionsWindow#
     * @returns {JQueryPromise} Promises to close the page.
     */
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

/// <reference path="../Application.js" />

Define("MultiCombobox",

    function (field_, viewer_) {
        return new Control("MultiCombobox", field_, viewer_);
    },

    function (field_) {

        //#region Members

        var _self = this;
        var _base = null;
        var m_button = null;
        var m_values = null;
        var m_skipFocus = false;
        var m_loaded = false;
        var m_value = null;
		var m_allSelected = null;
		var m_search = null;
        var m_record = null;
        var m_view = "";

        //#endregion

        //#region Public Methods

        this.Constructor = function (field_) {

            if (Application.testMode && arguments[0] == null) return;

            //Setup _base.            
            _base = Base("MultiCombobox");

            //Create option combo.
            if (field_.OptionString != "") {

                m_values = new Array();
                var vals = field_.OptionString.split(",");
                var captions = field_.OptionCaption.split(",");

                for (var i = 0; i < vals.length; i++) {
                    var item = new Object();
                    item.Display = captions[i];
                    if (field_.Type == "Integer") {
                        item.Value = parseInt(vals[i]);
                    } else {
                        item.Value = vals[i];
                    }
                    m_values.push(item);
                }

                return;
            }
        };

        this.CreateDesktop = function (window_) {

            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td><td style="width: 50%; padding-right: 10px; text-align: left;"><select class="multiselector" multiple="multiple" id="ctl' + _base.ID() + '" style="width: 100%;"></select></td></tr></table></div>');

            var height = Default(Application.OptionValue(_base.Field().Options, "height"), 175);

			var filters = _base.Field().LookupFilters;
			if(typeof filters == "function")
				filters = _base.Field().LookupFilters();
			
            //Call base method.
            _base.Create(window_, container, _self.OnChange, function (cont) {
                cont.multiselectcombo({
                    classes: "app-control",
                    selectedList: parseInt(Default(Application.OptionValue(_base.Field().Options, "selectedlist"),"1")),
                    height: height,
					drilldown: _base.Field().LookupAdvanced,
                    drilldownview: filters,
                    header: !Application.HasOption(_base.Field().Options, "hideselectall")
                });
            });
        };

        this.CreateMobile = function (window_) {

            var container = $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label><select multiple="multiple" id="ctl' + _base.ID() + '" data-native-menu="false" data-theme="a"></select>');
            
            //Call base method.
            _base.Create(window_, container, function(){
				
				var sel = $("#ctl" + _base.ID());
                
                if(!Application.HasOption(_base.Field().Options, "hideselectall")){
                    var allSelected = $("option:first", sel).attr("selected");
                    if (m_allSelected && !allSelected) {
                        $("#ctl" + _base.ID()+" option:selected").removeAttr("selected");
                        m_allSelected = allSelected;
                    }else if (!m_allSelected && allSelected) {
                        $("#ctl" + _base.ID()+" option").attr("selected", "selected");
                        m_allSelected= allSelected;
                    }
                    sel.selectmenu("refresh", true);
                }						
				
				var val = sel.val();
				
				//Remove select all value.
				try{
				
					var blank = val.indexOf(-1);
					if(blank >= 0)
						val.splice(blank,1);
				
				}catch(e){					
				}				
				
				_self.OnChange(_base.Field().Name,val);
				
			}, function (cont) {				
            });
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var filters = _base.Field().LookupFilters;
			if(typeof filters == "function")
                filters = _base.Field().LookupFilters();
                
            var cont = $('<select class="multiselector" multiple="multiple">')
            .appendTo(container)
            .multiselectcombo({
                classes: "app-control",
                selectedList: parseInt(Default(Application.OptionValue(_base.Field().Options, "selectedlist"),"1")),
                height: 175,
                drilldown: _base.Field().LookupAdvanced,
                drilldownview: filters,
                header: !Application.HasOption(_base.Field().Options, "hideselectall")
            })
            .addClass("ui-widget ui-widget-content ui-corner-left")	        
            .css("width", "calc(100% - 2px)");       
            
            if(_base.Viewer() && _base.Viewer().ParseComboCell)
                value_ = _base.Viewer().ParseComboCell(value_,_base.Field());

            if (value_ != null) {
                value_ = value_.toString().split(",");
            }

            Application.RunNext(function(){
                return _self.GenerateData(value_);
            });

            //Call base method.
            return _base.CreateList(container, cont, value_);
        };

        this.FormatValue = function(cellvalue, rowObject){
            if(_base.Viewer() && _base.Viewer().FormatComboCell)
                return _base.Viewer().FormatComboCell(cellvalue,_base.Field());
            return cellvalue;
        };

        this.GenerateData = function (value) {

            var viewer = _base.Viewer();
            var view = viewer.View();
            var field = _base.Field();
            var cont = _base.Control();

            if (m_values != null) {

                if (m_loaded) {				
                    _base.Control().html("");
                }

                for (var i = 0; i < m_values.length; i++) {
                    var sel = ""
                    if (value && value.indexOf(m_values[i].Value.toString()) != -1) {
                        sel = " selected";
                    }
                    cont.append('<option value="' + m_values[i].Value + '"' + sel + '>' + m_values[i].Display + '</option>');
                }

                if (!Application.IsInMobile()) {
                    cont.multiselectcombo('refresh');
                } else {
                    cont.selectmenu();
                    cont.selectmenu("refresh");
                }

                if (typeof value != 'undefined')
                    cont.val(value);

                m_loaded = true;
                _self.Loaded(true);

                return;
            }

			m_value = value;
            return Application.LookupRecord(field, viewer, "", PopulateControl, null);
        };

        //#endregion

        //#region Private Methods

        function PopulateControl(result, value, displcol) {

            if (m_loaded) {
                //if (!Application.IsInMobile()) {
                    // _base.Control().multiselectcombo("destroy");
                // } else {
                    // _base.Control().selectmenu("destroy");
                //}				
				_base.Control().html("");
			}
				
            var viewer = _base.Viewer();
            var view = viewer.View();
            var field = _base.Field();
            var cont = _base.Control();
			value = m_value;
			
            var allowblank = false;
            if (Application.HasOption(field.Options, "allowblank"))
                allowblank = true;                        
			
            var lastcat = "";
            var html = "";
			
			if(Application.IsInMobile() && !Application.HasOption(field.Options, "hideselectall"))
				html += '<option value="-1">Select/Deselect All</option>';
			
			var added = [];
			
            for (var i = 0; i < result.length; i++) {

                if ((allowblank || result[i].BlankRow == false) && result[i].NewRecordRow !== true) {

                    var sel = ""

                    if (value && value.indexOf(result[i][field.LookupField].toString()) != -1) {
                        sel = " selected";
                    }

                    if (field.LookupCategoryField != "") {
                        if (result[i].BoldField == null) {
                            result[i].BoldField = "No Group";
                        }
                        if (lastcat != result[i].BoldField) {
                            if (lastcat != "")
                                html += '</optgroup>';
                            html += '<optgroup label="' + result[i].BoldField + '">';
                        }
                        lastcat = result[i].BoldField;
                    }

					var val = result[i][field.LookupField];
					if(added.indexOf(val) == -1 || Default(field.LookupCategoryField,'') != ''){
						added.push(val);						
						html += '<option value="' + val + '"' + sel + '>' + result[i][field.LookupColumns] + '</option>';
					}                    

                }
            }
            if (lastcat != "")
                html += '</optgroup>';

            cont.append(html);

            if (!Application.IsInMobile()) {
				cont.multiselectcombo('refresh');
            } else {
                cont.selectmenu();
				cont.selectmenu("refresh");
            }            

            if (typeof value != 'undefined')
                cont.val(value);

            m_loaded = true;
            _self.Loaded(true);

        };

        //#endregion

        //#region Overloaded Methods

        this.Update = function (rec_) {

            m_record = rec_;
            var value = rec_[_base.Field().Name];
            if (value != null) {
                value = value.toString().split(",");
            }
			
            if (m_loaded) {
                if (typeof value == 'undefined') {
                    _self.Loaded(true);                    
                }else{
                    _base.Control().val(value);
                    _self.Loaded(true);
                }
            }

            //if (!m_loaded || Application.IsInMobile()) {
                return _self.GenerateData(value);
            //}
        };

        //#endregion

        //#region Overrideable Methods

        this.OnChange = function (name, value) {

            var val = _base.Control().val();
            if (val != null && val.list)
                val = val.list();

            return _self.OnValueChange(name, val);
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        this.SetSize = function (width, height) {

            _base.Container().width(width);
            
			if(!Application.IsInMobile()){
				_base.Control().width((width / 2) - 18);
				_base.Control().multiselectcombo("refresh");
			}
        };

        this.Show = function () {

            _base.Show();

            if (Application.IsInMobile()) {
                _base.Control().selectmenu();                
                _base.Control().parent().show();
            }
        };

        this.Hide = function () {

            _base.Hide();

            if (Application.IsInMobile()) {
                _base.Control().selectmenu();                
                _base.Control().parent().hide();
            }
        };

        this.Enabled = function (value_, update_) {

            _base.Enabled(value_, update_);

            if (!Application.IsInMobile()) {
                if(_base.Field().Editable){
                    _base.Control().multiselectcombo('enable');
                    _base.Control().next().css('background','');
                }else{
                    _base.Control().multiselectcombo('disable');
                    _base.Control().next().css('background','rgb(235, 235, 228)');
                }
            }else{
                _base.Control().selectmenu();
                if(_base.Field().Editable){
                    _base.Control().selectmenu('enable');
                }else{
                    _base.Control().selectmenu('disable');
                }
            }

            return _base.Enabled();
        }

        //#endregion

        //Constructor
        this.Constructor(field_);

    });

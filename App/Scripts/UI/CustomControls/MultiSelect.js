/// <reference path="../Application.js" />

Define("MultiSelect",

    function (field_, viewer_) {
        return new Control("MultiSelect", field_, viewer_);
    },

    function (field_) {

        //#region Members

        var _self = this;
        var _base = null;
        var m_values = null;
        var m_loaded = false;
		var m_value = null;
		var m_allSelected = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function (field_) {

            if (Application.testMode && arguments[0] == null) return;

            //Setup _base.            
            _base = Base("MultiSelect");

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

            var container = $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr><td style="width: 100%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label><br/><select multiple="multiple" id="ctl' + _base.ID() + '"></select></td></tr></table></div>');

            var w = Default(Application.OptionValue(_base.Field().Options, "width"), 340);
            var h = Default(Application.OptionValue(_base.Field().Options, "height"), 300);

            //Call base method.
            _base.Create(window_, container, _self.OnChange, function (cont) {
                cont.css("width", w);
                cont.css("height", h);
            });
        };

        this.CreateMobile = function (window_) {

            var container = $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label><select multiple="multiple" id="ctl' + _base.ID() + '" data-native-menu="false" data-theme="a"></select>');
            
            //Call base method.
            _base.Create(window_, container, function(){
				
				var sel = $("#ctl" + _base.ID());
				
				var allSelected = $("option:first", sel).attr("selected");
	
				if (m_allSelected && !allSelected) {
					$("#ctl" + _base.ID()+" option:selected").removeAttr("selected");
					m_allSelected = allSelected;
					}else if (!m_allSelected && allSelected) {
					$("#ctl" + _base.ID()+" option").attr("selected", "selected");
					m_allSelected= allSelected;
				}
				
				sel.selectmenu("refresh", true);
				
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

        this.Options = function () {
            return {
                sortable: false,
                searchable: true,
                dividerLocation: 0.6,
                nodeComparator: function (node1, node2) {
                    var text1 = node1.text(),
			            text2 = node2.text();
                    return text1 == text2 ? 0 : (text1 < text2 ? -1 : 1);
                },
                onchange: function () {
                    return _self.OnChange(_base.Field().Name);
                }
            }
        };

        this.GenerateData = function (value) {

            var viewer = _base.Viewer();
            var view = viewer.View();
            var field = _base.Field();
            var cont = _base.Control();

            if (m_values != null) {

                for (var i = 0; i < m_values.length; i++) {
                    var sel = ""
                    if (value && value.indexOf(m_values[i].Value.toString()) != -1) {
                        sel = " selected";
                    }
                    cont.append('<option value="' + m_values[i].Value + '"' + sel + '>' + m_values[i].Display + '</option>');
                }

                if (!Application.IsInMobile()) {
                    cont.multiselect(_self.Options());
                } else {
                    cont.selectmenu();
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
                if (!Application.IsInMobile()) {
                     _base.Control().multiselect("destroy");
                // } else {
                    // _base.Control().selectmenu("destroy");
                }				
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
			
			if(Application.IsInMobile())
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
						html += '<option value="' + val + '" description="' + encodeURI(result[i][field.LookupColumns]) + '" ' + sel + '>' + result[i][field.LookupColumns] + '</option>';
					}

                }
            }
            if (lastcat != "")
                html += '</optgroup>';

            cont.append(html);

            if (!Application.IsInMobile()) {
                cont.multiselect(_self.Options());
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
                    return;
                }
                _base.Control().val(value);
                _self.Loaded(true);
            }

            if (!m_loaded || Application.IsInMobile()) {
                return _self.GenerateData(value);
            }
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
            //_base.Control().width(width);
            //_base.Control().multiselect("refresh");
        };

        //#endregion

        //Constructor
        this.Constructor(field_);

    });
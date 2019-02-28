/// <reference path="../Application.js" /

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
        var m_searchMode = false;
        var m_dd = false;
        var m_clearbtn = null;

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

                m_cols.push({ name: "Value", width: '230px', valueField: "Display" });
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
                    w = '200px';
                }

                //Custom width.
                var width = Application.OptionValue(field_.Options, vals[i] + "Width");
                if (width)
                    w = width;

                m_cols.push({ name: captions[i], width: w, valueField: vals[i] });
            }
        };

        this.Create = function (window_) {

            //Create the control.
            var container = $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label><input type="text" placeholder="Select or Search" id="ctl' + _base.ID() + '" data-theme="a" data-clear-btn="true"></input>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                cont.textinput();

                //Setup combo.               
                if (_base.Field().Editable != false) {

                    cont.tap(_self.OnClick);
                    
                    m_clearbtn = cont.next().tap(function(){
                        Search('');
                    });

                    m_dd = $('<i class="mdi mdi-menu-down" style="position: absolute;right: 5px;font-size: 2em;top:50%;margin:-14px 0 0;"></i>').tap(_self.OnClick);
                    cont.parent().append(m_dd);                    

                    cont.keydown(app_debouncer(function (ev) {

                        if (_base.Field().Editable == false)
                            return;      
                            
                        if(m_clearbtn) m_clearbtn.show();

                        if (ev.which == 13) {
                            HideResults(true);
                            return;
                        }
                        
                        Search(cont.val());                        

                    },1000));

                }

            });
        };

        this.DropDown = function () {
            Search("");
        };

        this.OnClick = function (ev) {

            if (_base.Field().Editable == false || m_searchMode)
                return;
			
			UI.Blur();

            Search("");            

            ev.preventDefault();
            return false;
        };

        //#endregion

        //#region Private Methods

        function Search(term) {

            var viewer = _base.Viewer();
            var field = _base.Field();

            if (!viewer)
                return;            
			
			if(term == "" && Application.HasOption(_base.Field().Options,"skipload")){
				m_data = [];
				DisplayResults(m_data);
				return;
			}

            //Option combo.
            if (m_values != null) {
                var vals = new Array();
                for (var i = 0; i < m_values.length; i++)
                    if (m_values[i].Display.toLowerCase().indexOf(term.toLowerCase()) != -1)
                        vals.push(m_values[i]);
                DisplayResults(vals);
                return;
            }

            var view = viewer.View();
            
            Application.RunNext(function () {
                return Application.LookupRecord(field, viewer, term, function (vals) {
                    m_data = vals;
                    DisplayResults(vals);
                });
            });

        };

        function DisplayResults(values) {

            var newCombo = false;

            var overlay = $(".mobile-combo-overlay");
            if (overlay.length == 0) {
                overlay = $("<div id='olay" + _base.ID() + "' class='mobile-combo-overlay' style='background-color: white; width: 100%; height: 100%; position: fixed; top: 0px; left: 0px; z-index: 29999;'></div>");
                $("body").append(overlay);
            } else {
                overlay.html("");
            }

            var results = $(".mobile-combo");
            if (results.length == 0) {
                results = $("<div id='res" + _base.ID() + "' class='mobile-combo' style='background-color: white; overflow: auto; width: 100%; height: 80%; position: absolute; top: "+($(window).scrollTop()+50)+"px; left: 0px; z-index: 30010;'></div>");
                $("body").append(results);
                ChangeDisplay(false);
                newCombo = true;
            } else {
                results.html("");                
            }
            
            var cont = $('<table data-role="table" id="tbl' + _base.ID() + '" style="-webkit-user-select: none; width: 100%;" data-mode="columntoggle" data-theme="b" class="ui-body-d ui-shadow table-stripe ui-responsive mobilegrid" data-column-btn-theme="b" data-column-btn-text="Columns to display..." data-column-popup-theme="a"><thead><tr id="tr' + _base.ID() + '" class="ui-bar-b" style="font-size: 12pt;"></tr><thead><tbody id="tbody' + _base.ID() + '"></tbody></table>');
            results.append(cont);

            var grid = cont.table();

            for (var i = 0; i < m_cols.length; i++) {
                $('#tr' + _base.ID()).append('<th>' + m_cols[i].name + '</th>');
            }

            for (var i = 0; i < values.length; i++) {
                CreateResultRow(values[i], i);
            }

            grid.table('refresh');

            if (!newCombo) {
                _base.Control().focus();
            }       

            _self.Loaded(true);
        };

        function CreateResultRow(data, i) {

            var id = $id();
            var rid = (i + 1);

            var row = "<tr class='gridrows' style='-webkit-user-select: none; font-size: 16px; height: 35px; white-space: nowrap;' id='rid" + rid + "' rid='" + rid + "'>";

            for (var j = 0; j < m_cols.length; j++) {

                var val = data[m_cols[j].valueField];
                row += "<th>" + val + "</th>";

            }
            row += "</tr>";

            var r = $(row);
            r.bind("tap", function (ev) {

                r.css("background", "Gainsboro");
                setTimeout(function () {
                    r.css("background", "");
                }, 50);

                SelectRow(data);
                HideResults(true);

                ev.preventDefault();
                return false;
            });

            $('#tbody' + _base.ID()).append(r);
        };

        function HideResults(revert) {

            $(".mobile-combo,.mobile-combo-overlay").remove();

            if (_base.Viewer().Type() == "Card") {
                _base.Viewer().XFocusControl(_base.Control());
                _self.OnValueChange(_base.Field().Name, _base.Control().val());
            }

            if (revert)
                ChangeDisplay(true);
        };

        function SelectRow(item) {

            var viewer = _base.Viewer();
            var field = _base.Field();

            if (!viewer)
                return;

            //Skip if we are not loaded.
            if (viewer.Type() == "Card" && _base.Loaded() == false)
                return false;

            //Added from desktop version.
            if (viewer.ComboSelected)
                viewer.ComboSelected(true);

            //Option combo.
            if (m_values != null) {

                _base.Control().val((item ? item.Display : ''));

            } else {

                if(item.NewRecordRow === true){
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

                if (typeof item.DisplayCol == 'undefined') { //Made a selection

                    if (m_data) {
                        var f = field.LookupField;
                        if (field.LookupDisplayField != "")
                            f = field.LookupDisplayField;

                        var found = false;
                        for (var i = 0; i < m_data.length; i++) {
                            if (m_data[i][f] == _base.Control().val()) {
                                item[field.LookupField] = m_data[i][field.LookupField];
                                if (field.LookupDisplayField != "")
                                    item[field.LookupDisplayField] = m_data[i][field.LookupDisplayField];
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            for (var i = 0; i < m_data.length; i++) {
                                if (m_data[i][f].toLowerCase().indexOf(_base.Control().val().toLowerCase()) != -1) {
                                    item[field.LookupField] = m_data[i][field.LookupField];
                                    if (field.LookupDisplayField != "")
                                        item[field.LookupDisplayField] = m_data[i][field.LookupDisplayField];
                                    break;
                                }
                            }
                        }
                    }
                }

                if (field.LookupDisplayField != "") {
                    _base.Control().val((item ? item[field.LookupDisplayField] : ''));
                    var rec = _base.Viewer().Record();
                    rec["FF$" + field.Name] = item[field.LookupDisplayField];
                    rec.SaveCurrent(null,true);
                    rec[field.Name] = item[field.LookupField];
                } else {
                    _base.Control().val((item ? item[field.LookupField] : ''));
                }

            }

        };

        function ChangeDisplay(revert) {

            m_searchMode = !revert;

            if (!revert) {

                var cont = _base.Control().parent().detach();

                if(m_dd) m_dd.hide();

                $("body").append(cont);

                cont.css({
                    position: 'absolute',                    
                    'z-index': 30000,
                    width: 'calc(100vw - 90px)' //Issue #17 - Change width
                }).offset({
                    top: $(".mobile-combo").offset().top - 40,
                    left: $(".mobile-combo").offset().left + 50
                });
				
                cont.children().first().attr("placeholder","Type here to search");
                
                var backbtn = $('<i id="comboback'+_self.ID()+'" class="mdi mdi-keyboard-backspace" data-ripple style="font-size: 30px;position: absolute;left: 8px;z-index: 30001;top: 8px;"></i>');
                cont.before(backbtn);
                backbtn.ripple({color: 'gainsboro'}).tap(function(){
                    HideResults(true);
                    return false;
                });

                //_base.Control().unbind("tap");                

                $(".main-windowsbtn").hide();

            } else {

                var cont = _base.Control().parent().detach();
                
                if(m_dd) m_dd.show();
                if(m_clearbtn) m_clearbtn.hide();

                if(_base.Field().Mandatory){
                    $("#lbldesc" + _base.ID()).after(cont);
                }else{
                    $("#lbl" + _base.ID()).after(cont);
                }                

                cont.css({
                    width: '', //Issue #17 - Change width
                    position: '',
                    top: '',
                    left: '',
                    'z-index': ''
                });

                cont.children().first().attr("placeholder","");
                
                $('#comboback'+_self.ID()).remove();
				
                //_base.Control().tap(_self.OnClick);

                $(".main-windowsbtn").show();
            }

        };

        //#endregion

		function AddHTML(val){
			if(val == null) 
				return;
			var html = $("#html"+_base.ID());
			html.hide();
			_base.Control().show();
			if(val.indexOf("<") != -1){
				if(html.length == 0){
					_base.Control().parent().append("<div id='html"+_base.ID()+"' style='height: 20px;margin-top: 5px;margin-left: 5px;'>"+val+"</div>");
					$("#html"+_base.ID()).tap(_self.OnClick);
				}else{
					$("#html"+_base.ID()).html(val).show();
				}
				_base.Control().hide();				
			}
		};
		
        //#region Overloaded Methods

        this.Update = function (rec_) {

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') {
                _self.Loaded(true);
                return;
            }

            //Options combo.
            if (m_values != null) {
                var vals = _base.Field().OptionString.split(",");
                var captions = _base.Field().OptionCaption.split(",");
                for (var i = 0; i < vals.length; i++) {
                    if (vals[i] == value)
                        _base.Control().val(captions[i])
                }
            } else {
                if (_base.Field().LookupDisplayField != "") {
					if(rec_.Record){
						for (var i = 0; i < rec_.Record.Fields.length; i++) {
							if (rec_.Record.Fields[i].Name == "FF$" + _base.Field().Name) {
								_base.Control().val(rec_.Record.Fields[i].Value);		
								AddHTML(rec_.Record.Fields[i].Value);
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

            _self.Loaded(true);
        };

        this.Hide = function () {
            _base.Hide();
            _base.Control().parent().hide();
        };

        this.Show = function () {
            _base.Show();
            _base.Control().parent().show();
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

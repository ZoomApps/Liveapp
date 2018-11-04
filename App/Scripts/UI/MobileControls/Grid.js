/// <reference path="../Application.js" />

Define("Grid",

    function (field_, viewer_) {
        return new Control("Grid", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_grid = null; //JQGrid                    
        var m_colNames = new Array();
        var m_cols = new Array();
        var m_dataSource = null;
        var m_footer = false;
        var m_selectedRow = 0;
        var m_longClick = false;
        var m_editRow = null;
        var m_tapped = 0;
        var m_grouping = null; //Issue #95 - Add grouping to mobile grid
		var m_newSort = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Grid");
        };

        this.Create = function (window_, footer_) {

            var cont = $('<div id="grid' + _base.ID() + '" class="xpress-resize" style="width: 100%; max-width: 100vw; overflow: auto;"><table data-role="table" id="' + _base.ID() + '" style="-webkit-user-select: none;" data-mode="columntoggle" data-theme="b" class="ui-body-d ui-shadow table-stripe ui-responsive mobilegrid"><thead><tr id="tr' + _base.ID() + '" class="ui-bar-b" style="font-size: 12px;"></tr><thead><tfoot><tr id="trfooter' + _base.ID() + '" class="ui-bar-b" style="font-size: 12px;"></tfoot><tbody id="tbody' + _base.ID() + '"></tbody></table></div>')

            window_.AddControl(cont);
			
			m_footer = footer_;

            m_grid = $("#" + _base.ID()).table();

            _self.CreateColumns();

            m_grid.table('refresh');

            _self.Loaded(true);
        };

        this.CreateColumns = function(){            

            //Issue #95 - Add grouping to mobile grid
            //Get grouping details.
            var options = _base.Viewer().Page().Options;
            m_grouping = Application.OptionValue(options, "groupfields");    
            if(m_grouping)
                m_grouping = m_grouping.split(',')[0];

            if(Application.HasOption(_base.Viewer().Page().Options,"rowtemplate"))
                return;

            $('#tr' + _base.ID()).append('<th style="width: 15px;"></th>');

            for (var i = 0; i < m_cols.length; i++) {
                if (m_cols[i].name != m_grouping) { //Issue #95 - Add grouping to mobile grid
                    var align = "";
                    if (m_cols[i].align != null)
                        align = " style='text-align: " + m_cols[i].align + "'";
                    $('#tr' + _base.ID()).append('<th ' + align + ' class="' + m_cols[i].name + _base.ID() + '">' + m_colNames[i] + '</th>');
					if(m_footer)
						$('#trfooter' + _base.ID()).append('<th ' + align + ' class="foot' + m_cols[i].name + _base.ID() + '"></th>');
                }
            }
        };

        this.AddColumn = function (field) {

            if (field.Hidden) return;

            var caption = field.Caption;
            if (field.Width == "999")
                field.Width = '200';

            m_colNames.push(caption);

            if (field.LookupTable != '') {
                m_cols.push({
                    name: field.Name,
                    onformat: function (val, rowObject) {
                        if (field.LookupDisplayField != "") {
                            if (rowObject.Record) {
                                for (var i = 0; i < rowObject.Record.Fields.length; i++) {
                                    if (rowObject.Record.Fields[i].Name == "FF$" + field.Name) {
                                        val = rowObject.Record.Fields[i].Value;
                                        break;
                                    }
                                }
                            }
                        }
                        if (val == null || val == "null")
                            return "";
                        return val;
                    }
                });
            } else if (field.Type == "Decimal" || field.Type == "Integer") {
                m_cols.push({
                    name: field.Name,
                    align: "right",
                    onformat: function (val) {
                        if (val == null) {
                            return "";
                        } else {
                            return val;
                        }
                    }
                });
            } else if (field.Type == "Option") {
                m_cols.push({
                    name: field.Name,
                    onformat: function (val) {
                        if (val == null)
                            return "";

                        var vals = field.OptionString.split(",");
                        var captions = field.OptionCaption.split(",");
                        for (var i = 0; i < vals.length; i++) {
                            if (vals[i] == val)
                                return captions[i];
                        }
                    }
                });
            } else if (field.Type == "Date") {
                m_cols.push({
                    name: field.Name,
                    align: "center",
                    onformat: function (val) {
                        if (val == null)
                            return "";
                        try {
                            return $.format.date(val, '%LANG:FORMAT_SHORTDATE%')
                        } catch (e) {
                        }
                        return val;
                    }
                });
            } else if (field.Type == "Time") {
                m_cols.push({
                    name: field.Name,
                    align: "center",
                    onformat: function (val) {
                        if (val == null)
                            return "";
                        try {
                            return $.format.date(val, 'hh:mm a')
                        } catch (e) {
                        }
                        return val;
                    }
                });
            } else if (field.Type == "DateTime") {
                m_cols.push({
                    name: field.Name,
                    align: "center",
                    onformat: function (val) {
                        if (val == null)
                            return "";
                        try {
                            return $.format.date(val, "dd/MM/yyyy hh:mm a");
                        } catch (e) {
                        }
                        return val;
                    }
                });                
            } else if (field.Type == "Boolean") {
                m_cols.push({
                    name: field.Name,
                    onformat: function (val) {
                        if (val == null)
                            return "";
                        if (val == true)
                            return "Yes";
                        if (val == false)
                            return "No";
                        return val;
                    }
                });
            } else {
                m_cols.push({
                    name: field.Name,
                    onformat: function (val) {
                        if (val == null || val == "null") {
                            return "";
                        } else {
                            if(Application.HasOption(field.Options,"ellipsis") && val.toString().length > 100)
								val = val.toString().substr(0,100)+"...";
							if(field.CustomControl == "NotesBox")
								val = val.replace(/\<br\>/g, '\r\n');
                            return val;
                        }
                    }
                });
            }
        };

        this.AddRow = function (rowid, data) {
            var i = rowid - 1;
            m_dataSource[i] = data;
            this.CreateRow(data, i, true);
			
			 if (m_footer)
				_self.OnLoadFooter(_self);
			
            m_grid.table('refresh');
            this.SelectRow(rowid);
        };

        this.RemoveRow = function (rowid) {
        };

        this.SetDataRow = function (rowid, data) {
        };

        this.Loading = function () {
            return false;
        };

        this.StopLoad = function () {
        };

		this.GetSort = function () {            
        };

        this.SetSort = function (sort) {            
        };
		
        this.Bind = function () {

            $('#tbody' + _base.ID()).html('');

            var grp = null;

			//Setup footer.
			if(m_footer){
				for (var j = 0; j < m_cols.length; j++) {
					if (m_cols[j].hidden){
						$('.foot' + m_cols[j].name + _base.ID()).hide();
					}else{
						$('.foot' + m_cols[j].name + _base.ID()).show();
					}
				}
			}				
            
            //Get grouping column.
            var col = null;
            for (var j = 0; j < m_cols.length; j++) {
                if(m_cols[j].name == m_grouping)
                    col = m_cols[j];
            } 

            for (var i = 0; i < m_dataSource.length; i++) {

                //Issue #95 - Add grouping to mobile grid
                if (m_grouping && grp != m_dataSource[i][m_grouping]) {
                    grp = m_dataSource[i][m_grouping];                                
                    $('#tbody' + _base.ID()).append("<tr style='-webkit-user-select: none; font-size: 14px;'><th style='color: black;' colspan='"+(m_cols.length+1)+"'>" + 
                        (col && col.onformat ? col.onformat(grp) : grp) +
                        "</th></tr>");                    
                }

                this.CreateRow(m_dataSource[i], i);

            }

			 if (m_footer)
				_self.OnLoadFooter(_self);
						
            m_grid.table('refresh');

            _base.Loaded(true);
        };

        this.CreateRow = function (data, i, add) {

            var id = $id();
            var rid = (i + 1);            

            var row = "<tr class='gridrows' style='-webkit-user-select: none; font-size: 14px;' id='rid" + rid + "' rid='" + rid + "'>";

            var img = null; //Editor image.
            if (_base.Viewer().Page().DoubleClickAction())
                img = _base.Viewer().Page().DoubleClickAction().Image;
            if (_base.Viewer().EnableEditMode())
                img = "redo";
			if(_base.Viewer().LineActions().length > 0)
				img = "mdi-table-column-plus-after";

            if(img)
                img = "<i class='mdi "+UI.MapMDIcon(UI.MapIcon(img))+"' style='color: black; font-size: 17px'></i>";

            var rowtemplatemode = Application.HasOption(_base.Viewer().Page().Options,"rowtemplate");
            if(rowtemplatemode){

                row += "<th rid='" + data.RowId + "'>" + _self.RowTemplate(data) + "</th>";

            }else{
                
                row += "<th class='rowselector' id='rs" + id + "' style='max-width: 15px; min-width: 15px; background-color: gainsboro;'></th>";

                for (var j = 0; j < m_cols.length; j++) {

                    if (m_cols[j].name != m_grouping) { //Issue #95 - Add grouping to mobile grid

                        var align = "";
                        if (m_cols[j].align != null)
                            align = "text-align: " + m_cols[j].align + ";";
                        if (m_cols[j].hidden)
                            align += " display: none;";
                        
                        var link = "";
                        if(_base.Viewer() && _base.Viewer().Page() && Application.OptionValue(_base.Viewer().Page().Options,"hyperlink") === m_cols[j].name)					
                            link = " color: blue;";

                        var val = data[m_cols[j].name];
                        if (m_cols[j].onformat) {
                            row += "<th rid='" + data.RowId + "'  style='" + align + link + "' class='" + m_cols[j].name + _base.ID() + "'>" + m_cols[j].onformat(val, data) + "</th>";
                        } else {
                            row += "<th rid='" + data.RowId + "'  style='" + align + link + "' class='" + m_cols[j].name + _base.ID() + "'>" + val + "</th>";
                        }

                    }
                }

            }
            
            row += "</tr>";

            var r = $(row);
            r.css(_self.RowTemplateStyle(data));

            if(!Application.HasOption(_base.Viewer().Page().Options,"notap"))
                r.bind("tap", function (ev) {
                    if (ev.originalEvent.isDefaultPrevented()) return;

                    ev.preventDefault();

                    var lineEditMode = _base.Viewer().LineActions().length > 0;
                    var isRowSelector = false;
                    var isHyperLink = false;
                    try{
                        isRowSelector = ev.target.parentElement.className == "rowselector" || ev.target.className == "rowselector";
                    }catch(e){				
                    }
                    try{
                        isHyperLink = ev.target.style.color == "blue";
                    }catch(e){				
                    }
                    
                    var rowid = parseInt($(this).attr("rid"));

                    if(_base.Viewer().LineActions().length === 1 && _base.Viewer().Page().DoubleClickAction()){
                        if(rowid != m_selectedRow){
                            _self.OnRowSelect(rowid);
                        }                        
                        _self.SelectRow(rowid);
                        _self.OnRowClick(rowid,_self.DataSourceById(rowid),r)
                        _self.OnDoubleClick(rowid);					
                        return false;
                    }

                    if(lineEditMode && (isRowSelector || isHyperLink || rowtemplatemode)){
                        setTimeout(function(){
                            _base.Viewer().ShowLineActions(m_dataSource[rowid-1],rowid);						
                        },500);
                    }
                    
                    if (m_tapped == rid && !lineEditMode) {
                        _self.OnDoubleClick(rowid);					
                        return false;
                    }

                    m_tapped = rid;

                    if(rowid != m_selectedRow){
                        _self.OnRowSelect(rowid);
                    }
                    
                    _self.SelectRow(rowid);
                    _self.OnRowClick(rowid,_self.DataSourceById(rowid),r)				

                    //Clear old selected rows.
                    if(!rowtemplatemode){
                        $(".gridrows").css("background-color", "");
                        $(".rowselector").html("");
                    }

                    for (var i = 0; i < m_dataSource.length; i++) {
                        _self.OnBindRow(m_dataSource[i].RowId, m_dataSource[i], $('#tbody' + _base.ID()+' > #rid' + m_dataSource[i].RowId));
                    }

                    //Select this row.
                    if(!rowtemplatemode){
                        $(this).css("background-color", "Gainsboro");
                        if (img)
                            $(this).children()[0].innerHTML = img;
                    }

                    setTimeout(function () {
                        m_tapped = 0;
                    }, 1000);

                    return false;				
                });

            //Issue #96 - Add OnBindRow in mobile.
            _self.OnBindRow(rid, data, r);

            $('#tbody' + _base.ID()).append(r);
        };

        this.CreateEditRow = function () {

            var id = $id();
            var row = "<tr class='gridrows' style='-webkit-user-select: none;' id='tr" + id + "'>"
            row += "<th id='th" + id + "' class='ui-bar-a' colspan='" + m_cols.length + 1 + "'></th>";
            row += "</tr>";
            m_editRow = $(row);

            return id;
        };

        this.ShowEditor = function (i) {

            var parent_row = $('#' + _base.ID() + ' > tbody > tr:eq(' + i + ')');
            parent_row.after(m_editRow);

            m_editRow.css("background-color", $("#divMobileHeader").css("background-color"));
            parent_row.css("background-color", $("#divMobileHeader").css("background-color"));
            parent_row.addClass("ui-bar-a");
            parent_row.addClass("editingrow");

            m_grid.table('refresh');
        };

        this.EditorVisible = function () {
            if (!m_editRow)
                return false;
            return m_editRow.is(":visible");
        };

        this.OpenActions = function () {
            var win = _base.Viewer().Window();
            if (win && win.Actions().length > 0) {
                win.OpenActions();
            }
        };

        this.SelectRow = function (i) {
            m_selectedRow = i;
            
            if(Application.HasOption(_base.Viewer().Page().Options,"rowtemplate"))
                return;

			if (!m_grid.find("#rid"+i).children()[0]) return;
			var img = null; //Editor image.
            if (_base.Viewer().Page().DoubleClickAction())
                img = _base.Viewer().Page().DoubleClickAction().Image;
            if (_base.Viewer().EnableEditMode())
                img = "redo";
			if(_base.Viewer().LineActions().length > 0)
                img = "mdi-table-column-plus-after";
            
            if(img)
                img = "<i class='mdi "+UI.MapMDIcon(UI.MapIcon(img))+"' style='color: black; font-size: 17px'></i>";
			
			m_grid.find("#rid"+i).css("background-color", "Gainsboro");	
			if (img)
				m_grid.find("#rid"+i).children()[0].innerHTML = img;			
        };

        this.EditCurrentCell = function () {
        };

        this.EditFirstCell = function () {
        };

        this.EditCellByName = function (name_) {
        };

        this.SelectedRow = function (factor) {
            return m_selectedRow;
        };

        this.SumColumn = function (id_) {
			var amt = 0;
			 for (var i = 0; i < m_dataSource.length; i++) {
                amt += m_dataSource[i][id_];
            }
			return amt;
        };

        this.DataSourceById = function (id_) {
			if(!m_dataSource)
				return null;
			 for (var i = 0; i < m_dataSource.length; i++) {
                if (m_dataSource[i].RowId == id_) {
                    return m_dataSource[i];
                }
            }
            return null;
        };

        this.GetColumns = function () {
        };

        this.SetColumnHidden = function (col, h) {
            for (var i = 0; i < m_cols.length; i++) {
                if (m_cols[i].name == col) {
                    m_cols[i].hidden = h;
                    if (h) {
                        $('.' + m_cols[i].name + _base.ID()).hide();
                    } else {
                        $('.' + m_cols[i].name + _base.ID()).show();
                    }
                    m_grid.table('refresh');
                    return;
                }
            }
        };

        this.SetColumnCaption = function (col, val) {
            $("." + col + _base.ID()).text(val);
        };

        this.Save = function () {
        };

        this.ScrollToRow = function (rid) {
        };

        this.HideColumn = function (column) {
            _self.SetColumnHidden(column,true);
        };

        this.ShowColumn = function (column) {
            _self.SetColumnHidden(column,false);
        };

        this.Editable = function (column, editable) {
        };
		
		this.NewColumnOrder = function(value){
			if(typeof value == "undefined"){
				return m_newSort;
			}else{
				m_newSort = value;

				var new_cols = [];
				var new_colNames = [];

				value.splice(0, 1);
                for(var i = 0; i < value.length; i++){
                    new_cols.push(m_cols[value[i] - 1]);
                    new_colNames.push(m_colNames[value[i] - 1]);
                }

                m_cols = new_cols;
                m_colNames = new_colNames;

                $("#tr" + _base.ID()).html("");

                _self.CreateColumns();

                m_grid.table('refresh');

                if(m_dataSource)
                    _self.Bind();
			}
		};

        //#endregion

        //#region Public Properties

        this.Footer = function (value_) {

            if (value_ !== undefined) { //SET
                
				for(var i in value_){
					$('.foot' + i + _base.ID()).html(value_[i]);
				}

            } else { //GET

                return m_footer;
            }
        };

        this.DataSource = function (value_) {

            if (value_ !== undefined) { //SET

                m_dataSource = value_;

            } else { //GET

                return m_dataSource;
            }
        };

        this.Width = function (value_) {
			//$("#grid"+_base.ID()).css("max-width", value_);
        };

        this.Height = function (value_) {
            $("#grid"+_base.ID()).height(value_);
            m_grid.table('refresh');
        };

        this.SelectedRows = function () {
            return new Array();
        };
		
		this.ClearSelected = function () {            
        };
		
		this.SelectAll = function(){
		};

        //#endregion        

        //#region Overloaded Methods

        this.Enabled = function (enabled_) {
            //Not needed for grid.
        };

        //#endregion

        //#region Overrideable Methods

        this.OnCellSubmit = function (rowid, cellname, value, iRow, iCol) {
            return value;
        };

        this.OnDoubleClick = function (rowid, iRow, iCol, e) {
        };

        this.OnLoadFooter = function (grd) {
        };

        this.OnResizeCol = function () {
        };

        this.OnColumnChooserDone = function () {
        };

        this.OnRowSelect = function () {
        };

        this.OnBindRow = function () {
        };
		
		this.OnRowClick = function () {
        };

        function FormatData(value_, field_) {

            if (value_ == null || typeof value_ == "undefined")
                return "";

            //Dates and times
            if (field_.Type == "Date") {
                return $.format.date(value_, "dd/MM/yyyy");
            } else if (field_.Type == "DateTime") {
                return $.format.date(value_, "dd/MM/yyyy hh:mm a");
            } else if (field_.Type == "Time") {
                return $.format.date(value_, "hh:mm a");
            }

			if (field_.Type == "Boolean") {
				if(value_ == true){
					return "Yes";
				}else{
					return "No";
				}
			}
			
			if(field_.OptionCaption != ""){
				var vals = field_.OptionString.split(",");
				var captions = field_.OptionCaption.split(",");
				for (var i = 0; i < vals.length; i++) {
					if (field_.Type == "Integer") {
						if (parseInt(vals[i]) == value_ || value_ == null)
							return captions[i];
					} else {
						if (vals[i] == value_)
							return captions[i];
					}
				}
			}
			
            return value_;
        }

        function FieldOptionExists(option){
            var viewer = _base.Viewer();  
            if(viewer && viewer.Page){                
                for (var j = 0; j < viewer.Page().Fields.length; j++) {
                    var field = viewer.Page().Fields[j];
                    if(Application.HasOption(field.Options,option)){
                        return true;
                    }
                }
            }
            return false;
        }

        this.RowTemplate = function(data){     
            var viewer = _base.Viewer();  
            if(viewer && viewer.Page){     
                if(FieldOptionExists("primary") || FieldOptionExists("secondary")){
                    var html = '<table><tr><td style="background:transparent">';
                    html += '<i class="mdi '+viewer.Page().Icon+'" style="font-size: 50px; line-height: 60px;" />';
                    html += '</td><td style="background:transparent">'; 
                    var secondary = FieldOptionExists("secondary");                   
                    for (var j = 0; j < viewer.Page().Fields.length; j++) {
                        var field = viewer.Page().Fields[j];
                        if(Application.HasOption(field.Options,"primary"))
                            html += '<h3 style="margin: '+ (secondary ? '10px':'20px') +' 0 0 0">'+FormatData(data[field.Name],field)+'</h3>';
                    }
                    for (var j = 0; j < viewer.Page().Fields.length; j++) {
                        var field = viewer.Page().Fields[j];
                        if(Application.HasOption(field.Options,"secondary")){
                            var val = FormatData(data[field.Name],field);
                            if(val)
                                html += field.Caption + ': '+ val +'<br>';
                        }
                    }
                    html += '</td></tr></table>';
                    return html;
                }else{
                    return Application.StrSubstitute(
                        "<table><tr><td style='background:transparent'>$2</td><td style='background:transparent'><h3 style='margin-top: 20px'>$1</h3></td></tr></table>",
                        Default(data.Code || data.Description,'New Record'),
                        '<i class="mdi '+viewer.Page().Icon+'" style="font-size: 50px; line-height: 60px;" />'    
                    );    
                }          
            }
        };

        this.RowTemplateStyle = function(){
            return {};
        };

        //#endregion                           

        //Constructor
        this.Constructor();

    });

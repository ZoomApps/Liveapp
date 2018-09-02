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
        var m_selected = new Array();
        var m_loading = false;
        var m_timeoutID = null;
        var m_grouping = null;
		var m_newSort = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Grid");

            //Add row id column;
            m_colNames.push(" ");
            m_cols.push({ name: 'RowId', index: 'RowId', width: '20px', fixed: true, editable: false, sortable: true, search: false, align: 'center', classes: 'row-id', hidedlg: true,
                formatter: function (cellvalue, options, rowObject) {
                    var temp = false;
                    if (_base.Viewer() && Application.HasOption(_base.Viewer().Page().Options, "temp"))
                        temp = true;
                    if (rowObject.Record && !temp && (rowObject.Record.NewRecord || rowObject.NoKeys())) {
                        return UI.IconImage("row_add_after");
                    }
                    return cellvalue;
                }
            });
        };

        this.Create = function (window_, footer_) {

            var gridid = "#" + _base.ID() + "table";
            var grid = $('<div id="' + _base.ID() + '"><table id="' + _base.ID() + 'table"></table></div>');

            window_.AddControl(grid);

            var width = $('#' + window_.ID()).width();

            var height = '10px';

            m_footer = footer_;

            grid.on("click", function (e) {
                if (e.target.className === "ui-jqgrid-bdiv") {
                    _self.Save();
                }else{
					Application.RunSilent(function(){
						var parent = $(e.target).parent();
						if (parent.length > 0 && parent[0].className === "ui-jqgrid-bdiv") {
							_self.Save();
						}
					});
				}
            });

            //Get grouping details.
            var options = _base.Viewer().Page().Options;
            var grpfields = Application.OptionValue(options, "groupfields");
            var grpfieldCaptions = Default(Application.OptionValue(options, "groupfieldcaptions"), grpfields);
            var grpclmshow = Default(Application.OptionValue(options, "groupcolumnshow"), false); if (grpclmshow == "true") grpclmshow = true;
            var grptext = Default(Application.OptionValue(options, "grouptext"), "{3}: {0}");
            var grpcoll = Default(Application.OptionValue(options, "groupcollapse"), null); if (grpcoll == "true") grpcoll = true;
            var grpsum = Default(Application.OptionValue(options, "groupsummary"), null); if (grpsum == "true") grpsum = true;
            var colspan = Default(Application.OptionValue(options, "footerspan"), 4);

            m_grouping = null;
            if (grpfields) {
                var gf = grpfields.split(",");
                m_grouping = {
                    groupField: gf,
                    groupFieldCaption: grpfieldCaptions.split(","),
                    groupColumnShow: Application.CreateArray(gf.length, grpclmshow),
                    groupText: Application.CreateArray(gf.length, grptext),
                    groupCollapse: grpcoll,
                    groupSummary: Application.CreateArray(gf.length, grpsum),
                    showSummaryOnHide: grpsum,
                    colspan: colspan
                };
            }

            jQuery(gridid).jqGrid({

                datatype: "local",
                data: new Array(),
                autowidth: false,
                height: height,
                width: 1,
                colNames: m_colNames,
                colModel: m_cols,
                shrinkToFit: false,
                rowNum: 50000,
                pginput: false,
                viewrecords: true,
                cellEdit: true,
                multiselect: false,
                cellsubmit: 'clientArray',
                sortable: true,
                multiSort: true,
                scrollrows: true,
                footerrow: footer_,
                autoencode: true, //#85 - Sanitize String				
				
                grouping: (m_grouping != null),
                groupingView: m_grouping,

                //Hookup events.
                beforeSubmitCell: function (rowid, cellname, value, iRow, iCol) {                                        
                    return _self.OnCellSubmit(rowid, cellname, value, iRow, iCol);
                },
                ondblClickRow: function (rowid, iRow, iCol, e) {
                    _self.OnDoubleClick(rowid, iRow, iCol, e);
                },
                onRightClickRow: function (rowid, iRow, iCol, e) {
                    _self.SelectRow(rowid);
                    _self.OnRightClick(rowid, iRow, iCol, e);
                    e.preventDefault();
                    return false;
                },
                loadComplete: function () {
                    //if (footer_)
                    //    _self.OnLoadFooter(_self);
                },
                resizeStop: function () {
                    _self.OnResizeCol();
                },
                onColumnChooserDone: function () {
                    _self.OnColumnChooserDone();
                },
				onSortCol: function(){
                    _self.OnSortCol();
                    if(m_dataSource)
                        OnBind(0,m_dataSource.length);
				},
                beforeSelectRow: function (rowid, e) {

                    var multiselect = true;
                    if (_base.Viewer() && Application.HasOption(_base.Viewer().Page().Options, "nomultiselect"))
                        multiselect = false;

                    if (!e.ctrlKey || !multiselect) {

                        for (var i = 0; i < m_selected.length; i++) {
                            var rowid = _self.GetRowID(m_selected[i]);
                            if (rowid) {
                                var ind = m_grid[0].rows.namedItem(rowid);
                                $(ind).removeClass("ui-state-highlight");
                            }
                        }
                        m_selected = new Array();
                        //_self.SelectRow(rowid);

                    } else {

                        if (rowid == _self.SelectedRow())
                            return;

                        var ind = m_grid[0].rows.namedItem(rowid);
                        var recid = _self.DataSourceById(rowid).Record.RecID;

                        if ($(ind).hasClass("ui-state-highlight")) {

                            for (var i = 0; i < m_selected.length; i++) {
                                if (m_selected[i] == recid) {
                                    m_selected.splice(i, 1);
                                    break;
                                }
                            }

                            $(ind).removeClass("ui-state-highlight");

                        } else {

                            if (m_selected.indexOf(recid) == -1)
                                m_selected.push(recid);

                            $(ind).addClass("ui-state-highlight");
                        }
                        return false;
                    }

                    if (rowid != _self.SelectedRow()){
                        _self.OnRowSelect(rowid, e);
					}
					
					_self.OnRowClick(rowid, _self.DataSourceById(rowid), m_grid.getInd(rowid, true));
					
                    return true;
                }

            });

            m_grid = $(gridid);
        };

		this.Dispose = function(){
			if(m_dataSource)
				for(var i = 0; i < m_dataSource.length; i++){
					m_dataSource[i].Dispose();				
				}
			$("#" + _base.ID()).remove();
			m_grid = null;
			_base.Dispose();	
			this.prototype = null;			
			_base = null;
			_self = null;			
		};
		
        this.AddColumn = function (field) {

            if (field.Hidden) return;

            var caption = field.Caption;
            if (field.Width == "999")
                field.Width = '200';

            m_colNames.push(caption);

            var sumtype = Application.OptionValue(field.Options, "summarytype");
            if (field.Type == "Integer" || field.Type == "Decimal")
                sumtype = "sum";
            if (!field.Totals)
                sumtype = null;

            if (field.CustomControl != "") {

                m_cols.push({
                    name: field.Name,
                    index: field.Name,
                    width: field.Width,
                    editable: field.Editable,
                    hidden: false,
                    sortable: true,
                    edittype: 'custom',
                    summaryType: sumtype,
					skipsanitize: Application.HasOption(field.Options,"skipsanitize"),
                    formatter: function (cellvalue, options, rowObject) {

                        //Create the control.						
                        var cont = null;
                        eval("cont = new " + field.CustomControl + "(field, _base.Viewer());");

                        //Get the value.
                        if (typeof cont.FormatValue != "undefined") {
                            return cont.FormatValue(cellvalue, rowObject);
                        }

						cellvalue = MandatoryCheck(cellvalue,field);
						
                        if (cellvalue == null || cellvalue == "null")							
								return "";							

                        return cellvalue;
                    },
                    editoptions: {
                        custom_element: function (value, options) {

							value = MandatoryRevert(value, field);
						
                            //Create the control.
                            var cont = null;
                            eval("cont = new " + field.CustomControl + "(field, _base.Viewer());");
                            var ele = cont.CreateList(value);

                            //Set the size and focus.
                            //cont.SetSize(field.Width);
                            setTimeout(function () { cont.Focus(); }, 50);

                            return ele;
                        },
                        custom_value: CustomValue
                    }
                });

            } else if (field.Type == "Date") { //DATE

                m_cols.push({
                    name: field.Name,
                    index: field.Name,
                    width: field.Width,
                    editable: field.Editable,
                    hidden: false,
                    sortable: true,                    
                    edittype: 'custom',
                    align: 'center',					
					formatter: function (cellvalue, options, rowObject) {						
						cellvalue = MandatoryCheck(cellvalue,field);
                        if (cellvalue == null || cellvalue == "null" || cellvalue == "")
                            return "";
                        if(typeof cellvalue === "string" && cellvalue.indexOf("Mandatory") != -1)
							return cellvalue;
						if(typeof cellvalue === "string")
							cellvalue = Application.ParseDate(cellvalue);
                        return $.format.date(cellvalue, "dd/MM/yyyy");
                    },
                    editoptions: {
                        custom_element: function (value, options) {

							value = MandatoryRevert(value, field);
							
                            //Create the datepicker.
                            var dte = new DatePicker(field, _base.Viewer());
                            var ele = dte.CreateList(value);

                            //Set the size and focus.
                            //dte.SetSize(field.Width);
                            setTimeout(function () { dte.Focus(); }, 50);

                            return ele;
                        },
                        custom_value: CustomValue
                    },
                    sorttype: "date",
                    datefmt: "ddmmyy"
                });

            } else if (field.Type == "DateTime") { //DATE TIME

                m_cols.push({
                    name: field.Name,
                    index: field.Name,
                    width: field.Width,
                    editable: field.Editable,
                    hidden: false,
                    sortable: true,
                    edittype: 'custom',
                    align: 'center',
                    formatter: function (cellvalue, options, rowObject) {
						cellvalue = MandatoryCheck(cellvalue,field);
                        if (cellvalue == null || cellvalue == "null" || cellvalue == "")
                            return "";
						if(typeof cellvalue === "string")
							return cellvalue;
                        return $.format.date(cellvalue, "dd/MM/yyyy hh:mm a");
                    },
                    editoptions: {
                        custom_element: function (value, options) {

							value = MandatoryRevert(value, field);
						
                            //Create the datetimepicker.
                            var dte = new DateTimePicker(field, _base.Viewer());
                            var ele = dte.CreateList(value);

                            setTimeout(function () { dte.Focus(); }, 50);

                            return ele;
                        },
                        custom_value: CustomValue
                    }
                });

            } else if (field.Type == "Time") { //TIME

                m_cols.push({
                    name: field.Name,
                    index: field.Name,
                    width: field.Width,
                    editable: field.Editable,
                    hidden: false,
                    sortable: true,                    
                    edittype: 'custom',
                    align: 'center',
					formatter: function (cellvalue, options, rowObject) {
						cellvalue = MandatoryCheck(cellvalue,field);
                        if (cellvalue == null || cellvalue == "null" || cellvalue == "")
                            return "";
                        if(typeof cellvalue === "string" && cellvalue.indexOf("Mandatory") != -1)
							return cellvalue;
						if(typeof cellvalue === "string")
							cellvalue = Application.ParseTime(cellvalue);
                        return $.format.date(cellvalue, "hh:mm a");
                    },
                    editoptions: {
                        custom_element: function (value, options) {

							value = MandatoryRevert(value, field);
						
                            //Create the datepicker.
                            var tm = new TimePicker(field, _base.Viewer());
                            var ele = tm.CreateList(value);

                            setTimeout(function () { tm.Focus(); }, 50);

                            return ele;
                        },
                        custom_value: CustomValue
                    },
                    formatoptions: { srcformat: 'ShortTime', newformat: 'ShortTime' }
                });

            } else if (field.LookupTable != '' || field.OptionCaption != "") { //COMBO

                m_cols.push({
                    name: field.Name,
                    index: field.Name,
                    width: field.Width,
                    editable: field.Editable,
                    hidden: false,
                    sortable: true,
					sorttype: function (cellvalue, rowObject) {
						return UpdateComboCell(field, cellvalue, rowObject);
					},
                    edittype: 'custom',
					skipsanitize: Application.HasOption(field.Options,"skipsanitize"),
                    formatter: function (cellvalue, options, rowObject) {
						return UpdateComboCell(field, cellvalue, rowObject);                        
                    },
                    editoptions: {
                        custom_element: function (value, options) {

							value = MandatoryRevert(value, field);
						
                            //_base.Viewer().GetRecordByRowId(_self.SelectedRow());

                            //Create the combobox.
                            var combo = new Combobox(field, _base.Viewer());
                            var ele = combo.CreateList(value);

                            //Set the size and focus.                            
                            //combo.SetSize(field.Width);
                            setTimeout(function () { combo.Focus(); }, 50);

                            return ele;
                        },
                        custom_value: CustomValue
                    }
                });

            } else if (field.IncrementDelta != 0) { //SPINNER

                m_cols.push({
                    name: field.Name,
                    index: field.Name,
                    width: field.Width,
                    editable: field.Editable,
                    hidden: false,
                    sortable: true,
					sorttype: function (cell, obj) {
						if((field.Type == "Integer" || field.Type == "Decimal") && cell && cell != "")
							return parseFloat(cell);
						return cell;
					},
                    edittype: 'custom',
                    align: 'right',
                    summaryType: sumtype,
                    editoptions: {
                        custom_element: function (value, options) {

                            //Create the spinner.
                            var txt = new Spinner(field, _base.Viewer());
                            var ele = txt.CreateList(value);

                            //Set the size and focus.
                            //txt.SetSize(field.Width);
                            setTimeout(function () { txt.Focus(); }, 50);

                            return ele;
                        },
                        custom_value: CustomValue
                    }
                });

            } else if (field.Type == "Boolean") { //BOOLEAN

                m_cols.push({
                    name: field.Name,
                    index: field.Name,
                    width: field.Width,
                    editable: false,
                    hidden: false,
                    sortable: true,
                    edittype: 'custom',
                    align: 'center',
                    formatter: function (cellvalue, options, rowObject) {

                        var checked = '';
                        if (cellvalue == true || cellvalue == "Yes" || cellvalue == "True") {
                            checked = 'checked';
                        }

                        var disabled = '';
                        if (!field.Editable)
                            disabled = 'disabled=true';

                        var id = $id();
                        var input = "<input type='checkbox' class='noinput' id='" + id + "' " + disabled + " " + checked + "  />";
                        setTimeout(function () {
                            $("#" + id).on('click', function () {
                                _self.SelectRow(rowObject.RowId);
                                _base.Viewer().RecordValidate(field.Name, this.checked, rowObject.RowId);
                            });
                        }, 10);
                        return input;
                    }
                });

            } else { //STRING,INT,DECIMAL

                var align = "left";
                if (field.Type == "Integer" || field.Type == "Decimal")
                    align = "right";
                m_cols.push({
                    name: field.Name,
                    index: field.Name,
                    width: field.Width,
                    editable: field.Editable,
                    hidden: false,
                    sortable: true,
					sorttype: function (cell, obj) {
                        if((field.Type == "Integer" || field.Type == "Decimal") && cell && cell.replace && field.Mask !== '')
                            cell = cell.replace(/\,/g,'');                        
						if((field.Type == "Integer" || field.Type == "Decimal") && cell && cell != "")
							return parseFloat(cell);
						return cell;
					},
                    edittype: 'custom',
                    align: align,
                    summaryType: sumtype,
					skipsanitize: Application.HasOption(field.Options,"skipsanitize"),					
                    formatter: function (cellvalue, options, rowObject) {
						cellvalue = MandatoryCheck(cellvalue,field);
                        if (cellvalue == null || cellvalue == "null")
                            return "";
                        if((field.Type == "Integer" || field.Type == "Decimal") && cellvalue && cellvalue.replace && field.Mask !== '')
                            cellvalue = cellvalue.replace(/\,/g,'');
                        if(field.Mask){
                            var opts = null;
                            var mask = field.Mask;
                            if(mask.indexOf(":") !== -1){
                                opts = {
                                    colModel: {
                                        formatoptions: {
                                           decimalPlaces: parseInt(mask.split(':')[1])
                                        }
                                    }
                                }
                                mask = mask.split(':')[0];
                            }
                            return $.fn.fmatter(mask, cellvalue, opts); 
                        }
                        return cellvalue;
                    },
                    editoptions: {
                        custom_element: function (value, options) {

                            if((field.Type == "Integer" || field.Type == "Decimal") && value && value.replace && field.Mask !== '')
                                value = value.replace(/\,/g,'');

							value = MandatoryRevert(value, field);
							
                            //Create the textbox.
                            var txt = new Textbox(field, _base.Viewer());
                            var ele = txt.CreateList(value);

                            //Set the size and focus.                            
                            setTimeout(function () { txt.Focus(); }, 50);

                            return ele;
                        },
                        custom_value: CustomValue
                    }
                });
            }
        };

        this.AddRow = function (rowid, data, skipselect) {

            m_grid.addRowData('RowId', [data]);
            this.SetDataRow(rowid, data, skipselect);

            if (skipselect)
                return;

            return this.SelectRow(rowid);
        };

        this.RemoveRow = function (rowid) {
            m_grid.delRowData(rowid);
            m_dataSource.splice(rowid - 1, 1);
        };

        this.SetDataRow = function (rowid, data, skipfooter) {

            for (var i = 0; i < m_grid[0].p.data.length; i++) {
                if (m_grid[0].p.data[i].RowId == rowid) {
                    m_grid[0].p.data[rowid - 1] = data;
                    break;
                }
            }

            m_grid.setRowData(rowid, data);
            if (m_footer && !skipfooter)
                _self.OnLoadFooter(_self);

            _self.OnBindRow(rowid, data, m_grid.getInd(rowid, true));
        };

        this.Loading = function () {
            return m_loading;
        };

        this.StopLoad = function () {

            if (m_timeoutID != null)
                clearTimeout(m_timeoutID);
            m_timeoutID = null;

        };

        this.GetSort = function () {
            return m_grid.getGridParam("sortname") + ";" + m_grid.getGridParam("sortorder");
        };

        this.SetSort = function (sort) {
            try {   
                var columns = sort.split(";")[0].split(','); 
                var order = sort.split(";")[1].split(',');
                for(var i = 0; i < columns.length; i++){     
                    m_grid.jqGrid('sortGrid', columns[i], true, Default(order[i],'asc'));
                }
            } catch (e) {
            }
        };

        this.Bind = function (selected) {

            var w = $wait();

            $code(

                function () {

                    _self.StopLoad();

                    m_loading = true;
                    
                    var load = Default(Application.OptionValue(_base.Viewer().Page().Options, "loadrows"), 50);

                    var srt = _self.GetSort();
                    if (srt == ";asc") srt = null;

                    if (m_grouping != null || srt)
                        load = 99999999;

					var initdata = GetData(0, load);
					
                    m_grid.clearGridData();
                    m_grid.setGridParam({ data: initdata });
                    m_grid[0].refreshIndex();					
					
                    if (srt)
                        _self.SetSort(srt);

                    m_grid.trigger('reloadGrid', { current: true });

                    RenderSelected();
                    OnBind(0, load);

					if(selected != -1 && selected != null){
						var rid = _self.GetRowID(selected);
						for(var j = 0; j < initdata.length; j++){							
							if (initdata[j].RowId == rid) {
								_self.SelectRow(rid);
								_self.ScrollToRow(rid);
								_base.Viewer().GetRecordByRowId(rid);
								selected = -1;
							}							
						}
					}
					
                    if (m_dataSource.length > load) {
                        LoadNextRecords(load, load, selected);
                    } else {

                        m_loading = false;

                        if (selected != null) {
                            var rid = _self.GetRowID(selected);
                            _self.SelectRow(rid);
                        }

                        if (m_footer)
                            _self.OnLoadFooter(_self);
                    }

                    _base.Loaded(true);
                }

            );

            return w.promise();
        };

        this.GetRowID = function (recid) {
            for (var i = 0; i < m_grid[0].p.data.length; i++) {
                if (m_grid[0].p.data[i].Record.RecID == recid) {
                    return m_grid[0].p.data[i].RowId;
                }
            }
            return null;
        };

        this.SelectRow = function (rid) {
            var i = m_grid.getInd(rid);
            Application.RunSilent(function () {
                m_grid.jqGrid("editCell", i, 1, false);
            });
        };

        this.EditCurrentCell = function () {
            if (m_grid[0].p.iCol != 0) {
                m_grid.editCell(this.SelectedRow(), m_grid[0].p.iCol, true);
            } else {
                this.EditFirstCell();
            }
        };

        this.EditFirstCell = function () {
            var cols = _self.GetColumns();
            for (var j = 0; j < cols.length; j++) {
                if (cols[j].editable == true && cols[j].hidden == false) {
                    m_grid.editCell(this.SelectedRow(), j, true);
                    break;
                }
            }
        };

        this.EditCellByName = function (name_) {
            for (var j = 0; j < m_cols.length; j++) {
                if (m_cols[j].name == name_) {
                    m_grid.editCell(this.SelectedRow(), j, true);
                    break;
                }
            }
        };

        this.SelectedRow = function (factor) {
            if (factor == null)
                factor = 0;
            var gridArr = m_grid.getDataIDs();
            var selrow = m_grid.getGridParam("selrow");
            for (var i = 0; i < gridArr.length; i++) {
                if (gridArr[i] == selrow) {
                    if (factor == 1 && i == gridArr.length - 1)
                        return null;
                    if (factor == -1 && i == 0)
                        return null;
                    return gridArr[i + factor];
                }
            }
            return null;
        };

        this.SumColumn = function (id_) {
            return m_grid.getCol(id_, false, 'sum');
        };

        this.DataSourceById = function (id_) {
            for (var i = 0; i < m_grid[0].p.data.length; i++) {
                if (m_grid[0].p.data[i].RowId == id_) {
                    return m_grid[0].p.data[i];
                }
            }
            return null;
        };

        this.GetColumns = function () {
            return m_grid.getGridParam("colModel");
        };

        this.SetColumnHidden = function (col, h) {
            if (h) {
                m_grid.hideCol(col);
            } else {
                m_grid.showCol(col);
            }
        };

        this.SetColumnCaption = function (col, val) {
            m_grid.setLabel(col, val);
        };

        this.Save = function () {

            var savedrows = m_grid[0].p.savedRow;
            for (var i = 0; i < savedrows.length; i++) {
                m_grid.saveCell(savedrows[i].id, savedrows[i].ic);
            }
        };

        this.GridRowHeight = function () {

            var height = null;

            try {
                height = m_grid.find('tbody').find('tr:first').outerHeight();
            }
            catch (e) {
                //catch and just suppress error
            }

            return height;
        };

        this.ScrollToRow = function (rid) {
            setTimeout(function () {
                var rowHeight = _self.GridRowHeight() || 23; // Default height
                var index = m_grid.getInd(rid);
                m_grid.closest(".ui-jqgrid-bdiv").scrollTop(rowHeight * (index - 1));
            }, 1);
        };

        this.HideColumn = function (column) {
            m_grid.hideCol(column);
        };

        this.ShowColumn = function (column) {
            m_grid.showCol(column);
        };

        this.Editable = function (column, editable) {
            m_grid.setColProp(column, { editable: editable });
			var field = _base.Viewer().Page().GetField(column);
			if(field){
				field.Editable = editable;
			}
        };
		
		this.NewColumnOrder = function(value){
			if(typeof value == "undefined"){
				return m_newSort;
			}else{
				m_newSort = value;
				m_grid.remapColumns(value,true,false);
			}
		};

        //#endregion

        //#region Public Properties

        this.Footer = function (value_) {

            if (value_ !== undefined) { //SET

                m_grid.footerData('set', value_);

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

            m_grid.setGridWidth(10, true);
            m_grid.setGridWidth(value_, false);			
			//newWidth = m_grid.closest(".ui-jqgrid").parent().width();
			//m_grid.jqGrid("setGridWidth", newWidth, true);
        };

        this.Height = function (value_) {
            var h = value_;
            if (m_footer)
                h -= 30;
            h -= $("#" + _base.ID()).find("tr[role='rowheader']").height() + 2; //Issue #58 - Block page height issue
            m_grid.setGridHeight(10, true);
            m_grid.setGridHeight(h, false);
        };

        this.SelectedRows = function () {
            return m_selected;
        };
		
		this.ClearSelected = function () {
            m_selected = [];
        };

        this.CurrentEditor = function (rid) {
            try {
                var selector = $("td[role='gridcell']:eq(" + m_grid[0].p.iCol + ")", m_grid[0].rows.namedItem(rid));
                return UI.FindEditorInput(selector);
            } catch (e) {
            }
            return null;
        };

        this.CurrentColumn = function () {
            try {
                return m_grid.getGridParam("colModel")[m_grid[0].p.iCol];
            } catch (e) {
            }
            return null;
        };
		
		this.SelectAll = function(){
			
			m_selected = [];
			if(m_dataSource.length > 0)
				_self.SelectRow(1);
			
			if(m_dataSource.length > 1)
				for (var i = 1; i < m_dataSource.length; i++) {
					m_selected.push(m_dataSource[i].Record.RecID);
					var ind = m_grid[0].rows.namedItem(i+1);
					if (!$(ind).hasClass("ui-state-highlight")) {
						$(ind).addClass("ui-state-highlight");
					};
				}							
		};

        //#endregion

        //#region Private Methods

		function MandatoryCheck(cellvalue, field){
			if (cellvalue == null || cellvalue == "null" || cellvalue == 0)
				if(field.Mandatory)
					return "<span style='color: red; font-style: italic'>Mandatory</span>";				
			return cellvalue;
		};
		
		function MandatoryRevert(value, field){
			if(value && value.indexOf("Mandatory</span>") != -1)
				return "";
			return value;
		};
		
        function CustomValue(elem, op, value) {
            var editor = UI.FindEditorInput($(elem));
            if (op == "set" && editor) {				
                editor.val(value);
            }
            if (!editor)
                return null;
            return editor.val();
        };

        function GetData(offset, load) {
            var ret = [];
            for (var i = offset; i < m_dataSource.length; i++) {
                if (ret.length == load)
                    return ret;
                ret.push(m_dataSource[i]);
            }
            return ret;
        };

        function LoadNextRecords(offset, load, selected) {
            m_timeoutID = setTimeout(function () {

                var d = GetData(offset, load);
                for (var j = 0; j < d.length; j++) {
                    _self.AddRow(d[j].RowId, d[j], true);

                    if (selected != -1) {
                        if (selected != null) {
                            var rid = _self.GetRowID(selected);
                            if (d[j].RowId == rid) {
                                _self.SelectRow(rid);
                                _self.ScrollToRow(rid);
                                _base.Viewer().GetRecordByRowId(rid);
                                selected = -1;
                            }
                        }
                    }
                }
                offset += load;
                RenderSelected();

                if (offset < m_dataSource.length) {
                    LoadNextRecords(offset, load, selected);
                }
                else {
                    m_loading = false;
                    if (m_footer)
                        _self.OnLoadFooter(_self);					
                }
            }, 0);
        };

        function RenderSelected() {
            for (var i = 0; i < m_selected.length; i++) {
                Application.RunSilent(function () {
                    var rowid = _self.GetRowID(m_selected[i]);
                    if (rowid) {
                        var ind = m_grid[0].rows.namedItem(rowid);
                        $(ind).addClass("ui-state-highlight");
                    }
                });
            }
        };

        function OnBind(offset, load) {
            setTimeout(function(){
                for (var i = offset; i < m_dataSource.length; i++) {
                    if (i > offset + load)
                        return;
                    _self.OnBindRow((i+1), m_dataSource[i], m_grid.getInd(i + 1, true));
                }
            },50);
        };		
		
		function UpdateComboCell(field, cellvalue, rowObject){
			
			if (field.OptionString != "") {
				var vals = field.OptionString.split(",");
				var captions = field.OptionCaption.split(",");
				for (var i = 0; i < vals.length; i++) {
					if (field.Type == "Integer") {
						if (parseInt(vals[i]) == cellvalue || cellvalue == null)
							return captions[i];
					} else {
						if (vals[i] == cellvalue)
							return captions[i];
					}
				}
			} else {
				if (field.LookupDisplayField != "") {
					if (rowObject.Record) {
						for (var i = 0; i < rowObject.Record.Fields.length; i++) {
							if (rowObject.Record.Fields[i].Name == "FF$" + field.Name) {
								cellvalue = rowObject.Record.Fields[i].Value;
							}
						}
					}
				}
				cellvalue = MandatoryCheck(cellvalue,field);
				if (cellvalue == 0 || cellvalue == null || cellvalue == "null") {
					return "";
				}
			}
			return cellvalue;
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

        this.OnRightClick = function (rowid, iRow, iCol, e) {
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
		
		this.OnSortCol = function(){		
		};

        //#endregion                           

        //Constructor
        this.Constructor();

    });
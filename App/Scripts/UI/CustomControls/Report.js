/// <reference path="../Application.js" />

Define("Report",

    function (field_, viewer_) {
        return new Control("Report", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_container = null;
        var m_data = null;
        var m_form = null;
        var m_design = null;
        var m_mergeFields = new Object();
        var m_record = null;
        var m_view = null;
		var m_baseView = null;
		var m_filterOptions = "";
		var m_reportOptions = null;
		var m_uid = null;
		var m_filterData = new Object();
		var m_groupFields = null;
		var m_groupFieldCaptions = null;
		var m_emailOptions = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Report");
        };

        this.CreateDesktop = function (window_, form_) {

            m_form = form_;
			
			m_uid = form_.Name + _base.Viewer().View();

            //Create the control.
            m_container = $('<div id="' + _base.ID() + '" style="width: 100%; height: auto;"></div>');
            //m_container.css("min-height", UI.Height() - 100);

            //Base design.
            m_design = "<div style='width: 100%; height: auto; font-family: Arial; font-size: 12px;'><table style='width: 100%;'>";
            m_design += "<tr><td style='vertical-align: top;'>%logo<h2>%title</h2></td><td style='width: 200px; text-align: right;'>Date: %date<br/>%userid</td></tr>";
            m_design += "<tr><td colspan='2'>%filters</td></tr>";
			m_design += "<tr><td colspan='2'><br/>%description</td></tr>";
            m_design += "<tr><td colspan='2'><table cellspacing='0' cellpadding='5'>";
            m_design += "<thead><tr style='background-color: "+$('.main-title').css('background-color')+"; color: "+$('.main-title').css('color')+"; -webkit-print-color-adjust: exact;'>%columns</tr></thead>";
            m_design += "%rows";
            m_design += "</table></td></tr>";
            m_design += "</table></div>";

            //Base merge fields.
            m_mergeFields["%title"] = m_form.Caption;
            m_mergeFields["%date"] = $.format.date(new Date(), "dd/MM/yyyy");
            m_mergeFields["%userid"] = Application.auth.Username;
            m_mergeFields["%columns"] = "<th style='font-weight: bold; width: %columnwidthpx; text-align: %colalign; font-size: 12px;'>%columncaption</th>";
            m_mergeFields["%rows"] = "<tr>%cells</tr>";
            m_mergeFields["%cells"] = "<td style='text-align: %cellalign; font-size: 12px;'>%cellvalue</td>";
			m_mergeFields["%description"] = "";
			m_mergeFields["%filters"] = "";
			m_mergeFields["%logo"] = "";
			
            window_.AddControl("<br/>");
			
            window_.AddControl("<a id='btnPrint" + _base.ID() + "'>" + UI.IconImage("printer") + " Print</a>");
            $("#btnPrint" + _base.ID()).button().hide().click(function () {
				
				var landscape = Application.HasOption(m_form.Options,"landscape");
				
				var printfunc = function(){
					var w = 800;
					var h = 800;
					var left = (screen.width/2)-(w/2);
					var top = (screen.height/2)-(h/2);					
					var wnd = window.open('', m_uid, 'left=0,top=0,width='+w+',height='+h+',toolbar=0,scrollbars=0,status=0, top='+top+', left='+left);
					_base.Viewer().ShowLoad();
					setTimeout(function(){
						wnd.document.write("<html><head><title>Print Preview</title><style>@media print {thead {display: table-header-group;}}</style></head><body>" + m_container.html() + "</body></html>");
						wnd.document.close();
						wnd.focus();
						wnd.print();
						wnd.close();
						_base.Viewer().HideLoad();
					},2000);
				};
				
				if(landscape){
					Application.Message("Before printing, please select 'Preferences' and change orientation to landscape.",function(){
						printfunc();
					});					
				}else{
					printfunc();
				}					
            });
			
			if(!Application.HasOption(m_form.Options,"skipfilters")){
				window_.AddControl("<a id='btnFilters" + _base.ID() + "'>" + UI.IconImage("row_add") + " Filters</a>");
				$("#btnFilters" + _base.ID()).button().hide().click(function () {
					_self.ShowFilters();
				});				
			}
			
			window_.AddControl("<a id='btnExportCSV" + _base.ID() + "'>" + UI.IconImage("table_sql") + " Export to CSV</a>");
            $("#btnExportCSV" + _base.ID()).button().hide().click(function () {
                _self.ExportCSV();
            });

			window_.AddControl("<a id='btnEmailPDF" + _base.ID() + "'>" + UI.IconImage("mail_attachment") + " Email PDF</a>");
            $("#btnEmailPDF" + _base.ID()).button().hide().click(function () {
				var data = GenerateReportData(m_record);
                _self.EmailPDF(data);
            });
			
			if(!Application.HasOption(m_form.Options,"skipfilters")){
				window_.AddControl("<label id='filters"+_base.ID()+"' class='ui-state-hover' style='display: none; font-size: 11px; width: auto; float: right; margin-right: 10px; padding: 3px; max-width: 500px;'></label>");
				$("#filters"+_base.ID()).click(function(){
					_self.ShowFilters();
				});
			}
			
			if(Application.IsInMobile()){
				$("#btnFilters" + _base.ID()).parent().css("width","100px").css("display","inline-block");
				$("#btnPrint" + _base.ID()).parent().css("width","100px").css("display","inline-block");
				$("#btnExportCSV" + _base.ID()).parent().css("width","100px").css("display","inline-block");
				$("#btnEmailPDF" + _base.ID()).parent().css("width","100px").css("display","inline-block");
			}
			
            window_.AddControl(m_container);				

            var options = m_form.Options;
            m_groupFields = Application.OptionValue(options, "groupfields");
            m_groupFieldCaptions = Default(Application.OptionValue(options, "groupfieldcaptions"), m_groupFields);

            _self.Loaded(true);

			m_baseView = _base.Viewer().View();				
			
			if(!Application.HasOption(m_form.Options,"skipfilters"))
				_self.ShowFilters();
        };

        this.CreateMobile = function (window_, form_) {
            return _self.CreateDesktop(window_, form_);
        };

		this.ShowFilters = function(){
			
			//Show filters.
            Application.RunNext(function(){
				
				return $codeblock(
				
					function(){
						return _self.LoadReportOptions();
					},
				
					function(){	
						
						if(!m_reportOptions)
							m_reportOptions = new Object();										
						
						var opts = {
							page: m_form,
							view: Application.CombineViews(m_filterOptions, m_baseView),
							caption: _base.Viewer().Options()["caption"],
							filtercolumns: Application.OptionValue(m_form.Options, "filtercolumns"),
							optionvalues: m_reportOptions,
							addfilterdata: _self.AddFilterData
						};
						
						var options = null;
						
						if(typeof _self.OptionsPage != "undefined"){
							options = _self.OptionsPage(opts);							
						}else{
							options = new OptionsWindow(opts);
						}
						
						if(options.CloseFunction() == null){
							
							options.CloseFunction(function(okclicked){    
							
							  if(okclicked){
								  
								m_reportOptions = options.GetOptions();
								m_view = options.GetView();
								m_filterOptions = options.GetView();
								_self.SaveReportOptions();
								if (m_view == null)
									return _base.Viewer().Close();
								
								return _self.ApplyView();
								
							  }else{
								  
								if(m_view == null)
									return _base.Viewer().Close();
								
							  }
							  
							});							
						}
						
						if(options.AddField)
							options.AddField({
								Name: "PrintFilters",
								Caption: "Print Filters",
								Type: "Boolean",
								Mandatory: false							
							});
						
						return options.Open(_base.Viewer());
					}
				);
			});
			
		};
		
        this.Update = function (rec_) {
			
            m_record = rec_;

			if(Application.HasOption(m_form.Options,"skipfilters"))
				m_view = _base.Viewer().View();
			
            if (m_view == null)
                return;
			
			_self.SetFilters();

            //Show controls.
            $("#btnPrint" + _base.ID()).show();
			$("#btnFilters" + _base.ID()).show();
			$("#btnExportCSV" + _base.ID()).show();
			$("#btnEmailPDF" + _base.ID()).show();

            //Update title.
            m_mergeFields["%title"] = _base.Viewer().Options()["caption"];
			
			if(m_reportOptions && m_reportOptions.PrintFilters)
				m_mergeFields["%filters"] = GetFilters();
			
			var logo = _self.GetLogo();
			if(logo){
				m_mergeFields["%logo"] = "<img src='data:image/png;base64,"+logo+"' /><br/>";
			}

            m_data = GenerateReportData(rec_);

            _self.CreateReport(m_data);
        };        

        this.AddMergeField = function (key_, value_) {
            m_mergeFields[key_] = value_;
        };
		
		this.MergeFields = function(){
			return m_mergeFields;
		};

        this.CreateReport = function (data_) {

            //Clear container.
            m_container.html("");

			var html = "";
			html = _self.GenerateHTML(data_);
			
			for (var mf in m_mergeFields) {
                eval("html = html.replace(/" + mf + "/g, \"" + m_mergeFields[mf] + "\");");
            }

			//html = Application.ProcessCaption(html);
			
            m_container.html(html);
        };

        this.GenerateHTML = function (data_) {

            if(data_.length == 0)
                return "<h2>&nbsp;&nbsp;Oops, no report data found. Please check your filters and try again.</h2>";

            var html = m_design.toString();

            //Get columns.
            var cols = "";
            for (var i = 0; i < m_form.Fields.length; i++) {
                var align = "left";
                var f = m_form.Fields[i];                
                if ((f.Type == "Decimal" || f.Type == "Integer") && f.LookupDisplayField == "") align = "right";
				if(Application.HasOption(f.Options,"leftalign"))
					align = "left";
				if(Application.HasOption(f.Options,"rightalign"))
					align = "right";
				var colalign = Application.OptionValue(f.Options, "align");
                cols += m_mergeFields["%columns"]
                    .replace(/%columncaption/g, m_form.Fields[i].Caption)
                    .replace(/%columnwidth/g, m_form.Fields[i].Width)
                    .replace(/%colalign/g, colalign || align);
            }

            //Grouping.
            var lastgroup = [];
            var groups = [];
            var groupcaptions = [];
            if (m_groupFields) {
                groups = m_groupFields.split(",");
                groupcaptions = m_groupFieldCaptions.split(",");
                lastgroup = new Array(groups.length);
            }

            //Totals.
			var totals = [];
			var gtotals = Application.CreateArray(m_form.Fields.length,-1);
            var hasTotals = false;

            //Get rows.           
            var rows = "";
			var first = true;
            for (var i = 0; i < data_.length; i++) {

                for (var k = 0; k < groups.length; k++) {
                    if (lastgroup[k] != data_[i][groups[k]]) {                        
                        if (hasTotals)							
							rows += PrintTotals(totals);                        
                        lastgroup[k] = data_[i][groups[k]];
                        var f = _base.Viewer().Table().Column(groups[k]);
                        if (f) {
                            var val = Default(data_[i]["FF$"+groups[k]], data_[i][groups[k]]);
							var f2 = m_form.GetField(f.Name);
							if(!first && f2 && Application.HasOption(f2.Options,"pagebreak"))
								rows += "<tr><td colspan='" + m_form.Fields.length + "'>"+$PAGEBREAK+"</td></tr>";
							var grpcap = groupcaptions[k] + ": " + FormatData(val, f);
							if(Application.HasOption(m_form.Options,"hidegrpcaption"))
								grpcap = FormatData(val, f); 
                            rows += "<tr><td colspan='" + m_form.Fields.length + "' style='background-color: Gainsboro; -webkit-print-color-adjust: exact; font-weight: bold;'>" + grpcap + "</td></tr>";
							first = false;
                        }
                    }
                }

                var cells = "";                
                for (var j = 0; j < m_form.Fields.length; j++) {

                    if (totals.length != m_form.Fields.length)
						totals.push(-1);										

                    var align = "left";
                    var f = m_form.Fields[j];                    
                    if ((f.Type == "Decimal" || f.Type == "Integer") && typeof data_[i]["FF$" + f.Name] == "undefined") align = "right";
					
					if(Application.HasOption(f.Options,"leftalign"))
						align = "left";
					if(Application.HasOption(f.Options,"rightalign"))
						align = "right";
					
                    var val = Default(data_[i]["FF$"+f.Name],data_[i][f.Name]);  
					val = GetDisplayValue(f.Name,val);
					
					if(Application.HasOption(f.Options,"showvalue"))
						val = data_[i][f.Name];
										
                    cells += m_mergeFields["%cells"]
                        .replace(/%cellvalue/g, FormatData(val,f))
                        .replace(/%cellalign/g, align);
                    var tt = Application.OptionValue(f.Options,"totalstype");
                    if (tt) {
                        var reset = false;
						var val2 = Default(data_[i]["FF$" + f.Name], data_[i][f.Name]);
						if (gtotals[j] == -1) {
							gtotals[j] = 0;
						}
                        if (totals[j] == -1) {
                            totals[j] = 0;
                            reset = true;
                        }
                        hasTotals = true;
                        if (tt == "Count") {
							totals[j] += 1;
							gtotals[j] += 1;
                        }
                        if (tt == "Sum") {
							totals[j] += val2;
							gtotals[j] += val2;
                        }
                        if (tt == "Avg") {
							if(gtotals[j] == 0){
								gtotals[j] = [];
								gtotals[j][0] = 0;
								gtotals[j][1] = 0;
							}
                            if (reset) {
                                totals[j] = [];
                                totals[j][0] = 0;
                                totals[j][1] = 0;
                            }
                            if (val2 != 0) {
                                totals[j][0] += val2;
								totals[j][1] += 1;
								gtotals[j][0] += val2;
                                gtotals[j][1] += 1;
                            }
                        }
                        if (tt == "Min") {
                            if (val2 < totals[j] || reset)
								totals[j] = val2;
							if (val2 < gtotals[j] || gtotals[j] == 0)
                                gtotals[j] = val2;
                        }
                        if (tt == "Max") {
                            if (val2 > totals[j] || reset)
								totals[j] = val2;
							if (val2 > gtotals[j])
                                gtotals[j] = val2;
                        }
                    } 
                }                
                rows += m_mergeFields["%rows"].replace(/%cells/g, cells);
            }

            if (hasTotals)
				rows += PrintTotals(totals);
				
			if (hasTotals && groups.length > 0)
                rows += PrintTotals(gtotals);

            html = html.replace(/%columns/g, cols);
            html = html.replace(/%rows/g, rows);            

            return html;
        };					
		
		this.SetFilters = function () {

            var filtertxt = "";
			var filterbox = $("#filters"+_base.ID());

            //Hide the filter text.            
            filterbox.css("display", "none");

			if(Application.HasOption(m_form.Options,"hidefilters"))
				return;
			
            filtertxt = GetFilters();

            if (filtertxt != "")
                filterbox.css("display", "");

            filterbox.html(filtertxt);

            //Resize.
            //_base.Viewer().ResizeParent();
        };	
		
		this.ApplyView = function(){
			return $codeblock(
				function () {
					m_record.View = m_view;
				},
				function(){
					var maxrows = Default(Application.OptionValue(m_form.Options,"maxrows"),0);
					if(maxrows > 0){						
						COUNT(m_record.Table, m_record.View.replace(Application.GetSorting(m_record.View),""), function(c){
							if(c.Count > maxrows){
								var w = $wait();
								Application.Confirm("There are more than "+maxrows+" records. Do you wish to continue?",function(b){								
									w.resolve(!b);									
								});
								return w.promise();
							}
						});
					}
				},
				function(ret){
					if(ret)
						Application.Error("");
					return m_record.FindFirst();
				},
				function (r) {
					m_record = r;
					return _self.Update(m_record);
				}
			);
		};
		
		this.LoadReportOptions = function () {

            m_reportOptions = null;
			m_filterOptions = "";
			
			return $codeblock(

                function () {
                    return Application.GetUserLayout(Application.auth.Username, "REPORT" + m_form.Name);
                },

                function (layout) {

                    if (layout != "") {
                        var l = $.parseJSON(layout);
                        m_reportOptions = Default(l.options, null);
						m_filterOptions = Default(l.filters, null);
						m_filterData = Default(l.filterdata, new Object());
						m_emailOptions = Default(l.emailoptions, null);
                    }

                }
            );
        };

        this.SaveReportOptions = function () {

			Application.RunNext(function () {

				if(!_self) return;
				               
                var l = new Object();
                l.options = m_reportOptions;
				l.filters = m_filterOptions;
				l.filterdata = m_filterData;
				l.emailoptions = m_emailOptions;
				
                return Application.SaveUserLayout(Application.auth.Username, "REPORT" + m_form.Name, $.toJSON(l));                 

            },null,null,true);
        };
		
		this.EmailPDF = function(){					
			
			Application.RunNext(function(){
				return $codeblock(
					function(){
						FINDSET("Xpress Email Setup",null,function(setup){
							if(setup.Count == 0)
								Application.Error("Email is not setup. Please see your administrator");
						});
					},
					function(){
						
						var cap = _base.Viewer().Options()["caption"];
						var o = Default(m_emailOptions, {});
						o.Subject = Default(o.Subject,cap);
						o.Body = Default(o.Body,"Hi!<br/><br/>Please find the attached "+cap);
						o.FileName = Default(o.FileName,"Report.PDF");
						
						if(Application.Util) //CIMS
							o.From = Application.Util.User().CompanyEmail;
				
						var options = new OptionsWindow({      
							caption: 'Email PDF',
							fields: [{
								Name: "To",
								Caption: "To",
								Type: "Text",
								Mandatory: true
							}, {
								Name: "From",
								Caption: "From",
								Type: "Text",
								Mandatory: true
							},{
								Name: "Subject",
								Caption: "Subject",
								Type: "Text",
								Mandatory: true
							},{
								Name: "Body",
								Caption: "Body",
								Type: "BigText",
								Size: 10000,
								CustomControl: "HTMLEditor",
								Mandatory: true
							},{
								Name: "FileName",
								Caption: "Attachment Name",
								Type: "Text",
								Mandatory: true
							}],
							optionvalues: o
						});

						options.CloseFunction(function(okclicked) {
							
							if (okclicked) {
								
								m_emailOptions = options.GetOptions();
								_self.SaveReportOptions();
								
								var html = m_container.html();

								//#235 - Temp Fix - TODO: Remove when new version of PDF software comes out
								html = html.replace(/thead/g,"tbody");

								return Application.WebServiceWait("EmailPDF", { 
									auth: Application.auth, 
									html_: html,
									name_: m_emailOptions.FileName,
									subject_: m_emailOptions.Subject,
									body_ : '<span style="font-family: '+$("body").css("font-family")+'">'+m_emailOptions.Body+'</span>',
									to_:m_emailOptions.To,
									from_:m_emailOptions.From,
									cc_:"",
									bcc_ :"",
									landscape_:Application.HasOption(m_form.Options,"landscape"),
									receipt_: false
								});
							 }
						});
					
						return options.Open(_base.Viewer());
					}
				);				
			});
		};
		
		this.ExportCSV = function(){
			
			var data = GenerateReportData(m_record);
			var csv_data = _self.GenerateCSVData(data);
			Application.FileDownload.DownloadText("Report.csv", csv_data, "text/csv;charset=utf-8;");
		};
		
		this.GenerateCSVData = function(data_){
			
			var csvFile = '';
			
			//Grouping.
            var lastgroup = [];
            var groups = [];
            var groupcaptions = [];
            if (m_groupFields) {
                groups = m_groupFields.split(",");
                groupcaptions = m_groupFieldCaptions.split(",");
                lastgroup = new Array(groups.length);
            }

            //Totals.
			var totals = [];
			var gtotals = Application.CreateArray(m_form.Fields.length,-1);            
            var hasTotals = false;
			
			var hdrrow = [];
			for (var j = 0; j < m_form.Fields.length; j++){
				hdrrow.push(m_form.Fields[j].Caption);
			}
			csvFile += ProcessCSVRow(hdrrow, true);
				
			for (var i = 0; i < data_.length; i++) {
				
				for (var k = 0; k < groups.length; k++) {
                    if (lastgroup[k] != data_[i][groups[k]]) {                        
                        if (hasTotals)
							csvFile += ProcessCSVRow(PrintCSVTotals(totals));                            
                        lastgroup[k] = data_[i][groups[k]];
                        var f = _base.Viewer().Table().Column(groups[k]);
                        if (f) {
                            var val = Default(data_[i]["FF$"+groups[k]], data_[i][groups[k]]);
							var f2 = m_form.GetField(f.Name);							                
							var grpcap = groupcaptions[k] + ": " + FormatData(val, f);
							if(Application.HasOption(m_form.Options,"hidegrpcaption"))
								grpcap = FormatData(val, f); 							
							csvFile += ProcessCSVRow([grpcap]);							
                        }
                    }
                }
				
				var row = [];
				for (var j = 0; j < m_form.Fields.length; j++) {
					
					if (totals.length != m_form.Fields.length)
                        totals.push(-1);
					
				    var val = Default(data_[i]["FF$"+m_form.Fields[j].Name], data_[i][m_form.Fields[j].Name]);
					val = GetDisplayValue(m_form.Fields[j].Name,val);
					
					var f = m_form.Fields[j];          
					var tt = Application.OptionValue(f.Options,"totalstype");
                    if (tt) {
                        var reset = false;
						var val2 = Default(data_[i]["FF$" + f.Name], data_[i][f.Name]);
						if (gtotals[j] == -1) {
							gtotals[j] = 0;
						}
                        if (totals[j] == -1) {
                            totals[j] = 0;
                            reset = true;
                        }
                        hasTotals = true;
                        if (tt == "Count") {
							totals[j] += 1;
							gtotals[j] += 1;
                        }
                        if (tt == "Sum") {
							totals[j] += val2;
							gtotals[j] += val2;
                        }
                        if (tt == "Avg") {
							if(gtotals[j] == 0){
								gtotals[j] = [];
								gtotals[j][0] = 0;
								gtotals[j][1] = 0;
							}
                            if (reset) {
                                totals[j] = [];
                                totals[j][0] = 0;
                                totals[j][1] = 0;
                            }
                            if (val2 != 0) {
                                totals[j][0] += val2;
								totals[j][1] += 1;
								gtotals[j][0] += val2;
                                gtotals[j][1] += 1;
                            }
                        }
                        if (tt == "Min") {
                            if (val2 < totals[j] || reset)
								totals[j] = val2;
							if (val2 < gtotals[j] || gtotals[j] == 0)
                                gtotals[j] = val2;
                        }
                        if (tt == "Max") {
                            if (val2 > totals[j] || reset)
								totals[j] = val2;
							if (val2 > gtotals[j])
                                gtotals[j] = val2;
                        }
                    } 
					
					row.push(FormatData(val,m_form.Fields[j],true));
				}
				csvFile += ProcessCSVRow(row);
			}
			
			 if (hasTotals)
                csvFile += ProcessCSVRow(PrintCSVTotals(totals));
			
			if (hasTotals && groups.length > 0)
				csvFile += ProcessCSVRow(PrintCSVTotals(gtotals));
				
			return csvFile;			
		};
		
        //#endregion

        //#region Public Properties

        this.ReportOptions = function (value_) {
            if (typeof value_ == "undefined") {
                return m_reportOptions;
            } else {
                m_reportOptions = value_;
                _self.SaveReportOptions();
            }
        };

        this.FilterOptions = function (value_) {
            if (typeof value_ == "undefined") {
                return m_filterOptions;
            } else {
                m_filterOptions = value_;
                _self.SaveReportOptions();
            }
        };
		
		this.EmailOptions = function (value_) {
            if (typeof value_ == "undefined") {
                return m_emailOptions;
            } else {
                m_emailOptions = value_;
                _self.SaveReportOptions();
            }
        };

        this.PageControl = function () {
            return true;
        };

        this.Design = function (value_) {
            if (typeof value_ != "undefined") {
                m_design = value_;
            } else {
                return m_design;
            }
        };
		
		this.GetLogo = function(){
			if(Application.Util) //CIMS
				return Application.Util.Company().Logo;
			return null;
		};

        this.GetView = function () {
            return m_view;
        };

        this.GroupFields = function () {
            return m_groupFields;
        };

        this.GroupFieldCaptions = function () {
            return m_groupFieldCaptions;
        };

        this.SetView = function (value) {
            m_view = value;
        };
		
		this.AddFilterData = function(name,data){
			m_filterData[name] = data;
		};

        //#endregion

        //#region Private Methods

		function PrintTotals(totals) {            
		    var rows = "<tr>";			
		    for (var j = 0; j < m_form.Fields.length; j++) {
		        var f = m_form.Fields[j];
		        var tt = Application.OptionValue(f.Options, "totalstype");				
		        if (tt == "Avg") {
		            var avg = 0;
		            if (totals[j][1] != 0) {
		                avg = totals[j][0] / totals[j][1];
		                avg = avg.toFixed(2);
		            }
		            rows += "<td style='background-color: WhiteSmoke; -webkit-print-color-adjust: exact; text-align: right; border-top: 1px solid black; border-bottom: 1px solid black;'>" + (tt ? tt + ": " + (avg) : "") + "</td>";
				} else if(tt == "Count"){
		            rows += "<td style='background-color: WhiteSmoke; -webkit-print-color-adjust: exact; text-align: right; border-top: 1px solid black; border-bottom: 1px solid black;'>" + (tt ? tt + ": " + totals[j]: "") + "</td>";
		        } else {
		            rows += "<td style='background-color: WhiteSmoke; -webkit-print-color-adjust: exact; text-align: right; border-top: 1px solid black; border-bottom: 1px solid black;'>" + (tt ? tt + ": " + totals[j].toFixed(2) : "") + "</td>";
		        }		        
		        totals[j] = -1;
		    }			
		    rows += "</tr>";						
		    return rows;
		};
		
		function PrintCSVTotals(totals) {            
		    var rows = [];			
		    for (var j = 0; j < m_form.Fields.length; j++) {
		        var f = m_form.Fields[j];
		        var tt = Application.OptionValue(f.Options, "totalstype");				
		        if (tt == "Avg") {
		            var avg = 0;
		            if (totals[j][1] != 0) {
		                avg = totals[j][0] / totals[j][1];
		                avg = avg.toFixed(2);
		            }
		            rows.push((tt ? tt + ": " + (avg) : ""));
				} else if(tt == "Count"){
		            rows.push((tt ? tt + ": " + totals[j] : ""));
		        } else {
		            rows.push((tt ? tt + ": " + totals[j].toFixed(2) : ""));
		        }		        
		        totals[j] = -1;
		    }					    			
		    return rows;
		};

		function GetDisplayValue(column, value){
			
		    if (value == null)
		        return value;

			var filterdata = m_filterData[column];
			if(!filterdata)
				return value;
			
			for(var i = 0; i < filterdata.length; i++){												
				if(value.toString().toLowerCase() == filterdata[i].ValueCol.toString().toLowerCase()){
					return filterdata[i].DisplayCol;					
				}
			}	
			
			return value;
		};
		
		function GetFilters(){
			var ret = "";
			var v = Application.ViewSubstitute(m_view);
			var filters = Application.GetFilters(v,true);
			for (var i = 0; i < filters.length; i++) {    

				var col = filters[i][0];
				var filterdata = m_filterData[col];
				if(filterdata){
					
					var modifiedfilters = "";
					var filts = [filters[i][1]];
					if(filters[i][1].indexOf("|") != -1)
						filts = filters[i][1].split("|");
					if(filters[i][1].indexOf("&") != -1)
						filts = filters[i][1].split("&");
					
					for(var j = 0; j < filts.length; j++){
						
						var val = Application.StripFilters(filts[j]);
						var val2 = GetDisplayValue(col,val);
						
						if(modifiedfilters == ""){
							modifiedfilters = val2;
						}else{
							modifiedfilters += "," + val2;
						}							
					}
					
					if (ret == "") {
						ret = 'Filters: ' + col.replace("FF$", "") + " = FILTER(" + modifiedfilters + ")";
					} else {
						ret += ", " + col.replace("FF$", "") + " = FILTER(" + modifiedfilters + ")";
					}
					
				}else{
            
					var field = m_form.GetField(filters[i][0]);
					if(field){
						if(field.OptionCaption != ""){
							filters[i][1] =  Application.GetOptionFilter(filters[i][1], field.OptionCaption);
						}
					}
			
					if (ret == "") {
						ret = 'Filters: ' + filters[i][0].replace("FF$", "") + " = FILTER(" + filters[i][1] + ")";
					} else {
						ret += ", " + filters[i][0].replace("FF$", "") + " = FILTER(" + filters[i][1] + ")";
					}
					
				}
			}	
			return ret;
		};
		
        function GenerateReportData(rec_) {

            var recs = new Array();			
            if (rec_.Count > 0){
				rec_.First();
                do {
                    recs.push(ConvertRecordToReportData(rec_));
                }
                while (rec_.Next())
			}
            return recs;
        };

        function ConvertRecordToReportData(rec_) {
            var r = new Record();
			r.Copy(rec_);			
			return r;
        };

        function FormatData(value_, field_, export_) {

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

			if (field_.Type == "Boolean" && !export_) {
				if(value_ == true){
					return UI.IconImage("check2");
				}else{
					return "";
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
        };		
		
		function ProcessCSVRow(row,hdr) {
            var finalVal = '';
            for (var j = 0; j < row.length; j++) {
                var innerValue = row[j] === null ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };
                var result = innerValue.replace(/"/g, '""');
				result = result.replace(/\<br\>/g,'\n');
				result = result.replace(/\<br\/\>/g,'\n');
				
				result = Application.SanitizeString(result);
				
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
				if(hdr && j == 0 && result == "ID")
					result = "\"ID\"";
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\r\n';
        };
		
        //#endregion        

        //#region Overridden Methods

		this.Height = function (h) {
			_base.Viewer().SetHeight(h,true);              
        };

        this.Width = function (w) {
            m_container.width(w - 20);
        };
		
        //#endregion

        //#region Overrideable Methods

        this.Enabled = function (value_) {
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });  

//Global constants.	
$PAGEBREAK = "<div style='page-break-after: always'></div>";

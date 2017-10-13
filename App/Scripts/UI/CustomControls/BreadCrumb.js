/// <reference path="../Application.js" />

Define("BreadCrumb",

    function (field_, viewer_) {
        return new Control("BreadCrumb", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;        

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("BreadCrumb");
        };

        this.CreateDesktop = function (window_) {

		    //var container = $('<div id="' + _base.ID() + '" style="display: none"></div>');
			var container = $('<div id="' + _base.ID() + '"></div>');
            //Call base method.
            _base.Create(window_, container, null);
        };

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");
			
            //Call base method.
            return _base.CreateList(container, cont, value_);
			
        };
		
		this.FormatValue = function(cellvalue, rowObject){
			
			if(!cellvalue)
				return "";

			var splitchar = Default(Application.OptionValue(_base.Field().Options, "splitchar"), "~");
			var fieldsoption = Application.OptionValue(_base.Field().Options, "fields");
			var flds = fieldsoption.split(",");
			var crumbs = cellvalue.split(splitchar);		
			var uid = $id();
			var page = _base.Viewer().Page();
						
			Application.BreadClick = function(id,field){
				var container = $("#"+id);
				var value = container.html();
				if(value.indexOf("<span") == 0)
					return;				
				var combo = new Combobox(page.GetField(field), _base.Viewer());
				var ele = combo.CreateList(value,true);
				var editor = UI.FindEditorInput(ele);	
				if(editor){	
					editor.on("change",function(){
						
						_base.Viewer().RecordValidate(field,editor.val());		
						
						Application.RunNext(function(){
							container.html(_base.Viewer().Record()[field]);
						});					
						Application.RunNext(function(){
							ShowHideControls(id);
						});					
					});
					editor.on("blur",function(){																													
						_base.Viewer().RecordValidate(field,editor.val());						
						Application.RunNext(function(){
							container.html(_base.Viewer().Record()[field]);
						});					
						Application.RunNext(function(){
							ShowHideControls(id);
						});								
					});
				}
				container.html("");
				combo.Loaded(true);
				container.append(ele);
				setTimeout(function () { combo.Focus(); }, 50);		
			};
			
			var html = "<div id='"+uid+"'>";	
			$.each(flds, function( index_, value_ ) {
				var divid_ = index_+1;
				html += "<div id='"+uid+divid_+"' style='display:inline-block;margin-right:3px;padding: 5px; border: 1px solid grey; border-radius: 3px;";
				 if (crumbs[index_-1]==='' && index_!==0) {
					 html += " display: none;";
				 }
				 html += "' onclick='Application.BreadClick(\""+uid+divid_+"\",\"" +value_+ "\");'>"+crumbs[index_]+"</div>";	
			});
			
			// var html = "<div id='"+uid+"'>";	
			// html += "<div id='"+uid+1+"' style='display:inline-block;margin-right:3px;padding: 5px; border: 1px solid grey; border-radius: 3px;' onclick='Application.BreadClick(\""+uid+1+"\",\"Location1\");'>"+crumbs[0]+"</div>";
			// html += "<div id='"+uid+2+"' style='display:inline-block;margin-right:3px;padding: 5px; border: 1px solid grey; border-radius: 3px;";
			// if (crumbs[0]==='') {
				// html += " display: none;";
			// }
			// html += "' onclick='Application.BreadClick(\""+uid+2+"\",\"Location2\");'>"+crumbs[1]+"</div>";			

			// html += "<div id='"+uid+3+"' style='display:inline-block;margin-right:3px;padding: 5px; border: 1px solid grey; border-radius: 3px;";
			// if (crumbs[1]==='') {
				// html += " display: none;";
			// }
			// html += "' onclick='Application.BreadClick(\""+uid+3+"\",\"Location3\");'>"+crumbs[2]+"</div>";			

			// html += "<div id='"+uid+4+"' style='display:inline-block;margin-right:3px;padding: 5px; border: 1px solid grey; border-radius: 3px;";
			// if (crumbs[2]==='') {
				// html += " display: none;";
			// }
			// html += "' onclick='Application.BreadClick(\""+uid+4+"\",\"Location4\");'>"+crumbs[3]+"</div>";
			// html += "</div>";
			
			return html;
			
		};

        //#endregion

        //#region Private Methods

		function ShowHideControls(id_) {
			var fieldsoption_ = Application.OptionValue(_base.Field().Options, "fields");
			var flds_ = fieldsoption_.split(",");

			var id_str = id_.substring(0, id_.length-1);
			$.each(flds_, function( index_, value_ ) {
				var n = index_+1;
				if (index_!==0) {		
					$("#"+id_str+n.toString()).css('display','inline-block');
				}
			});
			$.each(flds_, function( index_, value_ ) {
				var n = index_+1;
				if ($("#"+id_str+n.toString()).text()===''){
					var m = index_+2;
					$("#"+id_str+m.toString()).css('display','none'); 
					$("#"+id_str+m.toString()).text("");
				}		
			});	
			// $("#"+id_str+'2').css('display','inline-block');
			// $("#"+id_str+'3').css('display','inline-block');
			// $("#"+id_str+'4').css('display','inline-block');	
			// if ($("#"+id_str+'1').text()===''){
				// $("#"+id_str+'2').css('display','none'); 
				// $("#"+id_str+'2').text("");
			// }
			// if ($("#"+id_str+'2').text()===''){
				// $("#"+id_str+'3').css('display','none'); 
				// $("#"+id_str+'3').text("");
			// }
			// if ($("#"+id_str+'3').text()===''){
				// $("#"+id_str+'4').css('display','none'); 
				// $("#"+id_str+'4').text("");
			// }
		};
		
        function CreateBreadCrumb(cont) {

        };

        //#endregion

        //#region Overrideable Methods

        this.Update = function (rec_) {
							
            Application.LogInfo("Updating control: " + _base.ID() + ", Caption: " + _base.Field().Caption);
            
			var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') {
                _self.Loaded(true);
                return;
            }			
					
			var html = _self.FormatValue(value,rec_);
            html = '<table style="width: 100%"><tbody><tr><td><label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px; display: inline-block;" class="app-label">'+_base.Field().Caption+'</label></td><td style="width: 52%; padding-right: 10px; text-align: left; vertical-align: top;">' + html + '</td></tr></tbody></table>';			
			_base.Container().html(html);
            _self.Loaded(true);
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        this.SetSize = function (width, height) {
			_base.Container().width(width);		
        };

//		this.IgnoreColumns = function () {
//            return true;
//        };

        //#endregion

        //Constructor
        this.Constructor();

    });
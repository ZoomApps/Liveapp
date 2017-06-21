/// <reference path="../Application.js" />

Define("FilterToolbar",

    function (viewer_) {
        return new Control("FilterToolbar", null, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
		var m_id = null;
        var m_filterInput = null;
        var m_filterText = null;
        var m_filterFields = null;
        var m_filterClear = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("FilterToolbar");
        };

        this.Create = function (window_, form_, table_) {

			m_id = window_.ID();
		
            //Use toolbar 2 on the window.
            var toolbar = window_.Toolbar2();
            toolbar.addClass("ui-widget ui-state-default");
            toolbar.css("padding-top", "10px");
			toolbar.css("padding-bottom", "10px");
            toolbar.css("display", "inline-block");
            toolbar.css("width", "100%");
            toolbar.css("border-width", "0px");
            toolbar.css("font-size", "13px");

            toolbar.append("<select id='" + window_.ID() + "filterfields' class='ui-widget ui-widget-content ui-corner-left' style='width: auto; max-width: 100px; float: right; margin-right: 15px;' />");
            toolbar.append("<input type='text' id='" + window_.ID() + "filterinput' placeholder='Type to filter (F7)' class='ui-widget ui-widget-content ui-corner-left' style='width: 150px; float: right;' />");

            toolbar.append("<div id='" + window_.ID() + "filterclear' class='ui-state-hover' style='display: none; cursor: pointer; float: right; margin-right: 15px; padding: 1px; border: 0px;'>" + UI.IconImage('delete') + "</div>");
            toolbar.append("<label id='" + window_.ID() + "filtertxt' class='ui-state-hover' style='display: none; font-size: 11px; width: auto; float: right; margin-right: 3px; padding: 5px; border: 0px;'></label>");

            //Save the filter controls.
            m_filterFields = $("#" + window_.ID() + "filterfields");
            m_filterInput = $("#" + window_.ID() + "filterinput");
            m_filterClear = $("#" + window_.ID() + "filterclear");
            m_filterText = $("#" + window_.ID() + "filtertxt");            

            //Add form fields.
            for (var i = 0; i < form_.Fields.length; i++) {
                if (!form_.Fields[i].Hidden) {
                    var name = form_.Fields[i].Name;
                    if (form_.Fields[i].LookupDisplayField != "") {
                        name = "FF$" + form_.Fields[i].Name;
                    }
                    m_filterFields.append("<option value='" + name + "'>" + form_.Fields[i].Caption + "</option>");
                }
            }

            HookPageEvents();
        };
        
        this.SetFilters = function (clear) {

            var filtertxt = "";

            //Hide the filter text.
            m_filterClear.css("display", "none");
            m_filterText.css("display", "none");

            //Get the page filters.
            var filters = _base.Viewer().Filters();
            for (var i = 0; i < filters.length; i++) {
                var pagefield = _base.Viewer().Page().GetField(filters[i].Name.replace("FF$", ""));
                if (pagefield) {
                    if (filtertxt == "") {
                        filtertxt = 'Filter: ' + filters[i].Name.replace("FF$", "") + " = FILTER(" + filters[i].Value + ")";
                    } else {
                        filtertxt += ", " + filters[i].Name.replace("FF$", "") + " = FILTER(" + filters[i].Value + ")";
                    }
                    m_filterClear.css("display", "");
                }
            }

            if (filtertxt != "")
                m_filterText.css("display", "");

            m_filterText.html(filtertxt);
			
			if(clear)
				m_filterInput.val("");
        };

        this.GetFilter = function (col) {

            //Get the page filters.
            var filters = _base.Viewer().Filters();
            for (var i = 0; i < filters.length; i++) {
                if (filters[i].Name == col || filters[i].Name == "FF$" + col) {
                    m_filterInput.val(filters[i].Value);
                    m_filterInput.select();
                    return;
                }
            }
            m_filterInput.val('');
            m_filterInput.select();
        };

		this.RemoveField = function(name){
			$("#" + m_id + "filterfields option[value='"+name+"']").remove();
			$("#" + m_id + "filterfields option[value='FF$"+name+"']").remove();
		};
		
		this.Dispose = function(){
			if(m_filterClear) m_filterClear.remove();
			if(m_filterFields) m_filterFields.remove();
			if(m_filterInput) m_filterInput.remove();
			if(m_filterText) m_filterText.remove();
			_base.Dispose();
			this.prototype = null;
			_base = null;
			_self = null;
		};
		
        //#endregion 

        //#region Private Functions

        function HookPageEvents() {

            m_filterFields.keydown(function (ev) {
                if (ev.which == 13) {
                    ev.preventDefault();
                    $(this).blur();
                    m_filterInput.select();
                } else if (ev.which == 27) {
                    ev.preventDefault();
                    $(this).blur();
                }
            });
            m_filterFields.change(function () {
                _self.GetFilter(this.value);
            });           

            m_filterInput.keydown(function (ev) {
                var val = this.value;
                if (ev.which == 13) {
                    ev.preventDefault();
                    Application.RunNext(function () {
                        return _base.Viewer().Filter(m_filterFields.val(), val, true, true);
                    });
                    $(this).blur();
                } else if (ev.which == 27) {
                    ev.preventDefault();
                    $(this).blur();
                }
            });
            m_filterInput.change(function () {
                var val = this.value;
                Application.RunNext(function () {
                    return _base.Viewer().Filter(m_filterFields.val(), val, true, true);
                });
            });

            m_filterClear.click(function () {
                _base.Viewer().ClearFilters();
                m_filterInput.val("");
            });

        };

        //#endregion

        //Constructor
        this.Constructor();

    });
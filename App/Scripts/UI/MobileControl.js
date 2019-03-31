/// <reference path="../Application.js" />

Define("Control",

    function (type_) {
        return new AppObject(type_);
    },

    function (type_, field_, viewer_) {

        //#region Members

        var _self = this;
        var _base = null;
        var m_container = null; //Div or Span
        var m_label = null; //Label
        var m_control = null; //JQuery Control
        var m_id = "";
        var m_enabled = false;
        var m_visible = true;
        var m_field = null; //FormFieldInfo 
        var m_loaded = false;
        var m_viewer = null; //PageViewer
        var m_invalid = false;
        var m_notSupported = false;        

        //#endregion

        //#region Public Methods

        this.Constructor = function (field_, viewer_) {

            //Generate a new id for the control.
            m_id = $id();

            m_field = field_;
            m_viewer = viewer_;

            if (m_field == null) {
                m_field = new Object();
                m_field.Caption = "";
            }

            _base = Base("Control");

            Application.LogDebug("Created new control: " + m_id + ", Caption: " + m_field.Caption);
        };

        this.CreateMobile = function (window_) {
            if (window_ == null) return;
            var container = _self.CreateNoMobile();
            _self.Create(window_, container, _self.OnValueChange, function (cont) {
            });
            m_notSupported = true;
        };

        this.Create = function (window_, container_, onchange_, setupfunc_) {

            //Save the control.
            m_container = container_;

            //Add the control to the window.
            window_.append(m_container);

            var scrollarea = $('html, body');
            if (m_viewer && m_viewer.ID) {
                if( m_viewer.Dialog && m_viewer.Dialog()){
                    scrollarea = $("#"+m_viewer.ID());
                }else{
                    scrollarea = $("#"+m_viewer.ID()+"containerworkspace");
                    if(scrollarea.length === 0)
                        scrollarea = $(".app-main");
                }
            }

            m_control = $('#ctl' + m_id).focus(function (ev, forced) {				                         			
                                
                if(!Application.IsAndroid())
                    return;

				//Scroll the dialog.
				if(!forced){
					
					var pos = m_control.offset();
					if (m_control.attr("data-clear-btn") == "true") {
						pos = m_control.parent().offset();
					}                
					
					scrollarea.animate({
						scrollTop: pos.top - scrollarea.offset().top + scrollarea.scrollTop() - 60
					}, 50);					
				}                

            }).keypress(function (event) {
                if (event.keyCode == '13' && m_field.CustomControl != "NotesBox") {
                    event.preventDefault();
                    m_control.blur();
                }
            });

            m_label = $('#lbl' + m_id);
            m_label.css("text-align", "left");

            //Set the tab index.
            m_control.attr("tabindex", m_field.TabIndex);
            m_control.attr("autocomplete", "false");

            //Set the editable property.
            if (m_field.Editable == false) {
                m_control.attr("disabled", true);
            }
            m_label.html(m_field.Caption);

            if(m_field.Mandatory)
                $('<div id="lbldesc'+m_id+'" style="margin-bottom:5px;"><small style="color: #fab1a0;">Mandatory</small></div>').insertAfter(m_label);

            //Hookup focus event.
            m_control.focus(function () {
                if (m_viewer)
                    m_viewer.FocusControl(m_control);
            });

            //Hookup change event.
            if (onchange_ != null) {
                m_control.change(function () {
                    if (m_loaded == false)
                        return;
                    if (m_viewer)
                        m_viewer.XFocusControl(m_control);
                    onchange_(m_field.Name, m_control.val());
                });
            }

            //Run the setup function.
            if (setupfunc_)
                setupfunc_(m_control);

            Application.Fire("ControlInit", m_control);

            Application.LogDebug("Finished control init: " + m_id + ", Caption: " + m_field.Caption);
        };

        this.CreateList = function (container_, control_, value_) {

            //Save the control.
            m_container = container_;
            m_control = control_;

            return m_container;
        };

        this.SetSize = function (width, height) {
            //NOT USED IN MOBILE
        };

        this.Focus = function () {
            m_control.focus();
        };

        this.Update = function (rec_) {

            if (m_field == null || rec_ == null || m_notSupported) {
                m_loaded = true;
                return;
            }

            Application.LogDebug("Updating control: " + m_id + ", Caption: " + m_field.Caption);

            var value = rec_[m_field.Name];
            if (typeof value == 'undefined') {
                m_loaded = true;
                return;
            }

            m_control.val(value);
            m_loaded = true;
        };

        this.CreateUnsupported = function () {
            return $('<div id="' + m_id + '" style="display: none; min-height: 30px;">&nbsp;&nbsp;&nbsp;<b>' + UI.IconImage('warning') + ' This control is unsupported in your browser version. Please upgrade to the latest version.</b></div>');
        };

        this.CreateNoMobile = function () {
            return $('<div id="' + m_id + '" style="min-height: 30px;">&nbsp;&nbsp;&nbsp;<b>' + UI.IconImage('warning') + ' This control is unsupported in the mobile version.</b></div>');
        };

        this.Valid = function (valid, msg) {

            valid = Default(valid, null);
            msg = Default(msg, "");

            var color = "";
            if (valid == null) {
                m_invalid = false;
            } else if (valid == true) {
                color = "#CCFF66";
                m_invalid = false;
            } else {
                color = "#FF9999";
                m_invalid = true;
                m_control.select();
            }
            m_control.css("background-color", color);
            if (msg == "") {
                m_label.html(m_field.Caption);
            } else {
                m_label.html(m_field.Caption + " &nbsp;&nbsp;<span style='font-size: 12px; background-color: " + color + "; padding: 4px;'>" + msg + "</span>");
            }
        };

		this.Dispose = function(){
			if(m_control) m_control.remove();
			if(m_label) m_label.remove();
			if(m_container) m_container.remove();
			m_viewer = null;
			_base = null;
			_self = null;
		};
		
        //#endregion

        //#region Public Properties

        this.IsControl = function () {
            return true;
        };

        this.ID = function () {
            return m_id;
        };

        this.Field = function () {
            return m_field;
        };

        this.Label = function () {
            return m_label;
        };

        this.Viewer = function () {
            return m_viewer;
        };

        this.Control = function () {
            return m_control;
        };

        this.Container = function () {
            return m_container;
        };

        this.Loaded = function (value_) {

            if (value_ !== undefined) { //SET

                m_loaded = value_;

            } else { //GET

                return m_loaded;

            }
        };

        this.Enabled = function (value_, update_) {

            if (value_ !== undefined) { //SET

                update_ = Default(update_, true);
                if (update_)
                    m_field.Editable = value_;

                if (value_) {
                    if (m_field.Editable)
                        m_control.attr("disabled", false);
                } else {
                    m_control.attr("disabled", true);
                }

                m_enabled = value_;

            } else { //GET

                return m_enabled;

            }
        };

        this.Hide = function () {
            m_container.hide();
            m_label.hide();
            m_control.hide();
            $('#lbldesc'+m_id).hide();
            m_visible = false;
        };

        this.Show = function () {
            m_container.show();
            m_label.show();
            m_control.show();
            $('#lbldesc'+m_id).show();
            m_visible = true;
        };

        this.Invalid = function () {
            return m_invalid;
        };

        //#endregion       

        //#region Overrideable Methods

        this.HideDropdown = function () {
        };

        this.IgnoreColumns = function () {
            return false;
        };

        this.PageControl = function () {
            return false;
        };

        //#endregion

        //Constructor
        this.Constructor(field_, viewer_);

    });

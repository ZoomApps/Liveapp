/// <reference path="../Application.js" />

//27/01/15      Issue #7        PF      Added new control.

Define("Article",

    function (field_, viewer_) {
        return new Control("Article", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_container = null;
		var m_completed = null;
        var m_form = null;       
        var m_record = null;
		var m_options = null;
		
        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Article");
        };

        this.CreateDesktop = function (window_, form_, options_) {

            m_form = form_;
			m_options = Default(options_,{
				bodyFont: "15px"
			});

            //Create the control.
            m_container = $('<div id="' + _base.ID() + '" style="padding: 15px; font-size: '+m_options.bodyFont+';"></div>');
			m_completed = $("<div id='completed"+_base.ID()+"'  style='padding: 15px; font-size: "+m_options.bodyFont+"; display: none;'></div>");
			var filters = $('<div id="artfilters' + _base.ID() + '" style="padding: 15px; font-size: '+m_options.bodyFont+'; display: none;"></div>');
			
			window_.AddControl(filters);
            window_.AddControl(m_container);
			window_.AddControl(m_completed);
									
            _self.Loaded(true);
        };

        this.CreateMobile = function (window_, form_) {
            return _self.CreateDesktop(window_, form_);
        };

        this.CreateList = function (value_) {
            //Not used.            
        };

        this.Update = function (rec_) {
	
			
            m_record = rec_;
			
			//Add title.
			//m_container.append("<h1 style='font-weight: 200; font-size: 46px'>"+rec_.Title+"</h1>");
			
			//Add body.
			if(rec_.Body)
				m_container.append("<p>"+rec_.Body+"</p>");	           			
		   
		   // var jscode = $(".javascriptCode");
		   // jscode.each(function(index){
			   // var ce = jscode[index];
			   // var text = $(this).html();
			   // text = text.replace(/\<br\>/g,"\n");
			   // text = text.replace(/\&nbsp\;/g," ");			   
			   // var editor = CodeMirror(function(node){ce.parentNode.replaceChild(node, ce);}, {
					// mode: "javascript",
					// value: text,
					// lineNumbers: true,
					// lineWrapping: true,
					// readOnly: true
				// });
		   // });
			
			_self.Loaded(true);
        };

        this.Height = function (h) {			
            m_container.height(h - 70);
        };

        this.Width = function (w) {			
			m_container.width(w - 20);			
        };	

        //#endregion

        //#region Private Methods

        
		
        //#endregion        

        //#region Overrideable Methods

        this.Enabled = function (value_) {
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        this.PageControl = function () {
            return true;
        };

        //Constructor
        this.Constructor();

    });  
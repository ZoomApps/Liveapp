/// <reference path="../Application.js" />

Define("Frame",

    function (field_, viewer_) {
        return new Control("Frame", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
		var m_url = null;
		var m_form = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Frame");
        };

        this.CreateDesktop = function (window_, form_) {
           
			m_form = form_;
			
            //Create the control.
            m_container = $('<iframe id="' + _base.ID() + '" style="width: 100%; height: 100%;"></div>');
            m_container.css("min-height", UI.Height() - 40);
            
            window_.AddControl(m_container);				

            _self.Loaded(true);			
        };

        this.CreateMobile = function (window_, form_) {
            return _self.CreateDesktop(window_, form_);
        };

        this.Update = function (rec_) {
			
			m_url = rec_[m_form.Fields[0].Name];
			
			if(m_url)
				m_container.attr("src",m_url);
        };        
       
        //#endregion

        //#region Public Properties

        //#endregion

        //#region Private Methods        
		
        //#endregion        

        //#region Overridden Methods

        this.Height = function (h) {
        };

        this.Width = function (w) {
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
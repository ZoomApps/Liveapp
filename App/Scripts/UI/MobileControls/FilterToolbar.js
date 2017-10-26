/// <reference path="../Application.js" />

Define("FilterToolbar",

    function (viewer_) {
        return new Control("FilterToolbar", null, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_filterInput = null;
        var m_field = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("FilterToolbar");
        };

        this.Create = function (window_, form_, table_) {
        };

        this.Sort = function () {
            //Not used.
        };

        this.SetFilters = function () {
            //Not used.
        };

        this.GetFilter = function (col) {
        };

		this.RemoveField = function(name){
		};
		
		this.Dispose = function(){
		};
        //#endregion

        //#region Public Properties

        this.SortControl = function (value_) {
            return null;
        };

        this.OrderControl = function (value_) {
            return null;
        };

        //#endregion

        //#region Private Functions

        function HookPageEvents() {

            m_filterInput.change(function () {

                _base.Viewer().Filter(m_field.Name, ProcessFilter(m_filterInput.val()));
            })
            m_filterInput.keypress(function (event) {
                if (event.keyCode == 13) {
                    _base.Viewer().Filter(m_field.Name, ProcessFilter(m_filterInput.val()));
                }
            });

        };

        function ProcessFilter(val) { 
            if (val.indexOf("'") == -1 && val.indexOf("<") == -1 && val.indexOf(">") == -1 && val.indexOf("=") == -1)
                val = '*' + val + '*';
            return val;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
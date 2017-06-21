/// <reference path="../Application.js" />

Define("Searchbox",

    function (field_, viewer_) {
        return new Control("Searchbox", field_, viewer_);
    },

    function (field_) {

        //#region Members

        var _self = this;
        var _base = null;
        var m_button = null;
        var m_values = null;
        var m_skipFocus = false;
        var m_loaded = false;
        var m_search = null;
        var m_view = "";
        var m_timer = 0;

        //#endregion

        //#region Public Methods

        this.Constructor = function (field_) {

            //Setup _base.            
            _base = Base("Searchbox");
        };

        this.CreateMobile = function (window_) {

            //Create the control.
            var container = $('<fieldset data-role="controlgroup" data-type="horizontal"><label id="lbl' + _base.ID() + '" style="font-weight: bold;"></label><input type="search" id="search' + _base.ID() + '" placeholder="Search" /><select id="ctl' + _base.ID() + '" data-theme="a" data-clear-btn="false"></select></fieldset>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                cont.selectmenu({ mini: Application.MiniMode() });
                
                $('#search' + _base.ID()).textinput({ clearBtn: false, mini: Application.MiniMode() }).keyup(function (event) {

                    cont.selectmenu("disable");

                    clearTimeout(m_timer);
                    m_timer = setTimeout(function () {

                        m_search = $('#search' + _base.ID()).val();
                        if (m_search == "") 
                            return;
                        _base.Viewer().ShowLoad();
                        Application.RunNext(function () {
                            return $codeblock(
                                Application.BeginTransaction,
                                function () {
                                    return _self.GenerateData();
                                },
                                Application.CommitTransaction,
			                    function () {
			                        cont.selectmenu("enable");
			                        _base.Viewer().HideLoad(); 
                                }
                            );
			             });

                    }, 2000);
                }).focus(function () {
                    $(".placeholder").css("height", '800px');
                    $('html, body').animate({
                        scrollTop: cont.offset().top - 100
                    }, 1000);
                }).blur(function () {
                    $(".placeholder").css("height", '1px');
                    $.mobile.resetActivePageHeight();
                });

            });
        };

        //#endregion

        this.GenerateData = function (value) {

            var viewer = _base.Viewer();
            var view = viewer.View();
            var field = _base.Field();
            var cont = _base.Control();

            //viewer.ShowLoad();

            //Get the lookup records.            

            if (m_search == null)
                m_search = "";

            //Save view.
            m_view = Application.MergeLookupView(field, viewer, m_search, value);

            return Application.LookupRecord(field, viewer, m_search, PopulateControl, value);
        };

        //#region Overloaded Methods

        this.Update = function (rec_) {

            Application.LogInfo("Updating mobile control: " + _base.ID() + ", Caption: " + _base.Field().Caption);

            var value = rec_[_base.Field().Name];

            m_search = $('#search' + _base.ID()).val();

            var view = Application.MergeLookupView(_base.Field(), _base.Viewer(), m_search, value);

            if (m_loaded) {
                if (typeof value == 'undefined') {
                    _self.Loaded(true);
                    return;
                }                
                _base.Control().val(value).attr('selected', true).siblings('option').removeAttr('selected');
                _base.Control().selectmenu("refresh", true);
                _self.Loaded(true);
            }
            if (!m_loaded || m_view != view) {
                return _self.GenerateData(value);
            }
        };

        //#endregion

        function PopulateControl(result, value, displcol) {

            var viewer = _base.Viewer();
            var view = viewer.View();
            var field = _base.Field();
            var cont = _base.Control();

            cont.html("");
            var lastcat = "";
            for (var i = 0; i < result.length; i++) {
                var sel = ""
                if (i == 0 && result[i][field.LookupField] != null)
                    cont.append('<option value="null"></option>');
                if (result[i][field.LookupField] == value) {
                    sel = " selected";
                }
                if (lastcat != result[i].BoldField && result[i].BoldField != "")
                    cont.append('<OPTGROUP LABEL="' + result[i].BoldField + '">');
                lastcat = result[i].BoldField;
                cont.append('<option value="' + result[i][field.LookupField] + '"' + sel + '>' + result[i][displcol] + '</option>');
            }

            cont.selectmenu();
            cont.selectmenu('refresh');

            if (typeof value != 'undefined')
                cont.val(value);

            m_loaded = true;
            _self.Loaded(true);

        };

        this.Enabled = function (value_, update_) {

            if (value_ !== undefined) { //SET

                _base.Enabled(value_, update_);

                if (value_ == true) {
                    if (_base.Field().Editable)
                        $('#search' + _base.ID()).parent().show();
                } else {
                    $('#search' + _base.ID()).parent().hide();
                }

            } else { //GET

                return _base.Enabled();

            }
        };

        //#region Overrideable Methods

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor(field_);

    });
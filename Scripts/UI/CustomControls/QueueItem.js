/// <reference path="../Application.js" />

Define("QueueItem",

    function (field_, viewer_) {
        if (field_)
            field_.Enabled = false;
        return new Control("QueueItem", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_page = null;
        var m_view = null;
        var m_record = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("QueueItem");
        };

        this.CreateDesktop = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" class="main-windowsbtn ui-widget ui-state-default" onmouseover="$(this).addClass(\'ui-state-hover\')" onmouseout="$(this).removeClass(\'ui-state-hover\')" style="padding: 4px; margin: 5px; text-align: center; display: none; width: 150px; height: 100px; border: 0px;" ><table id="tbl' + _base.ID() + '" style="width: 100%"><tr><td style="width: 50%;"><img id="img' + _base.ID() + '" src="' + Application.executionPath + 'Images/Icons/icon-queueitem.png" /></td><td style="width: 50%;"><label id="ctl' + _base.ID() + '" class="unselectable" style="font-size: 16pt; font-weight: normal; font-family: Arial;"></label></td></tr><tr><td colspan="2" style="padding: 5px; vertical-align: top;"><label id="lbl' + _base.ID() + '" class="unselectable"></label></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                container.width("100px");
                container.css("min-width", "100px");

                cont[0].disabled = false;

                _base.Label().removeClass("app-label");
                cont.removeClass("app-control");

                container.on("click", function (e) {

                    //Open the page viewer.
                    if (m_page)
                        Application.App.LoadPage(m_page, Application.MergeView(m_view, m_record), { caption: _base.Field().Caption, mode: Application.OptionValue(_base.Field().Options, "mode") }, _base.Viewer().ParentWindow().ID());

                });

                container.qtip({
                    position: {
                        at: 'center right'
                    },
                    content: 'View ' + _base.Field().Caption,
                    style: {
                        tip: {
                            corner: false
                        }
                    }
                });

            });
        };

        this.CreateMobile = function (window_) {

            window_.css("text-align", "center");

            //Create the control.            
            var container = $('<div id="' + _base.ID() + '" class="main-windowsbtn ui-page-theme-a ui-btn" style="padding: 4px; margin: 5px; text-align: center; width: 150px; height: 100px; border: 0px;" ><table id="tbl' + _base.ID() + '" style="width: 100%"><tr><td style="width: 50%;"><img id="img' + _base.ID() + '" src="' + Application.executionPath + 'Images/Icons/icon-queueitem.png" /></td><td style="width: 50%;"><label id="ctl' + _base.ID() + '" class="unselectable" style="font-size: 14pt; font-weight: normal; font-family: Arial; color: black;"></label></td></tr><tr><td colspan="2" style="padding: 5px; vertical-align: top; white-space: pre-wrap;"><label id="lbl' + _base.ID() + '" style="font-size: 8pt;"></label></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                container.width("100px");
                container.css("min-width", "100px");
                _base.Label().css("text-align", "center");
                cont[0].disabled = false;

                container.on("click", function (e) {

                    //Open the page viewer.
                    if (m_page)
                        Application.App.LoadPage(m_page, Application.MergeView(m_view, m_record), { caption: _base.Field().Caption, mode: Application.OptionValue(_base.Field().Options, "mode") }, _base.Viewer().ParentWindow().ID());

                });
            });
        };

        this.FormatValue = function (value_, rec_) {

            var img = Application.OptionValue(_base.Field().Options, "queueimage");

            if (img)
                $('#img' + _base.ID()).attr("src", Application.executionPath + 'Images/Icons/' + img + '.png');


            m_page = Application.OptionValue(_base.Field().Options, "queuepage");
            m_view = Application.OptionValue(_base.Field().Options, "queueview");

            var g_limit = Default(Application.OptionValue(_base.Field().Options, "queue_g"), 1);
            var r_limit = Default(Application.OptionValue(_base.Field().Options, "queue_r"), 999999);
            var y_limit = Default(Application.OptionValue(_base.Field().Options, "queue_y"), 999999);
            var b_limit = Default(Application.OptionValue(_base.Field().Options, "queue_b"), 0);

            if (value_ >= parseInt(b_limit)) {
                _base.Container().css("border-left", "4px solid Gainsboro");
            }
            if (value_ >= parseInt(g_limit)) {
                _base.Container().css("border-left", "4px solid #00CC00");
            }
            if (value_ >= parseInt(y_limit)) {
                _base.Container().css("border-left", "4px solid #FFFF00");
            }
            if (value_ >= parseInt(r_limit)) {
                _base.Container().css("border-left", "4px solid #FF9999");
            }

            if (value_ == -1) {
                _base.Control().hide();
            } else {
                _base.Control().show();
                _base.Control().text(value_);
            }
        };

        this.CreateList = function (value_) {
            Application.Error('QueueItems can only be used in a card page.');
        };

        this.Update = function (rec_) {

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined')
                return;

            m_record = rec_;
            _self.FormatValue(value, rec_);
            _self.Loaded(true);
        };

        this.SetSize = function (width, height) {

        };

        this.SetupTest = function () {
            _base.Field().Options = "queueimage:check";
        };

        //#endregion

        //#region Overrideable Methods

        this.OnValueChange = function (name, value) {
            return true;
        };

        this.IgnoreColumns = function () {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
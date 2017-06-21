/// <reference path="../Application.js" />

Define("Captcha",

    function (field_, viewer_) {
        return new Control("Captcha", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_captcha = [];

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            _base = Base("Captcha");

            Application.On("Error", _self.OnError);
        };

        this.CreateDesktop = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="margin: 20px;"><table style="max-width: 700px; float: right; margin-right: 30px;"><tr><td id="instruct' + _base.ID() + '" style="background-color: #dfeffc; font-size: 12pt; width:100%; text-align: center; padding: 20px;"></td></tr><tr><td id="images' + _base.ID() + '" style="font-size: 12pt; width:100%; text-align: center; padding: 20px;"></td></tr></table></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

            });
        };

        this.CreateMobile = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="margin: 20px;"><center><table style="max-width: 500px;"><tr><td id="instruct' + _base.ID() + '" style="background-color: #dfeffc; font-size: 12pt; width:100%; text-align: center; padding: 20px;"></td></tr><tr><td id="images' + _base.ID() + '" style="font-size: 12pt; width:100%; text-align: center; padding: 20px;"></td></tr></table></center></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {
            });
        };

        this.CreateList = function (value_) {
        };

        //#endregion

        //#region Overrideable Methods

        this.IgnoreColumns = function () {
            return true;
        };

        this.OnError = function (err) {
            //if (err && err.indexOf("ROBOT") != -1) {
                m_captcha = [];
                _self.Update();
                _self.OnValueChange(_base.Field().Name, null);
            //}
        };

        this.Update = function () {
            _base.Loaded(true);
            if (m_captcha.length == 0) {
                $('#images' + _base.ID()).html("");
                Application.RunNext(function () {
                    var w = $wait();
                    Application.ExecuteWebService("GenerateCaptcha", { auth: Application.auth }, function (r) {
                        m_captcha = r;
                        $('#instruct' + _base.ID()).html("Click or touch the <b>" + r[1] + "</b>");
                        if (Application.IsMobileDisplay())
                            $('#instruct' + _base.ID()).css("font-size", "9pt");
                        for (var i = 2; i < r.length - 5; i++) {
                            var width = "";
                            if (Application.IsMobileDisplay())
                                width = " width: 30px";
                            $('#images' + _base.ID()).append("<img id='img" + _base.ID() + i + "' class='captchaimg' src='" + r[i] + "' style='padding: 10px; cursor: pointer;" + width + "' answer='" + r[i + 5] + "' />");
                            $("#img" + _base.ID() + i).on("click", function () {
                                $(".captchaimg").css("border", "");
                                $(this).css("border", "dashed #7BC0E9 4px");
                                _self.OnValueChange(_base.Field().Name, m_captcha[0] + "|" + $(this).attr("answer"));
                            });
                        }
                        w.resolve();
                    });
                    return w.promise();
                });
            }
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
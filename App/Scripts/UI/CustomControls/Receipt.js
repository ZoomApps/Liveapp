/// <reference path="../Application.js" />

Define("Receipt",

    function (field_, viewer_) {
        return new Control("Receipt", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_loaded = false;
        var m_baseImage = "data:image/jpeg;base64,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";
        var m_cleared = false;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Receipt");
        };

        this.CreateMobile = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="padding: 10px; text-align: center;"><img id="ctl' + _base.ID() + '" src="" style="max-width: ' +
                150 + 'px; max-height: ' + 300 +
                'px;" /><br/><div id="acc' + _base.ID() + '"></div><br/><input id="file' + _base.ID() + '" type="file" style="visibility: hidden;position: absolute;top: 0;left: -5000px;" /><br/><a id="clear' + _base.ID() + '" data-role="button" data-icon="delete" data-theme="c" data-inline="true">Delete</a></div>');

            if (Application.UnsupportedIE() || !window.FileReader) {
                container = _base.CreateUnsupported();
            }

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                if (Application.UnsupportedIE() || !window.FileReader) {
                    return;
                }

                if (_base.Field().Editable) {

                    $('#clear' + _base.ID()).buttonMarkup().click(function () {
                        Application.Confirm("Are you sure you wish to delete this image?", function (r) {
                            if (r) {

                                m_loaded = false;

                                _self.OnValueChange(_base.Field().Name, null);
                                m_cleared = true;
                                $('#file' + _base.ID()).val("");
                            }
                        });
                    });

                    if (window.FileReader) {

                        $('#ctl' + _base.ID()).click(function () {
                            $('#file' + _base.ID()).click();
                        });
                        $('#file' + _base.ID()).fileReaderJS({
                            on: {
                                load: function (url) {

                                    m_loaded = false;
                                    $('#file' + _base.ID()).val("");
                                    _base.Viewer().ShowLoad();

                                    _self.ResizeForProcessing(url);

                                }
                            }
                        });
                    }

                } else {
                    $('#clear' + _base.ID()).css("display", "none");
                }

                _base.Control().attr("src", m_baseImage);
            });
        };

        this.ResizeForProcessing = function (img) {
            UI.ImageManager.Resize(img, 1000, 0, 0, function (img) {
                _self.ResizeForSave(img);
            });
        };

        this.ResizeForSave = function (img) {

            UI.ImageManager.Resize(img, 200, 0, 0, function (imgsave) {

                _self.OnValueChange(_base.Field().Name, UI.ImageManager.Base64(imgsave));

                //Process after save.
                ProcessImage(UI.ImageManager.Base64(img));
            });
        };

        this.FormatValue = function (value_) {

            try {
                if (value_ == null || value_ == m_baseImage) {
                    _base.Control().attr("src", m_baseImage);
                } else {
                    _base.Control().attr("src", "data:image/png;base64," + value_);
                }
            } catch (e) {
                _base.Control().attr("src", m_baseImage);
            }

            m_loaded = true;
        };

        this.Update = function (rec_) {

            Application.LogInfo("Updating mobile control: " + _base.ID() + ", Caption: " + _base.Field().Caption);

            if (m_loaded) {
                _self.Loaded(true);
                return;
            }

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined' || value == "") {
                _self.FormatValue(m_baseImage);
                _self.Loaded(true);
                return;
            }

            if (value == null && !m_cleared) {
                _self.Loaded(true);
                return;
            }
            m_cleared = true;

            _self.FormatValue(value);
            _self.Loaded(true);
        };

        //#endregion

        function ProcessImage(img_) {

            var id = $id();
            Application.RunNext(function () {

                return Application.FileDownload.UploadFile("Receipt" + id, img_, function (file) {

                    _base.Viewer().ShowLoad();

                    Application.OCR.Process(file.Name, 2, "TOTAL", 3, "Decimal", function (match_) {

                        _base.Viewer().HideLoad();

                        Application.RunNext(function () {
                            //TODO: Replace this
                            alert("TODO: Replace this");
                            //return Application.Settings.ReceiptFinish(_base, match_);
                        });
                        Application.RunNext(_self.NextPage);

                    });

                });
            });

        };

        this.NextPage = function () {
            if (_base.Viewer().NextStep) {
                _base.Viewer().NextStep();
            }
            _base.Viewer().HideLoad();
        };

        //#region Overrideable Methods

        this.IgnoreColumns = function () {
            return true;
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
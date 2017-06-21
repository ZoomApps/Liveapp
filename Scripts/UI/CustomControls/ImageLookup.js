/// <reference path="../Application.js" />

Define("ImageLookup",

    function (field_, viewer_) {
        return new Control("ImageLookup", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_loaded = false;
        var m_baseImage = UI.Icon("camera_large", 48, true);
        var m_cleared = false;
        var m_cropper = null;
        var m_value = null;
		var m_boxy = null;
		var m_id = 0;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("ImageLookup");
        };

        this.CreateDesktop = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="padding: 10px; text-align: left;"><img id="ctl' + _base.ID() + '" src="" style="max-height: 300px;" /><br /><br /><a id="edit' + _base.ID() + '" data-role="button" data-theme="c" data-inline="true">Add/Edit</a><a id="clear' + _base.ID() + '" data-role="button" data-icon="delete" data-iconpos="notext" data-theme="c" data-inline="true">Delete</a><br/><input id="file' + _base.ID() + '" type="file" style="display:none;" /><div id="placeholder' + _base.ID() + '" style="width: 300px; height: 400px; display: none;"></div></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                cont.removeClass("app-control");

                if (_base.Field().Editable) {

                    $('#clear' + _base.ID()).button().click(function () {
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

                        $('#edit' + _base.ID()).button().click(function () {
                            $('#file' + _base.ID()).click();
                        });

                        $('#ctl' + _base.ID()).click(function () {
							if (Application.HasOption(_base.Field().Options, "zoom")) {
								_self.Zoom();
							} else {
								$('#file' + _base.ID()).click();
							}
                        });

                        $('#file' + _base.ID()).fileReaderJS({
                            on: {
                                load: function (url) {

                                    m_loaded = false;
                                    $('#file' + _base.ID()).val("");

                                    if (Application.HasOption(_base.Field().Options, "crop")) {

                                        m_cropper = new Croppic('placeholder' + _base.ID(), {
                                            modal: true,
                                            loadPicture: url,
                                            rotateControls: false,
                                            onAfterImgCrop: function (i) {
                                                UI.ImageManager.Resize(i.imgUrl, i.imgW, i.imgH, i.rotation, function (img) {                                                                                                        
                                                    UI.ImageManager.Crop(img, i.imgX1, i.imgY1, i.cropW, i.cropH, function (img) {
                                                        _self.OnValueChange(_base.Field().Name, UI.ImageManager.Base64(img));
                                                    });                                                        
                                                });
                                            }
                                        });

                                    } else {

										if(_base.Viewer() && _base.Viewer().OnSaveImage){
											_base.Viewer().OnSaveImage(url,function(img){
												_self.OnValueChange(_base.Field().Name, img);
											});
											return;
										}											
									
										var maxwidth = Default(Application.OptionValue(_base.Field().Options, "maxwidth"), "400");
										var quality = Default(Application.OptionValue(_base.Field().Options, "quality"), "20");
									
										_base.Viewer().ShowLoad();
                                        UI.ImageManager.Resize(url, maxwidth, 0, 0, function (img) {
											UI.ImageManager.ChangeQuality(img, quality, function (img2) {   
												_base.Viewer().HideLoad();											
												_self.OnValueChange(_base.Field().Name, UI.ImageManager.Base64(img2));
											});
                                        });

                                    }
                                }
                            }
                        });

                    } else {
                        $('#edit' + _base.ID()).css("display", "none");
                    }

                } else {
                    $('#edit' + _base.ID()).css("display", "none");
                    $('#clear' + _base.ID()).css("display", "none");
					if (Application.HasOption(_base.Field().Options, "zoom")) {
						$('#ctl' + _base.ID()).click(function () {
							_self.Zoom();
						});
					}
                }
				
				if(Application.HasOption(_base.Field().Options, "nodelete"))
					$('#clear' + _base.ID()).css("display", "none");
				
                //Issue #72 - Allow image download
                $('#ctl' + _base.ID()).mousedown(function (ev) {
                    if (ev.which == 3) {
                        UI.ContextMenu([{ Name: "Download", ID: 1 }], function (cmd) {
                            if (cmd == 1) {
                                Application.FileDownload.DownloadBlob("photo.jpg", m_value, "image.jpeg");
                            }
                        });
                        ev.preventDefault();
                        return false;
                    }
                });

                _base.Control().attr("src", m_baseImage);
            });
        };

        this.CreateMobile = function (window_) {

            //Create the control.
            var container = $('<div id="' + _base.ID() + '" style="padding: 10px; text-align: left;"><img id="ctl' + _base.ID() + '" src="" style="max-height: 300px;" /><br/><a id="edit' + _base.ID() + '" data-role="button" data-icon="edit" data-theme="c" data-inline="true">Edit</a> <a id="clear' + _base.ID() + '" data-role="button" data-icon="delete" data-iconpos="notext" data-theme="c" data-inline="true">Delete</a><br/><input id="file' + _base.ID() + '" type="file" style="display:none;" /></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

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

                        $('#edit' + _base.ID()).buttonMarkup().click(function () {
                            $('#file' + _base.ID()).click();
                        });
                        $('#ctl' + _base.ID()).click(function () {
							if (Application.HasOption(_base.Field().Options, "zoom")) {
								_self.Zoom();
							} else {
								$('#file' + _base.ID()).click();
							}
                        });
                        $('#file' + _base.ID()).fileReaderJS({
                            on: {
                                load: function (url) {
                                    m_loaded = false;
                                    $('#file' + _base.ID()).val("");
                                    UI.ImageManager.Resize(url, 200, 0, 0, function (img) {
                                        _self.OnValueChange(_base.Field().Name, UI.ImageManager.Base64(img));
                                    });
                                }
                            }
                        });
                    } else {
                        $('#edit' + _base.ID()).css("display", "none");
                    }

                } else {
                    $('#edit' + _base.ID()).css("display", "none");
                    $('#clear' + _base.ID()).css("display", "none");
					if (Application.HasOption(_base.Field().Options, "zoom")) {
						$('#ctl' + _base.ID()).click(function () {
							_self.Zoom();
						});
					}
                }
				
				if(Application.HasOption(_base.Field().Options, "nodelete"))
					$('#clear' + _base.ID()).css("display", "none");

                //Issue #72 - Allow image download
                $('#ctl' + _base.ID()).taphold(function (ev) {
                    Application.FileDownload.DownloadBlob("photo.jpg", m_value, "image.jpeg");
                    ev.preventDefault();
                    return false;
                })

                _base.Control().attr("src", m_baseImage);
            });
        };

        this.FormatValue = function (value_) {

            try {
                if (value_ == null) {
                    _base.Control().attr("src", m_baseImage);
                    m_value = m_baseImage;
                } else {
                    _base.Control().attr("src", "data:image/png;base64," + value_);
                    m_value = value_;
                }
            } catch (e) {
                _base.Control().attr("src", m_baseImage);
                m_value = m_baseImage;
            }

            m_loaded = true;
        };

        this.Update = function (rec_) {

            Application.LogInfo("Updating control: " + _base.ID() + ", Caption: " + _base.Field().Caption);

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') {
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
		
		this.SetSize = function(w){
			_base.Container().width(w);
		};

        //#endregion

        //#region Overrideable Methods

        this.OnValueChange = function (name, value) {
            return true;
        };

        this.NoFocus = function () {
            return true;
        };

		this.Zoom = function () {
			if (m_value!==null && m_value.indexOf("data:image") == -1){
				m_id = $id();
				var win = "";
				
				if (Application.IsInMobile()) {
					win = "<div id='" + m_id + "' class='app-dialog' style='" +
						"max-width: "+UI.MagicWidth()+"px;  min-width: "+UI.MagicWidth()+"px; height: " + (UI.Height()-50) + "px; max-height: " + (UI.Height()-50) + "px'>" +
						"<div id='" + m_id + "actions' class='ui-bar ui-bar-b' style='border-width: 0px; padding: 0px; overflow: visible;'></div>" +
						"<div id='" + m_id + "main' style='padding: 10px;'>" +
						"<img id='" + m_id + "image' style='height: 95%; width: 95%; display: block; margin: auto;'>" +
						"</div></div>";
				} else {
					win = "<div id='" + m_id + "' style='max-height: "+(UI.Height()-50)+"px; max-width: "+(UI.Width()-50)+"px;'><div id='" + m_id + "actions' class='ui-widget ui-state-default' style='border: 0px;'>" +
						"</div>" +
						"<div id='" + m_id + "toolbar2' style='display: none;'>" +
						"</div>" +
						"<div id='" + m_id + "main' class='ui-widget-content' style='border-width: 0px;'>" +
						"<img id='" + m_id + "image' style='height: 95%; width: 95%; display: block; margin: auto;'>" +
						"</div></div>";
				}

				m_boxy = new Boxy(win, {
					title: "Loading...",
					closeText: "X",
					modal: true,
					unloadOnHide: true,
					show: false,
				});				
				$('#' + m_id + 'image').attr("src", "data:image/png;base64," + m_value);
				m_boxy.setTitle("Zoom");
				m_boxy.center();
				m_boxy.show();		
			}
		}
        //#endregion

        //Constructor
        this.Constructor();

    });
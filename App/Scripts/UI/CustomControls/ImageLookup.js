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
            var container = $('<div id="' + _base.ID() + '" style="padding: 10px; text-align: left;"><div id="zoom'+_base.ID()+'"><div id="wrapper' + _base.ID() + '" data-download-url="false"><img id="ctl' + _base.ID() + '" src="" style="max-width: 200px;" /></div></div><br /><br /><a id="edit' + _base.ID() + '" data-role="button" data-theme="c" data-inline="true">Add/Edit</a><a id="clear' + _base.ID() + '" data-role="button" data-icon="delete" data-iconpos="notext" data-theme="c" data-inline="true">Delete</a><br/><input id="file' + _base.ID() + '" type="file" style="display:none;" /><div id="placeholder' + _base.ID() + '" style="width: 600px; height: 800px; display: none;"></div></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                cont.removeClass("app-control");

				if (Application.HasOption(_base.Field().Options, "zoom")) {
					_self.SetupZoom();
				}
				
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
                            if(!_base.Field().Editable)
                                return;
							if (!Application.HasOption(_base.Field().Options, "zoom")) {
								$('#file' + _base.ID()).click();
							}
                        });

                        $('#file' + _base.ID()).fileReaderJS({
                            on: {
                                beforestart: function (e, file) {
                                    _base.Viewer().ShowLoad();
                                },
                                loadend: function (e, file) {
                                    _base.Viewer().HideLoad();
                                },
                                load: function (url) {

                                    m_loaded = false;
                                    $('#file' + _base.ID()).val("");

                                    if (Application.HasOption(_base.Field().Options, "crop")) {

                                        var id = $id();
                                        var win = "<div id='" + id + "' style='max-height: "+(UI.Height()-50)+"px; max-width: "+(UI.Width()-50)+"px;  max-width: "+(UI.Width()-50)+"px;'>" +
						                "<div id='" + id + "actions' class='ui-widget ui-state-default' style='border: 0px;'></div>"+
                                        "<div id='" + id + "main' class='ui-widget-content' style='border-width: 0px; width: 300px; height: 400px;'>" +
						                "<img id='" + id + "image' style='max-height: 300px; height: 300px; max-width: 100%; display: block; margin: auto;'>" +
						                "</div></div>";
                                    
                                        var cropbox = new Boxy(win, {
                                            title: "Loading...",
                                            closeText: "X",
                                            modal: true,
                                            unloadOnHide: true,
                                            show: false,
                                        });

                                        var rotate1 = $("<button class='unselectable app-button' style='border-width: 0px;'>Rotate -45</button>").button().on("click", function () {
                                            $('#' + id + 'image').cropper("rotate", -45);
                                        });
                                        $("#" + id + "actions").append(rotate1);

                                        var rotate2 = $("<button class='unselectable app-button' style='border-width: 0px;'>Rotate +45</button>").button().on("click", function () {
                                            $('#' + id + 'image').cropper("rotate", 45);
                                        });
                                        $("#" + id + "actions").append(rotate2);

                                        var zoom1 = $("<button class='unselectable app-button' style='border-width: 0px;'>Zoom In</button>").button().on("click", function () {
                                            $('#' + id + 'image').cropper("zoom", 0.1);
                                        });
                                        $("#" + id + "actions").append(zoom1);

                                        var zoom2 = $("<button class='unselectable app-button' style='border-width: 0px;'>Zoom Out</button>").button().on("click", function () {
                                            $('#' + id + 'image').cropper("zoom", -0.1);
                                        });
                                        $("#" + id + "actions").append(zoom2);

                                        var crop = $("<button class='unselectable app-button' style='border-width: 0px;'>Finish Crop</button>").button().on("click", function () {
                                            var url = $('#' + id + 'image').cropper("getCroppedCanvas", {
                                                width: 300
                                            }).toDataURL();
                                            cropbox.hide();
                                            _self.OnValueChange(_base.Field().Name, UI.ImageManager.Base64(url));
                                        });
                                        $("#" + id).append(crop);

                                        $('#' + id + 'image').attr("src", url).cropper();
                                        cropbox.setTitle("Crop");
                                        cropbox.center();
                                        cropbox.show();
                                        
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
            var container = $('<div id="' + _base.ID() + '" style="padding: 10px; text-align: left;"><div id="zoom'+_base.ID()+'"><div id="wrapper' + _base.ID() + '" data-download-url="false"><img id="ctl' + _base.ID() + '" src="" style="max-width: 200px;" /></div></div><br/><a id="edit' + _base.ID() + '" data-role="button" data-icon="edit" data-theme="c" data-inline="true">Edit</a> <a id="clear' + _base.ID() + '" data-role="button" data-icon="delete" data-theme="c" data-inline="true">Delete</a><br/><input id="file' + _base.ID() + '" type="file" style="display:none;" /></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

				if (Application.HasOption(_base.Field().Options, "zoom")) {
					_self.SetupZoom();
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

                        $('#edit' + _base.ID()).buttonMarkup().click(function () {
                            $('#file' + _base.ID()).click();
                        });
                        $('#ctl' + _base.ID()).click(function () {
                            if(!_base.Field().Editable)
                                return;
							if (!Application.HasOption(_base.Field().Options, "zoom")) {
								$('#file' + _base.ID()).click();
							}
                        });
                        $('#file' + _base.ID()).fileReaderJS({
                            on: {
                                load: function (url) {
                                    m_loaded = false;
                                    $('#file' + _base.ID()).val("");
                                    UI.ImageManager.Resize(url, 400, 0, 0, function (img) {
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
                    $("#wrapper"+_base.ID()).attr("data-src",m_baseImage);
                    m_value = m_baseImage;
                } else {
                    _base.Control().attr("src", "data:image/png;base64," + value_);
                    $("#wrapper"+_base.ID()).attr("data-src","data:image/png;base64,"+value_);
                    m_value = value_;
                }
            } catch (e) {
                _base.Control().attr("src", m_baseImage);
                $("#wrapper"+_base.ID()).attr("data-src",m_baseImage);
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
		
		this.SetupZoom = function(){
			$("#zoom"+_base.ID()).lightGallery({                
				cssEasing: 'cubic-bezier(1.000, 0.000, 0.000, 1.000)'
			});
		};

        this.Enabled = function (value_, update_) {
            
            _base.Enabled(value_, update_);

            if(_base.Field().Editable){
                $('#edit' + _base.ID()).show();
                $('#clear' + _base.ID()).show();
            }else{
                $('#edit' + _base.ID()).hide();
                $('#clear' + _base.ID()).hide();
            }       
            
            return _base.Enabled();
        };

        //#endregion        

        //#region Overrideable Methods

        this.OnValueChange = function (name, value) {
            return true;
        };

        this.NoFocus = function () {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
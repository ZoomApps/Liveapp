/// <reference path="../Application.js" />

//27/01/15      Issue #7        PF      Added new control.

Define("PhotoGallery",

    function (field_, viewer_) {
        return new Control("PhotoGallery", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_container = null;
        var m_form = null;
        var m_baseImage = UI.Icon("camera_large", 48, true);
        var m_record = null;
		var m_contextMenuOptions = null;
		var m_archiveButtons = [];
		var m_archivePeriods = [];

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("PhotoGallery");
        };

        this.CreateDesktop = function (window_, form_) {

            m_form = form_;

            //Create the control.
            m_container = $('<div id="' + _base.ID() + '" style="padding-top: 10px;overflow-y: auto;"><ul id="gallery' + _base.ID() + '" class="photo-gallery" style="margin-top: 0; margin-bottom: 9px; list-style-position: inside;"></ul></div>');

            window_.AddControl(m_container);

			if(Application.HasOption(form_.Options,"hidenew") == false)
				window_.AddButton("New", "document_new", "New", function () {
					return _self.New();
				});

            Application.RunNext(function () {
                window_.ShowActions();
            });

            _self.Loaded(true);
        };

        this.CreateMobile = function (window_, form_) {
            return _self.CreateDesktop(window_, form_);
        };

        this.CreateList = function (value_) {
            //Not used.            
        };

        this.New = function () {
			_base.Viewer().ShowLoad();
            Application.Camera.TakePhoto(function (img) {
                Application.RunNext(function () {
                    return $codeblock(

                        Application.BeginTransaction,

                        function () {
                            return m_record.New();
                        },

                        function (r) {
                            m_record = r;
                            m_record[m_form.Fields[0].Name] = img;
                            return m_record.Insert(true);
                        },

                        function () {
                            AddImage(m_record);
                            RefreshGallery();
							_base.Viewer().HideLoad();
                        },

                        Application.CommitTransaction

                    );
                });
            },Application.OptionValue(m_form.Options,"quality"),Application.OptionValue(m_form.Options,"maxwidth")); 
        };

        this.Update = function (rec_) {

            m_record = rec_;

            m_archivePeriods.forEach(function(el){
                $('#gallery' + _base.ID() + el).html("");
            });
            
            $('#gallery' + _base.ID()).children().remove();

			for(var i = 0; i < m_archiveButtons.length; i++){
				m_archiveButtons[i].remove();
			}
			m_archiveButtons = [];
			m_archivePeriods = [];
			
			if(Application.HasOption(m_form.Options,"autoarchive"))
				eval("m_archiveButtons.push(_base.Viewer().AddButton('This Year', 'calendar', 'This Year', function () {var id = '#gallery' + _base.ID(); $('.photo-gallery').hide(); $(id).show(); RefreshGallery(id);}));");
			
			var today = new Date();
			
            rec_.First();
            if (rec_.Count > 0)
                do {

					if(Application.HasOption(m_form.Options,"autoarchive")){
						
						var dte = rec_[m_form.Fields[1].Name];
						
						if(dte){	
							var year = dte.getFullYear();							
							if(year != today.getFullYear()){
								if(m_archivePeriods.indexOf(year) == -1){
									
									m_archivePeriods.push(year);
									
									var g = $('<ul id="gallery' + _base.ID() + year + '" class="photo-gallery" style="margin-top: 0; margin-bottom: 9px; list-style-position: inside; display: none;"></ul>');
									m_container.append(g);
									
									AddImage(rec_, '#gallery' + _base.ID() + year);
									
									eval("m_archiveButtons.push(_base.Viewer().AddButton('"+year+"', 'calendar', '"+year+"', function () {var id = '#gallery' + _base.ID() + '"+year+"'; $('.photo-gallery').hide(); $(id).show(); RefreshGallery(id);}));");
								}
							}else{
								AddImage(rec_);	
							}
						}else{
							AddImage(rec_);
						}
						
					}else{
			
						AddImage(rec_);
						
					}

                } while (rec_.Next());

            RefreshGallery();
            _self.Loaded(true);
        };

        this.Height = function (h) {
            m_container.height(h - 70);
        };

        this.Width = function (w) {
            m_container.width(w - 20);
        };
		
		this.ContextMenuOptions = function(val){
			if(typeof val == "undefined"){
				return m_contextMenuOptions;
			}else{
				m_contextMenuOptions = val;
			}
		};

        //#endregion

        //#region Private Methods

        function AddImage(rec_, parent_) {

            var id = $id();

            var photo = rec_[m_form.Fields[0].Name];
			var rec = new Record();
			rec.Copy(rec_);

            if (photo == null) {
                photo = m_baseImage;
            }

            var maxheight = Default(Application.OptionValue(m_form.Options, "maxheight"), "100px");

			parent_ = Default(parent_,'#gallery' + _base.ID());
			
            $(parent_).append('<li data-src="data:image/jpeg;base64,' + photo + '" style="padding-left: 0; list-style: none; display: inline-block; padding: -3px;"><img id="img'+id+'" src="data:image/jpeg;base64,' + photo + '" style="max-height: ' + maxheight + '; display: inline-block;" /><a id="clear' + id + '" rid="' + m_record.Position + '" style="color: #FFF; position: relative; right: 15px; bottom: -4px; cursor: pointer; font-weight: bold; text-shadow: 1px 1px 2px #000; font-size: 23pt;">x</a></li>');

            //Issue #72 - Allow image download
            if (Application.IsInMobile()) {
                $('#img' + id).taphold(function (ev) {
                    Application.FileDownload.DownloadBlob("photo.jpg", photo, "image.jpeg");
                    ev.preventDefault();
                    return false;
                })
            }else{
                $('#img' + id).mousedown(function (ev) {
                    if (ev.which == 3) {
						var opts = [];
						if(m_contextMenuOptions && m_contextMenuOptions.options){
							opts = m_contextMenuOptions.options;
						}else{
							opts = [{ Name: "Download", ID: 1 }];
						}
                        UI.ContextMenu(opts, function (cmd) {
							if(m_contextMenuOptions && m_contextMenuOptions.onselect){
								m_contextMenuOptions.onselect(cmd, rec);
							}else{
								if (cmd == 1) {
									Application.FileDownload.DownloadBlob("photo.jpg", photo, "image.jpeg");
								}
							}
                        });
                        ev.preventDefault();
                        return false;
                    }
                });
            }

            $('#clear' + id).click(function (e) {
                e.stopPropagation();
                Application.Confirm("Are you sure you wish to delete this image?", function (r) {
                    if (r) {
                        Application.RunNext(function () {
                            return $codeblock(

                                Application.BeginTransaction,

                                function () {
                                    m_record.First();
                                    do {
                                        if (m_record.Position.toString() == $('#clear' + id).attr("rid")) {
                                            return m_record.Delete(true);
                                        }
                                    } while (m_record.Next());
                                },

                                function (r) {
                                    m_record = r;
                                },

                                Application.CommitTransaction,

                                function () {
                                    return _self.Update(m_record);
                                }
                            );
                        });
                    }
                });
            });
            
        };
		
        function RefreshGallery() {
            Application.RunSilent(function(){
                $('#gallery' + _base.ID()).lightGallery().data('lightGallery').destroy(true);
            });
            $('#gallery' + _base.ID()).lightGallery({                
                showThumbByDefault: true,
                addClass: 'showThumbByDefault',
                cssEasing: 'cubic-bezier(1.000, 0.000, 0.000, 1.000)'
            });
        };

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
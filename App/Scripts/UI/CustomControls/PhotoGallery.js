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
        var m_baseImage = "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";
        var m_record = null;
		var m_contextMenuOptions = null;
        var m_filters = new Object();
        var m_tags = [];

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("PhotoGallery");
        };

        this.CreateDesktop = function (window_, form_) {

            m_form = form_;

            //Create the control.
            m_container = $('<div id="' + _base.ID() + '" style="padding: 10px;overflow-y: auto; height: auto;"><div id="tagfilters'+_base.ID()+'" style="padding: 10px;"></div><ul id="gallery' + _base.ID() + '" style="margin-top: 0; margin-bottom: 9px; list-style-position: inside; padding-left: 7px;"></ul></div>');

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
			
            Application.Camera.TakePhoto(function (img) {
                Application.RunNext(function () {
                    _base.Viewer().ShowLoad();
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
            
            $('#gallery' + _base.ID()).children().remove();

            rec_.First();
            if (rec_.Count > 0)
                do {

                    AddImage(rec_);

                } while (rec_.Next());

            RefreshGallery();
            _self.Loaded(true);
        };

        this.Height = function (h) {
            //m_container.height(h - 70);
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

		function RefreshFilters(){			
			
			var tagfilters = $("#tagfilters"+_base.ID());
            tagfilters.html("");
            
            $.each(m_tags,function(index,value){
                var tagbtn = $('<div style="display: inline-block; padding: 5px; margin: 5px; background: #3498db; color: white; cursor: pointer;">'+value.replace(/\*/g,'')+' '+UI.IconImage('mdi-close')+'</div>');
                tagfilters.append(tagbtn);
                tagbtn.on('click',function(e){
                    m_tags.splice(index,1);
                    var filter = null;
                    if(m_tags.length > 0)
                        filter = m_tags.list('&');
                    _base.Viewer().Filter(Application.OptionValue(m_form.Options,"tags"), filter, false);
                    RefreshFilters();
                });
            });
			
			Application.RunNext(_base.Viewer().Update);
		};
		
        function AddImage(rec_) {

            var id = $id();

            var photo = rec_[m_form.Fields[0].Name];
			var rec = new Record();
			rec.Copy(rec_);

            if (photo == null) {
                photo = m_baseImage;
            }

            var maxheight = Default(Application.OptionValue(m_form.Options, "maxheight"), "100px");

            var li = $('<li data-src="data:image/jpeg;base64,' + photo + '" style="padding-left: 0; list-style: none; display: inline-block; padding: -3px; height: 190px; width: 130px; vertical-align: top;">'+
			'<img id="img'+id+'" src="data:image/jpeg;base64,' + photo + '" style="margin-right: 0px; margin-bottom:-30px; width: 105px; display: inline-block; height: 100px;" />'+
			(m_form.Fields[0].Editable ? ('<div id="clear' + id + '" rid="' + m_record.Position + '" style="font-size: 18px; width: 30px; height: 30px; border-radius: 50%; color: white; background-color: Gainsboro; text-align: center; line-height: 25px; position: relative; top: 0px; left: -10px; cursor: pointer;">'+UI.Icon("pencil")+'</div>') : '<div id="blank' + id + '" rid="' + m_record.Position + '" style="width: 30px; height: 30px; line-height: 25px; position: relative; top: 0px; left: -10px;"></div>')+
            '</li>');

            if(Application.OptionValue(m_form.Options,"tags")){
                var tags = rec[Application.OptionValue(m_form.Options,"tags")];
                if(tags){
                    var tags = tags.split(',');
                    $.each(tags, function( index, value ) {
                        var tagbtn = $('<div style="display: inline-block; padding: 5px; margin: 5px; background: #3498db; color: white; cursor: pointer;">'+value+'</div>');
                        li.append(tagbtn);
                        tagbtn.on('click',function(e){
                            e.stopPropagation();
                            if(m_tags.indexOf('*'+value+'*') == -1)
                                m_tags.push('*'+value+'*');
                            _base.Viewer().Filter(Application.OptionValue(m_form.Options,"tags"), m_tags.list('&'), false);
                            RefreshFilters();
                        });
                    });
                }
            }
            
            $('#gallery' + _base.ID()).append(li);
			
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

				var rec = GetRecordByRid($('#clear' + id).attr("rid"));
				if(rec)
					OPENPAGE(Application.OptionValue(m_form.Options, "editpage"),null,{ record: rec, dialog: true });							                              
            });
            
        };

		function GetRecordByRid(rid){
			
			m_record.First();
			do {
				if (m_record.Position.toString() == rid) {					
					var rec = new Record();
					rec.Copy(m_record);
					rec.Count = 1;
					rec.Position = 0;											
					return rec;
				}
			} while (m_record.Next());
			return null;
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
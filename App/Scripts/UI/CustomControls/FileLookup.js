/// <reference path="../Application.js" />

Define("FileLookup",

    function (field_, viewer_) {
        return new Control("FileLookup", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_loaded = false;
        var m_baseImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NzA3MzhDNDI0MjlBMTFFMjlCOTdDRDNGRTM1MTAwQjUiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NzA3MzhDNDE0MjlBMTFFMjlCOTdDRDNGRTM1MTAwQjUiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0RTU3QjVDMTQyMjkxMUUyQkY0N0UwQ0IyRjFGN0U5QSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0RTU3QjVDMjQyMjkxMUUyQkY0N0UwQ0IyRjFGN0U5QSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pohpf/0AAAR5SURBVHja7NzLSltBHMDh5qioBMWN+AIu1aXvj2+g7gS3rpVG4wWTDg4Mp1ptNU37nznfb1ECvXByzpe5lTiaTCbfpL/dCCyBJbAElrsgsASWwJLAElgCSwJLYAksCSyBJbAksASWwJLAElgCSwJLYAksCSyBJbAksASWwJLAElgCSwJLYAksCSyBJbAksP5z8/l89FJ6AVagp9J1XX4k+QnlXyvl1X/x031vnZ0Ra1meTIVgLUtY+rU/+uaBCiwtOqEXT0asWMusk5OTGmeWdM0rKyvPz8/5ysfj8cHBwfr6el5XDWSu7CJi7y1sa3wG6VORVeWLv729PT8/f3x8HNTo1dU1EvTXK5EvMpOazWb5xd3d3dnZWbaVp0iwYu228nOKPIz1r62s3Iutp6engYxb1cDqP7Aq5se3s/l0Ok22Hh4ePjjEamb5VeWwXMWHvuhJE2K57GQrrbfu7+/fmxCbGc9CHzekXeGrR7WxsbGzs1PXLb65uUnzYH/Du7m5eXh4mPeJmV17+8TVugaqra2t/f39D/6rJOA1X15eZlhlRZ/HraOjo7W1tVaPHupbY5UVccxHUnYYb9dMeZOYp8i83kpr+fJnGlvUVwOrv1J59fCiXecHC/PyW+lF/wzCiBViVxj58/0p8Q2fbw3isC5yrZ5vgfX/a/J8C6wQO8f2zrfAirLkL7bKMr/qyRGsKCcUxVZay5eDCbC00HDV3vkWWCFGrPbOt8CKewZR9fkWWKFt1Xu+BVbcqj7fAituVZ9vgRV9w1jp+RZYoXeL9Z5vgRV6uKr3fAus0CNWvedbq57fstve3v4yhevr6zRW9W2dnp4eHx+XbyyCNdzxZnd3d29v7wu20l+5uLgosLKktIqPr8pUuCxSZQ3U/3Ffn1WV/+KrL3/X8qMfwPr79Z/9l3/A2gffDANruDNg+R7RIgje+7aPxftwzwgqEmDEqm+BtcgY86lD9oCCwVoir0VWRb/8+uR7/07AVRdYlW0LTIUadGAJLIElsCSwBJbAksASWAJLAktgCSwJLIElsCSwBJbAksASWAJLAktgCSwJLIElsCSwBJbAksASWAJLAktgCSwJLIElsCSwBJbAksASWAJLAktgCSwJLIElsCSwBJbAksASWAJLAktgCSwJLIH1J41GIw8vcqt1Xe50Or26uiqq0ov5fN7qs0lvLb3fSt9jZbC+v5Ru9BBGrPQeZ7NZ/51W9Ma7Gj/HA5kHk6qu6ypdAHR1kRrU6ipPgpXO9V1dN3qAq+DRS2D9u0Gr4WX7L981WEsftAY1J1b6NkeTySTs8jxfW9tnCl9oPB6nRX3eMIa9ORFh5ZuVN9vlDvJUPnXpnsT/pEWEpT/ZKhZeMQetoLDKzarlA/qP1wnxlwdGrHaGMbBauHFuRZW7wrLNRuq3vKyxNKDRCyyBJbAEFlgCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYAksCS2AJLAksgSWwJLAElsCSwBJYAkv6XD8EGAD9LvkdGZgSPQAAAABJRU5ErkJggg==";
        var m_fileImage = "data:image/png;base64,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"//"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIBAMAAABfdrOtAAAAA3NCSVQICAjb4U/gAAAAG1BMVEW2trb09PS9vb3e3t7FxcXv7+/m5ubMzMzW1tYJEfE0AAAACXBIWXMAAAAAAAAAAAHqZRakAAAAJXRFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyBNWCAyMDA0h3aszwAAAy1JREFUeJzt2s9z0kAUB/CdtBaOZmJSjgxV6zH4a3pkLG29Ri31WGvFK9ZRrtSL/7a83QQ2ySPZkPdQZ967sDNk8uHLJrubBeXvoJQggggiiCCCCCKIIIIIIogggrRFojulThNe5P3SUOrtdoojEoyUru5WihsSLlRa53zIVWYo7xMbMlsh6gkXEqwN1eFCbixEDZkQ3e3HL05GW35fLkjYh69p2eMfAdnjQXSX/IBWvF2nuCA9uHQTaB0uW/sJCwKn7upW1M84cuTDEjnQrRC6vvntWIlMTd1Cd090E5DXU6taI7eqvpzGsgpEX7l15TSWVSCPHAylnrZDHjohLlFaIy5R2iMOUdojDlFqkM7v+Xx+lzVK1XeLUoPoTwmX2QF6yMItSjvETMvekACBsQufRdK5/2gXSF0UEqRutqRBalYXREh1lKbI5AuKVEdpiEQj7x5FKqM0RG7yp7OWr0M6ZJZfSFgIfrdugxQXEhbisSELazBmQ+JdIMHYFCviX+qa9FkRU5EggggiSGOk8sH0v0L2VmdDFvEUCOxImM0OaCE7EhSI3lsZQuudQvdWKJAIEFi5R9AlXR4k1IuS78nkF7wi+10UiH+tVwqP3+iXb0zIoVoXtklEgujbIy1s0UuC2Dud98iRNIg+i65n2JE0iH+VKvtDRsR/qRUP+7LoEP9kPBhcvLLff36cUCP+5XSa2G8H6yuNDilWrFaPV2yIHjUfMCP60aTLi5hfOzxeZGFuG1aklxvImBAThPfqygdhQvJBeJBCEDoknHWSrF0IQocsb76ztFkMQobAzZct64pByJBrOK2JUgpChuill4lSCkKGmOkXopSDkCEjlUUpByFD0k2nMywI6dWloyBBSO8TqAskCB1i/yZf3DulG7vsrcDCgpgOCTYGoRyF401BKJFgUxDS+STeEIQUCTYEoZ0ZYzwILRLgQYjn+BgNQowEaBDq1crX8U/kSL7nE0EEEWSXiNt/38J2yNHUpT63Q7yBU6lWSIMSZAdIr5GB7K67ILlf22sL352sR5pEqQryj/0bXRBBBBFEEEEEEUQQQQQRRBBBBBFEkL+D/AFFZyDrQXpu0wAAAABJRU5ErkJggg==";
        var m_cleared = false;
        var m_value = null;
		var m_lastID = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("FileLookup");
        };

        this.CreateDesktop = function (window_) {            

            //Create the control.
            var pathonly = Application.HasOption(_base.Field().Options, "pathonly");
            var container = (pathonly ?
                (Application.IsInMobile() ? 
                $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label>'+
                '<div id="ctl' + _base.ID() + '" style="min-width:100%;text-overflow: ellipsis;overflow-y: hidden;white-space: nowrap;margin-right: 3px; box-sizing: border-box; border: 3px dashed gainsboro; padding: 5px;">Loading...</div>'+
                '<p><a id="clear' + _base.ID() + '" data-role="button" data-theme="c" data-inline="true" style="display: inline-block;">' + UI.IconImage("delete") + ' Delete</a> '+
                '<a id="open' + _base.ID() + '" data-role="button" data-theme="c" data-inline="true" style="display: inline-block;">' + UI.IconImage("document_out") + ' Open</a></p>'+
                '<input id="file' + _base.ID() + '" type="file" style="display:none;" />'
                )
                :
                $('<div id="' + _base.ID() + '" style="display: none;"><table style="width: 100%"><tr>'+
                    '<td style="width: 50%"><label id="lbl' + _base.ID() + '" id= for="ctl' + _base.ID() + '" style="width: 100%; padding-left: 6px;"></label></td>'+
                    '<td style="width: 50%; padding-right: 10px; vertical-align: top;">'+
                    '<div id="ctl' + _base.ID() + '" style="text-overflow: ellipsis;overflow-y: hidden;overflow-x: hidden;white-space: nowrap;margin-right: 3px; box-sizing: border-box; display: inline-block; border: 3px dashed gainsboro; padding: 2px; cursor: pointer;">Loading...</div>'+
                    '<a id="clear' + _base.ID() + '" style="display: inline-block;overflow-y: hidden;">Delete</a> '+
                    '<a id="open' + _base.ID() + '" style="display: inline-block;overflow-y: hidden;">Open</a>'+
                    '<input id="file' + _base.ID() + '" type="file" style="display:none;" />'+
                    '</td>'+
                    '</tr></table></div>')
                )
                :
                $('<div id="' + _base.ID() + '" style="padding: 10px; '+(Application.IsInMobile() ? '' : 'text-align: center;')+'">'+
                '<img id="ctl' + _base.ID() + '" src="" style="border: 3px dashed gainsboro; width: '+(Application.IsInMobile()?'80px':'150px')+';" />'+
                '<p><label id="filelbl' + _base.ID() + '">Loading...</label></p>'+
                '<p><a id="clear' + _base.ID() + '" data-role="button" data-theme="c" data-inline="true" style="display: inline-block;">' + UI.IconImage("delete") + ' Delete</a> '+
                '<a id="open' + _base.ID() + '" data-role="button" data-theme="c" data-inline="true" style="display: inline-block;">' + UI.IconImage("document_out") + ' Open</a></p>'+
                '<br/><input id="file' + _base.ID() + '" type="file" style="display:none;" /></div>')
            );

            if (!window.FileReader) {
                container = _base.CreateUnsupported();
            }

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                if (!window.FileReader) {
                    container.width("95%");
                    return;
                }

                if (_base.Field().Editable) {

                    function deleteFn() {
                        Application.Confirm("Are you sure you wish to delete this file?", function (r) {
                            if (r) {

                                m_loaded = false;

                                _self.OnValueChange(_base.Field().Name, null);
                                m_cleared = true;
                                $('#file' + _base.ID()).val("");
                            }
                        });
                    }

                    if(Application.IsInMobile()){
                        $('#clear' + _base.ID()).buttonMarkup().click(deleteFn);
                    }else{
                        $('#clear' + _base.ID()).button().click(deleteFn);
                    }                        

                    $('#ctl' + _base.ID()).click(function () {
                        if(!_base.Field().Editable)
                            return;
                        $('#file' + _base.ID()).click();
                    });
                    $('#file' + _base.ID() + ',#' + _base.ID()).fileReaderJS({
                        on: {
                            load: function (url, e, file) {

                                m_loaded = false;
                                $('#file' + _base.ID()).val("");

                                url = file.extra.nameNoExtension + "." + file.extra.extension + "|" + url;

                                val = btoa(url);

                                _self.OnValueChange(_base.Field().Name, val);
                            }
                        }
                    });

                }

                function openFn() {
                    if (m_value) {

                        var val = atob(m_value);
                        var v = val.split("|");

                        var url = v[1].split(";");
                        var byteString = atob(url[1].substr(7));

                        var ab = new ArrayBuffer(byteString.length);
                        var ia = new Uint8Array(ab);
                        for (var i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        
                        var blob = new Blob([ia], { type: url[0] });

                        var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

                        if(iOS){
                            var downloadlink = $('<div style="position: fixed; z-index: 50000; top: 0px; left: 0px; font-size: 30px; background-color: white; width: 100vw; height: 100vh; text-align: center; padding-top: 30vh;"></div>');
                            $('body').append(downloadlink);
                            var $link = $('<a>Open Document</a>').on('click',function(){
                                saveAs(blob, v[0]);    
                            });
                            downloadlink.append($link);
                            downloadlink.on('click',function(){
                                downloadlink.remove();
                            });
                        }else{
                            saveAs(blob, v[0]);
                        }                              
                    }
                }

                if(Application.IsInMobile()){
                    $('#open' + _base.ID()).buttonMarkup().click(openFn);
                }else{
                    $('#open' + _base.ID()).button().click(openFn);
                }                    

                if(!pathonly){
                    _base.Control().attr("src", m_baseImage);                    
                }
                
                $('#clear' + _base.ID()).hide();
                $('#open' + _base.ID()).hide();

            });            
        };

        this.CreateMobile = function (window_, form_) {
            return _self.CreateDesktop(window_, form_);
		};

        this.CreateList = function (value_) {

            //Create the control.
            var container = $('<span>')
            .addClass("ui-combobox")
            .css("width", "100%");

            var cont = $('<input type="file">')
            .appendTo(container)
            .val(value_)
            .attr("maxlength", _base.Field().Size)
            .addClass("ui-widget ui-widget-content ui-corner-left")
	        .css("width", "80%")
	        .css("width", "calc(100% - 2px)");

            //Call base method.
            return _base.CreateList(container, cont, value_);
        };

        this.FormatValue = function (value_) {

            var pathonly = Application.HasOption(_base.Field().Options, "pathonly");

            if (pathonly){
                _base.Control().html("Click to upload a " + _base.Field().Caption);
            }else{            
                $('#filelbl' + _base.ID()).html("Click to upload a " + _base.Field().Caption + 
                    (!Application.IsInMobile()?" or drag and drop<br/>your " + _base.Field().Caption + " into this box.":""));
            }

            try {

                if (value_ != null) {

                    var val = atob(value_);
                    var v = val.split("|");

                    if(pathonly){
                        _base.Control().html(v[0]);
                    }else{
                        $('#filelbl' + _base.ID()).text(v[0]);
                        _base.Control().attr("src", m_fileImage);                        
                    }
                    _base.Control().css("border", "3px solid #82AE82");

                    if (_base.Field().Editable)
                        $('#clear' + _base.ID()).show();
                    $('#open' + _base.ID()).show();
                    m_loaded = true;
                    return;
                }

            } catch (e) {
            }

            if(!pathonly){
                _base.Control().attr("src", m_baseImage);                
            }
            _base.Control().css("border", "3px dashed gainsboro");

            $('#clear' + _base.ID()).hide();
            $('#open' + _base.ID()).hide();
        };

        this.Update = function (rec_) {
            
            Application.LogInfo("Updating control: " + _base.ID() + ", Caption: " + _base.Field().Caption);

            if (m_loaded && rec_.Record.RecID == m_lastID) {
                _self.Loaded(true);
                return;
            }

            var value = rec_[_base.Field().Name];

            m_value = value;

            if (typeof value == 'undefined') {
                _self.FormatValue(m_baseImage);
                _self.Loaded(true);
				m_lastID =  rec_.Record.RecID;
                return;
            }

            if (value == null && !m_cleared && rec_.Record.RecID == m_lastID) {
                _self.Loaded(true);
                return;
            }
            m_cleared = true;
			
			m_lastID =  rec_.Record.RecID;

            _self.FormatValue(value);
            _self.Loaded(true);
        };

        //#endregion

        //#region Overrideable Methods

        this.Enabled = function (value_, update_) {
            
            _base.Enabled(value_, update_);

            if(_base.Field().Editable){
                if(m_value)
                    $('#clear' + _base.ID()).show();                
            }else{                
                $('#clear' + _base.ID()).hide();                
            }
        
            return _base.Enabled();
        }
        
        this.SetSize = function (width, height) {
            if (Application.HasOption(_base.Field().Options, "pathonly")){
                _base.Container().width(width);
                if(m_value){
                    _base.Control().width((width / 2) - 160);
                }else{
                    _base.Control().width((width / 2) - 20);
                }
                return;
            }                
            _base.Container().css("width", width);
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });
/// <reference path="../Application.js" />

DefineModule("FileDownloadManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 09, 03),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '03/09/13   PF  Created class.'
        ]

    },

    function () {

        //#region Members

        var _self = this;
        var m_files = [];
        var m_timer = null; //Timer        
        var m_requests = [];		
		var m_chunksize = null;
		var m_timeout = null;
		var m_showProgress = true;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {
        };

        this.OnLoad = function () {

            //Assign Module
            Application.FileDownload = this;

            m_timer = new Timer(50, _self.OnTimer, null, function () {
                for (var i = 0; i < m_requests.length; i++) {
                    var xhr = m_requests[i];
                    xhr.abort();
                }
                m_requests = [];
            });

            Application.On("ProgressCancel", function (id) {
                if (id != "FileDownload") return;
                Application.HideProgress();
                _self.Finish();
                m_files = [];
                _self.Start();
            });
        };

        this.Start = function () {
            m_timer.Start(true);
        };

        this.Finish = function () {
            m_timer.Stop(true);
        };

        this.ShowUploadDialog = function (title_, callback_) {

            var id = $id();
            var value = null;
            var boxy = new Boxy("<div id='" + id + "' class='ui-widget-content' style='border-width: 0px; height: 98%;'></div>", {
                title: UI.BigIconImage("arrow_up_blue", null, 30) + " " + title_,
                closeText: "X",
                modal: true,
                unloadOnHide: true,
                show: false,
                beforeHide: function () {
                    if (callback_ && value)
                        callback_(value[0], value[1]);
                    return true;
                }
            });

            var win = $("#" + id);
            var field = new Application.Objects.PageFieldInfo();
            field.Editable = true;
            field.Name = "File";
            field.Caption = "File";
            var cont = new FileLookup(field, null);
            cont.CreateDesktop(win);
            cont.OnValueChange = function (name, val) {
                val = atob(val);
                value = val.split("|");
                boxy.hide();
            };
            cont.SetSize(340, 300);
            boxy.center();
            boxy.show();
            boxy.tween(350, 300);
        };

        this.UploadFile = function (name_, data_, finish_, cancel_, showUI_) {

            showUI_ = Default(showUI_, true);

            return $codeblock(

                function () {
                    return Application.CreateFileForUpload(name_, data_.length, Default(m_chunksize,100000));
                },

                function (info_) {

					var w = $wait();
					
                    info_ = InitInfo(info_);
                    info_.finish = function(file){
						w.resolve(file);
					};
                    info_.chunksize = Default(m_chunksize,100000);
                    info_.showUI = showUI_;
					info_.failedChunks = [];

                    AddFile(info_, false);

                    info_.chunks = [];
                    for (var i = 0; i < info_.chunkcount; i++) {
                        if (i * info_.chunksize + info_.chunksize > data_.length) {
                            info_.chunks.push(data_.substr(i * info_.chunksize));
                        } else {
                            info_.chunks.push(data_.substr(i * info_.chunksize, info_.chunksize));
                        }
                    }
					
					return w.promise();
                },
				
				function(file){
					if(finish_){
						return finish_(file);
					}
				}
            );
        };

        this.DownloadFile = function (info_, finish_, cancel_, showUI_) {

            Default(showUI_, true);

            info_.Expires = Application.ConvertDate(info_.Expires);

            if (!showUI_) {
                _self.InitDownload(info_, finish_, cancel_);
                return;
            }

            Application.Confirm("<p><img src='%SERVERADDRESS%Images/Icons/document_attachment.png' /></p><p>Name: " + info_.Name + "<br/>Size: " + PrintLength(info_) + "</br>Expires: " + $.format.date(info_.Expires, 'hh:mm a') + "</p><p>Do you wish to download this file?</p>", function (r) {

                if (!r) {
                    if (cancel_)
                        cancel_();
                    return;
                }

                _self.InitDownload(info_, finish_, cancel_);

            }, "File ready for download");
        };

        this.InitDownload = function (info_, finish_, cancel_, showUI_) {

            showUI_ = Default(showUI_, true);

            info_ = InitInfo(info_);
            info_.showUI = showUI_;
            info_.finish = finish_;
            info_.chunksize = 50000;
            if (info_.Length > 100000)
                info_.chunksize = 100024;
			if(m_chunksize)
				info_.chunksize = m_chunksize;
			info_.failedChunks = [];

            setTimeout(function () {
                AddFile(info_, true);
            }, 500);
        };

        this.RemoveFile = function (info) {
            for (var i = 0; i < m_files.length; i++) {
                if (m_files[i].Name == info.Name) {
                    //m_files[i].control.remove();
                    m_files.splice(i, 1);

                    if (m_files.length == 0 && m_showProgress) {
                        Application.HideProgress();
                    }
                    return;
                }
            }
        };

        this.OnTimer = function () {

            if (Application.IsOffline())
                return;

            for (var i = 0; i < m_files.length; i++) {

                if (!m_files[i].finished) {

                    if (m_files[i].download) {
                        var j = m_files[i].chunks.indexOf(null);
                        if (j == -1) {
                            j = m_files[i].chunks.indexOf("");
                            if (j == -1)
                                m_files[i].finished = true;
                        } else {
                            DownloadChunk(i, j);
                        }
                    } else {
                        var j = m_files[i].chunks.firstObject();
                        if (j == -1) {
                            j = m_files[i].chunks.indexOf("");
                            if (j == -1)
                                m_files[i].finished = true;
                        } else {
                            UploadChunk(i, j);
                        }
                    }

                } else if (m_files[i].running == false) {

                    var err = m_files[i].error;

                    if (m_files[i].finish && m_files[i].error == "")
                        m_files[i].finish(m_files[i]);

                    _self.RemoveFile(m_files[i]);

                    if (err != "")
                        Application.Error(err);

                } else {

                    m_files[i].running = false;

					if(m_showProgress)
						Application.HideProgress();
                }
            }
        };

        this.DownloadBlob = function (name_, data_, mime_) {

            var blob = Base64toBlob(data_, mime_);

            if (window.saveAs) {
                window.saveAs(blob, name_);
            }
            else {
                navigator.saveBlob(blob, name_);
            }
        };
		
		this.DownloadText = function (name_, data_, mime_) {

            var blob = new Blob([data_], { type: mime_ });

            if (window.saveAs) {
                window.saveAs(blob, name_);
            }
            else {
                navigator.saveBlob(blob, name_);
            }
        };
		
		this.ChunkSize = function (value_) {

			if (value_ !== undefined) {
				m_chunksize = value_;
			} else {
				return m_chunksize;
			}
		};
		
		this.Timeout = function (value_) {

			if (value_ !== undefined) {
				m_timeout = value_;
			} else {
				return m_timeout;
			}
		};

		this.ShowProgress = function (value_) {

			if (value_ !== undefined) {
				m_showProgress = value_;
			} else {
				return m_showProgress;
			}
		};
		
        //#endregion

        //#region Private Methods

        function InitInfo(info_) {

            info_.finished = false;
            info_.running = true;
            info_.error = "";
            info_.chunks = [];
            info_.completedchunks = 0;

            var id = $id();
            info_.id = id;
            return info_;
        };

        function AddFile(info_, download_) {

            var img = "down";
            var txt = "Download";
            if (!download_) {
                img = "up";
                txt = "Upload";
            }

            info_.download = download_;

            if (info_.Length < info_.chunksize) {
                info_.chunkcount = 1;
            } else {
                info_.chunkcount = Math.ceil(info_.Length / info_.chunksize);
            }

            for (var i = 0; i < info_.chunkcount; i++)
                info_.chunks.push(null);

            if (info_.showUI == true && m_showProgress)
                Application.ShowProgress(info_.Name, txt + "ing", 0, info_.chunkcount);

            m_files.push(info_);

        };

        this.GetFileData = function (file_) {
            var ret = "";
            for (var i = 0; i < file_.chunks.length; i++)
                ret += file_.chunks[i];
            return ret;
        };

        function PrintLength(file_) {
            var len = file_.Length / 1000;
            var unit = "KB";
            if (len > 1000) {
                len = len / 1000;
                unit = "MB"
            }
            return Math.ceil(len) + unit;
        };

        function DownloadChunk(file, chunk) {

            Application.LogInfo("Downloading file chunk: " + m_files[file].Name + ", chunk: " + chunk);

            var callbacks = new Object();

            callbacks.onsend = function (xhr) {
                m_requests.push(xhr);
            };

            callbacks.onsuccess = function (r) {

                if (r != null)
                    if (r.Message)
                        if (r.Message != "FALSE") {
                            callbacks.onerror(r.Message);
                            return;
                        }

                try {

                    m_files[file].chunks[chunk] = r
                    m_files[file].completedchunks += 1;

					if(m_showProgress)
						Application.ShowProgress(m_files[file].Name, "Downloading", m_files[file].completedchunks, m_files[file].chunkcount);

                } catch (ex) {
                }
            };

            callbacks.onerror = function (e) {				
                try {					
                    m_files[file].chunks[chunk] = null;
					Application.LogInfo($.toJSON(e));
                    if (typeof e == "string" && e != "abort" && e != "timeout") {
                        m_files[file].error = e;
                        m_files[file].finished = true;						
                    }else if(typeof e == "string" && e == "timeout"){
							//Dont do anything
						}
                } catch (ex) {
                }
            };

            try {
                m_files[file].chunks[chunk] = "";
                Application.ExecuteWebService("DownloadChunk", { auth: Application.auth, name_: m_files[file].Name, chunk_: chunk, chunkSize_: m_files[file].chunksize }, null, true, null, true, callbacks, m_timeout);
            } catch (ex) {
            }
        };

        function UploadChunk(file, chunk) {

            Application.LogInfo("Uploading file chunk: " + m_files[file].Name + ", chunk: " + chunk);

            var c = m_files[file].chunks[chunk];

            var callbacks = new Object();

            callbacks.onsend = function (xhr) {
                m_requests.push(xhr);
            };

            callbacks.onsuccess = function (r) {

                if (r != null)
                    if (r.Message)
                        if (r.Message != "FALSE") {
                            callbacks.onerror(r.Message);
                            return;
                        }

                try {

                    m_files[file].chunks[chunk] = null;
                    m_files[file].completedchunks += 1;

					if(m_showProgress)
						Application.ShowProgress(m_files[file].Name, "Uploading", m_files[file].completedchunks, m_files[file].chunkcount);

                } catch (ex) {
                }
            };

            callbacks.onerror = function (e) {				
                try {					
                    m_files[file].chunks[chunk] = c;
					Application.LogInfo($.toJSON(e));
                    if (typeof e == "string") {						
                        if (e.indexOf("does not exist") != -1 || e.indexOf("Error saving chunk") != -1 && e != "timeout") {
                            m_files[file].error = e;
                            m_files[file].finished = true;
                        }else if(typeof e == "string" && e == "timeout"){
							//Dont do anything
						}
                    }					
                } catch (ex) {					
                }
            };

            try {
                m_files[file].chunks[chunk] = "";                
				Application.ExecuteWebService("UploadChunk", { auth: Application.auth, name_: m_files[file].Name, chunk_: chunk, chunkData_: c }, null, true, null, true, callbacks, m_timeout);				
            } catch (ex) {				
            }
        };

        function Base64toBlob(data_, contentType_) {

            contentType_ = contentType_ || '';
            var sliceSize = 512;
            data_ = data_.replace(/^[^,]+,/, '');
            data_ = data_.replace(/\s/g, '');
            var byteCharacters = window.atob(data_);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, { type: contentType_ });
            return blob;
        }

        //#endregion

        this.Constructor();

    });
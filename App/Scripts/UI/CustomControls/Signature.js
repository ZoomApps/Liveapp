/// <reference path="../Application.js" />

Define("Signature",

    function (field_, viewer_) {
        return new Control("Signature", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_loaded = false;
        var m_leftButton = false;
        var m_context = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Signature");
        };

        this.CreateDesktop = function (window_) {
            this.CreateMobile(window_); 
        }

        this.CreateMobile = function (window_) {

            //Create the control.
            var container = $('<label id="lbl' + _base.ID() + '" for="ctl' + _base.ID() + '" style="font-weight: bold;"></label><div id="' + _base.ID() + '" style=""><canvas id="ctl' + _base.ID() + '" style="width: 100%; height: 300px; border: 1px solid #000;background:#FFF;"><b>' + UI.IconImage('warning') + ' This control is unsupported in your browser version. Please upgrade to the latest version.</b></canvas><br/><a id="clear' + _base.ID() + '" type="button" data-inline="true" data-mini="true" data-theme="a">Clear Signature</a></div>');

            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                var canvas = $('#ctl' + _base.ID()).get(0);

                m_context = canvas.getContext('2d');                                
            
                // Bind Mouse events
                $(canvas).on('mousedown', function (e) {
                    if(_base.Viewer && _base.Viewer().FocusControl && _base.Viewer().FocusControl())
                        _base.Viewer().FocusControl().blur();
                    if (e.which === 1) {
                        m_leftButton = true;
                        m_context.fillStyle = "#000";
                        var x = e.pageX - $(e.target).offset().left;
                        var y = e.pageY - $(e.target).offset().top;
                        m_context.moveTo(x, y);
                    }
                    e.preventDefault();
                    return false;
                });

                $(canvas).on('mouseup', function (e) {
                    if (m_leftButton && e.which === 1) {
                        m_leftButton = false;
                        _self.SaveSignature();
                    }
                    e.preventDefault();
                    return false;
                });

                // draw a line from the last point to this one
                $(canvas).on('mousemove', function (e) {
                    if (m_leftButton == true) {
                        m_context.fillStyle = "#000";
                        var x = e.pageX - $(e.target).offset().left;
                        var y = e.pageY - $(e.target).offset().top;
                        m_context.lineTo(x, y);
                        m_context.stroke();
                    }
                    e.preventDefault();
                    return false;
                });

                if(Application.IsInMobile()){

                    //bind touch events
                    $(canvas).on('touchstart', function (e) {
                        if(_base.Viewer && _base.Viewer().FocusControl && _base.Viewer().FocusControl())
                            _base.Viewer().FocusControl().blur();
                        m_leftButton = true;
                        m_context.fillStyle = "#000";
                        var t = e.originalEvent.touches[0];
                        var x = t.pageX - $(e.target).offset().left;
                        var y = t.pageY - $(e.target).offset().top;
                        m_context.moveTo(x, y);

                        e.preventDefault();
                        return false;
                    });

                    $(canvas).on('touchmove', function (e) {
                        m_context.fillStyle = "#000";
                        var t = e.originalEvent.touches[0];
                        var x = t.pageX - $(e.target).offset().left;
                        var y = t.pageY - $(e.target).offset().top;
                        m_context.lineTo(x, y);
                        m_context.stroke();

                        e.preventDefault();
                        return false;
                    });

                    $(canvas).on('touchend', function (e) {
                        if (m_leftButton) {
                            m_leftButton = false;
                            _self.SaveSignature();
                        }

                    });

                }

                $('#clear' + _base.ID()).bind("click", function () {

                    _self.ClearPad();
                    _self.SaveSignature(true);

                });

                if(Application.IsInMobile()){
                    $('#clear' + _base.ID()).buttonMarkup({ icon: "delete", mini: Application.MiniMode() });
                }else{
                    $('#clear' + _base.ID()).button();
                }
               
            });
        };

        this.SaveSignature = function (clear) {
            if(clear){
                _self.OnValueChange(_base.Field().Name, null);
                return;
            }
            try {                
                var canvas = $('#ctl' + _base.ID()).get(0);
                var imgData = canvas.toDataURL();
                _self.OnValueChange(_base.Field().Name, imgData.split(';')[1].substr(7), null, false);
            } catch (e) {
                Application.Message('Failed to save signature. Error: ' + e);
            }
        };

        this.ClearPad = function () {

            m_leftButton = false;

            var canvas = $('#ctl' + _base.ID()).get(0);
            var w = $(window).width() - 30;      

            if(!Application.IsInMobile())
                w = 300;
               
            if(!canvas)
                return;
                        
            canvas.width = w;
            canvas.height = 300;            

            if (m_context) {

                m_context.canvas.width = canvas.width;
                m_context.canvas.height = canvas.height;

                m_context.fillStyle = "#fff";
                m_context.fillRect(0, 0, canvas.width, canvas.height);

                //m_context.moveTo(50, 150);
                //m_context.lineTo(canvas.width - 50, 150);
                //m_context.stroke();

                //m_context.fillStyle = "#000";
                //m_context.font = "20px Arial";
                //m_context.fillText("x", 40, 155);
            }
        };

        this.SetSize = function (width, height) {
            if(!Application.IsInMobile()){
                _base.Container().width(width);
                _base.Control().width(300);
            }
        };

        this.Height = function (h) {
        };

        this.Width = function (w) {
        };        

        this.Update = function (rec_) {

            Application.LogInfo("Updating mobile control: " + _base.ID() + ", Caption: " + _base.Field().Caption);

            if (m_loaded) {                
                _self.Loaded(true);
                return;
            }

            _self.ClearPad();

            var value = rec_[_base.Field().Name];
            if (typeof value == 'undefined') {
                _self.Loaded(true);
                return;
            }

            if (m_context && value) {
                var image = new Image();
                image.src = "data:image/png;base64," + value;
                image.onload = function () {
                    m_context.drawImage(image, 0, 0);
                };
            }

            _self.Loaded(true);
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

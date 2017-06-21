/// <reference path="../Application.js" />

Define("QueueItemNew",

    function (field_, viewer_) {
        if (field_)
            field_.Enabled = false;
        return new Control("QueueItemNew", field_, viewer_);
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
            _base = Base("QueueItemNew");
        };

        this.CreateDesktop = function (window_) {

            //Create the control.
            //var container = $('<div id="' + _base.ID() + '" class="main-windowsbtn ui-widget ui-state-default" onmouseover="$(this).addClass(\'ui-state-hover\')" onmouseout="$(this).removeClass(\'ui-state-hover\')" style="padding: 4px; margin: 5px; text-align: center; display: none; width: 150px; height: 100px; border: 0px;" ><table id="tbl' + _base.ID() + '" style="width: 100%"><tr><td style="width: 50%;"><img id="img' + _base.ID() + '" src="' + Application.executionPath + 'Images/Icons/icon-QueueItemNew.png" /></td><td style="width: 50%;"><label id="ctl' + _base.ID() + '" class="unselectable" style="font-size: 16pt; font-weight: normal; font-family: Arial;"></label></td></tr><tr><td colspan="2" style="padding: 5px; vertical-align: top;"><label id="lbl' + _base.ID() + '" class="unselectable"></label></td></tr></table></div>');
			var container = $('<table id="' + _base.ID() + '" style="width: 150px; max-width: 210px; display: inline-block; margin: 5px; height: 150px;"><tbody><tr><td><div id="bg'+_base.ID()+'" style="padding: 4px; text-align: center; width: 100px; height: 100px; border: 0px; border-radius: 50%; cursor: pointer; background-color: whitesmoke;"><img id="img' + _base.ID() + '" src="' + Application.executionPath + 'Images/Icons/icon-QueueItemNew.png" style="margin-top: 23px;"><div id="ctl' + _base.ID() + '" style="font-size: 20px; width: 40px; height: 40px; border-radius: 50%; color: white; background-color: transparent;text-align: center;line-height: 40px;margin-top: -12px;"></div></div></td></tr><tr><td id="lbl' + _base.ID() + '" style="font-size: 14px; text-align: center;"></td></tr></tbody></table>')
			
            //Call base method.
            _base.Create(window_, container, _self.OnValueChange, function (cont) {

                container.width("120px");
                container.css("min-width", "120px");
				
				_base.Viewer().Main().css("padding-bottom","0px").css("padding-top","20px").css("text-align","center");

                cont[0].disabled = false;

                _base.Label().removeClass("app-label");
                cont.removeClass("app-control");

                container.on("click", function (e) {

                    //Open the page viewer.
                    if (m_page)
                        Application.App.LoadPage(m_page, Application.MergeView(m_view, m_record), { caption: _base.Field().Caption, mode: Application.OptionValue(_base.Field().Options, "mode") }, _base.Viewer().ParentWindow().ID());

					var bg = $('#bg'+_base.ID());
					bg.css("background-color","gainsboro");
					setTimeout(function(){
						bg.css("background-color","whitesmoke");
					},500);
                });

				if(!Application.IsInMobile()){
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
				}

            });
        };

        this.CreateMobile = function (window_) {
            return _self.CreateDesktop(window_);
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
                _base.Control().css("background-color", "Gainsboro");
            }
            if (value_ >= parseInt(g_limit)) {
                _base.Control().css("background-color", "#00CC00");
            }
            if (value_ >= parseInt(y_limit)) {
                _base.Control().css("background-color", "#F1C40F");
            }
            if (value_ >= parseInt(r_limit)) {
                _base.Control().css("background-color", "#FF9999");
            }
			
			_base.Label().css("display","");
			_base.Label().css("text-align","center");

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
		
		this.Show = function () {
			_base.Show();
            _base.Container().css("display", "inline-block");            
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
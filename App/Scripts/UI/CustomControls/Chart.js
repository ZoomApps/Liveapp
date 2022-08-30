/// <reference path="../Application.js" />

Define("Chart",

    function (field_, viewer_) {
        return new Control("Chart", field_, viewer_);
    },

    function () {

        //#region Members

        var _self = this;
        var _base = null;
        var m_container = null;
        var m_chart = null;
        var m_data = null;
        var m_form = null;

        //#endregion

        //#region Public Methods

        this.Constructor = function () {

            //Setup _base.            
            _base = Base("Chart");
        };

        this.CreateDesktop = function (window_, form_) {

            m_form = form_;

            //Create the control.
            m_container = $('<div id="' + _base.ID() + '" class="ct-chart ct-perfect-fourth xpress-resize" style="max-width: 800px;"></div>');

            if (Application.UnsupportedIE()) {
                m_container = _base.CreateUnsupported();
                m_container.css('display', '');
            }

            window_.AddControl(m_container);
            _self.Loaded(true);
        };

        this.CreateMobile = function (window_, form_) {
            return _self.CreateDesktop(window_, form_);
        };

        this.CreateList = function (value_) {
            //Not used.            
        };

        this.Update = function (rec_) {

            if (Application.UnsupportedIE())
                return;

            var data = GenerateChartData(rec_);

            if (m_chart) {
                CreateChart(_base.ID().toString(), data);
            } else {
                Application.RunNext(function () {
                    CreateChart(_base.ID().toString(), data);
                });
            }
        };

        this.Height = function (h) {

            m_container.height(h);
    
            $('#' + _base.Viewer().ID() + 'main').css('overflow-y', 'hidden');
        };

        this.Width = function (w) {
            m_container.width(w - 10);
			m_container.css("max-width",w);
            if (m_data != null) {
                Application.RunNext(function () {
                    CreateChart(_base.ID().toString(), m_data);
                });
            }
        };

        this.PageControl = function () {
            return true;
        };

        //#endregion

        //#region Private Methods

        function CreateChart(id_, data_) {

            var cont = $('#'+id_);
            if (cont.length == 0) return;
            cont.html("");

            m_chart = null;

            m_data = data_;

            var labels = [];
            var series = [];
            var links = [];

            for (var i = 0; i < m_data.length; i++) {
                for (var j = 0; j < m_data[i].length; j++) {
                    if (j == 0) {
                        labels.push(m_data[i][j].data);
                    } else {
                        if (series[j - 1] == null) {
                            series[j - 1] = [];
                            links[j - 1] = [];
                        }
                        series[j - 1].push({ meta: m_data[i][j].meta, value: m_data[i][j].data });
                        links[j - 1].push(m_data[i][j].link);
                    }
                }
            }

            var type = Default(Application.OptionValue(_base.Viewer().Page().Options, "type"), "bar");

            if (type == "bar") {
                m_chart = new Chartist.Bar(cont[0], { labels: labels, series: series, links: links }, {
                    axisY: {
                        scaleMinSpace: 50
                    }
                }).on('draw', function (data) {
                    if (data.type === 'bar') {
                        data.element.attr({
                            style: 'stroke-width: 30px'
                        });
                    }
                });
            } else if (type == "stackbar") {
                m_chart = new Chartist.Bar(cont[0], { labels: labels, series: series, links: links }, {
                    stackBars: true,
                    axisY: {
                        scaleMinSpace: 50,
                        labelInterpolationFnc: function (value) {
                            return (value / 1000) + 'k';
                        }
                    }
                }).on('draw', function (data) {
                    if (data.type === 'bar') {
                        data.element.attr({
                            style: 'stroke-width: 30px'
                        });
                    }
                });
            } else if (type == "line") {
                m_chart = new Chartist.Line(cont[0], { labels: labels, series: series, links: links }, {
                    lineSmooth: false,
                    axisY: {
                        scaleMinSpace: 50
                    },
                    plugins: [
                        Chartist.plugins.tooltip({
                            appendToBody: true
                        })
                    ]
                });
            } else if (type == "area") {
                m_chart = new Chartist.Line(cont[0], { labels: labels, series: series, links: links }, {
                    lineSmooth: false,
                    showArea: true,
                    plugins: [
                        Chartist.plugins.tooltip({
                            appendToBody: true
                        })
                    ],
                    axisX: {
                        showGrid: false
                    },
                    axisY: {
                        showGrid: true,
                        onlyInteger: true
                    },
                    chartPadding: {
                        top: 20
                    }
                });
            } else if (type == "pie") {
                m_chart = new Chartist.Pie(cont[0], { labels: labels, series: series, links: links }, {
                    axisY: {
                        scaleMinSpace: 50
                    }
                });
            } else if (type == "gauge") {
                m_chart = new Chartist.Pie(cont[0], { series: series, links: links }, {
                    donut: true,
                    donutWidth: 60,
                    startAngle: 270,
                    total: 200,
                    axisY: {
                        scaleMinSpace: 50
                    }
                });
            }

            m_chart.on('draw', function(data) {
                if(data.type === 'line') {
                    data.element.attr({
                    style: 'stroke-width: 2'
                    });
                }
                if(data.type === 'label') {
                    data.element.attr({
                    style: 'font-size:9px'
                    });
                }
                if(data.type === 'point'){
                    data.element.attr({
                    style: 'stroke-width: 4'
                    });
                }
                if(data.type === 'line' || data.type === 'area') {
                    data.element.animate({
                        d: {
                            begin: 500 * data.index,
                            dur: 500,
                            from: data.path.clone().scale(1, 0).translate(0, data.chartRect.height()).stringify(),
                            to: data.path.clone().stringify(),
                            easing: Chartist.Svg.Easing.easeOutQuint
                        }
                    });
                }
            });

            //Add on click.
            var chart = $(cont[0]);
            chart.unbind('click');
            chart.on('click', '.ct-point,.ct-bar', function () {
                var point = $(this);
                var link = point.attr('ct:link');
                if (link && link != '')
                    eval(point.attr('ct:link'));
            });
        };

        function GenerateChartData(rec_) {

            var recs = new Array();
            if (rec_.Count > 0)
                do {
                    recs.push(ConvertRecordToChartData(rec_));
                }
                while (rec_.Next())

            return recs;
        };

        function ConvertRecordToChartData(rec_) {

            var r = new Array();

            for (var i = 0; i < m_form.Fields.length; i++) {

                var field = m_form.Fields[i];

                var link = null;
                if (field.CustomControl == "Drilldown") {

                    var page = Application.OptionValue(field.Options, "drilldownpage");
                    var view = Application.OptionValue(field.Options, "drilldownview");

                    var parentid = _base.Viewer().ParentWindow().ID();

                    link = "Application.App.LoadPage(\"" + page + "\", \"" + Application.MergeView(view, rec_) + "\", { caption: \"" + field.Caption + "\" }, " + parentid + ");";
                }

                r.push({ data: rec_[field.Name], link: link, meta: field.Caption });
            }

            return r;
        };

        //#endregion        

        //#region Overrideable Methods

        this.Enabled = function (value_) {
        };

        this.OnValueChange = function (name, value) {
            return true;
        };

        //#endregion

        //Constructor
        this.Constructor();

    });  

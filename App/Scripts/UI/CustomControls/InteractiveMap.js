/// <reference path="../Application.js" />
//  28/01/16    BA      Added new control
Define("InteractiveMap",

    function(field_, viewer_) {
        return new Control("InteractiveMap", field_, viewer_);
    },

    function() {

        //#region Members

        var _self = this;
        var _base = null;
        var m_container = null;
        var m_form = null;
        var m_record = null;
        var m_pathProps = [];
        var m_selectList = [];
        var m_subpage = false;
        var m_mapID = -1;
        var m_desc = null;



        //#endregion

        //#region Public Methods
        // _base.Viewer() -> viewer obj
        this.Constructor = function() {
            //Setup _base.            
            _base = Base("InteractiveMap");
        };


        this.CreateDesktop = function(window_, form_) {
            
            m_form = form_;
            
            var tx = Application.OptionValue(m_form.Options, "transx");
            var ty = Application.OptionValue(m_form.Options, "transy");
            
            var vb = Default(Application.OptionValue(m_form.Options, "viewbox"),"150,460");
            vb = vb.split(',');

            //Create the control.
            m_container = $('<div id="map-container' + _base.ID() + '" style="margin:30px 25px;">' +
                '<svg id="svg' + _base.ID() + '" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" height="460px"' +
                'viewBox="0 0 '+vb[0]+' '+vb[1]+'" width="'+vb[0]+'" height="'+vb[1]+'" version="1.1" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">' +
                '<g id="map-group' + _base.ID() + '" transform="translate(' + (tx ? tx : 0) + ' ' + (ty ? ty : 0) + ')" fill-rule="evenodd" cursor="crosshair">' +
                '</g>' +
                '</svg>' +
                '<div id="map-desc' + _base.ID() + '" style="height:30px; width:200px;float:right;white-space:pre-line"></div></div>');

            window_.AddControl(m_container);
            m_desc = document.getElementById("map-desc"+_base.ID());
            _self.Loaded(true);
        };

        this.CreateMobile = function(window_, form_) {
            return _self.CreateDesktop(window_, form_);
        };

        this.CreateList = function(value_) {
            //Not used.            
        };

        this.New = function() {};

        this.Update = function(rec_) {
            // window update, rec_ = recordset of page
            m_record = rec_;

            //clear the svg canvas first
            $('#map-group' + _base.ID()).html("");

            rec_.First();
            if (rec_.Count > 0){
                do {
                    // set up paths
                    AddSVGPath(rec_)
                } while (rec_.Next());
                //AttachHandlers();
            }
            _self.Loaded(true);
        };

        this.Height = function(h) {
            m_container.height(h - 70);
        };

        this.Width = function(w) {
            m_container.width(w - 20);
        };
        //#endregion

        //#region Private Methods
        function MakeSVGElement(tag, attrs) {
            var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
            for (var a in attrs)
                el.setAttribute(a, attrs[a]);
            return el;
        }

        function AddSVGPath(rec_,parent_) {
            var path = MakeSVGElement('path', {id: rec_["PathID"], fill: rec_["PathFill"], d:rec_["Path"], mapid:rec_.ID, handle:(rec_.Skip ? false : true)});
            document.getElementById(Default(parent_, 'map-group' + _base.ID())).appendChild(path);

            if (!rec_["Skip"]){
                //attach event handlers
                path.addEventListener('mouseenter', _self.HoverIn, false);
                path.addEventListener('mouseleave', _self.HoverOut, false);
                path.addEventListener('click', _self.ClickHandler, false);

                var pathOpts = _self.GetOptions(rec_["PathID"]);
                //if property object already exists, overwrite it
                if (pathOpts) {
                    pathOpts.ref = path;
                } else {
                    // store in a new object
                    m_pathProps.push({
                        id: rec_["PathID"],
                        mapid: rec_.ID,
                        colour: rec_["PathFill"],
                        selected: false,
                        ref: path
                    });
                }
                if (!pathOpts || !pathOpts.selected){
                    // clear colouring
                    path.style.fill = '#FFF';
                }
            }
        };

        function ShadeColour(col,amt) {
            var hash = false;
            if ( col[0] == "#" ) {
                col = col.slice(1);
                hash = true;
            }
            var num = parseInt(col,16);
            var r = (num >> 16) + amt;
            var b = ((num >> 8) & 0x00FF) + amt;
            var g = (num & 0x0000FF) + amt;
            if ( r > 255 ) r = 255;
            else if  (r < 0) r = 0;
            if ( b > 255 ) b = 255;
            else if  (b < 0) b = 0;
            if ( g > 255 ) g = 255;
            else if  ( g < 0 ) g = 0;
            return (hash?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
        }
        //#endregion        

        //#region Overrideable Methods
        this.HoverIn = function(ev) {
            ev = ev || window.event;
            var areaOpts = _self.GetOptions(ev.target.id);
            ev.target.style.fill = ShadeColour(areaOpts.colour,-30);
        };

        this.HoverOut = function(ev) {
            ev = ev || window.event;
            var areaOpts = _self.GetOptions(ev.target.id);
            if (!areaOpts.selected) {
                ev.target.style.fill = '#FFF';
            } else {
                ev.target.style.fill = areaOpts.colour;
            }
        };

        this.ClickHandler = function(ev) {
            ev = ev || window.event;
            var areaOpts = _self.GetOptions(ev.target.id);
            areaOpts.selected = !areaOpts.selected;

            if (areaOpts.selected) {
                m_selectList.push(ev.target.id);
            } else {
                m_selectList.splice(m_selectList.indexOf(ev.target.id), 1);
            }
            // show selections in window
            /*
            m_desc.textContent = m_selectList.reduce(function(prev, curr) {
                return prev + "\r\n" + curr;
            },"");
            */
        };

        this.GetOptions = function(aid) {
            return m_pathProps.filter(function(el) {
                return (el.id == aid);
            })[0];
        };

        this.Enabled = function(value_) {};

        this.OnValueChange = function(name, value) {
            return true;
        };

        //#endregion

        this.PageControl = function() {
            return true;
        };

        //Constructor
        this.Constructor();

    }
);
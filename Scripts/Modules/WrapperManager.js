/// <reference path="../Application.js" />

Application.wrapperTypes = {
    Titanium: 1
};

DefineModule("WrapperManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2013, 09, 03),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: []

    },

    function () {

        //#region Members

        var _self = this;
        var m_type = Application.wrapperTypes.Titanium; //Default the wrapper.

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.Wrapper = this;
        };        

        this.IsInWrapper = function () {

            if (m_type == Application.wrapperTypes.Titanium) {
                try {                    
                    return typeof Ti.App != "undefined";
                } catch (e) {
                    Application.LogError(e);
                }
                return false;
            }
        };        

        this.FireEvent = function (name_, params_) {

            if (m_type == Application.wrapperTypes.Titanium) {
                try {
                    Ti.App.fireEvent(name_, params_);
                } catch (e) {
                    Application.LogError(e);
                }
            }

        };

        //#endregion

        //#region Private Methods

        //#endregion

    });

    //#region Titanium UI

    if (typeof window.TiApp != "undefined") {

        var Ti = {
            _event_listeners: [],
            createEventListener: function (listener) {
                var newListener = {
                    listener: listener,
                    systemId: -1,
                    index: this._event_listeners.length
                };
                this._event_listeners.push(newListener);
                return newListener;
            },
            getEventListenerByKey: function (key, arg) {
                for (var i = 0; i < this._event_listeners.length; i++) {
                    if (this._event_listeners[i][key] == arg) {
                        return this._event_listeners[i];
                    }
                }
                return null;
            },
            API: TiAPI,
            App: {
                addEventListener: function (eventName, listener) {
                    var newListener = Ti.createEventListener(listener);
                    newListener.systemId = TiApp.addEventListener(eventName, newListener.index);
                    return newListener.systemId;
                },
                removeEventListener: function (eventName, listener) {
                    if (typeof listener == 'number') {
                        TiApp.removeEventListener(eventName, listener);
                        var l = Ti.getEventListenerByKey('systemId', listener);
                        if (l !== null) {
                            Ti._event_listeners.splice(l.index, 1);
                        }
                    } else {
                        l = Ti.getEventListenerByKey('listener', listener);
                        if (l !== null) {
                            TiApp.removeEventListener(eventName, l.systemId);
                            Ti._event_listeners.splice(l.index, 1);
                        }
                    }
                },
                fireEvent: function (eventName, data) {
                    TiApp.fireEvent(eventName, JSON.stringify(data));
                }
            },
            executeListener: function (id, data) {
                var listener = this.getEventListenerByKey('index', id);
                if (listener !== null) {
                    listener.listener.call(listener.listener, data);
                }
            }
        };
        var Titanium = Ti;

    }
    
    //#endregion

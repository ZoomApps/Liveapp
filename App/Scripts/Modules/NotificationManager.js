/// <reference path="../Application.js" />

DefineModule("NotificationManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        created: new Date(2014, 02, 23),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '23/02/14   PF  Created class.'
        ]
    },

    function () {

        //#region Members

        var _self = this;                

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.Notifications = this;            
        };

        this.Send = function (user, message, options, notify) {
            Application.RunNext(function () {
                return $codeblock(
                    function () {
                        if (options == null) options = "";
                        return Application.WebServiceWait("SendNotification", { auth: Application.auth, user_: user, message_: message, options_: options, skipUser_: false, sendFromCurrent_: true });
                    },
                    function () {
                        if (notify)
                            Application.Message("Message Sent");
                    }
                );
            });
        };

        this.ShowMessageForm = function () {

            if (Application.IsInMobile())
                return;

            Application.RunNext(function () {

                Application.LogInfo("Opening Message Form...");

                //Check if window is already open.
                var winid = UI.WindowManager.GetWindowByUID("MESSAGEFORM");
                if (winid != -1) {
                    Application.LogInfo("Opening previous Message Form");
                    UI.WindowManager.Open(winid);
                    return;
                }

                //Create the window.
                var win = new Window();
                win.Create(UI.IconImage("mailbox_empty") + " Send Message", {
                    closebutton: true,
                    workspace: $("#AppWorkspace"),
                    shortcutWorkspace: $("#AppWindows"),
                    position: Application.position.normal
                });
                win.UID("MESSAGEFORM");
                win.HideActions();

                win.AddControl($('<center><div class="ui-dialog ui-dialog-content ui-widget ui-widget-content ui-corner-all" style="text-align: left; width: 70%; border: none;"><fieldset>' +
                            '<label for="txtUser">' +
                            '    %LANG:S_USERNAME%</label>' +
                            '<input type="text" id="txtUser" class="text ui-widget-content ui-corner-all" value="" tabindex="1" />' +
                            '<label for="message">' +
                            '    Message</label>' +
                            '<textarea id="txtMessage" rows="20" style="width: 95%; margin: 10px; font-size: 12px;" tabindex="2"></textarea>' +
                            '<br />' +
                            '</fieldset><br />' +
                            '<br />' +
                            '<input id="btnSend" type="button" value="Send Message" tabindex="4" /></div></center>'));

                $("#btnSend").on("click", function () {
                    Application.Notifications.Send($("#txtUser").val(), $("#txtMessage").val(), "", true);
                });

                win.AddControl($('<br/><br/>'));

                //Add the window to the manager and open it.
                UI.WindowManager.Add(win);
                UI.WindowManager.Open(win.ID());

            });
        };

        this.OnTimer = function (queue) {

            if (Application.IsOffline() || !Application.connected)
                return;

            if (Application.auth.SessionID != "") {

                if (Application.Offline)
                    if (Application.Offline.DownloadRequest() != null)
                        return;                               

                if (queue == null)
                    return;

                for (var i = 0; i < queue.length; i++) {

                        try {

                            var msg = queue[i][1];

                            queue[i][2] = Default(queue[i][2], "");
                            queue[i][3] = Default(queue[i][3], "");

                            eval("var opts = {" + queue[i][2] + "};");
                            opts.style = Default(opts.style, "info");
                            opts.autoHide = Default(opts.autoHide, false);
                            opts.statusbar = Default(opts.statusbar, false);
                            opts.statuscolor = Default(opts.statuscolor, null);
                            opts.messagebox = Default(opts.messagebox, false);
                            opts.messagetitle = Default(opts.messagetitle, null);
                            opts.messagecallback = Default(opts.messagecallback, "");

                            if (opts.statusbar) {

                                UI.StatusBar(true, msg, opts.statuscolor);

                            } else if (opts.messagebox) {

                                Application.Message(msg, function () {
                                    if (opts.messagecallback != "")
                                        eval(opts.messagecallback);
                                }, opts.messagetitle);

                            } else {

                                var user = queue[i][3];
                                user = user.replace('\\', '');

                                var dte = new Date();

                                var img = "";
                                if (!Application.UnsupportedIE() && user != "")
                                    img = '<div class="square-img-small" style="background-image: url(' + Application.App.ProfileImageURL(user) + ');"></div>';

                                if (Application.IsInMobile()) {

                                    msg = '<table><tr><td width="30px">' + img + '</td><td style="padding-left: 5px; text-align: left;">' + msg + '</td></table>';

                                    var delay = 3000;
                                    if (!opts.autoHide)
                                        delay = 99999999;

                                    if (opts.style == "info")
                                        opts.style = "";

                                    $.notifyBar({
                                        html: msg,
                                        delay: delay,
                                        cssClass: opts.style,
                                        animationSpeed: "normal",
                                        position: "bottom"
                                    });

                                } else {

                                    msg = '<table><tr><td>' + img + '</td><td style="padding-left: 5px;">' + msg +
                                '<br/><br/><span style="color: Gray;">' + UI.IconImage("calendar") + ' ' + Application.FormatDate(new Date(), '%LANG:FORMAT_TIME% %LANG:FORMAT_LONGDATE%') + '</span>' +
                                '</td></table>';

                                    $.notify(msg, {
                                        globalPosition: 'bottom right',
                                        autoHide: opts.autoHide,
                                        className: opts.style
                                    });
                                }

                        }

                    } catch (e) {
                    }
                }
                
            }
        };

        //#endregion

    });
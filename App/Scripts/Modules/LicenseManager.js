///// <reference path="../Application.js" />

//DefineModule("LicenseManager",

//    {
//        singleInstance: true,
//        requiresVersion: '3.0',
//        depends: ['Logging', 'WindowManager'],
//        created: new Date(2013, 12, 11),
//        version: '1.0',
//        author: 'Paul Fisher',
//        copyright: 'Copyright 2015, Paul Fisher',

//        changelog: [
//            '11/12/13   PF  Created class.'
//        ]

//    },

//    function () {

//        //#region Members

//        var _self = this;

//        //#endregion

//        //#region Public Methods

//        this.OnLoad = function () {

//            //Assign Module
//            Application.LicenseManager = this;
//        };

//        this.ShowLicense = function () {

//            if (Application.IsInMobile()) {
//                $("#divSideMenu").panel("close");
//            }

//            Application.LogInfo("%LANG:S_OPENLICVIEWER%");

//            //Check if window is already open.
//            var winid = UI.WindowManager.GetWindowByUID("LICENSEINFO");
//            if (winid != -1) {
//                Application.LogInfo("%LANG:S_OPENPREVLICVIEWER%");
//                UI.WindowManager.Open(winid);
//                return;
//            }

//            $thread(function () {

//                var w = $wait();

//                $code(

//                    Application.GetUserLicense,

//                    function (lic) {

//                        //Create the window.
//                        var win = new Window();
//                        win.Create(UI.IconImage("document_certificate") + " %LANG:S_LICENSEINFO%", {
//                            closebutton: true,
//                            workspace: $("#AppWorkspace"),
//                            shortcutWorkspace: $("#AppWindows"),
//                            position: Application.position.normal
//                        });
//                        win.UID("LICENSEINFO");
//                        win.HideActions();

//                        var txt = $('<textarea id="txtLicense" rows="20" style="width: 90%; overflow: hidden; border-style: none; margin: 10px; font-size: 12px;" readonly="readonly"></textarea>');
//                        win.AddControl(txt);

//                        var str = "";
//                        str += "\n%LANG:S_SOFTWARELICINFO%\n";
//                        str += "%COPYRIGHT%\n";
//                        str += "------------------------------------------------\n\n";
//                        str += "%LANG:S_LICENSEDTO%\t: " + lic.ClientName + "\n";
//                        if (lic.Address1 != "") str += "\t\t" + lic.Address1 + "\n";
//                        if (lic.Address2 != "") str += "\t\t" + lic.Address2 + "\n";
//                        if (lic.Address3 != "") str += "\t\t" + lic.Address3 + "\n";
//                        if (lic.Address4 != "") str += "\t\t" + lic.Address4 + "\n";
//                        if (lic.Address5 != "") str += "\t\t" + lic.Address5 + "\n";
//                        if (lic.Address6 != "") str += "\t\t" + lic.Address6 + "\n";
//                        if (lic.Address7 != "") str += "\t\t" + lic.Address7 + "\n";
//                        if (lic.Address8 != "") str += "\t\t" + lic.Address8 + "\n";
//                        str += "%LANG:S_LICPRODUCT%\t\t: " + lic.Program + "\n";
//                        str += "%LANG:S_LICPRODVERSION%\t: " + lic.ProgramVersion + "\n";
//                        str += "Partner\t\t: " + lic.Developer + "\n";
//                        str += "%LANG:S_LICENSEDATE%\t: " + lic.LicenseDate + "\n\n";

//                        txt.val(str);

//                        win.AddControl("<p style='padding: 10px;'><a style='cursor: pointer' onclick='Application.App.LoadPage(\"License List\");'>Load a different license</a></p>");

//                        //Add expired parts.
//                        AddLicenseParts(win, lic, false);

//                        //Add non-expired parts.
//                        AddLicenseParts(win, lic, true);

//                        //Add the window to the manager and open it.
//                        UI.WindowManager.Add(win);
//                        UI.WindowManager.Open(win.ID());
//                    }
//                );

//                return w.promise();
//            });
//        };

//        //#endregion

//        //#region Private Methods

//        AddLicenseParts = function (win, lic, expire) {

//            var first = true;
//            for (var i = 0; i < lic.AvailableParts.AvailableParts.length; i++) {

//                var dtearr = lic.AvailableParts.AvailableParts[i].Expires.split("/");
//                var dte = null;
//                try {
//                    if (dtearr.length == 3) {
//                        dte = new Date();
//                        dte.setDate(parseInt(dtearr[0]));
//                        dte.setMonth(parseInt(dtearr[1]) - 1);
//                        dte.setYear(parseInt(dtearr[2]));
//                        dte.setHours(0, 0, 0, 0);
//                    }
//                } catch (e) {
//                    dte = null;
//                }

//                var skip = false;
//                var today = new Date();
//                today.setHours(0, 0, 0, 0);

//                if (!expire && (dte && dte < today))
//                    skip = true;
//                if (expire && (!dte || dte >= today))
//                    skip = true;

//                if (!skip) {

//                    if (first) {
//                        if (!expire) {
//                            win.AddControl("<br/><br/>&nbsp;<b>%LANG:S_AVAILPARTS%:</b><br/><br/>");
//                        } else {
//                            win.AddControl("<br/><br/>&nbsp;<b>%LANG:S_EXPPARTS%:</b><br/><br/>");
//                        }
//                    }
//                    first = false;

//                    var info = ""
//                    var w = "60px"
//                    if (Application.IsInMobile()) {
//                        info = ' &nbsp;&nbsp;' + lic.AvailableParts.AvailableParts[i].Name + '<br/>&nbsp;&nbsp;(%LANG:S_EXPIRES%: ' + lic.AvailableParts.AvailableParts[i].Expires + ')';
//                        w = "90%";
//                    }

//                    var img = $('<div class="main-windowsbtn ui-widget ui-state-default" style="padding: 4px; margin: 3px; width: ' + w + '; text-align: center;"><table><tr><td><img src="data:image/png;base64,' + lic.AvailableParts.AvailableParts[i].ImageBase64 + '" /></td><td style="text-align: left;">' + info + '</td></tr></table></div>');
//                    win.AddControl(img);

//                    if (!Application.IsInMobile()) {
//                        img.qtip({
//                            position: {
//                                at: 'bottom right'
//                            },
//                            content: '<b>' + lic.AvailableParts.AvailableParts[i].Name + '</b>' +
//                                    '<br/>%LANG:S_EXPIRES%: <b>' + lic.AvailableParts.AvailableParts[i].Expires +
//                                    '</b><br/>Table Amount: <b>' + lic.AvailableParts.AvailableParts[i].Amount +
//                                    '</b><br/>Page Amount: <b>' + lic.AvailableParts.AvailableParts[i].PageAmount,
//                            style: {
//                                tip: {
//                                    corner: false
//                                }
//                            }
//                        });
//                    } else {
//                        img.buttonMarkup();
//                    }
//                }
//            }
//        };

//        //#endregion

//    });
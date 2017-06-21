/// <reference path="../Application.js" />

DefineModule("UpdateManager",

    {
        singleInstance: true,
        requiresVersion: '3.0',
        depends: ['Logging'],
        created: new Date(2013, 12, 11),
        version: '1.0',
        author: 'Paul Fisher',
        copyright: 'Copyright 2015, Paul Fisher',

        changelog: [
            '11/12/13   PF  Created class.'
        ]

    },

    function () {

        //#region Members

        var _self = this;

        //#endregion

        //#region Public Methods

        this.OnLoad = function () {

            //Assign Module
            Application.UpdateManager = this;
        };

        this.CheckForUpdates = function (skipVersion_) {

            Application.LogInfo("%LANG:S_CHECKINGFORUPDATES%");

            var w = $wait();

            $code(

                function () {
                    if(!skipVersion_)
                        return Application.CheckUpdates();
                    return Application.CheckUpdatesSkipVersion();
                },

                function (ret) {

                    //No updates available!
                    if (ret == "") {
                        Application.LogInfo("%LANG:S_NONEWUPDATES%");
                        return "%LANG:S_NONEWUPDATES%";
                    }

                    Application.LogInfo(ret);

                    //Ask the user if they wish to update.
                    Application.Confirm(ret, function (r) {
                        if (r) {
                            Application.Loading.Show("tdMain");
                            //Get the updates.
                            Application.RunNext(_self.GetUpdates);
                        }
                    }, (skipVersion_ ? "Update Platform" : "New Framework Version"));

                }
            );

            return w.promise();
        };

        this.GetUpdates = function () {

            var w = $wait();

            $code(

                Application.GetUpdates,

                function (ret) {

                    Application.Loading.Hide("divLogin");
                    //if (!Application.IsInMobile())
                    //    Application.Loading.Hide("tdMain");

                    Application.App.Disconnect();

                    //Return any messages.
                    if (ret && ret != "")
                        Application.Message(ret);
                }

            );

            return w.promise();
        };

        //#endregion

    });
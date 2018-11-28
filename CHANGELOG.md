<a name="5.11"></a>
# Liveapp v5.11 (November 2018)

## Bug Fixes

  - **app**
    - fix styling of login button in mobile mode (v5.x)

  - **application**
    - don't send timezone with dates if the year is 1900

  - **checkbox**
    - fix scrolling issue in mobile

  - **grid**
    - number columns with a custom control not aligned correctly
    - use lookup display value in row template fields (v5.x)

  - **multicombo**
    - fix style in desktop mode

  - **notesbox**
    - displays `<br>` instead of new lines in desktop card mode

  - **pageviewer**
    - grid error when closing page
    - remember sub page filters on refresh

  - **server**
    - add more info to the `Extension not found` error

  - **signature**
    - clicking in signature field stops the last field from validating

## Features

  - **app**
    - show a `Mandatory` label for mandatory fields in mobile mode

  - **application**
    - allow a `string` filter view in the `OPENPAGE` function for the second param

  - **pageviewer**
    - allow the current focus control to be retreived
    - spread out action button width in mobile mode if the are less than 4 buttons (v5.x)

  - **server**
    - add `checknull` column option to flowfield columns


<a name="5.10"></a>
# Liveapp v5.10 (October 2018)

## Bug Fixes

  - **app**
    - remove `pageid` param after use

  - **application**
    - time zone is not sent to the server for datetime/time fields

  - **flatskin**
    - search box text is too dark (v5.x)

  - **multiselect**
    - multiselect not hiding/disabling in mobile mode

  - **pageviewer**
    - run `Application.ProcessCaption` on option field captions
    - allow `hidesave` option to work on dialogs in mobile mode (v5.x)

  - **server**
    - allow bigtext fields to contain unicode characters (like emojis)

  - **signature**
    - clear signature fix

  - **timepicker**
    - 24hour mode not working in mobile mode

  - **window**
    - mobile window not scrolling correctly for custom windows

## Features

  - **grid**
    - add new option `notap` for mobile grid
    - run double click function on tap in mobile mode if line actions = 1 (v5.x)

  - **server**
    - new filter merge field `%NOW` - merges the current time (in 12 hour format) ie: `09:57 AM`
    - new filter merge field `%RIGHTNOW` - merges the current date and time (in 12 hour format) ie: `01/11/2018 09:57 AM`

  - **window**
    - add new page option `cancelopenonclose` - cancels opening the parent window on close of the current dialog page


<a name="5.9"></a>
# Liveapp v5.9 (September 2018)

## Bug Fixes

  - **pageviewer**
    - don't rollback temp or unsaved records on error
    - only save on close of dialog if the record is temporary

  - **server**
    - security fix: host header injection
    - security fix: referrer-policy header
    - import data function does not convert blank cells to `null` values

  - **windowmanager**
    - save grid data before closing all windows

## Features

  - **multidatepicker**
    - use a normal datepicker in mobile mode

  - **server**
    - allow encrypted connection strings


<a name="5.8"></a>
# Liveapp v5.8 (August 2018)

## Bug Fixes

  - **app**
    - `returnurl` not working on disconnect
    - change thread id for `LoadPage` to be the same as the `UID` in `PageViewer`

  - **boxy**
    - stop boxy from setting the `top` attribute to < 0

  - **control**
    - tabbing on dialog pages

  - **filelookup**
    - incorrect label when using `Application.FileDownload.ShowUploadDialog`

  - **grid**
    - stop mobile grid on click function from bubbling
    - missing group rows in mobile grid
    - only remove commas from the cell value if a field mask is used

  - **multicombo**
    - `Enabled` function is defined twice

  - **pageviewer**
    - mobile grid editor does not allow bigtext fields to use a custom control

  - **search**
    - global search not visible when using a light header color (v5.x)

## Features

  - **app**
    - add an id to menu items so they can be used in jquery (eg: `mnuitemLicense` for the `License` menu item) (v5.x)
    - reset the URL after loading an external page (this allows the end user to refresh the browser without the page opening again)

  - **combobox**
    - add new field option `drillheight` which controls the drop down height in desktop

  - **grid**
    - add new field options `primary` and `secondary` for mobile grid (v5.x)
    - add multi-select check boxes to desktop grid (turn off with the `nomultiselect` page option) (v5.x)

  - **icons**
    - update to material design icons v2.4.85 (v5.x)

  - **multicombo**
    - add new field option `hideselectall`

  - **pageviewer**
    - skip update messages if record is `temp`

  - **server**
    - skip virtual objects on update of solution if they don't require an update    

  - **system**
    - update icons and add mobile row templates (v5.x)

  - **texbox**
    - change textbox type to `number` if the field type is `Integer` or `Decimal`


<a name="5.7"></a>
# Liveapp v5.7 (July 2018)

## Bug Fixes

  - **app**
    - option fields using a custom control validate incorrectly
    - frame mode layout fixes
    - disable pull down to refresh in chrome

  - **checkbox**
    - mobile checkbox is double validating

  - **pageviewer**
    - stop double validate of fields
    - stop auto select of field after validate

  - **server**
    - increase auto disconnect to 20 mins

  - **serviceworker**
    - don't cache bad responses

  - **textbox**
    - `password` option not working on an `OptionsWindow`

  - **timepicker**
    - when using `24hours` option, the value validates incorrectly

  - **window**
    - cannot click a page action while validating a field value

## Features

  - **pageviewer**
    - when using option `loadColumnsOnly`, automatically add primary keys
    - change tablet mode to single column

  - **style**
    - add line action styles to desktop

  - **ui**
    - if `Application.Message` contains a question mark change icon to `question`

  - **window**
    - add new option `showtitles` to show tab titles for sub windows on the home screen


<a name="5.6.1"></a>
# Liveapp v5.6.1 (July 2018)

## Bug Fixes

  - **application**
    - reflected cross site scripting (OTG-INPVAL­001)
    - openpage error when using filter operators ([#88](https://github.com/ZoomApps/Liveapp/issues/88))

  - **pageviewer**
    - page error saves invalid page filters ([#89](https://github.com/ZoomApps/Liveapp/issues/89))

  - **server**
    - weak encryption (OTG­-CRYPST­-004)
    - browser cache weakness (OTG-AUTHN­006)

## Features

  - **app**
    - new filter keyword FILTERFIELD ([#87](https://github.com/ZoomApps/Liveapp/issues/87))


<a name="5.6"></a>
# Liveapp v5.6 (May/June 2018)

## Bug Fixes

  - **application**
    - strsubstitute infinite loop when merging strings containing `$` and a number
    - z-index and style fixes
    - fix cache issues on ios (v5.x)
    - fix integer/decimal values containing a comma
    - layout fixes for `frame` version of app

  - **article**
    - incorrect width when sending articles via email

  - **combobox**
    - open `edit` page in a dialog if the parent page is a dialog

  - **grid**
    - allow grouping to work with row templates in mobile (v5.x)

  - **pageviewer**
    - controls using the option `ignorecolumns` are passed the wrong width
    - don't reload `card` page data source on validate if mandatory fields are missing
    - don't use `null` PK values when updating the page filters
    - allow overlay on subpages in `frame` mode

  - **photogallery**
    - gallery stops working after update

  - **server**
    - caching not working on 'default' instance (v5.x) ([#78](https://github.com/ZoomApps/Liveapp/issues/78))

  - **system**
    - ampersand character causes a filtering issue ([#80](https://github.com/ZoomApps/Liveapp/issues/80))
    - fixed errors in data import objects (v5.x)

  - **ui**
    - icon images have incorrect html tags (v5.x)

  - **window**
    - `more` action in wrong spot in mobile (v5.x)

  - **windowmanager**
    - error on `closeall`

## Features

  - **application**
    - use a single service worker and auto cache resources (v5.x)

  - **checkbox**
    - style mobile checkbox using material design (v5.x)

  - **combobox**
    - style mobile combo like material design (v5.x)

  - **grid**
    - delay the `onbind` function

  - **multicombobox**
    - allow field to be disabled

  - **optionswindow**
    - add new column option `hidefilter` - hides that table column from the `OptionsWindow` field filter list

  - **pageviewer**
    - allow `card` pages to reload the data source if the page option `refresh` is used

  - **server**
    - don't cache the service worker file (v5.x)
    - skip ping check on dev server
    - add new function WebsiteImage to server endpoint
    - kill sessions that stop pinging the server after 2 mins

  - **timepicker**
    - add options `mininterval` and `24hours`

  - **websitemanager**
    - add header/footer config

## Documentation

  - **optionswindow**
    - document the optionswindow class


<a name="5.5"></a>
# Liveapp v5.5 (April 2018)

## Bug Fixes

  - **app**
    - menu items not using `Application.ProcessCaption` ([#76](https://github.com/ZoomApps/Liveapp/issues/76))

  - **system**
    - xpress user layout performance ([#82](https://github.com/ZoomApps/Liveapp/issues/82))

## Features

  - **control**
    - add `number:` field mask to card controls ([#81](https://github.com/ZoomApps/Liveapp/issues/81))

  - **system**
    - tracking of device login ([#77](https://github.com/ZoomApps/Liveapp/issues/77))a

## Documentation
  - add options documentation ([#84](https://github.com/ZoomApps/Liveapp/issues/84))

  
<a name="5.4"></a>
# Liveapp v5.4 (March 2018)

## Bug Fixes

  - **application**
    - only convert iso date strings with  Application.ConvertDate

  - **chart**
    - excess white space ([#38](https://github.com/ZoomApps/Liveapp/issues/38))

  - **datalayer**
    - issue when doing a MODIFYALL or DELETEALL when Record Security

  - **grid**
    - SetSort function not working on multisort grid
    - mandatory date fields NaN fix ([#56](https://github.com/ZoomApps/Liveapp/issues/56))

  - **multicombo**
    - data not refreshing if source is an Option string

  - **record**
    - delete record not working if a PK field is before an Image,BLOB or Big BLOB field in the table columns list

  - **webservice**
    - published solutions are not transferring record security

  - **window**
    - dialog window in tablet mode does not fill the screen ([#62](https://github.com/ZoomApps/Liveapp/issues/62))
    - fix placeholder on mobile window duplicating

## Features

  - **colorpicker**
    - add mobile version of color picker

  - **grid**
    - new page option "nomultiselect". If added to a list page, it will disable row multiselect ([#34](https://github.com/ZoomApps/Liveapp/issues/34))

  - **report**
    - grand totals - report grouping ([#70](https://github.com/ZoomApps/Liveapp/issues/70))

  - **webservice**
    - dashboard custom caption ([#75](https://github.com/ZoomApps/Liveapp/issues/75))

  - **window**
    - display a progress loader in mobile mode (similar to desktop) ([#52](https://github.com/ZoomApps/Liveapp/issues/52))

## Documentation  

  - **application**
    - update version number and formatting

  - **codeengine**
    - document the CodeEngine module ([#73](https://github.com/ZoomApps/Liveapp/issues/73))

  - **record**
    - document the Record class ([#73](https://github.com/ZoomApps/Liveapp/issues/73))

## Refactor

  - **codeengine**
    - set Locked function as deprecated since v5.4.0
    - set IsNested function as deprecated since v5.4.0

## Test

  - **codeengine**
    - add CodeEngine test cases ([#73](https://github.com/ZoomApps/Liveapp/issues/73))

  - **record**
    - add Record test cases ([#73](https://github.com/ZoomApps/Liveapp/issues/73))


<a name="5.3"></a>
# Liveapp v5.3 (February 2018)

## Bug Fixes

  - **chart**
    - chart drilldown not working ([#58](https://github.com/LiveappSolutions/Liveapp/issues/58))

  - **combobox**
    - keyboard not showing when trying to search ([#64](https://github.com/LiveappSolutions/Liveapp/issues/64))

  - **control**
    - keyboard covering fields ([#50](https://github.com/LiveappSolutions/Liveapp/issues/50))

  - **grid**
    - datetime field in mobile - no formatting ([#65](https://github.com/LiveappSolutions/Liveapp/issues/65))

  - **optionswindow**
    - error on open of options window ([#71](https://github.com/LiveappSolutions/Liveapp/issues/71))

  - **pageviewer**
    - non-editable fields missing from grid editor ([#55](https://github.com/LiveappSolutions/Liveapp/issues/55))

  - **report**
    - icons not showing on printed report ([#51](https://github.com/LiveappSolutions/Liveapp/issues/51))

  - **sweetalert**
    - success icon not working in mobile mode

  - **timepicker**
    - multiple timepicker issue ([#43](https://github.com/LiveappSolutions/Liveapp/issues/43))

  - **webservice**
    - changelog not recording fields changing to 'null' ([#72](https://github.com/LiveappSolutions/Liveapp/issues/72))
    - error when using an OR filter with a flowfield column
    - foreign key rename not working when data has brackets

## Features

  - **grid**
    - allow multiple columns to be sorted

  - **queryhandler**
    - allow endpoint to be executed with GET http method

  - **system**
    - "sorting" on table keys ([#69](https://github.com/LiveappSolutions/Liveapp/issues/69))

  - **webservice**
    - add ampersand escape sequence for filtering
    - new overrideable function - AfterGetServerInfo ([#57](https://github.com/LiveappSolutions/Liveapp/issues/57))

## Documentation

  - **application**
    - add application module documentation

  - **appobject**
    - add appobject class documentation

  - **global**
    - add global functions documentation

## Refactor

  - **application**
    - set Application.AuthCode function as deprecated since v5.0.0
    - set Application.ClearRecordCache function as deprecated since v5.0.0
    - set Application.ExecutePlugin function as deprecated since v5.0.0
    - set Application.FriendifyDates function as deprecated since v5.0.0
    - set Application.GenerateWebService function as deprecated since v5.0.0
    - set Application.MiniMode function as deprecated since v5.0.0
    - set Application.OffsetDate function as deprecated since v5.0.0
    - set Application.SyncSecurity function as deprecated since v5.0.0
    - set Application.UpdateProfileImage function as deprecated since v5.0.0

  - **global**
    - set memoize function as deprecated since v5.0.0

## Test

  - **application**
    - fixed some bugs in application test cases
    - add application test cases

  - **global**
    - add global test cases


<a name="5.2.0"></a>
# Liveapp v5.2 (Dec 2017/Jan 2018)


## Bug Fixes

- **addtohomescreen:** skip run in standalone mode (v5.2 ONLY)
- **combobox:**
  - show/hide lookup advance page depending on security
  - lookup option column showing value instead of caption
  - option value not working for blank caption
- **filtertoolbar:** field name clearing ([#44](https://github.com/LiveappSolutions/Liveapp/issues/44))
- **grid:**
  - error when refreshing grid row
  - OnBindRow not called after sorting the Grid
- **imagelookup:** image lookup not obeying editable flag
- **multicombo:**
  - multi combo does not obey hidden flag ([#35](https://github.com/LiveappSolutions/Liveapp/issues/35))
  - multi combo not obeying the editable flag
  - multicombo closes parent page ([#61](https://github.com/LiveappSolutions/Liveapp/issues/61))
- **pageviewer:**
  - apply "height" option to page tabs
  - date filter error onsave ([#37](https://github.com/LiveappSolutions/Liveapp/issues/37))
  - height fix for mobile dialogs
  - set integer/decimal to NULL if entered as zero
  - check for lookup display when determining a page refresh
- **serviceworker:** caching issue fix (v5.2 ONLY) ([#47](https://github.com/LiveappSolutions/Liveapp/issues/47))
- **skin:**
  - flat skin style fixes (v5.2 ONLY)
  - mobile calendar control missing icons (v5.2 ONLY) ([#46](https://github.com/LiveappSolutions/Liveapp/issues/46))
- **system:**
  - add nolock to change log table
  - don't sanitize query table view column
- **window:** incorrect action bar position in mobile (v5.2 ONLY) ([#54](https://github.com/LiveappSolutions/Liveapp/issues/54))

## New Features

- **combobox:**
  - display field caption in option combobox instead of "Value"
  - new field option "addnewpage"
- **filelookup:** changed the look of the slim version of the control
- **grid:** 
  - apply field mask to grid column
  - mobile grid "ellipsis" field option (v5.2 ONLY) ([#48](https://github.com/LiveappSolutions/Liveapp/issues/48))
  - mobile grid RowTemplateStyle function is now passed the record as an argument (v5.2 ONLY)
- **interactivemap:** added new option "viewbox" which sets the svg viewBox attribute. eg. viewbox:150,460 - This will set a view box of 150px wide by 460px high.
- **misc:** specify DISTINCT in FINDSET
- **pageviewer:**
  - new page option "dialog" will force the page to open in dialog mode
  - allow page to stay open after clicking the save tick in mobile ([#49](https://github.com/LiveappSolutions/Liveapp/issues/49))
- **system:**
  - email log performance ([#53](https://github.com/LiveappSolutions/Liveapp/issues/53))
  - force filters on email log
- **timepicker:** shade am/pm buttons
- **window:** show status of saving the record in the title bar

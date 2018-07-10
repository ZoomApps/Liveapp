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

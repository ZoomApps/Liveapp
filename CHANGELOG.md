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

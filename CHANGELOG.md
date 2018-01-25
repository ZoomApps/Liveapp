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

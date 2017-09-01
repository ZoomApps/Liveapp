/*
 * jQuery UI Multicolumn Autocomplete Widget Plugin 2.2
 * Copyright (c) 2012-2015 Mark Harmon
 *
 * Depends:
 *   - jQuery UI Autocomplete widget
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
*/
$.widget('custom.mcautocomplete', $.ui.autocomplete, {
    _create: function() {
      this._super();
      this.widget().menu( "option", "items", "> :not(.ui-widget-header)" );
    },
    _renderMenu: function (ul, items) {
        var self = this, thead;

        ul.css("z-index", 30001);

        if (this.options.menu)
            ul.css("overflow", "hidden").css("height", "auto");

        if (this.options.showHeader && !this.options.menu) {
            table = $('<div class="ui-widget-header" style="width:100%; padding-top: 0.3em; padding-bottom: 0.3em;"></div>');

            $.each(this.options.columns, function (index, item) {
                table.append('<span style="padding:0 4px;float:left;width:' + item.width + ';">' + item.name + '</span>');
            });

            this.options.drilldown = Default(this.options.drilldown, "");
            if (this.options.drilldown != "" || this.options.allowdelete) {
                if (this.options.drilldown == "") {
                    table.append('<span style="padding:0 4px;float:left;width:15px;max-width:15px;"></span>');
                } else {
                    var dd = $('<span class="ui-state-default" style="padding:0 4px;float:left;width:15px;background-color:transparent;border:0px;"><small>edit</small></span>');
                    dd.on('click', function () {
                        Application.App.LoadPage(self.options.drilldown, self.options.drilldownview); //#44 - Apply lookup view
                    })
					.mouseover(function () {
					    $(this).removeClass("ui-state-default");
					})
					.mouseout(function () {
					    $(this).addClass("ui-state-default");
					});

                    table.append(dd);
                }
            }

            table.append('<div style="clear: both;"></div>');
            ul.append(table);
        }
        var currentCategory = "";
        $.each(items, function (index, item) {
            if (item.BoldField && item.BoldField != "") {
                if (item.BoldField != currentCategory) {
                    ul.append("<li class='ui-autocomplete-category'>" + item.BoldField + "</li>");
                    currentCategory = item.BoldField;
                }
            }
            self._renderItem(ul, item);
        });
    },
    _renderItem: function (ul, item) {
        var t = '',
            result = '';

        $.each(this.options.columns, function (index, column) {
            t += '<span style="padding:0 4px;float:left;height:15px;overflow:hidden;width:' + column.width + ';max-width:' + column.width + ';">' + item[column.valueField ? column.valueField : index] + '</span>'
        });
        if (this.options.drilldown != "" || this.options.allowdelete) {
            if (this.options.allowdelete) {
                if (item.BlankRow == false)
                    t += '<span id="del' + item.UID + '" style="padding:0 4px;float:left;height:15px;overflow:hidden;width:15px;max-width:15px;color:gainsboro;">x</span>';
            } else {
                t += '<span style="padding:0 4px;float:left;height:15px;overflow:hidden;width:15px;max-width:15px;"></span>'
            }
        }

        result = $('<li></li>')
			.data('ui-autocomplete-item', item)
            .append('<a class="mcacAnchor">' + t + '<div style="clear: both;"></div></a>')
            .appendTo(ul);

        $("#del" + item.UID).click(function (e) {
            e.stopPropagation();
            Application.Confirm("Are you sure you wish to delete this record?<br/><br/>" + item.RID, function (r) {
                if (r)
                    Application.RunNext(function () {
                        BEGINTRANSACTION(function () {
                            GET(item.RID, function (rec) {
                                if (rec.Count > 0)
                                    DELETE(rec, function () {
                                        COMMITTRANSACTION();
                                    });
                            });
                        });
                    });
            });
        })
        .mouseover(function () {
            $(this).css("color", "red")
        })
        .mouseout(function () {
            $(this).css("color", "gainsboro")
        });

        return result;
    }
});
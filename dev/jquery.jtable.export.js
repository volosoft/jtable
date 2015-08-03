/**
 * Jtable export excel
 */
(function ($) {
    //Reference to base object members
    var base = {
        _create: $.hik.jtable.prototype._create
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {
        options:{
            exportExcel: true, // active or desactive export excel
            messages:{
                exportExcel: 'Export to Excel'
            }
        },

        /************************************************************************
         * OVERRIDED METHODS                                                     *
         *************************************************************************/

        _exportToolbar: function(){
            var self = this;

            var exportToolbar = {
                icon: '../jtable/lib/content/icone-excel20.gif',
                text: this.options.messages.exportExcel,
                click: function () {
                    var tableClone = self._$table.clone();
                    console.log(tableClone[0].outerHTML);
                    if(self.options.toolbarsearch.enable){// remove input thead
                        tableClone.find('thead tr').next().remove();
                    }

                    if(self.options.actions.updateAction){
                        tableClone.find('tbody tr').each(function(){
                            $(this).find('td').last().remove();
                        })
                    }

                    if(self.options.actions.deleteAction){
                        tableClone.find('tbody tr').each(function(){
                            $(this).find('td').last().remove();
                        })
                    }

                    tableClone.find('tbody tr').each(function(){
                        $(this).find('td img').remove();
                    })


                    window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tableClone[0].outerHTML));
                }
            };

            this._addToolBarItem(exportToolbar);
        },
        _create: function () {
            base._create.apply(this, arguments);

            if(this.options.exportExcel){
                this._exportToolbar();
            }
        }

    });

    var tableToExcel = (function() {
        var uri = 'data:application/vnd.ms-excel;base64,'
            , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>{$table.innerHtml}</body></html>'
            , base64 = function(s) {
                return window.btoa(unescape(encodeURIComponent(s)))
            }
            , format = function(s, c) {
                return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; })
            }

        return function(table, name) {
            //if (!table.nodeType) table = document.getElementById(table)
            var ctx = {worksheet: name || 'Worksheet', table: table.innerHTML}
            window.location.href = uri + base64(format(template, ctx))
        }
    })()

})(jQuery);
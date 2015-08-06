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
            exportPrint: true, // active or desactive export print
            messages:{
                exportExcel: 'Export to Excel',
                print:'Print'
            }
        },

        /************************************************************************
         * OVERRIDED METHODS                                                     *
         *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);

            if(this.options.exportExcel){
                this._exportExcel();
            }

            if(this.options.exportPrint){
                this._exportPrint();
            }
        },

        _exportExcel: function(){
            var self = this;

            var exportToolbar = {
                icon: '../jtable/lib/content/icone-excel20.gif',
                text: this.options.messages.exportExcel,
                click: function () {
                    var tableClone = self._$table.clone();

                    tableClone.find('tbody tr.jtable-child-row').each(function(){//remove child opened
                        $(this).remove();
                    });


                    if(self.options.toolbarsearch.enable){//Remove input thead toolbar search
                        tableClone.find('thead tr').next().remove();
                    }

                    if(self.options.actions.deleteAction){ //Remove col delete
                        tableClone.find('tbody tr').each(function(){
                            $(this).find('td').last().remove();
                        })
                    }

                    if(self.options.actions.updateAction){
                        tableClone.find('tbody tr').each(function(){
                            $(this).find('td').last().remove();
                        })
                    }

                    tableClone.find('tbody tr').each(function(){//Remove img which you doesn't display (as child's exemple)
                        $(this).find('td img').remove();
                    });

                    window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tableClone[0].outerHTML));
                }
            };
            this._addToolBarItem(exportToolbar);
        },

        _exportPrint:function(){
            var self = this;

            var exportPdf = {
                icon: '../jtable/lib/content/icone-imprimante.gif',
                text: this.options.messages.print,
                click: function () {
                    
                    var divToPrint = self._$table[0].cloneNode(true);

                    $(divToPrint).find('tbody tr.jtable-child-row').each(function(){//remove child opened
                        $(this).remove();
                    });

                    if(self.options.toolbarsearch.enable){//Remove input thead toolbar search
                        $(divToPrint).find('thead tr').next().remove();
                    }

                    if(self.options.actions.updateAction){
                        $(divToPrint).find('tbody tr').each(function(){
                            $(this).find('td').last().remove();
                        })
                        $(divToPrint).find('thead tr').each(function(){
                            $(this).find('td').last().remove();
                        })
                    }

                    if(self.options.actions.deleteAction){ //Remove col delete
                        $(divToPrint).find('tbody tr').each(function(){
                            $(this).find('td').last().remove();
                        })
                        $(divToPrint).find('thead tr').each(function(){
                            $(this).find('td').last().remove();
                        })
                    }

                    var newWin = window.open("");

                    $(divToPrint).css({'border':'1px solid black','border-collapse':'collapse'});
                    $(divToPrint).find('thead tr').css({'background-color':'blue','color':'white'});
                    $(divToPrint).find('tr').css({'border':'1px solid black'});
                    $(divToPrint).find('td').css({'border':'1px solid black','vertical-align': 'middle','padding': '5px'});

                    newWin.document.write(divToPrint.outerHTML);
                    newWin.print();
                    newWin.close();

                    $(divToPrint).remove();
                }
            };
            this._addToolBarItem(exportPdf);
        }
    });


})(jQuery);
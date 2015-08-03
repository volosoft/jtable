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
            exportExcel: false, // active or desactive export excel
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
                    var loadUrl = self._createRecordLoadUrl();
                    self._ajax({
                        url: loadUrl,
                        data: self._lastPostData,
                        success: function (data) {
                            console.log(self._$tableBody[0].innerHTML);
                            /*$.each(self._$tableBody[0],function(index,value){
                               console.log(index+': '+value);
                            });*/
                            //window.location.href="../fonction/excel.liste.php?json="+JSON.stringify(data.Records);
                        },
                        error: function () {
                            //self._hideBusy();
                            //self._showError(self.options.messages.serverCommunicationError);
                        }
                    });
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

})(jQuery);
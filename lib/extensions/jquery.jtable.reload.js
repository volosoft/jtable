/************************************************************************
* DATA RELOAD extension for jTable                                      
* Author: Guillermo Bisheimer                                           
* Rev. 1.0
*************************************************************************/
/* TODO
 * Reloads data shown on table without closing child table for a row
 */

(function($) {

    //Reference to base object members
    var base = {
        _create: $.hik.jtable.prototype._create
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
         * DEFAULT OPTIONS / EVENTS                                              *
         *************************************************************************/
        options: {
            showReloadButton: false,
            autoReload: false,
            reloadPeriod: 0,
            messages: {
                reload: {
                    toolbarButton: 'Reload'
                }
            }
        },

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides base method to create reload button.
         *************************************************************************/
        _create: function() {
            base._create.apply(this, arguments);
            if( this.options.showReloadButton ){
                this._createTableReloadButton();
            }
			
            if( this.options.autoReload == true ){
                this._autoReloadTable( true );
            }			
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/        

        /* Creates reload button on table title DIV
         *************************************************************************/
        _createTableReloadButton: function () {
            var self = this;
            
            self._addToolBarItem({
                icon: 'js/jtable/extensions/css/reload.png',
                tooltip: self.options.messages.reload.toolbarButton,
                cssClass: 'jtable-toolbar-item-reload',
                text: self.options.messages.reload.toolbarButton,
                click: function (e) {
                    self.reload();
                }
            });
        },
		
        /* Autoreload jTable
         *************************************************************************/
        _autoReloadTable: function ( init ) {
            var self = this;
            
            if( self.options.reloadPeriod > 0 ){
                if( !init ){
                    self.reload();
                }
                setTimeout( function(){
                    self._autoReloadTable();
                }, self.options.reloadPeriod )
            }
        }
    });

})(jQuery);
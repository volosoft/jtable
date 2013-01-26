/************************************************************************
* DATA RELOAD extension for jTable                                      *
*************************************************************************/
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
            messages: {
                reload: 'Reload table data'
            }
        },

        /************************************************************************
     * PRIVATE FIELDS                                                        *
     *************************************************************************/

        _$tfilter: null, //Reference to the filter area in top panel

        /************************************************************************
     * CONSTRUCTOR AND INITIALIZING METHODS                                  *
     *************************************************************************/

        /* Overrides base method to create footer constructions.
     *************************************************************************/
        _create: function() {
            base._create.apply(this, arguments);
            if( this.options.showReloadButton ){
                this._createTableReloadButton();
            }
        },
        
        
        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/        
       
        /* Creates footer (all column footers) of the table.
     *************************************************************************/
        _createTableReloadButton: function () {
            var self = this;
            
            var $titleDiv = $('div.jtable-title', this._$mainContainer);
            var $textSpan = $('<span />')
            .html(self.options.messages.reload);

            $('<button></button>')
            .addClass('jtable-command-button jtable-reload-button')
            .attr('title', self.options.messages.reload)
            .append($textSpan)
            .appendTo($titleDiv)
            .click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                self.reload();
            });
        }

    /************************************************************************
     * OVERRIDED METHODS                                                     *
     *************************************************************************/

    });

})(jQuery);
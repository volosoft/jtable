/************************************************************************
* MULTIPLE COLUMN SORTING extension for jTable                          *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _initializeFields: $.hik.jtable.prototype._initializeFields,
        _makeColumnSortable: $.hik.jtable.prototype._makeColumnSortable,
        _sortTableByColumn: $.hik.jtable.prototype._sortTableByColumn,
        _addSortingInfoToUrl: $.hik.jtable.prototype._addSortingInfoToUrl
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
     * DEFAULT OPTIONS / EVENTS                                              *
     *************************************************************************/
        options: {
        },

        /************************************************************************
     * PRIVATE FIELDS                                                        *
     *************************************************************************/

        _aSorting: [], //Last sorting of the table

        /************************************************************************
     * OVERRIDED METHODS                                                     *
     *************************************************************************/

        /* Overrides base method to create sorting array.
     *************************************************************************/
        _initializeFields: function() {
            base._initializeFields.apply(this, arguments);

            this._aSorting = [];
            if( this.options.sorting ){
                this._buildDefaultSortingArray();
            }
        },

        /* Makes a column sortable.
     *************************************************************************/
        _makeColumnSortable: function ($columnHeader, fieldName) {
            var self = this;
            $columnHeader
            .addClass('jtable-column-header-sortable')
            .click(function(e) {
                e.preventDefault();
                if( !e.ctrlKey ) self._aSorting = [];
                self._sortTableByColumn($columnHeader);
            });
				
            //Default sorting?
            $.each(this._aSorting, function( sortIndex, sortField ){
                if( sortField.fieldName == fieldName ){
                    if (sortField.sortOrder == 'DESC') $columnHeader.addClass('jtable-column-header-sorted-desc');
                    else $columnHeader.addClass('jtable-column-header-sorted-asc');
                }
            });
        },

        /* Sorts table according to a column header.
     *************************************************************************/
        _sortTableByColumn: function ($columnHeader) {
            var self = this;
			
            //Remove sorting styles from all columns except this one
            if( this._aSorting.length == 0 ){
                $columnHeader.siblings().removeClass('jtable-column-header-sorted-asc jtable-column-header-sorted-desc');
            }

            for( var i=0; i<self._aSorting.length; i++ ){
                if( self._aSorting[i].fieldName == $columnHeader.data('fieldName') ){
                    self._aSorting.splice( i--, 1 );
                }
            }

            //Sort ASC or DESC according to current sorting state
            if ($columnHeader.hasClass('jtable-column-header-sorted-asc')) {
                $columnHeader.removeClass('jtable-column-header-sorted-asc').addClass('jtable-column-header-sorted-desc');
                this._aSorting.push({
                    'fieldName': $columnHeader.data('fieldName'), 
                    sortOrder: 'DESC'
                });
            } else {
                $columnHeader.removeClass('jtable-column-header-sorted-desc').addClass('jtable-column-header-sorted-asc');
                this._aSorting.push({
                    'fieldName': $columnHeader.data('fieldName'), 
                    sortOrder: 'ASC'
                });
            }

            //Load current page again
            this._reloadTable();
        },

        /* Adds jtSorting parameter to a URL as query string.
     *************************************************************************/
        _addSortingInfoToUrl: function (url) {
            if (!this.options.sorting || this._aSorting.length == 0) {
                return url;
            }

            var sorting = [];
            $.each( this._aSorting, function( idx, value ){
                sorting.push(value.fieldName + ' ' + value.sortOrder);
            });
			
            return (url + (url.indexOf('?') < 0 ? '?' : '&') + 'jtSorting=' + sorting.join(",") );
        },

        /************************************************************************
     * PRIVATE METHODS                                                       *
     *************************************************************************/
		
        /* Builds the sorting array according to defaultSorting string
     *************************************************************************/
        _buildDefaultSortingArray: function( ) {
            var self = this;
			
            $.each(self.options.defaultSorting.split(","), function( orderIndex, orderValue ){
                $.each(self.options.fields, function( field, props ){
                    var colOffset;
                    if( props.sorting ){
                        colOffset = orderValue.indexOf(field);
                        if (colOffset > -1) {
                            if (orderValue.indexOf('DESC', colOffset) > -1) {
                                self._aSorting.push({
                                    'fieldName': field, 
                                    sortOrder: 'DESC'
                                });
                            } else {
                                self._aSorting.push({
                                    'fieldName': field, 
                                    sortOrder: 'ASC'
                                });
                            }
                        }
                    }
                });
            });
        }

    });

})(jQuery);
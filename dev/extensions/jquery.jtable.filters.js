/************************************************************************
* DATA FILTERING extension for jTable                                  *
*************************************************************************/
(function($) {

    //Reference to base object members
    var base = {
        _create: $.hik.jtable.prototype._create,
        _addRowToTable: $.hik.jtable.prototype._addRowToTable,
        _onRecordsLoaded: $.hik.jtable.prototype._onRecordsLoaded
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
     * DEFAULT OPTIONS / EVENTS                                              *
     *************************************************************************/
        options: {
            showFilterButton: false,
            messages: {
                filter: 'Show/hide table filters'
            }
        },

        /************************************************************************
     * PRIVATE FIELDS                                                        *
     *************************************************************************/

        _$filterForm: null, //Reference to the filter area in top panel

        /************************************************************************
     * CONSTRUCTOR AND INITIALIZING METHODS                                  *
     *************************************************************************/

        /* Overrides base method to create footer constructions.
     *************************************************************************/
        _create: function() {
            base._create.apply(this, arguments);
            if( this.options.showFilterButton ){
                this._createTableFilter();
            }
        },
        
        /* Creates footer (all column footers) of the table.
     *************************************************************************/
        _createTableFilter: function () {
            var self = this;
            
            var $titleDiv = $('div.jtable-title', this._$mainContainer);
                
            self._$tfilter = $('<div class="jtable-filter"></div>')
            .insertAfter($titleDiv)
            .hide();
            $('<button class="jtable-command-button jtable-filter-button" title="' + self.options.messages.filter + '"><span>' + self.options.messages.filter + '</span></button>')
            .appendTo($titleDiv)
            .click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                self._$filterForm.slideToggle('fast');
            });
            this._addFieldsToTableFilter(this._$filterForm);
        },

        /* Adds tr element to given tfoot element
     *************************************************************************/
        _addFieldsToTableFilter: function ($filterForm) {
            var self = this;
            $.each( self.options.fields, function( fieldName, fieldOptions ){
                if( fieldOptions.filter ){
                    var $fieldContainer = $('<div class="jtable-input-field-container"></div>').appendTo($filterForm);

                    //Create a label for input
                    $fieldContainer.append(self._createInputLabelForRecordField(fieldName));
                    //Create input element with it's current value
                    $fieldContainer.append(self._createInputForRecordField({
                        fieldName: fieldName,
                        formType: 'filter',
                        form: $filterForm
                    }));
                }
            });
        }

    /************************************************************************
     * OVERRIDED METHODS                                                     *
     *************************************************************************/

    });

})(jQuery);
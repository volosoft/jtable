/************************************************************************
* DATA FILTERING extension for jTable                                  *
* Author: Guillermo Bisheimer                                           
* Rev. 1.0
*************************************************************************/
(function($) {

    //Reference to base object members
    var base = {
        _create: $.hik.jtable.prototype._create,
        _createDateInputForField: $.hik.jtable.prototype._createDateInputForField
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
         * DEFAULT OPTIONS / EVENTS                                              *
         *************************************************************************/
        options: {
            filter: false,
            messages: {
                filter:{
                    showFilters: 'Show/hide filters',
                    applyFilter: 'Apply filter',
                    clearFilter: 'Remove filter',
                    fromRange: 'From',
                    toRange: 'To'
                }
            }
        },

        /************************************************************************
         * PRIVATE FIELDS                                                        *
         *************************************************************************/
        _$filterDiv: null,  //Reference to the filter area in top panel
        _$filterForm: null, //Reference to the filter form in top panel area
        _$filterRow: null,  //Reference to the filter row below the columns names

        /************************************************************************
         * OVERRIDED METHODS                                                     *
         *************************************************************************/

        /* Overrides base method to create table filter toolbar button
         *************************************************************************/
        _create: function() {
            base._create.apply(this, arguments);
            if( this.options.filter ){
                this._createTableFilter();
            }
        },
        
        /* Removes ID from input field to solve datepicker issue with inputs with
         * fields with same ID
         *************************************************************************/
        _createDateInputForField: function (field, fieldName, value) {
            var $input = base._createDateInputForField( this, arguments );
            
            var displayFormat = field.displayFormat || this.options.defaultDateFormat;
            $input.find('input')
            .datepicker('delete')
            .removeAttr('id')
            .datepicker({
                dateFormat: displayFormat
            });
            
            return $input;
        },
    
        /************************************************************************
         * PRIVATE METHODS                                                       *
         *************************************************************************/        
    
        /* Creates the table filter header row and other sections
         *************************************************************************/
        _createTableFilter: function () {
            var self = this;
            var $titleDiv = $('div.jtable-title', this._$mainContainer);
            var $thead = this._$table.find('thead');
                        
            self._$filterDiv = $('<div class="jtable-filter-panel"></div>')
            .insertAfter($titleDiv)
            .hide();

            // Creates form for filter fields
            self._$filterForm = $('<form id="jtable-filter-form" class="jtable-filter-form" action="' + self.options.actions.listAction + '" method="POST"></form>')
            .appendTo( self._$filterDiv );
           
            self._addToolBarItem({
                icon: 'js/jtable/extensions/css/filter.png',
                tooltip: self.options.messages.filter.showFilters,
                cssClass: 'jtable-toolbar-item-filter',
                text: self.options.messages.filter.showFilters,
                click: function (e) {
                    self._$filterDiv.slideToggle('fast');
                    self._$filterRow.slideToggle('fast');
                }
            });

            $('<div>' + self.options.messages.filter.applyFilter + '</div>')
            .button()
            .appendTo(self._$filterDiv)
            .click( function(){
                self._applyTableFilter();
            });
            
            $('<div>' + self.options.messages.filter.clearFilter + '</div>')
            .button()
            .appendTo(self._$filterDiv)
            .click( function(){
                self._clearTableFilter();
            });

            // Adds filter fields to table header
            self._addFilterRowToTableHead($thead);
            // Adds not listed columns filter fields to filter Form
            self._addFilterFieldsToFilterForm( self._$filterForm );
        },

        /* Adds tr element to given thead element
        *************************************************************************/
        _addFilterRowToTableHead: function ($thead) {
            this._$filterRow = $('<tr></tr>')
            .appendTo($thead)
            .hide();

            this._addFilterColumnsToHeaderRow(this._$filterRow);
        },

        /* Adds column header cells to given tr element.
        *************************************************************************/
        _addFilterColumnsToHeaderRow: function ($tr) {
            var self = this;
            $.each( self._columnList, function() {
                var $headerCell = self._createHeaderCellForFilter(this, self.options.fields[this]);
                $headerCell.appendTo($tr);
            })
        },

        /* Creates a header cell for given field.
        *  Returns th jQuery object.
        *************************************************************************/
        _createHeaderCellForFilter: function (fieldName, field) {
            var $headerContainerDiv = $('<div />')
            .addClass('jtable-column-header-container');

            var $th = $('<th></th>')
            .addClass('jtable-column-filter-header')
            .append($headerContainerDiv);

            if( field.filter ){
                this._createFieldForFilter( fieldName, field )
                .appendTo($headerContainerDiv);
            }

            return $th;
        },
        
        /* Creates input field for column filter
         * **********************************************************************/
        _createFieldForFilter: function ( fieldName, fieldOptions ) {
            var self = this;
            var $fieldContainer = $('<div class="jtable-input-field-container"></div>');

            //Create a label for input if not listed in table
            if( fieldOptions.list == false ){
                $fieldContainer.append(self._createInputLabelForRecordField(fieldName));
            }
                    
            if (fieldOptions.filter == 'range') {
                //Create input element with it's current value
                var $field = self._createInputForRecordField({
                    fieldName: fieldName,
                    formType: 'filter',
                    form: self._$filterForm
                })
                .find('[name]')
                .attr('name', fieldName + '_from' );
                var $label = $('<label>' + self.options.messages.filter.fromRange + ':</label>');

                var $field2 = self._createInputForRecordField({
                    fieldName: fieldName,
                    formType: 'filter',
                    form: self._$filterForm
                })
                .find('[name]')
                .attr('name', fieldName + '_to' );
                var $label2 = $('<label>' + self.options.messages.filter.toRange + ':</label>');
                        
                var $divFrom = $('<div class="jtable-input-field-container-group"></div>').append($label).append($field);
                var $divTo = $('<div class="jtable-input-field-container-group"></div>').append($label2).append($field2);
                $fieldContainer.append( $divFrom ).append( $divTo );
            }
            else{
                //Create input element with it's current value
                var $field = self._createInputForRecordField({
                    fieldName: fieldName,
                    formType: 'filter',
                    form: self._$filterForm
                });
                $fieldContainer.append( $field );
            }
            
            return $fieldContainer;
        },
        
        /* Adds not listed columns filter fields to filter Form
         * **********************************************************************/
        _addFilterFieldsToFilterForm: function ( $form ) {
            var self = this;
            $.each( self.options.fields, function( fieldName, fieldOptions ) {
                if( fieldOptions.filter && self._columnList.indexOf(fieldName) == -1 ){
                    self._createFieldForFilter( fieldName, fieldOptions )
                    .appendTo($form);
                }
            });
        },
        
        /* Applies filter to table
        *************************************************************************/
        _applyTableFilter: function () {
            var formData = $.merge(this._$filterRow.find(':input'), this._$filterForm).serializeArray();
            var filterData = {};
            
            $.each( formData, function(){
                if( this.value ){
                    filterData[this.name] = this.value;
                }
            });
            
            if( $(filterData).length>0 ){
                this.load( $.param(filterData) );
                this.element.children().addClass('jtable-main-container-filtered');
            }
            else{
                this._clearTableFilter();
            }
        },

        /* Clears current table filter
        *************************************************************************/
        _clearTableFilter: function () {
            this._$filterRow.find(':input').each (function(){
                switch(this.type) {
                    case 'password':
                    case 'select-multiple':
                    case 'select-one':
                    case 'text':
                    case 'textarea':
                        $(this).val('');
                        break;
                    case 'checkbox':
                    case 'radio':
                        this.checked = false;
                }
            });
            this._$filterForm.each (function(){
                this.reset();
            });
            
            this.element.children().removeClass('jtable-main-container-filtered');
            this.load();
        }
    });

})(jQuery);
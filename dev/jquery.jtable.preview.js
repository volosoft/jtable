/************************************************************************
 * VIEW RECORD extension for jTable                                      *
 *************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _create: $.hik.jtable.prototype._create,
        _addColumnsToHeaderRow: $.hik.jtable.prototype._addColumnsToHeaderRow,
        _addCellsToRowUsingRecord: $.hik.jtable.prototype._addCellsToRowUsingRecord
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
         * DEFAULT OPTIONS / EVENTS                                              *
         *************************************************************************/
        options: {

            //Events
            recordUpdated: function (event, data) { },
            rowUpdated: function (event, data) { },

            //Localization
            messages: {
                viewRecord: 'View'
            }
        },

        /************************************************************************
         * PRIVATE FIELDS                                                        *
         *************************************************************************/

        _$viewDiv: null, //Reference to the viewing dialog div (jQuery object)
        _$viewingRow: null, //Reference to currently viewing row (jQuery object)

        /************************************************************************
         * CONSTRUCTOR AND INITIALIZATION METHODS                                *
         *************************************************************************/

        /* Overrides base method to do viewing-specific constructions.
        *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);

            if (!this.options.recordPreview) {
                return;
            }

            this._createViewDialogDiv();
        },

        /* Creates and prepares preview dialog div
        *************************************************************************/
        _createViewDialogDiv: function () {
            var self = this;

            //Create a div for dialog and add to container element
            self._$viewDiv = $('<div></div>')
                .appendTo(self._$mainContainer);

            //Prepare dialog
            self._$viewDiv.dialog({
                autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                width: 'auto',
                minWidth: '300',
                modal: true,
                title: self.options.messages.viewRecord,
                buttons:
                    [{  //close button
                        text: self.options.messages.close,
                        click: function () {
                            self._$viewDiv.dialog('close');
                        }
                    }],
                close: function () {
                    var $viewForm = self._$viewDiv.find('form:first');
                    self._trigger("formClosed", null, { form: $viewForm, formType: 'edit', row: self._$viewingRow });
                    $viewForm.remove();
                }
            });
        },



        /************************************************************************
         * PUBLIC METHODS                                                        *
         *************************************************************************/


        /************************************************************************
         * OVERRIDED METHODS                                                     *
         *************************************************************************/

        /* Overrides base method to add a 'view coomand column cell' to header row.
        *************************************************************************/
        _addColumnsToHeaderRow: function ($tr) {
            base._addColumnsToHeaderRow.apply(this, arguments);
            if (self.options.recordPreview  == true) {
                $tr.append(this._createEmptyCommandHeader());
            }
        },

        /* Overrides base method to add a 'edit command cell' to a row.
        *************************************************************************/
        _addCellsToRowUsingRecord: function ($row) {
            var self = this;
            base._addCellsToRowUsingRecord.apply(this, arguments);


            // Add View command cell if the viewable option is sef to true
            if (self.options.recordPreview == true ) {
                var $span = $('<span></span>').html(self.options.messages.viewRecord);
                var $button = $('<button title="' + self.options.messages.viewRecord + '"></button>')
                    .addClass('jtable-command-button jtable-view-command-button')
                    .append($span)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._showViewForm($row);
                    });
                $('<td></td>')
                    .addClass('jtable-command-column')
                    .append($button)
                    .appendTo($row);
            }



        },


        /************************************************************************
         * PRIVATE METHODS                                                       *
         *************************************************************************/

        /* Shows view form for a row.
        *************************************************************************/
        _showViewForm: function ($tableRow) {
            var self = this;
            var record = $tableRow.data('record');

            //Create view form
            var $ViewForm = $('<form id="jtable-view-form" class="jtable-dialog-form jtable-view-form"></form>');
            var ColumnCount=self.options.viewFormColumns ? self.options.viewFormColumns : 1;
            var CurrentColumnCount=0;
            var $ViewFormTable = $('<table class="jtable-view-field-container-grid"/>').appendTo($ViewForm);
            var $RowContainer = $('<tr class="jtable-view-field-container-row" />').appendTo($ViewFormTable);
            //Create input fields
            for (var i = 0; i < self._fieldList.length; i++) {

                var fieldName = self._fieldList[i];
                var field = self.options.fields[fieldName];
                var fieldValue = record[fieldName];


                //Do not create element for non-viewable fields
                if (field.view == false) {
                    continue;
                }



                //Create a container div for this input field and add to form
                var $fieldContainer = $('<td />')
                    .addClass('jtable-view-field-container')
                    .appendTo($RowContainer);

                CurrentColumnCount++;
                if(CurrentColumnCount==ColumnCount)	{
                    $RowContainer=$('<tr class="jtable-view-field-container-row" />').appendTo($ViewFormTable);
                    CurrentColumnCount=0;
                }

                //Create a label for input
                $fieldContainer.append(self._createViewLabelForRecordField(fieldName));

                //Create input element with it's current value
                var currentValue = self._getValueForRecordField(record, fieldName);
                $fieldContainer.append(
                    self._createViewForRecordField({
                        fieldName: fieldName,
                        value: currentValue,
                        record: record,
                        formType: 'view',
                        form: $ViewForm
                    }));
            }

            self._makeCascadeDropDowns($ViewForm, record, 'view');



            //Open dialog
            self._$viewingRow = $tableRow;
            self._$viewDiv.clear();
            self._$viewDiv.append($ViewForm).dialog('open');
            self._trigger("formCreated", null, { form: $ViewForm, formType: 'view', record: record, row: $tableRow });
        }
        ,



        /* Gets text for a field of a record according to it's type.
        *************************************************************************/
        _getValueForRecordField: function (record, fieldName) {
            var field = this.options.fields[fieldName];
            var fieldValue = record[fieldName];
            if (field.type == 'date') {
                return this._getDisplayTextForDateRecordField(field, fieldValue);
            } else {
                return fieldValue;
            }
        }


        /************************************************************************
         * EVENT RAISING METHODS                                                 *
         *************************************************************************/


    });

})(jQuery);
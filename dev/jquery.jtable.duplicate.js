/************************************************************************
* DUPLICATE RECORD extension for jTable                                    *
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
            recordDuplicated: function (event, data) { },
            rowDuplicated: function (event, data) { },

            //Localization
            messages: {
                duplicateRecord: 'Duplicate Record'
            },
            
            validationOptions : {
                promptPosition : "bottomRight",
                autoPositionUpdate : true
            }
        },
        
        
        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$duplicateDiv: null, //Reference to the duplicating dialog div (jQuery object)
        _$duplicatingRow: null, //Reference to currently duplicating row (jQuery object)

        /************************************************************************
        * CONSTRUCTOR AND INITIALIZATION METHODS                                *
        *************************************************************************/

        /* Overrides base method to do duplicating-specific constructions.
        *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);
            
            if (!this.options.actions.duplicateAction) {
                return;
            }
            
            this._createDuplicateDialogDiv();
        },

        /* Creates and prepares duplicate dialog div
        *************************************************************************/
        _createDuplicateDialogDiv: function () {
            var self = this;

            //Create a div for dialog and add to container element
            self._$duplicateDiv = $('<div></div>')
                .appendTo(self._$mainContainer);

            //Prepare dialog
            self._$duplicateDiv.dialog({
                appendTo: self._$mainContainer,
                autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                width: 'auto',
                minWidth: '300',
                modal: true,
                title: self.options.messages.duplicateRecord,
                buttons:
                        [{  //cancel button
                            text: self.options.messages.cancel,
                            click: function () {
                                self._$duplicateDiv.dialog('close');
                            }
                        }, { //save button
                            id: 'DuplicateDialogSaveButton',
                            text: self.options.messages.save,
                            click: function () {
                                self._onSaveClickedOnDuplicateForm();
                            }
                        }],
                close: function () {
                    var $duplicateForm = self._$duplicateDiv.find('form:first');
                    var $saveButton = self._$duplicateDiv.parent().find('#DuplicateDialogSaveButton');
                    
                    $duplicateForm.validationEngine('hide');
                    $duplicateForm.validationEngine('detach');
                    
                    self._trigger("formClosed", null, { form: $duplicateForm, formType: 'duplicate', row: self._$duplicatingRow });
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    $duplicateForm.remove();
                }
            });
        },

        /* Saves duplicating form to server.
        *************************************************************************/
        _onSaveClickedOnDuplicateForm: function () {
            var self = this;
            //row maybe removed by another source, if so, do nothing
            if (self._$duplicatingRow.hasClass('jtable-row-removed')) {
                self._$duplicateDiv.dialog('close');
                return;
            }

            var $saveButton = self._$duplicateDiv.parent().find('#DuplicateDialogSaveButton');
            var $duplicateForm = self._$duplicateDiv.find('form');

            if (self._trigger("formSubmitting", null, { form: $duplicateForm, formType: 'duplicate', row: self._$duplicatingRow }) != false && $duplicateForm.validationEngine('validate')) {
                self._setEnabledOfDialogButton($saveButton, false, self.options.messages.saving);
                self._saveduplicateForm($duplicateForm, $saveButton);
            }
        },
        

        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* Updates a record on the table (optionally on the server also)
        *************************************************************************/
        duplicateRecord: function (options) {
            var self = this;
            options = $.extend({
                clientOnly: false,
                animationsEnabled: self.options.animationsEnabled,
                success: function () { },
                error: function () { }
            }, options);

            if (!options.record) {
                self._logWarn('options parameter in duplicateRecord method must contain a record property.');
                return;
            }

            var key = self._getKeyValueOfRecord(options.record);
            if (key == undefined || key == null) {
                self._logWarn('options parameter in duplicateRecord method must contain a record that contains the key field property.');
                return;
            }

            var $updatingRow = self.getRowByKey(key);
            if ($updatingRow == null) {
                self._logWarn('Can not found any row by key "' + key + '" on the table. Updating row must be visible on the table.');
                return;
            }

            if (options.clientOnly) {
                $.extend($updatingRow.data('record'), options.record);
                self._duplicateRowTexts($updatingRow);
                self._onRecordDuplicated($updatingRow, null);
                if (options.animationsEnabled) {
                    self._showDuplicateAnimationForRow($updatingRow);
                }

                options.success();
                return;
            }

            var completeduplicate = function (data) {
                if (data.Result != 'OK') {
                    self._showError(data.Message);
                    options.error(data);
                    return;
                }

                $.extend($updatingRow.data('record'), options.record);
                self._duplicateRecordValuesFromServerResponse($updatingRow.data('record'), data);

                self._duplicateRowTexts($updatingRow);
                self._onRecordDuplicated($updatingRow, data);
                if (options.animationsEnabled) {
                    self._showDuplicateAnimationForRow($updatingRow);
                }

                options.success(data);
            };

            //duplicateAction may be a function, check if it is
            if (!options.url && $.isFunction(self.options.actions.duplicateAction)) {

                //Execute the function
                var funcResult = self.options.actions.duplicateAction($.param(options.record));

                //Check if result is a jQuery Deferred object
                if (self._isDeferredObject(funcResult)) {
                    //Wait promise
                    funcResult.done(function (data) {
                        completeduplicate(data);
                    }).fail(function () {
                        self._showError(self.options.messages.serverCommunicationError);
                        options.error();
                    });
                } else { //assume it returned the creation result
                    completeduplicate(funcResult);
                }

            } else { //Assume it's a URL string

                //Make an Ajax call to create record
                self._submitFormUsingAjax(
                    options.url || self.options.actions.duplicateAction,
                    $.param(options.record),
                    function (data) {
                        completeduplicate(data);
                    },
                    function () {
                        self._showError(self.options.messages.serverCommunicationError);
                        options.error();
                    });

            }
        },

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides base method to add a 'duplicating column cell' to header row.
        *************************************************************************/
        _addColumnsToHeaderRow: function ($tr) {
            base._addColumnsToHeaderRow.apply(this, arguments);
            if (this.options.actions.duplicateAction != undefined) {
                $tr.append(this._createEmptyCommandHeader());
            }
        },

        /* Overrides base method to add a 'duplicate command cell' to a row.
        *************************************************************************/
        _addCellsToRowUsingRecord: function ($row) {
            var self = this;
            base._addCellsToRowUsingRecord.apply(this, arguments);

            if (self.options.actions.duplicateAction != undefined) {
                var $span = $('<span></span>').html(self.options.messages.duplicateRecord);
                var $button = $('<button title="' + self.options.messages.duplicateRecord + '"></button>')
                    .addClass('jtable-command-button jtable-edit-command-button')
                    .append($span)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._showduplicateForm($row);
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

        /* Shows duplicate form for a row.
        *************************************************************************/
        _showduplicateForm: function ($tableRow) {
            var self = this;
            var record = $tableRow.data('record');

            //Create duplicate form
            var $duplicateForm = $('<form id="jtable-duplicate-form" class="jtable-dialog-form jtable-duplicate-form"></form>');

            //Create input fields
            for (var i = 0; i < self._fieldList.length; i++) {

                var fieldName = self._fieldList[i];
                var field = self.options.fields[fieldName];
                var fieldValue = record[fieldName];

                if (field.key == true) {
                    if (field.duplicate != true) {
                        //Create hidden field for key
                        $duplicateForm.append(self._createInputForHidden(fieldName, fieldValue));
                        continue;
                    } else {
                        //Create a special hidden field for key (since key is be duplicatable)
                        $duplicateForm.append(self._createInputForHidden('jtRecordKey', fieldValue));
                    }
                }

                //Do not create element for non-duplicatable fields
                if (field.duplicate == false) {
                    continue;
                }

                //Hidden field
                if (field.type == 'hidden') {
                    $duplicateForm.append(self._createInputForHidden(fieldName, fieldValue));
                    continue;
                }

                //Create a container div for this input field and add to form
                var $fieldContainer = $('<div class="jtable-input-field-container"></div>').appendTo($duplicateForm);

                //Create a label for input
                $fieldContainer.append(self._createInputLabelForRecordField(fieldName));

                //Create input element with it's current value
                var currentValue = self._getValueForRecordField(record, fieldName);
                var currentValue = self._getValueForRecordField(record, fieldName);
                $fieldContainer.append(
                    self._createInputForRecordField({
                        fieldName: fieldName,
                        value: currentValue,
                        record: record,
                        formType: 'duplicate',
                        form: $duplicateForm
                    }));
            }
            
            self._makeCascadeDropDowns($duplicateForm, record, 'duplicate');

            $duplicateForm.submit(function () {
                self._onSaveClickedOnduplicateForm();
                return false;
            });

            //Open dialog
            self._$duplicatingRow = $tableRow;
            self._$duplicateDiv.append($duplicateForm).dialog('open');
            
            console.log($duplicateForm);
            console.log(self._$duplicateDiv);
            
            $('#jtable-duplicate-form').validationEngine('attach',{promptPosition: self.options.validationOptions.promptPosition,autoPositionDuplicate :self.options.validationOptions.autoPositionDuplicate});
            self._trigger("formCreated", null, { form: $duplicateForm, formType: 'duplicate', record: record, row: $tableRow });
            
            self._$duplicateDiv.parent().find('#DuplicateDialogSaveButton').click();
        },

        /* Saves duplicateing form to the server and duplicates the record on the table.
        *************************************************************************/
        _saveduplicateForm: function ($duplicateForm, $saveButton) {
            var self = this;
            
            var completeduplicate = function (data) {
                if (data.Result != 'OK') {
                    self._showError(data.Message);
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    return;
                }

                var record = self._$duplicatingRow.data('record');

                self._duplicateRecordValuesFromForm(record, $duplicateForm);
                self._duplicateRecordValuesFromServerResponse(record, data);
                self._duplicateRowTexts(self._$duplicatingRow);

                self._$duplicatingRow.attr('data-record-key', self._getKeyValueOfRecord(record));

                self._onRecordDuplicated(self._$duplicatingRow, data);

                if (self.options.animationsEnabled) {
                    self._showDuplicateAnimationForRow(self._$duplicatingRow);
                }

                self._$duplicateDiv.dialog("close");
            };

            //duplicateAction may be a function, check if it is
            if ($.isFunction(self.options.actions.duplicateAction)) {

                //Execute the function
                var funcResult = self.options.actions.duplicateAction($duplicateForm.serialize());

                //Check if result is a jQuery Deferred object
                if (self._isDeferredObject(funcResult)) {
                    //Wait promise
                    funcResult.done(function (data) {
                        completeduplicate(data);
                    }).fail(function () {
                        self._showError(self.options.messages.serverCommunicationError);
                        self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    });
                } else { //assume it returned the creation result
                    completeduplicate(funcResult);
                }

            } else { //Assume it's a URL string

                //Make an Ajax call to duplicate record
                self._submitFormUsingAjax(
                    self.options.actions.duplicateAction,
                    //$duplicateForm.serialize(),
                    $duplicateForm.serializeWithChkBox(),
                    function(data) {
                        completeduplicate(data);
                    },
                    function() {
                        self._showError(self.options.messages.serverCommunicationError);
                        self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    });
            }

        },

        /* This method ensures updating of current record with server response,
        * if server sends a Record object as response to duplicateAction.
        *************************************************************************/
        _duplicateRecordValuesFromServerResponse: function (record, serverResponse) {
            if (!serverResponse || !serverResponse.Record) {
                return;
            }

            $.extend(true, record, serverResponse.Record);
        },

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
        },

        /* Duplicates cells of a table row's text values from row's record values.
        *************************************************************************/
        _duplicateRowTexts: function ($tableRow) {
            var record = $tableRow.data('record');
            var $columns = $tableRow.find('td');
            for (var i = 0; i < this._columnList.length; i++) {
                var displayItem = this._getDisplayTextForRecordField(record, this._columnList[i]);
                if ((displayItem != "") && (displayItem == 0)) displayItem = "0";
                $columns.eq(this._firstDataColumnOffset + i).html(displayItem || '');
            }

            this._onRowUpdated($tableRow);
        },

        /* Shows 'duplicated' animation for a table row.
        *************************************************************************/
        _showUpdateAnimationForRow: function ($tableRow) {
            var className = 'jtable-row-duplicated';
            if (this.options.jqueryuiTheme) {
                className = className + ' ui-state-highlight';
            }

            $tableRow.stop(true, true).addClass(className, 'slow', '', function () {
                $tableRow.removeClass(className, 5000);
            });
        },

        /************************************************************************
        * EVENT RAISING METHODS                                                 *
        *************************************************************************/

        _onRowUpdated: function ($row) {
            this._trigger("rowUpdated", null, { row: $row, record: $row.data('record') });
        },

        _onRecordUpdated: function ($row, data) {
            this._trigger("recordUpdated", null, { record: $row.data('record'), row: $row, serverResponse: data });
        }
        
        
    });
})(jQuery);

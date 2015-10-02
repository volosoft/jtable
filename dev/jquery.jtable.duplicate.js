/************************************************************************
* DUPLICATE extension for jTable                                         *
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

            //Options
            duplicateConfirmation: true,

            //Events
            recordDuplicated: function (event, data) { },

            //Localization
            messages: {
                duplicateConfirmation: 'This record will be duplicated. Are you sure?',
                duplicateText: 'Duplicate',
                deleting: 'Duplicating',
                canNotDuplicatedRecords: 'Can not duplicate {0} of {1} records!',
                duplicateProggress: 'Duplicating {0} of {1} records, processing...'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$duplicateRecordDiv: null, //Reference to the adding new record dialog div (jQuery object)
        _$deletingRow: null, //Reference to currently deleting row (jQuery object)

        /************************************************************************
        * CONSTRUCTOR                                                           *
        *************************************************************************/

        /* Overrides base method to do deletion-specific constructions.
        *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);
            this._createDuplicateDialogDiv();
        },

        /* Creates and prepares duplicate record confirmation dialog div.
        *************************************************************************/
        _createDuplicateDialogDiv: function () {
            var self = this;

            //Check if duplicateAction is supplied
            if (!self.options.actions.duplicateAction) {
                return;
            }

            //Create div element for duplicate confirmation dialog
            self._$duplicateRecordDiv = $('<div><p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span><span class="jtable-duplicate-confirm-message"></span></p></div>').appendTo(self._$mainContainer);

            //Prepare dialog
            self._$duplicateRecordDiv.dialog({
                appendTo: self._$mainContainer,
                autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                modal: true,
                title: self.options.messages.areYouSure,
                buttons:
                        [{  //cancel button
                            text: self.options.messages.cancel,
                            click: function () {
                                self._$duplicateRecordDiv.dialog("close");
                            }
                        }, {//duplicate button
                            id: 'DuplicateDialogButton',
                            text: self.options.messages.duplicateText,
                            click: function () {

                                //row maybe removed by another source, if so, do nothing
                                if (self._$deletingRow.hasClass('jtable-row-removed')) {
                                    self._$duplicateRecordDiv.dialog('close');
                                    return;
                                }

                                var $duplicateButton = self._$duplicateRecordDiv.parent().find('#DuplicateDialogButton');
                                self._setEnabledOfDialogButton($duplicateButton, false, self.options.messages.deleting);
                                self._duplicateRecordFromServer(
                                    self._$deletingRow,
                                    function () {
                                        self._removeRowsFromTableWithAnimation(self._$deletingRow);
                                        self._$duplicateRecordDiv.dialog('close');
                                    },
                                    function (message) { //error
                                        self._showError(message);
                                        self._setEnabledOfDialogButton($duplicateButton, true, self.options.messages.duplicateText);
                                    }
                                );
                            }
                        }],
                close: function () {
                    var $duplicateButton = self._$duplicateRecordDiv.parent().find('#DuplicateDialogButton');
                    self._setEnabledOfDialogButton($duplicateButton, true, self.options.messages.duplicateText);
                }
            });
        },

        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* This method is used to duplicate one or more rows from server and the table.
        *************************************************************************/
        duplicateRows: function ($rows) {
            var self = this;

            if ($rows.length <= 0) {
                self._logWarn('No rows specified to jTable duplicateRows method.');
                return;
            }

            if (self._isBusy()) {
                self._logWarn('Can not duplicate rows since jTable is busy!');
                return;
            }

            //Duplicating just one row
            if ($rows.length == 1) {
                self._duplicateRecordFromServer(
                    $rows,
                    function () { //success
                        self._removeRowsFromTableWithAnimation($rows);
                    },
                    function (message) { //error
                        self._showError(message);
                    }
                );

                return;
            }

            //Duplicating multiple rows
            self._showBusy(self._formatString(self.options.messages.duplicateProggress, 0, $rows.length));

            //This method checks if deleting of all records is completed
            var completedCount = 0;
            var isCompleted = function () {
                return (completedCount >= $rows.length);
            };

            //This method is called when deleting of all records completed
            var completed = function () {
                var $duplicatedRows = $rows.filter('.jtable-row-ready-to-remove');
                if ($duplicatedRows.length < $rows.length) {
                    self._showError(self._formatString(self.options.messages.canNotDuplicatedRecords, $rows.length - $duplicatedRows.length, $rows.length));
                }

                if ($duplicatedRows.length > 0) {
                    self._removeRowsFromTableWithAnimation($duplicatedRows);
                }

                self._hideBusy();
            };

            //Duplicate all rows
            var duplicatedCount = 0;
            $rows.each(function () {
                var $row = $(this);
                self._duplicateRecordFromServer(
                    $row,
                    function () { //success
                        ++duplicatedCount; ++completedCount;
                        $row.addClass('jtable-row-ready-to-remove');
                        self._showBusy(self._formatString(self.options.messages.duplicateProggress, duplicatedCount, $rows.length));
                        if (isCompleted()) {
                            completed();
                        }
                    },
                    function () { //error
                        ++completedCount;
                        if (isCompleted()) {
                            completed();
                        }
                    }
                );
            });
        },

        /* Duplicates a record from the table (optionally from the server also).
        *************************************************************************/
        duplicateRecord: function (options) {
            var self = this;
            options = $.extend({
                clientOnly: false,
                animationsEnabled: self.options.animationsEnabled,
                url: self.options.actions.duplicateAction,
                success: function () { },
                error: function () { }
            }, options);

            if (options.key == undefined) {
                self._logWarn('options parameter in duplicateRecord method must contain a key property.');
                return;
            }

            var $deletingRow = self.getRowByKey(options.key);
            if ($deletingRow == null) {
                self._logWarn('Can not found any row by key: ' + options.key);
                return;
            }

            if (options.clientOnly) {
                self._removeRowsFromTableWithAnimation($deletingRow, options.animationsEnabled);
                options.success();
                return;
            }

            self._duplicateRecordFromServer(
                    $deletingRow,
                    function (data) { //success
                        self._removeRowsFromTableWithAnimation($deletingRow, options.animationsEnabled);
                        options.success(data);
                    },
                    function (message) { //error
                        self._showError(message);
                        options.error(message);
                    },
                    options.url
                );
        },

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides base method to add a 'deletion column cell' to header row.
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
            base._addCellsToRowUsingRecord.apply(this, arguments);

            var self = this;
            if (self.options.actions.duplicateAction != undefined) {
                var $span = $('<span></span>').html(self.options.messages.duplicateText);
                var $button = $('<button title="' + self.options.messages.duplicateText + '"></button>')
                    .addClass('jtable-command-button jtable-delete-command-button')
                    .append($span)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._duplicateButtonClickedForRow($row);
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

        /* This method is called when user clicks duplicate button on a row.
        *************************************************************************/
        _duplicateButtonClickedForRow: function ($row) {
            var self = this;

            var duplicateConfirm;
            var duplicateConfirmMessage = self.options.messages.duplicateConfirmation;

            //If options.duplicateConfirmation is function then call it
            if ($.isFunction(self.options.duplicateConfirmation)) {
                var data = { row: $row, record: $row.data('record'), duplicateConfirm: true, duplicateConfirmMessage: duplicateConfirmMessage, cancel: false, cancelMessage: null };
                self.options.duplicateConfirmation(data);

                //If duplicate progress is cancelled
                if (data.cancel) {

                    //If a canlellation reason is specified
                    if (data.cancelMessage) {
                        self._showError(data.cancelMessage); //TODO: show warning/stop message instead of error (also show warning/error ui icon)!
                    }

                    return;
                }

                duplicateConfirmMessage = data.duplicateConfirmMessage;
                duplicateConfirm = data.duplicateConfirm;
            } else {
                duplicateConfirm = self.options.duplicateConfirmation;
            }

            if (duplicateConfirm != false) {
                //Confirmation
                self._$duplicateRecordDiv.find('.jtable-duplicate-confirm-message').html(duplicateConfirmMessage);
                self._showDuplicateDialog($row);
            } else {
                //No confirmation
                self._duplicateRecordFromServer(
                    $row,
                    function () { //success
                        self._removeRowsFromTableWithAnimation($row);
                    },
                    function (message) { //error
                        self._showError(message);
                    }
                );
            }
        },

        /* Shows duplicate comfirmation dialog.
        *************************************************************************/
        _showDuplicateDialog: function ($row) {
            this._$deletingRow = $row;
            this._$duplicateRecordDiv.dialog('open');
        },

        /* Performs an ajax call to server to duplicate record
        *  and removes row of the record from table if ajax call success.
        *************************************************************************/
        _duplicateRecordFromServer: function ($row, success, error, url) {
            var self = this;

            var completeDuplicate = function(data) {
                if (data.Result != 'OK') {
                    $row.data('deleting', false);
                    if (error) {
                        error(data.Message);
                    }

                    return;
                }

                self._trigger("recordDuplicated", null, { record: $row.data('record'), row: $row, serverResponse: data });

                if (success) {
                    success(data);
                }
            };

            //Check if it is already being duplicated right now
            if ($row.data('deleting') == true) {
                return;
            }

            $row.data('deleting', true);

            var postData = {};
            postData[self._keyField] = self._getKeyValueOfRecord($row.data('record'));
            
            //duplicateAction may be a function, check if it is
            if (!url && $.isFunction(self.options.actions.duplicateAction)) {

                //Execute the function
                var funcResult = self.options.actions.duplicateAction(postData);

                //Check if result is a jQuery Deferred object
                if (self._isDeferredObject(funcResult)) {
                    //Wait promise
                    funcResult.done(function (data) {
                        completeDuplicate(data);
                    }).fail(function () {
                        $row.data('deleting', false);
                        if (error) {
                            error(self.options.messages.serverCommunicationError);
                        }
                    });
                } else { //assume it returned the deletion result
                    completeDuplicate(funcResult);
                }

            } else { //Assume it's a URL string
                //Make ajax call to duplicate the record from server
                this._ajax({
                    url: (url || self.options.actions.duplicateAction),
                    data: postData,
                    success: function (data) {
                        completeDuplicate(data);
                    },
                    error: function () {
                        $row.data('deleting', false);
                        if (error) {
                            error(self.options.messages.serverCommunicationError);
                        }
                    }
                });

            }
        },

        /* Removes a row from table after a 'deleting' animation.
        *************************************************************************/
        _removeRowsFromTableWithAnimation: function ($rows, animationsEnabled) {
            var self = this;

            if (animationsEnabled == undefined) {
                animationsEnabled = self.options.animationsEnabled;
            }

            if (animationsEnabled) {
                var className = 'jtable-row-deleting';
                if (this.options.jqueryuiTheme) {
                    className = className + ' ui-state-disabled';
                }

                //Stop current animation (if does exists) and begin 'deleting' animation.
                $rows.stop(true, true).addClass(className, 'slow', '').promise().done(function () {
                    self._removeRowsFromTable($rows, 'duplicated');
                });
            } else {
                self._removeRowsFromTable($rows, 'duplicated');
            }
        }

    });

})(jQuery);

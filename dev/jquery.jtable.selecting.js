/************************************************************************
* SELECTING extension for jTable                                        *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _create: $.hik.jtable.prototype._create,
        _addColumnsToHeaderRow: $.hik.jtable.prototype._addColumnsToHeaderRow,
        _addCellsToRowUsingRecord: $.hik.jtable.prototype._addCellsToRowUsingRecord,
        _onLoadingRecords: $.hik.jtable.prototype._onLoadingRecords,
        _onRecordsLoaded: $.hik.jtable.prototype._onRecordsLoaded,
        _onRowsRemoved: $.hik.jtable.prototype._onRowsRemoved
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {

            //Options
            selecting: false,
            multiselect: false,
            selectingCheckboxes: false,
            selectOnRowClick: true,

            //Events
            selectionChanged: function (event, data) { }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _selectedRecordIdsBeforeLoad: null, //This array is used to store selected row Id's to restore them after a page refresh (string array).
        _$selectAllCheckbox: null, //Reference to the 'select/deselect all' checkbox (jQuery object)
        _shiftKeyDown: false, //True, if shift key is currently down.

        /************************************************************************
        * CONSTRUCTOR                                                           *
        *************************************************************************/

        /* Overrides base method to do selecting-specific constructions.
        *************************************************************************/
        _create: function () {
            if (this.options.selecting && this.options.selectingCheckboxes) {
                ++this._firstDataColumnOffset;
                this._bindKeyboardEvents();
            }

            //Call base method
            base._create.apply(this, arguments);
        },

        /* Registers to keyboard events those are needed for selection
        *************************************************************************/
        _bindKeyboardEvents: function () {
            var self = this;
            //Register to events to set _shiftKeyDown value
            $(document)
                .keydown(function (event) {
                    switch (event.which) {
                        case 16:
                            self._shiftKeyDown = true;
                            break;
                    }
                })
                .keyup(function (event) {
                    switch (event.which) {
                        case 16:
                            self._shiftKeyDown = false;
                            break;
                    }
                });
        },

        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* Gets jQuery selection for currently selected rows.
        *************************************************************************/
        selectedRows: function () {
            return this._getSelectedRows();
        },

        /* Makes row/rows 'selected'.
        *************************************************************************/
        selectRows: function ($rows) {
            this._selectRows($rows);
            this._onSelectionChanged(); //TODO: trigger only if selected rows changes?
        },

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides base method to add a 'select column' to header row.
        *************************************************************************/
        _addColumnsToHeaderRow: function ($tr) {
            if (this.options.selecting && this.options.selectingCheckboxes) {
                if (this.options.multiselect) {
                    $tr.append(this._createSelectAllHeader());
                } else {
                    $tr.append(this._createEmptyCommandHeader());
                }
            }

            base._addColumnsToHeaderRow.apply(this, arguments);
        },

        /* Overrides base method to add a 'delete command cell' to a row.
        *************************************************************************/
        _addCellsToRowUsingRecord: function ($row) {
            if (this.options.selecting) {
                this._makeRowSelectable($row);
            }

            base._addCellsToRowUsingRecord.apply(this, arguments);
        },

        /* Overrides base event to store selection list
        *************************************************************************/
        _onLoadingRecords: function () {
            if (this.options.selecting) {
                this._storeSelectionList();
            }

            base._onLoadingRecords.apply(this, arguments);
        },

        /* Overrides base event to restore selection list
        *************************************************************************/
        _onRecordsLoaded: function () {
            if (this.options.selecting) {
                this._restoreSelectionList();
            }

            base._onRecordsLoaded.apply(this, arguments);
        },

        /* Overrides base event to check is any selected row is being removed.
        *************************************************************************/
        _onRowsRemoved: function ($rows, reason) {
            if (this.options.selecting && (reason != 'reloading') && ($rows.filter('.jtable-row-selected').length > 0)) {
                this._onSelectionChanged();
            }

            base._onRowsRemoved.apply(this, arguments);
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Creates a header column to select/deselect all rows.
        *************************************************************************/
        _createSelectAllHeader: function () {
            var self = this;

            var $columnHeader = $('<th class=""></th>')
                .addClass('jtable-command-column-header jtable-column-header-selecting');
            this._jqueryuiThemeAddClass($columnHeader, 'ui-state-default');

            var $headerContainer = $('<div />')
                .addClass('jtable-column-header-container')
                .appendTo($columnHeader);

            self._$selectAllCheckbox = $('<input type="checkbox" />')
                .appendTo($headerContainer)
                .click(function () {
                    if (self._$tableRows.length <= 0) {
                        self._$selectAllCheckbox.attr('checked', false);
                        return;
                    }

                    var allRows = self._$tableBody.find('>tr.jtable-data-row');
                    if (self._$selectAllCheckbox.is(':checked')) {
                        self._selectRows(allRows);
                    } else {
                        self._deselectRows(allRows);
                    }

                    self._onSelectionChanged();
                });

            return $columnHeader;
        },

        /* Stores Id's of currently selected records to _selectedRecordIdsBeforeLoad.
        *************************************************************************/
        _storeSelectionList: function () {
            var self = this;

            if (!self.options.selecting) {
                return;
            }

            self._selectedRecordIdsBeforeLoad = [];
            self._getSelectedRows().each(function () {
                self._selectedRecordIdsBeforeLoad.push(self._getKeyValueOfRecord($(this).data('record')));
            });
        },

        /* Selects rows whose Id is in _selectedRecordIdsBeforeLoad;
        *************************************************************************/
        _restoreSelectionList: function () {
            var self = this;

            if (!self.options.selecting) {
                return;
            }

            var selectedRowCount = 0;
            for (var i = 0; i < self._$tableRows.length; ++i) {
                var recordId = self._getKeyValueOfRecord(self._$tableRows[i].data('record'));
                if ($.inArray(recordId, self._selectedRecordIdsBeforeLoad) > -1) {
                    self._selectRows(self._$tableRows[i]);
                    ++selectedRowCount;
                }
            }

            if (self._selectedRecordIdsBeforeLoad.length > 0 && self._selectedRecordIdsBeforeLoad.length != selectedRowCount) {
                self._onSelectionChanged();
            }

            self._selectedRecordIdsBeforeLoad = [];
            self._refreshSelectAllCheckboxState();
        },

        /* Gets all selected rows.
        *************************************************************************/
        _getSelectedRows: function () {
            return this._$tableBody
                .find('>tr.jtable-row-selected');
        },

        /* Adds selectable feature to a row.
        *************************************************************************/
        _makeRowSelectable: function ($row) {
            var self = this;

            //Select/deselect on row click
            if (self.options.selectOnRowClick) {
                $row.click(function () {
                    self._invertRowSelection($row);
                });
            }

            //'select/deselect' checkbox column
            if (self.options.selectingCheckboxes) {
                var $cell = $('<td></td>').addClass('jtable-selecting-column');
                var $selectCheckbox = $('<input type="checkbox" />').appendTo($cell);
                if (!self.options.selectOnRowClick) {
                    $selectCheckbox.click(function () {
                        self._invertRowSelection($row);
                    });
                }

                $row.append($cell);
            }
        },

        /* Inverts selection state of a single row.
        *************************************************************************/
        _invertRowSelection: function ($row) {
            if ($row.hasClass('jtable-row-selected')) {
                this._deselectRows($row);
            } else {
                //Shift key?
                if (this._shiftKeyDown) {
                    var rowIndex = this._findRowIndex($row);
                    //try to select row and above rows until first selected row
                    var beforeIndex = this._findFirstSelectedRowIndexBeforeIndex(rowIndex) + 1;
                    if (beforeIndex > 0 && beforeIndex < rowIndex) {
                        this._selectRows(this._$tableBody.find('tr').slice(beforeIndex, rowIndex + 1));
                    } else {
                        //try to select row and below rows until first selected row
                        var afterIndex = this._findFirstSelectedRowIndexAfterIndex(rowIndex) - 1;
                        if (afterIndex > rowIndex) {
                            this._selectRows(this._$tableBody.find('tr').slice(rowIndex, afterIndex + 1));
                        } else {
                            //just select this row
                            this._selectRows($row);
                        }
                    }
                } else {
                    this._selectRows($row);
                }
            }

            this._onSelectionChanged();
        },

        /* Search for a selected row (that is before given row index) to up and returns it's index 
        *************************************************************************/
        _findFirstSelectedRowIndexBeforeIndex: function (rowIndex) {
            for (var i = rowIndex - 1; i >= 0; --i) {
                if (this._$tableRows[i].hasClass('jtable-row-selected')) {
                    return i;
                }
            }

            return -1;
        },

        /* Search for a selected row (that is after given row index) to down and returns it's index 
        *************************************************************************/
        _findFirstSelectedRowIndexAfterIndex: function (rowIndex) {
            for (var i = rowIndex + 1; i < this._$tableRows.length; ++i) {
                if (this._$tableRows[i].hasClass('jtable-row-selected')) {
                    return i;
                }
            }

            return -1;
        },

        /* Makes row/rows 'selected'.
        *************************************************************************/
        _selectRows: function ($rows) {
            if (!this.options.multiselect) {
                this._deselectRows(this._getSelectedRows());
            }

            $rows.addClass('jtable-row-selected');
            this._jqueryuiThemeAddClass($rows, 'ui-state-highlight');

            if (this.options.selectingCheckboxes) {
                $rows.find('>td.jtable-selecting-column >input').prop('checked', true);
            }

            this._refreshSelectAllCheckboxState();
        },

        /* Makes row/rows 'non selected'.
        *************************************************************************/
        _deselectRows: function ($rows) {
            $rows.removeClass('jtable-row-selected ui-state-highlight');
            if (this.options.selectingCheckboxes) {
                $rows.find('>td.jtable-selecting-column >input').prop('checked', false);
            }

            this._refreshSelectAllCheckboxState();
        },

        /* Updates state of the 'select/deselect' all checkbox according to count of selected rows.
        *************************************************************************/
        _refreshSelectAllCheckboxState: function () {
            if (!this.options.selectingCheckboxes || !this.options.multiselect) {
                return;
            }

            var totalRowCount = this._$tableRows.length;
            var selectedRowCount = this._getSelectedRows().length;

            if (selectedRowCount == 0) {
                this._$selectAllCheckbox.prop('indeterminate', false);
                this._$selectAllCheckbox.attr('checked', false);
            } else if (selectedRowCount == totalRowCount) {
                this._$selectAllCheckbox.prop('indeterminate', false);
                this._$selectAllCheckbox.attr('checked', true);
            } else {
                this._$selectAllCheckbox.attr('checked', false);
                this._$selectAllCheckbox.prop('indeterminate', true);
            }
        },

        /************************************************************************
        * EVENT RAISING METHODS                                                 *
        *************************************************************************/

        _onSelectionChanged: function () {
            this._trigger("selectionChanged", null, {});
        }

    });

})(jQuery);

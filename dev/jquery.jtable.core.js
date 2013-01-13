/************************************************************************
* CORE jTable module                                                    *
*************************************************************************/
(function ($) {

    $.widget("hik.jtable", {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {

            //Options
            actions: {},
            fields: {},
            animationsEnabled: true,
            defaultDateFormat: 'yy-mm-dd',
            dialogShowEffect: 'fade',
            dialogHideEffect: 'fade',
            showCloseButton: false,
            loadingAnimationDelay: 500,
            ajaxSettings: {
                type: 'POST',
                dataType: 'json'
            },

            //Events
            closeRequested: function (event, data) { },
            formCreated: function (event, data) { },
            formSubmitting: function (event, data) { },
            formClosed: function (event, data) { },
            loadingRecords: function (event, data) { },
            recordsLoaded: function (event, data) { },
            rowInserted: function (event, data) { },
            rowsRemoved: function (event, data) { },

            //Localization
            messages: {
                serverCommunicationError: 'An error occured while communicating to the server.',
                loadingMessage: 'Loading records...',
                noDataAvailable: 'No data available!',
                areYouSure: 'Are you sure?',
                save: 'Save',
                saving: 'Saving',
                cancel: 'Cancel',
                error: 'Error',
                close: 'Close',
                cannotLoadOptionsFor: 'Can not load options for field {0}'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$mainContainer: null, //Reference to the main container of all elements that are created by this plug-in (jQuery object)

        _$table: null, //Reference to the main <table> (jQuery object)
        _$tableBody: null, //Reference to <body> in the table (jQuery object)
        _$tableRows: null, //Array of all <tr> in the table (except "no data" row) (jQuery object array)

        _$bottomPanel: null, //Reference to the panel at the bottom of the table (jQuery object)

        _$busyDiv: null, //Reference to the div that is used to block UI while busy (jQuery object)
        _$busyMessageDiv: null, //Reference to the div that is used to show some message when UI is blocked (jQuery object)
        _$errorDialogDiv: null, //Reference to the error dialog div (jQuery object)

        _columnList: null, //Name of all data columns in the table (select column and command columns are not included) (string array)
        _fieldList: null, //Name of all fields of a record (defined in fields option) (string array)
        _keyField: null, //Name of the key field of a record (that is defined as 'key: true' in the fields option) (string)

        _firstDataColumnOffset: 0, //Start index of first record field in table columns (some columns can be placed before first data column, such as select checkbox column) (integer)
        _lastPostData: null, //Last posted data on load method (object)

        _cache: null, //General purpose cache dictionary (object)

        /************************************************************************
        * CONSTRUCTOR AND INITIALIZATION METHODS                                *
        *************************************************************************/

        /* Contructor.
        *************************************************************************/
        _create: function () {

            //Initialization
            this._normalizeFieldsOptions();
            this._initializeFields();
            this._createFieldAndColumnList();

            //Creating DOM elements
            this._createMainContainer();
            this._createTableTitle();
            this._createTable();
            this._createBottomPanel();
            this._createBusyPanel();
            this._createErrorDialogDiv();
            this._addNoDataRow();
        },

        /* Normalizes some options for all fields (sets default values).
        *************************************************************************/
        _normalizeFieldsOptions: function () {
            var self = this;
            $.each(self.options.fields, function (fieldName, props) {
                self._normalizeFieldOptions(fieldName, props);
            });
        },

        /* Normalizes some options for a field (sets default values).
        *************************************************************************/
        _normalizeFieldOptions: function (fieldName, props) {
            props.listClass = props.listClass || '';
            props.inputClass = props.inputClass || '';
        },

        /* Intializes some private variables.
        *************************************************************************/
        _initializeFields: function () {
            this._lastPostData = {};
            this._$tableRows = [];
            this._columnList = [];
            this._fieldList = [];
            this._cache = [];
        },

        /* Fills _fieldList, _columnList arrays and sets _keyField variable.
        *************************************************************************/
        _createFieldAndColumnList: function () {
            var self = this;

            $.each(self.options.fields, function (name, props) {

                //Add field to the field list
                self._fieldList.push(name);

                //Check if this field is the key field
                if (props.key == true) {
                    self._keyField = name;
                }

                //Add field to column list if it is shown in the table
                if (props.list != false && props.type != 'hidden') {
                    self._columnList.push(name);
                }
            });
        },

        /* Creates the main container div.
        *************************************************************************/
        _createMainContainer: function () {
            this._$mainContainer = $('<div />')
                .addClass('jtable-main-container')
                .appendTo(this.element);
        },

        /* Creates title of the table if a title supplied in options.
        *************************************************************************/
        _createTableTitle: function () {
            var self = this;

            if (!self.options.title) {
                return;
            }

            var $titleDiv = $('<div />')
                .addClass('jtable-title')
                .appendTo(self._$mainContainer);

            $('<div />')
                .addClass('jtable-title-text')
                .appendTo($titleDiv)
                .append(self.options.title);

            if (self.options.showCloseButton) {

                var $textSpan = $('<span />')
                    .html(self.options.messages.close);

                $('<button></button>')
                    .addClass('jtable-command-button jtable-close-button')
                    .attr('title', self.options.messages.close)
                    .append($textSpan)
                    .appendTo($titleDiv)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._onCloseRequested();
                    });
            }
        },

        /* Creates the table.
        *************************************************************************/
        _createTable: function () {
            this._$table = $('<table></table>')
                .addClass('jtable')
                .appendTo(this._$mainContainer);

            this._createTableHead();
            this._createTableBody();
        },

        /* Creates header (all column headers) of the table.
        *************************************************************************/
        _createTableHead: function () {
            var $thead = $('<thead></thead>')
                .appendTo(this._$table);

            this._addRowToTableHead($thead);
        },

        /* Adds tr element to given thead element
        *************************************************************************/
        _addRowToTableHead: function ($thead) {
            var $tr = $('<tr></tr>')
                .appendTo($thead);

            this._addColumnsToHeaderRow($tr);
        },

        /* Adds column header cells to given tr element.
        *************************************************************************/
        _addColumnsToHeaderRow: function ($tr) {
            for (var i = 0; i < this._columnList.length; i++) {
                var fieldName = this._columnList[i];
                var $headerCell = this._createHeaderCellForField(fieldName, this.options.fields[fieldName]);
                $headerCell.appendTo($tr);
            }
        },

        /* Creates a header cell for given field.
        *  Returns th jQuery object.
        *************************************************************************/
        _createHeaderCellForField: function (fieldName, field) {
            field.width = field.width || '10%'; //default column width: 10%.

            var $headerTextSpan = $('<span />')
                .addClass('jtable-column-header-text')
                .html(field.title);

            var $headerContainerDiv = $('<div />')
                .addClass('jtable-column-header-container')
                .append($headerTextSpan);

            var $th = $('<th></th>')
                .addClass('jtable-column-header')
                .css('width', field.width)
                .data('fieldName', fieldName)
                .append($headerContainerDiv);

            return $th;
        },

        /* Creates an empty header cell that can be used as command column headers.
        *************************************************************************/
        _createEmptyCommandHeader: function () {
            return $('<th></th>')
                .addClass('jtable-command-column-header')
                .css('width', '1%');
        },

        /* Creates tbody tag and adds to the table.
        *************************************************************************/
        _createTableBody: function () {
            this._$tableBody = $('<tbody></tbody>').appendTo(this._$table);
        },

        /* Creates bottom panel and adds to the page.
        *************************************************************************/
        _createBottomPanel: function () {
            this._$bottomPanel = $('<div />')
                .addClass('jtable-bottom-panel')
                .appendTo(this._$mainContainer);

            $('<div />').addClass('jtable-left-area').appendTo(this._$bottomPanel);
            $('<div />').addClass('jtable-right-area').appendTo(this._$bottomPanel);
        },

        /* Creates a div to block UI while jTable is busy.
        *************************************************************************/
        _createBusyPanel: function () {
            this._$busyMessageDiv = $('<div />').addClass('jtable-busy-message').prependTo(this._$mainContainer);
            this._$busyDiv = $('<div />').addClass('jtable-busy-panel-background').prependTo(this._$mainContainer);
            this._hideBusy();
        },

        /* Creates and prepares error dialog div.
        *************************************************************************/
        _createErrorDialogDiv: function () {
            var self = this;

            self._$errorDialogDiv = $('<div></div>').appendTo(self._$mainContainer);
            self._$errorDialogDiv.dialog({
                autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                modal: true,
                title: self.options.messages.error,
                buttons: [{
                    text: self.options.messages.close,
                    click: function () {
                        self._$errorDialogDiv.dialog('close');
                    }
                }]
            });
        },

        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* Loads data using AJAX call, clears table and fills with new data.
        *************************************************************************/
        load: function (postData, completeCallback) {
            this._lastPostData = postData;
            this._reloadTable(completeCallback);
        },

        /* Refreshes (re-loads) table data with last postData.
        *************************************************************************/
        reload: function (completeCallback) {
            this._reloadTable(completeCallback);
        },

        /* Gets a jQuery row object according to given record key
        *************************************************************************/
        getRowByKey: function (key) {
            for (var i = 0; i < this._$tableRows.length; i++) {
                if (key == this._getKeyValueOfRecord(this._$tableRows[i].data('record'))) {
                    return this._$tableRows[i];
                }
            }

            return null;
        },

        /* Completely removes the table from it's container.
        *************************************************************************/
        destroy: function () {
            this.element.empty();
            $.Widget.prototype.destroy.call(this);
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* LOADING RECORDS  *****************************************************/

        /* Performs an AJAX call to reload data of the table.
        *************************************************************************/
        _reloadTable: function (completeCallback) {
            var self = this;

            //Disable table since it's busy
            self._showBusy(self.options.messages.loadingMessage, self.options.loadingAnimationDelay);

            //Generate URL (with query string parameters) to load records
            var loadUrl = self._createRecordLoadUrl();

            //Load data from server
            self._onLoadingRecords();
            self._ajax({
                url: loadUrl,
                data: self._lastPostData,
                success: function (data) {
                    self._hideBusy();

                    //Show the error message if server returns error
                    if (data.Result != 'OK') {
                        self._showError(data.Message);
                        return;
                    }

                    //Re-generate table rows
                    self._removeAllRows('reloading');
                    self._addRecordsToTable(data.Records);

                    self._onRecordsLoaded(data);

                    //Call complete callback
                    if (completeCallback) {
                        completeCallback();
                    }
                },
                error: function () {
                    self._hideBusy();
                    self._showError(self.options.messages.serverCommunicationError);
                }
            });
        },

        /* Creates URL to load records.
        *************************************************************************/
        _createRecordLoadUrl: function () {
            return this.options.actions.listAction;
        },

        /* TABLE MANIPULATION METHODS *******************************************/

        /* Creates a row from given record
        *************************************************************************/
        _createRowFromRecord: function (record) {
            var $tr = $('<tr></tr>')
                .addClass('jtable-data-row')
                .attr('data-record-key', this._getKeyValueOfRecord(record))
                .data('record', record);

            this._addCellsToRowUsingRecord($tr);
            return $tr;
        },

        /* Adds all cells to given row.
        *************************************************************************/
        _addCellsToRowUsingRecord: function ($row) {
            var record = $row.data('record');
            for (var i = 0; i < this._columnList.length; i++) {
                this._createCellForRecordField(record, this._columnList[i])
                    .appendTo($row);
            }
        },

        /* Create a cell for given field.
        *************************************************************************/
        _createCellForRecordField: function (record, fieldName) {
            return $('<td></td>')
                .addClass(this.options.fields[fieldName].listClass)
                .append((this._getDisplayTextForRecordField(record, fieldName) || ''));
        },

        /* Adds a list of records to the table.
        *************************************************************************/
        _addRecordsToTable: function (records) {
            var self = this;

            $.each(records, function (index, record) {
                self._addRow(self._createRowFromRecord(record));
            });

            self._refreshRowStyles();
        },

        /* Adds a single row to the table.
        * NOTE: THIS METHOD IS DEPRECATED AND WILL BE REMOVED FROM FEATURE RELEASES.
        * USE _addRow METHOD.
        *************************************************************************/
        _addRowToTable: function ($tableRow, index, isNewRow, animationsEnabled) {
            var options = {
                index: this._normalizeNumber(index, 0, this._$tableRows.length, this._$tableRows.length)
            };

            if (isNewRow == true) {
                options.isNewRow = true;
            }

            if (animationsEnabled == false) {
                options.animationsEnabled = false;
            }

            this._addRow($tableRow, options);
        },

        /* Adds a single row to the table.
        *************************************************************************/
        _addRow: function ($row, options) {
            //Set defaults
            options = $.extend({
                index: this._$tableRows.length,
                isNewRow: false,
                animationsEnabled: true
            }, options);

            //Remove 'no data' row if this is first row
            if (this._$tableRows.length <= 0) {
                this._removeNoDataRow();
            }

            //Add new row to the table according to it's index
            options.index = this._normalizeNumber(options.index, 0, this._$tableRows.length, this._$tableRows.length);
            if (options.index == this._$tableRows.length) {
                //add as last row
                this._$tableBody.append($row);
                this._$tableRows.push($row);
            } else if (options.index == 0) {
                //add as first row
                this._$tableBody.prepend($row);
                this._$tableRows.unshift($row);
            } else {
                //insert to specified index
                this._$tableRows[options.index - 1].after($row);
                this._$tableRows.splice(options.index, 0, $row);
            }

            this._onRowInserted($row, options.isNewRow);

            //Show animation if needed
            if (options.isNewRow) {
                this._refreshRowStyles();
                if (this.options.animationsEnabled && options.animationsEnabled) {
                    this._showNewRowAnimation($row);
                }
            }
        },

        /* Shows created animation for a table row
        * TODO: Make this animation cofigurable and changable
        *************************************************************************/
        _showNewRowAnimation: function ($tableRow) {
            $tableRow.addClass('jtable-row-created', 'slow', '', function () {
                $tableRow.removeClass('jtable-row-created', 5000);
            });
        },

        /* Removes a row or rows (jQuery selection) from table.
        *************************************************************************/
        _removeRowsFromTable: function ($rows, reason) {
            var self = this;

            //Check if any row specified
            if ($rows.length <= 0) {
                return;
            }

            //remove from DOM
            $rows.remove();

            //remove from _$tableRows array
            $rows.each(function () {
                self._$tableRows.splice(self._findRowIndex($(this)), 1);
            });

            self._onRowsRemoved($rows, reason);

            //Add 'no data' row if all rows removed from table
            if (self._$tableRows.length == 0) {
                self._addNoDataRow();
            }

            self._refreshRowStyles();
        },

        /* Finds index of a row in table.
        *************************************************************************/
        _findRowIndex: function ($row) {
            return this._findIndexInArray($row, this._$tableRows, function ($row1, $row2) {
                return $row1.data('record') == $row2.data('record');
            });
        },

        /* Removes all rows in the table and adds 'no data' row.
        *************************************************************************/
        _removeAllRows: function (reason) {
            //If no rows does exists, do nothing
            if (this._$tableRows.length <= 0) {
                return;
            }

            //Select all rows (to pass it on raising _onRowsRemoved event)
            var $rows = this._$tableBody.find('tr.jtable-data-row');

            //Remove all rows from DOM and the _$tableRows array
            this._$tableBody.empty();
            this._$tableRows = [];

            this._onRowsRemoved($rows, reason);

            //Add 'no data' row since we removed all rows
            this._addNoDataRow();
        },

        /* Adds "no data available" row to the table.
        *************************************************************************/
        _addNoDataRow: function () {
            var $tr = $('<tr></tr>')
                .addClass('jtable-no-data-row')
                .appendTo(this._$tableBody);

            var totalColumnCount = this._$table.find('thead th').length;
            $('<td></td>')
                .attr('colspan', totalColumnCount)
                .html(this.options.messages.noDataAvailable)
                .appendTo($tr);
        },

        /* Removes "no data available" row from the table.
        *************************************************************************/
        _removeNoDataRow: function () {
            this._$tableBody.find('.jtable-no-data-row').remove();
        },

        /* Refreshes styles of all rows in the table
        *************************************************************************/
        _refreshRowStyles: function () {
            for (var i = 0; i < this._$tableRows.length; i++) {
                if (i % 2 == 0) {
                    this._$tableRows[i].addClass('jtable-row-even');
                } else {
                    this._$tableRows[i].removeClass('jtable-row-even');
                }
            }
        },

        /* RENDERING FIELD VALUES ***********************************************/

        /* Gets text for a field of a record according to it's type.
        *************************************************************************/
        _getDisplayTextForRecordField: function (record, fieldName) {
            var field = this.options.fields[fieldName];
            var fieldValue = record[fieldName];

            //if this is a custom field, call display function
            if (field.display) {
                return field.display({ record: record });
            }

            if (field.type == 'date') {
                return this._getDisplayTextForDateRecordField(field, fieldValue);
            } else if (field.type == 'checkbox') {
                return this._getCheckBoxTextForFieldByValue(fieldName, fieldValue);
            } else if (field.options) {
                return this._getOptionsWithCaching(fieldName)[fieldValue];
            } else {
                return fieldValue;
            }
        },

        /* Gets text for a date field.
        *************************************************************************/
        _getDisplayTextForDateRecordField: function (field, fieldValue) {
            if (!fieldValue) {
                return '';
            }

            var displayFormat = field.displayFormat || this.options.defaultDateFormat;
            var date = this._parseDate(fieldValue);
            return $.datepicker.formatDate(displayFormat, date);
        },

        /* Parses given date string to a javascript Date object.
        *  Given string must be formatted one of the samples shown below:
        *  /Date(1320259705710)/
        *  2011-01-01 20:32:42 (YYYY-MM-DD HH:MM:SS)
        *  2011-01-01 (YYYY-MM-DD)
        *************************************************************************/
        _parseDate: function (dateString) {
            if (dateString.indexOf('Date') >= 0) { //Format: /Date(1320259705710)/
                return new Date(
                    parseInt(dateString.substr(6))
                );
            } else if (dateString.length == 10) { //Format: 2011-01-01
                return new Date(
                    parseInt(dateString.substr(0, 4)),
                    parseInt(dateString.substr(5, 2)) - 1,
                    parseInt(dateString.substr(8, 2))
                );
            } else if (dateString.length == 19) { //Format: 2011-01-01 20:32:42
                return new Date(
                    parseInt(dateString.substr(0, 4)),
                    parseInt(dateString.substr(5, 2)) - 1,
                    parseInt(dateString.substr(8, 2)),
                    parseInt(dateString.substr(11, 2)),
                    parseInt(dateString.substr(14, 2)),
                    parseInt(dateString.substr(17, 2))
                );
            } else {
                this._logWarn('Given date is not properly formatted: ' + dateString);
                return 'format error!';
            }
        },

        /* ERROR DIALOG *********************************************************/

        /* Shows error message dialog with given message.
        *************************************************************************/
        _showError: function (message) {
            this._$errorDialogDiv.html(message).dialog('open');
        },

        /* BUSY PANEL ***********************************************************/

        /* Shows busy indicator and blocks table UI.
        * TODO: Make this cofigurable and changable
        *************************************************************************/
        _setBusyTimer: null, //TODO: Think for a better way!
        _showBusy: function (message, delay) {
            var self = this;

            var show = function () {
                if (!self._$busyMessageDiv.is(':visible')) {
                    self._$busyDiv.width(self._$mainContainer.width());
                    self._$busyDiv.height(self._$mainContainer.height());
                    self._$busyDiv.show();
                    self._$busyMessageDiv.show();
                }

                self._$busyMessageDiv.html(message);
            };

            //TODO: Put an overlay always (without color) to not allow to click the table
            //TODO: and change it visible when timeout occurs.
            if (delay) {
                self._setBusyTimer = setTimeout(show, delay);
            } else {
                show();
            }
        },

        /* Hides busy indicator and unblocks table UI.
        *************************************************************************/
        _hideBusy: function () {
            clearTimeout(this._setBusyTimer);
            this._$busyDiv.hide();
            this._$busyMessageDiv.html('').hide();
        },

        /* Returns true if jTable is busy.
        *************************************************************************/
        _isBusy: function () {
            return this._$busyMessageDiv.is(':visible');
        },

        /* COMMON METHODS *******************************************************/

        /* Performs an AJAX call to specified URL.
        * THIS METHOD IS DEPRECATED AND WILL BE REMOVED FROM FEATURE RELEASES.
        * USE _ajax METHOD.
        *************************************************************************/
        _performAjaxCall: function (url, postData, async, success, error) {
            this._ajax({
                url: url,
                data: postData,
                async: async,
                success: success,
                error: error
            });
        },

        /* This method is used to perform AJAX calls in jTable instead of direct
        * usage of jQuery.ajax method.
        *************************************************************************/
        _ajax: function (options) {
            var opts = $.extend({}, this.options.ajaxSettings, options);

            //Override success
            opts.success = function (data) {
                if (options.success) {
                    options.success(data);
                }
            };

            //Override error
            opts.error = function () {
                if (options.error) {
                    options.error();
                }
            };

            //Override complete
            opts.complete = function () {
                if (options.complete) {
                    options.complete();
                }
            };

            $.ajax(opts);
        },

        /* Gets value of key field of a record.
        *************************************************************************/
        _getKeyValueOfRecord: function (record) {
            return record[this._keyField];
        },

        /************************************************************************
        * EVENT RAISING METHODS                                                 *
        *************************************************************************/

        _onLoadingRecords: function () {
            this._trigger("loadingRecords", null, {});
        },

        _onRecordsLoaded: function (data) {
            this._trigger("recordsLoaded", null, { records: data.Records, serverResponse: data });
        },

        _onRowInserted: function ($row, isNewRow) {
            this._trigger("rowInserted", null, { row: $row, record: $row.data('record'), isNewRow: isNewRow });
        },

        _onRowsRemoved: function ($rows, reason) {
            this._trigger("rowsRemoved", null, { rows: $rows, reason: reason });
        },

        _onCloseRequested: function () {
            this._trigger("closeRequested", null, {});
        }

    });

}(jQuery));

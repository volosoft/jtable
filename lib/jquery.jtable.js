/* 

jTable 2.4.0
http://www.jtable.org

---------------------------------------------------------------------------

Copyright (C) 2011-2014 by Halil İbrahim Kalkan (http://www.halilibrahimkalkan.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

/************************************************************************
* CORE jTable module                                                    *
*************************************************************************/
(function ($) {

    var unloadingPage;
    
    $(window).on('beforeunload', function () {
        unloadingPage = true;
    });
    $(window).on('unload', function () {
        unloadingPage = false;
    });

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
            saveUserPreferences: true,
            jqueryuiTheme: false,
            unAuthorizedRequestRedirectUrl: null,

            ajaxSettings: {
                type: 'POST',
                dataType: 'json'
            },

            toolbar: {
                hoverAnimation: true,
                hoverAnimationDuration: 60,
                hoverAnimationEasing: undefined,
                items: []
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

        _$titleDiv: null, //Reference to the title div (jQuery object)
        _$toolbarDiv: null, //Reference to the toolbar div (jQuery object)

        _$table: null, //Reference to the main <table> (jQuery object)
        _$tableBody: null, //Reference to <body> in the table (jQuery object)
        _$tableRows: null, //Array of all <tr> in the table (except "no data" row) (jQuery object array)

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
            this._createToolBar();
            this._createTable();
            this._createBusyPanel();
            this._createErrorDialogDiv();
            this._addNoDataRow();

            this._cookieKeyPrefix = this._generateCookieKeyPrefix();            
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
            if (props.listClass == undefined) {
                props.listClass = '';
            }
            if (props.inputClass == undefined) {
                props.inputClass = '';
            }

            //Convert dependsOn to array if it's a comma seperated lists
            if (props.dependsOn && $.type(props.dependsOn) === 'string') {
                var dependsOnArray = props.dependsOn.split(',');
                props.dependsOn = [];
                for (var i = 0; i < dependsOnArray.length; i++) {
                    props.dependsOn.push($.trim(dependsOnArray[i]));
                }
            }
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

            this._jqueryuiThemeAddClass(this._$mainContainer, 'ui-widget');
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

            self._jqueryuiThemeAddClass($titleDiv, 'ui-widget-header');

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

            self._$titleDiv = $titleDiv;
        },

        /* Creates the table.
        *************************************************************************/
        _createTable: function () {
            this._$table = $('<table></table>')
                .addClass('jtable')
                .appendTo(this._$mainContainer);

            if (this.options.tableId) {
                this._$table.attr('id', this.options.tableId);
            }

            this._jqueryuiThemeAddClass(this._$table, 'ui-widget-content');

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
                .addClass(field.listClass)
                .css('width', field.width)
                .data('fieldName', fieldName)
                .append($headerContainerDiv);

            this._jqueryuiThemeAddClass($th, 'ui-state-default');

            return $th;
        },

        /* Creates an empty header cell that can be used as command column headers.
        *************************************************************************/
        _createEmptyCommandHeader: function () {
            var $th = $('<th></th>')
                .addClass('jtable-command-column-header')
                .css('width', '1%');

            this._jqueryuiThemeAddClass($th, 'ui-state-default');

            return $th;
        },

        /* Creates tbody tag and adds to the table.
        *************************************************************************/
        _createTableBody: function () {
            this._$tableBody = $('<tbody></tbody>').appendTo(this._$table);
        },

        /* Creates a div to block UI while jTable is busy.
        *************************************************************************/
        _createBusyPanel: function () {
            this._$busyMessageDiv = $('<div />').addClass('jtable-busy-message').prependTo(this._$mainContainer);
            this._$busyDiv = $('<div />').addClass('jtable-busy-panel-background').prependTo(this._$mainContainer);
            this._jqueryuiThemeAddClass(this._$busyMessageDiv, 'ui-widget-header');
            this._hideBusy();
        },

        /* Creates and prepares error dialog div.
        *************************************************************************/
        _createErrorDialogDiv: function () {
            var self = this;

            self._$errorDialogDiv = $('<div></div>').appendTo(self._$mainContainer);
            self._$errorDialogDiv.dialog({
                appendTo: self._$mainContainer,
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

        /* Used to change options dynamically after initialization.
        *************************************************************************/
        _setOption: function (key, value) {

        },

        /* LOADING RECORDS  *****************************************************/

        /* Performs an AJAX call to reload data of the table.
        *************************************************************************/
        _reloadTable: function (completeCallback) {
            var self = this;

            var completeReload = function(data) {
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
            };

            self._showBusy(self.options.messages.loadingMessage, self.options.loadingAnimationDelay); //Disable table since it's busy
            self._onLoadingRecords();

            //listAction may be a function, check if it is
            if ($.isFunction(self.options.actions.listAction)) {

                //Execute the function
                var funcResult = self.options.actions.listAction(self._lastPostData, self._createJtParamsForLoading());

                //Check if result is a jQuery Deferred object
                if (self._isDeferredObject(funcResult)) {
                    funcResult.done(function(data) {
                        completeReload(data);
                    }).fail(function() {
                        self._showError(self.options.messages.serverCommunicationError);
                    }).always(function() {
                        self._hideBusy();
                    });
                } else { //assume it's the data we're loading
                    completeReload(funcResult);
                }

            } else { //assume listAction as URL string.

                //Generate URL (with query string parameters) to load records
                var loadUrl = self._createRecordLoadUrl();

                //Load data from server using AJAX
                self._ajax({
                    url: loadUrl,
                    data: self._lastPostData,
                    success: function (data) {
                        completeReload(data);
                    },
                    error: function () {
                        self._hideBusy();
                        self._showError(self.options.messages.serverCommunicationError);
                    }
                });

            }
        },

        /* Creates URL to load records.
        *************************************************************************/
        _createRecordLoadUrl: function () {
            return this.options.actions.listAction;
        },

        _createJtParamsForLoading: function() {
            return {
                //Empty as default, paging, sorting or other extensions can override this method to add additional params to load request
            };
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
                .append((this._getDisplayTextForRecordField(record, fieldName)));
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
            var className = 'jtable-row-created';
            if (this.options.jqueryuiTheme) {
                className = className + ' ui-state-highlight';
            }

            $tableRow.addClass(className, 'slow', '', function () {
                $tableRow.removeClass(className, 5000);
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
            $rows.addClass('jtable-row-removed').remove();

            //remove from _$tableRows array
            $rows.each(function () {
                var index = self._findRowIndex($(this));
                if (index >= 0) {
                    self._$tableRows.splice(index, 1);
                }
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
            if (this._$tableBody.find('>tr.jtable-no-data-row').length > 0) {
                return;
            }

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
            } else if (field.options) { //combobox or radio button list since there are options.
                var options = this._getOptionsForField(fieldName, {
                    record: record,
                    value: fieldValue,
                    source: 'list',
                    dependedValues: this._createDependedValuesUsingRecord(record, field.dependsOn)
                });
                return this._findOptionByValue(options, fieldValue).DisplayText;
            } else { //other types
                return fieldValue;
            }
        },

        /* Creates and returns an object that's properties are depended values of a record.
        *************************************************************************/
        _createDependedValuesUsingRecord: function (record, dependsOn) {
            if (!dependsOn) {
                return {};
            }

            var dependedValues = {};
            for (var i = 0; i < dependsOn.length; i++) {
                dependedValues[dependsOn[i]] = record[dependsOn[i]];
            }

            return dependedValues;
        },

        /* Finds an option object by given value.
        *************************************************************************/
        _findOptionByValue: function (options, value) {
            for (var i = 0; i < options.length; i++) {
                if (options[i].Value == value) {
                    return options[i];
                }
            }

            return {}; //no option found
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

        /* Gets options for a field according to user preferences.
        *************************************************************************/
        _getOptionsForField: function (fieldName, funcParams) {
            var field = this.options.fields[fieldName];
            var optionsSource = field.options;

            if ($.isFunction(optionsSource)) {
                //prepare parameter to the function
                funcParams = $.extend(true, {
                    _cacheCleared: false,
                    dependedValues: {},
                    clearCache: function () {
                        this._cacheCleared = true;
                    }
                }, funcParams);

                //call function and get actual options source
                optionsSource = optionsSource(funcParams);
            }

            var options;

            //Build options according to it's source type
            if (typeof optionsSource == 'string') { //It is an Url to download options
                var cacheKey = 'options_' + fieldName + '_' + optionsSource; //create a unique cache key
                if (funcParams._cacheCleared || (!this._cache[cacheKey])) {
                    //if user calls clearCache() or options are not found in the cache, download options
                    this._cache[cacheKey] = this._buildOptionsFromArray(this._downloadOptions(fieldName, optionsSource));
                    this._sortFieldOptions(this._cache[cacheKey], field.optionsSorting);
                } else {
                    //found on cache..
                    //if this method (_getOptionsForField) is called to get option for a specific value (on funcParams.source == 'list')
                    //and this value is not in cached options, we need to re-download options to get the unfound (probably new) option.
                    if (funcParams.value != undefined) {
                        var optionForValue = this._findOptionByValue(this._cache[cacheKey], funcParams.value);
                        if (optionForValue.DisplayText == undefined) { //this value is not in cached options...
                            this._cache[cacheKey] = this._buildOptionsFromArray(this._downloadOptions(fieldName, optionsSource));
                            this._sortFieldOptions(this._cache[cacheKey], field.optionsSorting);
                        }
                    }
                }

                options = this._cache[cacheKey];
            } else if (jQuery.isArray(optionsSource)) { //It is an array of options
                options = this._buildOptionsFromArray(optionsSource);
                this._sortFieldOptions(options, field.optionsSorting);
            } else { //It is an object that it's properties are options
                options = this._buildOptionsArrayFromObject(optionsSource);
                this._sortFieldOptions(options, field.optionsSorting);
            }

            return options;
        },

        /* Download options for a field from server.
        *************************************************************************/
        _downloadOptions: function (fieldName, url) {
            var self = this;
            var options = [];

            self._ajax({
                url: url,
                async: false,
                success: function (data) {
                    if (data.Result != 'OK') {
                        self._showError(data.Message);
                        return;
                    }

                    options = data.Options;
                },
                error: function () {
                    var errMessage = self._formatString(self.options.messages.cannotLoadOptionsFor, fieldName);
                    self._showError(errMessage);
                }
            });

            return options;
        },

        /* Sorts given options according to sorting parameter.
        *  sorting can be: 'value', 'value-desc', 'text' or 'text-desc'.
        *************************************************************************/
        _sortFieldOptions: function (options, sorting) {

            if ((!options) || (!options.length) || (!sorting)) {
                return;
            }

            //Determine using value of text
            var dataSelector;
            if (sorting.indexOf('value') == 0) {
                dataSelector = function (option) {
                    return option.Value;
                };
            } else { //assume as text
                dataSelector = function (option) {
                    return option.DisplayText;
                };
            }

            var compareFunc;
            if ($.type(dataSelector(options[0])) == 'string') {
                compareFunc = function (option1, option2) {
                    return dataSelector(option1).localeCompare(dataSelector(option2));
                };
            } else { //asuume as numeric
                compareFunc = function (option1, option2) {
                    return dataSelector(option1) - dataSelector(option2);
                };
            }

            if (sorting.indexOf('desc') > 0) {
                options.sort(function (a, b) {
                    return compareFunc(b, a);
                });
            } else { //assume as asc
                options.sort(function (a, b) {
                    return compareFunc(a, b);
                });
            }
        },

        /* Creates an array of options from given object.
        *************************************************************************/
        _buildOptionsArrayFromObject: function (options) {
            var list = [];

            $.each(options, function (propName, propValue) {
                list.push({
                    Value: propName,
                    DisplayText: propValue
                });
            });

            return list;
        },

        /* Creates array of options from giving options array.
        *************************************************************************/
        _buildOptionsFromArray: function (optionsArray) {
            var list = [];

            for (var i = 0; i < optionsArray.length; i++) {
                if ($.isPlainObject(optionsArray[i])) {
                    list.push(optionsArray[i]);
                } else { //assumed as primitive type (int, string...)
                    list.push({
                        Value: optionsArray[i],
                        DisplayText: optionsArray[i]
                    });
                }
            }

            return list;
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
                    parseInt(dateString.substr(6), 10)
                );
            } else if (dateString.length == 10) { //Format: 2011-01-01
                return new Date(
                    parseInt(dateString.substr(0, 4), 10),
                    parseInt(dateString.substr(5, 2), 10) - 1,
                    parseInt(dateString.substr(8, 2), 10)
                );
            } else if (dateString.length == 19) { //Format: 2011-01-01 20:32:42
                return new Date(
                    parseInt(dateString.substr(0, 4), 10),
                    parseInt(dateString.substr(5, 2), 10) - 1,
                    parseInt(dateString.substr(8, 2, 10)),
                    parseInt(dateString.substr(11, 2), 10),
                    parseInt(dateString.substr(14, 2), 10),
                    parseInt(dateString.substr(17, 2), 10)
                );
            } else {
                this._logWarn('Given date is not properly formatted: ' + dateString);
                return 'format error!';
            }
        },

        /* TOOL BAR *************************************************************/

        /* Creates the toolbar.
        *************************************************************************/
        _createToolBar: function () {
            this._$toolbarDiv = $('<div />')
            .addClass('jtable-toolbar')
            .appendTo(this._$titleDiv);

            for (var i = 0; i < this.options.toolbar.items.length; i++) {
                this._addToolBarItem(this.options.toolbar.items[i]);
            }
        },

        /* Adds a new item to the toolbar.
        *************************************************************************/
        _addToolBarItem: function (item) {

            //Check if item is valid
            if ((item == undefined) || (item.text == undefined && item.icon == undefined)) {
                this._logWarn('Can not add tool bar item since it is not valid!');
                this._logWarn(item);
                return null;
            }

            var $toolBarItem = $('<span></span>')
                .addClass('jtable-toolbar-item')
                .appendTo(this._$toolbarDiv);

            this._jqueryuiThemeAddClass($toolBarItem, 'ui-widget ui-state-default ui-corner-all', 'ui-state-hover');

            //cssClass property
            if (item.cssClass) {
                $toolBarItem
                    .addClass(item.cssClass);
            }

            //tooltip property
            if (item.tooltip) {
                $toolBarItem
                    .attr('title', item.tooltip);
            }

            //icon property
            if (item.icon) {
                var $icon = $('<span class="jtable-toolbar-item-icon"></span>').appendTo($toolBarItem);
                if (item.icon === true) {
                    //do nothing
                } else if ($.type(item.icon === 'string')) {
                    $icon.css('background', 'url("' + item.icon + '")');
                }
            }

            //text property
            if (item.text) {
                $('<span class=""></span>')
                    .html(item.text)
                    .addClass('jtable-toolbar-item-text').appendTo($toolBarItem);
            }

            //click event
            if (item.click) {
                $toolBarItem.click(function () {
                    item.click();
                });
            }

            //set hover animation parameters
            var hoverAnimationDuration = undefined;
            var hoverAnimationEasing = undefined;
            if (this.options.toolbar.hoverAnimation) {
                hoverAnimationDuration = this.options.toolbar.hoverAnimationDuration;
                hoverAnimationEasing = this.options.toolbar.hoverAnimationEasing;
            }

            //change class on hover
            $toolBarItem.hover(function () {
                $toolBarItem.addClass('jtable-toolbar-item-hover', hoverAnimationDuration, hoverAnimationEasing);
            }, function () {
                $toolBarItem.removeClass('jtable-toolbar-item-hover', hoverAnimationDuration, hoverAnimationEasing);
            });

            return $toolBarItem;
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
        _setBusyTimer: null,
        _showBusy: function (message, delay) {
            var self = this;  //

            //Show a transparent overlay to prevent clicking to the table
            self._$busyDiv
                .width(self._$mainContainer.width())
                .height(self._$mainContainer.height())
                .addClass('jtable-busy-panel-background-invisible')
                .show();

            var makeVisible = function () {
                self._$busyDiv.removeClass('jtable-busy-panel-background-invisible');
                self._$busyMessageDiv.html(message).show();
            };

            if (delay) {
                if (self._setBusyTimer) {
                    return;
                }

                self._setBusyTimer = setTimeout(makeVisible, delay);
            } else {
                makeVisible();
            }
        },

        /* Hides busy indicator and unblocks table UI.
        *************************************************************************/
        _hideBusy: function () {
            clearTimeout(this._setBusyTimer);
            this._setBusyTimer = null;
            this._$busyDiv.hide();
            this._$busyMessageDiv.html('').hide();
        },

        /* Returns true if jTable is busy.
        *************************************************************************/
        _isBusy: function () {
            return this._$busyMessageDiv.is(':visible');
        },

        /* Adds jQueryUI class to an item.
        *************************************************************************/
        _jqueryuiThemeAddClass: function ($elm, className, hoverClassName) {
            if (!this.options.jqueryuiTheme) {
                return;
            }

            $elm.addClass(className);

            if (hoverClassName) {
                $elm.hover(function () {
                    $elm.addClass(hoverClassName);
                }, function () {
                    $elm.removeClass(hoverClassName);
                });
            }
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

        _unAuthorizedRequestHandler: function() {
            if (this.options.unAuthorizedRequestRedirectUrl) {
                location.href = this.options.unAuthorizedRequestRedirectUrl;
            } else {
                location.reload(true);
            }
        },

        /* This method is used to perform AJAX calls in jTable instead of direct
        * usage of jQuery.ajax method.
        *************************************************************************/
        _ajax: function (options) {
            var self = this;

            //Handlers for HTTP status codes
            var opts = {
                statusCode: {
                    401: function () { //Unauthorized
                        self._unAuthorizedRequestHandler();
                    }
                }
            };

            opts = $.extend(opts, this.options.ajaxSettings, options);

            //Override success
            opts.success = function (data) {
                //Checking for Authorization error
                if (data && data.UnAuthorizedRequest == true) {
                    self._unAuthorizedRequestHandler();
                }

                if (options.success) {
                    options.success(data);
                }
            };

            //Override error
            opts.error = function (jqXHR, textStatus, errorThrown) {
                if (unloadingPage) {
                    jqXHR.abort();
                    return;
                }
                
                if (options.error) {
                    options.error(arguments);
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
        * COOKIE                                                                *
        *************************************************************************/

        /* Sets a cookie with given key.
        *************************************************************************/
        _setCookie: function (key, value) {
            key = this._cookieKeyPrefix + key;

            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + (10*365*24*60*60));
            document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) + "; expires=" + expireDate.toUTCString();
        },

        /* Gets a cookie with given key.
        *************************************************************************/
        _getCookie: function (key) {
            key = this._cookieKeyPrefix + key;

            var equalities = document.cookie.split('; ');
            for (var i = 0; i < equalities.length; i++) {
                if (!equalities[i]) {
                    continue;
                }

                var splitted = equalities[i].split('=');
                if (splitted.length != 2) {
                    continue;
                }

                if (decodeURIComponent(splitted[0]) === key) {
                    return decodeURIComponent(splitted[1] || '');
                }
            }

            return null;
        },

        /* Generates a hash key to be prefix for all cookies for this jtable instance.
        *************************************************************************/
        _generateCookieKeyPrefix: function () {

            var simpleHash = function (value) {
                var hash = 0;
                if (value.length == 0) {
                    return hash;
                }

                for (var i = 0; i < value.length; i++) {
                    var ch = value.charCodeAt(i);
                    hash = ((hash << 5) - hash) + ch;
                    hash = hash & hash;
                }

                return hash;
            };

            var strToHash = '';
            if (this.options.tableId) {
                strToHash = strToHash + this.options.tableId + '#';
            }

            strToHash = strToHash + this._columnList.join('$') + '#c' + this._$table.find('thead th').length;
            return 'jtable#' + simpleHash(strToHash);
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


/************************************************************************
* Some UTULITY methods used by jTable                                   *
*************************************************************************/
(function ($) {

    $.extend(true, $.hik.jtable.prototype, {

        /* Gets property value of an object recursively.
        *************************************************************************/
        _getPropertyOfObject: function (obj, propName) {
            if (propName.indexOf('.') < 0) {
                return obj[propName];
            } else {
                var preDot = propName.substring(0, propName.indexOf('.'));
                var postDot = propName.substring(propName.indexOf('.') + 1);
                return this._getPropertyOfObject(obj[preDot], postDot);
            }
        },

        /* Sets property value of an object recursively.
        *************************************************************************/
        _setPropertyOfObject: function (obj, propName, value) {
            if (propName.indexOf('.') < 0) {
                obj[propName] = value;
            } else {
                var preDot = propName.substring(0, propName.indexOf('.'));
                var postDot = propName.substring(propName.indexOf('.') + 1);
                this._setPropertyOfObject(obj[preDot], postDot, value);
            }
        },

        /* Inserts a value to an array if it does not exists in the array.
        *************************************************************************/
        _insertToArrayIfDoesNotExists: function (array, value) {
            if ($.inArray(value, array) < 0) {
                array.push(value);
            }
        },

        /* Finds index of an element in an array according to given comparision function
        *************************************************************************/
        _findIndexInArray: function (value, array, compareFunc) {

            //If not defined, use default comparision
            if (!compareFunc) {
                compareFunc = function (a, b) {
                    return a == b;
                };
            }

            for (var i = 0; i < array.length; i++) {
                if (compareFunc(value, array[i])) {
                    return i;
                }
            }

            return -1;
        },

        /* Normalizes a number between given bounds or sets to a defaultValue
        *  if it is undefined
        *************************************************************************/
        _normalizeNumber: function (number, min, max, defaultValue) {
            if (number == undefined || number == null || isNaN(number)) {
                return defaultValue;
            }

            if (number < min) {
                return min;
            }

            if (number > max) {
                return max;
            }

            return number;
        },

        /* Formats a string just like string.format in c#.
        *  Example:
        *  _formatString('Hello {0}','Halil') = 'Hello Halil'
        *************************************************************************/
        _formatString: function () {
            if (arguments.length == 0) {
                return null;
            }

            var str = arguments[0];
            for (var i = 1; i < arguments.length; i++) {
                var placeHolder = '{' + (i - 1) + '}';
                str = str.replace(placeHolder, arguments[i]);
            }

            return str;
        },

        /* Checks if given object is a jQuery Deferred object.
         */
        _isDeferredObject: function (obj) {
            return obj.then && obj.done && obj.fail;
        },

        //Logging methods ////////////////////////////////////////////////////////

        _logDebug: function (text) {
            if (!window.console) {
                return;
            }

            console.log('jTable DEBUG: ' + text);
        },

        _logInfo: function (text) {
            if (!window.console) {
                return;
            }

            console.log('jTable INFO: ' + text);
        },

        _logWarn: function (text) {
            if (!window.console) {
                return;
            }

            console.log('jTable WARNING: ' + text);
        },

        _logError: function (text) {
            if (!window.console) {
                return;
            }

            console.log('jTable ERROR: ' + text);
        }

    });

    /* Fix for array.indexOf method in IE7.
     * This code is taken from http://www.tutorialspoint.com/javascript/array_indexof.htm */
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elt) {
            var len = this.length;
            var from = Number(arguments[1]) || 0;
            from = (from < 0)
                 ? Math.ceil(from)
                 : Math.floor(from);
            if (from < 0)
                from += len;
            for (; from < len; from++) {
                if (from in this &&
                    this[from] === elt)
                    return from;
            }
            return -1;
        };
    }

})(jQuery);


/************************************************************************
* FORMS extension for jTable (base for edit/create forms)               *
*************************************************************************/
(function ($) {

    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Submits a form asynchronously using AJAX.
        *  This method is needed, since form submitting logic can be overrided
        *  by extensions.
        *************************************************************************/
        _submitFormUsingAjax: function (url, formData, success, error) {
            this._ajax({
                url: url,
                data: formData,
                success: success,
                error: error
            });
        },

        /* Creates label for an input element.
        *************************************************************************/
        _createInputLabelForRecordField: function (fieldName) {
            //TODO: May create label tag instead of a div.
            return $('<div />')
                .addClass('jtable-input-label')
                .html(this.options.fields[fieldName].inputTitle || this.options.fields[fieldName].title);
        },

        /* Creates an input element according to field type.
        *************************************************************************/
        _createInputForRecordField: function (funcParams) {
            var fieldName = funcParams.fieldName,
                value = funcParams.value,
                record = funcParams.record,
                formType = funcParams.formType,
                form = funcParams.form;

            //Get the field
            var field = this.options.fields[fieldName];

            //If value if not supplied, use defaultValue of the field
            if (value == undefined || value == null) {
                value = field.defaultValue;
            }

            //Use custom function if supplied
            if (field.input) {
                var $input = $(field.input({
                    value: value,
                    record: record,
                    formType: formType,
                    form: form
                }));

                //Add id attribute if does not exists
                if (!$input.attr('id')) {
                    $input.attr('id', 'Edit-' + fieldName);
                }

                //Wrap input element with div
                return $('<div />')
                    .addClass('jtable-input jtable-custom-input')
                    .append($input);
            }

            //Create input according to field type
            if (field.type == 'date') {
                return this._createDateInputForField(field, fieldName, value);
            } else if (field.type == 'textarea') {
                return this._createTextAreaForField(field, fieldName, value);
            }  else if (field.type == 'number') {
                return this._createNumberInputForField(field, fieldName, value);
            } else if (field.type == 'password') {
                return this._createPasswordInputForField(field, fieldName, value);
            } else if (field.type == 'checkbox') {
                return this._createCheckboxForField(field, fieldName, value);
            } else if (field.options) {
                if (field.type == 'radiobutton') {
                    return this._createRadioButtonListForField(field, fieldName, value, record, formType);
                } else {
                    return this._createDropDownListForField(field, fieldName, value, record, formType, form);
                }
            } else {
                return this._createTextInputForField(field, fieldName, value);
            }
        },

        //Creates a hidden input element with given name and value.
        _createInputForHidden: function (fieldName, value) {
            if (value == undefined) {
                value = "";
            }

            return $('<input type="hidden" name="' + fieldName + '" id="Edit-' + fieldName + '"></input>')
                .val(value);
        },

        /* Creates a date input for a field.
        *************************************************************************/
        _createDateInputForField: function (field, fieldName, value) {
            if (field.required) {
                var $input = $('<input class="' + field.inputClass + ' validate[required,custom[date]]" id="Edit-' + fieldName + '" type="text" name="' + fieldName + '"></input>');
            }
            else {
                var $input = $('<input class="' + field.inputClass + ' validate[custom[date]]" id="Edit-' + fieldName + '" type="text" name="' + fieldName + '"></input>');
            }
            
            if(field.inputSize)
                $input.attr("size", field.inputSize);
            
            if(value != undefined) {
                $input.val(value);
            }
            
            var displayFormat = field.displayFormat || this.options.defaultDateFormat;
            $input.datepicker({ dateFormat: displayFormat,changeMonth:true,changeYear:true });
            return $('<div />')
                .addClass('jtable-input jtable-date-input')
                .append($input);
        },

        /* Creates a textarea element for a field.
        *************************************************************************/
        _createTextAreaForField: function (field, fieldName, value) {
            if (field.required) {
                var $textArea = $('<textarea class="' + field.inputClass + ' validate[required]" id="Edit-' + fieldName + '" name="' + fieldName + '"></textarea>');
            }else{
                var $textArea = $('<textarea class="' + field.inputClass + '" id="Edit-' + fieldName + '" name="' + fieldName + '"></textarea>');    
            }
            
            if(field.inputSize)
                $input.attr("size", field.inputSize);
                
            if (value != undefined) {
                $textArea.val(value);
            }
            
            return $('<div />')
                .addClass('jtable-input jtable-textarea-input')
                .append($textArea);
        },

        /* Creates a standart number for a field.
        *************************************************************************/
        _createNumberInputForField: function (field, fieldName, value) {
            if (field.required) {
                var $input = $('<input class="' + field.inputClass + ' validate[required]" id="Edit-' + fieldName + '" type="number" name="' + fieldName + '"></input>');    
            }
            else {
                var $input = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="number" name="' + fieldName + '"></input>');    
            }
            
            if(field.inputSize)
                $input.attr("size", field.inputSize);
                
            if (value != undefined) {
                $input.val(value);
            }
            
            return $('<div />')
                .addClass('jtable-input jtable-number-input')
                .append($input).numeric(',');
        },
        
        /* Creates a standart textbox for a field.
        *************************************************************************/
        _createTextInputForField: function (field, fieldName, value) {
            if (field.required) {
                var $input = $('<input class="' + field.inputClass + ' validate[required]" id="Edit-' + fieldName + '" type="text" name="' + fieldName + '"></input>');
            }else{
                var $input = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="text" name="' + fieldName + '"></input>');
            }
            
            if(field.inputSize)
                $input.attr("size", field.inputSize);
                
            if(field.addMask)
                $input.mask(field.addMask);

            if (value != undefined) {
                $input.val(value);
            }
            
            return $('<div />')
                .addClass('jtable-input jtable-text-input')
                .append($input);
        },

        /* Creates a password input for a field.
        *************************************************************************/
        _createPasswordInputForField: function (field, fieldName, value) {
            if (field.required) {
                var $input = $('<input class="' + field.inputClass + ' validate[required]" id="Edit-' + fieldName + '" type="password" name="' + fieldName + '"></input>');
            }else{
                var $input = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="password" name="' + fieldName + '"></input>');
            }
            
            if(field.inputSize)
                $input.attr("size", field.inputSize);
                
            if (value != undefined) {
                $input.val(value);
            }
            
            return $('<div />')
                .addClass('jtable-input jtable-password-input')
                .append($input);
        },

        /* Creates a checkboxfor a field.
        *************************************************************************/
        _createCheckboxForField: function (field, fieldName, value) {
            var self = this;

            //If value is undefined, get unchecked state's value
            if (value == undefined) {
                value = self._getCheckBoxPropertiesForFieldByState(fieldName, false).Value;
            }

            //Create a container div
            var $containerDiv = $('<div />')
                .addClass('jtable-input jtable-checkbox-input');

            //Create checkbox and check if needed
            var $checkBox = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="checkbox" name="' + fieldName + '" />')
                .appendTo($containerDiv);
            if (value != undefined) {
                $checkBox.val(value);
            }

            //Create display text of checkbox for current state
            var $textSpan = $('<span>' + (field.formText || self._getCheckBoxTextForFieldByValue(fieldName, value)) + '</span>')
                .appendTo($containerDiv);

            //Check the checkbox if it's value is checked-value
            if (self._getIsCheckBoxSelectedForFieldByValue(fieldName, value)) {
                $checkBox.attr('checked', 'checked');
            }

            //This method sets checkbox's value and text according to state of the checkbox
            var refreshCheckBoxValueAndText = function () {
                var checkboxProps = self._getCheckBoxPropertiesForFieldByState(fieldName, $checkBox.is(':checked'));
                $checkBox.attr('value', checkboxProps.Value);
                $textSpan.html(field.formText || checkboxProps.DisplayText);
            };

            //Register to click event to change display text when state of checkbox is changed.
            $checkBox.click(function () {
                refreshCheckBoxValueAndText();
            });

            //Change checkbox state when clicked to text
            if (field.setOnTextClick != false) {
                $textSpan
                    .addClass('jtable-option-text-clickable')
                    .click(function () {
                        if ($checkBox.is(':checked')) {
                            $checkBox.attr('checked', false);
                        } else {
                            $checkBox.attr('checked', true);
                        }

                        refreshCheckBoxValueAndText();
                    });
            }

            return $containerDiv;
        },

        /* Creates a drop down list (combobox) input element for a field.
        *************************************************************************/
        _createDropDownListForField: function (field, fieldName, value, record, source, form) {

            //Create a container div
            var $containerDiv = $('<div />')
                .addClass('jtable-input jtable-dropdown-input');

            //Create select element
            var $select = $('<select class="' + field.inputClass + '" id="Edit-' + fieldName + '" name="' + fieldName + '"></select>')
                .appendTo($containerDiv);

            //add options
            var options = this._getOptionsForField(fieldName, {
                record: record,
                source: source,
                form: form,
                dependedValues: this._createDependedValuesUsingForm(form, field.dependsOn)
            });

            this._fillDropDownListWithOptions($select, options, value);

            return $containerDiv;
        },
        
        /* Fills a dropdown list with given options.
        *************************************************************************/
        _fillDropDownListWithOptions: function ($select, options, value) {
            $select.empty();
            for (var i = 0; i < options.length; i++) {
                $('<option' + (options[i].Value == value ? ' selected="selected"' : '') + '>' + options[i].DisplayText + '</option>')
                    .val(options[i].Value)
                    .appendTo($select);
            }
        },

        /* Creates depended values object from given form.
        *************************************************************************/
        _createDependedValuesUsingForm: function ($form, dependsOn) {
            if (!dependsOn) {
                return {};
            }

            var dependedValues = {};

            for (var i = 0; i < dependsOn.length; i++) {
                var dependedField = dependsOn[i];

                var $dependsOn = $form.find('select[name=' + dependedField + ']');
                if ($dependsOn.length <= 0) {
                    continue;
                }

                dependedValues[dependedField] = $dependsOn.val();
            }


            return dependedValues;
        },

        /* Creates a radio button list for a field.
        *************************************************************************/
        _createRadioButtonListForField: function (field, fieldName, value, record, source) {
            var $containerDiv = $('<div />')
                .addClass('jtable-input jtable-radiobuttonlist-input');

            var options = this._getOptionsForField(fieldName, {
                record: record,
                source: source
            });

            $.each(options, function(i, option) {
                var $radioButtonDiv = $('<div class=""></div>')
                    .addClass('jtable-radio-input')
                    .appendTo($containerDiv);

                var $radioButton = $('<input type="radio" id="Edit-' + fieldName + '-' + i + '" class="' + field.inputClass + '" name="' + fieldName + '"' + ((option.Value == (value + '')) ? ' checked="true"' : '') + ' />')
                    .val(option.Value)
                    .appendTo($radioButtonDiv);

                var $textSpan = $('<span></span>')
                    .html(option.DisplayText)
                    .appendTo($radioButtonDiv);

                if (field.setOnTextClick != false) {
                    $textSpan
                        .addClass('jtable-option-text-clickable')
                        .click(function () {
                            if (!$radioButton.is(':checked')) {
                                $radioButton.attr('checked', true);
                            }
                        });
                }
            });

            return $containerDiv;
        },

        /* Gets display text for a checkbox field.
        *************************************************************************/
        _getCheckBoxTextForFieldByValue: function (fieldName, value) {
            return this.options.fields[fieldName].values[value];
        },

        /* Returns true if given field's value must be checked state.
        *************************************************************************/
        _getIsCheckBoxSelectedForFieldByValue: function (fieldName, value) {
            return (this._createCheckBoxStateArrayForFieldWithCaching(fieldName)[1].Value.toString() == value.toString());
        },

        /* Gets an object for a checkbox field that has Value and DisplayText
        *  properties.
        *************************************************************************/
        _getCheckBoxPropertiesForFieldByState: function (fieldName, checked) {
            return this._createCheckBoxStateArrayForFieldWithCaching(fieldName)[(checked ? 1 : 0)];
        },

        /* Calls _createCheckBoxStateArrayForField with caching.
        *************************************************************************/
        _createCheckBoxStateArrayForFieldWithCaching: function (fieldName) {
            var cacheKey = 'checkbox_' + fieldName;
            if (!this._cache[cacheKey]) {

                this._cache[cacheKey] = this._createCheckBoxStateArrayForField(fieldName);
            }

            return this._cache[cacheKey];
        },

        /* Creates a two element array of objects for states of a checkbox field.
        *  First element for unchecked state, second for checked state.
        *  Each object has two properties: Value and DisplayText
        *************************************************************************/
        _createCheckBoxStateArrayForField: function (fieldName) {
            var stateArray = [];
            var currentIndex = 0;
            $.each(this.options.fields[fieldName].values, function (propName, propValue) {
                if (currentIndex++ < 2) {
                    stateArray.push({ 'Value': propName, 'DisplayText': propValue });
                }
            });

            return stateArray;
        },

        /* Searches a form for dependend dropdowns and makes them cascaded.
        */
        _makeCascadeDropDowns: function ($form, record, source) {
            var self = this;

            $form.find('select') //for each combobox
                .each(function () {
                    var $thisDropdown = $(this);

                    //get field name
                    var fieldName = $thisDropdown.attr('name');
                    if (!fieldName) {
                        return;
                    }

                    var field = self.options.fields[fieldName];
                    
                    //check if this combobox depends on others
                    if (!field.dependsOn) {
                        return;
                    }

                    //for each dependency
                    $.each(field.dependsOn, function (index, dependsOnField) {
                        //find the depended combobox
                        var $dependsOnDropdown = $form.find('select[name=' + dependsOnField + ']');
                        //when depended combobox changes
                        $dependsOnDropdown.change(function () {

                            //Refresh options
                            var funcParams = {
                                record: record,
                                source: source,
                                form: $form,
                                dependedValues: {}
                            };
                            funcParams.dependedValues = self._createDependedValuesUsingForm($form, field.dependsOn);
                            var options = self._getOptionsForField(fieldName, funcParams);

                            //Fill combobox with new options
                            self._fillDropDownListWithOptions($thisDropdown, options, undefined);

                            //Thigger change event to refresh multi cascade dropdowns.
                            $thisDropdown.change();
                        });
                    });
                });
        },

        /* Updates values of a record from given form
        *************************************************************************/
        _updateRecordValuesFromForm: function (record, $form) {
            for (var i = 0; i < this._fieldList.length; i++) {
                var fieldName = this._fieldList[i];
                var field = this.options.fields[fieldName];

                //Do not update non-editable fields
                if (field.edit == false) {
                    continue;
                }

                //Get field name and the input element of this field in the form
                var $inputElement = $form.find('[name="' + fieldName + '"]');
                if ($inputElement.length <= 0) {
                    continue;
                }

                //Update field in record according to it's type
                if (field.type == 'date') {
                    var dateVal = $inputElement.val();
                    if (dateVal) {
                        var displayFormat = field.displayFormat || this.options.defaultDateFormat;
                        try {
                            var date = $.datepicker.parseDate(displayFormat, dateVal);
                            record[fieldName] = '/Date(' + date.getTime() + ')/';
                        } catch (e) {
                            //TODO: Handle incorrect/different date formats
                            this._logWarn('Date format is incorrect for field ' + fieldName + ': ' + dateVal);
                            record[fieldName] = undefined;
                        }
                    } else {
                        this._logDebug('Date is empty for ' + fieldName);
                        record[fieldName] = undefined; //TODO: undefined, null or empty string?
                    }
                } else if (field.options && field.type == 'radiobutton') {
                    var $checkedElement = $inputElement.filter(':checked');
                    if ($checkedElement.length) {
                        record[fieldName] = $checkedElement.val();
                    } else {
                        record[fieldName] = undefined;
                    }
                } else {
                    record[fieldName] = $inputElement.val();
                }
            }
        },

        /* Sets enabled/disabled state of a dialog button.
        *************************************************************************/
        _setEnabledOfDialogButton: function ($button, enabled, buttonText) {
            if (!$button) {
                return;
            }

            if (enabled != false) {
                $button
                    .removeAttr('disabled')
                    .removeClass('ui-state-disabled');
            } else {
                $button
                    .attr('disabled', 'disabled')
                    .addClass('ui-state-disabled');
            }

            if (buttonText) {
                $button
                    .find('span')
                    .text(buttonText);
            }
        }

    });

})(jQuery);


/************************************************************************
* CREATE RECORD extension for jTable                                    *
*************************************************************************/
(function ($) {

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

            //Events
            recordAdded: function (event, data) { },

            //Localization
            messages: {
                addNewRecord: 'Add new record'
            },
            
            validationOptions : {
                promptPosition : "bottomRight",
                autoPositionUpdate : true
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$addRecordDiv: null, //Reference to the adding new record dialog div (jQuery object)

        /************************************************************************
        * CONSTRUCTOR                                                           *
        *************************************************************************/

        /* Overrides base method to do create-specific constructions.
        *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);

            if (!this.options.actions.createAction) {
                return;
            }

            this._createAddRecordDialogDiv();
        },

        /* Creates and prepares add new record dialog div
        *************************************************************************/
        _createAddRecordDialogDiv: function () {
            var self = this;

            //Create a div for dialog and add to container element
            self._$addRecordDiv = $('<div />')
                .appendTo(self._$mainContainer);

            //Prepare dialog
            self._$addRecordDiv.dialog({
                appendTo: self._$mainContainer,
                autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                width: 'auto',
                minWidth: '300',
                modal: true,
                title: self.options.messages.addNewRecord,
                buttons:
                        [{ //Cancel button
                            text: self.options.messages.cancel,
                            click: function () {
                                self._$addRecordDiv.dialog('close');
                            }
                        }, { //Save button
                            id: 'AddRecordDialogSaveButton',
                            text: self.options.messages.save,
                            click: function () {
                                self._onSaveClickedOnCreateForm();
                            }
                        }],
                close: function () {
                    var $addRecordForm = self._$addRecordDiv.find('form').first();
                    var $saveButton = self._$addRecordDiv.parent().find('#AddRecordDialogSaveButton');
                    self._trigger("formClosed", null, { form: $addRecordForm, formType: 'create' });
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    $addRecordForm.remove();
                }
            });

            if (self.options.addRecordButton) {
                //If user supplied a button, bind the click event to show dialog form
                self.options.addRecordButton.click(function (e) {
                    e.preventDefault();
                    self._showAddRecordForm();
                });
            } else {
                //If user did not supplied a button, create a 'add record button' toolbar item.
                self._addToolBarItem({
                    icon: true,
                    cssClass: 'jtable-toolbar-item-add-record',
                    text: self.options.messages.addNewRecord,
                    click: function () {
                        self._showAddRecordForm();
                    }
                });
            }
        },

        _onSaveClickedOnCreateForm: function () {
            var self = this;

            var $saveButton = self._$addRecordDiv.parent().find('#AddRecordDialogSaveButton');
            var $addRecordForm = self._$addRecordDiv.find('form');
            
            if (self._trigger("formSubmitting", null, { form: $addRecordForm, formType: 'create' }) != false) {
                self._setEnabledOfDialogButton($saveButton, false, self.options.messages.saving);
                self._saveAddRecordForm($addRecordForm, $saveButton);
            }
        },

        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* Shows add new record dialog form.
        *************************************************************************/
        showCreateForm: function () {
            this._showAddRecordForm();
        },

        /* Adds a new record to the table (optionally to the server also)
        *************************************************************************/
        addRecord: function (options) {
            var self = this;
            options = $.extend({
                clientOnly: false,
                animationsEnabled: self.options.animationsEnabled,
                success: function () { },
                error: function () { }
            }, options);

            if (!options.record) {
                self._logWarn('options parameter in addRecord method must contain a record property.');
                return;
            }

            if (options.clientOnly) {
                self._addRow(
                    self._createRowFromRecord(options.record), {
                        isNewRow: true,
                        animationsEnabled: options.animationsEnabled
                    });

                options.success();
                return;
            }

            var completeAddRecord = function (data) {
                if (data.Result != 'OK') {
                    self._showError(data.Message);
                    options.error(data);
                    return;
                }

                if (!data.Record) {
                    self._logError('Server must return the created Record object.');
                    options.error(data);
                    return;
                }

                self._onRecordAdded(data);
                self._addRow(
                    self._createRowFromRecord(data.Record), {
                        isNewRow: true,
                        animationsEnabled: options.animationsEnabled
                    });

                options.success(data);
            };

            //createAction may be a function, check if it is
            if (!options.url && $.isFunction(self.options.actions.createAction)) {

                //Execute the function
                var funcResult = self.options.actions.createAction($.param(options.record));

                //Check if result is a jQuery Deferred object
                if (self._isDeferredObject(funcResult)) {
                    //Wait promise
                    funcResult.done(function (data) {
                        completeAddRecord(data);
                    }).fail(function () {
                        self._showError(self.options.messages.serverCommunicationError);
                        options.error();
                    });
                } else { //assume it returned the creation result
                    completeAddRecord(funcResult);
                }

            } else { //Assume it's a URL string

                //Make an Ajax call to create record
                self._submitFormUsingAjax(
                    options.url || self.options.actions.createAction,
                    $.param(options.record),
                    function (data) {
                        completeAddRecord(data);
                    },
                    function () {
                        self._showError(self.options.messages.serverCommunicationError);
                        options.error();
                    });

            }
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Shows add new record dialog form.
        *************************************************************************/
        _showAddRecordForm: function () {
            var self = this;

            //Create add new record form
            var $addRecordForm = $('<form id="jtable-create-form" class="jtable-dialog-form jtable-create-form"></form>');

            //Create input elements
            for (var i = 0; i < self._fieldList.length; i++) {

                var fieldName = self._fieldList[i];
                var field = self.options.fields[fieldName];

                //Do not create input for fields that is key and not specially marked as creatable
                if (field.key == true && field.create != true) {
                    continue;
                }

                //Do not create input for fields that are not creatable
                if (field.create == false) {
                    continue;
                }

                if (field.type == 'hidden') {
                    $addRecordForm.append(self._createInputForHidden(fieldName, field.defaultValue));
                    continue;
                }

                //Create a container div for this input field and add to form
                var $fieldContainer = $('<div />')
                    .addClass('jtable-input-field-container')
                    .appendTo($addRecordForm);

                //Create a label for input
                $fieldContainer.append(self._createInputLabelForRecordField(fieldName));

                //Create input element
                $fieldContainer.append(
                    self._createInputForRecordField({
                        fieldName: fieldName,
                        formType: 'create',
                        form: $addRecordForm
                    }));
            }

            self._makeCascadeDropDowns($addRecordForm, undefined, 'create');

            $addRecordForm.submit(function () {
                
                self._onSaveClickedOnCreateForm();
                return false;
            });

            //Open the form
            self._$addRecordDiv.append($addRecordForm).dialog('open');
            $('#jtable-create-form').validationEngine('attach',{ promptPosition: self.options.validationOptions.promptPosition ,autoPositionUpdate :self.options.validationOptions.autoPositionUpdate});
            self._trigger("formCreated", null, { form: $addRecordForm, formType: 'create' });
        },

        /* Saves new added record to the server and updates table.
        *************************************************************************/
        _saveAddRecordForm: function ($addRecordForm, $saveButton) {
            var self = this;

            var completeAddRecord = function (data) {
                if (data.Result != 'OK') {
                    self._showError(data.Message);
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    return;
                }

                if (!data.Record) {
                    self._logError('Server must return the created Record object.');
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    return;
                }

                self._onRecordAdded(data);
                self._addRow(
                    self._createRowFromRecord(data.Record), {
                        isNewRow: true
                    });
                self._$addRecordDiv.dialog("close");
            };

            $addRecordForm.data('submitting', true); //TODO: Why it's used, can remove? Check it.

            //createAction may be a function, check if it is
            if ($.isFunction(self.options.actions.createAction)) {

                //Execute the function
                var funcResult = self.options.actions.createAction($addRecordForm.serialize());

                //Check if result is a jQuery Deferred object
                if (self._isDeferredObject(funcResult)) {
                    //Wait promise
                    funcResult.done(function (data) {
                        completeAddRecord(data);
                    }).fail(function () {
                        self._showError(self.options.messages.serverCommunicationError);
                        self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    });
                } else { //assume it returned the creation result
                    completeAddRecord(funcResult);
                }

            } else { //Assume it's a URL string

                //Make an Ajax call to create record
                self._submitFormUsingAjax(
                    self.options.actions.createAction,
                    $addRecordForm.serialize(),
                    function (data) {
                        completeAddRecord(data);
                    },
                    function () {
                        self._showError(self.options.messages.serverCommunicationError);
                        self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    });
            }
        },

        _onRecordAdded: function (data) {
            this._trigger("recordAdded", null, { record: data.Record, serverResponse: data });
        }

    });

})(jQuery);


/************************************************************************
* EDIT RECORD extension for jTable                                      *
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
                editRecord: 'Edit Record'
            },
            
            validationOptions : {
                promptPosition : "bottomRight",
                autoPositionUpdate : true
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$editDiv: null, //Reference to the editing dialog div (jQuery object)
        _$editingRow: null, //Reference to currently editing row (jQuery object)

        /************************************************************************
        * CONSTRUCTOR AND INITIALIZATION METHODS                                *
        *************************************************************************/

        /* Overrides base method to do editing-specific constructions.
        *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);
            
            if (!this.options.actions.updateAction) {
                return;
            }
            
            this._createEditDialogDiv();
        },

        /* Creates and prepares edit dialog div
        *************************************************************************/
        _createEditDialogDiv: function () {
            var self = this;

            //Create a div for dialog and add to container element
            self._$editDiv = $('<div></div>')
                .appendTo(self._$mainContainer);

            //Prepare dialog
            self._$editDiv.dialog({
                appendTo: self._$mainContainer,
                autoOpen: false,
                show: self.options.dialogShowEffect,
                hide: self.options.dialogHideEffect,
                width: 'auto',
                minWidth: '300',
                modal: true,
                title: self.options.messages.editRecord,
                buttons:
                        [{  //cancel button
                            text: self.options.messages.cancel,
                            click: function () {
                                self._$editDiv.dialog('close');
                            }
                        }, { //save button
                            id: 'EditDialogSaveButton',
                            text: self.options.messages.save,
                            click: function () {
                                self._onSaveClickedOnEditForm();
                            }
                        }],
                close: function () {
                    var $editForm = self._$editDiv.find('form:first');
                    var $saveButton = self._$editDiv.parent().find('#EditDialogSaveButton');
                    self._trigger("formClosed", null, { form: $editForm, formType: 'edit', row: self._$editingRow });
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    $editForm.remove();
                }
            });
        },

        /* Saves editing form to server.
        *************************************************************************/
        _onSaveClickedOnEditForm: function () {
            var self = this;
            //row maybe removed by another source, if so, do nothing
            if (self._$editingRow.hasClass('jtable-row-removed')) {
                self._$editDiv.dialog('close');
                return;
            }

            var $saveButton = self._$editDiv.parent().find('#EditDialogSaveButton');
            var $editForm = self._$editDiv.find('form');

            if (self._trigger("formSubmitting", null, { form: $editForm, formType: 'edit', row: self._$editingRow }) != false) {
                self._setEnabledOfDialogButton($saveButton, false, self.options.messages.saving);
                self._saveEditForm($editForm, $saveButton);
            }
        },

        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* Updates a record on the table (optionally on the server also)
        *************************************************************************/
        updateRecord: function (options) {
            var self = this;
            options = $.extend({
                clientOnly: false,
                animationsEnabled: self.options.animationsEnabled,
                success: function () { },
                error: function () { }
            }, options);

            if (!options.record) {
                self._logWarn('options parameter in updateRecord method must contain a record property.');
                return;
            }

            var key = self._getKeyValueOfRecord(options.record);
            if (key == undefined || key == null) {
                self._logWarn('options parameter in updateRecord method must contain a record that contains the key field property.');
                return;
            }

            var $updatingRow = self.getRowByKey(key);
            if ($updatingRow == null) {
                self._logWarn('Can not found any row by key "' + key + '" on the table. Updating row must be visible on the table.');
                return;
            }

            if (options.clientOnly) {
                $.extend($updatingRow.data('record'), options.record);
                self._updateRowTexts($updatingRow);
                self._onRecordUpdated($updatingRow, null);
                if (options.animationsEnabled) {
                    self._showUpdateAnimationForRow($updatingRow);
                }

                options.success();
                return;
            }

            var completeEdit = function (data) {
                if (data.Result != 'OK') {
                    self._showError(data.Message);
                    options.error(data);
                    return;
                }

                $.extend($updatingRow.data('record'), options.record);
                self._updateRecordValuesFromServerResponse($updatingRow.data('record'), data);

                self._updateRowTexts($updatingRow);
                self._onRecordUpdated($updatingRow, data);
                if (options.animationsEnabled) {
                    self._showUpdateAnimationForRow($updatingRow);
                }

                options.success(data);
            };

            //updateAction may be a function, check if it is
            if (!options.url && $.isFunction(self.options.actions.updateAction)) {

                //Execute the function
                var funcResult = self.options.actions.updateAction($.param(options.record));

                //Check if result is a jQuery Deferred object
                if (self._isDeferredObject(funcResult)) {
                    //Wait promise
                    funcResult.done(function (data) {
                        completeEdit(data);
                    }).fail(function () {
                        self._showError(self.options.messages.serverCommunicationError);
                        options.error();
                    });
                } else { //assume it returned the creation result
                    completeEdit(funcResult);
                }

            } else { //Assume it's a URL string

                //Make an Ajax call to create record
                self._submitFormUsingAjax(
                    options.url || self.options.actions.updateAction,
                    $.param(options.record),
                    function (data) {
                        completeEdit(data);
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

        /* Overrides base method to add a 'editing column cell' to header row.
        *************************************************************************/
        _addColumnsToHeaderRow: function ($tr) {
            base._addColumnsToHeaderRow.apply(this, arguments);
            if (this.options.actions.updateAction != undefined) {
                $tr.append(this._createEmptyCommandHeader());
            }
        },

        /* Overrides base method to add a 'edit command cell' to a row.
        *************************************************************************/
        _addCellsToRowUsingRecord: function ($row) {
            var self = this;
            base._addCellsToRowUsingRecord.apply(this, arguments);

            if (self.options.actions.updateAction != undefined) {
                var $span = $('<span></span>').html(self.options.messages.editRecord);
                var $button = $('<button title="' + self.options.messages.editRecord + '"></button>')
                    .addClass('jtable-command-button jtable-edit-command-button')
                    .append($span)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._showEditForm($row);
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

        /* Shows edit form for a row.
        *************************************************************************/
        _showEditForm: function ($tableRow) {
            var self = this;
            var record = $tableRow.data('record');

            //Create edit form
            var $editForm = $('<form id="jtable-edit-form" class="jtable-dialog-form jtable-edit-form"></form>');

            //Create input fields
            for (var i = 0; i < self._fieldList.length; i++) {

                var fieldName = self._fieldList[i];
                var field = self.options.fields[fieldName];
                var fieldValue = record[fieldName];

                if (field.key == true) {
                    if (field.edit != true) {
                        //Create hidden field for key
                        $editForm.append(self._createInputForHidden(fieldName, fieldValue));
                        continue;
                    } else {
                        //Create a special hidden field for key (since key is be editable)
                        $editForm.append(self._createInputForHidden('jtRecordKey', fieldValue));
                    }
                }

                //Do not create element for non-editable fields
                if (field.edit == false) {
                    continue;
                }

                //Hidden field
                if (field.type == 'hidden') {
                    $editForm.append(self._createInputForHidden(fieldName, fieldValue));
                    continue;
                }

                //Create a container div for this input field and add to form
                var $fieldContainer = $('<div class="jtable-input-field-container"></div>').appendTo($editForm);

                //Create a label for input
                $fieldContainer.append(self._createInputLabelForRecordField(fieldName));

                //Create input element with it's current value
                var currentValue = self._getValueForRecordField(record, fieldName);
                $fieldContainer.append(
                    self._createInputForRecordField({
                        fieldName: fieldName,
                        value: currentValue,
                        record: record,
                        formType: 'edit',
                        form: $editForm
                    }));
            }
            
            self._makeCascadeDropDowns($editForm, record, 'edit');

            $editForm.submit(function () {
                self._onSaveClickedOnEditForm();
                return false;
            });

            //Open dialog
            self._$editingRow = $tableRow;
            self._$editDiv.append($editForm).dialog('open');
            $('#jtable-edit-form').validationEngine('attach',{promptPosition: self.options.validationOptions.promptPosition,autoPositionUpdate :self.options.validationOptions.autoPositionUpdate});
            self._trigger("formCreated", null, { form: $editForm, formType: 'edit', record: record, row: $tableRow });
        },

        /* Saves editing form to the server and updates the record on the table.
        *************************************************************************/
        _saveEditForm: function ($editForm, $saveButton) {
            var self = this;
            
            var completeEdit = function (data) {
                if (data.Result != 'OK') {
                    self._showError(data.Message);
                    self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    return;
                }

                var record = self._$editingRow.data('record');

                self._updateRecordValuesFromForm(record, $editForm);
                self._updateRecordValuesFromServerResponse(record, data);
                self._updateRowTexts(self._$editingRow);

                self._$editingRow.attr('data-record-key', self._getKeyValueOfRecord(record));

                self._onRecordUpdated(self._$editingRow, data);

                if (self.options.animationsEnabled) {
                    self._showUpdateAnimationForRow(self._$editingRow);
                }

                self._$editDiv.dialog("close");
            };


            //updateAction may be a function, check if it is
            if ($.isFunction(self.options.actions.updateAction)) {

                //Execute the function
                var funcResult = self.options.actions.updateAction($editForm.serialize());

                //Check if result is a jQuery Deferred object
                if (self._isDeferredObject(funcResult)) {
                    //Wait promise
                    funcResult.done(function (data) {
                        completeEdit(data);
                    }).fail(function () {
                        self._showError(self.options.messages.serverCommunicationError);
                        self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    });
                } else { //assume it returned the creation result
                    completeEdit(funcResult);
                }

            } else { //Assume it's a URL string

                //Make an Ajax call to update record
                self._submitFormUsingAjax(
                    self.options.actions.updateAction,
                    $editForm.serialize(),
                    function(data) {
                        completeEdit(data);
                    },
                    function() {
                        self._showError(self.options.messages.serverCommunicationError);
                        self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
                    });
            }

        },

        /* This method ensures updating of current record with server response,
        * if server sends a Record object as response to updateAction.
        *************************************************************************/
        _updateRecordValuesFromServerResponse: function (record, serverResponse) {
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

        /* Updates cells of a table row's text values from row's record values.
        *************************************************************************/
        _updateRowTexts: function ($tableRow) {
            var record = $tableRow.data('record');
            var $columns = $tableRow.find('td');
            for (var i = 0; i < this._columnList.length; i++) {
                var displayItem = this._getDisplayTextForRecordField(record, this._columnList[i]);
                if ((displayItem != "") && (displayItem == 0)) displayItem = "0";
                $columns.eq(this._firstDataColumnOffset + i).html(displayItem || '');
            }

            this._onRowUpdated($tableRow);
        },

        /* Shows 'updated' animation for a table row.
        *************************************************************************/
        _showUpdateAnimationForRow: function ($tableRow) {
            var className = 'jtable-row-updated';
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


/************************************************************************
* DELETION extension for jTable                                         *
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
            deleteConfirmation: true,

            //Events
            recordDeleted: function (event, data) { },

            //Localization
            messages: {
                deleteConfirmation: 'This record will be deleted. Are you sure?',
                deleteText: 'Delete',
                deleting: 'Deleting',
                canNotDeletedRecords: 'Can not delete {0} of {1} records!',
                deleteProggress: 'Deleting {0} of {1} records, processing...'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$deleteRecordDiv: null, //Reference to the adding new record dialog div (jQuery object)
        _$deletingRow: null, //Reference to currently deleting row (jQuery object)

        /************************************************************************
        * CONSTRUCTOR                                                           *
        *************************************************************************/

        /* Overrides base method to do deletion-specific constructions.
        *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);
            this._createDeleteDialogDiv();
        },

        /* Creates and prepares delete record confirmation dialog div.
        *************************************************************************/
        _createDeleteDialogDiv: function () {
            var self = this;

            //Check if deleteAction is supplied
            if (!self.options.actions.deleteAction) {
                return;
            }

            //Create div element for delete confirmation dialog
            self._$deleteRecordDiv = $('<div><p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span><span class="jtable-delete-confirm-message"></span></p></div>').appendTo(self._$mainContainer);

            //Prepare dialog
            self._$deleteRecordDiv.dialog({
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
                                self._$deleteRecordDiv.dialog("close");
                            }
                        }, {//delete button
                            id: 'DeleteDialogButton',
                            text: self.options.messages.deleteText,
                            click: function () {

                                //row maybe removed by another source, if so, do nothing
                                if (self._$deletingRow.hasClass('jtable-row-removed')) {
                                    self._$deleteRecordDiv.dialog('close');
                                    return;
                                }

                                var $deleteButton = self._$deleteRecordDiv.parent().find('#DeleteDialogButton');
                                self._setEnabledOfDialogButton($deleteButton, false, self.options.messages.deleting);
                                self._deleteRecordFromServer(
                                    self._$deletingRow,
                                    function () {
                                        self._removeRowsFromTableWithAnimation(self._$deletingRow);
                                        self._$deleteRecordDiv.dialog('close');
                                    },
                                    function (message) { //error
                                        self._showError(message);
                                        self._setEnabledOfDialogButton($deleteButton, true, self.options.messages.deleteText);
                                    }
                                );
                            }
                        }],
                close: function () {
                    var $deleteButton = self._$deleteRecordDiv.parent().find('#DeleteDialogButton');
                    self._setEnabledOfDialogButton($deleteButton, true, self.options.messages.deleteText);
                }
            });
        },

        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* This method is used to delete one or more rows from server and the table.
        *************************************************************************/
        deleteRows: function ($rows) {
            var self = this;

            if ($rows.length <= 0) {
                self._logWarn('No rows specified to jTable deleteRows method.');
                return;
            }

            if (self._isBusy()) {
                self._logWarn('Can not delete rows since jTable is busy!');
                return;
            }

            //Deleting just one row
            if ($rows.length == 1) {
                self._deleteRecordFromServer(
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

            //Deleting multiple rows
            self._showBusy(self._formatString(self.options.messages.deleteProggress, 0, $rows.length));

            //This method checks if deleting of all records is completed
            var completedCount = 0;
            var isCompleted = function () {
                return (completedCount >= $rows.length);
            };

            //This method is called when deleting of all records completed
            var completed = function () {
                var $deletedRows = $rows.filter('.jtable-row-ready-to-remove');
                if ($deletedRows.length < $rows.length) {
                    self._showError(self._formatString(self.options.messages.canNotDeletedRecords, $rows.length - $deletedRows.length, $rows.length));
                }

                if ($deletedRows.length > 0) {
                    self._removeRowsFromTableWithAnimation($deletedRows);
                }

                self._hideBusy();
            };

            //Delete all rows
            var deletedCount = 0;
            $rows.each(function () {
                var $row = $(this);
                self._deleteRecordFromServer(
                    $row,
                    function () { //success
                        ++deletedCount; ++completedCount;
                        $row.addClass('jtable-row-ready-to-remove');
                        self._showBusy(self._formatString(self.options.messages.deleteProggress, deletedCount, $rows.length));
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

        /* Deletes a record from the table (optionally from the server also).
        *************************************************************************/
        deleteRecord: function (options) {
            var self = this;
            options = $.extend({
                clientOnly: false,
                animationsEnabled: self.options.animationsEnabled,
                url: self.options.actions.deleteAction,
                success: function () { },
                error: function () { }
            }, options);

            if (options.key == undefined) {
                self._logWarn('options parameter in deleteRecord method must contain a key property.');
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

            self._deleteRecordFromServer(
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
            if (this.options.actions.deleteAction != undefined) {
                $tr.append(this._createEmptyCommandHeader());
            }
        },

        /* Overrides base method to add a 'delete command cell' to a row.
        *************************************************************************/
        _addCellsToRowUsingRecord: function ($row) {
            base._addCellsToRowUsingRecord.apply(this, arguments);

            var self = this;
            if (self.options.actions.deleteAction != undefined) {
                var $span = $('<span></span>').html(self.options.messages.deleteText);
                var $button = $('<button title="' + self.options.messages.deleteText + '"></button>')
                    .addClass('jtable-command-button jtable-delete-command-button')
                    .append($span)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._deleteButtonClickedForRow($row);
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

        /* This method is called when user clicks delete button on a row.
        *************************************************************************/
        _deleteButtonClickedForRow: function ($row) {
            var self = this;

            var deleteConfirm;
            var deleteConfirmMessage = self.options.messages.deleteConfirmation;

            //If options.deleteConfirmation is function then call it
            if ($.isFunction(self.options.deleteConfirmation)) {
                var data = { row: $row, record: $row.data('record'), deleteConfirm: true, deleteConfirmMessage: deleteConfirmMessage, cancel: false, cancelMessage: null };
                self.options.deleteConfirmation(data);

                //If delete progress is cancelled
                if (data.cancel) {

                    //If a canlellation reason is specified
                    if (data.cancelMessage) {
                        self._showError(data.cancelMessage); //TODO: show warning/stop message instead of error (also show warning/error ui icon)!
                    }

                    return;
                }

                deleteConfirmMessage = data.deleteConfirmMessage;
                deleteConfirm = data.deleteConfirm;
            } else {
                deleteConfirm = self.options.deleteConfirmation;
            }

            if (deleteConfirm != false) {
                //Confirmation
                self._$deleteRecordDiv.find('.jtable-delete-confirm-message').html(deleteConfirmMessage);
                self._showDeleteDialog($row);
            } else {
                //No confirmation
                self._deleteRecordFromServer(
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

        /* Shows delete comfirmation dialog.
        *************************************************************************/
        _showDeleteDialog: function ($row) {
            this._$deletingRow = $row;
            this._$deleteRecordDiv.dialog('open');
        },

        /* Performs an ajax call to server to delete record
        *  and removes row of the record from table if ajax call success.
        *************************************************************************/
        _deleteRecordFromServer: function ($row, success, error, url) {
            var self = this;

            var completeDelete = function(data) {
                if (data.Result != 'OK') {
                    $row.data('deleting', false);
                    if (error) {
                        error(data.Message);
                    }

                    return;
                }

                self._trigger("recordDeleted", null, { record: $row.data('record'), row: $row, serverResponse: data });

                if (success) {
                    success(data);
                }
            };

            //Check if it is already being deleted right now
            if ($row.data('deleting') == true) {
                return;
            }

            $row.data('deleting', true);

            var postData = {};
            postData[self._keyField] = self._getKeyValueOfRecord($row.data('record'));
            
            //deleteAction may be a function, check if it is
            if (!url && $.isFunction(self.options.actions.deleteAction)) {

                //Execute the function
                var funcResult = self.options.actions.deleteAction(postData);

                //Check if result is a jQuery Deferred object
                if (self._isDeferredObject(funcResult)) {
                    //Wait promise
                    funcResult.done(function (data) {
                        completeDelete(data);
                    }).fail(function () {
                        $row.data('deleting', false);
                        if (error) {
                            error(self.options.messages.serverCommunicationError);
                        }
                    });
                } else { //assume it returned the deletion result
                    completeDelete(funcResult);
                }

            } else { //Assume it's a URL string
                //Make ajax call to delete the record from server
                this._ajax({
                    url: (url || self.options.actions.deleteAction),
                    data: postData,
                    success: function (data) {
                        completeDelete(data);
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
                    self._removeRowsFromTable($rows, 'deleted');
                });
            } else {
                self._removeRowsFromTable($rows, 'deleted');
            }
        }

    });

})(jQuery);


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


/************************************************************************
* PAGING extension for jTable                                           *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        load: $.hik.jtable.prototype.load,
        _create: $.hik.jtable.prototype._create,
        _setOption: $.hik.jtable.prototype._setOption,
        _createRecordLoadUrl: $.hik.jtable.prototype._createRecordLoadUrl,
        _createJtParamsForLoading: $.hik.jtable.prototype._createJtParamsForLoading,
        _addRowToTable: $.hik.jtable.prototype._addRowToTable,
        _addRow: $.hik.jtable.prototype._addRow,
        _removeRowsFromTable: $.hik.jtable.prototype._removeRowsFromTable,
        _onRecordsLoaded: $.hik.jtable.prototype._onRecordsLoaded
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {
            paging: false,
            pageList: 'normal', //possible values: 'minimal', 'normal'
            pageSize: 10,
            pageSizes: [10, 25, 50, 100, 250, 500],
            pageSizeChangeArea: true,
            gotoPageArea: 'combobox', //possible values: 'textbox', 'combobox', 'none'

            messages: {
                pagingInfo: 'Showing {0}-{1} of {2}',
                pageSizeChangeLabel: 'Row count',
                gotoPageLabel: 'Go to page'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$bottomPanel: null, //Reference to the panel at the bottom of the table (jQuery object)
        _$pagingListArea: null, //Reference to the page list area in to bottom panel (jQuery object)
        _$pageSizeChangeArea: null, //Reference to the page size change area in to bottom panel (jQuery object)
        _$pageInfoSpan: null, //Reference to the paging info area in to bottom panel (jQuery object)
        _$gotoPageArea: null, //Reference to 'Go to page' input area in to bottom panel (jQuery object)
        _$gotoPageInput: null, //Reference to 'Go to page' input in to bottom panel (jQuery object)
        _totalRecordCount: 0, //Total count of records on all pages
        _currentPageNo: 1, //Current page number

        /************************************************************************
        * CONSTRUCTOR AND INITIALIZING METHODS                                  *
        *************************************************************************/

        /* Overrides base method to do paging-specific constructions.
        *************************************************************************/
        _create: function() {
            base._create.apply(this, arguments);
            if (this.options.paging) {
                this._loadPagingSettings();
                this._createBottomPanel();
                this._createPageListArea();
                this._createGotoPageInput();
                this._createPageSizeSelection();
            }
        },

        /* Loads user preferences for paging.
        *************************************************************************/
        _loadPagingSettings: function() {
            if (!this.options.saveUserPreferences) {
                return;
            }

            var pageSize = this._getCookie('page-size');
            if (pageSize) {
                this.options.pageSize = this._normalizeNumber(pageSize, 1, 1000000, this.options.pageSize);
            }
        },

        /* Creates bottom panel and adds to the page.
        *************************************************************************/
        _createBottomPanel: function() {
            this._$bottomPanel = $('<div />')
                .addClass('jtable-bottom-panel')
                .insertAfter(this._$table);

            this._jqueryuiThemeAddClass(this._$bottomPanel, 'ui-state-default');

            $('<div />').addClass('jtable-left-area').appendTo(this._$bottomPanel);
            $('<div />').addClass('jtable-right-area').appendTo(this._$bottomPanel);
        },

        /* Creates page list area.
        *************************************************************************/
        _createPageListArea: function() {
            this._$pagingListArea = $('<span></span>')
                .addClass('jtable-page-list')
                .appendTo(this._$bottomPanel.find('.jtable-left-area'));

            this._$pageInfoSpan = $('<span></span>')
                .addClass('jtable-page-info')
                .appendTo(this._$bottomPanel.find('.jtable-right-area'));
        },

        /* Creates page list change area.
        *************************************************************************/
        _createPageSizeSelection: function() {
            var self = this;

            if (!self.options.pageSizeChangeArea) {
                return;
            }

            //Add current page size to page sizes list if not contains it
            if (self._findIndexInArray(self.options.pageSize, self.options.pageSizes) < 0) {
                self.options.pageSizes.push(parseInt(self.options.pageSize));
                self.options.pageSizes.sort(function(a, b) { return a - b; });
            }

            //Add a span to contain page size change items
            self._$pageSizeChangeArea = $('<span></span>')
                .addClass('jtable-page-size-change')
                .appendTo(self._$bottomPanel.find('.jtable-left-area'));

            //Page size label
            self._$pageSizeChangeArea.append('<span>' + self.options.messages.pageSizeChangeLabel + ': </span>');

            //Page size change combobox
            var $pageSizeChangeCombobox = $('<select></select>').appendTo(self._$pageSizeChangeArea);

            //Add page sizes to the combobox
            for (var i = 0; i < self.options.pageSizes.length; i++) {
                $pageSizeChangeCombobox.append('<option value="' + self.options.pageSizes[i] + '">' + self.options.pageSizes[i] + '</option>');
            }

            //Select current page size
            $pageSizeChangeCombobox.val(self.options.pageSize);

            //Change page size on combobox change
            $pageSizeChangeCombobox.change(function() {
                self._changePageSize(parseInt($(this).val()));
            });
        },

        /* Creates go to page area.
        *************************************************************************/
        _createGotoPageInput: function() {
            var self = this;

            if (!self.options.gotoPageArea || self.options.gotoPageArea == 'none') {
                return;
            }

            //Add a span to contain goto page items
            this._$gotoPageArea = $('<span></span>')
                .addClass('jtable-goto-page')
                .appendTo(self._$bottomPanel.find('.jtable-left-area'));

            //Goto page label
            this._$gotoPageArea.append('<span>' + self.options.messages.gotoPageLabel + ': </span>');

            //Goto page input
            if (self.options.gotoPageArea == 'combobox') {

                self._$gotoPageInput = $('<select></select>')
                    .appendTo(this._$gotoPageArea)
                    .data('pageCount', 1)
                    .change(function() {
                        self._changePage(parseInt($(this).val()));
                    });
                self._$gotoPageInput.append('<option value="1">1</option>');

            } else { //textbox

                self._$gotoPageInput = $('<input type="text" maxlength="10" value="' + self._currentPageNo + '" />')
                    .appendTo(this._$gotoPageArea)
                    .keypress(function(event) {
                        if (event.which == 13) { //enter
                            event.preventDefault();
                            self._changePage(parseInt(self._$gotoPageInput.val()));
                        } else if (event.which == 43) { // +
                            event.preventDefault();
                            self._changePage(parseInt(self._$gotoPageInput.val()) + 1);
                        } else if (event.which == 45) { // -
                            event.preventDefault();
                            self._changePage(parseInt(self._$gotoPageInput.val()) - 1);
                        } else {
                            //Allow only digits
                            var isValid = (
                                (47 < event.keyCode && event.keyCode < 58 && event.shiftKey == false && event.altKey == false)
                                    || (event.keyCode == 8)
                                    || (event.keyCode == 9)
                            );

                            if (!isValid) {
                                event.preventDefault();
                            }
                        }
                    });

            }
        },

        /* Refreshes the 'go to page' input.
        *************************************************************************/
        _refreshGotoPageInput: function() {
            if (!this.options.gotoPageArea || this.options.gotoPageArea == 'none') {
                return;
            }

            if (this._totalRecordCount <= 0) {
                this._$gotoPageArea.hide();
            } else {
                this._$gotoPageArea.show();
            }

            if (this.options.gotoPageArea == 'combobox') {
                var oldPageCount = this._$gotoPageInput.data('pageCount');
                var currentPageCount = this._calculatePageCount();
                if (oldPageCount != currentPageCount) {
                    this._$gotoPageInput.empty();

                    //Skip some pages is there are too many pages
                    var pageStep = 1;
                    if (currentPageCount > 10000) {
                        pageStep = 100;
                    } else if (currentPageCount > 5000) {
                        pageStep = 10;
                    } else if (currentPageCount > 2000) {
                        pageStep = 5;
                    } else if (currentPageCount > 1000) {
                        pageStep = 2;
                    }

                    for (var i = pageStep; i <= currentPageCount; i += pageStep) {
                        this._$gotoPageInput.append('<option value="' + i + '">' + i + '</option>');
                    }

                    this._$gotoPageInput.data('pageCount', currentPageCount);
                }
            }

            //same for 'textbox' and 'combobox'
            this._$gotoPageInput.val(this._currentPageNo);
        },

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides load method to set current page to 1.
        *************************************************************************/
        load: function() {
            this._currentPageNo = 1;

            base.load.apply(this, arguments);
        },

        /* Used to change options dynamically after initialization.
        *************************************************************************/
        _setOption: function(key, value) {
            base._setOption.apply(this, arguments);

            if (key == 'pageSize') {
                this._changePageSize(parseInt(value));
            }
        },

        /* Changes current page size with given value.
        *************************************************************************/
        _changePageSize: function(pageSize) {
            if (pageSize == this.options.pageSize) {
                return;
            }

            this.options.pageSize = pageSize;

            //Normalize current page
            var pageCount = this._calculatePageCount();
            if (this._currentPageNo > pageCount) {
                this._currentPageNo = pageCount;
            }
            if (this._currentPageNo <= 0) {
                this._currentPageNo = 1;
            }

            //if user sets one of the options on the combobox, then select it.
            var $pageSizeChangeCombobox = this._$bottomPanel.find('.jtable-page-size-change select');
            if ($pageSizeChangeCombobox.length > 0) {
                if (parseInt($pageSizeChangeCombobox.val()) != pageSize) {
                    var selectedOption = $pageSizeChangeCombobox.find('option[value=' + pageSize + ']');
                    if (selectedOption.length > 0) {
                        $pageSizeChangeCombobox.val(pageSize);
                    }
                }
            }

            this._savePagingSettings();
            this._reloadTable();
        },

        /* Saves user preferences for paging
        *************************************************************************/
        _savePagingSettings: function() {
            if (!this.options.saveUserPreferences) {
                return;
            }

            this._setCookie('page-size', this.options.pageSize);
        },

        /* Overrides _createRecordLoadUrl method to add paging info to URL.
        *************************************************************************/
        _createRecordLoadUrl: function() {
            var loadUrl = base._createRecordLoadUrl.apply(this, arguments);
            loadUrl = this._addPagingInfoToUrl(loadUrl, this._currentPageNo);
            return loadUrl;
        },

        /* Overrides _createJtParamsForLoading method to add paging parameters to jtParams object.
        *************************************************************************/
        _createJtParamsForLoading: function () {
            var jtParams = base._createJtParamsForLoading.apply(this, arguments);
            
            if (this.options.paging) {
                jtParams.jtStartIndex = (this._currentPageNo - 1) * this.options.pageSize;
                jtParams.jtPageSize = this.options.pageSize;
            }

            return jtParams;
        },

        /* Overrides _addRowToTable method to re-load table when a new row is created.
        * NOTE: THIS METHOD IS DEPRECATED AND WILL BE REMOVED FROM FEATURE RELEASES.
        * USE _addRow METHOD.
        *************************************************************************/
        _addRowToTable: function ($tableRow, index, isNewRow) {
            if (isNewRow && this.options.paging) {
                this._reloadTable();
                return;
            }

            base._addRowToTable.apply(this, arguments);
        },

        /* Overrides _addRow method to re-load table when a new row is created.
        *************************************************************************/
        _addRow: function ($row, options) {
            if (options && options.isNewRow && this.options.paging) {
                this._reloadTable();
                return;
            }

            base._addRow.apply(this, arguments);
        },

        /* Overrides _removeRowsFromTable method to re-load table when a row is removed from table.
        *************************************************************************/
        _removeRowsFromTable: function ($rows, reason) {
            base._removeRowsFromTable.apply(this, arguments);

            if (this.options.paging) {
                if (this._$tableRows.length <= 0 && this._currentPageNo > 1) {
                    --this._currentPageNo;
                }

                this._reloadTable();
            }
        },

        /* Overrides _onRecordsLoaded method to to do paging specific tasks.
        *************************************************************************/
        _onRecordsLoaded: function (data) {
            if (this.options.paging) {
                this._totalRecordCount = data.TotalRecordCount;
                this._createPagingList();
                this._createPagingInfo();
                this._refreshGotoPageInput();
            }

            base._onRecordsLoaded.apply(this, arguments);
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Adds jtStartIndex and jtPageSize parameters to a URL as query string.
        *************************************************************************/
        _addPagingInfoToUrl: function (url, pageNumber) {
            if (!this.options.paging) {
                return url;
            }

            var jtStartIndex = (pageNumber - 1) * this.options.pageSize;
            var jtPageSize = this.options.pageSize;

            return (url + (url.indexOf('?') < 0 ? '?' : '&') + 'jtStartIndex=' + jtStartIndex + '&jtPageSize=' + jtPageSize);
        },

        /* Creates and shows the page list.
        *************************************************************************/
        _createPagingList: function () {
            if (this.options.pageSize <= 0) {
                return;
            }

            this._$pagingListArea.empty();
            if (this._totalRecordCount <= 0) {
                return;
            }

            var pageCount = this._calculatePageCount();

            this._createFirstAndPreviousPageButtons();
            if (this.options.pageList == 'normal') {
                this._createPageNumberButtons(this._calculatePageNumbers(pageCount));
            }
            this._createLastAndNextPageButtons(pageCount);
            this._bindClickEventsToPageNumberButtons();
        },

        /* Creates and shows previous and first page links.
        *************************************************************************/
        _createFirstAndPreviousPageButtons: function () {
            var $first = $('<span></span>')
                .addClass('jtable-page-number-first')
                .html('&lt&lt')
                .data('pageNumber', 1)
                .appendTo(this._$pagingListArea);

            var $previous = $('<span></span>')
                .addClass('jtable-page-number-previous')
                .html('&lt')
                .data('pageNumber', this._currentPageNo - 1)
                .appendTo(this._$pagingListArea);

            this._jqueryuiThemeAddClass($first, 'ui-button ui-state-default', 'ui-state-hover');
            this._jqueryuiThemeAddClass($previous, 'ui-button ui-state-default', 'ui-state-hover');

            if (this._currentPageNo <= 1) {
                $first.addClass('jtable-page-number-disabled');
                $previous.addClass('jtable-page-number-disabled');
                this._jqueryuiThemeAddClass($first, 'ui-state-disabled');
                this._jqueryuiThemeAddClass($previous, 'ui-state-disabled');
            }
        },

        /* Creates and shows next and last page links.
        *************************************************************************/
        _createLastAndNextPageButtons: function (pageCount) {
            var $next = $('<span></span>')
                .addClass('jtable-page-number-next')
                .html('&gt')
                .data('pageNumber', this._currentPageNo + 1)
                .appendTo(this._$pagingListArea);
            var $last = $('<span></span>')
                .addClass('jtable-page-number-last')
                .html('&gt&gt')
                .data('pageNumber', pageCount)
                .appendTo(this._$pagingListArea);

            this._jqueryuiThemeAddClass($next, 'ui-button ui-state-default', 'ui-state-hover');
            this._jqueryuiThemeAddClass($last, 'ui-button ui-state-default', 'ui-state-hover');

            if (this._currentPageNo >= pageCount) {
                $next.addClass('jtable-page-number-disabled');
                $last.addClass('jtable-page-number-disabled');
                this._jqueryuiThemeAddClass($next, 'ui-state-disabled');
                this._jqueryuiThemeAddClass($last, 'ui-state-disabled');
            }
        },

        /* Creates and shows page number links for given number array.
        *************************************************************************/
        _createPageNumberButtons: function (pageNumbers) {
            var previousNumber = 0;
            for (var i = 0; i < pageNumbers.length; i++) {
                //Create "..." between page numbers if needed
                if ((pageNumbers[i] - previousNumber) > 1) {
                    $('<span></span>')
                        .addClass('jtable-page-number-space')
                        .html('...')
                        .appendTo(this._$pagingListArea);
                }

                this._createPageNumberButton(pageNumbers[i]);
                previousNumber = pageNumbers[i];
            }
        },

        /* Creates a page number link and adds to paging area.
        *************************************************************************/
        _createPageNumberButton: function (pageNumber) {
            var $pageNumber = $('<span></span>')
                .addClass('jtable-page-number')
                .html(pageNumber)
                .data('pageNumber', pageNumber)
                .appendTo(this._$pagingListArea);

            this._jqueryuiThemeAddClass($pageNumber, 'ui-button ui-state-default', 'ui-state-hover');
            
            if (this._currentPageNo == pageNumber) {
                $pageNumber.addClass('jtable-page-number-active jtable-page-number-disabled');
                this._jqueryuiThemeAddClass($pageNumber, 'ui-state-active');
            }
        },

        /* Calculates total page count according to page size and total record count.
        *************************************************************************/
        _calculatePageCount: function () {
            var pageCount = Math.floor(this._totalRecordCount / this.options.pageSize);
            if (this._totalRecordCount % this.options.pageSize != 0) {
                ++pageCount;
            }

            return pageCount;
        },

        /* Calculates page numbers and returns an array of these numbers.
        *************************************************************************/
        _calculatePageNumbers: function (pageCount) {
            if (pageCount <= 4) {
                //Show all pages
                var pageNumbers = [];
                for (var i = 1; i <= pageCount; ++i) {
                    pageNumbers.push(i);
                }

                return pageNumbers;
            } else {
                //show first three, last three, current, previous and next page numbers
                var shownPageNumbers = [1, 2, pageCount - 1, pageCount];
                var previousPageNo = this._normalizeNumber(this._currentPageNo - 1, 1, pageCount, 1);
                var nextPageNo = this._normalizeNumber(this._currentPageNo + 1, 1, pageCount, 1);

                this._insertToArrayIfDoesNotExists(shownPageNumbers, previousPageNo);
                this._insertToArrayIfDoesNotExists(shownPageNumbers, this._currentPageNo);
                this._insertToArrayIfDoesNotExists(shownPageNumbers, nextPageNo);

                shownPageNumbers.sort(function (a, b) { return a - b; });
                return shownPageNumbers;
            }
        },

        /* Creates and shows paging informations.
        *************************************************************************/
        _createPagingInfo: function () {
            if (this._totalRecordCount <= 0) {
                this._$pageInfoSpan.empty();
                return;
            }

            var startNo = (this._currentPageNo - 1) * this.options.pageSize + 1;
            var endNo = this._currentPageNo * this.options.pageSize;
            endNo = this._normalizeNumber(endNo, startNo, this._totalRecordCount, 0);

            if (endNo >= startNo) {
                var pagingInfoMessage = this._formatString(this.options.messages.pagingInfo, startNo, endNo, this._totalRecordCount);
                this._$pageInfoSpan.html(pagingInfoMessage);
            }
        },

        /* Binds click events of all page links to change the page.
        *************************************************************************/
        _bindClickEventsToPageNumberButtons: function () {
            var self = this;
            self._$pagingListArea
                .find('.jtable-page-number,.jtable-page-number-previous,.jtable-page-number-next,.jtable-page-number-first,.jtable-page-number-last')
                .not('.jtable-page-number-disabled')
                .click(function (e) {
                    e.preventDefault();
                    self._changePage($(this).data('pageNumber'));
                });
        },

        /* Changes current page to given value.
        *************************************************************************/
        _changePage: function (pageNo) {
            pageNo = this._normalizeNumber(pageNo, 1, this._calculatePageCount(), 1);
            if (pageNo == this._currentPageNo) {
                this._refreshGotoPageInput();
                return;
            }

            this._currentPageNo = pageNo;
            this._reloadTable();
        }

    });

})(jQuery);


/************************************************************************
* SORTING extension for jTable                                          *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _initializeFields: $.hik.jtable.prototype._initializeFields,
        _normalizeFieldOptions: $.hik.jtable.prototype._normalizeFieldOptions,
        _createHeaderCellForField: $.hik.jtable.prototype._createHeaderCellForField,
        _createRecordLoadUrl: $.hik.jtable.prototype._createRecordLoadUrl,
        _createJtParamsForLoading: $.hik.jtable.prototype._createJtParamsForLoading
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {
            sorting: false,
            multiSorting: false,
            defaultSorting: ''
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _lastSorting: null, //Last sorting of the table

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides base method to create sorting array.
        *************************************************************************/
        _initializeFields: function () {
            base._initializeFields.apply(this, arguments);

            this._lastSorting = [];
            if (this.options.sorting) {
                this._buildDefaultSortingArray();
            }
        },

        /* Overrides _normalizeFieldOptions method to normalize sorting option for fields.
        *************************************************************************/
        _normalizeFieldOptions: function (fieldName, props) {
            base._normalizeFieldOptions.apply(this, arguments);
            props.sorting = (props.sorting != false);
        },

        /* Overrides _createHeaderCellForField to make columns sortable.
        *************************************************************************/
        _createHeaderCellForField: function (fieldName, field) {
            var $headerCell = base._createHeaderCellForField.apply(this, arguments);
            if (this.options.sorting && field.sorting) {
                this._makeColumnSortable($headerCell, fieldName);
            }

            return $headerCell;
        },

        /* Overrides _createRecordLoadUrl to add sorting specific info to URL.
        *************************************************************************/
        _createRecordLoadUrl: function () {
            var loadUrl = base._createRecordLoadUrl.apply(this, arguments);
            loadUrl = this._addSortingInfoToUrl(loadUrl);
            return loadUrl;
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Builds the sorting array according to defaultSorting string
        *************************************************************************/
        _buildDefaultSortingArray: function () {
            var self = this;

            $.each(self.options.defaultSorting.split(","), function (orderIndex, orderValue) {
                $.each(self.options.fields, function (fieldName, fieldProps) {
                    if (fieldProps.sorting) {
                        var colOffset = orderValue.indexOf(fieldName);
                        if (colOffset > -1) {
                            if (orderValue.toUpperCase().indexOf(' DESC', colOffset) > -1) {
                                self._lastSorting.push({
                                    fieldName: fieldName,
                                    sortOrder: 'DESC'
                                });
                            } else {
                                self._lastSorting.push({
                                    fieldName: fieldName,
                                    sortOrder: 'ASC'
                                });
                            }
                        }
                    }
                });
            });
        },

        /* Makes a column sortable.
        *************************************************************************/
        _makeColumnSortable: function ($columnHeader, fieldName) {
            var self = this;
            
            $columnHeader
                .addClass('jtable-column-header-sortable')
                .click(function (e) {
                    e.preventDefault();

                    if (!self.options.multiSorting || !e.ctrlKey) {
                        self._lastSorting = []; //clear previous sorting
                    }
                    
                    self._sortTableByColumn($columnHeader);
                });

            //Set default sorting
            $.each(this._lastSorting, function (sortIndex, sortField) {
                if (sortField.fieldName == fieldName) {
                    if (sortField.sortOrder == 'DESC') {
                        $columnHeader.addClass('jtable-column-header-sorted-desc');
                    } else {
                        $columnHeader.addClass('jtable-column-header-sorted-asc');
                    }
                }
            });
        },

        /* Sorts table according to a column header.
        *************************************************************************/
        _sortTableByColumn: function ($columnHeader) {
            //Remove sorting styles from all columns except this one
            if (this._lastSorting.length == 0) {
                $columnHeader.siblings().removeClass('jtable-column-header-sorted-asc jtable-column-header-sorted-desc');
            }

            //If current sorting list includes this column, remove it from the list
            for (var i = 0; i < this._lastSorting.length; i++) {
                if (this._lastSorting[i].fieldName == $columnHeader.data('fieldName')) {
                    this._lastSorting.splice(i--, 1);
                }
            }

            //Sort ASC or DESC according to current sorting state
            if ($columnHeader.hasClass('jtable-column-header-sorted-asc')) {
                $columnHeader.removeClass('jtable-column-header-sorted-asc').addClass('jtable-column-header-sorted-desc');
                this._lastSorting.push({
                    'fieldName': $columnHeader.data('fieldName'),
                    sortOrder: 'DESC'
                });
            } else {
                $columnHeader.removeClass('jtable-column-header-sorted-desc').addClass('jtable-column-header-sorted-asc');
                this._lastSorting.push({
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
            if (!this.options.sorting || this._lastSorting.length == 0) {
                return url;
            }

            var sorting = [];
            $.each(this._lastSorting, function (idx, value) {
                sorting.push(value.fieldName + ' ' + value.sortOrder);
            });

            return (url + (url.indexOf('?') < 0 ? '?' : '&') + 'jtSorting=' + sorting.join(","));
        },

        /* Overrides _createJtParamsForLoading method to add sorging parameters to jtParams object.
        *************************************************************************/
        _createJtParamsForLoading: function () {
            var jtParams = base._createJtParamsForLoading.apply(this, arguments);

            if (this.options.sorting && this._lastSorting.length) {
                var sorting = [];
                $.each(this._lastSorting, function (idx, value) {
                    sorting.push(value.fieldName + ' ' + value.sortOrder);
                });

                jtParams.jtSorting = sorting.join(",");
            }

            return jtParams;
        }

    });

})(jQuery);

/************************************************************************
* EDIT INLINE CELL extension for jTable                                 *
* (Enable/Disable Edit Cell live )                                      *
*************************************************************************/
(function ($) {
	var base={
		_createCellForRecordField:$.hik.jtable.prototype._createCellForRecordField,
		_updateRowTexts:$.hik.jtable.prototype._updateRowTexts	

	}
    $.extend(true, $.hik.jtable.prototype, {
		options: {
			editinline:{enable:false,img:"../scripts/jtable/content/"},
			
			//localisation
			messages:{
				required:'Required field'
			}
		},
		/** Overrides Method
		*****************************/
		_createCellForRecordField: function (record, fieldName) {
			var $column = base._createCellForRecordField.apply(this, arguments);
			var field = this.options.fields[fieldName];
			if(this.options.editinline.enable && this.options.fields[fieldName].edit != false && this.options.actions.updateAction != undefined){
				return $('<td></td>')
                .addClass(this.options.fields[fieldName].listClass)
                .append((this._getDisplayTextEditInline(record, fieldName)));
			}else{
			     return $('<td></td>')
                .addClass(this.options.fields[fieldName].listClass)
                .append((this._getDisplayTextForRecordField(record, fieldName)));
			}
        },
		/** Overrides Method
		*****************************/
		_updateRowTexts: function ($tableRow) {
            var record = $tableRow.data('record');
            var $columns = $tableRow.find('td');
			if(this.options.editinline){
				for (var i = 0; i < this._columnList.length; i++) {
					if(this.options.fields[this._columnList[i]].type=='date'){
						var displayItem = this._getDisplayTextForRecordField(record, this._columnList[i]);
						$columns.eq(this._firstDataColumnOffset + i).html(displayItem || '');				
					}else{
						var displayItem = this._getDisplayTextEditInline(record, this._columnList[i]);
						$columns.eq(this._firstDataColumnOffset + i).html(displayItem || '');
					}
				}
			}else{
				for (var i = 0; i < this._columnList.length; i++) {
					var displayItem = this._getDisplayTextForRecordField(record, this._columnList[i]);
					$columns.eq(this._firstDataColumnOffset + i).html(displayItem || '');
				}
			}
            this._onRowUpdated($tableRow);
        },		
		_getDisplayTextEditInline:function (record, fieldName) {
			var field = this.options.fields[fieldName];
            var fieldValue = record[fieldName];
			
			if (field.display) {
					return field.display({ record: record });
            }
			
            if (field.type == 'date') {
					return this._editInline_date(record,fieldName);
			} else if (field.type == 'checkbox') {
                return this._editInline_checkbox(record, fieldName);
            } else if (field.type == 'textarea') {
                return this._editInline_textarea(record, fieldName);
            } else if (field.type == 'number') {
                return this._editInline_number(record, fieldName);
            }else if (field.options) { //combobox or radio button list since there are options.
                var options = this._getOptionsForField(fieldName, {
                    record: record,
                    value: fieldValue,
                    source: 'edit',
                    dependedValues: this._createDependedValuesUsingRecord(record, field.dependsOn)
                });
                return this._editInline_options(options, fieldValue,record,fieldName);
            } else { //other types
					return this._editInline_default(record,fieldName);
            }
        },
        _editInline_options: function (options, value,record,fieldName) {
			var self = this;
			var val = value;
			var valtext ='';
            var $inputhtml = $('<select></select>');
			$inputhtml.css('background-repeat','no-repeat');
			$inputhtml.css('background-position','right center');
			for (var i = 0; i < options.length; i++) {
                $inputhtml.append('<option value="' + options[i].Value + '"' + (options[i].Value == value ? ' selected="selected"' : '') + '>' + options[i].DisplayText + '</option>');
				if(options[i].Value == value){
					valtext = options[i].DisplayText;
				}
            }
			
			var defaulttext = (valtext) ? valtext :'Null';
			var $txt = $('<span>' + defaulttext + '</span>');
			$txt.dblclick(function(){
				if($(this).children().length < 1){
					$inputhtml.val(val);
					$(this).html($inputhtml);
					$inputhtml.bind('change blur focusout',function(){											
						$(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
						var postData = {};
						postData[fieldName]=$(this).val();
						postData[self._keyField]=record[self._keyField];
						if(self._editInline_ajax(postData)){
							val = $(this).val();
							$txt.html($(this).find("option:selected").text());
							record[fieldName]=$(this).val();
							$(this).css('background','none');
							self._showUpdateAnimationForRow($txt.closest("tr"));
						}
					});
					$inputhtml.focus();
					
				}
			
			});
			return $txt;
        },		
		_editInline_date:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var displayFormat = field.displayFormat || this.options.defaultDateFormat;
				var date = this._parseDate(fieldValue);
				var defaultval = (fieldValue) ? $.datepicker.formatDate(displayFormat, date) :'&nbsp;&nbsp;&nbsp;';  
        		var $txt = $('<span>' + defaultval + '</span>');
				$txt.dblclick(function(){
					if($(this).children().length < 1){
						var $inputhtml = $('<input type="text" value="' + $(this).html().trim() + '" />');
						$inputhtml.addClass('form-control');
						$inputhtml.css('background-repeat','no-repeat');
						$inputhtml.css('background-position','right center');
						$inputhtml.addClass(field.inputClass);
						$(this).html($inputhtml);
						(displayFormat.toLowerCase() == 'dd-mm-yy' )?$(this).mask("99-99-9999"):$(this).mask("9999-99-99");
						if (field.required) {
							$(this).attr('title',self.options.messages.required);
							$(this).append('<b><i>'+self.options.messages.required+'</i></b>');
						}
						$inputhtml.datepicker({dateFormat:displayFormat,changeMonth:true,changeYear:true,onClose: function(calDate) {
							$(this).css('background-image','url(' + self.options.editinline.img + 'loading.gif)');
							var postData = {};
							postData[fieldName]=$(this).val();
							postData[self._keyField] = record[self._keyField];
							if(self._editInline_ajax(postData)){
								$txt.html($(this).val());
								record[fieldName] = $(this).val();
								$(this).css('background','none');
								self._showUpdateAnimationForRow($txt.closest("tr"));
							}							
						}});
						$inputhtml.focus();
							
					}
				});	
										
				return $txt;	

		},
		_editInline_checkbox:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var $img = (fieldValue != 0) ? $('<img val="1" style="cursor:pointer;" src="' + this.options.editinline.img + 'apply.png"></img>') : $('<img val="0" style="cursor:pointer;" src="' + this.options.editinline.img + 'cross.png"></img>');
				$img.dblclick(function(){
					var postData = {};
					postData[fieldName]=($(this).attr('val'))!=0?0:1;
					postData[self._keyField] = record[self._keyField];
					if(self._editInline_ajax(postData)){
					if($(this).attr('val')=='0'){
						record[fieldName]=1;
						$(this).attr('title','click to uncheck');
						$(this).attr('val','1');
						$(this).attr('src',self.options.editinline.img + 'apply.png');	
					}else{
						record[fieldName]=0;
						$(this).attr('title','click to check');
						$(this).attr('val','0');
						$(this).attr("src",self.options.editinline.img + 'cross.png');	
					}
					self._showUpdateAnimationForRow($img.closest("tr"));
					}
				});	
										
				return $img;	

		},
		_editInline_textarea:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var defaultval = (fieldValue) ? fieldValue :'&nbsp;&nbsp;&nbsp;';  
				var $txt = $('<span>' + defaultval + '</span>');
				$txt.dblclick(function(){
					if($(this).children().length < 1){
						var $inputhtml = $('<textarea>' + $(this).html() + '</textarea>');
						$inputhtml.css('background-repeat','no-repeat');
						$inputhtml.css('background-position','right center');
						$inputhtml.addClass(field.inputClass);
						if (field.addMask) {
							$inputhtml.mask(field.addMask);
						}
						$(this).html($inputhtml);
						if (field.required) {
							$(this).append('<b><i>'+self.options.messages.required+'</i></b>');
						}
						$inputhtml.bind('change blur focusout',function(){
							if ($(this).val().trim() == '' && field.required) {
								$(this).attr('title',self.options.messages.required);
							}else{
								$(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
								var postData = {};
								postData[fieldName]=$(this).val().trim();
								postData[self._keyField] = record[self._keyField];
								if(self._editInline_ajax(postData)){
								$txt.html($(this).val().trim()+'&nbsp;&nbsp;&nbsp;&nbsp;');
								record[fieldName]=$(this).val().trim();
								$(this).css('background','none');
								self._showUpdateAnimationForRow($txt.closest("tr"));
								}
							}
						});
						$inputhtml.focus();
					}
				});	
										
				return $txt;	

		},
		_editInline_default:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var defaultval = (fieldValue) ? fieldValue :'&nbsp;&nbsp;&nbsp;&nbsp;';  
				var $txt = $('<div style=\'width:auto\'>' + defaultval + '</div>');
				$txt.dblclick(function(){
					if($(this).children().length < 1){
						var $inputhtml = $('<input type="text" value="' + $(this).html() + '"/>');
						$inputhtml.css('background-repeat','no-repeat');
						$inputhtml.css('background-position','right center');
						$inputhtml.addClass(field.inputClass);
						if (field.addMask) {
							$inputhtml.mask(field.addMask);
						}
						$(this).html($inputhtml);
						if (field.required) {
							$(this).append('<b><i>'+self.options.messages.required+'</i></b>');
						}
						$inputhtml.bind('change blur focusout',function(){
							if ($(this).val().trim() == '' && field.required) {
								$(this).attr('title',self.options.messages.required);
							}else{
								$(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
								var postData = {};
								postData[fieldName]=$(this).val().trim();
								postData[self._keyField] = record[self._keyField];
								if(self._editInline_ajax(postData)){
									$txt.html($(this).val().trim()+'&nbsp;&nbsp;&nbsp;&nbsp;');
									record[fieldName]=$(this).val().trim();
									$(this).css('background','none');
									self._showUpdateAnimationForRow($txt.closest("tr"));
								}
							}
							
						});
						$inputhtml.focus();
					}
				});						
				return $txt;	
		},
		_editInline_number:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var defaultval = (fieldValue) ? fieldValue :'&nbsp;&nbsp;&nbsp;';  
				var $txt = $('<span>' + defaultval + '</span>');
				$txt.dblclick(function(){
					if($(this).children().length < 1){
						var $inputhtml = $('<input type="number" value="' + $(this).html() + '"/>');
						$inputhtml.css('background-repeat','no-repeat');
						$inputhtml.css('background-position','right center');
						$(this).html($inputhtml);
						if (field.required) {
							$(this).append('<b><i>'+self.options.messages.required+'</i></b>');
						}
						$(this).numeric(',');
						$inputhtml.bind('blur focusout',function(){
							if ($(this).val().trim() == '' && field.required) {
								$(this).attr('title',self.options.messages.required);
							}else{
								$(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
								var postData = {};
								postData[fieldName]=$(this).val();
								postData[self._keyField] = record[self._keyField];
								if(self._editInline_ajax(postData)){
								$txt.html($(this).val().trim()+'&nbsp;&nbsp;&nbsp;&nbsp;');
								record[fieldName]=$(this).val();
								$(this).css('background','none');
								self._showUpdateAnimationForRow($txt.closest("tr"));
								}
							}
						});
						$inputhtml.focus();
					}
				});	
										
				return $txt;	

		},
		_editInline_ajax:function(postData){
            var self = this;
			var res = true;
            this._ajax({
                url: (self.options.actions.updateAction),
                data: postData,
                success: function (data) {              
					if (data.Result != 'OK') {
                        return res =false;
                    }

                    self._trigger("recordUpdated", null, {});
                },
                error: function () {
                        error(self.options.messages.serverCommunicationError);
                }
            });			
			return res;
		}
	});
	
})(jQuery);

/************************************************************************
* DYNAMIC COLUMNS extension for jTable                                  *
* (Show/hide/resize columns)                                            *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _create: $.hik.jtable.prototype._create,
        _normalizeFieldOptions: $.hik.jtable.prototype._normalizeFieldOptions,
        _createHeaderCellForField: $.hik.jtable.prototype._createHeaderCellForField,
        _createCellForRecordField: $.hik.jtable.prototype._createCellForRecordField
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/

        options: {
            tableId: undefined,
            columnResizable: true,
            columnSelectable: true
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$columnSelectionDiv: null,
        _$columnResizeBar: null,
        _cookieKeyPrefix: null,
        _currentResizeArgs: null,

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides _addRowToTableHead method.
        *************************************************************************/

        _create: function () {
            base._create.apply(this, arguments);

            this._createColumnResizeBar();
            this._createColumnSelection();

            if (this.options.saveUserPreferences) {
                this._loadColumnSettings();
            }

            this._normalizeColumnWidths();
        },

        /* Normalizes some options for a field (sets default values).
        *************************************************************************/
        _normalizeFieldOptions: function (fieldName, props) {
            base._normalizeFieldOptions.apply(this, arguments);

            //columnResizable
            if (this.options.columnResizable) {
                props.columnResizable = (props.columnResizable != false);
            }

            //visibility
            if (!props.visibility) {
                props.visibility = 'visible';
            }
        },

        /* Overrides _createHeaderCellForField to make columns dynamic.
        *************************************************************************/
        _createHeaderCellForField: function (fieldName, field) {
            var $headerCell = base._createHeaderCellForField.apply(this, arguments);

            //Make data columns resizable except the last one
            if (this.options.columnResizable && field.columnResizable && (fieldName != this._columnList[this._columnList.length - 1])) {
                this._makeColumnResizable($headerCell);
            }

            //Hide column if needed
            if (field.visibility == 'hidden') {
                $headerCell.hide();
            }

            return $headerCell;
        },

        /* Overrides _createHeaderCellForField to decide show or hide a column.
        *************************************************************************/
        _createCellForRecordField: function (record, fieldName) {
            var $column = base._createCellForRecordField.apply(this, arguments);

            var field = this.options.fields[fieldName];
            if (field.visibility == 'hidden') {
                $column.hide();
            }

            return $column;
        },

        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* Changes visibility of a column.
        *************************************************************************/
        changeColumnVisibility: function (columnName, visibility) {
            this._changeColumnVisibilityInternal(columnName, visibility);
            this._normalizeColumnWidths();
            if (this.options.saveUserPreferences) {
                this._saveColumnSettings();
            }
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Changes visibility of a column.
        *************************************************************************/
        _changeColumnVisibilityInternal: function (columnName, visibility) {
            //Check if there is a column with given name
            var columnIndex = this._columnList.indexOf(columnName);
            if (columnIndex < 0) {
                this._logWarn('Column "' + columnName + '" does not exist in fields!');
                return;
            }

            //Check if visibility value is valid
            if (['visible', 'hidden', 'fixed'].indexOf(visibility) < 0) {
                this._logWarn('Visibility value is not valid: "' + visibility + '"! Options are: visible, hidden, fixed.');
                return;
            }

            //Get the field
            var field = this.options.fields[columnName];
            if (field.visibility == visibility) {
                return; //No action if new value is same as old one.
            }

            //Hide or show the column if needed
            var columnIndexInTable = this._firstDataColumnOffset + columnIndex + 1;
            if (field.visibility != 'hidden' && visibility == 'hidden') {
                this._$table
                    .find('>thead >tr >th:nth-child(' + columnIndexInTable + '),>tbody >tr >td:nth-child(' + columnIndexInTable + ')')
                    .hide();
            } else if (field.visibility == 'hidden' && visibility != 'hidden') {
                this._$table
                    .find('>thead >tr >th:nth-child(' + columnIndexInTable + '),>tbody >tr >td:nth-child(' + columnIndexInTable + ')')
                    .show()
                    .css('display', 'table-cell');
            }

            field.visibility = visibility;
        },

        /* Prepares dialog to change settings.
        *************************************************************************/
        _createColumnSelection: function () {
            var self = this;

            //Create a div for dialog and add to container element
            this._$columnSelectionDiv = $('<div />')
                .addClass('jtable-column-selection-container')
                .appendTo(self._$mainContainer);
            
            this._$table.children('thead').bind('contextmenu', function (e) {
                if (!self.options.columnSelectable) {
                    return;
                }
                
                e.preventDefault();

                //Make an overlay div to disable page clicks
                $('<div />')
                    .addClass('jtable-contextmenu-overlay')
                    .click(function () {
                        $(this).remove();
                        self._$columnSelectionDiv.hide();
                    })
                    .bind('contextmenu', function () { return false; })
                    .appendTo(document.body);

                self._fillColumnSelection();
                
                //Calculate position of column selection list and show it

                var containerOffset = self._$mainContainer.offset();
                var selectionDivTop = e.pageY - containerOffset.top;
                var selectionDivLeft = e.pageX - containerOffset.left;
                
                var selectionDivMinWidth = 100; //in pixels
                var containerWidth = self._$mainContainer.width();

                //If user clicks right area of header of the table, show list at a little left
                if ((containerWidth > selectionDivMinWidth) && (selectionDivLeft > (containerWidth - selectionDivMinWidth))) {
                    selectionDivLeft = containerWidth - selectionDivMinWidth;
                }

                self._$columnSelectionDiv.css({
                    left: selectionDivLeft,
                    top: selectionDivTop,
                    'min-width': selectionDivMinWidth + 'px'
                }).show();
            });
        },
        
        /* Prepares content of settings dialog.
        *************************************************************************/
        _fillColumnSelection: function () {
            var self = this;

            var $columnsUl = $('<ul></ul>')
                .addClass('jtable-column-select-list');
            for (var i = 0; i < this._columnList.length; i++) {
                var columnName = this._columnList[i];
                var field = this.options.fields[columnName];

                //Crete li element
                var $columnLi = $('<li></li>').appendTo($columnsUl);

                //Create label for the checkbox
                var $label = $('<label for="' + columnName + '"></label>')
                    .append($('<span>' + (field.title || columnName) + '</span>'))
                    .appendTo($columnLi);

                //Create checkbox
                var $checkbox = $('<input type="checkbox" name="' + columnName + '">')
                    .prependTo($label)
                    .click(function () {
                        var $clickedCheckbox = $(this);
                        var clickedColumnName = $clickedCheckbox.attr('name');
                        var clickedField = self.options.fields[clickedColumnName];
                        if (clickedField.visibility == 'fixed') {
                            return;
                        }

                        self.changeColumnVisibility(clickedColumnName, $clickedCheckbox.is(':checked') ? 'visible' : 'hidden');
                    });

                //Check, if column if shown
                if (field.visibility != 'hidden') {
                    $checkbox.attr('checked', 'checked');
                }

                //Disable, if column is fixed
                if (field.visibility == 'fixed') {
                    $checkbox.attr('disabled', 'disabled');
                }
            }

            this._$columnSelectionDiv.html($columnsUl);
        },

        /* creates a vertical bar that is shown while resizing columns.
        *************************************************************************/
        _createColumnResizeBar: function () {
            this._$columnResizeBar = $('<div />')
                .addClass('jtable-column-resize-bar')
                .appendTo(this._$mainContainer)
                .hide();
        },

        /* Makes a column sortable.
        *************************************************************************/
        _makeColumnResizable: function ($columnHeader) {
            var self = this;

            //Create a handler to handle mouse click event
            $('<div />')
                .addClass('jtable-column-resize-handler')
                .appendTo($columnHeader.find('.jtable-column-header-container')) //Append the handler to the column
                .mousedown(function (downevent) { //handle mousedown event for the handler
                    downevent.preventDefault();
                    downevent.stopPropagation();

                    var mainContainerOffset = self._$mainContainer.offset();

                    //Get a reference to the next column
                    var $nextColumnHeader = $columnHeader.nextAll('th.jtable-column-header:visible:first');
                    if (!$nextColumnHeader.length) {
                        return;
                    }

                    //Store some information to be used on resizing
                    var minimumColumnWidth = 10; //A column's width can not be smaller than 10 pixel.
                    self._currentResizeArgs = {
                        currentColumnStartWidth: $columnHeader.outerWidth(),
                        minWidth: minimumColumnWidth,
                        maxWidth: $columnHeader.outerWidth() + $nextColumnHeader.outerWidth() - minimumColumnWidth,
                        mouseStartX: downevent.pageX,
                        minResizeX: function () { return this.mouseStartX - (this.currentColumnStartWidth - this.minWidth); },
                        maxResizeX: function () { return this.mouseStartX + (this.maxWidth - this.currentColumnStartWidth); }
                    };

                    //Handle mouse move event to move resizing bar
                    var resizeonmousemove = function (moveevent) {
                        if (!self._currentResizeArgs) {
                            return;
                        }

                        var resizeBarX = self._normalizeNumber(moveevent.pageX, self._currentResizeArgs.minResizeX(), self._currentResizeArgs.maxResizeX());
                        self._$columnResizeBar.css('left', (resizeBarX - mainContainerOffset.left) + 'px');
                    };

                    //Handle mouse up event to finish resizing of the column
                    var resizeonmouseup = function (upevent) {
                        if (!self._currentResizeArgs) {
                            return;
                        }

                        $(document).unbind('mousemove', resizeonmousemove);
                        $(document).unbind('mouseup', resizeonmouseup);

                        self._$columnResizeBar.hide();

                        //Calculate new widths in pixels
                        var mouseChangeX = upevent.pageX - self._currentResizeArgs.mouseStartX;
                        var currentColumnFinalWidth = self._normalizeNumber(self._currentResizeArgs.currentColumnStartWidth + mouseChangeX, self._currentResizeArgs.minWidth, self._currentResizeArgs.maxWidth);
                        var nextColumnFinalWidth = $nextColumnHeader.outerWidth() + (self._currentResizeArgs.currentColumnStartWidth - currentColumnFinalWidth);

                        //Calculate widths as percent
                        var pixelToPercentRatio = $columnHeader.data('width-in-percent') / self._currentResizeArgs.currentColumnStartWidth;
                        $columnHeader.data('width-in-percent', currentColumnFinalWidth * pixelToPercentRatio);
                        $nextColumnHeader.data('width-in-percent', nextColumnFinalWidth * pixelToPercentRatio);

                        //Set new widths to columns (resize!)
                        $columnHeader.css('width', $columnHeader.data('width-in-percent') + '%');
                        $nextColumnHeader.css('width', $nextColumnHeader.data('width-in-percent') + '%');

                        //Normalize all column widths
                        self._normalizeColumnWidths();

                        //Finish resizing
                        self._currentResizeArgs = null;

                        //Save current preferences
                        if (self.options.saveUserPreferences) {
                            self._saveColumnSettings();
                        }
                    };

                    //Show vertical resize bar
                    self._$columnResizeBar
                        .show()
                        .css({
                            top: ($columnHeader.offset().top - mainContainerOffset.top) + 'px',
                            left: (downevent.pageX - mainContainerOffset.left) + 'px',
                            height: (self._$table.outerHeight()) + 'px'
                        });

                    //Bind events
                    $(document).bind('mousemove', resizeonmousemove);
                    $(document).bind('mouseup', resizeonmouseup);
                });
        },

        /* Normalizes column widths as percent for current view.
        *************************************************************************/
        _normalizeColumnWidths: function () {

            //Set command column width
            var commandColumnHeaders = this._$table
                .find('>thead th.jtable-command-column-header')
                .data('width-in-percent', 1)
                .css('width', '1%');

            //Find data columns
            var headerCells = this._$table.find('>thead th.jtable-column-header');

            //Calculate total width of data columns
            var totalWidthInPixel = 0;
            headerCells.each(function () {
                var $cell = $(this);
                if ($cell.is(':visible')) {
                    totalWidthInPixel += $cell.outerWidth();
                }
            });

            //Calculate width of each column
            var columnWidhts = {};
            var availableWidthInPercent = 100.0 - commandColumnHeaders.length;
            headerCells.each(function () {
                var $cell = $(this);
                if ($cell.is(':visible')) {
                    var fieldName = $cell.data('fieldName');
                    var widthInPercent = $cell.outerWidth() * availableWidthInPercent / totalWidthInPixel;
                    columnWidhts[fieldName] = widthInPercent;
                }
            });

            //Set width of each column
            headerCells.each(function () {
                var $cell = $(this);
                if ($cell.is(':visible')) {
                    var fieldName = $cell.data('fieldName');
                    $cell.data('width-in-percent', columnWidhts[fieldName]).css('width', columnWidhts[fieldName] + '%');
                }
            });
        },

        /* Saves field setting to cookie.
        *  Saved setting will be a string like that:
        * fieldName1=visible;23|fieldName2=hidden;17|...
        *************************************************************************/
        _saveColumnSettings: function () {
            var self = this;
            var fieldSettings = '';
            this._$table.find('>thead >tr >th.jtable-column-header').each(function () {
                var $cell = $(this);
                var fieldName = $cell.data('fieldName');
                var columnWidth = $cell.data('width-in-percent');
                var fieldVisibility = self.options.fields[fieldName].visibility;
                var fieldSetting = fieldName + "=" + fieldVisibility + ';' + columnWidth;
                fieldSettings = fieldSettings + fieldSetting + '|';
            });

            this._setCookie('column-settings', fieldSettings.substr(0, fieldSettings.length - 1));
        },

        /* Loads field settings from cookie that is saved by _saveFieldSettings method.
        *************************************************************************/
        _loadColumnSettings: function () {
            var self = this;
            var columnSettingsCookie = this._getCookie('column-settings');
            if (!columnSettingsCookie) {
                return;
            }

            var columnSettings = {};
            $.each(columnSettingsCookie.split('|'), function (inx, fieldSetting) {
                var splitted = fieldSetting.split('=');
                var fieldName = splitted[0];
                var settings = splitted[1].split(';');
                columnSettings[fieldName] = {
                    columnVisibility: settings[0],
                    columnWidth: settings[1]
                };
            });

            var headerCells = this._$table.find('>thead >tr >th.jtable-column-header');
            headerCells.each(function () {
                var $cell = $(this);
                var fieldName = $cell.data('fieldName');
                var field = self.options.fields[fieldName];
                if (columnSettings[fieldName]) {
                    if (field.visibility != 'fixed') {
                        self._changeColumnVisibilityInternal(fieldName, columnSettings[fieldName].columnVisibility);
                    }

                    $cell.data('width-in-percent', columnSettings[fieldName].columnWidth).css('width', columnSettings[fieldName].columnWidth + '%');
                }
            });
        }

    });

})(jQuery);


/************************************************************************
* MASTER/CHILD tables extension for jTable                              *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _removeRowsFromTable: $.hik.jtable.prototype._removeRowsFromTable
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {
            openChildAsAccordion: false
        },

        /************************************************************************
        * PUBLIC METHODS                                                        *
        *************************************************************************/

        /* Creates and opens a new child table for given row.
        *************************************************************************/
        openChildTable: function ($row, tableOptions, opened) {
            var self = this;

            //Apply theming as same as parent table unless explicitily set
            if (tableOptions.jqueryuiTheme == undefined) {
                tableOptions.jqueryuiTheme = self.options.jqueryuiTheme;
            }

            //Show close button as default
            tableOptions.showCloseButton = (tableOptions.showCloseButton != false);

            //Close child table when close button is clicked (default behavior)
            if (tableOptions.showCloseButton && !tableOptions.closeRequested) {
                tableOptions.closeRequested = function () {
                    self.closeChildTable($row);
                };
            }

            //If accordion style, close open child table (if it does exists)
            if (self.options.openChildAsAccordion) {
                $row.siblings('.jtable-data-row').each(function () {
                    self.closeChildTable($(this));
                });
            }

            //Close child table for this row and open new one for child table
            self.closeChildTable($row, function () {
                var $childRowColumn = self.getChildRow($row).children('td').empty();
                var $childTableContainer = $('<div />')
                    .addClass('jtable-child-table-container')
                    .appendTo($childRowColumn);
                $childRowColumn.data('childTable', $childTableContainer);
                $childTableContainer.jtable(tableOptions);
                self.openChildRow($row);
                $childTableContainer.hide().slideDown('fast', function () {
                    if (opened) {
                        opened({
                             childTable: $childTableContainer
                        });
                    }
                });
            });
        },

        /* Closes child table for given row.
        *************************************************************************/
        closeChildTable: function ($row, closed) {
            var self = this;
            
            var $childRowColumn = this.getChildRow($row).children('td');
            var $childTable = $childRowColumn.data('childTable');
            if (!$childTable) {
                if (closed) {
                    closed();
                }

                return;
            }

            $childRowColumn.data('childTable', null);
            $childTable.slideUp('fast', function () {
                $childTable.jtable('destroy');
                $childTable.remove();
                self.closeChildRow($row);
                if (closed) {
                    closed();
                }
            });
        },

        /* Returns a boolean value indicates that if a child row is open for given row.
        *************************************************************************/
        isChildRowOpen: function ($row) {
            return (this.getChildRow($row).is(':visible'));
        },

        /* Gets child row for given row, opens it if it's closed (Creates if needed).
        *************************************************************************/
        getChildRow: function ($row) {
            return $row.data('childRow') || this._createChildRow($row);
        },

        /* Creates and opens child row for given row.
        *************************************************************************/
        openChildRow: function ($row) {
            var $childRow = this.getChildRow($row);
            if (!$childRow.is(':visible')) {
                $childRow.show();
            }

            return $childRow;
        },

        /* Closes child row if it's open.
        *************************************************************************/
        closeChildRow: function ($row) {
            var $childRow = this.getChildRow($row);
            if ($childRow.is(':visible')) {
                $childRow.hide();
            }
        },

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides _removeRowsFromTable method to remove child rows of deleted rows.
        *************************************************************************/
        _removeRowsFromTable: function ($rows, reason) {
            //var self = this;

            if (reason == 'deleted') {
                $rows.each(function () {
                    var $row = $(this);
                    var $childRow = $row.data('childRow');
                    if ($childRow) {
                        //self.closeChildTable($row); //Removed since it causes "Uncaught Error: cannot call methods on jtable prior to initialization; attempted to call method 'destroy'"
                        $childRow.remove();
                    }
                });
            }

            base._removeRowsFromTable.apply(this, arguments);
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Creates a child row for a row, hides and returns it.
        *************************************************************************/
        _createChildRow: function ($row) {
            var totalColumnCount = this._$table.find('thead th').length;
            var $childRow = $('<tr></tr>')
                .addClass('jtable-child-row')
                .append('<td colspan="' + totalColumnCount + '"></td>');
            $row.after($childRow);
            $row.data('childRow', $childRow);
            $childRow.hide();
            return $childRow;
        }

    });

})(jQuery);

/*
 * Inline Form Validation Engine 2.6.2, jQuery plugin
 *
 * Copyright(c) 2010, Cedric Dugas
 * http://www.position-absolute.com
 *
 * 2.0 Rewrite by Olivier Refalo
 * http://www.crionics.com
 *
 * Form validation engine allowing custom regex rules to be added.
 * Licensed under the MIT License
 */
 (function($) {

	"use strict";

	var methods = {

		/**
		* Kind of the constructor, called before any action
		* @param {Map} user options
		*/
		init: function(options) {
			var form = this;
			if (!form.data('jqv') || form.data('jqv') == null ) {
				options = methods._saveOptions(form, options);
				// bind all formError elements to close on click
				$(document).on("click", ".formError", function() {
					$(this).fadeOut(150, function() {
						// remove prompt once invisible
						$(this).parent('.formErrorOuter').remove();
						$(this).remove();
					});
				});
			}
			return this;
		 },
		/**
		* Attachs jQuery.validationEngine to form.submit and field.blur events
		* Takes an optional params: a list of options
		* ie. jQuery("#formID1").validationEngine('attach', {promptPosition : "centerRight"});
		*/
		attach: function(userOptions) {

			var form = this;
			var options;

			if(userOptions)
				options = methods._saveOptions(form, userOptions);
			else
				options = form.data('jqv');

			options.validateAttribute = (form.find("[data-validation-engine*=validate]").length) ? "data-validation-engine" : "class";
			if (options.binded) {

				// delegate fields
				form.on(options.validationEventTrigger, "["+options.validateAttribute+"*=validate]:not([type=checkbox]):not([type=radio]):not(.datepicker)", methods._onFieldEvent);
				form.on("click", "["+options.validateAttribute+"*=validate][type=checkbox],["+options.validateAttribute+"*=validate][type=radio]", methods._onFieldEvent);
				form.on(options.validationEventTrigger,"["+options.validateAttribute+"*=validate][class*=datepicker]", {"delay": 300}, methods._onFieldEvent);
			}
			if (options.autoPositionUpdate) {
				$(window).bind("resize", {
					"noAnimation": true,
					"formElem": form
				}, methods.updatePromptsPosition);
			}
			form.on("click","a[data-validation-engine-skip], a[class*='validate-skip'], button[data-validation-engine-skip], button[class*='validate-skip'], input[data-validation-engine-skip], input[class*='validate-skip']", methods._submitButtonClick);
			form.removeData('jqv_submitButton');

			// bind form.submit
			form.on("submit", methods._onSubmitEvent);
			return this;
		},
		/**
		* Unregisters any bindings that may point to jQuery.validaitonEngine
		*/
		detach: function() {

			var form = this;
			var options = form.data('jqv');

			// unbind fields
			form.find("["+options.validateAttribute+"*=validate]").not("[type=checkbox]").off(options.validationEventTrigger, methods._onFieldEvent);
			form.find("["+options.validateAttribute+"*=validate][type=checkbox],[class*=validate][type=radio]").off("click", methods._onFieldEvent);

			// unbind form.submit
			form.off("submit", methods.onAjaxFormComplete);

			// unbind form.submit
			form.off("submit", methods.onAjaxFormComplete);
			form.removeData('jqv');
            
			form.off("click", "a[data-validation-engine-skip], a[class*='validate-skip'], button[data-validation-engine-skip], button[class*='validate-skip'], input[data-validation-engine-skip], input[class*='validate-skip']", methods._submitButtonClick);
			form.removeData('jqv_submitButton');

			if (options.autoPositionUpdate)
				$(window).unbind("resize", methods.updatePromptsPosition);

			return this;
		},
		/**
		* Validates either a form or a list of fields, shows prompts accordingly.
		* Note: There is no ajax form validation with this method, only field ajax validation are evaluated
		*
		* @return true if the form validates, false if it fails
		*/
		validate: function() {
			var element = $(this);
			var valid = null;

			if (element.is("form") || element.hasClass("validationEngineContainer")) {
				if (element.hasClass('validating')) {
					// form is already validating.
					// Should abort old validation and start new one. I don't know how to implement it.
					return false;
				} else {				
					element.addClass('validating');
					var options = element.data('jqv');
					var valid = methods._validateFields(this);

					// If the form doesn't validate, clear the 'validating' class before the user has a chance to submit again
					setTimeout(function(){
						element.removeClass('validating');
					}, 100);
					if (valid && options.onSuccess) {
						options.onSuccess();
					} else if (!valid && options.onFailure) {
						options.onFailure();
					}
				}
			} else if (element.is('form') || element.hasClass('validationEngineContainer')) {
				element.removeClass('validating');
			} else {
				// field validation
				var form = element.closest('form, .validationEngineContainer'),
					options = (form.data('jqv')) ? form.data('jqv') : $.validationEngine.defaults,
					valid = methods._validateField(element, options);

				if (valid && options.onFieldSuccess)
					options.onFieldSuccess();
				else if (options.onFieldFailure && options.InvalidFields.length > 0) {
					options.onFieldFailure();
				}
			}
			if(options.onValidationComplete) {
				// !! ensures that an undefined return is interpreted as return false but allows a onValidationComplete() to possibly return true and have form continue processing
				return !!options.onValidationComplete(form, valid);
			}
			return valid;
		},
		/**
		*  Redraw prompts position, useful when you change the DOM state when validating
		*/
		updatePromptsPosition: function(event) {

			if (event && this == window) {
				var form = event.data.formElem;
				var noAnimation = event.data.noAnimation;
			}
			else
				var form = $(this.closest('form, .validationEngineContainer'));

			var options = form.data('jqv');
			// No option, take default one
			form.find('['+options.validateAttribute+'*=validate]').not(":disabled").each(function(){
				var field = $(this);
				if (options.prettySelect && field.is(":hidden"))
				  field = form.find("#" + options.usePrefix + field.attr('id') + options.useSuffix);
				var prompt = methods._getPrompt(field);
				var promptText = $(prompt).find(".formErrorContent").html();

				if(prompt)
					methods._updatePrompt(field, $(prompt), promptText, undefined, false, options, noAnimation);
			});
			return this;
		},
		/**
		* Displays a prompt on a element.
		* Note that the element needs an id!
		*
		* @param {String} promptText html text to display type
		* @param {String} type the type of bubble: 'pass' (green), 'load' (black) anything else (red)
		* @param {String} possible values topLeft, topRight, bottomLeft, centerRight, bottomRight
		*/
		showPrompt: function(promptText, type, promptPosition, showArrow) {
			var form = this.closest('form, .validationEngineContainer');
			var options = form.data('jqv');
			// No option, take default one
			if(!options)
				options = methods._saveOptions(this, options);
			if(promptPosition)
				options.promptPosition=promptPosition;
			options.showArrow = showArrow==true;

			methods._showPrompt(this, promptText, type, false, options);
			return this;
		},
		/**
		* Closes form error prompts, CAN be invidual
		*/
		hide: function() {
			 var form = $(this).closest('form, .validationEngineContainer');
			 var options = form.data('jqv');
			 var fadeDuration = (options && options.fadeDuration) ? options.fadeDuration : 0.3;
			 var closingtag;
			 
			 if($(this).is("form") || $(this).hasClass("validationEngineContainer")) {
				 closingtag = "parentForm"+methods._getClassName($(this).attr("id"));
			 } else {
				 closingtag = methods._getClassName($(this).attr("id")) +"formError";
			 }
			 $('.'+closingtag).fadeTo(fadeDuration, 0.3, function() {
				 $(this).parent('.formErrorOuter').remove();
				 $(this).remove();
			 });
			 return this;
		 },
		 /**
		 * Closes all error prompts on the page
		 */
		 hideAll: function() {

			 var form = this;
			 var options = form.data('jqv');
			 var duration = options ? options.fadeDuration:300;
			 $('.formError').fadeTo(duration, 300, function() {
				 $(this).parent('.formErrorOuter').remove();
				 $(this).remove();
			 });
			 return this;
		 },
		/**
		* Typically called when user exists a field using tab or a mouse click, triggers a field
		* validation
		*/
		_onFieldEvent: function(event) {
			var field = $(this);
			var form = field.closest('form, .validationEngineContainer');
			var options = form.data('jqv');
			options.eventTrigger = "field";
			// validate the current field
			window.setTimeout(function() {
				methods._validateField(field, options);
				if (options.InvalidFields.length == 0 && options.onFieldSuccess) {
					options.onFieldSuccess();
				} else if (options.InvalidFields.length > 0 && options.onFieldFailure) {
					options.onFieldFailure();
				}
			}, (event.data) ? event.data.delay : 0);

		},
		/**
		* Called when the form is submited, shows prompts accordingly
		*
		* @param {jqObject}
		*            form
		* @return false if form submission needs to be cancelled
		*/
		_onSubmitEvent: function() {
			var form = $(this);
			var options = form.data('jqv');
			
			//check if it is trigger from skipped button
			if (form.data("jqv_submitButton")){
				var submitButton = $("#" + form.data("jqv_submitButton"));
				if (submitButton){
					if (submitButton.length > 0){
						if (submitButton.hasClass("validate-skip") || submitButton.attr("data-validation-engine-skip") == "true")
							return true;
					}
				}
			}

			options.eventTrigger = "submit";

			// validate each field 
			// (- skip field ajax validation, not necessary IF we will perform an ajax form validation)
			var r=methods._validateFields(form);

			if (r && options.ajaxFormValidation) {
				methods._validateFormWithAjax(form, options);
				// cancel form auto-submission - process with async call onAjaxFormComplete
				return false;
			}

			if(options.onValidationComplete) {
				// !! ensures that an undefined return is interpreted as return false but allows a onValidationComplete() to possibly return true and have form continue processing
				return !!options.onValidationComplete(form, r);
			}
			return r;
		},
		/**
		* Return true if the ajax field validations passed so far
		* @param {Object} options
		* @return true, is all ajax validation passed so far (remember ajax is async)
		*/
		_checkAjaxStatus: function(options) {
			var status = true;
			$.each(options.ajaxValidCache, function(key, value) {
				if (!value) {
					status = false;
					// break the each
					return false;
				}
			});
			return status;
		},
		
		/**
		* Return true if the ajax field is validated
		* @param {String} fieldid
		* @param {Object} options
		* @return true, if validation passed, false if false or doesn't exist
		*/
		_checkAjaxFieldStatus: function(fieldid, options) {
			return options.ajaxValidCache[fieldid] == true;
		},
		/**
		* Validates form fields, shows prompts accordingly
		*
		* @param {jqObject}
		*            form
		* @param {skipAjaxFieldValidation}
		*            boolean - when set to true, ajax field validation is skipped, typically used when the submit button is clicked
		*
		* @return true if form is valid, false if not, undefined if ajax form validation is done
		*/
		_validateFields: function(form) {
			var options = form.data('jqv');

			// this variable is set to true if an error is found
			var errorFound = false;

			// Trigger hook, start validation
			form.trigger("jqv.form.validating");
			// first, evaluate status of non ajax fields
			var first_err=null;
			form.find('['+options.validateAttribute+'*=validate]').not(":disabled").each( function() {
				var field = $(this);
				var names = [];
				if ($.inArray(field.attr('name'), names) < 0) {
					errorFound |= methods._validateField(field, options);
					if (errorFound && first_err==null)
						if (field.is(":hidden") && options.prettySelect)
										 first_err = field = form.find("#" + options.usePrefix + methods._jqSelector(field.attr('id')) + options.useSuffix);
									else
										 first_err=field;
					if (options.doNotShowAllErrosOnSubmit)
						return false;
					names.push(field.attr('name'));

					//if option set, stop checking validation rules after one error is found
					if(options.showOneMessage == true && errorFound){
						return false;
					}
				}
			});

			// second, check to see if all ajax calls completed ok
			// errorFound |= !methods._checkAjaxStatus(options);

			// third, check status and scroll the container accordingly
			form.trigger("jqv.form.result", [errorFound]);

			if (errorFound) {
				if (options.scroll) {
					var destination=first_err.offset().top;
					var fixleft = first_err.offset().left;

					//prompt positioning adjustment support. Usage: positionType:Xshift,Yshift (for ex.: bottomLeft:+20 or bottomLeft:-20,+10)
					var positionType=options.promptPosition;
					if (typeof(positionType)=='string' && positionType.indexOf(":")!=-1)
						positionType=positionType.substring(0,positionType.indexOf(":"));

					if (positionType!="bottomRight" && positionType!="bottomLeft") {
						var prompt_err= methods._getPrompt(first_err);
						if (prompt_err) {
							destination=prompt_err.offset().top;
						}
					}
					
					// Offset the amount the page scrolls by an amount in px to accomodate fixed elements at top of page
					if (options.scrollOffset) {
						destination -= options.scrollOffset;
					}

					// get the position of the first error, there should be at least one, no need to check this
					//var destination = form.find(".formError:not('.greenPopup'):first").offset().top;
					if (options.isOverflown) {
						var overflowDIV = $(options.overflownDIV);
						if(!overflowDIV.length) return false;
						var scrollContainerScroll = overflowDIV.scrollTop();
						var scrollContainerPos = -parseInt(overflowDIV.offset().top);

						destination += scrollContainerScroll + scrollContainerPos - 5;
						var scrollContainer = $(options.overflownDIV + ":not(:animated)");

						scrollContainer.animate({ scrollTop: destination }, 1100, function(){
							if(options.focusFirstField) first_err.focus();
						});

					} else {
						$("html, body").animate({
							scrollTop: destination
						}, 1100, function(){
							if(options.focusFirstField) first_err.focus();
						});
						$("html, body").animate({scrollLeft: fixleft},1100)
					}

				} else if(options.focusFirstField)
					first_err.focus();
				return false;
			}
			return true;
		},
		/**
		* This method is called to perform an ajax form validation.
		* During this process all the (field, value) pairs are sent to the server which returns a list of invalid fields or true
		*
		* @param {jqObject} form
		* @param {Map} options
		*/
		_validateFormWithAjax: function(form, options) {

			var data = form.serialize();
									var type = (options.ajaxFormValidationMethod) ? options.ajaxFormValidationMethod : "GET";
			var url = (options.ajaxFormValidationURL) ? options.ajaxFormValidationURL : form.attr("action");
									var dataType = (options.dataType) ? options.dataType : "json";
			$.ajax({
				type: type,
				url: url,
				cache: false,
				dataType: dataType,
				data: data,
				form: form,
				methods: methods,
				options: options,
				beforeSend: function() {
					return options.onBeforeAjaxFormValidation(form, options);
				},
				error: function(data, transport) {
					methods._ajaxError(data, transport);
				},
				success: function(json) {
					if ((dataType == "json") && (json !== true)) {
						// getting to this case doesn't necessary means that the form is invalid
						// the server may return green or closing prompt actions
						// this flag helps figuring it out
						var errorInForm=false;
						for (var i = 0; i < json.length; i++) {
							var value = json[i];

							var errorFieldId = value[0];
							var errorField = $($("#" + errorFieldId)[0]);

							// make sure we found the element
							if (errorField.length == 1) {

								// promptText or selector
								var msg = value[2];
								// if the field is valid
								if (value[1] == true) {

									if (msg == ""  || !msg){
										// if for some reason, status==true and error="", just close the prompt
										methods._closePrompt(errorField);
									} else {
										// the field is valid, but we are displaying a green prompt
										if (options.allrules[msg]) {
											var txt = options.allrules[msg].alertTextOk;
											if (txt)
												msg = txt;
										}
										if (options.showPrompts) methods._showPrompt(errorField, msg, "pass", false, options, true);
									}
								} else {
									// the field is invalid, show the red error prompt
									errorInForm|=true;
									if (options.allrules[msg]) {
										var txt = options.allrules[msg].alertText;
										if (txt)
											msg = txt;
									}
									if(options.showPrompts) methods._showPrompt(errorField, msg, "", false, options, true);
								}
							}
						}
						options.onAjaxFormComplete(!errorInForm, form, json, options);
					} else
						options.onAjaxFormComplete(true, form, json, options);

				}
			});

		},
		/**
		* Validates field, shows prompts accordingly
		*
		* @param {jqObject}
		*            field
		* @param {Array[String]}
		*            field's validation rules
		* @param {Map}
		*            user options
		* @return false if field is valid (It is inversed for *fields*, it return false on validate and true on errors.)
		*/
		_validateField: function(field, options, skipAjaxValidation) {
			if (!field.attr("id")) {
				field.attr("id", "form-validation-field-" + $.validationEngine.fieldIdCounter);
				++$.validationEngine.fieldIdCounter;
			}

           if (!options.validateNonVisibleFields && (field.is(":hidden") && !options.prettySelect || field.parent().is(":hidden")))
				return false;

			var rulesParsing = field.attr(options.validateAttribute);
			var getRules = /validate\[(.*)\]/.exec(rulesParsing);

			if (!getRules)
				return false;
			var str = getRules[1];
			var rules = str.split(/\[|,|\]/);

			// true if we ran the ajax validation, tells the logic to stop messing with prompts
			var isAjaxValidator = false;
			var fieldName = field.attr("name");
			var promptText = "";
			var promptType = "";
			var required = false;
			var limitErrors = false;
			options.isError = false;
			options.showArrow = true;
			
			// If the programmer wants to limit the amount of error messages per field,
			if (options.maxErrorsPerField > 0) {
				limitErrors = true;
			}

			var form = $(field.closest("form, .validationEngineContainer"));
			// Fix for adding spaces in the rules
			for (var i = 0; i < rules.length; i++) {
				rules[i] = rules[i].replace(" ", "");
				// Remove any parsing errors
				if (rules[i] === '') {
					delete rules[i];
				}
			}

			for (var i = 0, field_errors = 0; i < rules.length; i++) {
				
				// If we are limiting errors, and have hit the max, break
				if (limitErrors && field_errors >= options.maxErrorsPerField) {
					// If we haven't hit a required yet, check to see if there is one in the validation rules for this
					// field and that it's index is greater or equal to our current index
					if (!required) {
						var have_required = $.inArray('required', rules);
						required = (have_required != -1 &&  have_required >= i);
					}
					break;
				}
				
				
				var errorMsg = undefined;
				switch (rules[i]) {

					case "required":
						required = true;
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._required);
						break;
					case "custom":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._custom);
						break;
					case "groupRequired":
						// Check is its the first of group, if not, reload validation with first field
						// AND continue normal validation on present field
						var classGroup = "["+options.validateAttribute+"*=" +rules[i + 1] +"]";
						var firstOfGroup = form.find(classGroup).eq(0);
						if(firstOfGroup[0] != field[0]){

							methods._validateField(firstOfGroup, options, skipAjaxValidation); 
							options.showArrow = true;

						}
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._groupRequired);
						if(errorMsg)  required = true;
						options.showArrow = false;
						break;
					case "ajax":
						// AJAX defaults to returning it's loading message
						errorMsg = methods._ajax(field, rules, i, options);
						if (errorMsg) {
							promptType = "load";
						}
						break;
					case "minSize":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._minSize);
						break;
					case "maxSize":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._maxSize);
						break;
					case "min":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._min);
						break;
					case "max":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._max);
						break;
					case "past":
						errorMsg = methods._getErrorMessage(form, field,rules[i], rules, i, options, methods._past);
						break;
					case "future":
						errorMsg = methods._getErrorMessage(form, field,rules[i], rules, i, options, methods._future);
						break;
					case "dateRange":
						var classGroup = "["+options.validateAttribute+"*=" + rules[i + 1] + "]";
						options.firstOfGroup = form.find(classGroup).eq(0);
						options.secondOfGroup = form.find(classGroup).eq(1);

						//if one entry out of the pair has value then proceed to run through validation
						if (options.firstOfGroup[0].value || options.secondOfGroup[0].value) {
							errorMsg = methods._getErrorMessage(form, field,rules[i], rules, i, options, methods._dateRange);
						}
						if (errorMsg) required = true;
						options.showArrow = false;
						break;

					case "dateTimeRange":
						var classGroup = "["+options.validateAttribute+"*=" + rules[i + 1] + "]";
						options.firstOfGroup = form.find(classGroup).eq(0);
						options.secondOfGroup = form.find(classGroup).eq(1);

						//if one entry out of the pair has value then proceed to run through validation
						if (options.firstOfGroup[0].value || options.secondOfGroup[0].value) {
							errorMsg = methods._getErrorMessage(form, field,rules[i], rules, i, options, methods._dateTimeRange);
						}
						if (errorMsg) required = true;
						options.showArrow = false;
						break;
					case "maxCheckbox":
						field = $(form.find("input[name='" + fieldName + "']"));
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._maxCheckbox);
						break;
					case "minCheckbox":
						field = $(form.find("input[name='" + fieldName + "']"));
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._minCheckbox);
						break;
					case "equals":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._equals);
						break;
					case "funcCall":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._funcCall);
						break;
					case "creditCard":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._creditCard);
						break;
					case "condRequired":
						errorMsg = methods._getErrorMessage(form, field, rules[i], rules, i, options, methods._condRequired);
						if (errorMsg !== undefined) {
							required = true;
						}
						break;

					default:
				}
				
				var end_validation = false;
				
				// If we were passed back an message object, check what the status was to determine what to do
				if (typeof errorMsg == "object") {
					switch (errorMsg.status) {
						case "_break":
							end_validation = true;
							break;
						// If we have an error message, set errorMsg to the error message
						case "_error":
							errorMsg = errorMsg.message;
							break;
						// If we want to throw an error, but not show a prompt, return early with true
						case "_error_no_prompt":
							return true;
							break;
						// Anything else we continue on
						default:
							break;
					}
				}
				
				// If it has been specified that validation should end now, break
				if (end_validation) {
					break;
				}
				
				// If we have a string, that means that we have an error, so add it to the error message.
				if (typeof errorMsg == 'string') {
					promptText += errorMsg + "<br/>";
					options.isError = true;
					field_errors++;
				}	
			}
			// If the rules required is not added, an empty field is not validated
			if(!required && !(field.val()) && field.val().length < 1) options.isError = false;

			// Hack for radio/checkbox group button, the validation go into the
			// first radio/checkbox of the group
			var fieldType = field.prop("type");
			var positionType=field.data("promptPosition") || options.promptPosition;

			if ((fieldType == "radio" || fieldType == "checkbox") && form.find("input[name='" + fieldName + "']").size() > 1) {
				if(positionType === 'inline') {
					field = $(form.find("input[name='" + fieldName + "'][type!=hidden]:last"));
				} else {
				field = $(form.find("input[name='" + fieldName + "'][type!=hidden]:first"));
				}
				options.showArrow = false;
			}

			if(field.is(":hidden") && options.prettySelect) {
				field = form.find("#" + options.usePrefix + methods._jqSelector(field.attr('id')) + options.useSuffix);
			}

			if (options.isError && options.showPrompts){
				methods._showPrompt(field, promptText, promptType, false, options);
			}else{
				if (!isAjaxValidator) methods._closePrompt(field);
			}

			if (!isAjaxValidator) {
				field.trigger("jqv.field.result", [field, options.isError, promptText]);
			}

			/* Record error */
			var errindex = $.inArray(field[0], options.InvalidFields);
			if (errindex == -1) {
				if (options.isError)
				options.InvalidFields.push(field[0]);
			} else if (!options.isError) {
				options.InvalidFields.splice(errindex, 1);
			}
				
			methods._handleStatusCssClasses(field, options);
	
			/* run callback function for each field */
			if (options.isError && options.onFieldFailure)
				options.onFieldFailure(field);

			if (!options.isError && options.onFieldSuccess)
				options.onFieldSuccess(field);

			return options.isError;
		},
		/**
		* Handling css classes of fields indicating result of validation 
		*
		* @param {jqObject}
		*            field
		* @param {Array[String]}
		*            field's validation rules            
		* @private
		*/
		_handleStatusCssClasses: function(field, options) {
			/* remove all classes */
			if(options.addSuccessCssClassToField)
				field.removeClass(options.addSuccessCssClassToField);
			
			if(options.addFailureCssClassToField)
				field.removeClass(options.addFailureCssClassToField);
			
			/* Add classes */
			if (options.addSuccessCssClassToField && !options.isError)
				field.addClass(options.addSuccessCssClassToField);
			
			if (options.addFailureCssClassToField && options.isError)
				field.addClass(options.addFailureCssClassToField);		
		},
		
		 /********************
		  * _getErrorMessage
		  *
		  * @param form
		  * @param field
		  * @param rule
		  * @param rules
		  * @param i
		  * @param options
		  * @param originalValidationMethod
		  * @return {*}
		  * @private
		  */
		 _getErrorMessage:function (form, field, rule, rules, i, options, originalValidationMethod) {
			 // If we are using the custon validation type, build the index for the rule.
			 // Otherwise if we are doing a function call, make the call and return the object
			 // that is passed back.
	 		 var rule_index = jQuery.inArray(rule, rules);
			 if (rule === "custom" || rule === "funcCall") {
				 var custom_validation_type = rules[rule_index + 1];
				 rule = rule + "[" + custom_validation_type + "]";
				 // Delete the rule from the rules array so that it doesn't try to call the
			    // same rule over again
			    delete(rules[rule_index]);
			 }
			 // Change the rule to the composite rule, if it was different from the original
			 var alteredRule = rule;


			 var element_classes = (field.attr("data-validation-engine")) ? field.attr("data-validation-engine") : field.attr("class");
			 var element_classes_array = element_classes.split(" ");

			 // Call the original validation method. If we are dealing with dates or checkboxes, also pass the form
			 var errorMsg;
			 if (rule == "future" || rule == "past"  || rule == "maxCheckbox" || rule == "minCheckbox") {
				 errorMsg = originalValidationMethod(form, field, rules, i, options);
			 } else {
				 errorMsg = originalValidationMethod(field, rules, i, options);
			 }

			 // If the original validation method returned an error and we have a custom error message,
			 // return the custom message instead. Otherwise return the original error message.
			 if (errorMsg != undefined) {
				 var custom_message = methods._getCustomErrorMessage($(field), element_classes_array, alteredRule, options);
				 if (custom_message) errorMsg = custom_message;
			 }
			 return errorMsg;

		 },
		 _getCustomErrorMessage:function (field, classes, rule, options) {
			var custom_message = false;
			var validityProp = /^custom\[.*\]$/.test(rule) ? methods._validityProp["custom"] : methods._validityProp[rule];
			 // If there is a validityProp for this rule, check to see if the field has an attribute for it
			if (validityProp != undefined) {
				custom_message = field.attr("data-errormessage-"+validityProp);
				// If there was an error message for it, return the message
				if (custom_message != undefined) 
					return custom_message;
			}
			custom_message = field.attr("data-errormessage");
			 // If there is an inline custom error message, return it
			if (custom_message != undefined) 
				return custom_message;
			var id = '#' + field.attr("id");
			// If we have custom messages for the element's id, get the message for the rule from the id.
			// Otherwise, if we have custom messages for the element's classes, use the first class message we find instead.
			if (typeof options.custom_error_messages[id] != "undefined" &&
				typeof options.custom_error_messages[id][rule] != "undefined" ) {
						  custom_message = options.custom_error_messages[id][rule]['message'];
			} else if (classes.length > 0) {
				for (var i = 0; i < classes.length && classes.length > 0; i++) {
					 var element_class = "." + classes[i];
					if (typeof options.custom_error_messages[element_class] != "undefined" &&
						typeof options.custom_error_messages[element_class][rule] != "undefined") {
							custom_message = options.custom_error_messages[element_class][rule]['message'];
							break;
					}
				}
			}
			if (!custom_message &&
				typeof options.custom_error_messages[rule] != "undefined" &&
				typeof options.custom_error_messages[rule]['message'] != "undefined"){
					 custom_message = options.custom_error_messages[rule]['message'];
			 }
			 return custom_message;
		 },
		 _validityProp: {
			 "required": "value-missing",
			 "custom": "custom-error",
			 "groupRequired": "value-missing",
			 "ajax": "custom-error",
			 "minSize": "range-underflow",
			 "maxSize": "range-overflow",
			 "min": "range-underflow",
			 "max": "range-overflow",
			 "past": "type-mismatch",
			 "future": "type-mismatch",
			 "dateRange": "type-mismatch",
			 "dateTimeRange": "type-mismatch",
			 "maxCheckbox": "range-overflow",
			 "minCheckbox": "range-underflow",
			 "equals": "pattern-mismatch",
			 "funcCall": "custom-error",
			 "creditCard": "pattern-mismatch",
			 "condRequired": "value-missing"
		 },
		/**
		* Required validation
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @param {bool} condRequired flag when method is used for internal purpose in condRequired check
		* @return an error string if validation failed
		*/
		_required: function(field, rules, i, options, condRequired) {
			switch (field.prop("type")) {
				case "text":
				case "password":
				case "textarea":
				case "file":
				case "select-one":
				case "select-multiple":
				default:
					var field_val      = $.trim( field.val()                               );
					var dv_placeholder = $.trim( field.attr("data-validation-placeholder") );
					var placeholder    = $.trim( field.attr("placeholder")                 );
					if (
						   ( !field_val                                    )
						|| ( dv_placeholder && field_val == dv_placeholder )
						|| ( placeholder    && field_val == placeholder    )
					) {
						return options.allrules[rules[i]].alertText;
					}
					break;
				case "radio":
				case "checkbox":
					// new validation style to only check dependent field
					if (condRequired) {
						if (!field.attr('checked')) {
							return options.allrules[rules[i]].alertTextCheckboxMultiple;
						}
						break;
					}
					// old validation style
					var form = field.closest("form, .validationEngineContainer");
					var name = field.attr("name");
					if (form.find("input[name='" + name + "']:checked").size() == 0) {
						if (form.find("input[name='" + name + "']:visible").size() == 1)
							return options.allrules[rules[i]].alertTextCheckboxe;
						else
							return options.allrules[rules[i]].alertTextCheckboxMultiple;
					}
					break;
			}
		},
		/**
		* Validate that 1 from the group field is required
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_groupRequired: function(field, rules, i, options) {
			var classGroup = "["+options.validateAttribute+"*=" +rules[i + 1] +"]";
			var isValid = false;
			// Check all fields from the group
			field.closest("form, .validationEngineContainer").find(classGroup).each(function(){
				if(!methods._required($(this), rules, i, options)){
					isValid = true;
					return false;
				}
			}); 

			if(!isValid) {
		  return options.allrules[rules[i]].alertText;
		}
		},
		/**
		* Validate rules
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_custom: function(field, rules, i, options) {
			var customRule = rules[i + 1];
			var rule = options.allrules[customRule];
			var fn;
			if(!rule) {
				alert("jqv:custom rule not found - "+customRule);
				return;
			}
			
			if(rule["regex"]) {
				 var ex=rule.regex;
					if(!ex) {
						alert("jqv:custom regex not found - "+customRule);
						return;
					}
					var pattern = new RegExp(ex);

					if (!pattern.test(field.val())) return options.allrules[customRule].alertText;
					
			} else if(rule["func"]) {
				fn = rule["func"]; 
				 
				if (typeof(fn) !== "function") {
					alert("jqv:custom parameter 'function' is no function - "+customRule);
						return;
				}
				 
				if (!fn(field, rules, i, options))
					return options.allrules[customRule].alertText;
			} else {
				alert("jqv:custom type not allowed "+customRule);
					return;
			}
		},
		/**
		* Validate custom function outside of the engine scope
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_funcCall: function(field, rules, i, options) {
			var functionName = rules[i + 1];
			var fn;
			if(functionName.indexOf('.') >-1)
			{
				var namespaces = functionName.split('.');
				var scope = window;
				while(namespaces.length)
				{
					scope = scope[namespaces.shift()];
				}
				fn = scope;
			}
			else
				fn = window[functionName] || options.customFunctions[functionName];
			if (typeof(fn) == 'function')
				return fn(field, rules, i, options);

		},
		/**
		* Field match
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_equals: function(field, rules, i, options) {
			var equalsField = rules[i + 1];

			if (field.val() != $("#" + equalsField).val())
				return options.allrules.equals.alertText;
		},
		/**
		* Check the maximum size (in characters)
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_maxSize: function(field, rules, i, options) {
			var max = rules[i + 1];
			var len = field.val().length;

			if (len > max) {
				var rule = options.allrules.maxSize;
				return rule.alertText + max + rule.alertText2;
			}
		},
		/**
		* Check the minimum size (in characters)
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_minSize: function(field, rules, i, options) {
			var min = rules[i + 1];
			var len = field.val().length;

			if (len < min) {
				var rule = options.allrules.minSize;
				return rule.alertText + min + rule.alertText2;
			}
		},
		/**
		* Check number minimum value
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_min: function(field, rules, i, options) {
			var min = parseFloat(rules[i + 1]);
			var len = parseFloat(field.val());

			if (len < min) {
				var rule = options.allrules.min;
				if (rule.alertText2) return rule.alertText + min + rule.alertText2;
				return rule.alertText + min;
			}
		},
		/**
		* Check number maximum value
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_max: function(field, rules, i, options) {
			var max = parseFloat(rules[i + 1]);
			var len = parseFloat(field.val());

			if (len >max ) {
				var rule = options.allrules.max;
				if (rule.alertText2) return rule.alertText + max + rule.alertText2;
				//orefalo: to review, also do the translations
				return rule.alertText + max;
			}
		},
		/**
		* Checks date is in the past
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_past: function(form, field, rules, i, options) {

			var p=rules[i + 1];
			var fieldAlt = $(form.find("input[name='" + p.replace(/^#+/, '') + "']"));
			var pdate;

			if (p.toLowerCase() == "now") {
				pdate = new Date();
			} else if (undefined != fieldAlt.val()) {
				if (fieldAlt.is(":disabled"))
					return;
				pdate = methods._parseDate(fieldAlt.val());
			} else {
				pdate = methods._parseDate(p);
			}
			var vdate = methods._parseDate(field.val());

			if (vdate > pdate ) {
				var rule = options.allrules.past;
				if (rule.alertText2) return rule.alertText + methods._dateToString(pdate) + rule.alertText2;
				return rule.alertText + methods._dateToString(pdate);
			}
		},
		/**
		* Checks date is in the future
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_future: function(form, field, rules, i, options) {

			var p=rules[i + 1];
			var fieldAlt = $(form.find("input[name='" + p.replace(/^#+/, '') + "']"));
			var pdate;

			if (p.toLowerCase() == "now") {
				pdate = new Date();
			} else if (undefined != fieldAlt.val()) {
				if (fieldAlt.is(":disabled"))
					return;
				pdate = methods._parseDate(fieldAlt.val());
			} else {
				pdate = methods._parseDate(p);
			}
			var vdate = methods._parseDate(field.val());

			if (vdate < pdate ) {
				var rule = options.allrules.future;
				if (rule.alertText2)
					return rule.alertText + methods._dateToString(pdate) + rule.alertText2;
				return rule.alertText + methods._dateToString(pdate);
			}
		},
		/**
		* Checks if valid date
		*
		* @param {string} date string
		* @return a bool based on determination of valid date
		*/
		_isDate: function (value) {
			var dateRegEx = new RegExp(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$|^(?:(?:(?:0?[13578]|1[02])(\/|-)31)|(?:(?:0?[1,3-9]|1[0-2])(\/|-)(?:29|30)))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(?:(?:0?[1-9]|1[0-2])(\/|-)(?:0?[1-9]|1\d|2[0-8]))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^(0?2(\/|-)29)(\/|-)(?:(?:0[48]00|[13579][26]00|[2468][048]00)|(?:\d\d)?(?:0[48]|[2468][048]|[13579][26]))$/);
			return dateRegEx.test(value);
		},
		/**
		* Checks if valid date time
		*
		* @param {string} date string
		* @return a bool based on determination of valid date time
		*/
		_isDateTime: function (value){
			var dateTimeRegEx = new RegExp(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])\s+(1[012]|0?[1-9]){1}:(0?[1-5]|[0-6][0-9]){1}:(0?[0-6]|[0-6][0-9]){1}\s+(am|pm|AM|PM){1}$|^(?:(?:(?:0?[13578]|1[02])(\/|-)31)|(?:(?:0?[1,3-9]|1[0-2])(\/|-)(?:29|30)))(\/|-)(?:[1-9]\d\d\d|\d[1-9]\d\d|\d\d[1-9]\d|\d\d\d[1-9])$|^((1[012]|0?[1-9]){1}\/(0?[1-9]|[12][0-9]|3[01]){1}\/\d{2,4}\s+(1[012]|0?[1-9]){1}:(0?[1-5]|[0-6][0-9]){1}:(0?[0-6]|[0-6][0-9]){1}\s+(am|pm|AM|PM){1})$/);
			return dateTimeRegEx.test(value);
		},
		//Checks if the start date is before the end date
		//returns true if end is later than start
		_dateCompare: function (start, end) {
			return (new Date(start.toString()) < new Date(end.toString()));
		},
		/**
		* Checks date range
		*
		* @param {jqObject} first field name
		* @param {jqObject} second field name
		* @return an error string if validation failed
		*/
		_dateRange: function (field, rules, i, options) {
			//are not both populated
			if ((!options.firstOfGroup[0].value && options.secondOfGroup[0].value) || (options.firstOfGroup[0].value && !options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}

			//are not both dates
			if (!methods._isDate(options.firstOfGroup[0].value) || !methods._isDate(options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}

			//are both dates but range is off
			if (!methods._dateCompare(options.firstOfGroup[0].value, options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}
		},
		/**
		* Checks date time range
		*
		* @param {jqObject} first field name
		* @param {jqObject} second field name
		* @return an error string if validation failed
		*/
		_dateTimeRange: function (field, rules, i, options) {
			//are not both populated
			if ((!options.firstOfGroup[0].value && options.secondOfGroup[0].value) || (options.firstOfGroup[0].value && !options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}
			//are not both dates
			if (!methods._isDateTime(options.firstOfGroup[0].value) || !methods._isDateTime(options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}
			//are both dates but range is off
			if (!methods._dateCompare(options.firstOfGroup[0].value, options.secondOfGroup[0].value)) {
				return options.allrules[rules[i]].alertText + options.allrules[rules[i]].alertText2;
			}
		},
		/**
		* Max number of checkbox selected
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_maxCheckbox: function(form, field, rules, i, options) {

			var nbCheck = rules[i + 1];
			var groupname = field.attr("name");
			var groupSize = form.find("input[name='" + groupname + "']:checked").size();
			if (groupSize > nbCheck) {
				options.showArrow = false;
				if (options.allrules.maxCheckbox.alertText2)
					 return options.allrules.maxCheckbox.alertText + " " + nbCheck + " " + options.allrules.maxCheckbox.alertText2;
				return options.allrules.maxCheckbox.alertText;
			}
		},
		/**
		* Min number of checkbox selected
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_minCheckbox: function(form, field, rules, i, options) {

			var nbCheck = rules[i + 1];
			var groupname = field.attr("name");
			var groupSize = form.find("input[name='" + groupname + "']:checked").size();
			if (groupSize < nbCheck) {
				options.showArrow = false;
				return options.allrules.minCheckbox.alertText + " " + nbCheck + " " + options.allrules.minCheckbox.alertText2;
			}
		},
		/**
		* Checks that it is a valid credit card number according to the
		* Luhn checksum algorithm.
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return an error string if validation failed
		*/
		_creditCard: function(field, rules, i, options) {
			//spaces and dashes may be valid characters, but must be stripped to calculate the checksum.
			var valid = false, cardNumber = field.val().replace(/ +/g, '').replace(/-+/g, '');

			var numDigits = cardNumber.length;
			if (numDigits >= 14 && numDigits <= 16 && parseInt(cardNumber) > 0) {

				var sum = 0, pos = 1, digit, luhn = new String();
				i = numDigits - 1;
				do {
					digit = parseInt(cardNumber.charAt(i));
					luhn += (pos++ % 2 == 0) ? digit * 2 : digit;
				} while (--i >= 0)

				for (i = 0; i < luhn.length; i++) {
					sum += parseInt(luhn.charAt(i));
				}
				valid = sum % 10 == 0;
			}
			if (!valid) return options.allrules.creditCard.alertText;
		},
		/**
		* Ajax field validation
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		*            user options
		* @return nothing! the ajax validator handles the prompts itself
		*/
		 _ajax: function(field, rules, i, options) {

			 var errorSelector = rules[i + 1];
			 var rule = options.allrules[errorSelector];
			 var extraData = rule.extraData;
			 var extraDataDynamic = rule.extraDataDynamic;
			 var data = {
				"fieldId" : field.attr("id"),
				"fieldValue" : field.val()
			 };

			 if (typeof extraData === "object") {
				$.extend(data, extraData);
			 } else if (typeof extraData === "string") {
				var tempData = extraData.split("&");
				for(i = 0; i < tempData.length; i++) {
					var values = tempData[i].split("=");
					if (values[0] && values[0]) {
						data[values[0]] = values[1];
					}
				}
			 }

			 if (extraDataDynamic) {
				 var tmpData = [];
				 var domIds = String(extraDataDynamic).split(",");
				 for (i = 0; i < domIds.length; i++) {
					 var id = domIds[i];
					 if ($(id).length) {
						 var inputValue = field.closest("form, .validationEngineContainer").find(id).val();
						 var keyValue = id.replace('#', '') + '=' + escape(inputValue);
						 data[id.replace('#', '')] = inputValue;
					 }
				 }
			 }
			 
			 // If a field change event triggered this we want to clear the cache for this ID
			 if (options.eventTrigger == "field") {
				delete(options.ajaxValidCache[field.attr("id")]);
			 }

			 // If there is an error or if the the field is already validated, do not re-execute AJAX
			 if (!options.isError && !methods._checkAjaxFieldStatus(field.attr("id"), options)) {
				 $.ajax({
					 type: options.ajaxFormValidationMethod,
					 url: rule.url,
					 cache: false,
					 dataType: "json",
					 data: data,
					 field: field,
					 rule: rule,
					 methods: methods,
					 options: options,
					 beforeSend: function() {},
					 error: function(data, transport) {
						 methods._ajaxError(data, transport);
					 },
					 success: function(json) {

						 // asynchronously called on success, data is the json answer from the server
						 var errorFieldId = json[0];
						 //var errorField = $($("#" + errorFieldId)[0]);
						 var errorField = $("#"+ errorFieldId).eq(0);

						 // make sure we found the element
						 if (errorField.length == 1) {
							 var status = json[1];
							 // read the optional msg from the server
							 var msg = json[2];
							 if (!status) {
								 // Houston we got a problem - display an red prompt
								 options.ajaxValidCache[errorFieldId] = false;
								 options.isError = true;

								 // resolve the msg prompt
								 if(msg) {
									 if (options.allrules[msg]) {
										 var txt = options.allrules[msg].alertText;
										 if (txt) {
											msg = txt;
							}
									 }
								 }
								 else
									msg = rule.alertText;

								 if (options.showPrompts) methods._showPrompt(errorField, msg, "", true, options);
							 } else {
								 options.ajaxValidCache[errorFieldId] = true;

								 // resolves the msg prompt
								 if(msg) {
									 if (options.allrules[msg]) {
										 var txt = options.allrules[msg].alertTextOk;
										 if (txt) {
											msg = txt;
							}
									 }
								 }
								 else
								 msg = rule.alertTextOk;

								 if (options.showPrompts) {
									 // see if we should display a green prompt
									 if (msg)
										methods._showPrompt(errorField, msg, "pass", true, options);
									 else
										methods._closePrompt(errorField);
								}
								
								 // If a submit form triggered this, we want to re-submit the form
								 if (options.eventTrigger == "submit")
									field.closest("form").submit();
							 }
						 }
						 errorField.trigger("jqv.field.result", [errorField, options.isError, msg]);
					 }
				 });
				 
				 return rule.alertTextLoad;
			 }
		 },
		/**
		* Common method to handle ajax errors
		*
		* @param {Object} data
		* @param {Object} transport
		*/
		_ajaxError: function(data, transport) {
			if(data.status == 0 && transport == null)
				alert("The page is not served from a server! ajax call failed");
			else if(typeof console != "undefined")
				console.log("Ajax error: " + data.status + " " + transport);
		},
		/**
		* date -> string
		*
		* @param {Object} date
		*/
		_dateToString: function(date) {
			return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
		},
		/**
		* Parses an ISO date
		* @param {String} d
		*/
		_parseDate: function(d) {

			var dateParts = d.split("-");
			if(dateParts==d)
				dateParts = d.split("/");
			if(dateParts==d) {
				dateParts = d.split(".");
				return new Date(dateParts[2], (dateParts[1] - 1), dateParts[0]);
			}
			return new Date(dateParts[0], (dateParts[1] - 1) ,dateParts[2]);
		},
		/**
		* Builds or updates a prompt with the given information
		*
		* @param {jqObject} field
		* @param {String} promptText html text to display type
		* @param {String} type the type of bubble: 'pass' (green), 'load' (black) anything else (red)
		* @param {boolean} ajaxed - use to mark fields than being validated with ajax
		* @param {Map} options user options
		*/
		 _showPrompt: function(field, promptText, type, ajaxed, options, ajaxform) {
			 var prompt = methods._getPrompt(field);
			 // The ajax submit errors are not see has an error in the form,
			 // When the form errors are returned, the engine see 2 bubbles, but those are ebing closed by the engine at the same time
			 // Because no error was found befor submitting
			 if(ajaxform) prompt = false;
			 // Check that there is indded text
			 if($.trim(promptText)){ 
				 if (prompt)
					methods._updatePrompt(field, prompt, promptText, type, ajaxed, options);
				 else
					methods._buildPrompt(field, promptText, type, ajaxed, options);
			}
		 },
		/**
		* Builds and shades a prompt for the given field.
		*
		* @param {jqObject} field
		* @param {String} promptText html text to display type
		* @param {String} type the type of bubble: 'pass' (green), 'load' (black) anything else (red)
		* @param {boolean} ajaxed - use to mark fields than being validated with ajax
		* @param {Map} options user options
		*/
		_buildPrompt: function(field, promptText, type, ajaxed, options) {

			// create the prompt
			var prompt = $('<div>');
			prompt.addClass(methods._getClassName(field.attr("id")) + "formError");
			// add a class name to identify the parent form of the prompt
			prompt.addClass("parentForm"+methods._getClassName(field.closest('form, .validationEngineContainer').attr("id")));
			prompt.addClass("formError");

			switch (type) {
				case "pass":
					prompt.addClass("greenPopup");
					break;
				case "load":
					prompt.addClass("blackPopup");
					break;
				default:
					/* it has error  */
					//alert("unknown popup type:"+type);
			}
			if (ajaxed)
				prompt.addClass("ajaxed");

			// create the prompt content
			var promptContent = $('<div>').addClass("formErrorContent").html(promptText).appendTo(prompt);

			// determine position type
			var positionType=field.data("promptPosition") || options.promptPosition;

			// create the css arrow pointing at the field
			// note that there is no triangle on max-checkbox and radio
			if (options.showArrow) {
				var arrow = $('<div>').addClass("formErrorArrow");

				//prompt positioning adjustment support. Usage: positionType:Xshift,Yshift (for ex.: bottomLeft:+20 or bottomLeft:-20,+10)
				if (typeof(positionType)=='string') 
				{
					var pos=positionType.indexOf(":");
					if(pos!=-1)
						positionType=positionType.substring(0,pos);
				}

				switch (positionType) {
					case "bottomLeft":
					case "bottomRight":
						prompt.find(".formErrorContent").before(arrow);
						arrow.addClass("formErrorArrowBottom").html('<div class="line1"><!-- --></div><div class="line2"><!-- --></div><div class="line3"><!-- --></div><div class="line4"><!-- --></div><div class="line5"><!-- --></div><div class="line6"><!-- --></div><div class="line7"><!-- --></div><div class="line8"><!-- --></div><div class="line9"><!-- --></div><div class="line10"><!-- --></div>');
						break;
					case "topLeft":
					case "topRight":
						arrow.html('<div class="line10"><!-- --></div><div class="line9"><!-- --></div><div class="line8"><!-- --></div><div class="line7"><!-- --></div><div class="line6"><!-- --></div><div class="line5"><!-- --></div><div class="line4"><!-- --></div><div class="line3"><!-- --></div><div class="line2"><!-- --></div><div class="line1"><!-- --></div>');
						prompt.append(arrow);
						break;
				}
			}
			// Add custom prompt class
			if (options.addPromptClass)
				prompt.addClass(options.addPromptClass);

            // Add custom prompt class defined in element
            var requiredOverride = field.attr('data-required-class');
            if(requiredOverride !== undefined) {
                prompt.addClass(requiredOverride);
            } else {
                if(options.prettySelect) {
                    if($('#' + field.attr('id')).next().is('select')) {
                        var prettyOverrideClass = $('#' + field.attr('id').substr(options.usePrefix.length).substring(options.useSuffix.length)).attr('data-required-class');
                        if(prettyOverrideClass !== undefined) {
                            prompt.addClass(prettyOverrideClass);
                        }
                    }
                }
            }

			prompt.css({
				"opacity": 0
			});
			if(positionType === 'inline') {
				prompt.addClass("inline");
				if(typeof field.attr('data-prompt-target') !== 'undefined' && $('#'+field.attr('data-prompt-target')).length > 0) {
					prompt.appendTo($('#'+field.attr('data-prompt-target')));
				} else {
					field.after(prompt);
				}
			} else {
				field.before(prompt);				
			}
			
			var pos = methods._calculatePosition(field, prompt, options);
			prompt.css({
				'position': positionType === 'inline' ? 'relative' : 'absolute',
				"top": pos.callerTopPosition,
				"left": pos.callerleftPosition,
				"marginTop": pos.marginTopSize,
				"opacity": 0
			}).data("callerField", field);
			

			if (options.autoHidePrompt) {
				setTimeout(function(){
					prompt.animate({
						"opacity": 0
					},function(){
						prompt.closest('.formErrorOuter').remove();
						prompt.remove();
					});
				}, options.autoHideDelay);
			} 
			return prompt.animate({
				"opacity": 0.87
			});
		},
		/**
		* Updates the prompt text field - the field for which the prompt
		* @param {jqObject} field
		* @param {String} promptText html text to display type
		* @param {String} type the type of bubble: 'pass' (green), 'load' (black) anything else (red)
		* @param {boolean} ajaxed - use to mark fields than being validated with ajax
		* @param {Map} options user options
		*/
		_updatePrompt: function(field, prompt, promptText, type, ajaxed, options, noAnimation) {

			if (prompt) {
				if (typeof type !== "undefined") {
					if (type == "pass")
						prompt.addClass("greenPopup");
					else
						prompt.removeClass("greenPopup");

					if (type == "load")
						prompt.addClass("blackPopup");
					else
						prompt.removeClass("blackPopup");
				}
				if (ajaxed)
					prompt.addClass("ajaxed");
				else
					prompt.removeClass("ajaxed");

				prompt.find(".formErrorContent").html(promptText);

				var pos = methods._calculatePosition(field, prompt, options);
				var css = {"top": pos.callerTopPosition,
				"left": pos.callerleftPosition,
				"marginTop": pos.marginTopSize};

				if (noAnimation)
					prompt.css(css);
				else
					prompt.animate(css);
			}
		},
		/**
		* Closes the prompt associated with the given field
		*
		* @param {jqObject}
		*            field
		*/
		 _closePrompt: function(field) {
			 var prompt = methods._getPrompt(field);
			 if (prompt)
				 prompt.fadeTo("fast", 0, function() {
					 prompt.parent('.formErrorOuter').remove();
					 prompt.remove();
				 });
		 },
		 closePrompt: function(field) {
			 return methods._closePrompt(field);
		 },
		/**
		* Returns the error prompt matching the field if any
		*
		* @param {jqObject}
		*            field
		* @return undefined or the error prompt (jqObject)
		*/
		_getPrompt: function(field) {
				var formId = $(field).closest('form, .validationEngineContainer').attr('id');
			var className = methods._getClassName(field.attr("id")) + "formError";
				var match = $("." + methods._escapeExpression(className) + '.parentForm' + formId)[0];
			if (match)
			return $(match);
		},
		/**
		  * Returns the escapade classname
		  *
		  * @param {selector}
		  *            className
		  */
		  _escapeExpression: function (selector) {
			  return selector.replace(/([#;&,\.\+\*\~':"\!\^$\[\]\(\)=>\|])/g, "\\$1");
		  },
		/**
		 * returns true if we are in a RTLed document
		 *
		 * @param {jqObject} field
		 */
		isRTL: function(field)
		{
			var $document = $(document);
			var $body = $('body');
			var rtl =
				(field && field.hasClass('rtl')) ||
				(field && (field.attr('dir') || '').toLowerCase()==='rtl') ||
				$document.hasClass('rtl') ||
				($document.attr('dir') || '').toLowerCase()==='rtl' ||
				$body.hasClass('rtl') ||
				($body.attr('dir') || '').toLowerCase()==='rtl';
			return Boolean(rtl);
		},
		/**
		* Calculates prompt position
		*
		* @param {jqObject}
		*            field
		* @param {jqObject}
		*            the prompt
		* @param {Map}
		*            options
		* @return positions
		*/
		_calculatePosition: function (field, promptElmt, options) {

			var promptTopPosition, promptleftPosition, marginTopSize;
			var fieldWidth 	= field.width();
			var fieldLeft 	= field.position().left; 
			var fieldTop 	=  field.position().top;
			var fieldHeight 	=  field.height();	
			var promptHeight = promptElmt.height();


			// is the form contained in an overflown container?
			promptTopPosition = promptleftPosition = 0;
			// compensation for the arrow
			marginTopSize = -promptHeight;
		

			//prompt positioning adjustment support
			//now you can adjust prompt position
			//usage: positionType:Xshift,Yshift
			//for example:
			//   bottomLeft:+20 means bottomLeft position shifted by 20 pixels right horizontally
			//   topRight:20, -15 means topRight position shifted by 20 pixels to right and 15 pixels to top
			//You can use +pixels, - pixels. If no sign is provided than + is default.
			var positionType=field.data("promptPosition") || options.promptPosition;
			var shift1="";
			var shift2="";
			var shiftX=0;
			var shiftY=0;
			if (typeof(positionType)=='string') {
				//do we have any position adjustments ?
				if (positionType.indexOf(":")!=-1) {
					shift1=positionType.substring(positionType.indexOf(":")+1);
					positionType=positionType.substring(0,positionType.indexOf(":"));

					//if any advanced positioning will be needed (percents or something else) - parser should be added here
					//for now we use simple parseInt()

					//do we have second parameter?
					if (shift1.indexOf(",") !=-1) {
						shift2=shift1.substring(shift1.indexOf(",") +1);
						shift1=shift1.substring(0,shift1.indexOf(","));
						shiftY=parseInt(shift2);
						if (isNaN(shiftY)) shiftY=0;
					};

					shiftX=parseInt(shift1);
					if (isNaN(shift1)) shift1=0;

				};
			};

			
			switch (positionType) {
				default:
				case "topRight":
					promptleftPosition +=  fieldLeft + fieldWidth - 30;
					promptTopPosition +=  fieldTop;
					break;

				case "topLeft":
					promptTopPosition +=  fieldTop;
					promptleftPosition += fieldLeft; 
					break;

				case "centerRight":
					promptTopPosition = fieldTop+4;
					marginTopSize = 0;
					promptleftPosition= fieldLeft + field.outerWidth(true)+5;
					break;
				case "centerLeft":
					promptleftPosition = fieldLeft - (promptElmt.width() + 2);
					promptTopPosition = fieldTop+4;
					marginTopSize = 0;
					
					break;

				case "bottomLeft":
					promptTopPosition = fieldTop + field.height() + 5;
					marginTopSize = 0;
					promptleftPosition = fieldLeft;
					break;
				case "bottomRight":
					promptleftPosition = fieldLeft + fieldWidth - 30;
					promptTopPosition =  fieldTop +  field.height() + 5;
					marginTopSize = 0;
					break;
				case "inline":
					promptleftPosition = 0;
					promptTopPosition = 0;
					marginTopSize = 0;
			};

		

			//apply adjusments if any
			promptleftPosition += shiftX;
			promptTopPosition  += shiftY;

			return {
				"callerTopPosition": promptTopPosition + "px",
				"callerleftPosition": promptleftPosition + "px",
				"marginTopSize": marginTopSize + "px"
			};
		},
		/**
		* Saves the user options and variables in the form.data
		*
		* @param {jqObject}
		*            form - the form where the user option should be saved
		* @param {Map}
		*            options - the user options
		* @return the user options (extended from the defaults)
		*/
		 _saveOptions: function(form, options) {

			 // is there a language localisation ?
			 if ($.validationEngineLanguage)
			 var allRules = $.validationEngineLanguage.allRules;
			 else
			 $.error("jQuery.validationEngine rules are not loaded, plz add localization files to the page");
			 // --- Internals DO NOT TOUCH or OVERLOAD ---
			 // validation rules and i18
			 $.validationEngine.defaults.allrules = allRules;

			 var userOptions = $.extend(true,{},$.validationEngine.defaults,options);

			 form.data('jqv', userOptions);
			 return userOptions;
		 },

		 /**
		 * Removes forbidden characters from class name
		 * @param {String} className
		 */
		 _getClassName: function(className) {
			 if(className)
				 return className.replace(/:/g, "_").replace(/\./g, "_");
					  },
		/**
		 * Escape special character for jQuery selector
		 * http://totaldev.com/content/escaping-characters-get-valid-jquery-id
		 * @param {String} selector
		 */
		 _jqSelector: function(str){
			return str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
		},
		/**
		* Conditionally required field
		*
		* @param {jqObject} field
		* @param {Array[String]} rules
		* @param {int} i rules index
		* @param {Map}
		* user options
		* @return an error string if validation failed
		*/
		_condRequired: function(field, rules, i, options) {
			var idx, dependingField;

			for(idx = (i + 1); idx < rules.length; idx++) {
				dependingField = jQuery("#" + rules[idx]).first();

				/* Use _required for determining wether dependingField has a value.
				 * There is logic there for handling all field types, and default value; so we won't replicate that here
				 * Indicate this special use by setting the last parameter to true so we only validate the dependingField on chackboxes and radio buttons (#462)
				 */
				if (dependingField.length && methods._required(dependingField, ["required"], 0, options, true) == undefined) {
					/* We now know any of the depending fields has a value,
					 * so we can validate this field as per normal required code
					 */
					return methods._required(field, ["required"], 0, options);
				}
			}
		},

	    _submitButtonClick: function(event) {
	        var button = $(this);
	        var form = button.closest('form, .validationEngineContainer');
	        form.data("jqv_submitButton", button.attr("id"));
	    }
		  };

	 /**
	 * Plugin entry point.
	 * You may pass an action as a parameter or a list of options.
	 * if none, the init and attach methods are being called.
	 * Remember: if you pass options, the attached method is NOT called automatically
	 *
	 * @param {String}
	 *            method (optional) action
	 */
	 $.fn.validationEngine = function(method) {

		 var form = $(this);
		 if(!form[0]) return form;  // stop here if the form does not exist

		 if (typeof(method) == 'string' && method.charAt(0) != '_' && methods[method]) {

			 // make sure init is called once
			 if(method != "showPrompt" && method != "hide" && method != "hideAll")
			 methods.init.apply(form);

			 return methods[method].apply(form, Array.prototype.slice.call(arguments, 1));
		 } else if (typeof method == 'object' || !method) {

			 // default constructor with or without arguments
			 methods.init.apply(form, arguments);
			 return methods.attach.apply(form);
		 } else {
			 $.error('Method ' + method + ' does not exist in jQuery.validationEngine');
		 }
	};



	// LEAK GLOBAL OPTIONS
	$.validationEngine= {fieldIdCounter: 0,defaults:{

		// Name of the event triggering field validation
		validationEventTrigger: "blur",
		// Automatically scroll viewport to the first error
		scroll: true,
		// Focus on the first input
		focusFirstField:true,
		// Show prompts, set to false to disable prompts
		showPrompts: true,
       // Should we attempt to validate non-visible input fields contained in the form? (Useful in cases of tabbed containers, e.g. jQuery-UI tabs)
       validateNonVisibleFields: false,
		// Opening box position, possible locations are: topLeft,
		// topRight, bottomLeft, centerRight, bottomRight, inline
		// inline gets inserted after the validated field or into an element specified in data-prompt-target
		promptPosition: "topRight",
		bindMethod:"bind",
		// internal, automatically set to true when it parse a _ajax rule
		inlineAjax: false,
		// if set to true, the form data is sent asynchronously via ajax to the form.action url (get)
		ajaxFormValidation: false,
		// The url to send the submit ajax validation (default to action)
		ajaxFormValidationURL: false,
		// HTTP method used for ajax validation
		ajaxFormValidationMethod: 'get',
		// Ajax form validation callback method: boolean onComplete(form, status, errors, options)
		// retuns false if the form.submit event needs to be canceled.
		onAjaxFormComplete: $.noop,
		// called right before the ajax call, may return false to cancel
		onBeforeAjaxFormValidation: $.noop,
		// Stops form from submitting and execute function assiciated with it
		onValidationComplete: false,

		// Used when you have a form fields too close and the errors messages are on top of other disturbing viewing messages
		doNotShowAllErrosOnSubmit: false,
		// Object where you store custom messages to override the default error messages
		custom_error_messages:{},
		// true if you want to vind the input fields
		binded: true,
		// set to true, when the prompt arrow needs to be displayed
		showArrow: true,
		// did one of the validation fail ? kept global to stop further ajax validations
		isError: false,
		// Limit how many displayed errors a field can have
		maxErrorsPerField: false,
		
		// Caches field validation status, typically only bad status are created.
		// the array is used during ajax form validation to detect issues early and prevent an expensive submit
		ajaxValidCache: {},
		// Auto update prompt position after window resize
		autoPositionUpdate: false,

		InvalidFields: [],
		onFieldSuccess: false,
		onFieldFailure: false,
		onSuccess: false,
		onFailure: false,
		validateAttribute: "class",
		addSuccessCssClassToField: "",
		addFailureCssClassToField: "",
		
		// Auto-hide prompt
		autoHidePrompt: false,
		// Delay before auto-hide
		autoHideDelay: 10000,
		// Fade out duration while hiding the validations
		fadeDuration: 0.3,
	 // Use Prettify select library
	 prettySelect: false,
	 // Add css class on prompt
	 addPromptClass : "",
	 // Custom ID uses prefix
	 usePrefix: "",
	 // Custom ID uses suffix
	 useSuffix: "",
	 // Only show one message per error prompt
	 showOneMessage: false
	}};
	$(function(){$.validationEngine.defaults.promptPosition = methods.isRTL()?'topLeft':"topRight"});
})(jQuery);




/*
 *
 * Copyright (c) 2006-2014 Sam Collett (http://www.texotela.co.uk)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version 1.4.1
 * Demo: http://www.texotela.co.uk/code/jquery/numeric/
 *
 */
(function(factory){
	if(typeof define === 'function' && define.amd){
		define(['jquery'], factory);
	}else{
        factory(window.jQuery);
    }
}(function($) {
/*
 * Allows only valid characters to be entered into input boxes.
 * Note: fixes value when pasting via Ctrl+V, but not when using the mouse to paste
  *      side-effect: Ctrl+A does not work, though you can still use the mouse to select (or double-click to select all)
 *
 * @name     numeric
 * @param    config      { decimal : "." , negative : true }
 * @param    callback     A function that runs if the number is not valid (fires onblur)
 * @author   Sam Collett (http://www.texotela.co.uk)
 * @example  $(".numeric").numeric();
 * @example  $(".numeric").numeric(","); // use , as separator
 * @example  $(".numeric").numeric({ decimal : "," }); // use , as separator
 * @example  $(".numeric").numeric({ negative : false }); // do not allow negative values
 * @example  $(".numeric").numeric({ decimalPlaces : 2 }); // only allow 2 decimal places
 * @example  $(".numeric").numeric(null, callback); // use default values, pass on the 'callback' function
 *
 */
$.fn.numeric = function(config, callback)
{
	if(typeof config === 'boolean')
	{
		config = { decimal: config, negative: true, decimalPlaces: -1 };
	}
	config = config || {};
	// if config.negative undefined, set to true (default is to allow negative numbers)
	if(typeof config.negative == "undefined") { config.negative = true; }
	// set decimal point
	var decimal = (config.decimal === false) ? "" : config.decimal || ".";
	// allow negatives
	var negative = (config.negative === true) ? true : false;
    // set decimal places
	var decimalPlaces = (typeof config.decimalPlaces == "undefined") ? -1 : config.decimalPlaces;
	// callback function
	callback = (typeof(callback) == "function" ? callback : function() {});
	// set data and methods
	return this.data("numeric.decimal", decimal).data("numeric.negative", negative).data("numeric.callback", callback).data("numeric.decimalPlaces", decimalPlaces).keypress($.fn.numeric.keypress).keyup($.fn.numeric.keyup).blur($.fn.numeric.blur);
};

$.fn.numeric.keypress = function(e)
{
	// get decimal character and determine if negatives are allowed
	var decimal = $.data(this, "numeric.decimal");
	var negative = $.data(this, "numeric.negative");
    var decimalPlaces = $.data(this, "numeric.decimalPlaces");
	// get the key that was pressed
	var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
	// allow enter/return key (only when in an input box)
	if(key == 13 && this.nodeName.toLowerCase() == "input")
	{
		return true;
	}
	else if(key == 13)
	{
		return false;
	}
	//dont allow #, $, %
	else if(key == 35 || key == 36 || key == 37){
		return false;
	}
	var allow = false;
	// allow Ctrl+A
	if((e.ctrlKey && key == 97 /* firefox */) || (e.ctrlKey && key == 65) /* opera */) { return true; }
	// allow Ctrl+X (cut)
	if((e.ctrlKey && key == 120 /* firefox */) || (e.ctrlKey && key == 88) /* opera */) { return true; }
	// allow Ctrl+C (copy)
	if((e.ctrlKey && key == 99 /* firefox */) || (e.ctrlKey && key == 67) /* opera */) { return true; }
	// allow Ctrl+Z (undo)
	if((e.ctrlKey && key == 122 /* firefox */) || (e.ctrlKey && key == 90) /* opera */) { return true; }
	// allow or deny Ctrl+V (paste), Shift+Ins
	if((e.ctrlKey && key == 118 /* firefox */) || (e.ctrlKey && key == 86) /* opera */ ||
	  (e.shiftKey && key == 45)) { return true; }
	// if a number was not pressed
	if(key < 48 || key > 57)
	{
	  var value = $(this).val();
		/* '-' only allowed at start and if negative numbers allowed */
		if($.inArray('-', value.split('')) !== 0 && negative && key == 45 && (value.length === 0 || parseInt($.fn.getSelectionStart(this), 10) === 0)) { return true; }
		/* only one decimal separator allowed */
		if(decimal && key == decimal.charCodeAt(0) && $.inArray(decimal, value.split('')) != -1)
		{
			allow = false;
		}
		// check for other keys that have special purposes
		if(
			key != 8 /* backspace */ &&
			key != 9 /* tab */ &&
			key != 13 /* enter */ &&
			key != 35 /* end */ &&
			key != 36 /* home */ &&
			key != 37 /* left */ &&
			key != 39 /* right */ &&
			key != 46 /* del */
		)
		{
			allow = false;
		}
		else
		{
			// for detecting special keys (listed above)
			// IE does not support 'charCode' and ignores them in keypress anyway
			if(typeof e.charCode != "undefined")
			{
				// special keys have 'keyCode' and 'which' the same (e.g. backspace)
				if(e.keyCode == e.which && e.which !== 0)
				{
					allow = true;
					// . and delete share the same code, don't allow . (will be set to true later if it is the decimal point)
					if(e.which == 46) { allow = false; }
				}
				// or keyCode != 0 and 'charCode'/'which' = 0
				else if(e.keyCode !== 0 && e.charCode === 0 && e.which === 0)
				{
					allow = true;
				}
			}
		}
		// if key pressed is the decimal and it is not already in the field
		if(decimal && key == decimal.charCodeAt(0))
		{
			if($.inArray(decimal, value.split('')) == -1)
			{
				allow = true;
			}
			else
			{
				allow = false;
			}
		}
	}
	else
	{
		allow = true;
        // remove extra decimal places
 		if(decimal && decimalPlaces > 0)
 		{
            var selectionStart = $.fn.getSelectionStart(this);
            var selectionEnd = $.fn.getSelectionEnd(this);
            var dot = $.inArray(decimal, $(this).val().split(''));
            if (selectionStart === selectionEnd && dot >= 0 && selectionStart > dot && $(this).val().length > dot + decimalPlaces) {
                allow = false;
            }
        }

	}
	return allow;
};

$.fn.numeric.keyup = function(e)
{
	var val = $(this).val();
	if(val && val.length > 0)
	{
		// get carat (cursor) position
		var carat = $.fn.getSelectionStart(this);
		var selectionEnd = $.fn.getSelectionEnd(this);
		// get decimal character and determine if negatives are allowed
		var decimal = $.data(this, "numeric.decimal");
		var negative = $.data(this, "numeric.negative");
        var decimalPlaces = $.data(this, "numeric.decimalPlaces");

		// prepend a 0 if necessary
		if(decimal !== "" && decimal !== null)
		{
			// find decimal point
			var dot = $.inArray(decimal, val.split(''));
			// if dot at start, add 0 before
			if(dot === 0)
			{
				this.value = "0" + val;
				carat++;
            			selectionEnd++;
			}
			// if dot at position 1, check if there is a - symbol before it
			if(dot == 1 && val.charAt(0) == "-")
			{
				this.value = "-0" + val.substring(1);
				carat++;
            			selectionEnd++;
			}
			val = this.value;
		}

		// if pasted in, only allow the following characters
		var validChars = [0,1,2,3,4,5,6,7,8,9,'-',decimal];
		// get length of the value (to loop through)
		var length = val.length;
		// loop backwards (to prevent going out of bounds)
		for(var i = length - 1; i >= 0; i--)
		{
			var ch = val.charAt(i);
			// remove '-' if it is in the wrong place
			if(i !== 0 && ch == "-")
			{
				val = val.substring(0, i) + val.substring(i + 1);
			}
			// remove character if it is at the start, a '-' and negatives aren't allowed
			else if(i === 0 && !negative && ch == "-")
			{
				val = val.substring(1);
			}
			var validChar = false;
			// loop through validChars
			for(var j = 0; j < validChars.length; j++)
			{
				// if it is valid, break out the loop
				if(ch == validChars[j])
				{
					validChar = true;
					break;
				}
			}
			// if not a valid character, or a space, remove
			if(!validChar || ch == " ")
			{
				val = val.substring(0, i) + val.substring(i + 1);
			}
		}
		// remove extra decimal characters
		var firstDecimal = $.inArray(decimal, val.split(''));
		if(firstDecimal > 0)
		{
			for(var k = length - 1; k > firstDecimal; k--)
			{
				var chch = val.charAt(k);
				// remove decimal character
				if(chch == decimal)
				{
					val = val.substring(0, k) + val.substring(k + 1);
				}
			}
		}

        // remove extra decimal places
        if(decimal && decimalPlaces > 0)
        {
            var dot = $.inArray(decimal, val.split(''));
            if (dot >= 0)
            {
                val = val.substring(0, dot + decimalPlaces + 1);
                selectionEnd = Math.min(val.length, selectionEnd);
            }
        }
		// set the value and prevent the cursor moving to the end
		this.value = val;
		$.fn.setSelection(this, [carat, selectionEnd]);
	}
};

$.fn.numeric.blur = function()
{
	var decimal = $.data(this, "numeric.decimal");
	var callback = $.data(this, "numeric.callback");
	var negative = $.data(this, "numeric.negative");
	var val = this.value;
	if(val !== "")
	{
		var re = new RegExp("^" + (negative?"-?":"") + "\\d+$|^" + (negative?"-?":"") + "\\d*" + decimal + "\\d+$");
		if(!re.exec(val))
		{
			callback.apply(this);
		}
	}
};

$.fn.removeNumeric = function()
{
	return this.data("numeric.decimal", null).data("numeric.negative", null).data("numeric.callback", null).data("numeric.decimalPlaces", null).unbind("keypress", $.fn.numeric.keypress).unbind("keyup", $.fn.numeric.keyup).unbind("blur", $.fn.numeric.blur);
};

// Based on code from http://javascript.nwbox.com/cursor_position/ (Diego Perini <dperini@nwbox.com>)
$.fn.getSelectionStart = function(o)
{
	if(o.type === "number"){
		return undefined;
	}
	else if (o.createTextRange && document.selection)
	{
        var r = document.selection.createRange().duplicate();
        r.moveEnd('character', o.value.length);
		if (r.text == '') return o.value.length;

		return Math.max(0, o.value.lastIndexOf(r.text));
	} else {
        try { return o.selectionStart; }
        catch(e) { return 0; }
    }
};

// Based on code from http://javascript.nwbox.com/cursor_position/ (Diego Perini <dperini@nwbox.com>)
$.fn.getSelectionEnd = function(o)
{
	if(o.type === "number"){
		return undefined;
	}
	else if (o.createTextRange && document.selection) {
		var r = document.selection.createRange().duplicate()
		r.moveStart('character', -o.value.length)
		return r.text.length
	} else return o.selectionEnd
}

// set the selection, o is the object (input), p is the position ([start, end] or just start)
$.fn.setSelection = function(o, p)
{
	// if p is number, start and end are the same
	if(typeof p == "number") { p = [p, p]; }
	// only set if p is an array of length 2
	if(p && p.constructor == Array && p.length == 2)
	{
		if(o.type === "number") {
			o.focus();
		}
		else if (o.createTextRange)
		{
			var r = o.createTextRange();
			r.collapse(true);
			r.moveStart('character', p[0]);
			r.moveEnd('character', p[1] - p[0]);
			r.select();
		}
		else {
            o.focus();
            try{
                if(o.setSelectionRange)
                {
                    o.setSelectionRange(p[0], p[1]);
                }
            } catch(e) {
            }
        }
	}
};

}));


/*
	Masked Input plugin for jQuery
	Copyright (c) 2007-2013 Josh Bush (digitalbush.com)
	Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
	Version: 1.3.1
*/
(function($) {
	function getPasteEvent() {
    var el = document.createElement('input'),
        name = 'onpaste';
    el.setAttribute(name, '');
    return (typeof el[name] === 'function')?'paste':'input';             
}

var pasteEventName = getPasteEvent() + ".mask",
	ua = navigator.userAgent,
	iPhone = /iphone/i.test(ua),
	android=/android/i.test(ua),
	caretTimeoutId;

$.mask = {
	//Predefined character definitions
	definitions: {
		'9': "[0-9]",
		'a': "[A-Za-z]",
		'*': "[A-Za-z0-9]"
	},
	dataName: "rawMaskFn",
	placeholder: '_',
};

$.fn.extend({
	//Helper Function for Caret positioning
	caret: function(begin, end) {
		var range;

		if (this.length === 0 || this.is(":hidden")) {
			return;
		}

		if (typeof begin == 'number') {
			end = (typeof end === 'number') ? end : begin;
			return this.each(function() {
				if (this.setSelectionRange) {
					this.setSelectionRange(begin, end);
				} else if (this.createTextRange) {
					range = this.createTextRange();
					range.collapse(true);
					range.moveEnd('character', end);
					range.moveStart('character', begin);
					range.select();
				}
			});
		} else {
			if (this[0].setSelectionRange) {
				begin = this[0].selectionStart;
				end = this[0].selectionEnd;
			} else if (document.selection && document.selection.createRange) {
				range = document.selection.createRange();
				begin = 0 - range.duplicate().moveStart('character', -100000);
				end = begin + range.text.length;
			}
			return { begin: begin, end: end };
		}
	},
	unmask: function() {
		return this.trigger("unmask");
	},
	mask: function(mask, settings) {
		var input,
			defs,
			tests,
			partialPosition,
			firstNonMaskPos,
			len;

		if (!mask && this.length > 0) {
			input = $(this[0]);
			return input.data($.mask.dataName)();
		}
		settings = $.extend({
			placeholder: $.mask.placeholder, // Load default placeholder
			completed: null
		}, settings);


		defs = $.mask.definitions;
		tests = [];
		partialPosition = len = mask.length;
		firstNonMaskPos = null;

		$.each(mask.split(""), function(i, c) {
			if (c == '?') {
				len--;
				partialPosition = i;
			} else if (defs[c]) {
				tests.push(new RegExp(defs[c]));
				if (firstNonMaskPos === null) {
					firstNonMaskPos = tests.length - 1;
				}
			} else {
				tests.push(null);
			}
		});

		return this.trigger("unmask").each(function() {
			var input = $(this),
				buffer = $.map(
				mask.split(""),
				function(c, i) {
					if (c != '?') {
						return defs[c] ? settings.placeholder : c;
					}
				}),
				focusText = input.val();

			function seekNext(pos) {
				while (++pos < len && !tests[pos]);
				return pos;
			}

			function seekPrev(pos) {
				while (--pos >= 0 && !tests[pos]);
				return pos;
			}

			function shiftL(begin,end) {
				var i,
					j;

				if (begin<0) {
					return;
				}

				for (i = begin, j = seekNext(end); i < len; i++) {
					if (tests[i]) {
						if (j < len && tests[i].test(buffer[j])) {
							buffer[i] = buffer[j];
							buffer[j] = settings.placeholder;
						} else {
							break;
						}

						j = seekNext(j);
					}
				}
				writeBuffer();
				input.caret(Math.max(firstNonMaskPos, begin));
			}

			function shiftR(pos) {
				var i,
					c,
					j,
					t;

				for (i = pos, c = settings.placeholder; i < len; i++) {
					if (tests[i]) {
						j = seekNext(i);
						t = buffer[i];
						buffer[i] = c;
						if (j < len && tests[j].test(t)) {
							c = t;
						} else {
							break;
						}
					}
				}
			}

			function keydownEvent(e) {
				var k = e.which,
					pos,
					begin,
					end;

				//backspace, delete, and escape get special treatment
				if (k === 8 || k === 46 || (iPhone && k === 127)) {
					pos = input.caret();
					begin = pos.begin;
					end = pos.end;

					if (end - begin === 0) {
						begin=k!==46?seekPrev(begin):(end=seekNext(begin-1));
						end=k===46?seekNext(end):end;
					}
					clearBuffer(begin, end);
					shiftL(begin, end - 1);

					e.preventDefault();
				} else if (k == 27) {//escape
					input.val(focusText);
					input.caret(0, checkVal());
					e.preventDefault();
				}
			}

			function keypressEvent(e) {
				var k = e.which,
					pos = input.caret(),
					p,
					c,
					next;

				if (e.ctrlKey || e.altKey || e.metaKey || k < 32) {//Ignore
					return;
				} else if (k) {
					if (pos.end - pos.begin !== 0){
						clearBuffer(pos.begin, pos.end);
						shiftL(pos.begin, pos.end-1);
					}

					p = seekNext(pos.begin - 1);
					if (p < len) {
						c = String.fromCharCode(k);
						if (tests[p].test(c)) {
							shiftR(p);

							buffer[p] = c;
							writeBuffer();
							next = seekNext(p);

							if(android){
								setTimeout($.proxy($.fn.caret,input,next),0);
							}else{
								input.caret(next);
							}

							if (settings.completed && next >= len) {
								settings.completed.call(input);
							}
						}
					}
					e.preventDefault();
				}
			}

			function clearBuffer(start, end) {
				var i;
				for (i = start; i < end && i < len; i++) {
					if (tests[i]) {
						buffer[i] = settings.placeholder;
					}
				}
			}

			function writeBuffer() { input.val(buffer.join('')); }

			function checkVal(allow) {
				//try to place characters where they belong
				var test = input.val(),
					lastMatch = -1,
					i,
					c;

				for (i = 0, pos = 0; i < len; i++) {
					if (tests[i]) {
						buffer[i] = settings.placeholder;
						while (pos++ < test.length) {
							c = test.charAt(pos - 1);
							if (tests[i].test(c)) {
								buffer[i] = c;
								lastMatch = i;
								break;
							}
						}
						if (pos > test.length) {
							break;
						}
					} else if (buffer[i] === test.charAt(pos) && i !== partialPosition) {
						pos++;
						lastMatch = i;
					}
				}
				if (allow) {
					writeBuffer();
				} else if (lastMatch + 1 < partialPosition) {
					input.val("");
					clearBuffer(0, len);
				} else {
					writeBuffer();
					input.val(input.val().substring(0, lastMatch + 1));
				}
				return (partialPosition ? i : firstNonMaskPos);
			}

			input.data($.mask.dataName,function(){
				return $.map(buffer, function(c, i) {
					return tests[i]&&c!=settings.placeholder ? c : null;
				}).join('');
			});

			if (!input.attr("readonly"))
				input
				.one("unmask", function() {
					input
						.unbind(".mask")
						.removeData($.mask.dataName);
				})
				.bind("focus.mask", function() {
					clearTimeout(caretTimeoutId);
					var pos,
						moveCaret;

					focusText = input.val();
					pos = checkVal();
					
					caretTimeoutId = setTimeout(function(){
						writeBuffer();
						if (pos == mask.length) {
							input.caret(0, pos);
						} else {
							input.caret(pos);
						}
					}, 10);
				})
				.bind("blur.mask", function() {
					checkVal();
					if (input.val() != focusText)
						input.change();
				})
				.bind("keydown.mask", keydownEvent)
				.bind("keypress.mask", keypressEvent)
				.bind(pasteEventName, function() {
					setTimeout(function() { 
						var pos=checkVal(true);
						input.caret(pos); 
						if (settings.completed && pos == input.val().length)
							settings.completed.call(input);
					}, 0);
				});
			checkVal(); //Perform initial check for existing values
		});
	}
});


})(jQuery);


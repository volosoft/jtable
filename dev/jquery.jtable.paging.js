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
        _create: function () {
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
        _loadPagingSettings: function () {
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
        _createBottomPanel: function () {
            this._$bottomPanel = $('<div />')
                .addClass('jtable-bottom-panel')
                .insertAfter(this._$table);

            this._jqueryuiThemeAddClass(this._$bottomPanel, 'ui-state-default');

            $('<div />').addClass('jtable-left-area').appendTo(this._$bottomPanel);
            $('<div />').addClass('jtable-right-area').appendTo(this._$bottomPanel);
        },

        /* Creates page list area.
        *************************************************************************/
        _createPageListArea: function () {
            this._$pagingListArea = $('<span></span>')
                .addClass('jtable-page-list')
                .appendTo(this._$bottomPanel.find('.jtable-left-area'));

            this._$pageInfoSpan = $('<span></span>')
                .addClass('jtable-page-info')
                .appendTo(this._$bottomPanel.find('.jtable-right-area'));
        },

        /* Creates page list change area.
        *************************************************************************/
        _createPageSizeSelection: function () {
            var self = this;

            if (!self.options.pageSizeChangeArea) {
                return;
            }

            //Add current page size to page sizes list if not contains it
            if (self._findIndexInArray(self.options.pageSize, self.options.pageSizes) < 0) {
                self.options.pageSizes.push(parseInt(self.options.pageSize));
                self.options.pageSizes.sort(function (a, b) { return a - b; });
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
            $pageSizeChangeCombobox.change(function () {
                self._changePageSize(parseInt($(this).val()));
            });
        },

        /* Creates go to page area.
        *************************************************************************/
        _createGotoPageInput: function () {
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
                    .change(function () {
                        self._changePage(parseInt($(this).val()));
                    });
                self._$gotoPageInput.append('<option value="1">1</option>');

            } else { //textbox

                self._$gotoPageInput = $('<input type="text" maxlength="10" value="' + self._currentPageNo + '" />')
                    .appendTo(this._$gotoPageArea)
                    .keypress(function (event) {
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
        _refreshGotoPageInput: function () {
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
        load: function () {
            this._currentPageNo = 1;

            base.load.apply(this, arguments);
        },

        /* Used to change options dynamically after initialization.
        *************************************************************************/
        _setOption: function (key, value) {
            base._setOption.apply(this, arguments);

            if (key == 'pageSize') {
                this._changePageSize(parseInt(value));
            }
        },

        /* Changes current page size with given value.
        *************************************************************************/
        _changePageSize: function (pageSize) {
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
        _savePagingSettings: function () {
            if (!this.options.saveUserPreferences) {
                return;
            }

            this._setCookie('page-size', this.options.pageSize);
        },

        /* Overrides _createRecordLoadUrl method to add paging info to URL.
        *************************************************************************/
        _createRecordLoadUrl: function () {
            var loadUrl = base._createRecordLoadUrl.apply(this, arguments);
            loadUrl = this._addPagingInfoToUrl(loadUrl, this._currentPageNo);
            return loadUrl;
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

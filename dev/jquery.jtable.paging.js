/************************************************************************
* PAGING extension for jTable                                           *
*************************************************************************/
(function($) {

    //Reference to base object members
    var base = {
        load: $.hik.jtable.prototype.load,
        _create: $.hik.jtable.prototype._create,
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
            pageSize: 10,

            messages: {
                pagingInfo: 'Showing {0} to {1} of {2} records'
            }
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _$pagingListArea: null, //Reference to the page list area in to bottom panel
        _totalRecordCount: 0, //Total count of records on all pages
        _currentPageNo: 1, //Current page number

        /************************************************************************
        * CONSTRUCTOR AND INITIALIZING METHODS                                  *
        *************************************************************************/

        /* Overrides base method to do paging-specific constructions.
        *************************************************************************/
        _create: function() {
            base._create.apply(this, arguments);
            this._createPageListArea();
        },

        /* Creates page list area if paging enabled.
        *************************************************************************/
        _createPageListArea: function() {
            if (!this.options.paging) {
                return;
            }

            this._$pagingListArea = $('<span></span>')
                .addClass('jtable-page-list')
                .prependTo(this._$bottomPanel.find('.jtable-left-area'));
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

        /* Overrides _createRecordLoadUrl method to add paging info to URL.
        *************************************************************************/
        _createRecordLoadUrl: function() {
            var loadUrl = base._createRecordLoadUrl.apply(this, arguments);
            loadUrl = this._addPagingInfoToUrl(loadUrl, this._currentPageNo);
            return loadUrl;
        },

        /* Overrides _addRowToTable method to re-load table when a new row is created.
        * NOTE: THIS METHOD IS DEPRECATED AND WILL BE REMOVED FROM FEATURE RELEASES.
        * USE _addRow METHOD.
        *************************************************************************/
        _addRowToTable: function($tableRow, index, isNewRow) {
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
        _removeRowsFromTable: function($rows, reason) {
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
        _onRecordsLoaded: function(data) {
            this._totalRecordCount = data.TotalRecordCount;
            this._createPagingList();
            base._onRecordsLoaded.apply(this, arguments);
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Adds jtStartIndex and jtPageSize parameters to a URL as query string.
        *************************************************************************/
        _addPagingInfoToUrl: function(url, pageNumber) {
            if (!this.options.paging) {
                return url;
            }

            var jtStartIndex = (pageNumber - 1) * this.options.pageSize;
            var jtPageSize = this.options.pageSize;

            return (url + (url.indexOf('?') < 0 ? '?' : '&') + 'jtStartIndex=' + jtStartIndex + '&jtPageSize=' + jtPageSize);
        },

        /* Creates and shows the page list.
        *************************************************************************/
        _createPagingList: function() {
            if (!this.options.paging || this.options.pageSize <= 0) {
                return;
            }

            this._$pagingListArea.empty();
            
            var pageCount = this._calculatePageCount();

            this._createFirstAndPreviousPageButtons();
            this._createPageNumberButtons(this._calculatePageNumbers(pageCount));
            this._createLastAndNextPageButtons(pageCount);
            this._createPagingInfo();
            this._bindClickEventsToPageNumberButtons();
        },

        /* Creates and shows previous and first page links.
        *************************************************************************/
        _createFirstAndPreviousPageButtons: function() {
            if (this._currentPageNo > 1) {
                $('<span></span>')
                    .addClass('jtable-page-number-first')
                    .html('|&lt')
                    .data('pageNumber', 1)
                    .appendTo(this._$pagingListArea);
                $('<span></span>')
                    .addClass('jtable-page-number-previous')
                    .html('&lt')
                    .data('pageNumber', this._currentPageNo - 1)
                    .appendTo(this._$pagingListArea);
            }
        },

        /* Creates and shows next and last page links.
        *************************************************************************/
        _createLastAndNextPageButtons: function(pageCount) {
            if (this._currentPageNo < pageCount) {
                $('<span></span>')
                    .addClass('jtable-page-number-next')
                    .html('&gt')
                    .data('pageNumber', this._currentPageNo + 1)
                    .appendTo(this._$pagingListArea);
                $('<span></span>')
                    .addClass('jtable-page-number-last')
                    .html('&gt|')
                    .data('pageNumber', pageCount)
                    .appendTo(this._$pagingListArea);
            }
        },

        /* Creates and shows page number links for given number array.
        *************************************************************************/
        _createPageNumberButtons: function(pageNumbers) {
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
        _createPageNumberButton: function(pageNumber) {
            $('<span class="' + (this._currentPageNo == pageNumber ? 'jtable-page-number-active' : 'jtable-page-number') + '">' + pageNumber + '</span>')
                .data('pageNumber', pageNumber)
                .appendTo(this._$pagingListArea);
        },

        /* Calculates total page count according to page size and total record count.
        *************************************************************************/
        _calculatePageCount: function() {
            var pageCount = Math.floor(this._totalRecordCount / this.options.pageSize);
            if (this._totalRecordCount % this.options.pageSize != 0) {
                ++pageCount;
            }

            return pageCount;
        },

        /* Calculates page numbers and returns an array of these numbers.
        *************************************************************************/
        _calculatePageNumbers: function(pageCount) {
            if (pageCount <= 6) {
                //Show all pages
                var pageNumbers = [];
                for (var i = 1; i <= pageCount; ++i) {
                    pageNumbers.push(i);
                }

                return pageNumbers;
            } else {
                //show first three, last three, current, previous and next page numbers
                var shownPageNumbers = [1, 2, 3, pageCount - 2, pageCount - 1, pageCount];
                var previousPageNo = this._normalizeNumber(this._currentPageNo - 1, 1, pageCount, 1);
                var nextPageNo = this._normalizeNumber(this._currentPageNo + 1, 1, pageCount, 1);

                this._insertToArrayIfDoesNotExists(shownPageNumbers, previousPageNo);
                this._insertToArrayIfDoesNotExists(shownPageNumbers, this._currentPageNo);
                this._insertToArrayIfDoesNotExists(shownPageNumbers, nextPageNo);

                shownPageNumbers.sort(function(a, b) { return a - b; });
                return shownPageNumbers;
            }
        },

        /* Creates and shows paging informations.
        *************************************************************************/
        _createPagingInfo: function() {
            var startNo = (this._currentPageNo - 1) * this.options.pageSize + 1;
            var endNo = this._currentPageNo * this.options.pageSize;
            endNo = this._normalizeNumber(endNo, startNo, this._totalRecordCount, 0);

            if (endNo >= startNo) {
                var pagingInfoMessage = this._formatString(this.options.messages.pagingInfo, startNo, endNo, this._totalRecordCount);
                $('<span></span>')
                    .addClass('jtable-page-info')
                    .html(pagingInfoMessage)
                    .appendTo(this._$pagingListArea);
            }
        },

        /* Binds click events of all page links to change the page.
        *************************************************************************/
        _bindClickEventsToPageNumberButtons: function() {
            var self = this;
            self._$pagingListArea
                .find('.jtable-page-number,.jtable-page-number-previous,.jtable-page-number-next,.jtable-page-number-first,.jtable-page-number-last')
                .click(function(e) {
                    e.preventDefault();
                    var $this = $(this);
                    self._currentPageNo = $this.data('pageNumber');
                    self._reloadTable();
                });
        }

    });

})(jQuery);

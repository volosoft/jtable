/************************************************************************
* SORTING extension for jTable                                          *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _normalizeFieldOptions: $.hik.jtable.prototype._normalizeFieldOptions,
        _createHeaderCellForField: $.hik.jtable.prototype._createHeaderCellForField,
        _createRecordLoadUrl: $.hik.jtable.prototype._createRecordLoadUrl
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * DEFAULT OPTIONS / EVENTS                                              *
        *************************************************************************/
        options: {
            sorting: false,
            defaultSorting: ''
        },

        /************************************************************************
        * PRIVATE FIELDS                                                        *
        *************************************************************************/

        _lastSorting: '', //Last sorting of the table

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

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

        /* Makes a column sortable.
        *************************************************************************/
        _makeColumnSortable: function ($columnHeader, fieldName) {
            var self = this;
            $columnHeader
                .addClass('jtable-column-header-sortable')
                .click(function(e) {
                    e.preventDefault();
                    self._sortTableByColumn($columnHeader);
                });

            //Default sorting?
            if (self.options.defaultSorting.indexOf(fieldName) > -1) {
                if (self.options.defaultSorting.indexOf(' DESC') > -1) {
                    $columnHeader.addClass('jtable-column-header-sorted-desc');
                    self._lastSorting = fieldName + " DESC";
                } else {
                    $columnHeader.addClass('jtable-column-header-sorted-asc');
                    self._lastSorting = fieldName + " ASC";
                }
            }
        },

        /* Sorts table according to a column header.
        *************************************************************************/
        _sortTableByColumn: function ($columnHeader) {
            //Remove sorting styles from all columns except this one
            $columnHeader.siblings().removeClass('jtable-column-header-sorted-asc jtable-column-header-sorted-desc');

            //Sort ASC or DESC according to current sorting state
            if ($columnHeader.hasClass('jtable-column-header-sorted-asc')) {
                $columnHeader
                    .removeClass('jtable-column-header-sorted-asc')
                    .addClass('jtable-column-header-sorted-desc');
                this._lastSorting = $columnHeader.data('fieldName') + " DESC";
            } else {
                $columnHeader
                    .removeClass('jtable-column-header-sorted-desc')
                    .addClass('jtable-column-header-sorted-asc');
                this._lastSorting = $columnHeader.data('fieldName') + " ASC";
            }

            //Load current page again
            this._reloadTable();
        },

        /* Adds jtSorting parameter to a URL as query string.
        *************************************************************************/
        _addSortingInfoToUrl: function (url) {
            if (!this.options.sorting || this._lastSorting == '') {
                return url;
            }

            return (url + (url.indexOf('?') < 0 ? '?' : '&') + 'jtSorting=' + this._lastSorting);
        }

    });

})(jQuery);

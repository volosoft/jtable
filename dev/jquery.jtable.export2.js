/**
 * Created by rilletq on 29/10/2015.
 */
(function($) {
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
            messages: {
                export: {
                    saveAs: 'Save as...',
                    toExcel: 'Excel',
                    toPDF: 'PDF',
                    toCSV: 'CSV',
                    savingMessage: 'Saving...',
                    defaultTitle: 'Table',
                    worksheetName: 'Worksheet'
                }
            }
        },
        /************************************************************************
         * PRIVATE FIELDS                                                        *
         *************************************************************************/
        _$exportButtonGroup: null,
        _$exportMenu: null,
        /************************************************************************
         * OVERRIDED METHODS                                                     *
         *************************************************************************/

        /* Overrides base method to create footer constructions.
         *************************************************************************/
        _create: function() {
            base._create.apply(this, arguments);
            if (this.options.exportData) {
                this._createExportDataButtons();
            }
        },
        /************************************************************************
         * PRIVATE METHODS                                                       *
         *************************************************************************/

        /* Creates footer (all column footers) of the table.
         *************************************************************************/
        _createExportDataButtons: function() {
            var self = this;

            var ExcelOptions = {
                icon: 'js/jtable/extensions/css/icon_excel.png',
                tooltip: self.options.messages.export.toExcel,
                text: self.options.messages.export.toExcel,
                click: function() {
                    self._exportTableToExcel();
                }
            };

            var PDFOptions = {
                icon: 'js/jtable/extensions/css/icon_pdf.png',
                tooltip: self.options.messages.export.toPDF,
                text: self.options.messages.export.toPDF,
                click: function(e) {
                    self._exportTableToPDF();
                }
            };

            var CSVOptions = {
                icon: 'js/jtable/extensions/css/icon_csv.png',
                tooltip: self.options.messages.export.toCSV,
                text: self.options.messages.export.toCSV,
                click: function() {
                    self._exportTableToCSV();
                }
            };

            if (this.options.exportData === true) {
                this.options.exportData = {
                    toExcel: true,
                    toPDF: true,
                    toCSV: true,
                    groupButtons: true
                };
            }

            if (this.options.exportData.groupButtons) {
                self._$exportButtonGroup = self._addToolBarItem({
                    icon: 'js/jtable/extensions/css/icon_save.png',
                    tooltip: self.options.messages.export.saveAs,
                    cssClass: 'jtable-toolbar-item-export',
                    text: self.options.messages.export.saveAs,
                    click: function() {
                        self._$exportMenu.toggle().position({
                            my: "right top",
                            at: "right bottom",
                            of: self._$exportButtonGroup
                        });
                    }
                });

                self._$exportMenu = $('<div>')
                    .addClass('jtable-export-menu-container')
                    .hide()
                    .appendTo(self._$mainContainer);

                var $menuItems = $('<ul>')
                    .addClass('jtable-export-menu')
                    .appendTo(self._$exportMenu);

                if (this.options.exportData.toExcel) {
                    self._addMenuItem(ExcelOptions).appendTo($menuItems);
                }
                if (this.options.exportData.toPDF) {
                    self._addMenuItem(PDFOptions).appendTo($menuItems);
                }
                if (this.options.exportData.toCSV) {
                    self._addMenuItem(CSVOptions).appendTo($menuItems);
                }
            }
            else {
                if (this.options.exportData.toExcel) {
                    self._addToolBarItem(ExcelOptions);
                }
                if (this.options.exportData.toPDF) {
                    self._addToolBarItem(PDFOptions);
                }
                if (this.options.exportData.toCSV) {
                    self._addToolBarItem(CSVOptions);
                }
            }
        },
        /* Adds a new item to the toolbar.
         *************************************************************************/
        _addMenuItem: function(item) {

            //Check if item is valid
            if ((item === undefined) || (item.text === undefined && item.icon === undefined)) {
                this._logWarn('Cannot add menu item since it is not valid!');
                this._logWarn(item);
                return null;
            }

            var $menuItem = $('<span>').addClass('jtable-menu-item');

            //cssClass property
            if (item.cssClass) {
                $menuItem.addClass(item.cssClass);
            }

            //tooltip property
            if (item.tooltip) {
                $menuItem.attr('title', item.tooltip);
            }

            //icon property
            if (typeof item.icon === 'string') {
                $('<span class="jtable-menu-item-icon"></span>')
                    .append($('<img src="' + item.icon + '">'))
                    .appendTo($menuItem);
            }

            //text property
            if (item.text) {
                $('<span>')
                    .html(item.text)
                    .addClass('jtable-menu-item-text')
                    .appendTo($menuItem);
            }

            //click event
            if (item.click) {
                $menuItem.click(function() {
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
            $menuItem.hover(function() {
                $menuItem.addClass('jtable-menu-item-hover', hoverAnimationDuration, hoverAnimationEasing);
            }, function() {
                $menuItem.removeClass('jtable-menu-item-hover', hoverAnimationDuration, hoverAnimationEasing);
            });

            return $('<li>').append($menuItem);
        },
        /* Export table data to Excel file
         ************************************************************************/
        _exportTableToExcel: function() {
            var self = this;
            var title, colNames;

            var file = {
                worksheets: [{}], // worksheets has one empty worksheet (array)
                creator: 'jTable',
                created: new Date(),
                lastModifiedBy: 'jTable',
                modified: new Date(),
                activeWorksheet: 0
            };
            file.worksheets[0].name = this.options.messages.export.worksheetName;

            this._getExportData(function(exportData) {
                // Table title
                title = [{
                    value: self.options.title || self.options.messages.export.defaultTitle,
                    font: {
                        size: 20,
                        bold: true
                    }
                }];

                // Column names
                colNames = exportData.columns.map(function(val) {
                    return {
                        value: val,
                        font: {
                            bold: true
                        },
                        fill: {
                            type: 'solid',
                            fgColor: 0xEAEAEA
                        },
                        border: {
                            bottom: {},
                            top: {}
                        }
                    };
                });
                file.worksheets[0].data = [title, colNames].concat(exportData.rows);
                window.location = xlsx(file).href();
            });
        },
        /* Export table data to PDF file
         ************************************************************************/
        _exportTableToPDF: function() {
            // TODO. Not finished yet
        },
        /* Export table data to CSV file
         ************************************************************************/
        _exportTableToCSV: function() {
            // TODO. Not finished yet
        },
        /* Performs an AJAX call to load data of the table for export
         *************************************************************************/
        _getExportData: function(completeCallback) {
            var self = this;
            var paging = this.options.paging;

            //Disable table since it's bus_createRecordLoadUrly
            self._showBusy(self.options.messages.export.savingMessage, self.options.loadingAnimationDelay);

            // Turns off paging option if fullTable option is selected
            if (this.options.exportData.fullTable) {
                this.options.paging = false;
            }

            //Generate URL (with query string parameters) to load records
            var loadUrl = self._createRecordLoadUrl();

            // Restores paging option
            this.options.paging = paging;

            //Load data from server
            self._ajax({
                url: loadUrl,
                data: self._lastPostData,
                success: function(data) {
                    self._hideBusy();

                    //Show the error message if server returns error
                    if (data.Result !== 'OK') {
                        self._showError(data.Message);
                        return;
                    }

                    var exportData = {
                        fields: self._columnList,
                        columns: self._columnList.map(function(elem) {
                            return self.options.fields[elem].title || elem;
                        }),
                        rows: []
                    };

                    //Re-generate table rows into memory array
                    $.each(data.Records, function(index, record) {
                        exportData.rows.push([]);
                        $.each(self._columnList, function() {
                            var val = self._getDisplayTextForRecordField(record, this);
                            if (typeof(val) !== 'object')
                                exportData.rows[index].push(val);
                            else
                                exportData.rows[index].push('');
                        });
                    });

                    //Call complete callback
                    if (completeCallback) {
                        completeCallback(exportData);
                    }
                },
                error: function() {
                    self._hideBusy();
                    self._showError(self.options.messages.serverCommunicationError);
                }
            });
        }
    });
})(jQuery);
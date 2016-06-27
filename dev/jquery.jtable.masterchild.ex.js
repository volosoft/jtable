/**
 * Created by rilletq on 29/10/2015.
 */
(function($) {

    //Reference to base object members
    var base = {
        _removeRowsFromTable: $.hik.jtable.prototype._removeRowsFromTable,
        _createInputForRecordField: $.hik.jtable.prototype._createInputForRecordField,
        _getDisplayTextForRecordField: $.hik.jtable.prototype._getDisplayTextForRecordField,
        _submitFormUsingAjax: $.hik.jtable.prototype._submitFormUsingAjax,
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {
        /************************************************************************
         * DEFAULT OPTIONS / EVENTS                                              *
         *************************************************************************/
        options: {
            parentRecord: null
        },
        /************************************************************************
         * OVERRIDED METHODS                                                     *
         *************************************************************************/

        /* Creates an input element according to field type.
         *************************************************************************/
        _createInputForRecordField: function(funcParams) {
            var fieldName = funcParams.fieldName,
                value = funcParams.value;
            /*record = funcParams.record,
             formType = funcParams.formType,
             form = funcParams.form;*/

            //Get the field
            var field = this.options.fields[fieldName];

            if (field.input || !field.childTableOptions) {
                return base._createInputForRecordField.apply(this, arguments);
            }

            //If value if not supplied, use defaultValue of the field
            if (value === undefined || value === null) {
                value = field.defaultValue;
            }
            return this._createChildTableForField(field, funcParams);
        },
        /**
         *
         * @returns {undefined}
         */
        _getChildTableOptions: function(field, params) {
            var options = null;

            if (typeof(field.childTableOptions) === 'function') {
                options = field.childTableOptions(params);
            }
            else {
                options = field.childTableOptions;
            }
            options.parentRecord = params.record;

            return options;
        },
        /* Gets text for a field of a record according to it's type.
         *************************************************************************/
        _getDisplayTextForRecordField: function(record, fieldName) {
            var field = this.options.fields[fieldName];

            if (field.display || !field.childTableOptions) {
                return base._getDisplayTextForRecordField.apply(this, arguments);
            }

            return this._createChildTableLink(field, record);
        },
        /************************************************************************
         * PRIVATE METHODS                                                       *
         *************************************************************************/
        _createChildTableForField: function(field, funcParams) {
            var fieldName = funcParams.fieldName;

            // Get child table options
            var options = this._getChildTableOptions(field, funcParams);

            field.childTable = $('<div name="' + fieldName + '"></div>')
                .addClass(field.inputClass)
                .data('childOptions', options)
                .jtable(options)
                .jtable('load');

            return $('<div />')
                .addClass('jtable-input jtable-jtable-input')
                .append(field.childTable);
        },
        /* Creates a child row for a row, hides and returns it.
         *************************************************************************/
        _createChildTableLink: function(field, record) {
            var self = this;
            var $img = $('<img/>');
            if (field.icon) {
                $img.attr('src', field.icon.src)
                    .attr('title', field.icon.title)
                    .addClass(field.icon.iconClass);
            }
            else {
                $img.attr('width', '22px')
                    .attr('height', '22px');
            }

            $img.click(function(e) {
                // TODO: add opened state icon
                var $row = $img.closest('tr');
                self.element.jtable('openChildTable',
                    $row,
                    self._getChildTableOptions(field, {record: record}),
                    function(data) {
                        data.childTable.jtable('load');
                    });
            });
            return $img;
        },
        _getChildTables: function() {
            var self = this;
            var childTables = {};

            $.each(self.options.fields, function(fieldName, fieldOptions) {
                if (fieldOptions.childTable) {
                    childTables[fieldName] = fieldOptions.childTable;
                }
            });

            return childTables;
        },
        _getRecords: function() {
            /* TODO
             * Verificar si está activo el modo paginado. En tal caso cargar toda la tabla antes de enviar los datos
             * Verificar si un campo es una sub-tabla.
             */
            var records = [];
            $.each(this._$tableRows, function(index, row) {
                records.push(row.data('record'));
            });
            return records;
        },
        /**
         * Adds data collected from child tables to POST data
         * @param {type} url
         * @param {type} formData
         * @param {type} success
         * @param {type} error
         * @returns {undefined}
         */
        _submitFormUsingAjax: function(url, formData, success, error) {
            var childTables = this._getChildTables();
            $.each(childTables, function(index, childTable){
                formData += '&' + index + '=' + encodeURIComponent(JSON.stringify(childTable.jtable('getRecords')));
            });

            return base._submitFormUsingAjax.apply(this, arguments);
        },
        /************************************************************************
         * PUBLIC METHODS                                                        *
         *************************************************************************/
        getChildTables: function() {
            return this._getChildTables();
        },
        getRecords: function() {
            return this._getRecords();
        }
    });

})(jQuery);
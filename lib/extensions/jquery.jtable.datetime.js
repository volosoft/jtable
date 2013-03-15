/************************************************************************
* DATETIME extension for jTable                                         *
* Author: Guillermo Bisheimer                                           *
*************************************************************************/
(function($) {

    //Reference to base object members
    var base = {
        _createInputForRecordField: $.hik.jtable.prototype._createInputForRecordField,
        _getDisplayTextForRecordField: $.hik.jtable.prototype._getDisplayTextForRecordField
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
         * DEFAULT OPTIONS / EVENTS                                              *
         *************************************************************************/
        options: {
            //defaultDateFormat: 'yy-mm-dd',
            defaultTimeFormat: 'HH:MM:ss'
        },

        /************************************************************************
        * OVERRIDED METHODS                                                     *
         *************************************************************************/

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

            if (field.input || field.type != 'datetime'){
                return base._createInputForRecordField.apply( this, arguments );    
            }

            //If value if not supplied, use defaultValue of the field
            if (value == undefined || value == null) {
                value = field.defaultValue;
            }
            return this._createDateTimeInputForField( field, fieldName, value );
        },
        
        /* Gets text for a field of a record according to it's type.
         *************************************************************************/
        _getDisplayTextForRecordField: function (record, fieldName) {
            var field = this.options.fields[fieldName];

            if (field.display || field.type != 'datetime') {
                return base._getDisplayTextForRecordField.apply( this, arguments );
            }
            var fieldValue = record[fieldName];

            return this._getDisplayTextForDateTimeRecordField(field, fieldValue);
        },        

        /************************************************************************
         * PRIVATE METHODS                                                     *
        *************************************************************************/

        /* Creates a date input for a field.
        *************************************************************************/
        _createDateTimeInputForField: function (field, fieldName, value) {
            var $input = $('<input class="' + field.inputClass + '" type="text"' + (value != undefined ? 'value="' + value + '"' : '') + ' name="' + fieldName + '"></input>');
            var dateDisplayFormat = field.dateDisplayFormat || this.options.defaultDateFormat;
            var timeDisplayFormat = field.timeDisplayFormat || this.options.defaultTimeFormat;
            $input.datetimepicker({
                /*dateFormat: dateDisplayFormat,
                timeFormat: timeDisplayFormat,*/
                stepMinute: 10
            });
            return $('<div />')
            .addClass('jtable-input jtable-date-input')
            .append($input);
        },
        
        /* Gets text for a datetime field.
        *************************************************************************/
        _getDisplayTextForDateTimeRecordField: function (field, fieldValue) {
            if (!fieldValue) {
                return '';
            }

            var displayFormat = field.displayFormat || (this.options.defaultDateFormat + ' ' + this.options.defaultTimeFormat);

            var date = this._parseDate(fieldValue);
            return date.format( displayFormat );
        }

    });

})(jQuery);
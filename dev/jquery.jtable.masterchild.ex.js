/************************************************************************
 * SIMPLE MASTER/CHILD tables extension for jTable                      *
 *************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _removeRowsFromTable: $.hik.jtable.prototype._removeRowsFromTable,
        _getDisplayTextForRecordField: $.hik.jtable.prototype._getDisplayTextForRecordField,
        _createTableTitle: $.hik.jtable.prototype._createTableTitle
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

        /* Gets text for a field of a record according to it's type.
         *************************************************************************/
        _getDisplayTextForRecordField: function (record, fieldName) {
            var field = this.options.fields[fieldName];
            var fieldValue = record[fieldName];

            if (field.childTable){
                return this._createChildTable(record, field, field.childTable(record));
            }
            
            return base._getDisplayTextForRecordField.apply(this, arguments);
        },

        /************************************************************************
         * PRIVATE METHODS                                                       *
         *************************************************************************/

        /* Creates a child row for a row, hides and returns it.
         *************************************************************************/
        _createChildTable: function (record, field, options) {
            var self = this;
            var parentRecord = record;
            var $img = $('<img/>');
            if( field.icon ){
                $img.attr('src', field.icon.src )
                .attr('title', field.icon.title )
                .addClass( field.icon.iconClass );
            }
            else{
                $img.attr('width','22px')
                .attr('height','22px');
            }
            
            $img.click(function (e) {
                // TODO: add opened state icon
                var $row = $img.closest('tr');
                options.parentRecord = parentRecord;
                self.element.jtable('openChildTable',
                    $row,
                    options,
                    function (data) {
                        data.childTable.jtable('load');
                    })
            });
            return $img;
        }

    });

})(jQuery);
/**
 * Created by rilletq on 29/10/2015.
 */
(function ($) {


    //Reference to base object members
    var base = {
        _showAddRecordForm: $.hik.jtable.prototype._showAddRecordForm,
        _showEditForm: $.hik.jtable.prototype._showEditForm
    };
    //extension members
    $.extend(true, $.hik.jtable.prototype, {


        /* OVERRIDES BASE METHOD */
        _showAddRecordForm: function () {
            var self = this;

            var defaultFieldList = self._fieldList.slice();

            self._fieldList = self.createInputIndexFieldIdsArray(self._fieldList);

            base._showAddRecordForm.apply(this, arguments);

            self._fieldList = defaultFieldList;
        },


        /* OVERRIDES BASE METHOD */
        _showEditForm: function () {
            var self = this;

            var defaultFieldList = self._fieldList.slice();

            self._fieldList = self.createInputIndexFieldIdsArray(self._fieldList);

            base._showEditForm.apply(this, arguments);

            self._fieldList = defaultFieldList;
        },

        createInputIndexFieldIdsArray: function (fieldIds) {
            var self = this;
            var fields = self.options.fields;

            var sortedFields = fieldIds.sort(function (a, b) {
                return parseInt(fields[a].inputIndex ? fields[a].inputIndex : 10000) - parseInt(fields[b].inputIndex ? fields[b].inputIndex : 10000);
            });

            return sortedFields;
        }



    });

})(jQuery);
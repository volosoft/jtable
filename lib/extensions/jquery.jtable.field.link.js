/** JTABLE field.link extension by nubuntu
 *
 *  example
 * fields : {
 *   fullname : {
 *     title : "Fullname",
 *     link : "/view_student/{{id_student}}"
 *   }
 * }
 * **/


(function ($) {

    //Reference to base object members
    var base = {
        _getDisplayTextForRecordField: $.hik.jtable.prototype._getDisplayTextForRecordField
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        _getDisplayLinkForRecordField: function(record,fieldName){
            var field = this.options.fields[fieldName];

            // replace params {{?}}
            var link        = field.link.slice(0);
            var newlink     = link.split('{{');
            for (var i = 1; i < newlink.length; i++) {
                var param   = newlink[i].split('}}')[0];
                link        = link.replace('{{' + param + '}}',record[param]);
            }
            field.link      = link;

            // set target, defaut _blank
            if(!field.target)
                field.target = '_blank';

            // return link
            return $('<a/>').attr({
                href   : field.link,
                target : field.target
            }).html(record[fieldName]);
        },

        _getDisplayTextForRecordField : function(record,fieldName){
            var field = this.options.fields[fieldName];
            if(!field.link)
                return base._getDisplayTextForRecordField.apply(this,arguments);
            return this._getDisplayLinkForRecordField(record,fieldName);
        },

    });

})(jQuery);

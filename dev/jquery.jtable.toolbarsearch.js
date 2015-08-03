/** JTABLE Multiple toolbar search extension

 **/
(function ($) {
    var base={
        _addRowToTableHead:$.hik.jtable.prototype._addRowToTableHead
    }
    $.extend(true, $.hik.jtable.prototype, {
        options: {
            toolbarsearch:{enable: false,dateFR:false}
        },
        /** Overrides Method
         /* Adds tr element to given thead element
         *************************************************************************/
        _addRowToTableHead: function ($thead) {
            base._addRowToTableHead.apply(this,arguments);

            if(this.options.toolbarsearch.enable){
                var $tr = $('<tr></tr>')
                    .appendTo($thead);
                this._toolbarsearch_addColumnsToHeaderRow($tr);
            }
        },

        /* Adds column header cells to given tr element.
         *************************************************************************/
        _toolbarsearch_addColumnsToHeaderRow: function ($tr) {
            var self = this;
            for (var i = 0; i < this._columnList.length; i++) {
                var fieldName = this._columnList[i];
                var $headerCell = this._toolbarsearch_createHeaderCellForField(fieldName, this.options.fields[fieldName]);
                $headerCell.appendTo($tr);
            }
            var $reset = $('<th></th>')
                .addClass('jtable-toolbarsearch-reset')
                .attr('colspan',$(".jtable-command-column-header").length);

            var $resetbutton = $('<button>refresh</button>')
                .button({icons: {
                    primary: "ui-icon-refresh"
                }})
                .appendTo($reset);

            $resetbutton.click(function(){
                $('.jtable-toolbarsearch').val('');
                self.load({});
            });
            $tr.append($reset);
        },

        /* Creates a header cell for given field.
         *  Returns th jQuery object.
         *************************************************************************/
        _toolbarsearch_createHeaderCellForField: function (fieldName, field) {
            var self = this;
            if(typeof field.searchable === 'undefined' ){
                field.searchable = true;
            };

            field.width = field.width || '10%'; //default column width: 10%.


            var $input = this._getColumnDisplay(fieldName,field);

            self._bootstrapThemeAddClass($input,'form-control');

            $input.bind('change',function(){
                var $query=[];
                var $fieldNameOpt=[];
                var $i = 0;
                $('.jtable-toolbarsearch').each(function(){
                    var $id = $(this).attr('id');
                    if ($(this).val() != null) {
                        if($(this).val().length>=1){
                            if ($(this).is('.datefr')) {
                                //on met la date en fr
                                $fieldNameOpt.push($id.replace('jtable-toolbarsearch-',''));
                                if(self.options.toolbarsearch.dateFR == true){
                                    $query.push(self._jourFRtoEN($(this).val()));
                                }
                                else{
                                    $query.push($(this).val());
                                }

                                $i++;
                            }else if($(this).is('.deroulant')){
                                //si 0 pas de filtre
                                if ($(this).val() != '0') {
                                    $fieldNameOpt.push($id.replace('jtable-toolbarsearch-',''));
                                    $query.push($(this).val());
                                    $i++;
                                }
                            }else{
                                $fieldNameOpt.push($id.replace('jtable-toolbarsearch-',''));
                                $query.push($(this).val());
                                $i++;
                            }
                        }
                    }

                });
                self.load({'query[]':$query,'fieldNameOpt[]':$fieldNameOpt});
            });

            var $headerContainerDiv = $('<div />')
                .addClass('jtable-column-header-container');

            if(field.searchable){
                $headerContainerDiv.append($input);
            }


            var $th = $('<th></th>')
                .addClass('jtable-column-header')
                .css('width', field.width)
                .css('vertical-align', 'top')
                .data('fieldName', fieldName)
                .append($headerContainerDiv);

            if(field.visibility == 'hidden'){
                $th.css('display','none');
            }

            return $th;
        },

        _getColumnDisplay:function(fieldName,field){
            if (field.type == 'date') {
                return this._getDisplayDate(fieldName,field);
            } else if (field.type == 'checkbox') {
                return this._getDisplayCheckBox(fieldName,field);
            } else if (field.options) { //combobox or radio button list since there are options.
                return this._getDisplayComboBox(fieldName,field);
            } else {
                return this._getDisplayText(fieldName,field);
            }
        },

        _getDisplayDate:function(fieldName,field){
            var displayFormat = field.displayFormat || this.options.defaultDateFormat;
            var $input = $('<input id="jtable-toolbarsearch-' + fieldName + '" type="text"/>')
                .addClass('jtable-toolbarsearch')
                .addClass('datefr')
                .css('width','100%')
                .datepicker({dateFormat:displayFormat});
            return $input;
        },

        _getDisplayText:function(fieldName,field){
            var $input = $('<input id="jtable-toolbarsearch-' + fieldName + '" type="text"/>')
                .addClass('jtable-toolbarsearch')
                .css('width','100%');
            return $input;
        },

        _getDisplayCheckBox:function(fieldName,field){
            /*var $input = $('<input id="jtable-toolbarsearch-' + fieldName + '" type="test"/>')
             .addClass('jtable-toolbarsearch')
             .css('width','100%')*/


            var $input = $('<select id="jtable-toolbarsearch-' + fieldName + '"><option value="-1"> - - - </option><option value="0">NON</option><option value="1">OUI</option></select>')
                .addClass('jtable-toolbarsearch')
                .addClass('form-control')
                .addClass('deroulant')
                .css('width','100%');
            return $input;
        },

        _getDisplayComboBox:function(fieldName,field){
            var $input = $('<select id="jtable-toolbarsearch-' + fieldName + '"></select>')
                .addClass('jtable-toolbarsearch')
                .addClass('form-control')
                .addClass('deroulant')
                .css('width','100%');

            //add options
            var options = this._getOptionsForField(fieldName, {
                record: '',
                source: 'create',
                form: '',
                dependedValues: this._createDependedValuesUsingForm('', '')
            });

            this._fillDropDownListWithOptions($input, options, '');
            return $input;
        },

        _jourFRtoEN:function (jour){
        if (jour=="" || jour==null || jour == undefined){
            return "";
        }
        else{
            var annee= jour.substr(6,4);
            var mois=  jour.substr(3,2);
            jour=  jour.substr(0,2);
            return( annee + "-" + mois + "-" +jour);
        }
    }

    });

})(jQuery);
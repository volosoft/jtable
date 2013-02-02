/************************************************************************
* GET OPTIONS WITHOUT REORDERING / NO CACHE extension for jTable        *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _getDisplayTextForRecordField: $.hik.jtable.prototype._getDisplayTextForRecordField,
        _createDropDownListForField: $.hik.jtable.prototype._createDropDownListForField,
        _createRadioButtonListForField: $.hik.jtable.prototype._createRadioButtonListForField,
        _getOptionsWithCaching: $.hik.jtable.prototype._getOptionsWithCaching,
        _downloadOptions: $.hik.jtable.prototype._downloadOptions,
        _buildOptionsFromArray: $.hik.jtable.prototype._buildOptionsFromArray
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
     * DEFAULT OPTIONS / EVENTS                                              *
     *************************************************************************/
        options: {
        },

        /************************************************************************
     * PRIVATE FIELDS                                                        *
     *************************************************************************/

        _aSorting: [], //Last sorting of the table

        /************************************************************************
     * OVERRIDED METHODS                                                     *
     *************************************************************************/
       
        /* Gets text for a field of a record according to it's type.
     *************************************************************************/
        _getDisplayTextForRecordField: function (record, fieldName) {
            var field = this.options.fields[fieldName];
            var fieldValue = record[fieldName];

            if (field.options){
                var options = this._getOptionsWithCaching(fieldName);
                $.each(options, function(index, option){
                    if( option.Value == fieldValue ){
                        fieldValue = option.DisplayText;
                        return false;
                    }
                });
                return fieldValue;
            }
            else{
                return base._getDisplayTextForRecordField.apply(this, arguments);
            }
        },

        /* Creates a drop down list (combobox) input element for a field.
     *************************************************************************/
        _createDropDownListForField: function (field, fieldName, value) {
            //Create a container div
            var $containerDiv = $('<div />')
            .addClass('jtable-input jtable-dropdown-input');

            //Create select element
            var $select = $('<select class="' + field.inputClass + '" id="Edit-' + fieldName + '" name="' + fieldName + '"></select>')
            .appendTo($containerDiv);

            //add options
            var options = this._getOptionsWithCaching(fieldName);
            $.each(options, function (index, option) {
                $select.append('<option value="' + option.Value + '"' + (option.Value == value ? ' selected="selected"' : '') + '>' + option.DisplayText + '</option>');
            });

            return $containerDiv;
        },
        
        /* Creates a radio button list for a field.
     *************************************************************************/
        _createRadioButtonListForField: function (field, fieldName, value) {
            //Create a container div
            var $containerDiv = $('<div />')
            .addClass('jtable-input jtable-radiobuttonlist-input');

            //create radio buttons
            var options = this._getOptionsWithCaching(fieldName);
            var radioButtonIndex = 0;
            $.each(options, function (index, option) {

                var $radioButtonDiv = $('<div class=""></div>')
                .addClass('jtable-radio-input')
                .appendTo($containerDiv);

                var $radioButton = $('<input type="radio" id="Edit-' + fieldName + (radioButtonIndex++) + '" class="' + field.inputClass + '" name="' + fieldName + '" value="' + option.Value + '"' + ((option.Value == (value + '')) ? ' checked="true"' : '') + ' />')
                .appendTo($radioButtonDiv);

                var $textSpan = $('<span></span>')
                .html(option.Value)
                .appendTo($radioButtonDiv);

                if (field.setOnTextClick != false) {
                    $textSpan
                    .addClass('jtable-option-text-clickable')
                    .click(function() {
                        if (!$radioButton.is(':checked')) {
                            $radioButton.attr('checked', true);
                        }
                    });
                }
            });

            return $containerDiv;
        },

        /* Gets options from cache if exists, else downloads and caches.
     *************************************************************************/
        _getOptionsWithCaching: function (fieldName) {
            var field = this.options.fields[fieldName];
            var cacheKey = 'options_' + fieldName;
            
            if( typeof(field.cache) == 'undefined' || field.cache == true ){
                if (!this._cache[cacheKey]) {
                    this._cache[cacheKey] = this._getOptions( fieldName, field );
                }
                return this._cache[cacheKey];
            }
            else
            {
                return this._getOptions( fieldName, field );
            }
        },
        
        /* Download options for a field from server.
     *************************************************************************/
        _downloadOptions: function (fieldName, url) {
            var self = this;
            var options = [];

            self._ajax({
                url: url,
                async: false,
                success: function (data) {
                    if (data.Result != 'OK') {
                        self._showError(data.Message);
                        return;
                    }
                    
                    //Get options from incoming data
                    $.each( data.Options, function(index, option){
                        options.push({
                            'Value' : option.Value,
                            'DisplayText' : option.DisplayText
                        });
                    });
                },
                error: function () {
                    var errMessage = self._formatString(self.options.messages.cannotLoadOptionsFor, fieldName);
                    self._showError(errMessage);
                }
            });

            return options;
        },

        /* Creates an options object (that it's property is value, value is displaytext)
     *  from a simple array.
     *************************************************************************/
        _buildOptionsFromArray: function (optionsArray) {
            var options = [];
            
            /*optionsArray = [
                {
                    Value: 'id1',
                    DisplayText: 'text1'
                },
                [ 'id2', 'text2' ],  
                'id3',
                'id4'
            ];*/
            
            $.each(optionsArray, function(index, element){
                if( typeof(element)=='object' && element.hasOwnProperty('Value') && element.hasOwnProperty('DisplayText') ){
                    options.push(element);
                }
                else if( $.isArray(element) && element.length>=2 ){
                    options.push({
                        'Value': element[0],
                        'DisplayText': element[1]
                    });
                }
                else{
                    options.push({
                        'Value': element,
                        'DisplayText': element
                    })
                }
            });

            return options;
        },

        /************************************************************************
     * PRIVATE METHODS                                                       *
     *************************************************************************/
		
        /* Gets options
     *************************************************************************/
        _getOptions: function (fieldName, field) {
            var optionsSource = field.options;
            //Build options according to it's source type
            if (typeof optionsSource == 'string') {
                //It is an Url to download options
                return this._downloadOptions(fieldName, optionsSource);
            } else if (jQuery.isArray(optionsSource)) {
                //It is an array of options
                return this._buildOptionsFromArray(optionsSource);
            } else {
                //It is an object that it's properties are options
                return this._buildOptionsFromObject(optionsSource);
            }            
        },
        
        /* Creates an options object.
     *************************************************************************/
        _buildOptionsFromObject: function (optionsObject) {
            var options = [];
            
            /*optionsObject = {
                value1: 'text1',
                value2: 'text2',
                value3: 'text3'
            };*/
            
            $.each(optionsObject, function(Value, DisplayText){
                options.push({
                    'Value': Value,
                    'DisplayText': DisplayText
                });                
            });

            return options;
        }

    });

})(jQuery);
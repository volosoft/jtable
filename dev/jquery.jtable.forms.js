/************************************************************************
* FORMS extension for jTable (base for edit/create forms)               *
*************************************************************************/
(function ($) {

    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
         * DEFAULT OPTIONS / EVENTS                                              *
         *************************************************************************/
        options: {

            messages: {
                addFile : 'Choose file',
                delFile : 'Delete file',
                warningFile: 'Warning, the file is auto upload even if you don\'t save!<br> And if you change the upload file, the older file is deleted'
            }
        },

        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Submits a form asynchronously using AJAX.
        *  This method is needed, since form submitting logic can be overrided
        *  by extensions.
        *************************************************************************/
        _submitFormUsingAjax: function (url, formData, success, error) {
            this._ajax({
                url: url,
                data: formData,
                success: success,
                error: error
            });
        },

        /* Creates label for an input element.
        *************************************************************************/
        _createInputLabelForRecordField: function (fieldName) {
            //TODO: May create label tag instead of a div.
            //return $('<label>').attr('for',fieldName).addClass('jtable-input-label').append(this.options.fields[fieldName].inputTitle || this.options.fields[fieldName].title);

            return $('<div />')
                .addClass('jtable-input-label')
                .html(this.options.fields[fieldName].inputTitle || this.options.fields[fieldName].title);
        },

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

            //If value if not supplied, use defaultValue of the field
            if (value == undefined || value == null) {
                value = field.defaultValue;
            }

            //Use custom function if supplied
            if (field.input) {
                var $input = $(field.input({
                    value: value,
                    record: record,
                    formType: formType,
                    form: form
                }));

                //Add id attribute if does not exists
                if (!$input.attr('id')) {
                    $input.attr('id', 'Edit-' + fieldName);
                }

                //Wrap input element with div
                return $('<div />')
                    .addClass('jtable-input jtable-custom-input')
                    .append($input);

            }

            //Create input according to field type
            if (field.type == 'date') {
                return this._createDateInputForField(field, fieldName, value);
            } else if (field.type == 'textarea') {
                return this._createTextAreaForField(field, fieldName, value);
            } else if (field.type == 'password') {
                return this._createPasswordInputForField(field, fieldName, value);
            } else if (field.type == 'checkbox') {
                return this._createCheckboxForField(field, fieldName, value);
            } else if (field.upload) {
                return this._createUploadForField(field, fieldName, value);
            } else if (field.options) {
                if (field.type == 'radiobutton') {
                    return this._createRadioButtonListForField(field, fieldName, value, record, formType);
                } else if (field.type == 'multiselect') {
                    return this._createDropDownListMultiForField(field, fieldName, value, record, formType, form);
                } else {
                    return this._createDropDownListForField(field, fieldName, value, record, formType, form);
                }
            } else if (field.type == 'number') {
                return this._createTextInputForField(field, fieldName, value).attr('type','number').numeric(',');
            } else if(field.geocomplete){
                return this._createGeoInputForField(field, fieldName, value);
            } else {
                return this._createTextInputForField(field, fieldName, value);
            }
        },

        //Creates a hidden input element with given name and value.
        _createInputForHidden: function (fieldName, value) {
            if (value == undefined) {
                value = "";
            }

            return $('<input type="hidden" name="' + fieldName + '" id="Edit-' + fieldName + '"></input>')
                .val(value);
        },

        /* Creates a date input for a field.
        *************************************************************************/
        _createDateInputForField: function (field, fieldName, value) {
            if (field.required) {
                var $input = $('<input class="' + field.inputClass + ' validate[required,custom[date]]" id="Edit-' + fieldName + '" type="text" name="' + fieldName + '"></input>');
            }
            else {
                var $input = $('<input class="' + field.inputClass + ' validate[custom[date]]" id="Edit-' + fieldName + '" type="text" name="' + fieldName + '"></input>');
            }
            
            if(field.inputSize)
                $input.attr("size", field.inputSize);
                
            
            if(value != undefined) {
                $input.val(value);
            }
            
            var displayFormat = field.displayFormat || this.options.defaultDateFormat;
            $input.datepicker({ dateFormat: displayFormat,changeMonth:true,changeYear:true });

            this._bootstrapThemeAddClass($input,'form-control');

            return $('<div />')
                .addClass('jtable-input jtable-date-input')
                .append($input);
        },

        /* Creates a textarea element for a field.
        *************************************************************************/
        _createTextAreaForField: function (field, fieldName, value) {

            var $textArea = $('<textarea>');
            $textArea.addClass(field.inputClass);
            $textArea.attr('id','Edit-'+fieldName);
            $textArea.attr('name',fieldName);

            if (field.required)
                 $textArea.addClass('validate[required]');

            if(field.inputSize)
                $textArea.attr("size", field.inputSize);
                
            if (value != undefined)
                $textArea.val(value);

            this._bootstrapThemeAddClass($textArea,'form-control');


            return $('<div />')
                .addClass('jtable-input jtable-textarea-input')
                .append($textArea);
        },

        /* Creates a standart textbox for a field.
        *************************************************************************/
        _createTextInputForField: function (field, fieldName, value) {
            var $input = $('<input  type="text" '+field.inputAttr+' style="'+field.inputCss+'">');
            $input.addClass(field.inputClass);
            $input.attr('id','Edit-'+fieldName);
            $input.attr('name', fieldName);

            if (field.required)
                $input.addClass('validate[required]');

            if(field.inputSize)
                $input.attr("size", field.inputSize);

            if(field.addMask)
                $input.mask(field.addMask);

            if (value != undefined)
                $input.val(value);

            this._bootstrapThemeAddClass($input,'form-control');

            //return $input;

            return $('<div />')
                .addClass('jtable-input jtable-text-input')
                .append($input);
        },

        /* Creates a password input for a field.
        *************************************************************************/
        _createPasswordInputForField: function (field, fieldName, value) {
            if (field.required) {
                var $input = $('<input class="' + field.inputClass + ' validate[required]" id="Edit-' + fieldName + '" type="password" name="' + fieldName + '"></input>');
            }else{
                var $input = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="password" name="' + fieldName + '"></input>');
            }
            
            if(field.inputSize)
                $input.attr("size", field.inputSize);
                
            if (value != undefined) {
                $input.val(value);
            }

            this._bootstrapThemeAddClass($input,'form-control');

            return $('<div />')
                .addClass('jtable-input jtable-password-input')
                .append($input);
        },

        /* Creates a checkboxfor a field.
        *************************************************************************/
        _createCheckboxForField: function (field, fieldName, value) {
            var self = this;

            //If value is undefined, get unchecked state's value
            if (value == undefined) {
                value = self._getCheckBoxPropertiesForFieldByState(fieldName, false).Value;
            }

            //Create a container div
            var $containerDiv = $('<div />')
                .addClass('jtable-input jtable-checkbox-input');

            //Create checkbox and check if needed
            var $checkBox = $('<input class="' + field.inputClass + '" id="Edit-' + fieldName + '" type="checkbox" name="' + fieldName + '" />')
                .appendTo($containerDiv);

            if (value != undefined) {
                $checkBox.val(value);
            }

            //Create display text of checkbox for current state
            var $textSpan = $('<span>' + (field.formText || self._getCheckBoxTextForFieldByValue(fieldName, value)) + '</span>')
                .appendTo($containerDiv);

            //Check the checkbox if it's value is checked-value
            if (self._getIsCheckBoxSelectedForFieldByValue(fieldName, value)) {
                $checkBox.attr('checked', 'checked');
            }

            //This method sets checkbox's value and text according to state of the checkbox
            var refreshCheckBoxValueAndText = function () {
                var checkboxProps = self._getCheckBoxPropertiesForFieldByState(fieldName, $checkBox.is(':checked'));
                $checkBox.attr('value', checkboxProps.Value);
                $textSpan.html(field.formText || checkboxProps.DisplayText);
            };

            //Register to click event to change display text when state of checkbox is changed.
            $checkBox.click(function () {
                refreshCheckBoxValueAndText();
            });

            //Change checkbox state when clicked to text
            if (field.setOnTextClick != false) {
                $textSpan
                    .addClass('jtable-option-text-clickable')
                    .click(function () {
                        if ($checkBox.is(':checked')) {
                            $checkBox.attr('checked', false);
                        } else {
                            $checkBox.attr('checked', true);
                        }

                        refreshCheckBoxValueAndText();
                    });
            }

            return $containerDiv;
        },

        /* Creates a uploader for a field.
         *************************************************************************/
        _createUploadForField: function (field, fieldName, value){

            if(field.upload.maxFileSize){ var maxFileSize = field.upload.maxFileSize; }else { var maxFileSize = 100000000; }
            if(field.upload.directory){var directory = field.upload.directory}else{ var directory = './'}
            if(field.upload.typeDocument){ var typeDocument = field.upload.typeDocument+'-'}else{ var typeDocument = ''}

            if(!field.upload.url){
                this._logError('Url for upload is not set!');return '';
            }

            var $div = $('<div>');
            var $form = $('<form>');
            $form.attr('target','iframeTarget');
            $form.attr('name','formUpload');
            $form.attr('class','formUploadFile');
            $form.attr('action',field.upload.url+'?action=upload');
            $form.attr('method','post');
            $form.attr('enctype','multipart/form-data');

            /*
            Create field of form upload
             */
            var $i_file = $('<input type="file" name="FILE"/>').css('display','none');

            var $i_button = $('<input type="button" id="btn_addFile" />');//Declenche le chargement du fichier
            $i_button.attr('value',this.options.messages.addFile).button();

            var $i_button_delete = $('<input type="button" id="btn_delFile"/>');
            $i_button_delete.attr('value',this.options.messages.delFile).button();


            var $i_name = $('<input type="hidden"/>');//Champ de la jtable, doit contenir le nom complet + chemin
            $i_name.attr('name',fieldName).attr('id',fieldName);

            //=============================================
            var $i_name_old = $('<input type="hidden"/>');
            $i_name_old.attr('name','OLD_FILE');

            //=============================================

            var $i_display = $('<input type="text" readonly disabled="disabled">'); //Champ visible par l'utilisateur (Uniquement le nom du fichier)

            if(value != undefined) {
                $i_name.attr('value',value);
                $i_name_old.attr('value',value);
                $i_display.attr('value',value.slice(value.lastIndexOf('/') + 1));
            }

            var $i_size = $('<input type="hidden" name="MAX_FILE_SIZE"/>');//Taille max du fichier
            $i_size.attr('value',maxFileSize);


            var $i_directory = $('<input type="hidden" name="DIRECTORY" value="'+directory+'" />');//Dossier de destination, doit prendre en compte la racine du site
            var $i_typeDocument = $('<input type="hidden" name="TYPEDOC" value="'+typeDocument+'" />');//Definit un type de document


            $form.append($i_file);
            $form.append($i_display);
            $form.append($i_button);
            $form.append($i_button_delete);

            $i_button.click(function(){
                $form.append($i_size);
                $form.append($i_directory);
                $form.append($i_typeDocument);
                $i_file.click();
            });

            /*
            'Thread'
             */
            var $iframe = $('<iframe>');
            $iframe.attr('class','upload-iframe');
            $iframe.attr('src','#');
            $iframe.attr('name','iframeTarget');
            $iframe.css('display','none');
            $div.append('<h4>'+this.options.messages.warningFile+'</h4>');
            $div.append($i_name);
            $div.append($form);
            $div.append($iframe);

            $i_file.change(function(){
                if($i_name.val() != ''){// delete the old file
                    $.ajax({
                        type: "POST",
                        url: field.upload.url+'?action=delete',
                        data: {
                            filename : $i_name.val()
                        }
                    });
                }
                $i_name.val('/'+$i_directory.val()+$i_typeDocument.val()+$(this).val().substring(12));
                $i_display.val($(this).val().substring(12));

                this.form.submit();
                $i_size.remove();
                $i_directory.remove();
                $i_typeDocument.remove();
            });
            /**
             * TODO Supprime sans avertissement
             */
            $i_button_delete.click(function(){
                $.ajax({
                    type: "POST",
                    url: field.upload.url+'?action=delete',
                    data: {
                        filename : $i_name.val()
                    }
                });
                $i_name.val('');
                $i_display.val('');
            });

            return $('<div />')
                .addClass('jtable-input jtable-text-input')
                .append($div);
        },

        /* Creates a geocomplete for a field.
        *************************************************************************/
        _createGeoInputForField: function(field, fieldName, value){
            var $input = $('<input  type="text">');
            $input.addClass(field.inputClass);
            $input.attr('id','Edit-'+fieldName);
            $input.attr('name', fieldName);

            if (field.required)
                $input.addClass('validate[required]');

            if(field.inputSize)
                $input.attr("size", field.inputSize);

            if(field.addMask)
                $input.mask(field.addMask);

            if (value != undefined)
                $input.val(value);

            this._bootstrapThemeAddClass($input,'form-control');

            $input.geocomplete();

            return $('<div />')
                .addClass('jtable-input jtable-text-input')
                .append($input);
        },
        /* Creates a multiselecter a field.
         *************************************************************************/
        _createDropDownListMultiForField: function (field, fieldName, value, record, source, form) {
            //Create a container div
            var $containerDiv = $('<div />')
                .addClass('jtable-input jtable-dropdown-input');

            //Create select element
            var $select = $('<select multiple class="' + field.inputClass + '" id="Edit-' + fieldName + '" name="' + fieldName + '[]"></select>')
                .appendTo($containerDiv);

            this._bootstrapThemeAddClass($select,'form-control');

            //add options
            var options = this._getOptionsForField(fieldName, {
                record: record,
                source: source,
                form: form,
                dependedValues: this._createDependedValuesUsingForm(form, field.dependsOn)
            });

            this._fillDropDownListWithOptions($select, options, value);

            $select.multiSelect();

            return $containerDiv;
        },

        /* Creates a drop down list (combobox) input element for a field.
        *************************************************************************/
        _createDropDownListForField: function (field, fieldName, value, record, source, form) {

            //Create a container div
            var $containerDiv = $('<div />')
                .addClass('jtable-input jtable-dropdown-input');

            //Create select element
            var $select = $('<select class="' + field.inputClass + '" id="Edit-' + fieldName + '" name="' + fieldName + '"></select>')
                .appendTo($containerDiv);

            this._bootstrapThemeAddClass($select,'form-control');

            //add options
            var options = this._getOptionsForField(fieldName, {
                record: record,
                source: source,
                form: form,
                dependedValues: this._createDependedValuesUsingForm(form, field.dependsOn)
            });

            this._fillDropDownListWithOptions($select, options, value);

            return $containerDiv;
        },
        
        /* Fills a dropdown list with given options.
        *************************************************************************/
        _fillDropDownListWithOptions: function ($select, options, value) {
            $select.empty();
            for (var i = 0; i < options.length; i++) {
                $('<option' + (options[i].Value == value ? ' selected="selected"' : '') + '>' + options[i].DisplayText + '</option>')
                    .val(options[i].Value)
                    .appendTo($select);
            }
        },

        /* Creates depended values object from given form.
        *************************************************************************/
        _createDependedValuesUsingForm: function ($form, dependsOn) {
            if (!dependsOn) {
                return {};
            }

            var dependedValues = {};

            for (var i = 0; i < dependsOn.length; i++) {
                var dependedField = dependsOn[i];

                var $dependsOn = $form.find('select[name=' + dependedField + ']');
                if ($dependsOn.length <= 0) {
                    continue;
                }

                dependedValues[dependedField] = $dependsOn.val();
            }


            return dependedValues;
        },

        /* Creates a radio button list for a field.
        *************************************************************************/
        _createRadioButtonListForField: function (field, fieldName, value, record, source) {
            var $containerDiv = $('<div />')
                .addClass('jtable-input jtable-radiobuttonlist-input');

            var options = this._getOptionsForField(fieldName, {
                record: record,
                source: source
            });

            $.each(options, function(i, option) {
                var $radioButtonDiv = $('<div class=""></div>')
                    .addClass('jtable-radio-input')
                    .appendTo($containerDiv);

                var $radioButton = $('<input type="radio" id="Edit-' + fieldName + '-' + i + '" class="' + field.inputClass + '" name="' + fieldName + '"' + ((option.Value == (value + '')) ? ' checked="true"' : '') + ' />')
                    .val(option.Value)
                    .appendTo($radioButtonDiv);

                var $textSpan = $('<span></span>')
                    .html(option.DisplayText)
                    .appendTo($radioButtonDiv);

                if (field.setOnTextClick != false) {
                    $textSpan
                        .addClass('jtable-option-text-clickable')
                        .click(function () {
                            if (!$radioButton.is(':checked')) {
                                $radioButton.attr('checked', true);
                            }
                        });
                }
            });

            return $containerDiv;
        },

        /* Gets display text for a checkbox field.
        *************************************************************************/
        _getCheckBoxTextForFieldByValue: function (fieldName, value) {
            return this.options.fields[fieldName].values[value];
        },

        /* Returns true if given field's value must be checked state.
        *************************************************************************/
        _getIsCheckBoxSelectedForFieldByValue: function (fieldName, value) {
            return (this._createCheckBoxStateArrayForFieldWithCaching(fieldName)[1].Value.toString() == value.toString());
        },

        /* Gets an object for a checkbox field that has Value and DisplayText
        *  properties.
        *************************************************************************/
        _getCheckBoxPropertiesForFieldByState: function (fieldName, checked) {
            return this._createCheckBoxStateArrayForFieldWithCaching(fieldName)[(checked ? 1 : 0)];
        },

        /* Calls _createCheckBoxStateArrayForField with caching.
        *************************************************************************/
        _createCheckBoxStateArrayForFieldWithCaching: function (fieldName) {
            var cacheKey = 'checkbox_' + fieldName;
            if (!this._cache[cacheKey]) {

                this._cache[cacheKey] = this._createCheckBoxStateArrayForField(fieldName);
            }

            return this._cache[cacheKey];
        },

        /* Creates a two element array of objects for states of a checkbox field.
        *  First element for unchecked state, second for checked state.
        *  Each object has two properties: Value and DisplayText
        *************************************************************************/
        _createCheckBoxStateArrayForField: function (fieldName) {
            var stateArray = [];
            var currentIndex = 0;
            $.each(this.options.fields[fieldName].values, function (propName, propValue) {
                if (currentIndex++ < 2) {
                    stateArray.push({ 'Value': propName, 'DisplayText': propValue });
                }
            });

            return stateArray;
        },

        /* Searches a form for dependend dropdowns and makes them cascaded.
        */
        _makeCascadeDropDowns: function ($form, record, source) {
            var self = this;

            $form.find('select') //for each combobox
                .each(function () {
                    var $thisDropdown = $(this);

                    //get field name
                    var fieldName = $thisDropdown.attr('name');

                    if(fieldName.substr(-2) == '[]'){ //For multi select
                        fieldName = fieldName.slice(0,-2);
                    }
                    if (!fieldName) {
                        return;
                    }

                    var field = self.options.fields[fieldName];

                    //check if this combobox depends on others
                    if (!field.dependsOn) {
                        return;
                    }

                    //for each dependency
                    $.each(field.dependsOn, function (index, dependsOnField) {
                        //find the depended combobox
                        var $dependsOnDropdown = $form.find('select[name=' + dependsOnField + ']');
                        //when depended combobox changes
                        $dependsOnDropdown.change(function () {

                            //Refresh options
                            var funcParams = {
                                record: record,
                                source: source,
                                form: $form,
                                dependedValues: {}
                            };
                            funcParams.dependedValues = self._createDependedValuesUsingForm($form, field.dependsOn);
                            var options = self._getOptionsForField(fieldName, funcParams);

                            //Fill combobox with new options
                            self._fillDropDownListWithOptions($thisDropdown, options, undefined);

                            //Thigger change event to refresh multi cascade dropdowns.
                            $thisDropdown.change();
                        });
                    });
                });
        },

        /* Updates values of a record from given form
        *************************************************************************/
        _updateRecordValuesFromForm: function (record, $form) {
            for (var i = 0; i < this._fieldList.length; i++) {
                var fieldName = this._fieldList[i];
                var field = this.options.fields[fieldName];

                //Do not update non-editable fields
                if (field.edit == false) {
                    continue;
                }

                //Get field name and the input element of this field in the form
                var $inputElement = $form.find('[name="' + fieldName + '"]');
                if ($inputElement.length <= 0) {
                    continue;
                }

                //Update field in record according to it's type
                if (field.type == 'date') {
                    var dateVal = $inputElement.val();
                    if (dateVal) {
                        var displayFormat = field.displayFormat || this.options.defaultDateFormat;
                        try {
                            var date = $.datepicker.parseDate(displayFormat, dateVal);
                            record[fieldName] = '/Date(' + date.getTime() + ')/';
                        } catch (e) {
                            //TODO: Handle incorrect/different date formats
                            this._logWarn('Date format is incorrect for field ' + fieldName + ': ' + dateVal);
                            record[fieldName] = '';
                        }
                    } else {
                        this._logDebug('Date is empty for ' + fieldName);
                        record[fieldName] = ''; //TODO: undefined, null or empty string?
                    }
                } else if (field.options && field.type == 'radiobutton') {
                    var $checkedElement = $inputElement.filter(':checked');
                    if ($checkedElement.length) {
                        record[fieldName] = $checkedElement.val();
                    } else {
                        record[fieldName] = undefined;
                    }
                } else {
                    record[fieldName] = $inputElement.val();
                }
            }
        },

        /* Sets enabled/disabled state of a dialog button.
        *************************************************************************/
        _setEnabledOfDialogButton: function ($button, enabled, buttonText) {
            if (!$button) {
                return;
            }

            if (enabled != false) {
                $button
                    .removeAttr('disabled')
                    .removeClass('ui-state-disabled');
            } else {
                $button
                    .attr('disabled', 'disabled')
                    .addClass('ui-state-disabled');
            }

            if (buttonText) {
                $button
                    .find('span')
                    .text(buttonText);
            }
        }


    });

})(jQuery);

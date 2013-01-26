/************************************************************************
* FORM TEMPLATES extension for jTable                                  *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _create: $.hik.jtable.prototype._create,
        _showEditForm: $.hik.jtable.prototype._showEditForm
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
     * DEFAULT OPTIONS / EVENTS                                              *
     *************************************************************************/
        options: {
            dialogs: {}
        },

        /************************************************************************
     * PRIVATE FIELDS                                                        *
     *************************************************************************/
        
        /************************************************************************
     * OVERRIDED METHODS                                                     *
     *************************************************************************/
        
        /* Overrides base method to do editing-specific constructions.
     *************************************************************************/
        _create: function () {
            base._create.apply(this, arguments);
            
            if( this.options.dialogs.updateDialog != undefined ){
                if( this.options.dialogs.updateDialog.template != undefined ){
                    this.options.dialogs.updateDialog.template.remove();    // Removes template from DOM
                }
            }
        },

        /* Shows edit form for a row.
     *************************************************************************/
        _showEditForm: function ($tableRow) {
            var self = this;

            base._showEditForm.apply(this, arguments);

            if( this.options.dialogs.updateDialog != undefined ){
                var record = $tableRow.data('record');
                var $editForm = this._$editDiv.find('form#jtable-edit-form');
                var $dialog = this._$editDiv;
                var options = this.options.dialogs.updateDialog;
                
                this._applyDialogOptions({
                    dialog: $dialog,
                    form: $editForm,
                    formType: 'edit',
                    options: options,
                    record: record
                });
            }
        },
        
        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/        

        /* Apply custom options to forms
        *************************************************************************/
        _applyDialogOptions: function ( data ) {
            var self = this;
            
            /*dialog: $dialog,
            form: $editForm,
            formType: 'edit',
            options: options,
            record: record*/
            
            // Apply user defined dialog options
            if( data.options.options ){
                data.dialog.dialog('option', data.options.options );
            }
           
            if( data.options.template ){
                //Adds template to form
                data.form.append( data.options.template );

                //Move created fields to template
                $.each( data.form.find('div.jtable-input-field-container'), function( index, fieldContainer ){
                    var $fieldContainer = $(fieldContainer);
                    var fieldName = $fieldContainer.find('div.jtable-input').children().attr('name');
                    var $templateFieldDiv = data.options.template.find('div#' + fieldName );
                
                    // Checks if field is included in template
                    if( $templateFieldDiv.length != 0 ){
                        $templateFieldDiv
                        .empty()
                        .append( $fieldContainer );
                    }
                });
            }
            
            // Dialog children options
            if( data.options.children ){
                $.each( data.options.children, function( childID, childOptions ){
                    var $childDiv = data.form.find('div#' + childID );
                    if( $childDiv.lenth != 0 ){
                        switch( childOptions.type ){
                            case 'button':
                                $childDiv
                                .button({
                                    disabled: childOptions.disabled || false
                                })
                                .click( function(e){
                                    if( childOptions.click ){
                                        childOptions.click({
                                            form: data.form, 
                                            record: data.record
                                        });
                                    }
                                });
                                break;
                            
                            case 'jtable':
                                $childDiv
                                .jtable( childOptions.options( data.record ) )
                                .jtable('load');
                                break;
                        }
                    }                        
                });
            }
            
            // Applies formatting to template buttons
            /*if( data.options.buttons ){
                $.each( data.options.buttons, function( buttonID, options ){
                    var $templateButton = data.options.template.find('button#' + buttonID );

                    if( $templateButton.length != 0 ){
                        $templateButton
                        .button()
                        .click( function(e){
                            if( options.click ){
                                options.click();
                            }
                        });
                    }
                });
            }*/
            
            // Applies additional options for created fields
            /*$.each( data.form.find('div.jtable-input-field-container'), function( index, fieldContainer ){
                var $fieldContainer = $(fieldContainer);
                var $fieldInput = $fieldContainer.find('div.jtable-input').children();
                var fieldName = $fieldInput.attr('name');
                var field = self.options.fields[fieldName];
                
                // Readonly option
                if( field.readonly && field.readonly==true ){
                    $fieldInput
                    .attr('readonly', field.readonly );
                }
            });*/
            
            data.dialog.dialog("option", "position", {
                my: "center", 
                at: "center"
            } );
        }
    });
})(jQuery);
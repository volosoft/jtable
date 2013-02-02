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
                    var params = { form: data.form, record: data.record };
                    var options = typeof(childOptions.options)=='function'?childOptions.options( params ):childOptions.options || {}
                        
                    // if not present in form already, appends element to form
                    if( $childDiv.length == 0 ){
                        if( childOptions.type == 'button' ){
                            var dialogButtons = data.dialog.dialog('option', 'buttons');
                            var index;
                            for( index=0; index<dialogButtons.length; index++ ){
                                if( dialogButtons[index].id == childID ) break;
                            }
                            if( index==dialogButtons.length ){
                                dialogButtons.splice(0,0,{
                                    id: childID,
                                    text: options.label || childID,
                                    click: function(e){
                                        e.preventDefault();
                                        if( childOptions.click ){
                                            childOptions.click(params);
                                        }
                                    }
                                });
                                data.dialog.dialog('option', 'buttons', dialogButtons);
                            }
                        }
                        else{
                            $childDiv = $('<div id="' + childID + '"/>');
                            data.form.append($childDiv);
                        }
                    }
                    
                    if( $childDiv.length != 0 ){
                        switch( childOptions.type ){
                            case 'button':
                                $childDiv
                                .button( options )
                                .click( function(e){
                                    if( childOptions.click ){
                                        childOptions.click(params);
                                    }
                                });
                                break;

                            case 'jtable':
                                $childDiv
                                .jtable( options )
                                .jtable('load');
                                break;
                        }
                    }
                });
            }
            
            data.dialog.dialog("option", "position", {
                my: "center", 
                at: "center"
            } );
        }
    });
})(jQuery);
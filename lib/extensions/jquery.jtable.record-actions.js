/************************************************************************
* RECORD-ACTIONS extension for jTable                                          *
*************************************************************************/
(function ($) {

    //Reference to base object members
    var base = {
        _initializeFields: $.hik.jtable.prototype._initializeFields,
        _onRecordsLoaded: $.hik.jtable.prototype._onRecordsLoaded
    };

    //extension members
    $.extend(true, $.hik.jtable.prototype, {

        /************************************************************************
        * OVERRIDED METHODS                                                     *
        *************************************************************************/

        /* Overrides base method to create record-actions field type.
        *************************************************************************/
        _initializeFields: function () {
            base._initializeFields.apply(this, arguments);
            
            var self = this;

            self._extraFieldTypes.push({
                type:'record-actions',
                creator: function(record, field){
                    return self._createRecordActionsDropdown(record, field);
                }
            });
        },

        /* Overrides base method to handle dropdown menu overflow.
        *************************************************************************/
        _onRecordsLoaded: function () {
            base._onRecordsLoaded.apply(this, arguments);

            var self = this;
            self._$tableBody.find('div.dropdown').on('show.bs.dropdown', function (e) {
                    var $this = $(this);

                    if (!$this.data('_tether')) {
                        var $dropdownButton = $this.find('.dropdown-toggle');
                        var $dropdownMenu = $this.find('.dropdown-menu');

                        $dropdownMenu.css({
                            'display': 'block'
                        });

                        $this.data('_tether', new Tether({
                            element: $dropdownMenu[0],
                            target: $dropdownButton[0],
                            attachment: 'top left',
                            targetAttachment: 'bottom left',
                            constraints: [{
                                to: 'window',
                                attachment: 'together',
                                pin: true
                            }]
                        }));
                    }

                    var $dropdownMenu = $($this.data('_tether').element);
                    $dropdownMenu.css({
                        'display': 'block'
                    });
                }).on('hidden.bs.dropdown', function (e) {
                    var $this = $(this);
                    var $dropdownMenu = $($this.data('_tether').element);
                    $dropdownMenu.css({
                        'display': 'none'
                    });
                });
        },
        
        /************************************************************************
        * PRIVATE METHODS                                                       *
        *************************************************************************/

        /* Builds the dropdown actions button according to field definition
        *************************************************************************/
        _createRecordActionsDropdown: function(record, field){
            var self = this;
            var $dropdownContainer = $('<div></div>')
                                        .addClass('btn-group')
                                        .addClass('dropdown');
    
            var $dropdownButton = $('<button></button>')
                                        .html(field.text)
                                        .addClass('dropdown-toggle')
                                        .attr('data-toggle','dropdown')
                                        .attr('aria-haspopup','true')
                                        .attr('aria-expanded','true');
                                        
            if(field.cssClass){
                $dropdownButton.addClass(field.cssClass);
            }

            var $dropdownItemsContainer = $('<ul></ul>').addClass('dropdown-menu');
            for (var i = 0; i < field.items.length; i++) {
                var fieldItem = field.items[i];
                                
                if(fieldItem.visible && !fieldItem.visible({record: record})){
                    continue;
                }

                var $dropdownItem = self._createDropdownItem(record, fieldItem);

                if(fieldItem.enabled && !fieldItem.enabled({ record: record })){
                    $dropdownItem.addClass('disabled');
                }

                $dropdownItem.appendTo($dropdownItemsContainer);
            }

            if($dropdownItemsContainer.find('li').length > 0){
                $dropdownItemsContainer.appendTo($dropdownContainer);
                $dropdownButton.appendTo($dropdownContainer);
            }
            
            return $dropdownContainer;
        },

        _createDropdownItem: function(record, fieldItem){
            var $li = $('<li></li>');
            var $a = $('<a></a>');

            if(fieldItem.text){
                $a.html(fieldItem.text);
            }

            if (fieldItem.action) {
                $a.click(function (e) {
                    e.preventDefault();
                    
                    if (!$(this).closest('li').hasClass('disabled')) {
                        fieldItem.action({
                            record: record
                        });
                    }
                });
            }

            $a.appendTo($li);
            return $li;
        }

    });

})(jQuery);
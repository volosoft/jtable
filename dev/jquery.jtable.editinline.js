/************************************************************************
* EDIT INLINE CELL extension for jTable                                 *
* (Enable/Disable Edit Cell live )                                      *
*************************************************************************/
(function ($) {
	var base={
		_createCellForRecordField:$.hik.jtable.prototype._createCellForRecordField,
		_updateRowTexts:$.hik.jtable.prototype._updateRowTexts	

	}
    $.extend(true, $.hik.jtable.prototype, {
		options: {
			editinline:{enable:false,img:"../scripts/jtable/content/"},
			
			//localisation
			messages:{
				required:'Required field'
			}
		},
		/** Overrides Method
		*****************************/
		_createCellForRecordField: function (record, fieldName) {
			var $column = base._createCellForRecordField.apply(this, arguments);
			var field = this.options.fields[fieldName];
			if(this.options.editinline.enable == true && this.options.fields[fieldName].edit != false && this.options.actions.updateAction != undefined){
				return $('<td></td>')
                .addClass(this.options.fields[fieldName].listClass)
                .append((this._getDisplayTextEditInline(record, fieldName)));
			}else{
			     return $('<td></td>')
                .addClass(this.options.fields[fieldName].listClass)
                .append((this._getDisplayTextForRecordField(record, fieldName)));
			}
        },
		/** Overrides Method
		*****************************/
		_updateRowTexts: function ($tableRow) {
            var record = $tableRow.data('record');
            var $columns = $tableRow.find('td');
			if(this.options.editinline.enable == true){
				for (var i = 0; i < this._columnList.length; i++) {
                    var displayItem = this._getDisplayTextEditInline(record, this._columnList[i]);
                    $columns.eq(this._firstDataColumnOffset + i).html(displayItem || '');
				}
			}else{
				for (var i = 0; i < this._columnList.length; i++) {
					var displayItem = this._getDisplayTextForRecordField(record, this._columnList[i]);
                    if ((displayItem != "") && (displayItem == 0)) displayItem = "0";
					$columns.eq(this._firstDataColumnOffset + i).html(displayItem || '');
				}
			}
            this._onRowUpdated($tableRow);
        },

        _getDisplayTextEditInline:function (record, fieldName) {
			var field = this.options.fields[fieldName];
            var fieldValue = record[fieldName];
			
			if (field.display) {
					return field.display({ record: record });
            }
			
            if (field.type == 'date') {
					return this._editInline_date(record,fieldName);
			} else if (field.type == 'textarea') {
                return this._editInline_textarea(record, fieldName);
            } else if (field.type == 'number') {
                return this._editInline_number(record, fieldName);
            } else if (field.type == 'password') {
                return this._editInline_password(record, fieldName);
            } else if (field.type == 'checkbox') {
                return this._editInline_checkbox(record, fieldName);
            } else if (field.options) { //combobox or radio button list since there are options.
                var options = this._getOptionsForField(fieldName, {
                    record: record,
                    value: fieldValue,
                    source: 'list',
                    dependedValues: this._createDependedValuesUsingRecord(record, field.dependsOn)
                });
				var self = this;
                if(field.type == 'multiselect'){
                    return this._editInline_optionsMulti(options, fieldValue,record,fieldName,field,self);
                }else{
                    return this._editInline_options(options, fieldValue,record,fieldName,field,self);
                }
            /*} else if (field.type == 'link') {
                return this._editInline_link(record, fieldName);*/
            } else if(field.upload){
                var showFieldValue = fieldValue.slice(fieldValue.lastIndexOf('/') + 1);
                return "<a target='_blank' href='"+fieldValue+"'>"+showFieldValue+"</a>";
            } else if(field.geocomplete){
                return this._editInline_geoComplete(record, fieldName);
            } else { //other types
				return this._editInline_default(record,fieldName);
            }
        },
        _editInline_options: function (options, value,record,fieldName,field,selfParent) { 
			var self = this;
			var val = value;
			var valtext ='';
            var $inputhtml = $('<select></select>');
			$inputhtml.css('background-repeat','no-repeat');
			$inputhtml.css('background-position','right center');
			
			for (var i = 0; i < options.length; i++) {
				if(options[i].Value == value){
					valtext = options[i].DisplayText;
				}
            }
		
			var defaulttext = (valtext) ? valtext :' - - - ';
			var $txt = $('<span>' + defaulttext + '</span>');
			$txt.dblclick(function(){
				var options = selfParent._getOptionsForField(fieldName, {
                    record: record,
                    value: record[fieldName],
                    source: 'edit',
                    dependedValues: selfParent._createDependedValuesUsingRecord(record, field.dependsOn)
                });
				$inputhtml.remove();
				$inputhtml = $('<select></select>');
                self._bootstrapThemeAddClass($inputhtml,'form-control');
				for (var i = 0; i < options.length; i++) {
					$inputhtml.append('<option value="' + options[i].Value + '"' + (options[i].Value == value ? ' selected="selected"' : '') + '>' + options[i].DisplayText + '</option>');
				}
				if($(this).children().length < 1){
					$inputhtml.val(val);
					$(this).html($inputhtml);
					$inputhtml.bind('change blur focusout',function(){											
						$(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
						var postData = {};
						postData[fieldName]=$(this).val();
						postData[self._keyField]=record[self._keyField];
						if(self._editInline_ajax(postData)){
							val = $(this).val();
							$txt.html(($(this).find("option:selected").text()!= '')?$(this).find("option:selected").text():' - - - ');
							record[fieldName]=$(this).val();
							$(this).css('background','none');
							self._showUpdateAnimationForRow($txt.closest("tr"));
						}
					});
					$inputhtml.focus();
				}
			});
			return $txt;
        },
        _editInline_optionsMulti:function (options, value,record,fieldName,field,selfParent){
            var self = this;
            var val = value;
            var valtext ='';
            var $inputhtml = $('<select></select>');
            $inputhtml.css('background-repeat','no-repeat');
            $inputhtml.css('background-position','right center');

            for (var i = 0; i < options.length; i++) {
                if(options[i].Value == value){
                    valtext = options[i].DisplayText;
                }
            }

            var defaulttext = (valtext) ? valtext :' - - - ';
            var $txt = $('<span>' + defaulttext + '</span>');
            $txt.dblclick(function(){
                var options = selfParent._getOptionsForField(fieldName, {
                    record: record,
                    value: record[fieldName],
                    source: 'edit',
                    dependedValues: selfParent._createDependedValuesUsingRecord(record, field.dependsOn)
                });

                $inputhtml.remove();
                $inputhtml = $('<select multiple></select>');
                $inputhtml.attr('name',fieldName+'[]');

                self._bootstrapThemeAddClass($inputhtml,'form-control');

                for (var i = 0; i < options.length; i++) {
                    $inputhtml.append('<option value="' + options[i].Value + '"' + (options[i].Value == value ? ' selected="selected"' : '') + '>' + options[i].DisplayText + '</option>');
                }

                if($(this).children().length < 1){
                    $inputhtml.val(val);
                    $(this).html($inputhtml);
                    $inputhtml.bind('change blur focusout',function(){
                        $(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
                        var postData = {};
                        postData[fieldName]=$(this).val();
                        postData[self._keyField]=record[self._keyField];
                        if(self._editInline_ajax(postData)){
                            val = $(this).val();
                            $txt.html(($(this).find("option:selected").text()!= '')?$(this).find("option:selected").text():' - - - ');
                            record[fieldName]=$(this).val();
                            $(this).css('background','none');
                            self._showUpdateAnimationForRow($txt.closest("tr"));
                        }
                    });
                    $inputhtml.focus();
                }

            });
            return $txt;
        },
        _editInline_date:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var displayFormat = field.displayFormat || this.options.defaultDateFormat;
			
				var defaultval = (fieldValue !='' && fieldValue !='0000-00-00') ? $.datepicker.formatDate(displayFormat, this._parseDate(fieldValue)) :'&nbsp;&nbsp;&nbsp;';

        		var $txt = $('<span>' + defaultval + '</span>');
				$txt.dblclick(function(){
					if($(this).children().length < 1){
						var $inputhtml = $('<input type="text" value="' + $(this).html().trim() + '" />');
                        self._bootstrapThemeAddClass($inputhtml,'form-control');
						$inputhtml.css('background-repeat','no-repeat');
						$inputhtml.css('background-position','right center');
						$inputhtml.addClass(field.inputClass);
						$(this).html($inputhtml);
						(displayFormat.toLowerCase() == 'dd-mm-yy' )?$(this).mask("99-99-9999"):$(this).mask("9999-99-99");
						if (field.required) {
							$(this).attr('title',self.options.messages.required);
							$(this).append('<b><i>'+self.options.messages.required+'</i></b>');
						}
						$inputhtml.datepicker({dateFormat:displayFormat,changeMonth:true,changeYear:true,onClose: function(calDate) {
							$(this).css('background-image','url(' + self.options.editinline.img + 'loading.gif)');
							var postData = {};
							postData[fieldName]=$(this).val();
							postData[self._keyField] = record[self._keyField];
							if(self._editInline_ajax(postData)){
								$txt.html($(this).val());
								record[fieldName] = $(this).val();
								$(this).css('background','none');
								self._showUpdateAnimationForRow($txt.closest("tr"));						
							}							
						}});
						$inputhtml.focus();
							
					}
				});	
										
				return $txt;	

		},
		_editInline_checkbox:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var $img = (fieldValue != 0) ? $('<img val="1" style="cursor:pointer;" src="' + this.options.editinline.img + 'apply.png"></img>') : $('<img val="0" style="cursor:pointer;" src="' + this.options.editinline.img + 'cross.png"></img>');
				$img.dblclick(function(){
					var postData = {};
					postData[fieldName]=($(this).attr('val'))!=0?0:1;
					postData[self._keyField] = record[self._keyField];
					if(self._editInline_ajax(postData)){
					if($(this).attr('val')=='0'){
						record[fieldName]=1;
						$(this).attr('title','click to uncheck');
						$(this).attr('val','1');
						$(this).attr('src',self.options.editinline.img + 'apply.png');	
					}else{
						record[fieldName]=0;
						$(this).attr('title','click to check');
						$(this).attr('val','0');
						$(this).attr("src",self.options.editinline.img + 'cross.png');	
					}
					self._showUpdateAnimationForRow($img.closest("tr"));
					}
				});	
										
				return $img;	

		},
		_editInline_textarea:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var defaultval = (fieldValue) ? fieldValue :'&nbsp;&nbsp;&nbsp;';  
				var $txt = $('<span>' + defaultval + '</span>');
				$txt.dblclick(function(){
					if($(this).children().length < 1){
						var $inputhtml = $('<textarea>' + $(this).html() + '</textarea>');
                        self._bootstrapThemeAddClass($inputhtml,'form-control');
						$inputhtml.css('background-repeat','no-repeat');
						$inputhtml.css('background-position','right center');
						$inputhtml.addClass(field.inputClass);
						if (field.addMask) {
							$inputhtml.mask(field.addMask);
						}
						$(this).html($inputhtml);
						if (field.required) {
							$(this).append('<b><i>'+self.options.messages.required+'</i></b>');
						}
						$inputhtml.bind('change blur focusout',function(){
							if ($(this).val().trim() == '' && field.required) {
								$(this).attr('title',self.options.messages.required);
							}else{
								$(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
								var postData = {};
								postData[fieldName]=$(this).val().trim();
								postData[self._keyField] = record[self._keyField];
								if(self._editInline_ajax(postData)){
								$txt.html($(this).val().trim()+'&nbsp;&nbsp;&nbsp;&nbsp;');
								record[fieldName]=$(this).val().trim();
								$(this).css('background','none');
								self._showUpdateAnimationForRow($txt.closest("tr"));
								}
							}
						});
						$inputhtml.focus();
					}
				});	
										
				return $txt;	

		},
		_editInline_default:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var defaultval = (fieldValue) ? fieldValue :'&nbsp;&nbsp;&nbsp;&nbsp;';  
				var $txt = $('<div style=\'width:auto\'>' + defaultval + '</div>');
				$txt.dblclick(function(){
					if($(this).children().length < 1){
						var $inputhtml = $('<input type="text" '+field.inputAttr +' style="'+field.inputCss+'" value="' + $(this).html() + '"/>');
                        self._bootstrapThemeAddClass($inputhtml,'form-control');
						$inputhtml.css('background-repeat','no-repeat');
						$inputhtml.css('background-position','right center');
						$inputhtml.addClass(field.inputClass);
						if (field.addMask) {
							$inputhtml.mask(field.addMask);
						}
						$(this).html($inputhtml);
						if (field.required) {
							$(this).append('<b><i>'+self.options.messages.required+'</i></b>');
						}
						$inputhtml.bind('change blur focusout',function(){
							if ($(this).val().trim() == '' && field.required) {
								$(this).attr('title',self.options.messages.required);
							}else{
								$(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
								var postData = {};
								postData[fieldName]=$(this).val().trim();
								postData[self._keyField] = record[self._keyField];
								if(self._editInline_ajax(postData)){
									$txt.html($(this).val().trim()+'&nbsp;&nbsp;&nbsp;&nbsp;');
									record[fieldName]=$(this).val().trim();
									$(this).css('background','none');
									self._showUpdateAnimationForRow($txt.closest("tr"));
								}
							}
							
						});
						$inputhtml.focus();
					}
				});						
				return $txt;	
		},
        _editInline_geoComplete:function (record, fieldName){
            var self = this;
            var field = this.options.fields[fieldName];
            var fieldValue = record[fieldName];
            var defaultval = (fieldValue) ? fieldValue :'&nbsp;&nbsp;&nbsp;&nbsp;';
            var $txt = $('<div style=\'width:auto\'>' + defaultval + '</div>');
            $txt.dblclick(function(){
                if($(this).children().length < 1){
                    var location = $(this).html();
                    var $inputhtml = $('<input type="text" value="' + location + '"/>');
                    self._bootstrapThemeAddClass($inputhtml,'form-control');
                    $inputhtml.css('background-repeat','no-repeat');
                    $inputhtml.css('background-position','right center');
                    $inputhtml.addClass(field.inputClass);

                    var $div = $('<div>');
                    $div.attr('id','myMap');
                    $div.css({height : 400, width : 400})

                    if (field.addMask) {
                        $inputhtml.mask(field.addMask);
                    }
                    $(this).html($inputhtml);
                    $(this).append($div);
                    $inputhtml.geocomplete({
                        'map':'#myMap',
                        'find':'Paris, France',
                        markerOptions: {
                            draggable: false
                        },
                        location: location
                    });
                    if (field.required) {
                        $(this).append('<b><i>'+self.options.messages.required+'</i></b>');
                    }

                    $inputhtml.on('keypress',function(e){
                        if(e.which == 13) {
                            if ($(this).val().trim() == '' && field.required) {
                                $(this).attr('title', self.options.messages.required);
                            } else {
                                $(this).css('background-image', 'url("' + self.options.editinline.img + 'loading.gif")');
                                var postData = {};
                                postData[fieldName] = $(this).val().trim();
                                postData[self._keyField] = record[self._keyField];
                                if (self._editInline_ajax(postData)) {
                                    $txt.html($(this).val().trim() + '&nbsp;&nbsp;&nbsp;&nbsp;');
                                    record[fieldName] = $(this).val().trim();
                                    $(this).css('background', 'none');
                                    self._showUpdateAnimationForRow($txt.closest("tr"));
                                }
                            }
                        }
                    });

                    $inputhtml.focus();
                }
            });
            return $txt;
        },
        _editInline_number:function(record,fieldName){
	            var self = this;
				var field = this.options.fields[fieldName];
    	        var fieldValue = record[fieldName];
				var defaultval = (fieldValue) ? fieldValue :'&nbsp;&nbsp;&nbsp;';  
				var $txt = $('<span>' + defaultval + '</span>');
				$txt.dblclick(function(){
					if($(this).children().length < 1){
						var $inputhtml = $('<input type="number" value="' + $(this).html() + '"/>');
                        self._bootstrapThemeAddClass($inputhtml,'form-control');
						$inputhtml.css('background-repeat','no-repeat');
						$inputhtml.css('background-position','right center');
						$(this).html($inputhtml);
						if (field.required) {
							$(this).append('<b><i>'+self.options.messages.required+'</i></b>');
						}
						$(this).numeric(',');
						$inputhtml.bind('blur focusout',function(){
							if ($(this).val().trim() == '' && field.required) {
								$(this).attr('title',self.options.messages.required);
							}else{
								$(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
								var postData = {};
								postData[fieldName]=$(this).val();
								postData[self._keyField] = record[self._keyField];
								if(self._editInline_ajax(postData)){
								$txt.html($(this).val().trim()+'&nbsp;&nbsp;&nbsp;&nbsp;');
								record[fieldName]=$(this).val();
								$(this).css('background','none');
								self._showUpdateAnimationForRow($txt.closest("tr"));
								}
							}
						});
						$inputhtml.focus();
					}
				});
				return $txt;
		},
        _editInline_password:function(record, fieldName){
            var self = this;
            var field = this.options.fields[fieldName];
            var fieldValue = record[fieldName];
            var defaultval = (fieldValue) ? fieldValue :'&nbsp;&nbsp;&nbsp;&nbsp;';
            //var $txt = $('<div style=\'width:auto\'>' + defaultval + '</div>');
            var $txt = $('<div style=\'width:auto\' name="cache"> * * * * * </div>');
            $txt.dblclick(function(){
                if($(this).children().length < 1){
                    var $inputhtml = $('<input type="password" value="' + $(this).html() + '"/>');
                    self._bootstrapThemeAddClass($inputhtml,'form-control');
                    $inputhtml.css('background-repeat','no-repeat');
                    $inputhtml.css('background-position','right center');
                    $inputhtml.addClass(field.inputClass);
                    if (field.addMask) {
                        $inputhtml.mask(field.addMask);
                    }
                    $(this).html($inputhtml);
                    if (field.required) {
                        $(this).append('<b><i>'+self.options.messages.required+'</i></b>');
                    }
                    $inputhtml.bind('change blur focusout',function(){
                        if ($(this).val().trim() == '' && field.required) {
                            $(this).attr('title',self.options.messages.required);
                        }else{
                            $(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
                            var postData = {};
                            postData[fieldName]=$(this).val().trim();
                            postData[self._keyField] = record[self._keyField];
                            if(self._editInline_ajax(postData)){
                                $txt.html($(this).val().trim()+'&nbsp;&nbsp;&nbsp;&nbsp;');
                                record[fieldName]=$(this).val().trim();
                                $(this).css('background','none');
                                self._showUpdateAnimationForRow($txt.closest("tr"));
                            }
                        }

                    });
                    $inputhtml.focus();
                }
            });
            $txt.bind('contextmenu',this,function(){
                event.preventDefault();
                if($(this).attr('name') == 'cache'){
                    $(this).html(defaultval);
                    $(this).attr('name','uncache');
                }else{
                    $(this).html(' * * * * * ');
                    $(this).attr('name','cache');
                }
            });
            return $txt;
        },
        _editInline_link:function(record,fieldName){
            var self = this;
            var field = this.options.fields[fieldName];
            var fieldValue = record[fieldName];
            var defaultval = (fieldValue) ? fieldValue :'&nbsp;&nbsp;&nbsp;&nbsp;';
            if(fieldValue.substring(7) == 'http://' || fieldValue.substring(8) == 'https://'){
                var $txt = $('<div style=\'width:auto\'><a href="' + defaultval + '">'+defaultval+'</a></div>');
            }else{
                var $txt = $('<div style=\'width:auto\'><a href="http://' + defaultval + '">'+defaultval+'</a></div>');
            }

            $txt.children().click(function(event){
                if($(this).html() == '&nbsp;&nbsp;&nbsp;&nbsp;') {
                    event.preventDefault();
                }else{
                    window.open($txt.children().href(),'_blank');
                }
            });

            $txt.children().on("contextmenu",this, function(e){
                if($(this).children().length < 1){
                    var $inputhtml = $('<input type="text" value="' + $(this).html() + '"/>');
                    self._bootstrapThemeAddClass($inputhtml,'form-control');
                    $inputhtml.css('background-repeat','no-repeat');
                    $inputhtml.css('background-position','right center');
                    $inputhtml.addClass(field.inputClass);
                    if (field.addMask) {
                        $inputhtml.mask(field.addMask);
                    }

                    $(this).html($inputhtml);

                    if (field.required) {
                        $(this).parent().append('<b><i>'+self.options.messages.required+'</i></b>');
                    }
                    $inputhtml.bind('change blur focusout',function(){
                        if ($(this).val().trim() == '' && field.required) {
                            $(this).attr('title',self.options.messages.required);
                        }else{
                            $(this).css('background-image','url("' + self.options.editinline.img + 'loading.gif")');
                            var postData = {};
                            postData[fieldName]=$(this).val().trim();
                            postData[self._keyField] = record[self._keyField];
                            if(self._editInline_ajax(postData)){
                                $txt.children().html($(this).val().trim()+'&nbsp;&nbsp;&nbsp;&nbsp;');
                                if($(this).val().trim().substring(7) == 'http://' || $(this).val().trim().substring(8) == 'https://'){
                                    $txt.children().attr("href",$(this).val().trim());
                                }else{
                                    $txt.children().attr("href",'http://'+$(this).val().trim());
                                }
                                record[fieldName]=$(this).val().trim();
                                $(this).css('background','none');
                                self._showUpdateAnimationForRow($txt.closest("tr"));
                            }
                        }
                    });
                    $inputhtml.focus();
                }
                return false;
            });
            return $txt;
        },
		_editInline_ajax:function(postData){
            var self = this;
			var res = true;
            this._ajax({
                url: (self.options.actions.updateAction),
                data: postData,
                success: function (data) {              
					if (data.Result != 'OK') {
                        return res =false;
                    }
                    self._trigger("recordUpdated", null, {});
                },
                error: function () {
                        error(self.options.messages.serverCommunicationError);
                }
            });			
			return res;
		}
	});
	
})(jQuery);
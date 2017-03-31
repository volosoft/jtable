/** JTABLE Spreadsheet extension 
 by NUBUNTU
**/
(function ($) {
	var base={
        _create: $.hik.jtable.prototype._create,
		_onRecordsLoaded:$.hik.jtable.prototype._onRecordsLoaded
	}
    $.extend(true, $.hik.jtable.prototype, {
		options: {
			spreadsheet:false,			
		},
		_selectedCells:[],
		_loadedNewDataRow:false,
        _create: function() {
            base._create.apply(this, arguments);
			if(this.options.spreadsheet){
				this._bindPaste();
			}
		},
		_bindPaste:function(){
			var self=this;
				$(document).bind('paste',function(e){
    
					var text =  (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('Paste something..');
					var clipRows = text.split("\r\n");
					clipRows.splice(-1,1);
				    for (i=0; i<clipRows.length; i++) {
						var cols = clipRows[i].split("\t");
    					clipRows[i] = cols;						
    				}
					var $tr = $("tr.jtable-new-data-row",self._$tableBody).eq(0);
					var $selected=$( ".ui-selected",$tr);
					console.log($selected);
					self._pasteData(clipRows);
				
				});
				
		},
		_pasteData:function(records){
			var self=this;
			var data=[];
			var fields=[];
			var i=0;
			$.each(self._selectedCells,function(key,val){
				fields[i]=val;
				i++;
			});
			for(var i=0;i<records.length;i++){
				var row=records[i];
				var field={};
				for(var j=0;j<row.length;j++){
					eval("field." + fields[j] + "=row[j]");
				}
				data.push(field);
			}
			var json = JSON.stringify(data);
			$.ajax({
				url:self.options.actions.spreadsheet.createAction,
				data:{records:json},
				type:"POST",
				async:false,
				success: function(respon){
					console.log(respon);
					self._reloadTable();
				}
			});
		},
        _createNewDataRow: function (records) {
			var self=this;
            var $tr = $('<tr></tr>')
                .addClass('jtable-new-data-row')
				.selectable({
					filter:".cellNewDataRow",
					stop: function() {
				        $( ".ui-selected", this ).each(function() {
							var index = $(".jtable-new-data-row td.cellNewDataRow").index( this );
							self._selectedCells.push($(this).data('name'));
        				});
      				}
				});
			this._addEmptyCellsToNewRow($tr);
			this._addCellsToNewRow($tr);
			$tr.find(".empty-td").html("*");
			return $tr;	
        },
        _addCellsToNewRow: function($row) {
            for (var i = 0; i < this._columnList.length; i++) {
                this._createCellForNewRow(this._columnList[i]).appendTo($row);;
            }
        },
        _createCellForNewRow: function (fieldName) {
            return $('<td></td>')
				.data("name",fieldName)
                .addClass("cellNewDataRow");
        },	
        _addEmptyCellsToNewRow: function ($row) {
			if (this.options.actions.updateAction != undefined) {
            	$('<td/>').addClass("empty-td").appendTo($row);
			}
			if (this.options.actions.deleteAction != undefined) {
            	$('<td/>').addClass("empty-td").appendTo($row);
			}
        },	
        _getDisplayForNewRow: function (fieldName) {
            var field = this.options.fields[fieldName];
			return this._getInpuTextForNewRow(fieldName,field);
        },
		_getInpuTextForNewRow:function(fieldName,field){
			var $input=$("<input/>").attr("type","text").attr("name",fieldName).addClass("inputNewDataRow");
			return $input;		
		},
        _onRecordsLoaded: function(data) {
            base._onRecordsLoaded.apply(this, arguments);
            if( this.options.spreadsheet ){
				
					if(!$('.jtable-new-data-row',this._$tableBody).length){
						this._$tableBody.append(this._createNewDataRow());						
					}
	
            }
            
        },
		
	});
	
})(jQuery);
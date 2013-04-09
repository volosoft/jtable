/** JTABLE Command Button Left extension 
  by: nubuntu
**/
(function ($) {
  var base={
		_addCellsToRowUsingRecord:$.hik.jtable.prototype._addCellsToRowUsingRecord,
		_addColumnsToHeaderRow:$.hik.jtable.prototype._addColumnsToHeaderRow,
		_updateRowTexts:$.hik.jtable.prototype._updateRowTexts,
		_toolbarsearch_addColumnsToHeaderRow:$.hik.jtable.prototype._toolbarsearch_addColumnsToHeaderRow	
	}
    $.extend(true, $.hik.jtable.prototype, {
		options: {
			buttonleft:false
		},
        /* Adds column header cells to given tr element.
        *************************************************************************/
        _addColumnsToHeaderRow: function ($tr) {
			base._addColumnsToHeaderRow.apply(this,arguments);
			$tr.children(".jtable-command-column-header").each(function(){
				$tr.prepend(this);
				$(this).remove;
			});			
		},
        _toolbarsearch_addColumnsToHeaderRow: function ($tr) {
			base._toolbarsearch_addColumnsToHeaderRow.apply(this,arguments);
			$tr.children(".jtable-toolbarsearch-reset").each(function(){
				$tr.prepend(this);
				$(this).remove;
			});
		},	
		/** Overrides Method
		*****************************/
		_addCellsToRowUsingRecord: function ($row) {
			base._addCellsToRowUsingRecord.apply(this,arguments);
			$row.children(".jtable-command-column").each(function(){
				$row.prepend(this);
				$(this).remove;
			});
		},
        _updateRowTexts: function ($tableRow) {
			base._updateRowTexts.apply(this,arguments);
			var $row = $tableRow;
			var self = this;
			$row.find(".jtable-command-column").each(function(){
				console.log($(this).html());
				$(this).removeAttr('class');
				$row.find('td:last').remove();
			});
            if (self.options.actions.updateAction != undefined) {
                var $span = $('<span></span>').html(self.options.messages.editRecord);
                var $button = $('<button title="' + self.options.messages.editRecord + '"></button>')
                    .addClass('jtable-command-button jtable-edit-command-button')
                    .append($span)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._showEditForm($row);
                    });
                $('<td></td>')
                    .addClass('jtable-command-column')
                    .append($button)
                    .prependTo($row);
            }
            if (self.options.actions.deleteAction != undefined) {
                var $span = $('<span></span>').html(self.options.messages.deleteText);
                var $button = $('<button title="' + self.options.messages.deleteText + '"></button>')
                    .addClass('jtable-command-button jtable-delete-command-button')
                    .append($span)
                    .click(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._deleteButtonClickedForRow($row);
                    });
                $('<td></td>')
                    .addClass('jtable-command-column')
                    .append($button)
                    .prependTo($row);
            }
		}		
	});
	
})(jQuery);

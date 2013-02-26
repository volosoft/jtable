/** JTABLE Command Button Left extension 
  by: nubuntu
**/
(function ($) {
  var base={
		_addCellsToRowUsingRecord:$.hik.jtable.prototype._addCellsToRowUsingRecord,
		_addColumnsToHeaderRow:$.hik.jtable.prototype._addColumnsToHeaderRow,
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
		}
	});
	
})(jQuery);

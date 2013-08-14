#!/bin/bash
#
# JTableBuilder.sh -- Combine and Create using UglifyJS2  
# Please make sure that UglifyJS2 is installed.
# Details for installation can be found at https://github.com/mishoo/UglifyJS2
#
# Contributed to jtable by jojozepp @ github

uglifyjs \
	../jquery.jtable.header.txt \
	../jquery.jtable.core.js \
	../jquery.jtable.utils.js \
	../jquery.jtable.forms.js \
	../jquery.jtable.creation.js \
	../jquery.jtable.editing.js \
	../jquery.jtable.deletion.js \
	../jquery.jtable.selecting.js \
	../jquery.jtable.paging.js \
	../jquery.jtable.sorting.js \
	../jquery.jtable.dynamiccolumns.js \
	../jquery.jtable.masterchild.js \
	--beautify \
	--comments \
	--output ../../lib/jquery.jtable.js 

uglifyjs \
	../../lib/jquery.jtable.js \
	--comments '/@license/' \
	-c \
	-m -r '$' \
	-b beautify=false,max-line-len=500 \
	--output ../../lib/jquery.jtable.min.js



What is msjTable
======



[![A screenshot of jTable](https://raw.githubusercontent.com/hikalkan/jtable/master/screenshot.png)](http://jtable.org/)

#### msjTable is a jQuery plugin forked from jTable, to create AJAX based CRUD tables without coding HTML or Javascript.

#### Additional features of msjTable :

* Record Preview feature :
```javascript
$("#myjtable").jtable({
...,
recordPreview : true,  // setting recordPreview to true, a view icon will appeare beside edit icon in each row
...,
fields : {
    ...,
    first_name : {
               title : 'First name',
               edit : true,
               create : true,
               preview : true, // specify which field you want to be shown in preview dialog
               type : 'text'
                },
        ...
});

```

* Multi columns form for Create, Edit and Preview dialogs.
```javascript
$("#myjtable").jtable({
...,
createFormColumns : 2,
editFormColumns : 2,
viewFormColumns : 2,
...

});
```

* You can send any required fields to row-delete-request POST data (jTable only sends single key field)








Read More about additional features [here](https://m-shaeri.ir/blog/jquery-jtable-awesome-full-featured-plugin-for-crud-table/)

Notes
======

lib folder contains files necessary to use jTable.

dev folder contains parts of library helpful for development of jTable.

See http://www.jtable.org for documentation, demos, themes and more...

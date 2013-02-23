<?php 
require_once("jtable.php");
require_once("nudb.php");
$table = NuJTable::getObj();
$db = NuDB::getObj();
$table->exc=array("somefields","that","donotwant","toappear");

// enable edit inline
$table->editinline['enable'] = true;
$table->editinline['img'] = 'path/to/image/folder/';

// enable toolbar search
$table->toolbarsearch=true;

// add values to dropdown
$table->options = array(
"Status"=>array(0=>"Passive",1=>"active"),
"Publihed"=>array(0=>"Unpublihed",1=>"Published")
);

//set title
$table->setTitle('Students List');

//set table from database
$table->setTable($db,"table_student");


//create search option
$opt = array("name"=>"Name","address"=>"Address");
$table->setOpt($opt);

//trigger all request
$table->trigger();
?>

<script type="text/javascript">
 jQuery.noConflict();
    jQuery(document).ready(function ($) {
  $( document ).tooltip();
<?php echo $table->render();?>
  	
        //Load all records when page is first shown
});
</script>
<?php echo $table->gethtml();?>

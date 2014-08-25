<?php 
ini_set('error_reporting', E_ALL);
ini_set( 'display_errors', 1 );
require_once("jtable.php");
require_once("nudb.php");
$table = NuJTable::getObj();
$db = NuDB::getObj();
//$table->exc=array("somefields","that","donotwant","toappear");

// enable edit inline
$table->editinline['enable'] = true;
$table->editinline['img'] = 'content/';

// enable toolbar search
$table->toolbarsearch=true;

// add values to dropdown
$table->options = array("sex"=>array(0=>"Female",1=>"Male"));

//set title
$table->setUrl('example.jtable.php?');
$table->setTitle('Students');

//set table from database setTable("DB Resource","Table Name","Primary key, default=id")
$table->setTable($db,"student");

$toolbar1 =  array("icon"=>"images/excel.png",
        		"text"=>'Export to Excel',
        		"click"=>"function () {
            		window.location='example.jtable.php?action=toexcel';
        		}");
$toolbar2 =  array("icon"=>"images/excel.png",
        		"text"=>'Export to Excel',
        		"click"=>"function () {
            		alert('tolbar2');
        		}");

$table->addToolbar($toolbar1,$toolbar2);
//create search option == useless if toolbarsearch enabled
//$opt = array("name"=>"Name","address"=>"Addess");
//$table->setOpt($opt);

//trigger all request
$table->trigger();
?>
<!DOCTYPE html>
<html>
<head>
<title>Example JTable php crud</title>
<link rel="stylesheet" type="text/css" href="jquery-ui/jquery-ui.min.css" />
<link rel="stylesheet" type="text/css" href="lib/themes/metro/blue/jtable.min.css" />
<script type="text/javascript" src="jquery-2.1.0.min.js"></script>
<script type="text/javascript" src="jquery-ui/jquery-ui.min.js"></script>
<script type="text/javascript" src="lib/jquery.jtable.min.js"></script>
<script type="text/javascript" src="lib/extensions/jquery.jtable.editinline.js"></script>
<script type="text/javascript" src="lib/extensions/jquery.jtable.toolbarsearch.js"></script>
<script type="text/javascript">
   $(document).ready(function ($) {
  $( document ).tooltip();
<?php echo $table->render();?>
});
</script>
</head>
<body>
<?php echo $table->gethtml();?>
</body>

</html>
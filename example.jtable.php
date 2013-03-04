<?php 
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
//$table->options = array("Status"=>array(0=>"Passive",1=>"active"),"Publihed"=>array(0=>"Unpublihed",1=>"Published"));

//set title
$table->setUrl('example.jtable.php?');
$table->setTitle('Invoice');

//set table from database setTable("DB Resource","Table Name","Primary key, default=id")
$table->setTable($db,"invoice","otonumb");

$toolbar1 =  array("icon"=>"/images/excel.png",
        		"text"=>'Export to Excel',
        		"click"=>"function () {
            		alert('tolbar1');
        		}");
$toolbar2 =  array("icon"=>"/images/excel.png",
        		"text"=>'Export to Excel',
        		"click"=>"function () {
            		alert('tolbar2');
        		}");

$table->addToolbar($toolbar1,$toolbar2);
//create search option
$opt = array("No_Invoice"=>"No.Invoice");
$table->setOpt($opt);

//trigger all request
$table->trigger();
?>
<!DOCTYPE html>
<html>
<head>
<title>Example JTable php crud</title>
<link rel="stylesheet" type="text/css" href="css/ui-lightness/jquery-ui-1.10.1.custom.min.css" />
<link rel="stylesheet" type="text/css" href="lib/themes/metro/blue/jtable.min.css" />
<script type="text/javascript" src="jquery-1.9.1.min.js"></script>
<script type="text/javascript" src="jquery-ui-1.10.1.custom.js"></script>
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
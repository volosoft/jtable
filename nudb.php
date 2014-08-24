<?php
class NuDB{
  var $_sql;
	var $dbo;
	var $recordset;
	var $table;
	var $fields;
	var $assign;
	var $primary;
	var $master= "localhost";
	var $master_user ="root";
	var $master_pass="root";	
	var $host = "localhost";
	var $user ="root";
	var $pass="root";
	var $db="nucrud";
	function __construct(){
		$this->connect();
	}
	function &getObj(){
		static $instance;
		if(!$instance):
		$instance = new NuDB();
		endif;
		return $instance;
	}
	function connect($server="slave"){
		if($server!="master"):
			$this->dbo = mysql_connect($this->host,$this->user,$this->pass);
		else:
			$this->dbo = mysql_connect($this->master,$this->master_user,$this->master_pass);		
		endif;
		$this->selectDB();
	}
	function selectDB(){
		mysql_select_db($this->db,$this->dbo);	
	}
	function setQuery( $sql )
	{
		if(strpos(strtolower($sql),"select")===false):
			$this->connect("master");
		else:
			$this->connect("slave");		
		endif;
		$this->_sql		= $sql;
	}
	function query(){
		$this->recordset = mysql_query($this->_sql,$this->dbo) ;
		return $this->recordset;
	}
	function execute(){
		mysql_query($this->_sql) or die(mysql_error());
	}
	function loadResult()
	{
		$cur = $this->query();
		$ret = @mysql_result($cur,0);
		//mysql_free_result( $cur );
		return $ret;
	}

	function loadObject( )
	{
		$cur = $this->query();
		if ($object = mysql_fetch_object( $cur )) {
			$ret = $object;
		}
		mysql_free_result( $cur );
		return $ret;
	}
	function loadObjectList()
	{
		$cur = $this->query();
		$array = array();
		while ($row = mysql_fetch_object( $cur )) {
				$array[] = $row;
		}
		mysql_free_result( $cur );
		return $array;
	}
	function loadArrayList(){
		$cur = $this->query();
		$array = array();
		while ($row = mysql_fetch_array( $cur )) {
				$array[] = $row;
		}
		mysql_free_result( $cur );
		return $array;	
	}
	function getList($query,$limitstart,$limit){
		$this->setQuery( $query." limit ".$limitstart.",".$limit);
		$cur = $this->query();
		$array = array();
		$i = 1;
		while ($row = mysql_fetch_object( $cur )) {
				$row->record_number= $i + $limitstart;
				$array[] = $row;
				$i++;
		}
		mysql_free_result( $cur );
		return $array;
	}
	function getListCount( $query )
	{
		$this->setQuery( $query );
		$rows = $this->loadObjectList();
		return count($rows);
	}			
	
	function getFields(){
		return $this->fields;
	}
	function setTable($t,$key='id'){
		$this->table = $t;
		$this->setField();
		$this->setPrimary($key);
	}
	function getEscaped( $text, $extra = false )
	{
		$result = mysql_real_escape_string( $text );
		if ($extra) {
			$result = addcslashes( $result, '%_' );
		}
		return $result;
	}
	
	function setField(){
		$q = "show columns from ".$this->table;
		$this->setQuery($q);
		$rows = $this->loadObjectList();
		$fields = new stdClass();
		foreach($rows as $row){
			$name = $row->Field;
			$fields->$name = $row->Type;
		}
		$this->fields = get_object_vars($fields);
	}
	function setPrimary($key){
      $this->primary = $key;    
  	}		
	function bind($data){
		$this->assign = '';	
		foreach($this->fields as $key => $value):
			if(isset($data[$key])): 		
			$this->assign[$key] = $data[$key];
			endif;
		endforeach;
	}
	function store(){
		$q = "select count(*) from ".$this->table." where ".$this->primary." = '".mysql_real_escape_string($this->assign[$this->primary])."'";
		$this->setQuery($q);
		$count = $this->loadResult();
		if($count >= 1):
		foreach($this->assign as $key => $value):
			if($key != $this->primary):
			$row[] = $key."= '".mysql_real_escape_string($value)."'";
			endif;
		endforeach;
		$q = "update ".$this->table." set ".implode(',',$row)." where ".$this->primary." = '".mysql_real_escape_string($this->assign[$this->primary])."'";
		else:
		foreach($this->assign as $key => $value):
			$row['field'][] = $key;
			$row['value'][] = "'".mysql_real_escape_string($value)."'";
		endforeach;
		$q = "insert into ".$this->table."(".implode(',',$row['field']).") VALUES (".implode(',',$row['value']).")";
		endif;
		$this->setQuery($q);
		$this->query();	
	}
	function delete($post){
		$q = "delete from ".$this->table." where ".$this->primary." = '".mysql_real_escape_string($post[$this->primary])."'";
		$this->setQuery($q);
		$this->query();	
	}
	function lastId(){
		return mysql_insert_id();
	}
	function lookUp($field,$table,$where){
		$q = "select ".$field." as result from ".$table." where ".$where;
		$this->setQuery($q);
		return $this->loadResult();	
	}
	function DCount($field,$table,$where){
		$q = "select count(".$field.") from ".$table." where ".$where;
		$this->setQuery($q);
		return $this->loadResult();	
	}
	function concat($field,$table,$where){
		$q = "select * from ".$table." where ".$where;
		$this->setQuery($q);
		$rows = $this->loadObjectList();
		foreach($rows as $row):
			$data[] = $row->$field;
		endforeach;
		return $data;
	}
	

}
?>
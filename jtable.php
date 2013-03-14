<?php
class NuJTable{
	var $div;
	var $url;
	var $action;
	var $db;
	var $jtable;
	var $table;
	var $title;
	var $toolbar=array();
	var $clicktoolbar=array();
	var $fields;
	var $opt;
	var $combo;
	var $options;
	var $qdata;
	var $custom;
	var $func=array();
	var $exc=array();
	var $details;
	var $childkey;
	var $isdetail;
	var $editable=true;
	var $selects;
	var $toolbarsearch=false;		
	var $editinline=array();
	function &getObj(){
		static $instance;
		if(!$instance):
			$instance = new NuJTable();
		endif;
		return $instance;			
	}
	function __construct(){
		$this->setUrl($_SERVER['REQUEST_URI']."?");
		$this->setDiv("jtable-data");
		$this->editinline = array("enable"=>false,"img"=>"");
		$this->isdetail=false;
		
		
	}
	function setUrl($url){
		$this->url = $url;
		$action = $url."&action=data";
		$create = $url."&action=create";
		$update = $url."&action=update";
		$delete = $url."&action=delete";
		$this->action['listAction'] = $action;
		$this->action['createAction'] = $create;
		$this->action['updateAction']=$update;
		$this->action['deleteAction']=$delete;		
	}
	function setManual(){
		$url=$this->url;
		$action = $url."&action=dataquery";
		$create = $url."&action=createquery";
		$update = $url."&action=updatequery";
		$delete = $url."&action=deletequery";
		$this->action['listAction'] = $action;
		$this->action['createAction'] = $create;
		$this->action['updateAction']=$update;
		$this->action['deleteAction']=$delete;		
	}
	function disable(){
   		$numargs = func_num_args();
	    $arg_list = func_get_args();
    	for ($i = 0; $i < $numargs; $i++) {
			$m = ($arg_list[$i]);
			unset($this->action[$m]);
    	}	
		
	}
	function listOnly(){
		$this->disable("createAction","updateAction","deleteAction");
	}
	function setDiv($div){
		$this->div = $div;
	}
	
	function setTable($db,$t,$key='id',$detail=false){
		$this->jtable['defaultSorting'] ="$key DESC";
		if($detail):
			$this->isdetail=true;
			$this->action['updateAction'] = $this->action['updateAction']."&detail=null";
		endif;
		$this->db = $db;
		$this->table = $t;
		$this->db->setTable($t,$key);
		$this->getFields();
	}
	function setTitle($title){
		$this->jtable['title'] = $title;
		$this->jtable['paging'] = true;
		$this->jtable['pageSize'] = 10;
		$this->jtable['sorting'] = true;
		$this->jtable['width'] ='100%';
		$this->jtable['editinline'] =$this->editinline;
		$this->jtable['toolbarsearch'] =$this->toolbarsearch;		
	}
	function addToolbar(){
		$arg = func_get_args();
		if(count($arg)>=1):
			for($i = 0; $i < count($arg); $i++):
				$click=$arg[$i]['click'];
				unset($arg[$i]['click']);
				$this->toolbar['items'][] = $arg[$i];
				$this->clicktoolbar[]=$click;
			endfor;
		endif;
	}
	function render(){
		$this->jtable['actions'] = $this->action;
		if(count($this->toolbar['items'])>=1):
			$this->toolbar['hoverAnimation']= true;
			$this->toolbar['hoverAnimationDuration']=60;
			$this->jtable['toolbar'] = $this->toolbar;
		endif;
		$this->jtable['fields'] = $this->fields;
		$html = "var obj =".$this->json_encok($this->jtable).";";
		//$html.= "$('#".$this->div."').jtable(obj);";
		$p = array('"%%%','%%%"');
		$r = array('','');
		$html = str_replace($p,$r,$html);
		if(count($this->options)>=1):
		$html.= $this->getoption();
		endif;
		if(count($this->clicktoolbar)>=1):
			for($i = 0; $i < count($this->clicktoolbar); $i++):
				$html.= "
				";
				$html.="obj.toolbar.items[$i].click=".$this->clicktoolbar[$i];
			endfor;								
		endif;
		if(count($this->custom)>=1):
			for($i = 0; $i < count($this->custom); $i++):
				$html.= "
				";
				$html.=$this->custom[$i];							
			endfor;
		endif;
		if(count($this->func)>=1):
			foreach($this->func as $key => $val):
				$html.= "
				";
				foreach($val as $k => $v):
					$html.= "
					";
					$html.="obj.fields.$key.$k=$v";
				endforeach;							
			endforeach;
		endif;

		$html.= "
		$('#".$this->div."').jtable(obj);";
		if(count($this->opt)>=1):
		$html.="
				 $('#ResetButton').click(function (e) {
		      e.preventDefault();
               $('#q').val('');
        $('#LoadRecordsButton').click();
        });
 $('#LoadRecordsButton').click(function (e) {
            e.preventDefault();
            $('#".$this->div."').jtable('load', {
                q: $('#q').val(),
                opt: $('#opt').val()
            });
        });
 
        //Load all records when page is first shown
        $('#LoadRecordsButton').click();";
		else:
            $html.="
			$('#".$this->div."').jtable('load');";		
		endif;
		return $html;
	}
	function gethtml(){
		$html='';
	if(count($this->opt)>=1):
		$html.= '<div class="filtering">
    <form>
        Cari: 
          <input type="text" name="q" id="q" value="'.$_REQUEST['q'].'"/>
        Berdasarkan: 
        <select id="opt" name="opt">';
		$i = 0;
		foreach($this->opt as $key => $val):
			$selected = ($i < 1) ? 'selected="selected" ' : '';	
            $html .='<option '.$selected.'value="'.$key.'">'.$val.'</option>';
		$i++;
		endforeach;
        $html.='</select>
        <button type="submit" id="LoadRecordsButton">Search</button>
        <button type="submit" id="ResetButton">Reset</button>
    </form>
</div>';
	endif;
		$html.='<div id="'.$this->div.'" style="width:100%;"></div>';
		return $html;	
	}
	function getFields(){
		$this->fields['id_urut'] = array(
                    "title"=>'#',
                    "width"=>'2%',
                    "edit"=>false,
                    "create"=>false,					
					"sorting"=>false);
		$this->fields[$this->db->primary] = array(
					"title"=>"ID",
					"width"=>'2%',
                    "key"=>true,
                    "edit"=>false,
                    "create"=>false,
                    "list"=>true
                );
		$rows = $this->db->getFields();
		foreach($rows as $key => $val){			
			if($key!=$this->db->primary):
				if(!array_search($key,$this->exc)):
				$vals = explode("(",$val);
				switch($vals[0]):
					default:
						$this->fields[$key] = array("title"=>$key,"width"=>"10%","type"=>"text");
					break;
					case 'date':
						$this->fields[$key] = array("title"=>$key,"width"=>"10%","type"=>"date");						
					break;
					case 'text':
						$this->fields[$key] = array("title"=>$key,"width"=>"10%","type"=>"textarea");					
					break;
					case 'tinyint':
						$this->fields[$key] = array("title"=>$key,"width"=>"10%","type"=>"checkbox",
						"values"=>array(0=>"False",1=>"True"),"defaultValue"=>0);					
					break;
				endswitch;
				if(isset($this->options[$key])):
					$this->fields[$key]['options'] = $this->options[$key];
				endif;
				endif;
			endif;
		}
		return $this->fields;		
	}
	function pushFields($rows){
		foreach($rows as $key => $val){
			if($key!=$this->db->primary):
				if($val=='date'):
				$this->fields[$key] = array("title"=>$key,"width"=>"10%","type"=>"date");
				else:				
				$this->fields[$key] = array("title"=>$key,"width"=>"10%");
				endif;
			endif;
		}	
	}
	function setOpt($opt){
		$this->opt = $opt;
	}
	function trigger(){
		if(isset($_REQUEST['action'])):
				$action = $_REQUEST['action'];
				if(method_exists($this,$action)):
					$this->$action();
				endif;
		endif;	
	}
	function data(){
		if(isset($_REQUEST['detail'])):
			$this->datadetail();
		endif;
		$offset = isset($_REQUEST['jtStartIndex']) ? $_REQUEST['jtStartIndex']:1 ;  
		$rows = isset($_REQUEST['jtPageSize']) ? $_REQUEST['jtPageSize']:10 ;
		$q = $_REQUEST['q'];
		$sort = isset($_REQUEST['jtSorting']) ? $_REQUEST['jtSorting']:$this->db->primary.' desc';
		$opt = $_REQUEST['opt'];
		$where ='';
		if($q):
			if(!is_array($q)):
				$where = " where $opt like '%$q%'";
			else:
				for($i = 0; $i < count($opt); $i++):  
					$where[] = $opt[$i]." like '%".$q[$i]."%'";
				endfor;
				$where = " where ".implode(" And ",$where);  
			endif;
		endif;
		$q = "select count(*) FROM ".$this->table.$where;
		$this->db->setQuery($q);
		$total= $this->db->loadResult();  
		$q = "SELECT * FROM ".$this->table.$where." order by ".$sort;  
		$items = $this->db->getList($q,$offset,$rows);			
		$jTableResult = array();
		$jTableResult['Result'] = "OK";
		$jTableResult['Records'] = $items;
		$jTableResult['TotalRecordCount'] = $total;
		die(json_encode($jTableResult));
	}
	function datadetail(){
		$detail = JRequest::getVar('detail');
		$offset = JRequest::getVar('jtStartIndex',1);  
		$rows = JRequest::getVar('jtPageSize',10);
		$sort = JRequest::getVar('jtSorting',$this->db->primary.' desc'); 
		  
		$q = "select count(*) FROM ".$this->table." where ".$this->childkey." = '$detail'";
		$this->db->setQuery($q);
		$total= $this->db->loadResult();  
		$q = "SELECT * FROM ".$this->table." where ".$this->childkey." = '$detail' order by ".$sort;  
		$items = $this->db->getList($q,$offset,$rows);			
		$jTableResult = array();
		$jTableResult['Result'] = "OK";
		$jTableResult['Records'] = $items;
		$jTableResult['TotalRecordCount'] = $total;
		die(json_encode($jTableResult));
		
	
	}
	function create(){
		$post =  $_POST;
		$jTableResult = array();
		$this->db->bind($post);
		$this->db->store();
		$post[$this->db->primary] = $this->db->lastId();
		$jTableResult['Record'] = $post;
		$jTableResult['Result'] = "OK";
		$log['action'] = "create";
		$log['table'] = $this->db->table;
		$log['key'] = $this->db->primary;
		$log['data'] = $post;
		die(json_encode($jTableResult));						
	}
	function update(){
		$post =  $_POST;
		$log['action'] = "update";
		$log['table'] = $this->db->table;
		$log['key'] = $this->db->primary;
		$log['data'] = $post;
		if($this->editable):
			$this->db->bind($post);
			$this->db->store();
		endif;
		$jTableResult = array();
		$jTableResult['Result'] = "OK";
		die(json_encode($jTableResult));			
	}
	function delete(){
		$post =  $_POST;
		$this->db->delete($post);
		$jTableResult = array();
		$jTableResult['Result'] = "OK";
		$log['action'] = "delete";
		$log['table'] = $this->db->table;
		$log['key'] = $this->db->primary;
		$log['data'] = $post;
		die(json_encode($jTableResult));			
	}
	function dataquery(){
		$offset = JRequest::getVar('jtStartIndex',1);  
		$rows = JRequest::getVar('jtPageSize',10);
		$q = JRequest::getVar('q','');
		$sort = JRequest::getVar('jtSorting',$this->db->primary.' desc'); 
		$opt = JRequest::getVar('opt',$this->db->primary); 
		$where = "$opt like '%$q%'";  
		$q = $this->qdata." where ".$where;
		$this->db->setQuery($q);
		$total= $this->db->loadResult();  
		$q = "SELECT * FROM ".$this->table." where ".$where." order by ".$sort;  
		$items = $this->db->getList($q,$offset,$rows);			
		$jTableResult = array();
		$jTableResult['Result'] = "OK";
		$jTableResult['Records'] = $items;
		$jTableResult['TotalRecordCount'] = $total;
		die(json_encode($jTableResult));

	}	
	function cmb(){
		$combo = JRequest::getVar('combo');  
		$this->db->setQuery($this->combo[$combo]);
		$rows = $this->db->loadObjectList();
		$jTableResult = array();
		$jTableResult['Result'] = "OK";
		$jTableResult['Options'] = $rows;
		die(json_encode($jTableResult));

	}
	function setCombo($cmb,$q){
		$this->combo[$cmb] = $q;
		$this->option = $cmb;
		//$this->fields[$cmb]["options"] = "%%%function(data){return \'".$this->url."&action=cmb&combo=".$cmb."\';}%%%";
	}
	function getoption(){
		foreach($this->options as $key => $val):
			$html="";
			if(!$this->editinline){
			$html= "
				obj.fields.$key.options = $val;
				";				
			}
		endforeach;
	}
	function justInclude(){
   		$numargs = func_num_args();
	    $arg_list = func_get_args();
    	$f = array();
		for ($i = 0; $i < $numargs; $i++) {
			$m = $arg_list[$i];
			$f[$m] = $this->fields[$m];	
    	}
		$this->fields =$f;		
	}
	function hideInList(){
   		$numargs = func_num_args();
	    $arg_list = func_get_args();
    	$f = array();
		for ($i = 0; $i < $numargs; $i++) {
			$m = $arg_list[$i];
			$this->fields[$m]['list']=false;
    	}	
	}
	function setTH($arr){
    	foreach ($arr as $key => $val) {
			$this->fields[$key]['title'] = $val;
    	}		
	}
	function getTable(){
		return $this->jtable;
	}
	function addDetail($tbl,$name,$parent){
			$this->fields[$name]['display'] ='';
			$this->fields[$name]['edit'] =false;
			$this->fields[$name]['create'] =false;
			$this->fields[$name]['width'] ='5%';
			$tbl->render();
			$table = $tbl->jtable;
			$table['fields'][$parent] = array("type"=>"hidden","defaultValue"=>"");
			
			$im = "../components/com_armina/asset/".JTABLE."/content/list_metro.png";			
			$func = "function (data) {
                        var \$img = $('<img src=\"$im\" title=\"Lihat/Edit Detail\" />');
                        \$img.click(function () {
var objdetail = \$.parseJSON('".json_encode($table)."');
							objdetail.actions.listAction = '".$this->url."&action=data&detail=' + data.record.$parent;
							objdetail.actions.createAction = '".$this->url."&action=create&detail=' + data.record.$parent;
							objdetail.actions.updateAction = '".$this->url."&action=update&detail=' + data.record.$parent;
							objdetail.actions.deleteAction = '".$this->url."&action=delete&detail=' + data.record.$parent;";
											if(count($tbl->func)>=1):
			foreach($tbl->func as $key => $val):
				$func.= "
				";
				foreach($val as $k => $v):
					$func.= "
					";
					$func.="objdetail.fields.$key.$k=$v;";
				endforeach;							
			endforeach;
		endif;				
							
                        $func .=  "$('#".$this->div."').jtable('openChildTable',\$img.closest('tr'),objdetail,
							function (data) { //opened handler
                                    data.childTable.jtable('load');
                                });
													});";

													
				$func.="		return \$img;
					}";
			$this->func[$name]['display'] = $func;							
								 	 
			
			
	}
	function json_encok($arr){
	$str = "{";
	$str2=array();
	foreach($arr as $key => $val):
		$value = $val;
		switch(gettype($val)):
			case "string":
				if(strpos(trim($val),"function(")===false):
					$value = '"'.$val.'"';
				endif;
			break;
			case "boolean":
				$value = ($val) ? "true" : "false";			
			break;
			case "array":
				$value = $this->json_encok($val);
			break;
		endswitch;
		$str2[]=$key.":".$value;
	endforeach;
	$str.=implode(",",$str2);
	$str.="}";
	return $str;
	}	
}
?>

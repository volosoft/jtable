<?php
class NuJTable{
	var $div;
	var $url;
	var $action;
	var $db;
	var $jtable;
	var $table;
	var $title;
	var $toolbar;
	var $fields;
	var $opt;
	var $combo;
	var $options;
	var $qdata;
	var $custom;
	var $func;
	var $exc;
	var $editinline;

	function &getObj(){
		static $instance;
		if(!$instance):
			$instance = new NuJTable();
		endif;
		return $instance;			
	}
	function __construct(){
		$this->setUrl($_SERVER['REQUEST_URI']);
		$this->setDiv("jtable-data");
		$this->editinline = false;
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
	
	function setTable($db,$t,$key='id',$auto=true){
		$this->auto = $auto;
		$this->db = $db;
		$this->table = $t;
		$this->db->setTable($t,$key);
		$this->getFields();
		if($auto!=true):
			$this->setManual();
		endif;
	}
	function setTitle($title){
		$this->jtable['title'] = $title;
		$this->jtable['paging'] = true;
		$this->jtable['pageSize'] = 10;
		$this->jtable['sorting'] = true;
		$this->jtable['width'] ='100%';
		
	}
	function addToolbar($link,$title){
		$this->toolbar[] = "{
        			text: '".$title."',
        			click: function () {
						var status ='status=no,toolbar=no,scrollbars=yes,titlebar=no,menubar=yes,resizable=yes,left=200,top=200,width=800,height=300,directories=no,location=no';
            			var href = '".$link."';
						window.open(href,'".$title."',status); return false;
 			       }}";
	}
	function render(){
		$this->jtable['actions'] = $this->action;
		if(count($this->toolbar)>=1):
		$this->jtable['toolbar'] = $this->toolbar;
		endif;
		$this->jtable['fields'] = $this->fields;
	    $html = "var obj = $.parseJSON('".json_encode($this->jtable)."');";
 		//$html.= "$('#".$this->div."').jtable(obj);";
		$p = array('"%%%','%%%"');
		$r = array('','');
		$html = str_replace($p,$r,$html);
		if(count($this->options)>=1):
		$html.= $this->getoption();
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

		return $html;
	}
	function gethtml(){
		$html = '<div class="filtering">
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
</div>
<div id="'.$this->div.'" style="width:100%;"></div>';
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
                    "key"=>true,
                    "edit"=>false,
                    "create"=>false,
                    "list"=>true
                );
		$rows = $this->db->getFields();
		foreach($rows as $key => $val){
			
			if($key!=$this->db->primary):
				$this->fields[$key] = array("title"=>strtoupper($key),"width"=>"10%");
				$vals = explode("(",$val);
				switch($vals[0]):
					default:
						if($this->editinline):
						$option = '';
						if(!array_search($key,$this->exc)):
							$inputtext = "$('<input type=\"text\" value=\"' + data.record.$key + '\"/>')";
							$inputhtml = "$('<input type=\"text\" value=\"' + $(this).html() + '\"/>')";
							$inputchange = "\$txt.html($(this).val())";
							$text = "data.record.$key";
							if(isset($this->options[$key])):
								$this->fields[$key] ['options'] = $this->options[$key];
								$inputtext = "$('<select>";
											foreach($this->options[$key] as $k => $v):
								$inputtext .=	"<option value=\"$k\">$v</option>";
											endforeach;	
								$inputtext .= "</select>')";
								$inputhtml = "$('<select>";
											foreach($this->options[$key] as $k => $v):
								$inputhtml .=	"<option value=\"$k\">$v</option>";
											endforeach;	
								$inputhtml .= "</select>')";
								$inputchange = "\$txt.html(obj.fields.$key.options[$(this).val()])";
								$text = "obj.fields.$key.options[data.record.$key]";
							endif;
							$display = "function (data) {
										var defaultval = (data.record.$key) ? $text : '&nbsp;&nbsp;&nbsp;';  
        								var \$txt = $('<span>' + defaultval + '</span>');
 									var \$input = $inputtext;
										
									\$txt.click(function(){
										if($(this).children().length < 1){
											\$input = $inputhtml;
											\$input.val(data.record.$key);	
											$(this).html(\$input);
											\$input.bind('change blur focusout',function(){
												$inputchange;
												data.record.$key = $(this).val();
												$.post('".$this->action['updateAction']."',{".$this->db->primary.":data.record.".$this->db->primary.",$key:$(this).val()});									
											});
											\$input.focus();
										}
									});	
										
									return \$txt;	
    								}";
						$this->fields[$key]["title"]=strtoupper($key);
						$this->fields[$key]["width"]="10%";
						$this->fields[$key]["list"]=false;
						$this->fields[$key.'txt'] = array("title"=>strtoupper($key),"edit"=>false,"create"=>false,"width"=>"10%","display"=>'');			
						$this->func[$key.'txt'] = array("display"=>$display);

						endif;			
						endif;					
					break;
					case 'date':
						$this->fields[$key] = array("title"=>strtoupper($key),"width"=>"10%","type"=>"date");
						if($this->editinline):
						if(!array_search($key,$this->exc)):
							$display = "function (data) {
										var defaultval = (data.record.$key) ? data.record.$key:'&nbsp;&nbsp;&nbsp;';  
        								var \$txt = $('<span>' + defaultval + '</span>');
									var \$input = $('<input type=\"text\" value=\"' + data.record.$key + '\"/>');
									\$input.datepicker({dateFormat:'yy-mm-dd'});	
									\$txt.click(function(){
										if(\$txt.children().length < 1){
											\$input = $('<input type=\"text\" value=\"' + $(this).html() + '\"/>');	
											\$input.datepicker({dateFormat:'yy-mm-dd',onClose: function(calDate) {
								            	\$txt.html($(this).val());
												$.post('".$this->action['updateAction']."',{".$this->db->primary.":data.record.".$this->db->primary.",$key:$(this).val()});						
											}});
											$(this).html(\$input);
											\$input.focus();
											
										}
									});	
									return \$txt;	
    								}";
						$this->fields[$key]["list"]=false;
						$this->fields[$key.'txt'] = array("title"=>strtoupper($key),"edit"=>false,"create"=>false,"width"=>"10%","display"=>'');			
						$this->func[$key.'txt'] = array("display"=>$display);
						endif;			
						endif;					
						
					break;
					case 'text':
							$this->fields[$key] = array("title"=>strtoupper($key),"width"=>"10%","type"=>"textarea");					
						if($this->editinline):
						if(!array_search($key,$this->exc)):
							$display = "function (data) {
										var defaultval = (data.record.$key) ? data.record.$key:'&nbsp;&nbsp;&nbsp;';  
        								var \$txt = $('<span>' + defaultval + '</span>');
									var \$input = $('<textarea>' + data.record.$key + '</textarea>');	
									\$txt.click(function(){
										if($(this).children().length < 1){
											\$input = $('<textarea>' + $(this).html() + '</textarea>');
											$(this).html(\$input);
											\$input.bind('change blur focusout',function(){
												\$txt.html($(this).val());
												$.post('".$this->action['updateAction']."',{".$this->db->primary.":data.record.".$this->db->primary.",$key:$(this).val()});															
											});
											\$input.focus();
										}
									});	
								
									return \$txt;	
    								}";
						$this->fields[$key] = array("title"=>strtoupper($key),"width"=>"10%","list"=>false);
						$this->fields[$key.'txt'] = array("title"=>strtoupper($key),"edit"=>false,"create"=>false,"width"=>"10%","display"=>'');			
						$this->func[$key.'txt'] = array("display"=>$display);
						endif;			
						endif;					
					break;
					case 'tinyint':
						$imgtrue = '<img src="../images/apply.png"></img>';
						$imgfalse = '<img src="../images/cross.png"></img>';
						$this->fields[$key] = array("title"=>strtoupper($key),"width"=>"10%","type"=>"checkbox",
						"values"=>array(0=>"False",1=>"True"),"list"=>false);	
						if(!array_search($key,$this->exc)):
						$display = "function (data) {
        								var \$img = (data.record.$key != 0) ? $('<img val=\"1\" style=\"cursor:pointer;\" title=\"click to uncheck\" src=\"../images/apply.png\"></img>') : $('<img val=\"0\" style=\"cursor:pointer;\" title=\"click to check\" src=\"../images/cross.png\"></img>');
									\$img.click(function(){
										if($(this).attr('val')=='0'){
											$(this).attr('title','click to uncheck');
											$(this).attr('val','1');
											$(this).attr('src','../images/apply.png');	
										}else{
											$(this).attr('title','click to check');
											$(this).attr('val','0');
											$(this).attr('src','../images/cross.png');	
										}
										$.post('".$this->action['updateAction']."',{".$this->db->primary.":data.record.".$this->db->primary.",$key:$(this).attr('val')});
									});	
									return \$img;	
    								}";
									
						$this->fields[$key.'img'] = array("title"=>strtoupper($key),"edit"=>false,"create"=>false,"width"=>"10%","display"=>'');			
						$this->func[$key.'img'] = array("display"=>$display);
						endif;										
					break;
				endswitch;
			endif;
		}
		if(count($this->exc)>=1):
			$this->doexclude();
		endif;
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
		$offset = JRequest::getVar('jtStartIndex',1);  
		$rows = JRequest::getVar('jtPageSize',10);
		$q = JRequest::getVar('q','');
		$sort = JRequest::getVar('jtSorting',$this->db->primary.' desc'); 
		$opt = JRequest::getVar('opt',$this->db->primary); 
		$where = "$opt like '%$q%'";  
		$q = "select count(*) FROM ".$this->table." where ".$where;
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
	function create(){
		$post =  JRequest::get('post');
		$jTableResult = array();
		$this->db->bind($post);
		$this->db->store();
		$post[$this->db->primary] = $this->db->lastId();
		$jTableResult['Record'] = $post;
		$jTableResult['Result'] = "OK";
		die(json_encode($jTableResult));						
	}
	function update(){
		$post =  JRequest::get('post');
		$this->db->bind($post);
		$this->db->store();
		$jTableResult = array();
		$jTableResult['Result'] = "OK";
		die(json_encode($jTableResult));			
	}
	function delete(){
		$post =  JRequest::get('post');
		$this->db->delete($post);
		$jTableResult = array();
		$jTableResult['Result'] = "OK";
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
	function exclude(){
	    $this->exc = func_get_args();
	}

	function doexclude(){
    	for ($i = 0; $i < count($this->exc); $i++) {
			$m = $this->exc[$i];
			unset($this->fields[$m]);	
    	}		
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
	function setTH($arr){
    	foreach ($arr as $key => $val) {
			$this->fields[$key]['title'] = $val;
    	}		
	}	
}
?>



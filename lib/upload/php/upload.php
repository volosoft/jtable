<?php
ini_set('error_reporting', E_ALL);
ini_set('display_errors', 1 );
if($_GET['action']== 'upload'){
    $fileName = $_FILES['FILE']['name'];
    $fileSize = $_REQUEST['MAX_FILE_SIZE'];
    $fileTypeDoc = $_REQUEST['TYPEDOC'];
    $fileType = $_FILES['FILE']['type'];
    $fileContent = file_get_contents($_FILES['FILE']['tmp_name']);
    $dataUrl = 'data:' . $fileType . ';base64,' . base64_encode($fileContent);

    if ($_FILES["FILE"]["size"] < $fileSize)
    {
        if ($_FILES["FILE"]["error"] > 0)
        {
            echo "Return Code: " . $_FILES["FILE"]["error"] . "<br />";
        }
        else
        {
            $dossier = $_SERVER['DOCUMENT_ROOT'].'/' . $_REQUEST['DIRECTORY'];

            $img_chemin = $dossier . "/" . $fileTypeDoc . $_FILES["FILE"]["name"];

            if (!is_dir($dossier))
            {
                mkdir($dossier);
            }

            move_uploaded_file($_FILES["FILE"]["tmp_name"], $img_chemin);
        }
    }
    else
    {
        echo "Invalid hiddenfile";
    }
    /*$json = json_encode(array(
        'name' => $fileName,
        'type' => $fileType,
        'dataUrl' => $dataUrl,
        'dossier' => $_REQUEST['DIRECTORY'],
        'typedoc' => $fileTypeDoc,
        'taille' => $_FILES["FILE"]["size"],
        'error' => $_FILES["FILE"]["error"]
    ));
    echo $json;*/
}elseif($_GET['action'] == 'delete'){
    $filename = $_SERVER['DOCUMENT_ROOT'].'/'.$_POST['filename'];
    if(file_exists($filename)){
        unlink((string)$filename);
    }
}



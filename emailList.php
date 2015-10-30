<?php
$values = array();
if(isset($_POST['email'])){ // email is required
	// check email again, just to validate
	$optional_vars = array('email','referrer','preference','info','date');

	foreach($optional_vars as $key){
		$valid = true;
		if(isset($_POST[$key])){
			switch($key){
				case 'email': // is email format
					if(filter_var($_POST[$key], FILTER_VALIDATE_EMAIL)){
						$values[$key] = filter_var($_POST[$key], FILTER_SANITIZE_EMAIL);
					}else{
						$valid = false;
					}
				break;

				case 'info': // is json
					if(is_string($_POST[$key])){
						$first_char = substr($_POST[$key], 0, 1);
						json_decode($_POST[$key]);
						if(json_last_error() == JSON_ERROR_NONE && !is_numeric($_POST[$key]) && ($first_char == '{' || $first_char == '[')){
							// is valid
							$values[$key] = $_POST[$key];
						}
					}
				break;

				case 'date': // is date format
					if((bool)strtotime($_POST[$key])){
						$values[$key] = date('d-m-y H:i:s',strtotime($_POST[$key]));
					}
				break;

				default:
					// default add
					$values[$key] = $_POST[$key];
				break;
			}
		}else if($key == 'referrer'){
			if(isset($_SERVER['HTTP_REFERER'])){
				$values['referrer'] = $_SERVER['HTTP_REFERER'];
			}
		}
	}	// for each optional param

	$values['ip'] = $_SERVER['REMOTE_ADDR'];
	// insert into database

	$mysqli = new mysqli("192.185.35.74", "pmphotog_emailer", "emailLister2015", "pmphotog_main");
	if ($mysqli->connect_errno) {
			echo "Failed to connect to MySQL: (" . $mysqli->connect_errno . ") " . $mysqli->connect_error;
	}

	$theQuery = "INSERT INTO `email_list` (";
	$theQuery2 = ") VALUES (";
	foreach($values as $col => $val){
		$theQuery .= $col . ', ';
		$theQuery2 .= "'" . $val . "', ";
	}
	$theQuery = substr($theQuery, 0, strlen($theQuery)-2) . substr($theQuery2, 0, strlen($theQuery2)-2) . ')';



	if (!$mysqli->query($theQuery)) {
			echo $theQuery . " Insert failed: (" . $mysqli->errno . ") " . $mysqli->error;
	}else{
		print'{"success":true}';
	}
}// email is set

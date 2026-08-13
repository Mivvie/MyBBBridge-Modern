<?php


$plugins->add_hook("index_start", "mbbbp_refresh_cache");


function mbbbp_info() {
	return array(
		"name" => "MyBBBridge+",
		"description" => "Helper plugin for the MyBBBridge+ Visual Studio Code extension.",
		"website" => "https://www.youtube.com/watch?v=SWkMYO9V_-k",
		"author" => "regiratior",
		"authorsite" => "https://www.youtube.com/watch?v=SWkMYO9V_-k",
		"version" => "0.4.3",
		"compatibility" => "*"
	);
}


function mbbbp_activate() {}


function mbbbp_deactivate() {}


function mbbbp_get_global_file_path() {
	$basePath = dirname(__FILE__);
	$candidatePlugin = $basePath . "/../../global.php";

	if(file_exists($candidatePlugin)) {
		return $candidatePlugin;
	}

	return "";
}


function mbbbp_sync_template_eval_line($name, $operation) {
	if(!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $name)) {
		return false;
	}

	$globalFile = mbbbp_get_global_file_path();
	if(empty($globalFile)) {
		return false;
	}

	$content = @file_get_contents($globalFile);
	if($content === false) {
		return false;
	}

	$commentAnchor = "// Set up some of the default templates";
	$commentPos = strpos($content, $commentAnchor);
	if($commentPos === false) {
		return false;
	}

	$blockStart = $commentPos + strlen($commentAnchor);
	$firstEvalPos = strpos($content, "eval('", $blockStart);
	if($firstEvalPos === false) {
		return false;
	}

	$line = 'eval(\'$'.$name.' = "\'.$templates->get(\''.$name.'\').\'";\');';


	if($operation === "add") {
		if(strpos($content, $line) !== false) {
			return true;
		}

		$lineWithNewline = $line . "\n";
		$content = substr($content, 0, $firstEvalPos) . $lineWithNewline . substr($content, $firstEvalPos);
	} else if($operation === "remove") {
		$lineWithNewline = $line . "\n";
		$content = str_replace($lineWithNewline, "", $content);
		$content = str_replace($line, "", $content);
	} else {
		return false;
	}

	return file_put_contents($globalFile, $content) !== false;
}


function mbbbp_refresh_cache() {
	global $mybb, $db;

	$action = isset($mybb->input['action']) ? trim((string)$mybb->input['action']) : '';
	
	if($action === 'mbbbp_sync_template_eval') {
		$name = isset($mybb->input['name']) ? trim((string)$mybb->input['name']) : '';
		$operation = isset($mybb->input['operation']) ? trim((string)$mybb->input['operation']) : '';

		if(empty($name) || empty($operation)) {
			http_response_code(400);
			exit;
		}

		if(!in_array($operation, array('add', 'remove'), true)) {
			http_response_code(400);
			exit;
		}

		if(!mbbbp_sync_template_eval_line($name, $operation)) {
			http_response_code(500);
			exit;
		}

		exit;
	}

	if($action !== 'mbbbp_refresh_cache')
		return;
	
	define("IN_MYBB", 1);
	define("NO_ONLINE", 1);
	
	require_once "./admin/inc/functions_themes.php";
	
	$tid = intval($mybb->input['tid'] ?? 0);
	$name = isset($mybb->input['name']) ? (string)$mybb->input['name'] : '';
	
	if(empty($tid) || empty($name))
		exit;
	
	$name = $db->escape_string($name);
	
	$content = $db->fetch_array($db->simple_select(
		"themestylesheets",
		"stylesheet",
		"tid='{$tid}' AND name='{$name}'",
		array("limit" => 1)
	))["stylesheet"];
	
	cache_stylesheet($tid, $name, $content);
	update_theme_stylesheet_list($tid);
	
	exit;
}


?>

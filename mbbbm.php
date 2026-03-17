<?php

define("IN_MYBB", 1);
define("NO_ONLINE", 1);
define('THIS_SCRIPT', 'mbbbm.php');

require_once "./inc/init.php";
require_once "./admin/inc/functions_themes.php";


$tid = intval($mybb->input['tid']);
$name = $mybb->input['name'];


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


?>

<?php

if (!defined("IN_MYBB")) {
    die("Direct initialization of this file is not allowed.");
}

$plugins->add_hook("global_start", "mbbbm_load_templates");

function mbbbm_info()
{
    return array(
        "name"          => "MyBBBridge Modern",
        "description"   => "Hooks into MyBB's template loading to ensure custom templates added via the MyBBBridge Modern VS Code extension are loaded correctly.",
        "website"       => "https://github.com/Mivvie/MyBBBridge-Modern",
        "author"        => "Mivvie",
        "authorsite"    => "https://github.com/Mivvie",
        "version"       => "0.1.3",
        "guid"          => "",
        "compatibility" => "18*"
    );
}

// This plugin works purely through the global_start hook and requires no
// additional setup on activation or deactivation.
function mbbbm_activate() {}

function mbbbm_deactivate() {}

/**
 * Appends the names of any custom templates (those belonging to the current
 * theme's template set but absent from the global default set) to
 * $templatelist so that MyBB's template cache picks them up.
 */
function mbbbm_load_templates()
{
    global $templatelist, $mybb, $db;

    $sid = isset($mybb->theme['templateset']) ? (int)$mybb->theme['templateset'] : -2;

    if ($sid <= 0) {
        return;
    }

    // $sid is cast to int above, making the concatenation safe.
    $query = $db->query("
        SELECT title
        FROM " . TABLE_PREFIX . "templates
        WHERE sid = " . $sid . "
        AND title NOT IN (
            SELECT title FROM " . TABLE_PREFIX . "templates WHERE sid = -2
        )
    ");

    $extraTemplates = array();
    while ($row = $db->fetch_array($query)) {
        $extraTemplates[] = $row['title'];
    }

    if (!empty($extraTemplates)) {
        if (!empty($templatelist)) {
            $templatelist .= ',' . implode(',', $extraTemplates);
        } else {
            $templatelist = implode(',', $extraTemplates);
        }
    }
}

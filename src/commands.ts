import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import path = require('path');

import { MyBBTemplateSet, MyBBStylesheets } from "./MyBBThemes";
import { getWorkspacePath, makePath, getConfig, getConnection } from './utils';


export async function createConfig() {
    const workspacePath = getWorkspacePath();
    

    let configFilePath = path.join(workspacePath, '.vscode');
    try {
        await fs.mkdir(configFilePath);
    } catch (err) {
        if (err instanceof Error && (err as NodeJS.ErrnoException).code !== 'EEXIST') {
            throw err;
        } else {
            console.log(err);
        }
    }


    configFilePath = path.join(configFilePath, 'mbbbm.json');
    try {
        await fs.access(configFilePath);
    } catch (err) {
        if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
            const defaultConf = JSON.stringify({
                "database": {
                    "host": "127.0.0.1",
                    "port": 3306,
                    "database": "mybb",
                    "prefix": "mybb_",
                    "user": "database_user",
                    "password": "database_password"
                },
                "mybbVersion": 1839,
                "mybbUrl": "http://127.0.0.1",
                "vscnotifications": true
            }, null, 4);

            await fs.writeFile(configFilePath, defaultConf);

            
            vscode.window.showInformationMessage(`Config file ${configFilePath} created sucessfully.`);
            return;
        }
        throw err;
    }

    vscode.window.showErrorMessage(`Config file ${configFilePath} already exists!`);
}


export async function addTheme() {
    const config = await getConfig();
    const connection = getConnection(config.database);

    const themeName = await vscode.window.showInputBox({ placeHolder: "Theme name (make sure both your template set and styles share the same name)" });
    if (themeName === undefined) {
        return;
    }
    const themePath = path.join(getWorkspacePath(), "Themes", themeName);
    await makePath(themePath);

    
    const templateSet = new MyBBTemplateSet(themeName, connection, config.database.prefix);
    const stylesheets = new MyBBStylesheets(themeName, connection, config.database.prefix);


    const templates = await templateSet.getElements();
    const templatesPath = path.join(getWorkspacePath(), `Themes/${themeName}/Templates`);
    await makePath(templatesPath);

    templates.forEach(async (template: any) => {
        let templatePath = path.join(templatesPath, template.title + ".html");
        await fs.writeFile(templatePath, template.template);
    })

    
    const styles = await stylesheets.getElements();
    const stylesPath = path.join(getWorkspacePath(), `Themes/${themeName}/Stylesheets`);
    await makePath(stylesPath);

    styles.forEach(async (style: any) => {
        let stylePath = path.join(stylesPath, style.name);
        await fs.writeFile(stylePath, style.stylesheet);
    })


    if (config.vscnotifications) {
        vscode.window.showInformationMessage(`${templates.length} templates and ${styles.length} stylesheets loaded.`)
    }
}

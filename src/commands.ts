import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import path = require('path');

import { MyBBTemplateSet, MyBBStylesheets } from "./MyBBThemes";
import { getWorkspacePath, makePath, getConfig, getConnection,
    findHtmlFiles, normalizeHtmlIndentation, closeConnection } from './utils';


export async function setUp() {
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
                "mybbUrl": "http://localhost",
                "vscnotifications": true
            }, null, 4);

            await fs.writeFile(configFilePath, defaultConf);

            
            vscode.window.setStatusBarMessage(`Configuration file ${configFilePath} created sucessfully.`, 5000);
            return;
        }
        throw err;
    }

    vscode.window.showErrorMessage(`Configuration file ${configFilePath} already exists!`);
}


export async function addTheme() {
    const config = await getConfig();
    const connection = getConnection(config.database);

    try {
        const themeName = await vscode.window.showInputBox({ placeHolder: "Theme name (ensure both your template set and styles share the same name)" });
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
            vscode.window.setStatusBarMessage(`${templates.length} templates and ${styles.length} stylesheets loaded.`, 5000);
        }
    } finally {
        await closeConnection(connection);
    }
}


export async function fixTemplateIndentation() {
    const config = await getConfig();
    const connection = getConnection(config.database);


    try {
        const themeName = await vscode.window.showInputBox({ placeHolder: "Theme name (ensure both your template set and styles share the same name)" });
        if (themeName === undefined) {
            return;
        }
        const templateSet = new MyBBTemplateSet(themeName, connection, config.database.prefix);

        const templatesPath = path.join(getWorkspacePath(), `Themes/${themeName}/Templates`);
        await templateSet.getElements();

        let htmlFiles: string[] = [];
        try {
            htmlFiles = await findHtmlFiles(templatesPath);
        } catch (err) {
            vscode.window.showErrorMessage(`Unable to read templates path: ${templatesPath}`);
            throw err;
        }

        let changedFileCount = 0;
        for (const htmlFilePath of htmlFiles) {
            const fileUri = vscode.Uri.file(htmlFilePath);
            const document = await vscode.workspace.openTextDocument(fileUri);
            const currentContent = document.getText();
            const formattedContent = normalizeHtmlIndentation(currentContent);

            if (formattedContent !== currentContent) {
                const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(currentContent.length));
                const edit = new vscode.WorkspaceEdit();
                edit.replace(fileUri, fullRange, formattedContent);

                const applied = await vscode.workspace.applyEdit(edit);
                if (!applied) {
                    throw new Error(`Failed to apply indentation edits to ${htmlFilePath}`);
                }

                await document.save();
                changedFileCount += 1;
            }
        }

        if (config.vscnotifications) {
            vscode.window.setStatusBarMessage(`Template indentation fixed in ${changedFileCount} HTML file(s).`, 5000);
        }
    } catch (err) {
        if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
            vscode.window.showErrorMessage(`Theme not found locally. Use 'MyBBBridge Modern: Add theme from database.' command to import.`);
            return;
        }
        throw err;
    } finally {
        await closeConnection(connection);
    }
}
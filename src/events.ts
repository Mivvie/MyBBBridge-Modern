import * as vscode from 'vscode';
import path = require('path');

import { MyBBTemplateSet, MyBBStylesheets } from "./MyBBThemes";
import { getWorkspacePath, getConfig, getConnection, closeConnection } from './utils';


export async function onSaveEvent(document: vscode.TextDocument) {
    const config = await getConfig();

    const docPath = document.uri.fsPath;
    const parent1Path = path.dirname(docPath);
    const parent2Path = path.dirname(parent1Path);
    const parent3Path = path.dirname(parent2Path);
    const parent4Path = path.dirname(parent3Path);

    if (parent4Path === getWorkspacePath()) {
        const ext = path.extname(docPath);
        const parent1Dir = path.basename(parent1Path);
        const parent2Dir = path.basename(parent2Path);
        const parent3Dir = path.basename(parent3Path);

        if (parent3Dir === 'Themes') {
            const con = getConnection(config.database);
            try {
                if (parent1Dir === 'Templates' && ext === '.html') {
                    const templateSet = new MyBBTemplateSet(parent2Dir, con, config.database.prefix);
                    const fileName = path.basename(docPath, ext);
                    await templateSet.saveElement(fileName, document.getText(), config.mybbVersion);

                } else if (parent1Dir === 'Stylesheets' && ext === '.css') {
                    const style = new MyBBStylesheets(parent2Dir, con, config.database.prefix);
                    const fileName = path.basename(docPath);
                    await style.saveElement(fileName, document.getText());
                }
            } finally {
                await closeConnection(con);
            }
        }
    }
    
}


/*
*
* From https://code.visualstudio.com/api/references/vscode-api
* 
* Note 1: This event is triggered by user gestures, like deleting a file from the explorer,
* or from the workspace.applyEdit-api, but this event is not fired when files change on disk,
* e.g triggered by another application, or when using the workspace.fs-api.
* 
*/
export async function onDeleteEvent(event: vscode.FileDeleteEvent) {
    const config = await getConfig();

    for (const uri of event.files) {
        
        const docPath = uri.fsPath
        const parent1Path = path.dirname(docPath);
        const parent2Path = path.dirname(parent1Path);
        const parent3Path = path.dirname(parent2Path);
        const parent4Path = path.dirname(parent3Path);

        if (parent4Path === getWorkspacePath()) {
            const ext = path.extname(docPath);
            const parent1Dir = path.basename(parent1Path);
            const parent2Dir = path.basename(parent2Path);
            const parent3Dir = path.basename(parent3Path);

            if (parent3Dir === 'Themes') {
                const con = getConnection(config.database);
                try {
                    if (parent1Dir === 'Templates' && ext === '.html') {
                        const templateSet = new MyBBTemplateSet(parent2Dir, con, config.database.prefix);
                        const fileName = path.basename(docPath, ext);
                        await templateSet.deleteElement(fileName);

                    } else if (parent1Dir === 'Stylesheets' && ext === '.css') {
                        const style = new MyBBStylesheets(parent2Dir, con, config.database.prefix);
                        const fileName = path.basename(docPath);
                        await style.deleteElement(fileName);
                    }
                } finally {
                    await closeConnection(con);
                }
            }
        }

    }
}
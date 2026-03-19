import * as vscode from 'vscode';
import * as mysql from 'mysql';
import { promises as fs, PathLike } from 'fs';
import path = require('path');


export function timestamp(): number {
    return Math.floor(Date.now() / 1000);
}


export function getWorkspacePath(): string {
    if (vscode.workspace.workspaceFolders) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath;
    } else {
        vscode.window.showErrorMessage("No workspace opened!");
    }
    return '';
}


export async function makePath(path: PathLike): Promise<void> {
    try {
        await fs.mkdir(path, { 'recursive': true });
    } catch (err) {
        if (err instanceof Error && (err as NodeJS.ErrnoException).code !== 'EEXIST') {
            throw err;
        }
        else {
            console.log(err);
        }
    }
}


export function urlJoin(urlParts: string[]): string {
    return urlParts
        .map(part => {
            const part2 = part.endsWith('/') ? part.substring(0, part.length - 1) : part;
            return part2.startsWith('/') ? part2.slice(1) : part2;
        })
        .join('/');
}


export async function getConfig(): Promise<any> {
    const configFilePath = path.join(getWorkspacePath(), '.vscode', 'mbbbm.json');
    let configFile: Buffer;
    try {
        configFile = await fs.readFile(configFilePath);
    } catch (err) {
        if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
            vscode.window.showErrorMessage('Configuration file not found! Try using the "Set up" command.');
            return;
        }
        throw err;
    }
    return JSON.parse(configFile.toString());
}


export function getConnection(dbConfig: any): mysql.Connection {
    return mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        password: dbConfig.password
    });
}
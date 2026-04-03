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


export function closeConnection(connection: mysql.Connection): Promise<void> {
    return new Promise((resolve, reject) => {
        connection.end((err) => {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}


const htmlVoidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
]);
function getTagName(token: string): string {
    const content = token.replace(/^<\/?\s*/, '').replace(/\s.*$/, '').replace(/>$/, '').trim();
    return content.toLowerCase();
}
function isClosingTag(token: string): boolean {
    return /^<\//.test(token.trim());
}
function isSelfClosingTag(token: string): boolean {
    const trimmed = token.trim();
    if (/\/>$/.test(trimmed)) {
        return true;
    }

    const tagName = getTagName(trimmed);
    return htmlVoidTags.has(tagName) || /^<!doctype/i.test(trimmed);
}
export function normalizeHtmlIndentation(content: string, indentUnit = '    '): string {
    const tokenRegex = /(<!--[\s\S]*?-->|<[^>]+>)/g;
    const tokens = content.replace(/\r\n/g, '\n').split(tokenRegex);
    const lines: string[] = [];
    let indentLevel = 0;

    for (const part of tokens) {
        if (!part || !part.trim()) {
            continue;
        }

        const token = part.trim();

        if (/^<!--/.test(token)) {
            lines.push(indentUnit.repeat(indentLevel) + token);
            continue;
        }

        if (/^<[^>]+>$/.test(token)) {
            if (isClosingTag(token)) {
                indentLevel = Math.max(indentLevel - 1, 0);
            }

            lines.push(indentUnit.repeat(indentLevel) + token);

            if (!isClosingTag(token) && !isSelfClosingTag(token)) {
                indentLevel += 1;
            }
            continue;
        }

        const textLines = token.split('\n');
        for (const textLine of textLines) {
            const trimmedText = textLine.trim();
            if (!trimmedText) {
                continue;
            }
            lines.push(indentUnit.repeat(indentLevel) + trimmedText);
        }
    }

    return lines.join('\n') + '\n';
}


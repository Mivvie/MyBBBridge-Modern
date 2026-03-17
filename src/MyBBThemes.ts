import * as vscode from 'vscode';
import * as mysql from 'mysql';
import * as request from 'request-promise-native';

import { timestamp, urlJoin, getConfig } from './utils';


abstract class MyBBSet {
    name: string;
    con: mysql.Connection;
    prefix: string;

    public constructor(name:string, con: mysql.Connection, prefix: string='mybb_') {
        this.name = name;
        this.con = con;
        this.prefix = prefix;
    }

    public getTable(name:string): string {
        return this.prefix + name;
    }

    public query(req: string, params: any[], callback: any=()=>{}): any {
        return new Promise((resolve, reject) => {
            this.con.query(req, params, (err: any, result: any) => {
                if (err) {
                    vscode.window.showErrorMessage(err.message);
                    return reject(err);
                }
                callback(err, result);
                return resolve(result);
            });
        });
    }
}


export class MyBBTemplateSet extends MyBBSet {
    sid: number|undefined;


    private async getSid(): Promise<number|undefined> {
        const result = await this.query(
            'SELECT sid FROM ?? WHERE title=?',
            [this.getTable('templatesets'), this.name],
            (err: any, result: any) => {
                if (!result.length) {
                    vscode.window.showErrorMessage(`Can't find template ${this.name}!`);
                }
            }
        );
        this.sid = result[0].sid;
        return this.sid;
    }

    private async addMissingGlobals() {
        await this.getSid();
        const config = await getConfig();

        await this.query(
            `
            INSERT INTO mybb_templates (title, template, sid, version, dateline)
            SELECT title, template, ${this.sid}, version, UNIX_TIMESTAMP()
            FROM mybb_templates
            WHERE sid = -2
            AND title NOT IN (
                SELECT title FROM mybb_templates WHERE sid = ${this.sid}
            );
            `,
            [],
            (err: any, result: any) => {
                if (err) {
                    vscode.window.showErrorMessage(err);
                } else {
                    if (config.vscnotifications) {
                        vscode.window.showInformationMessage(result);
                    }
                }
            }
        );
    }

    public async getElements(): Promise<any> {
        await this.getSid();
        await this.addMissingGlobals();
        const templates = await this.query(
            'SELECT title, template FROM ?? WHERE sid=? ORDER BY sid DESC, title ASC',
            [this.getTable('templates'), this.sid],
            (err: any, result: any) => {
                if (!result.length) {
                    vscode.window.showErrorMessage(`No template files found for template ${this.name}!`);
                } 
            }
        );
        return templates;
    }

    public async saveElement(name: string, content: string, version: number) {
        await this.getSid();
        const config = await getConfig();

        const result = await this.query(
            'SELECT tid FROM ?? WHERE title=? AND sid=?',
            [this.getTable('templates'), name, this.sid],
        );


        if (!result.length) {
            this.query(
                'INSERT INTO ?? SET title=?, template=?, sid=?, version=?',
                [this.getTable('templates'), name, content, this.sid, version],
                (err: any, result: any) => {
                    if (!err) {
                        if (config.vscnotifications) {
                            vscode.window.showInformationMessage(`Uploaded new template "${name}" to database.`);
                        }
                    }
                }
            );
        } else {
            this.query(
                'UPDATE ?? SET template=? WHERE title=? AND sid=?',
                [this.getTable('templates'), content, name, this.sid],
                (err: any, result: any) => {
                    if (!err) {
                        if (config.vscnotifications) {
                            vscode.window.showInformationMessage(`Updated template: ${name}.html`);
                        }
                    }
                }
            );
        }
    }


}


export class MyBBStylesheets extends MyBBSet {
    tid: number|undefined;

    private async getTid() {
        const result = await this.query(
            'SELECT tid FROM ?? WHERE name=?',
            [this.getTable('themes'), this.name],
            (err: any, result: any) => {
                if (!result.length) {
                    vscode.window.showErrorMessage(`Can't find theme ${this.name}!`);
                }
            }
        );
        this.tid = result[0].tid;
        return this.tid;
    }

    private async addMissingGlobals() {
        await this.getTid();
        const config = await getConfig();

        await this.query(
            `
            INSERT INTO mybb_themestylesheets (name, tid, attachedto, stylesheet, lastmodified)
            SELECT name, ${this.tid}, attachedto, stylesheet, UNIX_TIMESTAMP()
            FROM mybb_themestylesheets
            WHERE tid = 1
            AND name NOT IN (
                SELECT name FROM mybb_themestylesheets WHERE tid = ${this.tid}
            );
            `,
            [],
            (err: any, result: any) => {
                if (err) {
                    vscode.window.showErrorMessage(err);
                } else {
                    if (config.vscnotifications) {
                        vscode.window.showInformationMessage(result);
                    }
                }
            }
        );
    }

    public async getElements() {
        await this.getTid();
        await this.addMissingGlobals();

        const stylesheets = await this.query(
            'SELECT name, stylesheet FROM ?? WHERE tid=? ORDER BY tid DESC, name ASC',
            [this.getTable('themestylesheets'), this.tid],
            (err: any, result: any) => {
                if (!result.length) {
                    vscode.window.showErrorMessage(`No stylesheets files found for theme ${this.name}!`);
                } 
            }
        );
        return stylesheets;
    }

    public async saveElement(name: string, content: string) {
        await this.getTid();
        const config = await getConfig();


        const result = await this.query(
            'SELECT sid FROM ?? WHERE name=? AND tid=?',
            [this.getTable('themestylesheets'), name, this.tid],
        );


        // TODO
        if (!result.length) {
            this.query(
                'INSERT INTO ?? SET name=?, stylesheet=?, tid=?, lastmodified=?',
                [this.getTable('themestylesheets'), name, content, this.tid, timestamp()],
                (err: any, result: any) => {
                    if (!err) {
                        if (config.vscnotifications) {
                            vscode.window.showInformationMessage(`Uploaded new stylesheet "${name}" to database.`);
                        }
                        this.requestCacheRefresh(name);
                    }
                }
            );
        //
        } else {
            this.query(
                'UPDATE ?? SET stylesheet=?, lastmodified=? WHERE name=? AND tid=?', // attached to?
                [this.getTable('themestylesheets'), content, timestamp(), name, this.tid],
                (err: any, result: any) => {
                    if (!err) {
                        if (config.vscnotifications) {
                            vscode.window.showInformationMessage(`Updated stylesheet: ${name}`);
                        }
                        this.requestCacheRefresh(name);
                    }
                }
            );
        }
    }

    public async requestCacheRefresh(name: string): Promise<void> {
        await this.getTid();
        const config = await getConfig();

        if (config.mybbUrl) {
            const scriptUrl = urlJoin([config.mybbUrl, 'mbbbm.php']);

            await request.get({
                uri: scriptUrl,
                qs: {
                    tid: this.tid,
                    name: name
                }
            })
            .catch(err => {
                vscode.window.showErrorMessage("Failed to request stylesheet cache refresh: " + err);
                throw err;
            });
        }
    }
}
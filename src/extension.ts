import * as vscode from 'vscode';

import { setUp, addTheme, fixTemplateIndentation } from "./commands";
import { onSaveEvent, onDeleteEvent } from "./events";


export async function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.setUp', setUp)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.addTheme', addTheme)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.fixTemplateIndentation', fixTemplateIndentation)
	);
	

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(onSaveEvent)
	);

	context.subscriptions.push(
		vscode.workspace.onDidDeleteFiles(onDeleteEvent)
	)
}


export function deactivate() {}

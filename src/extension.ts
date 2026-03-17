import * as vscode from 'vscode';

import { createConfig, addTheme } from "./commands";
import { onSaveEvent } from "./events";


export async function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.createConfig', createConfig)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.addTheme', addTheme)
	);
	

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(onSaveEvent)
	);
}


export function deactivate() {}

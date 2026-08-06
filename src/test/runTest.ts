import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');


		const launchArgs = [
			'--disable-gpu',
			'--disable-gpu-compositing',
			'--no-sandbox',
			'--disable-dev-shm-usage',
			'--disable-features=RendererCodeIntegrity',
			'--user-data-dir',
			path.resolve(__dirname, '../../.vscode-test/user-data'),

			'--extensions-dir',
			path.resolve(__dirname, '../../.vscode-test/extensions')
		];

		await runTests({ version: '1.71.0', extensionDevelopmentPath, extensionTestsPath, launchArgs });
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();

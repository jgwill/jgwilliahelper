// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var openAI = require('openai');
var MarkdownIt = require('markdown-it');
const dotenv = require('dotenv');
const path = require('path');
var engine = "davinci-002";

//const openAI = await import("openai");
const OpenAI = openAI.OpenAI;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "jgwilliahelper" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let generatedHelperCommand = generateHelperCommand();
	let generatedOnSelectionHelperCommand = generateOnSelectionHelperCommand();

	context.subscriptions.push(generatedHelperCommand);
	context.subscriptions.push(generatedOnSelectionHelperCommand);

}


function generateHelperCommand() {
	let disposable = vscode.commands.registerCommand('jgwilliahelper.jgwilliahelper', () => {
		vscode.window.showInputBox({
			placeHolder: "Write your search text"
		}).then((input) => {
			search(input);
		});
	});
	return disposable;
}

function generateOnSelectionHelperCommand() {
	let disposable = vscode.commands.registerCommand('jgwilliahelper.openaisearchselection', () => {
		const input = vscode.window.activeTextEditor.selection
		search(vscode.window.activeTextEditor.document.getText(input));
	});
	return disposable;
}


function search(input) {
	const config = vscode.workspace.getConfiguration('jgwilliahelper');
	if (!validate(config)) return;
	if (input) {
		let disposableStatusMessage = vscode.window.setStatusBarMessage("Loading result...");
		// let disposableStatusMessage = vscode.window.setStatusBarMessaConfigurationge("Loading result...");
		//test.dispose()
		const openai = generateOpenAI(config);
		genereateResponse(input, openai, disposableStatusMessage);
	}
}

function validate(config) {
	if (!config.apikey) {
		vscode.window.showErrorMessage("No Open AI key provided in settings.")
		return false;
	}
	return true;
}

function generateOpenAI(config) {
	// const configuration = new OpenAI({
	// 	apiKey: config.apikey,
	// });
	engine = config.engine; //define the engine globally from the settings
	const openai = new OpenAI({ apiKey: config.apikey});
	return openai;
}

function genereateResponse(input, openAI, disposableStatusMessage) {
	// Load .env file from $HOME
	const envPath = path.join(process.env.HOME, '.env');
	dotenv.config({ path: envPath });

	let modelname = engine; //gpt-4-1106-preview  (128k)
	
//davinci-002
	// Check if JGWILLHELPER_MODEL variable exists in .env
	if (process.env.JGWILLHELPER_MODEL) {
		modelname = process.env.JGWILLHELPER_MODEL;
	}

	// Rest of the code...
	// var modelname = "text-davinci-003";
	openAI.createCompletion({
		model: modelname,
		prompt: input,
		temperature: 0.3,
		max_tokens: 4096,
		top_p: 1,
		frequency_penalty: 0,
		presence_penalty: 0,
	}).then((response) => {
		displayResult(response);
		disposableStatusMessage.dispose();
	}).catch((error) => {
		vscode.window.showErrorMessage(error.response.data.error.message);
		disposableStatusMessage.dispose();
	});
}

function displayResult(openAIResponse) {
	let panel = vscode.window.createWebviewPanel('webview', 
												'AI Result', 
												{ preserveFocus: true, viewColumn: vscode.ViewColumn.One});
	const md = new MarkdownIt();
	const result = md.render('```\n'  + (openAIResponse.data.choices[0].text || "Nothing found") + '\n```' );
	panel.webview.html = result;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
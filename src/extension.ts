import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Obfuscator extension is activated');

    // Use extensionPath to create a URI for the extension folder.
    const extensionUri = vscode.Uri.file(context.extensionPath);
    
    let disposable = vscode.commands.registerCommand('extension.openObfuscatorUI', () => {
        ObfuscatorPanel.createOrShow(extensionUri);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

class ObfuscatorPanel {
    public static currentPanel: ObfuscatorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (ObfuscatorPanel.currentPanel) {
            ObfuscatorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'obfuscator',
            'Code Obfuscator',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                // Construct localResourceRoots using Node's path.join
                localResourceRoots: [vscode.Uri.file(path.join(extensionUri.fsPath, 'media'))]
            }
        );

        ObfuscatorPanel.currentPanel = new ObfuscatorPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'obfuscate':
                        await this.processFiles(3); // shift +3 for obfuscation
                        this._panel.webview.postMessage({ command: 'status', text: 'Obfuscation complete' });
                        return;
                    case 'deobfuscate':
                        await this.processFiles(-3); // shift -3 for deobfuscation
                        this._panel.webview.postMessage({ command: 'status', text: 'Deobfuscation complete' });
                        return;
                }
            },
            undefined,
            this._disposables
        );

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        ObfuscatorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Code Obfuscator</title>
        </head>
        <body style="font-family: Verdana, sans-serif; background-color: #333; color: white; text-align: center;">
            <h1>Code Obfuscator</h1>
            <button onclick="obfuscate()" style="margin: 10px; padding: 10px;">Obfuscate</button>
            <button onclick="deobfuscate()" style="margin: 10px; padding: 10px;">Deobfuscate</button>
            <p id="status"></p>
            <script>
                const vscode = acquireVsCodeApi();
                function obfuscate() {
                    vscode.postMessage({ command: 'obfuscate' });
                }
                function deobfuscate() {
                    vscode.postMessage({ command: 'deobfuscate' });
                }
                window.addEventListener('message', event => {
                    const message = event.data;
                    if(message.command === 'status') {
                        document.getElementById('status').textContent = message.text;
                    }
                });
            </script>
        </body>
        </html>
        `;
    }

    private async processFiles(shift: number): Promise<void> {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const fileExtensions = ['.py', '.js', '.ts', '.java', '.cpp', '.c', '.html', '.css'];
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');

        for (const file of files) {
            const filePath = file.fsPath;
            if (fileExtensions.includes(path.extname(filePath))) {
                try {
                    let content = fs.readFileSync(filePath, 'utf8');
                    let transformed = caesarCipher(content, shift);
                    fs.writeFileSync(filePath, transformed, 'utf8');
                } catch (err) {
                    console.error(`Error processing file ${filePath}:`, err);
                }
            }
        }
    }
}

function caesarCipher(text: string, shift: number): string {
    return text.split('').map(char => {
        if (char >= 'a' && char <= 'z') {
            let code = char.charCodeAt(0) - 97;
            code = (code + shift + 26) % 26;
            return String.fromCharCode(code + 97);
        } else if (char >= 'A' && char <= 'Z') {
            let code = char.charCodeAt(0) - 65;
            code = (code + shift + 26) % 26;
            return String.fromCharCode(code + 65);
        } else {
            return char;
        }
    }).join('');
}

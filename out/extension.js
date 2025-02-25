"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
// Attempt to load the Gemini library if installed
let GoogleGenerativeAI;
try {
    GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
}
catch (err) {
    console.warn('Warning: @google/generative-ai not installed. Auto-config will not work.');
}
/* ---------------------------
   Enigma Classes (Unchanged)
----------------------------*/
class Keyboard {
    forward(letter) {
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(letter);
    }
    backward(signal) {
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(signal);
    }
}
class Plugboard {
    constructor(pairsStr) {
        this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        this.right = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        let pairs = pairsStr.trim().split(" ");
        for (let pair of pairs) {
            if (pair.length >= 2) {
                let A = pair[0].toUpperCase();
                let B = pair[1].toUpperCase();
                let idxA = this.left.indexOf(A);
                let idxB = this.left.indexOf(B);
                if (idxA !== -1 && idxB !== -1) {
                    [this.left[idxA], this.left[idxB]] = [this.left[idxB], this.left[idxA]];
                }
            }
        }
    }
    forward(signal) {
        let letter = this.right[signal];
        return this.left.indexOf(letter);
    }
    backward(signal) {
        let letter = this.left[signal];
        return this.right.indexOf(letter);
    }
}
class Rotor {
    constructor(wiring, notch) {
        this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        this.right = wiring.split('');
        this.notch = notch;
    }
    forward(signal) {
        let letter = this.right[signal];
        return this.left.indexOf(letter);
    }
    backward(signal) {
        let letter = this.left[signal];
        return this.right.indexOf(letter);
    }
    rotate(n = 1, forward = true) {
        for (let i = 0; i < n; i++) {
            if (forward) {
                this.left.push(this.left.shift());
                this.right.push(this.right.shift());
            }
            else {
                this.left.unshift(this.left.pop());
                this.right.unshift(this.right.pop());
            }
        }
    }
    rotateToLetter(letter) {
        let n = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(letter);
        this.rotate(n);
    }
    setRing(n) {
        this.rotate(n - 1, false);
        let nNotch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(this.notch);
        this.notch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt((nNotch - n + 1 + 26) % 26);
    }
}
class Reflector {
    constructor(wiring) {
        this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        this.right = wiring.split('');
    }
    reflect(signal) {
        let letter = this.right[signal];
        return this.left.indexOf(letter);
    }
}
class Enigma {
    constructor(reflector, r1, r2, r3, plugboard, keyboard) {
        this.re = reflector;
        this.r1 = r1;
        this.r2 = r2;
        this.r3 = r3;
        this.pb = plugboard;
        this.kb = keyboard;
    }
    setRings(rings) {
        this.r1.setRing(rings[0]);
        this.r2.setRing(rings[1]);
        this.r3.setRing(rings[2]);
    }
    setKey(key) {
        this.r1.rotateToLetter(key.charAt(0).toUpperCase());
        this.r2.rotateToLetter(key.charAt(1).toUpperCase());
        this.r3.rotateToLetter(key.charAt(2).toUpperCase());
    }
    encipher(letter) {
        this.r3.rotate();
        let signal = this.kb.forward(letter);
        let path = [signal];
        signal = this.pb.forward(signal);
        path.push(signal);
        signal = this.r3.forward(signal);
        path.push(signal);
        signal = this.r2.forward(signal);
        path.push(signal);
        signal = this.r1.forward(signal);
        path.push(signal);
        signal = this.re.reflect(signal);
        path.push(signal);
        signal = this.r1.backward(signal);
        path.push(signal);
        signal = this.r2.backward(signal);
        path.push(signal);
        signal = this.r3.backward(signal);
        path.push(signal);
        signal = this.pb.backward(signal);
        path.push(signal);
        let outputLetter = this.kb.backward(signal);
        return { path, letter: outputLetter };
    }
}
/* -------------------------------
   Processing Files With Enigma
------------------------------- */
function processFilesUsingEnigma(config, obfuscate) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        // List of supported file types
        const fileExtensions = ['.py', '.js', '.ts', '.java', '.cpp', '.c', '.html', '.css'];
        const files = yield vscode.workspace.findFiles('**/*', '**/node_modules/**');
        for (const file of files) {
            const filePath = file.fsPath;
            if (fileExtensions.includes(path.extname(filePath))) {
                try {
                    let content = fs.readFileSync(filePath, 'utf8');
                    let transformed = enigmaObfuscate(content, config, obfuscate);
                    fs.writeFileSync(filePath, transformed, 'utf8');
                }
                catch (err) {
                    console.error(`Error processing file ${filePath}:`, err);
                }
            }
        }
    });
}
function enigmaObfuscate(text, config, obfuscate) {
    const rotorWirings = {
        "I": "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
        "II": "AJDKSIRUXBLHWTMCQGZNPYFVOE",
        "III": "BDFHJLCPRTXVZNYEIWGAKMUSQO",
        "IV": "ESOVPZJAYQUIRHXLNFTGKDCMWB",
        "V": "VZBRGITYUPSDNHLXAWMJQOFECK"
    };
    const reflectorWirings = {
        "A": "EJMZALYXVBWFCRQUONTSPIKHGD",
        "B": "YRUHQSLDPXNGOKMIEBFZCWVJAT",
        "C": "FVPJIAOYEDRZXWGCTKUQSBNMHL"
    };
    const rotorNames = config.rotors.split("-");
    const r1 = new Rotor(rotorWirings[rotorNames[0]], "Q");
    const r2 = new Rotor(rotorWirings[rotorNames[1]], "E");
    const r3 = new Rotor(rotorWirings[rotorNames[2]], "V");
    const reflector = new Reflector(reflectorWirings[config.reflector]);
    const plugboard = new Plugboard(config.plugboard);
    const keyboard = new Keyboard();
    const enigma = new Enigma(reflector, r1, r2, r3, plugboard, keyboard);
    enigma.setRings(config.rings.split('').map((c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c) + 1));
    enigma.setKey(config.rotorStart);
    let transformed = '';
    for (const char of text) {
        if (/[A-Za-z]/.test(char)) {
            const result = enigma.encipher(char.toUpperCase());
            let newChar = result.letter;
            if (char === char.toLowerCase()) {
                newChar = newChar.toLowerCase();
            }
            transformed += newChar;
        }
        else {
            transformed += char;
        }
    }
    return transformed;
}
/* -------------------------------
   Gemini + JSON Sanitizing
------------------------------- */
const geminiPrompt = `
Generate a random secure Enigma configuration in JSON format only.
No extra text, no code fences. Must have:
{
  "rotors": "I-II-III",
  "rotorStart": "MCK",
  "rings": "AAA",
  "plugboard": "AB CD EF",
  "reflector": "B"
}
Return ONLY valid JSON, with no explanations.
`;
function sanitizeGeminiOutput(raw) {
    let cleaned = raw.replace(/^```(\w+)?/gm, '').replace(/```$/gm, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error(`No JSON object found in Gemini response:\n${cleaned}`);
    }
    return match[0];
}
function generateEnigmaConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const apiKey = 'AIzaSyDYmEcczYhZlnGuz-mAR6w2YsNwvlAp7G0';
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const generationConfig = {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "text/plain",
        };
        const chatSession = model.startChat({
            generationConfig,
            history: [],
        });
        const response = yield chatSession.sendMessage(geminiPrompt);
        const rawText = response.response.text();
        const cleanedText = sanitizeGeminiOutput(rawText);
        return JSON.parse(cleanedText);
    });
}
/* ------------------------------------------
   VSCode Extension Activation/Deactivation
------------------------------------------ */
function activate(context) {
    const extensionUri = vscode.Uri.file(context.extensionPath);
    let disposable = vscode.commands.registerCommand('extension.openEnigmaObfuscator', () => {
        EnigmaPanel.createOrShow(extensionUri, context);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
/* ------------------------------------------
   EnigmaPanel Webview (with autoObfuscate and passphrase popup)
------------------------------------------ */
class EnigmaPanel {
    static createOrShow(extensionUri, extensionContext) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (EnigmaPanel.currentPanel) {
            EnigmaPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('enigmaObfuscator', 'Enigma Code Obfuscator', column || vscode.ViewColumn.One, { enableScripts: true });
        EnigmaPanel.currentPanel = new EnigmaPanel(panel, extensionUri, extensionContext);
    }
    constructor(panel, extensionUri, context) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._context = context; // so we can use secrets API
        this._panel.webview.html = this._getHtmlForWebview();
        // Listen for messages from the webview
        this._panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
            switch (message.command) {
                case 'obfuscateFiles':
                    yield processFilesUsingEnigma(message.config, true);
                    this._panel.webview.postMessage({ command: 'status', text: 'Files obfuscated.' });
                    break;
                case 'deobfuscateFiles':
                    yield processFilesUsingEnigma(message.config, false);
                    this._panel.webview.postMessage({ command: 'status', text: 'Files deobfuscated.' });
                    break;
                case 'importConfig':
                    {
                        const uris = yield vscode.window.showOpenDialog({
                            openLabel: 'Select Configuration',
                            filters: { 'JSON Files': ['json'] }
                        });
                        if (uris && uris.length > 0) {
                            try {
                                const encryptedContent = yield fs.promises.readFile(uris[0].fsPath, 'utf8');
                                // 1) Attempt to retrieve stored passphrase from secrets:
                                const storedPassphrase = yield this._context.secrets.get('enigmaAutoPassphrase');
                                if (storedPassphrase) {
                                    try {
                                        const decryptedAuto = this.decryptConfig(encryptedContent, storedPassphrase);
                                        this._panel.webview.postMessage({ command: 'importConfigResult', data: decryptedAuto });
                                        this._panel.webview.postMessage({ command: 'status', text: 'Config imported via stored passphrase.' });
                                        return;
                                    }
                                    catch (err) {
                                        console.warn('Stored passphrase did not match this config file. Fallback to user prompt...');
                                    }
                                }
                                // 2) If no passphrase in secrets or mismatch, prompt user:
                                const passphrase = yield vscode.window.showInputBox({
                                    prompt: 'Enter passphrase to decrypt configuration',
                                    password: true
                                });
                                if (!passphrase) {
                                    this._panel.webview.postMessage({ command: 'status', text: 'Import cancelled.' });
                                    return;
                                }
                                try {
                                    const decryptedContent = this.decryptConfig(encryptedContent, passphrase);
                                    this._panel.webview.postMessage({ command: 'importConfigResult', data: decryptedContent });
                                }
                                catch (decryptError) {
                                    this._panel.webview.postMessage({ command: 'status', text: 'Invalid passphrase or corrupted configuration file.' });
                                }
                            }
                            catch (error) {
                                this._panel.webview.postMessage({ command: 'status', text: 'Error reading configuration file.' });
                            }
                        }
                    }
                    break;
                case 'exportConfig':
                    {
                        const passphrase = yield vscode.window.showInputBox({
                            prompt: 'Enter passphrase to encrypt configuration',
                            password: true
                        });
                        if (!passphrase) {
                            this._panel.webview.postMessage({ command: 'status', text: 'Export cancelled.' });
                            return;
                        }
                        const saveUri = yield vscode.window.showSaveDialog({
                            saveLabel: 'Export Configuration',
                            filters: { 'JSON Files': ['json'] }
                        });
                        if (saveUri) {
                            try {
                                const encryptedConfig = this.encryptConfig(message.data, passphrase);
                                yield fs.promises.writeFile(saveUri.fsPath, encryptedConfig, 'utf8');
                                this._panel.webview.postMessage({ command: 'status', text: 'Configuration exported securely.' });
                            }
                            catch (error) {
                                this._panel.webview.postMessage({ command: 'status', text: 'Error exporting configuration.' });
                            }
                        }
                    }
                    break;
                // NEW: Auto Configure & Obfuscate
                case 'autoObfuscate':
                    this._panel.webview.postMessage({ command: 'spinner', show: true });
                    (() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            // 1) Generate random config from Gemini
                            const config = yield generateEnigmaConfig();
                            // 2) Obfuscate files
                            yield processFilesUsingEnigma(config, true);
                            // 3) Generate a passphrase, store in secrets
                            const passphrase = crypto.randomBytes(16).toString('hex');
                            yield this._context.secrets.store('enigmaAutoPassphrase', passphrase);
                            // 4) Encrypt the config with that passphrase
                            const encryptedConfig = this.encryptConfig(JSON.stringify(config), passphrase);
                            // 5) Save the encrypted config to the workspace
                            if (!vscode.workspace.workspaceFolders) {
                                vscode.window.showErrorMessage('No workspace folder open');
                                this._panel.webview.postMessage({ command: 'spinner', show: false });
                                return;
                            }
                            const folderPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                            const configFilePath = path.join(folderPath, 'enigma_config_secret.json');
                            yield fs.promises.writeFile(configFilePath, encryptedConfig, 'utf8');
                            // 6) Show the one-time popup to display/copy the passphrase
                            this._panel.webview.postMessage({
                                command: 'passphraseGenerated',
                                passphrase
                            });
                            this._panel.webview.postMessage({
                                command: 'status',
                                text: 'Auto config complete. Files obfuscated & config secret saved.'
                            });
                        }
                        catch (err) {
                            console.error(err);
                            this._panel.webview.postMessage({ command: 'status', text: 'Error in auto configuration.' });
                        }
                        finally {
                            this._panel.webview.postMessage({ command: 'spinner', show: false });
                        }
                    }))();
                    break;
            }
        }), undefined, this._disposables);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    dispose() {
        EnigmaPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x)
                x.dispose();
        }
    }
    encryptConfig(data, passphrase) {
        const salt = crypto.randomBytes(16);
        const key = crypto.scryptSync(passphrase, salt, 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        const result = {
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            encrypted: encrypted.toString('hex'),
            authTag: authTag.toString('hex')
        };
        return JSON.stringify(result);
    }
    decryptConfig(encryptedData, passphrase) {
        const { salt, iv, encrypted, authTag } = JSON.parse(encryptedData);
        const key = crypto.scryptSync(passphrase, Buffer.from(salt, 'hex'), 32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encrypted, 'hex')),
            decipher.final()
        ]);
        return decrypted.toString('utf8');
    }
    _getHtmlForWebview() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Enigma Code Obfuscator</title>
  <style>
    body { background-color: #333; color: white; font-family: Verdana, sans-serif; }
    input, textarea, button { margin: 5px; padding: 5px; }
    #canvas { background-color: #222; border: 1px solid white; display: block; margin-top: 10px; }
    textarea { width: 800px; height: 50px; }
    /* Spinner overlay */
    #loadingOverlay {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.6);
      z-index: 9999;
      justify-content: center;
      align-items: center;
      color: #fff;
      font-size: 1.5em;
    }
    #loadingSpinner {
      border: 8px solid #f3f3f3;
      border-top: 8px solid #3498db;
      border-radius: 50%;
      width: 60px; height: 60px;
      animation: spin 1s linear infinite;
      margin-right: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    /* Passphrase popup modal */
    #passphrasePopup {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      justify-content: center;
      align-items: center;
    }
    #passphrasePopupContent {
      background: #fff;
      color: #000;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
      text-align: center;
    }
    #passphrasePopupContent p {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>Enigma Code Obfuscator</h1>
  <!-- Spinner Overlay -->
  <div id="loadingOverlay">
    <div id="loadingSpinner"></div>
    <div>Auto-obfuscating... Please wait.</div>
  </div>
  <!-- Passphrase Popup Modal (shown only once per auto-obfuscation) -->
  <div id="passphrasePopup">
    <div id="passphrasePopupContent">
      <p><strong>Important:</strong> Please save this passphrase securely. This popup will only appear once per auto obfuscation.</p>
      <p id="passphraseText" style="word-wrap: break-word; font-family: monospace;"></p>
      <button id="copyPassphrase">Copy Passphrase</button>
      <button id="closePassphrasePopup">Close</button>
    </div>
  </div>
  <h2>Configuration</h2>
  <label>Rotors (e.g. I-II-III):</label>
  <input type="text" id="rotors" value="I-II-III"><br>
  <label>Rotor Start (e.g. MCK):</label>
  <input type="text" id="rotorStart" value="MCK"><br>
  <label>Rings (e.g. AAA):</label>
  <input type="text" id="rings" value="AAA"><br>
  <label>Plugboard (e.g. AB CD EF):</label>
  <input type="text" id="plugboard" value=""><br>
  <label>Reflector (e.g. B):</label>
  <input type="text" id="reflector" value="B"><br>
  <button onclick="initEnigma()">Initialize Enigma</button>
  <hr>
  <h2>Simulation</h2>
  <label>Enter text:</label>
  <textarea id="inputText" oninput="simulate()"></textarea><br>
  <label>Output:</label>
  <textarea id="outputText" readonly></textarea>
  <canvas id="canvas" width="800" height="300"></canvas>
  <hr>
  <h2>File Obfuscation</h2>
  <button onclick="obfuscateFiles()">Obfuscate Files</button>
  <button onclick="deobfuscateFiles()">Deobfuscate Files</button>
  <button onclick="exportConfig()">Export Configuration</button>
  <button onclick="importConfig()">Import Configuration</button>
  <!-- NEW: Auto Configure & Obfuscate -->
  <button onclick="autoConfigureObfuscate()">Auto Configure & Obfuscate</button>
  <p id="status"></p>
  <script>
    const vscode = acquireVsCodeApi();
    let passphrasePopupShown = false; // To ensure one-time display per auto obfuscation

    function showSpinner() {
      document.getElementById('loadingOverlay').style.display = 'flex';
    }
    function hideSpinner() {
      document.getElementById('loadingOverlay').style.display = 'none';
    }
    function showPassphrasePopup(passphrase) {
      if (passphrasePopupShown) return;
      passphrasePopupShown = true;
      const popup = document.getElementById('passphrasePopup');
      const passphraseText = document.getElementById('passphraseText');
      passphraseText.textContent = passphrase;
      popup.style.display = 'flex';
    }
    function hidePassphrasePopup() {
      document.getElementById('passphrasePopup').style.display = 'none';
      // Reset flag so that next auto obfuscation will show popup again
      passphrasePopupShown = false;
    }
    document.getElementById('copyPassphrase').addEventListener('click', async () => {
      const text = document.getElementById('passphraseText').textContent;
      try {
        await navigator.clipboard.writeText(text);
        alert("Passphrase copied to clipboard. Please store it safely.");
      } catch (err) {
        alert("Unable to copy. Please copy manually: " + text);
      }
    });
    document.getElementById('closePassphrasePopup').addEventListener('click', () => {
      hidePassphrasePopup();
    });
    function importConfig() {
      vscode.postMessage({ command: 'importConfig' });
    }
    function exportConfig() {
      const config = {
        rotors: document.getElementById("rotors").value,
        rotorStart: document.getElementById("rotorStart").value,
        rings: document.getElementById("rings").value,
        plugboard: document.getElementById("plugboard").value,
        reflector: document.getElementById("reflector").value
      };
      vscode.postMessage({ command: 'exportConfig', data: JSON.stringify(config) });
    }
    function autoConfigureObfuscate() {
      vscode.postMessage({ command: 'autoObfuscate' });
    }
    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.command) {
        case 'importConfigResult':
          try {
            const config = JSON.parse(message.data);
            document.getElementById("rotors").value = config.rotors || "I-II-III";
            document.getElementById("rotorStart").value = config.rotorStart || "MCK";
            document.getElementById("rings").value = config.rings || "AAA";
            document.getElementById("plugboard").value = config.plugboard || "";
            document.getElementById("reflector").value = config.reflector || "B";
            initEnigma();
            document.getElementById("status").innerText = "Configuration imported and applied.";
          } catch (error) {
            document.getElementById("status").innerText = "Error importing configuration.";
          }
          break;
        case 'spinner':
          if (message.show) {
            showSpinner();
          } else {
            hideSpinner();
          }
          break;
        case 'passphraseGenerated':
          // Show the popup with passphrase (one time per auto obfuscation)
          showPassphrasePopup(message.passphrase);
          break;
        case 'status':
          document.getElementById('status').innerText = message.text;
          break;
      }
    });
    window.addEventListener('load', () => {
      const state = vscode.getState();
      if (state && state.enigmaConfig) {
        document.getElementById('rotors').value = state.enigmaConfig.rotors || "I-II-III";
        document.getElementById('rotorStart').value = state.enigmaConfig.rotorStart || "MCK";
        document.getElementById('rings').value = state.enigmaConfig.rings || "AAA";
        document.getElementById('plugboard').value = state.enigmaConfig.plugboard || "";
        document.getElementById('reflector').value = state.enigmaConfig.reflector || "B";
      }
    });
    function initEnigma() {
      const config = {
        rotors: document.getElementById("rotors").value,
        rotorStart: document.getElementById("rotorStart").value,
        rings: document.getElementById("rings").value,
        plugboard: document.getElementById("plugboard").value,
        reflector: document.getElementById("reflector").value
      };
      vscode.setState({ enigmaConfig: config });
      document.getElementById("status").innerText = "Enigma initialized with configuration.";
      initSimulation();
    }
    /* ------------------------------------
       Simulation Classes (same as before)
    ------------------------------------ */
    class Keyboard {
      forward(letter) {
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(letter);
      }
      backward(signal) {
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(signal);
      }
      draw(ctx, x, y, w, h, highlightIndex) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, w, h);
        for (let i = 0; i < 26; i++) {
          if (i === highlightIndex) {
            ctx.fillStyle = "yellow";
            ctx.fillRect(x, y + i * (h / 26), w, h / 26);
            ctx.fillStyle = "black";
          } else {
            ctx.fillStyle = "grey";
          }
          ctx.fillText("ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(i), x + w/2 - 5, y + (i+1) * (h/26) - 2);
        }
      }
    }
    class Plugboard {
      constructor(pairsStr) {
        this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        this.right = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        let pairs = pairsStr.trim().split(" ");
        for (let pair of pairs) {
          if (pair.length >= 2) {
            let A = pair[0].toUpperCase();
            let B = pair[1].toUpperCase();
            let idxA = this.left.indexOf(A);
            let idxB = this.left.indexOf(B);
            if (idxA !== -1 && idxB !== -1) {
              [this.left[idxA], this.left[idxB]] = [this.left[idxB], this.left[idxA]];
            }
          }
        }
      }
      forward(signal) {
        let letter = this.right[signal];
        return this.left.indexOf(letter);
      }
      backward(signal) {
        let letter = this.left[signal];
        return this.right.indexOf(letter);
      }
      draw(ctx, x, y, w, h, highlightIndex) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, w, h);
        for (let i = 0; i < 26; i++) {
          if (i === highlightIndex) {
            ctx.fillStyle = "yellow";
            ctx.fillRect(x + w/8, y + i * (h / 26), w/4, h/26);
            ctx.fillRect(x + (5 * w/8), y + i * (h / 26), w/4, h/26);
            ctx.fillStyle = "black";
          } else {
            ctx.fillStyle = "grey";
          }
          ctx.fillText(this.left[i], x + w/4, y + (i+1) * (h/26) - 2);
          ctx.fillText(this.right[i], x + (3 * w/4), y + (i+1) * (h/26) - 2);
        }
      }
    }
    class Rotor {
      constructor(wiring, notch) {
        this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        this.right = wiring.split('');
        this.notch = notch;
      }
      forward(signal) {
        let letter = this.right[signal];
        return this.left.indexOf(letter);
      }
      backward(signal) {
        let letter = this.left[signal];
        return this.right.indexOf(letter);
      }
      rotate(n = 1, forward = true) {
        for (let i = 0; i < n; i++) {
          if (forward) {
            this.left.push(this.left.shift());
            this.right.push(this.right.shift());
          } else {
            this.left.unshift(this.left.pop());
            this.right.unshift(this.right.pop());
          }
        }
      }
      rotateToLetter(letter) {
        let n = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(letter);
        this.rotate(n);
      }
      setRing(r) {
        this.rotate(r - 1, false);
        let nNotch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(this.notch);
        this.notch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt((nNotch - r + 1 + 26) % 26);
      }
      draw(ctx, x, y, w, h, highlightIndex) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, w, h);
        for (let i = 0; i < 26; i++) {
          if (i === highlightIndex) {
            ctx.fillStyle = "yellow";
            ctx.fillRect(x + w/8, y + i * (h / 26), w/4, h/26);
            ctx.fillRect(x + (5 * w/8), y + i * (h / 26), w/4, h/26);
            ctx.fillStyle = "black";
          } else {
            ctx.fillStyle = "grey";
          }
          ctx.fillText(this.left[i], x + w/8 + 5, y + (i+1) * (h/26) - 2);
          ctx.fillText(this.right[i], x + (5 * w/8) + 5, y + (i+1) * (h/26) - 2);
        }
      }
    }
    class Reflector {
      constructor(wiring) {
        this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        this.right = wiring.split('');
      }
      reflect(signal) {
        let letter = this.right[signal];
        return this.left.indexOf(letter);
      }
      draw(ctx, x, y, w, h, highlightIndex) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, w, h);
        for (let i = 0; i < 26; i++) {
          if (i === highlightIndex) {
            ctx.fillStyle = "yellow";
            ctx.fillRect(x + w/8, y + i * (h / 26), w/4, h/26);
            ctx.fillRect(x + (5 * w/8), y + i * (h / 26), w/4, h/26);
            ctx.fillStyle = "black";
          } else {
            ctx.fillStyle = "grey";
          }
          ctx.fillText(this.left[i], x + w/8 + 5, y + (i+1) * (h/26) - 2);
          ctx.fillText(this.right[i], x + (5 * w/8) + 5, y + (i+1) * (h/26) - 2);
        }
      }
    }
    class Enigma {
      constructor(reflector, r1, r2, r3, plugboard, keyboard) {
        this.re = reflector;
        this.r1 = r1;
        this.r2 = r2;
        this.r3 = r3;
        this.pb = plugboard;
        this.kb = keyboard;
      }
      setRings(rings) {
        this.r1.setRing(rings[0]);
        this.r2.setRing(rings[1]);
        this.r3.setRing(rings[2]);
      }
      setKey(key) {
        this.r1.rotateToLetter(key.charAt(0));
        this.r2.rotateToLetter(key.charAt(1));
        this.r3.rotateToLetter(key.charAt(2));
      }
      encipher(letter) {
        this.r3.rotate();
        let path = [];
        let signal = this.kb.forward(letter);
        path.push(signal);
        signal = this.pb.forward(signal); path.push(signal);
        signal = this.r3.forward(signal); path.push(signal);
        signal = this.r2.forward(signal); path.push(signal);
        signal = this.r1.forward(signal); path.push(signal);
        signal = this.re.reflect(signal); path.push(signal);
        signal = this.r1.backward(signal); path.push(signal);
        signal = this.r2.backward(signal); path.push(signal);
        signal = this.r3.backward(signal); path.push(signal);
        signal = this.pb.backward(signal); path.push(signal);
        let outputLetter = this.kb.backward(signal);
        return { letter: outputLetter, path: path };
      }
    }
    let enigma;
    const keyboard = new Keyboard();
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const X_REFLECTOR = 10;
    const X_ROTOR1    = 120;
    const X_ROTOR2    = 230;
    const X_ROTOR3    = 340;
    const X_PLUGBOARD = 450;
    const X_KEYBOARD  = 560;
    function letterY(index) {
      const topOffset = 10;
      const availableHeight = 300 - 20;
      const letterSpacing = availableHeight / 26;
      return topOffset + (index + 0.5) * letterSpacing;
    }
    function getColumnX(stepIndex) {
      switch (stepIndex) {
        case 0: return X_KEYBOARD;
        case 1: return X_PLUGBOARD;
        case 2: return X_ROTOR3;
        case 3: return X_ROTOR2;
        case 4: return X_ROTOR1;
        case 5: return X_REFLECTOR;
        case 6: return X_ROTOR1;
        case 7: return X_ROTOR2;
        case 8: return X_ROTOR3;
        case 9: return X_PLUGBOARD;
        default: return 0;
      }
    }
    function drawLineBetween(x1, i1, x2, i2, color) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1 + 50, letterY(i1));
      ctx.lineTo(x2 + 50, letterY(i2));
      ctx.stroke();
    }
    function drawPath(path) {
      for (let i = 0; i < 5; i++) {
        drawLineBetween(getColumnX(i), path[i], getColumnX(i+1), path[i+1], "red");
      }
      for (let i = 5; i < 9; i++) {
        drawLineBetween(getColumnX(i), path[i], getColumnX(i+1), path[i+1], "green");
      }
    }
    function initSimulation() {
      const config = {
        rotors: document.getElementById("rotors").value,
        rotorStart: document.getElementById("rotorStart").value,
        rings: document.getElementById("rings").value,
        plugboard: document.getElementById("plugboard").value,
        reflector: document.getElementById("reflector").value
      };
      const rotorNames = config.rotors.split("-");
      const rotorWirings = {
        "I": "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
        "II": "AJDKSIRUXBLHWTMCQGZNPYFVOE",
        "III": "BDFHJLCPRTXVZNYEIWGAKMUSQO",
        "IV": "ESOVPZJAYQUIRHXLNFTGKDCMWB",
        "V": "VZBRGITYUPSDNHLXAWMJQOFECK"
      };
      const reflectorWirings = {
        "A": "EJMZALYXVBWFCRQUONTSPIKHGD",
        "B": "YRUHQSLDPXNGOKMIEBFZCWVJAT",
        "C": "FVPJIAOYEDRZXWGCTKUQSBNMHL"
      };
      const r1 = new Rotor(rotorWirings[rotorNames[0]], "Q");
      const r2 = new Rotor(rotorWirings[rotorNames[1]], "E");
      const r3 = new Rotor(rotorWirings[rotorNames[2]], "V");
      const reflector = new Reflector(reflectorWirings[config.reflector]);
      const plugboard = new Plugboard(config.plugboard);
      enigma = new Enigma(reflector, r1, r2, r3, plugboard, keyboard);
      enigma.setRings(config.rings.split('').map(c => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c) + 1));
      enigma.setKey(config.rotorStart);
      drawComponents();
    }
    function drawComponents(path) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = 100, h = canvas.height - 20;
      let x = 10, y = 10;
      if (enigma) {
        enigma.re.draw(ctx, x, y, w, h, path ? path[5] : undefined);
        x += w + 10;
        enigma.r1.draw(ctx, x, y, w, h, path ? path[4] : undefined);
        x += w + 10;
        enigma.r2.draw(ctx, x, y, w, h, path ? path[3] : undefined);
        x += w + 10;
        enigma.r3.draw(ctx, x, y, w, h, path ? path[2] : undefined);
        x += w + 10;
        enigma.pb.draw(ctx, x, y, w, h, path ? path[1] : undefined);
        x += w + 10;
        keyboard.draw(ctx, x, y, w, h, path ? path[0] : undefined);
        if (path) {
          drawPath(path);
        }
      }
    }
    function simulate() {
      if (!enigma) {
        initSimulation();
      }
      const input = document.getElementById("inputText").value.toUpperCase();
      let output = "";
      let lastPath = null;
      for (let char of input) {
        if (/[A-Z]/.test(char)) {
          const result = enigma.encipher(char);
          output += result.letter;
          lastPath = result.path;
        } else {
          output += char;
        }
      }
      document.getElementById("outputText").value = output;
      drawComponents(lastPath);
    }
    function obfuscateFiles() {
      const config = {
        rotors: document.getElementById("rotors").value,
        rotorStart: document.getElementById("rotorStart").value,
        rings: document.getElementById("rings").value,
        plugboard: document.getElementById("plugboard").value,
        reflector: document.getElementById("reflector").value
      };
      vscode.postMessage({ command: 'obfuscateFiles', config: config });
    }
    function deobfuscateFiles() {
      const config = {
        rotors: document.getElementById("rotors").value,
        rotorStart: document.getElementById("rotorStart").value,
        rings: document.getElementById("rings").value,
        plugboard: document.getElementById("plugboard").value,
        reflector: document.getElementById("reflector").value
      };
      vscode.postMessage({ command: 'deobfuscateFiles', config: config });
    }
  </script>
</body>
</html>
    `;
    }
}
//# sourceMappingURL=extension.js.map
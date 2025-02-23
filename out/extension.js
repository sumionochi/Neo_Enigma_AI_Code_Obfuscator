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
/* --------------------------------------------------------------------------
   Enigma Machine Classes for File Obfuscation (Extension Host)
   These classes replicate the simulation logic but without any UI drawing.
-------------------------------------------------------------------------- */
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
        // n is expected as a 1-indexed value (e.g. A -> 1)
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
        // key is expected to be a three-letter string (e.g. "MCK")
        this.r1.rotateToLetter(key.charAt(0).toUpperCase());
        this.r2.rotateToLetter(key.charAt(1).toUpperCase());
        this.r3.rotateToLetter(key.charAt(2).toUpperCase());
    }
    encipher(letter) {
        // For each letter, rotor r3 steps automatically.
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
/* --------------------------------------------------------------------------
   Updated File Processing Functions Using the Enigma Logic
-------------------------------------------------------------------------- */
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
                    // For Enigma, encryption and decryption are the same process if the initial state is reestablished.
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
    // Define wirings for the rotors and reflector (for demonstration)
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
    // Instantiate rotors based on the configuration
    const rotorNames = config.rotors.split("-");
    const r1 = new Rotor(rotorWirings[rotorNames[0]], "Q");
    const r2 = new Rotor(rotorWirings[rotorNames[1]], "E");
    const r3 = new Rotor(rotorWirings[rotorNames[2]], "V");
    const reflector = new Reflector(reflectorWirings[config.reflector]);
    const plugboard = new Plugboard(config.plugboard);
    const keyboard = new Keyboard();
    const enigma = new Enigma(reflector, r1, r2, r3, plugboard, keyboard);
    // Configure rings and rotor start positions
    enigma.setRings(config.rings.split('').map((c) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c) + 1));
    enigma.setKey(config.rotorStart);
    let transformed = '';
    // Process the text one character at a time
    for (const char of text) {
        if (/[A-Za-z]/.test(char)) {
            const result = enigma.encipher(char.toUpperCase());
            let newChar = result.letter;
            // Preserve original case
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
/* --------------------------------------------------------------------------
   VS Code Extension Activation / Webview Code
-------------------------------------------------------------------------- */
function activate(context) {
    // Use extensionPath to build a URI for the extension folder.
    const extensionUri = vscode.Uri.file(context.extensionPath);
    let disposable = vscode.commands.registerCommand('extension.openEnigmaObfuscator', () => {
        EnigmaPanel.createOrShow(extensionUri);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
class EnigmaPanel {
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (EnigmaPanel.currentPanel) {
            EnigmaPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('enigmaObfuscator', 'Enigma Code Obfuscator', column || vscode.ViewColumn.One, {
            enableScripts: true
        });
        EnigmaPanel.currentPanel = new EnigmaPanel(panel, extensionUri);
    }
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.webview.html = this._getHtmlForWebview();
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
    _getHtmlForWebview() {
        // Inline HTML UI remains mostly unchanged.
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Enigma Code Obfuscator</title>
  <style>
    body { background-color: #333; color: white; font-family: Verdana, sans-serif; }
    input, button { margin: 5px; padding: 5px; }
    #canvas { background-color: #222; border: 1px solid white; }
  </style>
</head>
<body>
  <h1>Enigma Code Obfuscator</h1>
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
  <input type="text" id="inputText" oninput="simulate()" /><br>
  <canvas id="canvas" width="800" height="300"></canvas>
  <p id="outputText"></p>
  <hr>
  <h2>File Obfuscation</h2>
  <button onclick="obfuscateFiles()">Obfuscate Files</button>
  <button onclick="deobfuscateFiles()">Deobfuscate Files</button>
  <p id="status"></p>
  <script>
    const vscode = acquireVsCodeApi();
    
    // Persist configuration in localStorage on load.
    window.onload = function() {
      const storedConfig = JSON.parse(localStorage.getItem('enigmaConfig') || '{}');
      if (storedConfig.rotors) document.getElementById('rotors').value = storedConfig.rotors;
      if (storedConfig.rotorStart) document.getElementById('rotorStart').value = storedConfig.rotorStart;
      if (storedConfig.rings) document.getElementById('rings').value = storedConfig.rings;
      if (storedConfig.plugboard) document.getElementById('plugboard').value = storedConfig.plugboard;
      if (storedConfig.reflector) document.getElementById('reflector').value = storedConfig.reflector;
    };
    
    function initEnigma() {
      const config = {
        rotors: document.getElementById("rotors").value,
        rotorStart: document.getElementById("rotorStart").value,
        rings: document.getElementById("rings").value,
        plugboard: document.getElementById("plugboard").value,
        reflector: document.getElementById("reflector").value
      };
      localStorage.setItem('enigmaConfig', JSON.stringify(config));
      document.getElementById("status").innerText = "Enigma initialized with configuration.";
    }
    
    function simulate() {
      // Simulation code can be added here.
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
</html>`;
    }
}
//# sourceMappingURL=extension.js.map
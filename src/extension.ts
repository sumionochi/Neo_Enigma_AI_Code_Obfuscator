import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  // Use extensionPath to build a URI for the extension folder.
  const extensionUri = vscode.Uri.file(context.extensionPath);

  let disposable = vscode.commands.registerCommand('extension.openEnigmaObfuscator', () => {
    EnigmaPanel.createOrShow(extensionUri);
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {}

class EnigmaPanel {
  public static currentPanel: EnigmaPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (EnigmaPanel.currentPanel) {
      EnigmaPanel.currentPanel._panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'enigmaObfuscator',
      'Enigma Code Obfuscator',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );
    EnigmaPanel.currentPanel = new EnigmaPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._panel.webview.html = this._getHtmlForWebview();

    this._panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'obfuscateFiles':
            await processFilesUsingEnigma(message.config, true);
            this._panel.webview.postMessage({ command: 'status', text: 'Files obfuscated.' });
            break;
          case 'deobfuscateFiles':
            await processFilesUsingEnigma(message.config, false);
            this._panel.webview.postMessage({ command: 'status', text: 'Files deobfuscated.' });
            break;
        }
      },
      undefined,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    EnigmaPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) x.dispose();
    }
  }

  private _getHtmlForWebview(): string {
    // Inline HTML UI for configuring the Enigma machine, simulation canvas, and file obfuscation controls.
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
    
    // -----------------------------
    // Enigma Simulation Classes
    // -----------------------------
    class Keyboard {
      forward(letter) {
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(letter);
      }
      backward(signal) {
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(signal);
      }
      draw(ctx, x, y, w, h) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "grey";
        for (let i = 0; i < 26; i++) {
          ctx.fillText("ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(i), x + w/2, y + (i+1)*h/27);
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
      draw(ctx, x, y, w, h) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "grey";
        for (let i = 0; i < 26; i++) {
          ctx.fillText(this.left[i], x + w/4, y + (i+1)*h/27);
          ctx.fillText(this.right[i], x + (3*w)/4, y + (i+1)*h/27);
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
      rotate(n=1, forward=true) {
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
      setRing(n) {
        this.rotate(n - 1, false);
        let nNotch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(this.notch);
        this.notch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt((nNotch - n + 1 + 26) % 26);
      }
      draw(ctx, x, y, w, h) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "grey";
        for (let i = 0; i < 26; i++) {
          ctx.fillText(this.left[i], x + w/4, y + (i+1)*h/27);
          ctx.fillText(this.right[i], x + (3*w)/4, y + (i+1)*h/27);
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
      draw(ctx, x, y, w, h) {
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "grey";
        for (let i = 0; i < 26; i++) {
          ctx.fillText(this.left[i], x + w/4, y + (i+1)*h/27);
          ctx.fillText(this.right[i], x + (3*w)/4, y + (i+1)*h/27);
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
        // For demonstration, we perform a simple rotor stepping and signal path
        this.r3.rotate();
        let signal = this.kb.forward(letter);
        let path = [signal];
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
        return { path: path, letter: outputLetter };
      }
    }
    
    // Global Enigma instance and supporting objects
    let enigma;
    const keyboard = new Keyboard();
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    
    function initEnigma() {
      const rotorsInput = document.getElementById("rotors").value;
      const rotorStart = document.getElementById("rotorStart").value;
      const ringsInput = document.getElementById("rings").value;
      const plugboardInput = document.getElementById("plugboard").value;
      const reflectorInput = document.getElementById("reflector").value;
      
      const rotorNames = rotorsInput.split("-");
      // Predefined wirings for demonstration
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
      const reflector = new Reflector(reflectorWirings[reflectorInput]);
      const plugboard = new Plugboard(plugboardInput);
      enigma = new Enigma(reflector, r1, r2, r3, plugboard, keyboard);
      enigma.setRings(ringsInput.split('').map(c => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c) + 1));
      enigma.setKey(rotorStart);
      
      drawComponents();
    }
    
    function drawComponents() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = 100, h = canvas.height - 20;
      let x = 10, y = 10;
      if (enigma) {
        enigma.re.draw(ctx, x, y, w, h);
        x += w + 10;
        enigma.r1.draw(ctx, x, y, w, h);
        x += w + 10;
        enigma.r2.draw(ctx, x, y, w, h);
        x += w + 10;
        enigma.r3.draw(ctx, x, y, w, h);
        x += w + 10;
        enigma.pb.draw(ctx, x, y, w, h);
        x += w + 10;
        keyboard.draw(ctx, x, y, w, h);
      }
    }
    
    function simulate() {
      const input = document.getElementById("inputText").value.toUpperCase();
      if (input.length > 0 && enigma) {
        const result = enigma.encipher(input.charAt(input.length - 1));
        document.getElementById("outputText").innerText = result.letter;
        drawComponents();
      }
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

async function processFilesUsingEnigma(config: any, obfuscate: boolean) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }
  const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
  // Supported file types
  const fileExtensions = ['.py', '.js', '.ts', '.java', '.cpp', '.c', '.html', '.css'];
  const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');

  // For demonstration, we use a simplified transformation (a Caesar cipher) as a placeholder.
  for (const file of files) {
    const filePath = file.fsPath;
    if (fileExtensions.includes(path.extname(filePath))) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let transformed = enigmaObfuscate(content, obfuscate);
        fs.writeFileSync(filePath, transformed, 'utf8');
      } catch (err) {
        console.error(`Error processing file ${filePath}:`, err);
      }
    }
  }
}

function enigmaObfuscate(text: string, obfuscate: boolean): string {
  // Placeholder obfuscation: shift letters by +3 (obfuscate) or -3 (deobfuscate)
  const shift = obfuscate ? 3 : -3;
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

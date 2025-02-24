import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

class Keyboard {
  forward(letter: string): number {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(letter);
  }
  backward(signal: number): string {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(signal);
  }
}

class Plugboard {
  left: string[];
  right: string[];
  constructor(pairsStr: string) {
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
  forward(signal: number): number {
    let letter = this.right[signal];
    return this.left.indexOf(letter);
  }
  backward(signal: number): number {
    let letter = this.left[signal];
    return this.right.indexOf(letter);
  }
}

class Rotor {
  left: string[];
  right: string[];
  notch: string;
  constructor(wiring: string, notch: string) {
    this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    this.right = wiring.split('');
    this.notch = notch;
  }
  forward(signal: number): number {
    let letter = this.right[signal];
    return this.left.indexOf(letter);
  }
  backward(signal: number): number {
    let letter = this.left[signal];
    return this.right.indexOf(letter);
  }
  rotate(n: number = 1, forward: boolean = true) {
    for (let i = 0; i < n; i++) {
      if (forward) {
        this.left.push(this.left.shift()!);
        this.right.push(this.right.shift()!);
      } else {
        this.left.unshift(this.left.pop()!);
        this.right.unshift(this.right.pop()!);
      }
    }
  }
  rotateToLetter(letter: string) {
    let n = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(letter);
    this.rotate(n);
  }
  setRing(n: number) {
    // n is expected as a 1-indexed value (e.g. A -> 1)
    this.rotate(n - 1, false);
    let nNotch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(this.notch);
    this.notch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt((nNotch - n + 1 + 26) % 26);
  }
}

class Reflector {
  left: string[];
  right: string[];
  constructor(wiring: string) {
    this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
    this.right = wiring.split('');
  }
  reflect(signal: number): number {
    let letter = this.right[signal];
    return this.left.indexOf(letter);
  }
}

class Enigma {
  re: Reflector;
  r1: Rotor;
  r2: Rotor;
  r3: Rotor;
  pb: Plugboard;
  kb: Keyboard;
  constructor(reflector: Reflector, r1: Rotor, r2: Rotor, r3: Rotor, plugboard: Plugboard, keyboard: Keyboard) {
    this.re = reflector;
    this.r1 = r1;
    this.r2 = r2;
    this.r3 = r3;
    this.pb = plugboard;
    this.kb = keyboard;
  }
  setRings(rings: number[]) {
    this.r1.setRing(rings[0]);
    this.r2.setRing(rings[1]);
    this.r3.setRing(rings[2]);
  }
  setKey(key: string) {
    // key is expected to be a three-letter string (e.g. "MCK")
    this.r1.rotateToLetter(key.charAt(0).toUpperCase());
    this.r2.rotateToLetter(key.charAt(1).toUpperCase());
    this.r3.rotateToLetter(key.charAt(2).toUpperCase());
  }
  encipher(letter: string): { path: number[], letter: string } {
    // For each letter, rotor r3 steps automatically.
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
    return { path, letter: outputLetter };
  }
}

async function processFilesUsingEnigma(config: any, obfuscate: boolean) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }
  // List of supported file types
  const fileExtensions = ['.py', '.js', '.ts', '.java', '.cpp', '.c', '.html', '.css'];
  const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');

  for (const file of files) {
    const filePath = file.fsPath;
    if (fileExtensions.includes(path.extname(filePath))) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        // For Enigma, encryption and decryption are the same process if the initial state is reestablished.
        let transformed = enigmaObfuscate(content, config, obfuscate);
        fs.writeFileSync(filePath, transformed, 'utf8');
      } catch (err) {
        console.error(`Error processing file ${filePath}:`, err);
      }
    }
  }
}

function enigmaObfuscate(text: string, config: any, obfuscate: boolean): string {
  // Define wirings for the rotors and reflector (for demonstration)
  const rotorWirings: { [key: string]: string } = {
    "I": "EKMFLGDQVZNTOWYHXUSPAIBRCJ",
    "II": "AJDKSIRUXBLHWTMCQGZNPYFVOE",
    "III": "BDFHJLCPRTXVZNYEIWGAKMUSQO",
    "IV": "ESOVPZJAYQUIRHXLNFTGKDCMWB",
    "V": "VZBRGITYUPSDNHLXAWMJQOFECK"
  };
  const reflectorWirings: { [key: string]: string } = {
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
  enigma.setRings(config.rings.split('').map((c:string) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c) + 1));
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
    } else {
      transformed += char;
    }
  }
  return transformed;
}

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
          case 'importConfig':
            const uris = await vscode.window.showOpenDialog({
              openLabel: 'Select Configuration',
              filters: { 'JSON Files': ['json'] }
            });
            if (uris && uris.length > 0) {
              try {
                const content = await fs.promises.readFile(uris[0].fsPath, 'utf8');
                this._panel.webview.postMessage({ command: 'importConfigResult', data: content });
              } catch (error) {
                this._panel.webview.postMessage({ command: 'status', text: 'Error reading configuration file.' });
              }
            }
            break;
          case 'exportConfig':
            // Prompt user to save configuration
            const saveUri = await vscode.window.showSaveDialog({
              saveLabel: 'Export Configuration',
              filters: { 'JSON Files': ['json'] }
            });
            if (saveUri) {
              try {
                await fs.promises.writeFile(saveUri.fsPath, message.data, 'utf8');
                this._panel.webview.postMessage({ command: 'status', text: 'Configuration exported.' });
              } catch (error) {
                this._panel.webview.postMessage({ command: 'status', text: 'Error exporting configuration.' });
              }
            }
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
  <textarea id="inputText" oninput="simulate()"></textarea><br>
  <label>Output:</label>
  <textarea id="outputText" readonly></textarea>
  <canvas id="canvas" width="800" height="300"></canvas>
  <hr>
  <h2>File Obfuscation</h2>
  <button onclick="obfuscateFiles()">Obfuscate Files</button>
  <button onclick="deobfuscateFiles()">Deobfuscate Files</button>
  <!-- Inside the File Obfuscation section -->
  <button onclick="exportConfig()">Export Configuration</button>
  <button onclick="importConfig()">Import Configuration</button>
  <p id="status"></p>
  <script>

  function importConfig() {
    // Request the extension to open a file dialog
    vscode.postMessage({ command: 'importConfig' });
  }

  function exportConfig() {
    // Collect current configuration values
    const config = {
      rotors: document.getElementById("rotors").value,
      rotorStart: document.getElementById("rotorStart").value,
      rings: document.getElementById("rings").value,
      plugboard: document.getElementById("plugboard").value,
      reflector: document.getElementById("reflector").value
    };
    // Send the configuration to the extension
    vscode.postMessage({ command: 'exportConfig', data: JSON.stringify(config) });
  }
    const vscode = acquireVsCodeApi();

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

        default:
          break;
      }
    });

    // Restore state on load using vscode.getState
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
      // Also reinitialize the simulation instance.
      initSimulation();
    }

    /* -------------------------
       Simulation Classes
       ------------------------- */
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
      setRing(n) {
        this.rotate(n - 1, false);
        let nNotch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(this.notch);
        this.notch = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt((nNotch - n + 1 + 26) % 26);
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
        // Step the rightmost rotor first
        this.r3.rotate();
        // Build a path array to track forward/backward indices
        let path = [];

        // Keyboard forward
        let signal = this.kb.forward(letter);
        path.push(signal);

        // Plugboard forward
        signal = this.pb.forward(signal);
        path.push(signal);

        // Rotor3 forward
        signal = this.r3.forward(signal);
        path.push(signal);

        // Rotor2 forward
        signal = this.r2.forward(signal);
        path.push(signal);

        // Rotor1 forward
        signal = this.r1.forward(signal);
        path.push(signal);

        // Reflector
        signal = this.re.reflect(signal);
        path.push(signal);

        // Rotor1 backward
        signal = this.r1.backward(signal);
        path.push(signal);

        // Rotor2 backward
        signal = this.r2.backward(signal);
        path.push(signal);

        // Rotor3 backward
        signal = this.r3.backward(signal);
        path.push(signal);

        // Plugboard backward
        signal = this.pb.backward(signal);
        path.push(signal);

        // Final letter
        let outputLetter = this.kb.backward(signal);
        return { letter: outputLetter, path: path };
      }
    }

    /* -------------------------
       Simulation Initialization & Drawing
       ------------------------- */
    let enigma;
    const keyboard = new Keyboard();
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Define x-positions for each column in the order you draw them:
    // Reflector, Rotor1, Rotor2, Rotor3, Plugboard, Keyboard
    const X_REFLECTOR = 10;
    const X_ROTOR1    = 120;
    const X_ROTOR2    = 230;
    const X_ROTOR3    = 340;
    const X_PLUGBOARD = 450;
    const X_KEYBOARD  = 560;

    // We have 26 letters, and each column is drawn with height h = (canvas.height - 20).
    // We'll define a helper function for y-coordinates:
    function letterY(index) {
      // index is 0..25
      const topOffset = 10;            // matches the 'y' used in drawComponents
      const availableHeight = 300 - 20; // same as h in drawComponents
      const letterSpacing = availableHeight / 26;
      // We'll center each letter block
      return topOffset + (index + 0.5) * letterSpacing;
    }

    // Map each step in the path array to the correct x-column
    function getColumnX(stepIndex) {
      // The path array steps are:
      //  0: keyboard out
      //  1: plugboard forward
      //  2: rotor3 forward
      //  3: rotor2 forward
      //  4: rotor1 forward
      //  5: reflector
      //  6: rotor1 backward
      //  7: rotor2 backward
      //  8: rotor3 backward
      //  9: plugboard backward
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
      ctx.moveTo(x1 + 50, letterY(i1)); // +50 to shift inside each column a bit
      ctx.lineTo(x2 + 50, letterY(i2));
      ctx.stroke();
    }

    // Draw the signal path lines in red (forward) and green (backward)
    function drawPath(path) {
      // Forward path (0->1->2->3->4->5)
      for (let i = 0; i < 5; i++) {
        drawLineBetween(
          getColumnX(i),   path[i],
          getColumnX(i+1), path[i+1],
          "red"
        );
      }
      // Backward path (5->6->7->8->9)
      for (let i = 5; i < 9; i++) {
        drawLineBetween(
          getColumnX(i),   path[i],
          getColumnX(i+1), path[i+1],
          "green"
        );
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
      drawComponents(); // draw without highlights initially
    }

    // drawComponents highlights the columns based on the last letter's forward path
    function drawComponents(path) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = 100, h = canvas.height - 20;
      let x = 10, y = 10;
      if (enigma) {
        // Reflector highlight: path[5]
        enigma.re.draw(ctx, x, y, w, h, path ? path[5] : undefined);
        x += w + 10;
        // Rotor1: highlight forward value is path[4]
        enigma.r1.draw(ctx, x, y, w, h, path ? path[4] : undefined);
        x += w + 10;
        // Rotor2: highlight forward value is path[3]
        enigma.r2.draw(ctx, x, y, w, h, path ? path[3] : undefined);
        x += w + 10;
        // Rotor3: highlight forward value is path[2]
        enigma.r3.draw(ctx, x, y, w, h, path ? path[2] : undefined);
        x += w + 10;
        // Plugboard: highlight forward value is path[1]
        enigma.pb.draw(ctx, x, y, w, h, path ? path[1] : undefined);
        x += w + 10;
        // Keyboard: highlight the key corresponding to the input letter (path[0])
        keyboard.draw(ctx, x, y, w, h, path ? path[0] : undefined);

        // After drawing columns/highlights, draw the signal path lines
        if (path) {
          drawPath(path);
        }
      }
    }

    function simulate() {
      // Initialize simulation if not already done.
      if (!enigma) {
        initSimulation();
      }
      const input = document.getElementById("inputText").value.toUpperCase();
      let output = "";
      let lastPath = null; // store transformation chain for the last processed letter
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

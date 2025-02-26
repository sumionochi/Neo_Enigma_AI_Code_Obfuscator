# NeoEnigma - Secure AI Code Processing Extension

## Overview
NeoEnigma is a VSCode extension that implements homomorphic encryption principles using a modernized Enigma machine simulation for secure code processing with AI. It allows developers to interact with AI models while maintaining code privacy through advanced encryption and obfuscation techniques.

## Features

### 🔐 Secure Code Processing
- **Homomorphic-inspired Encryption**: Enables AI to process encrypted code without accessing the original content
- **Enigma-based Encryption**: Modern implementation of the historical Enigma machine
- **Multi-layer Obfuscation**: Combines classical encryption with modern code obfuscation techniques

### 🛠️ Core Functionalities
- **Real-time Code Simulation**: Visual representation of the encryption process
- **File System Integration**: Batch processing of source code files
- **Configuration Management**: Export/Import encryption settings
- **Auto-configuration**: AI-assisted secure parameter generation

### 💬 Secure AI Chat
- **Encrypted Prompts**: Secure communication with AI models
- **Encrypted Responses**: Maintains privacy in AI responses
- **Visual Deobfuscation**: Real-time decryption of messages

## How It Works

### Encryption Process
1. **Input Processing**
   - Code/text is processed through the Enigma machine simulation
   - Additional layers of code obfuscation are applied

2. **AI Interaction**
   - Encrypted code is sent to AI models
   - AI processes the encrypted content. This is a Proof of Concept (PoC) that can be used to obfuscate data sent to LLMs. It uses a technique known as Homomorphic Encryption to obfuscate data in a way that the LLM can still create valid completions while the data itself is gibberish. This works because an LLM is just a completion engine and does not need to understand the data it is completing. It just needs to be able to predict what comes next.

3. **Decryption Process**
   - Responses are decrypted using the original configuration
   - Obfuscation layers are removed systematically

### Security Features
- **Rotor System**: Implements multiple rotor configurations
- **Plugboard**: Additional layer of letter substitution
- **Ring Settings**: Advanced position configurations
- **Reflector**: Ensures reversible encryption

### Password-Protected Configurations
- **Secure Storage**: Configurations are encrypted using AES-256-GCM
- **VS Code Secrets**: Passphrases are securely stored in VS Code's secrets storage
- **One-Time Share**: Generated passphrases are shown only once during auto-configuration
- **Export Protection**: Configurations can be exported with password protection
- **Import Security**: Password verification required for importing configurations

### Configuration Management
1. **Auto-Configuration**
   - Generates secure random settings
   - Creates encrypted configuration file
   - Provides one-time passphrase display
   - Stores passphrase in VS Code secrets

2. **Manual Export/Import**
   - Password-protected configuration files
   - Secure passphrase sharing mechanism
   - Encrypted storage of settings

## Usage

### Basic Configuration
```json
{
  "rotors": "I-II-III",
  "rotorStart": "AAA",
  "rings": "AAA",
  "plugboard": "AB CD EF",
  "reflector": "B"
}
```

### Commands
- `Initialize Enigma`: Set up encryption configuration
- `Obfuscate Files`: Process files with encryption
- `Deobfuscate Files`: Restore encrypted files
- `Auto Configure`: Generate secure random settings

## Technical Details

### Homomorphic-Inspired Processing
The extension implements a simplified version of homomorphic encryption principles:
- Maintains data privacy during AI processing
- Allows AI to operate on encrypted data
- Preserves the ability to decrypt results

### Code Obfuscation Techniques
- Control flow flattening
- Arithmetic encoding
- Variable hiding
- Opaque predicates
- Dead code injection

## Requirements
- Visual Studio Code 1.60.0 or higher
- Node.js 14.0.0 or higher
- Internet connection for AI features

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/NeoEnigma.git
cd NeoEnigma
```

2. Install dependencies:
```bash
npm install
```

3. Configure API Key:
   - Create a Gemini API key at Google AI Studio
   - Replace the placeholder API key in `src/extension.ts`

4. Compile and Run:
```bash
npm run compile
```

5. Launch Development Instance:
   - Press `F5` to open a new VS Code window with the extension
   - Use `Cmd + Shift + P` to open command palette
   - Select "Open Enigma Obfuscator"

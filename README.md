# NeoEnigma Code Obfuscator

A VS Code extension that implements homomorphic encryption technique through Enigma Cipher + 7 advanced obfuscation techniques over files used to obfuscate data sent to LLMs. It enables secure interaction with LLMs while preserving data privacy, combining the classic Enigma machine algorithm with modern cryptographic methods and machine learning capabilities.

## Why NeoEnigma?

- **Data Privacy in AI Era**: With AI services like DeepSeek explicitly stating they use input data for training — raising serious privacy concerns, enterprises need robust data protection
- **Secure LLM Interaction**: Enables using AI capabilities without exposing sensitive code or data
- **Enterprise-Ready**: Designed for organizations requiring highest level of data security while leveraging AI tools

## Features

- **Homomorphic Encryption**: 
  - Enables LLMs to operate on encrypted data without decryption
  - Maintains data utility while ensuring privacy
  - Supports secure AI completions on obfuscated code

<img width="889" alt="image" src="https://github.com/user-attachments/assets/554fe72c-cabf-47b6-9b68-9244a501e3af" />

- **Enigma-based Obfuscation**: 
  - Implements the classic Enigma machine algorithm
  - Creates unique, reversible code transformations
  - Adds historical cryptographic strength
 
<img width="990" alt="image" src="https://github.com/user-attachments/assets/04d6c9e8-7be2-4d7f-ad33-9447297de191" />

- **Advanced Obfuscation Suite**:
  - Variable hiding and renaming
  - Control flow flattening
  - Dead code injection
  - Code interleaving
  - Arithmetic encoding
  - String encryption
  - Metadata obfuscation

- **Enterprise Security**:
  - AES-256-GCM configuration encryption
<img width="1135" alt="Screenshot 2025-02-28 at 7 08 49 AM" src="https://github.com/user-attachments/assets/53d50964-323a-486a-b885-6287f10f2b82" />

  - Secure key management
  - Access control integration
  - Audit logging capabilities

- **AI-Powered Analysis**: 
  - Uses TensorFlow.js for intelligent code analysis
  - Automatic obfuscation strategy selection
  - Security risk assessment
<img width="858" alt="Screenshot 2025-02-28 at 7 04 19 AM" src="https://github.com/user-attachments/assets/414b373b-e3c2-45bb-adec-c12b60fffa98" />

- **Secure Configuration Management**:
  - Import/Export encrypted configurations
  - Auto-configuration with secure passphrase generation
  - Version control friendly

- **Interactive UI**:
  - Real-time code simulation
  - Visual Enigma machine representation
  - Chat interface with Gemini AI for customization

## Installation

1. Install the extension from VS Code Marketplace
2. Open the command palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Search for "Open Enigma Obfuscator"

## Usage

### Basic Obfuscation

1. Open the Enigma Obfuscator panel
2. Configure the Enigma settings:
   - Rotors (e.g., I-II-III)
   - Rotor Start Position (e.g., MCK)
   - Ring Settings (e.g., AAA)
   - Plugboard Connections
   - Reflector Type (A, B, or C)
3. Click "Obfuscate Files" to process your code

<img width="1129" alt="Screenshot 2025-02-28 at 7 04 57 AM" src="https://github.com/user-attachments/assets/81f16a8d-6bbc-4171-a939-5216de86990f" />

### Auto Configuration

1. Click "Auto Configure & Obfuscate"
2. The extension will:
   - Generate optimal settings using Gemini AI
   - Apply intelligent obfuscation strategies
   - Save encrypted configuration
   - Provide a secure passphrase

### Simulation Tab
1. Configure and initialize your Enigma settings
2. Input text in the left text area to see real-time obfuscation in the right area
3. Interactive canvas displays live Enigma component states
4. Use file obfuscation buttons to process workspace files with configuration-based shifts

<img width="1131" alt="Screenshot 2025-02-28 at 7 05 23 AM" src="https://github.com/user-attachments/assets/6f7d31e6-97c0-4dcb-a3cb-36121d672d1f" />

### Chat Tab (Secure LLM Integration)

1. **Features**:
   - Real-time prompt obfuscation
   - Automatic response deobfuscation
   - Secure file attachment support
   - Context-aware encryption

2. **Usage Flow**:
   - Enter prompt in the chat input
   - System automatically applies homomorphic encryption
   - LLM processes encrypted data maintaining utility
   - Use "Deobfuscate Last Response" to reveal plain text
   - Attach obfuscated files for context-aware completions

<img width="1127" alt="Screenshot 2025-02-28 at 7 06 28 AM" src="https://github.com/user-attachments/assets/07316e00-155f-4e97-950a-06c92d526814" />
<img width="1124" alt="Screenshot 2025-02-28 at 7 06 42 AM" src="https://github.com/user-attachments/assets/54534159-837f-4991-894b-5c7dea82b905" />

## Supported File Types

- Python (.py)
- JavaScript (.js)
- TypeScript (.ts)
- Java (.java)
- C++ (.cpp)
- C (.c)
- HTML (.html)
- CSS (.css)

## Development

### Prerequisites

- Node.js
- VS Code
- TypeScript
- TensorFlow.js (for ML components)

### Core Components

#### Machine Learning Code Analyzer

- **Neural Network Architecture**:
  - Input Layer: Processes tokenized code sequences
  - Embedding Layer: 5000-dimensional vocabulary → 64-dimensional dense vectors
  - LSTM Layer 1: 32 units with sequence return
  - LSTM Layer 2: 16 units with sequence compression
  - Dense Layer 1: 8 units with ReLU activation
  - Dense Layer 2: 4 units with Sigmoid activation for multi-label classification
  - Optimizer: Adam (learning rate: 0.001, beta1: 0.9, beta2: 0.999)

- **Code Analysis Components**:
  - Tokenizer: Custom-built for code syntax with 5000 token vocabulary
  - Sequence Processor: Handles variable-length code inputs
  - Pattern Detector: Identifies security-critical code patterns
  - Risk Analyzer: Evaluates potential vulnerabilities

#### Enigma Implementation

- **Classes**:
  - `Keyboard`: Handles input/output character mapping
  - `Plugboard`: Implements plugboard substitution with pair configuration
  - `Rotor`: Simulates Enigma rotor with wiring, notch, and rotation mechanics
  - `Reflector`: Implements signal reflection with configurable wiring
  - `Enigma`: Main class orchestrating the encryption process

- **Obfuscation Techniques**:
  - Control Flow Flattening: Transforms structured code into switch-case state machine
  - Variable Hiding: Applies arithmetic transformations to variable assignments
  - Dead Code Injection: Inserts valid but unused functions and operations
  - Code Interleaving: Adds dummy operations between actual code lines
  - Arithmetic Encoding: Replaces simple operations with complex equivalents

### Setup

```bash
# Install dependencies
npm install

# Install TensorFlow.js for ML components
npm install @tensorflow/tfjs-node

# Compile the extension
npm run compile
```

### Running ML Components

1. Generate training data from code samples:
```bash
npx ts-node src/ml/training/generateData.ts
```

<img width="812" alt="Screenshot 2025-02-28 at 7 00 03 AM" src="https://github.com/user-attachments/assets/2fa4e232-0a8c-4354-ace0-6f77e271273c" />

2. Train the neural network model:
```bash
npx ts-node src/ml/training/trainModel.ts
```

<img width="1039" alt="Screenshot 2025-02-28 at 7 01 50 AM" src="https://github.com/user-attachments/assets/d77097e7-a224-48a3-ba90-4bcd91a1357e" />

3. Run code analysis:
```bash
npx ts-node src/ml/runAnalysis.ts
```

<img width="858" alt="Screenshot 2025-02-28 at 7 04 19 AM" src="https://github.com/user-attachments/assets/414b373b-e3c2-45bb-adec-c12b60fffa98" />

### Running the Extension

1. Open the project in VS Code
2. Press F5 to start debugging (this will open a new VS Code Development Host window)
3. In the Development Host window:
   - Press Ctrl+Shift+P (Cmd+Shift+P on macOS)
   - Search for "Open Enigma Obfuscator"
   - Select it to start using the extension

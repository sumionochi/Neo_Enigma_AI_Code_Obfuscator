# NeoEnigma Code Obfuscator

A VS Code extension that implements homomorphic encryption technique through Enigma Cipher + 7 advanced obfuscation techniques over files used to obfuscate data sent to LLMs. It enables secure interaction with LLMs while preserving data privacy, combining the classic Enigma machine algorithm with modern cryptographic methods and machine learning capabilities.

## Why NeoEnigma?

- **Data Privacy in AI Era**: With AI services like DeepSeek explicitly stating they use input data for training — raising serious privacy concerns, enterprises need robust data protection
- **Secure LLM Interaction**: Enables using AI capabilities without exposing sensitive code or data
- **Enterprise-Ready**: Designed for organizations requiring highest level of data security while leveraging AI tools

## Features

- **Homomorphic Encryption**: 
  - Enables LLMs to process encrypted data without decryption
  - Maintains data utility while ensuring privacy
  - Supports secure AI completions on obfuscated code

- **Enigma-based Obfuscation**: 
  - Implements the classic Enigma machine algorithm
  - Creates unique, reversible code transformations
  - Adds historical cryptographic strength

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
  - Secure key management
  - Access control integration
  - Audit logging capabilities

- **AI-Powered Analysis**: 
  - Uses TensorFlow.js for intelligent code analysis
  - Automatic obfuscation strategy selection
  - Security risk assessment

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

### Auto Configuration

1. Click "Auto Configure & Obfuscate"
2. The extension will:
   - Generate optimal settings using Gemini AI
   - Apply intelligent obfuscation strategies
   - Save encrypted configuration
   - Provide a secure passphrase

### AI Assistant

The extension provides two main tabs for interaction:

#### Simulation Tab
1. Configure and initialize your Enigma settings
2. Input text in the left text area to see real-time obfuscation in the right area
3. Interactive canvas displays live Enigma component states
4. Use file obfuscation buttons to process workspace files with configuration-based shifts

#### Chat Tab (Secure LLM Integration)
1. **Homomorphic-Style Encryption**:
   - Implements privacy-preserving LLM interactions
   - Enables LLMs to process obfuscated data without compromising meaning
   - Maintains completion accuracy while protecting sensitive information

2. **Technical Implementation**:
   - Utilizes reversible homomorphic transformation on input
   - Preserves semantic structure while obfuscating content
   - Enables LLM pattern recognition on encrypted data
   - Supports bidirectional obfuscation/deobfuscation

3. **Features**:
   - Real-time prompt obfuscation
   - Automatic response deobfuscation
   - Secure file attachment support
   - Context-aware encryption

4. **Usage Flow**:
   - Enter prompt in the chat input
   - System automatically applies homomorphic encryption
   - LLM processes encrypted data maintaining utility
   - Use "Deobfuscate Last Response" to reveal plain text
   - Attach obfuscated files for context-aware completions

## Supported File Types

- Python (.py)
- JavaScript (.js)
- TypeScript (.ts)
- Java (.java)
- C++ (.cpp)
- C (.c)
- HTML (.html)
- CSS (.css)

## Configuration

### Enigma Settings

- **Rotors**: Choose from I, II, III, IV, V
- **Reflectors**: A, B, C
- **Plugboard**: Custom letter pairs for additional substitution

### Machine Learning Features

The extension uses a neural network to:
- Analyze code complexity
- Assess security risks
- Evaluate performance impact
- Suggest optimal obfuscation strategies

## Security Features

### Homomorphic Encryption
- Enables computation on encrypted data
- Preserves data privacy during LLM processing
- Supports secure AI model interaction

### Configuration Security
- AES-256-GCM encrypted storage
- Secure key derivation (PBKDF2)
- Protected configuration export/import

### Code Protection
- Multiple transformation layers
- Reversible obfuscation techniques
- Metadata scrubbing

### Enterprise Features
- Access control integration
- Audit logging
- Compliance reporting
- AI-driven risk assessment

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

- **Training Process**:
  - Dataset: 100,000+ code samples across multiple languages
  - Validation Split: 20% for model evaluation
  - Early Stopping: Patience of 5 epochs
  - Batch Size: 32 samples
  - Training Duration: 100 epochs or early stopping

- **Integration Features**:
  - Real-time code analysis during editing
  - Automatic vulnerability detection
  - Obfuscation strategy recommendation
  - Performance impact prediction
  - Security risk scoring

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

#### Machine Learning Architecture

- **Model Structure**:
  - Embedding Layer: 5000 input dimensions, 64 output dimensions
  - LSTM Layers: 32 units (with sequences) + 16 units
  - Dense Layers: 8 units (ReLU) + 4 units (Sigmoid)
  - Optimizer: Adam (learning rate: 0.001)

- **Code Analysis Metrics**:
  - Complexity: Based on control structures, nesting, and operators
  - Security Risk: Detects dangerous patterns and sensitive operations
  - Performance Impact: Evaluates loops, async operations, and code size
  - Obfuscation Level: Weighted combination of other metrics

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
- Processes multiple file types (.js, .ts, .php, .rb, .c, .cpp, etc.)
- Calculates code metrics using pattern matching
- Generates JSON training data with code samples and metrics

2. Train the neural network model:
```bash
npx ts-node src/ml/training/trainModel.ts
```
- Tokenizes and pads code sequences
- Trains embedding-LSTM model for 100 epochs
- Saves model weights for code analysis

3. Run code analysis:
```bash
npx ts-node src/ml/runAnalysis.ts
```
- Loads pretrained model
- Analyzes code complexity and security risks
- Suggests optimal obfuscation strategies
- Provides detailed metrics and recommendations

### Running the Extension

1. Open the project in VS Code
2. Press F5 to start debugging (this will open a new VS Code Development Host window)
3. In the Development Host window:
   - Press Ctrl+Shift+P (Cmd+Shift+P on macOS)
   - Search for "Open Enigma Obfuscator"
   - Select it to start using the extension


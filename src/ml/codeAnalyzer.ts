import * as tf from '@tensorflow/tfjs-node';
import * as parser from '@typescript-eslint/parser';
import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { ParserOptions } from '@typescript-eslint/parser';

export class CodeAnalyzer {
  private model: tf.LayersModel;
  private readonly vectorDimension = 128;
  private readonly weightsPath = '/Users/sumionochi/Desktop/win11file/NeoEnigma/src/ml/models/pretrained_weights';

  constructor() {
    this.model = null as any;
  }

  async initialize() {
    this.model = await this.buildModel();
    await this.loadPretrainedWeights();
  }

  private async loadPretrainedWeights(): Promise<void> {
    try {
      // Check if weights file exists using Node's fs
      const modelPath = `${this.weightsPath}/model.json`;
      if (require('fs').existsSync(modelPath)) {
        // Load model with weights
        this.model = await tf.loadLayersModel(`file://${this.weightsPath}/model.json`);
      } else {
        // If no pretrained weights, initialize with random weights
        console.warn('No pretrained weights found. Using random initialization.');
        await this.model.compile({
          optimizer: 'adam',
          loss: 'meanSquaredError',
          metrics: ['accuracy']
        });
      }
    } catch (error) {
      console.error('Error loading pretrained weights:', error);
      throw new Error('Failed to load model weights');
    }
  }

  private async buildModel(): Promise<tf.LayersModel> {
    const model = tf.sequential();
    
    // Reduce matrix size to avoid slowness warnings
    model.add(tf.layers.embedding({
      inputDim: 5000, // Reduced vocabulary size
      outputDim: 64,  // Reduced dimension
      inputLength: 512
    }));

    // Optimized LSTM layers
    model.add(tf.layers.lstm({
      units: 32,
      returnSequences: true,
      recurrentInitializer: 'glorotNormal'
    }));
    
    model.add(tf.layers.lstm({
      units: 16,
      recurrentInitializer: 'glorotNormal'
    }));

    // Add dropout for better generalization
    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));

    model.add(tf.layers.dense({
      units: 4,
      activation: 'sigmoid'
    }));

    // Compile model with optimized settings
    await model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    return model;
  }

  private generateStrategies(metrics: CodeMetrics): ObfuscationStrategy[] {
    const strategies: ObfuscationStrategy[] = [];

    // More nuanced strategy generation
    if (metrics.complexity > 0.6) {
      strategies.push({
        type: 'structural',
        technique: 'controlFlowFlattening',
        intensity: Math.min(metrics.complexity * 1.2, 0.95)
      });
    }

    if (metrics.securityRisk > 0.5) {
      strategies.push({
        type: 'encryption',
        technique: 'variableEncryption',
        intensity: Math.max(metrics.securityRisk * 1.1, 0.7)
      });
    }

    if (metrics.performanceImpact < 0.6) {
      strategies.push({
        type: 'optimization',
        technique: 'deadCodeInjection',
        intensity: 0.8 - metrics.performanceImpact
      });
    }

    return strategies;
  }

  public async saveModel(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    await this.model.save(`file://${path}`);
  }

  public async trainModel(trainingData: Array<{ code: string; metrics: CodeMetrics; fileType: string}>): Promise<void> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    const xs: number[][] = [];
    const ys: number[][] = [];

    // Process training data
    for (const sample of trainingData) {
      const tokens = this.tokenizeCode(sample.code, sample.fileType);
      const paddedTokens = this.padSequence(tokens, 512);
      xs.push(paddedTokens);
      ys.push([
        sample.metrics.complexity,
        sample.metrics.securityRisk,
        sample.metrics.performanceImpact,
        sample.metrics.obfuscationLevel
      ]);
    }

    // Convert to tensors
    const inputTensor = tf.tensor2d(xs);
    const outputTensor = tf.tensor2d(ys);

    // Train the model
    await this.model.fit(inputTensor, outputTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}`);
        }
      }
    });

    // Cleanup
    inputTensor.dispose();
    outputTensor.dispose();
  }

  public async analyzeCode(code: string, fileType: string): Promise<CodeAnalysisResult> {
    try {
      const tokens = this.tokenizeCode(code, fileType);
      const paddedTokens = this.padSequence(tokens, 512);
      
      const validTokens = paddedTokens.map(t => Math.max(0, Math.min(t, 4999))); // Match reduced vocabulary size
      const inputTensor = tf.tensor2d([validTokens], [1, 512]);
      
      const prediction = await this.model.predict(inputTensor) as tf.Tensor;
      const [complexity, securityRisk, performanceImpact, obfuscationLevel] = 
        Array.from(await prediction.data());

      inputTensor.dispose();
      prediction.dispose();

      return {
        complexity,
        securityRisk,
        performanceImpact,
        obfuscationLevel,
        suggestedStrategies: this.generateStrategies({
          complexity,
          securityRisk,
          performanceImpact,
          obfuscationLevel
        })
      };
    } catch (error) {
      console.error('Analysis error:', error);
      return {
        complexity: 0.5,
        securityRisk: 0.5,
        performanceImpact: 0.5,
        obfuscationLevel: 0.5,
        suggestedStrategies: []
      };
    }
  }

  private traverseAST(node: any, callback: (node: any) => void): void {
      if (!node || typeof node !== 'object') return;
      
      callback(node);
      
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          this.traverseAST(node[key], callback);
        }
      }
    }
  
  private nodeTypeToToken(type: string): number {
    const nodeTypes = Object.values(AST_NODE_TYPES);
    const index = nodeTypes.indexOf(type as AST_NODE_TYPES);
    return index === -1 ? 0 : index % 5000; // Match vocabulary size
  }
  
  private astToTokens(node: any): number[] {
    const tokens: number[] = [];
    this.traverseAST(node, (currentNode: any) => {
      if (currentNode.type && typeof currentNode.type === 'string') {
        const token = this.nodeTypeToToken(currentNode.type);
        tokens.push(token);
      }
    });
    return tokens;
  }

  private tokenizeCode(code: string, fileType: string): number[] {
    try {
      const parserOptions: ParserOptions = {
        sourceType: 'module',
        ecmaFeatures: {
          jsx: fileType === '.tsx' || fileType === '.jsx'
        },
        ecmaVersion: 2020,
        project: undefined,
        tsconfigRootDir: undefined,  // Changed from null to undefined
        extraFileExtensions: ['.vue', '.php', '.rb', '.py'],
        parser: this.getParserForFileType(fileType)
      };
  
      // Handle non-JS/TS files differently
      if (!['.js', '.ts', '.tsx', '.jsx'].includes(fileType)) {
        return this.simpleTokenize(code);
      }
  
      const ast = parser.parse(code, parserOptions);
      const tokens = this.astToTokens(ast);
      return tokens.map((token: number) => token % 5000);
    } catch (error) {
      console.warn(`Parsing error for ${fileType} file:`, error);
      return this.simpleTokenize(code);
    }
  }

  private getParserForFileType(fileType: string): string | undefined {
    switch (fileType) {
      case '.js':
      case '.jsx':
        return '@babel/eslint-parser';
      case '.ts':
      case '.tsx':
        return '@typescript-eslint/parser';
      default:
        return undefined;
    }
  }

  private simpleTokenize(code: string): number[] {
    // Fallback tokenization for non-JS/TS files
    const tokens: number[] = [];
    const words = code.split(/[\s\n\r\t{}()[\],;=+\-*/<>!&|^%]+/);
    
    for (const word of words) {
      if (word) {
        // Create a simple hash of the word
        const hash = word.split('').reduce((acc, char) => {
          return (acc * 31 + char.charCodeAt(0)) >>> 0;
        }, 0);
        tokens.push(hash % 5000);
      }
    }
    
    return tokens.slice(0, 512); // Keep max length consistent
  }

  private padSequence(sequence: number[], maxLength: number): number[] {
    if (sequence.length > maxLength) {
      return sequence.slice(0, maxLength);
    }
    return [...sequence, ...new Array(maxLength - sequence.length).fill(0)];
  }
}

interface CodeMetrics {
  complexity: number;
  securityRisk: number;
  performanceImpact: number;
  obfuscationLevel: number;
}

interface ObfuscationStrategy {
  type: 'structural' | 'encryption' | 'optimization';
  technique: string;
  intensity: number;
}

interface CodeAnalysisResult extends CodeMetrics {
  suggestedStrategies: ObfuscationStrategy[];
}
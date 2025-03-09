import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import * as path from 'path';

async function trainModel() {
  console.log('Loading training data...');
  const trainingData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'training_data.json'), 'utf8')
  );

  // Prepare training data
  const xs = trainingData.map((sample: any) => {
    const tokens = tokenizeCode(sample.code);
    return padSequence(tokens, 512);
  });

  const ys = trainingData.map((sample: any) => [
    sample.metrics.complexity,
    sample.metrics.securityRisk,
    sample.metrics.performanceImpact,
    sample.metrics.obfuscationLevel
  ]);

  // Convert to tensors
  const inputTensor = tf.tensor2d(xs);
  const outputTensor = tf.tensor2d(ys);

  // Build and train model
  const model = await buildModel();
  
  console.log('Training model...');
  await model.fit(inputTensor, outputTensor, {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}`);
      }
    }
  });

  // Save the trained model
  const saveDir = path.join(__dirname, '..', 'models', 'pretrained_weights');
  fs.mkdirSync(saveDir, { recursive: true });
  await model.save(`file://${saveDir}`);
  console.log(`Model saved to ${saveDir}`);
}

function tokenizeCode(code: string): number[] {
  const tokens = code.split(/[\s\n\r\t{}()[\],;=+\-*/<>!&|^%]+/);
  return tokens.map(token => {
    const hash = token.split('').reduce((acc, char) => {
      return (acc * 31 + char.charCodeAt(0)) >>> 0;
    }, 0);
    return hash % 5000;
  });
}

function padSequence(sequence: number[], maxLength: number): number[] {
  if (sequence.length > maxLength) {
    return sequence.slice(0, maxLength);
  }
  return [...sequence, ...new Array(maxLength - sequence.length).fill(0)];
}

async function buildModel(): Promise<tf.LayersModel> {
  const model = tf.sequential();
  
  model.add(tf.layers.embedding({
    inputDim: 5000,
    outputDim: 64,
    inputLength: 512
  }));

  model.add(tf.layers.lstm({
    units: 32,
    returnSequences: true
  }));
  
  model.add(tf.layers.lstm({
    units: 16
  }));

  model.add(tf.layers.dense({
    units: 8,
    activation: 'relu'
  }));

  model.add(tf.layers.dense({
    units: 4,
    activation: 'sigmoid'
  }));

  await model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['accuracy']
  });

  return model;
}

trainModel().catch(console.error);
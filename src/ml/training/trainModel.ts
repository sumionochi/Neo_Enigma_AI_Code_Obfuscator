import { CodeAnalyzer } from '../codeAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

export async function trainModel() {
  const analyzer = new CodeAnalyzer();
  await analyzer.initialize();
  
  // Load training data and train
  const trainingDataPath = path.join(__dirname, 'data', 'training_data.json');
  if (!fs.existsSync(trainingDataPath)) {
    throw new Error('Training data not found');
  }
  
  const trainingData = require(trainingDataPath);
  
  // Save the trained model
  const modelPath = '/Users/sumionochi/Desktop/win11file/NeoEnigma/src/ml/models/pretrained_weights';
  await analyzer.saveModel(modelPath);
}
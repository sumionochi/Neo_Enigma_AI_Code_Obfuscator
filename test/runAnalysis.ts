import { CodeAnalyzer } from '../src/ml/codeAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

async function runAnalysis() {
  console.log('Initializing code analyzer...');
  const analyzer = new CodeAnalyzer();
  await analyzer.initialize();

  // First train the model with samples
  console.log('Training model with samples...');
  const trainingDataPath = path.join(__dirname, '../src/ml/training/data/training_data.json');
  if (!fs.existsSync(trainingDataPath)) {
    console.error('No training data found. Please run processTrainingSamples.ts first.');
    return;
  }

  const trainingData = JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));
  await analyzer.trainModel(trainingData);
  console.log('Model training completed.');

  // Then analyze the code
  console.log('\nAnalyzing code...');
  const samplePath = path.join(__dirname, 'samples/sample.ts');
  const code = fs.readFileSync(samplePath, 'utf8');
  
  const result = await analyzer.analyzeCode(code);

  console.log('\nAnalysis Results:');
  console.log('================');
  console.log(`Complexity: ${(result.complexity * 100).toFixed(2)}%`);
  console.log(`Security Risk: ${(result.securityRisk * 100).toFixed(2)}%`);
  console.log(`Performance Impact: ${(result.performanceImpact * 100).toFixed(2)}%`);
  console.log(`Obfuscation Level: ${(result.obfuscationLevel * 100).toFixed(2)}%`);

  console.log('\nRecommended Strategies:');
  console.log('=====================');
  result.suggestedStrategies.forEach((strategy, index) => {
    console.log(`${index + 1}. ${strategy.type.toUpperCase()}:`);
    console.log(`   - Technique: ${strategy.technique}`);
    console.log(`   - Intensity: ${(strategy.intensity * 100).toFixed(2)}%`);
  });
}

runAnalysis().catch(console.error);
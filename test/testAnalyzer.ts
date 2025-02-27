import { CodeAnalyzer } from '../src/ml/codeAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

async function runAnalysis() {
  try {
    console.log('Initializing code analyzer...');
    const analyzer = new CodeAnalyzer();
    await analyzer.initialize();

    // Read sample code
    const samplePath = path.join(__dirname, 'samples/sample.ts');
    if (!fs.existsSync(samplePath)) {
      throw new Error('Sample code file not found. Please create test/samples/sample.ts');
    }

    const sampleCode = fs.readFileSync(samplePath, 'utf8');

    console.log('Analyzing code...\n');
    const analysis = await analyzer.analyzeCode(sampleCode);
    
    console.log('Analysis Results:');
    console.log('================');
    console.log(`Complexity: ${(analysis.complexity * 100).toFixed(2)}%`);
    console.log(`Security Risk: ${(analysis.securityRisk * 100).toFixed(2)}%`);
    console.log(`Performance Impact: ${(analysis.performanceImpact * 100).toFixed(2)}%`);
    console.log(`Obfuscation Level: ${(analysis.obfuscationLevel * 100).toFixed(2)}%`);
    
    if (analysis.suggestedStrategies.length > 0) {
      console.log('\nRecommended Strategies:');
      console.log('=====================');
      analysis.suggestedStrategies.forEach((strategy, index) => {
        console.log(`${index + 1}. ${strategy.type.toUpperCase()}:`);
        console.log(`   - Technique: ${strategy.technique}`);
        console.log(`   - Intensity: ${(strategy.intensity * 100).toFixed(2)}%`);
      });
    }
  } catch (error) {
    console.error('Analysis failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

runAnalysis().catch(console.error);
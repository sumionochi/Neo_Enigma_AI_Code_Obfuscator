import { CodeAnalyzer } from './codeAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    // Initialize the analyzer
    console.log('Initializing code analyzer...');
    const analyzer = new CodeAnalyzer();
    await analyzer.initialize();

    // Read test code
    const testCode = fs.readFileSync(
      path.join(__dirname, '../../test/samples/testCode.ts'),
      'utf8'
    );

    // Run analysis
    console.log('Analyzing code...');
    const analysis = await analyzer.analyzeCode(testCode);

    // Display results
    console.log('\nAnalysis Results:');
    console.log('================');
    console.log(`Complexity Score: ${(analysis.complexity * 100).toFixed(2)}%`);
    console.log(`Security Risk: ${(analysis.securityRisk * 100).toFixed(2)}%`);
    console.log(`Performance Impact: ${(analysis.performanceImpact * 100).toFixed(2)}%`);
    console.log(`Recommended Obfuscation Level: ${(analysis.obfuscationLevel * 100).toFixed(2)}%`);

    console.log('\nRecommended Strategies:');
    console.log('=====================');
    analysis.suggestedStrategies.forEach((strategy, index) => {
      console.log(`${index + 1}. ${strategy.type.toUpperCase()} Strategy:`);
      console.log(`   - Technique: ${strategy.technique}`);
      console.log(`   - Intensity: ${(strategy.intensity * 100).toFixed(2)}%`);
    });

  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

main();
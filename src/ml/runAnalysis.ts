import { CodeAnalyzer } from './codeAnalyzer';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

async function main() {
  try {
    // Initialize the analyzer
    console.log('Initializing code analyzer...');
    const analyzer = new CodeAnalyzer();
    await analyzer.initialize();

    // Setup readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Get file path from user
    const filePath = await new Promise<string>((resolve) => {
      rl.question('Enter the path to the file you want to analyze: ', (answer) => {
        resolve(answer);
      });
    });

    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      rl.close();
      return;
    }

    // Read selected file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileType = path.extname(filePath);

    // Run analysis
    console.log(`\nAnalyzing ${path.basename(filePath)}...`);
    const analysis = await analyzer.analyzeCode(fileContent, fileType);

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

    rl.close();
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

main();
import * as fs from 'fs';
import * as path from 'path';

interface CodeSample {
  code: string;
  metrics: {
    complexity: number;
    securityRisk: number;
    performanceImpact: number;
    obfuscationLevel: number;
  };
  fileType: string;
}

function calculateMetrics(code: string, fileType: string) {
  // Calculate complexity based on more code patterns
  const complexity = Math.min(
    ((code.match(/if|for|while|switch|catch|try|function|class|method/g) || []).length * 0.1 +
    (code.match(/\{|\}/g) || []).length * 0.05 +
    (code.match(/\?|:/g) || []).length * 0.05 +
    (code.match(/&&|\|\|/g) || []).length * 0.05) / 3,
    1
  );

  // Calculate security risk based on dangerous patterns
  const securityRisk = Math.min(
    ((code.match(/exec|eval|system|shell|innerHTML|dangerouslySetInnerHTML/g) || []).length * 0.3 +
    (code.match(/password|secret|key|token|auth|credential/g) || []).length * 0.2 +
    (code.match(/sql|query|database|select|insert|update|delete/g) || []).length * 0.2 +
    (code.match(/strcpy|strcat|sprintf|scanf|gets/g) || []).length * 0.3) / 2,
    1
  );

  // Calculate performance impact
  const performanceImpact = Math.min(
    ((code.match(/for|while|do/g) || []).length * 0.2 +
    (code.match(/\.[map|filter|reduce|forEach]/g) || []).length * 0.15 +
    (code.match(/async|await|Promise|setTimeout|setInterval/g) || []).length * 0.15 +
    code.length * 0.0001) / 2,
    1
  );

  // Calculate recommended obfuscation level
  const obfuscationLevel = Math.min(
    (complexity * 0.4 + securityRisk * 0.4 + performanceImpact * 0.2),
    1
  );

  return {
    complexity,
    securityRisk,
    performanceImpact,
    obfuscationLevel
  };
}

async function generateTrainingData() {
  const samplesDir = path.join(__dirname, '../../../test/samples');
  const supportedExtensions = [
    '.js', '.ts', '.tsx', '.php', '.rb', 
    '.c', '.cpp', '.cs', '.asp', '.aspx'
  ];
  
  const samples: CodeSample[] = [];

  function processDirectory(dir: string) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (supportedExtensions.includes(ext)) {
          console.log(`Processing ${path.basename(dir)}/${item}`);
          const code = fs.readFileSync(fullPath, 'utf8');
          samples.push({
            code,
            metrics: calculateMetrics(code, ext),
            fileType: ext
          });
        }
      }
    }
  }

  console.log('Scanning sample directories...');
  processDirectory(samplesDir);
  console.log(`Found ${samples.length} valid samples`);

  // Save the training data
  const outputPath = path.join(__dirname, 'data', 'training_data.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(samples, null, 2));
  console.log(`Training data saved to ${outputPath}`);
}

generateTrainingData().catch(error => {
  console.error('Generation failed:', error);
  process.exit(1);
});
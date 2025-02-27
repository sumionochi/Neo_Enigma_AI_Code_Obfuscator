import * as fs from 'fs';
import * as path from 'path';

async function generateTrainingData() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Sample training data with labeled metrics
  const trainingData = [
    {
      code: `
        function sensitiveData() {
          const password = "hardcoded123";
          return password;
        }
      `,
      metrics: {
        complexity: 0.3,
        securityRisk: 0.9,
        performanceImpact: 0.2,
        obfuscationLevel: 0.8
      }
    },
    {
      code: `
        async function complexOperation(data) {
          let result = 0;
          for(let i = 0; i < data.length; i++) {
            if(data[i] > 0) {
              result += await processItem(data[i]);
            }
          }
          return result;
        }
      `,
      metrics: {
        complexity: 0.8,
        securityRisk: 0.4,
        performanceImpact: 0.7,
        obfuscationLevel: 0.6
      }
    }
    // Add more training samples...
  ];

  fs.writeFileSync(
    path.join(dataDir, 'training_data.json'),
    JSON.stringify(trainingData, null, 2)
  );
}

generateTrainingData().catch(console.error);
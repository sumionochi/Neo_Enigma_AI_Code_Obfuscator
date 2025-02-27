import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@typescript-eslint/parser';
import { AST_NODE_TYPES } from '@typescript-eslint/types';

interface VulnerabilityMetrics {
  complexity: number;
  securityRisk: number;
  performanceImpact: number;
  obfuscationLevel: number;
}

interface TrainingDataItem {
  code: string;
  metrics: VulnerabilityMetrics;
  category: string;
  file: string;
}

function getLanguageParser(fileExtension: string) {
  switch (fileExtension) {
    case '.js':
      return (code: string) => parser.parse(code, {
        sourceType: 'script', // Proper config for JS
        ecmaVersion: 2020,
        ecmaFeatures: { jsx: true }
      });
    case '.ts':
      return parser.parse;
    case '.php':
      return (code: string) => ({ type: 'Program', body: code });
    case '.rb':
      return (code: string) => ({ type: 'Program', body: code });
    case '.c':
    case '.cpp':
      return (code: string) => ({ type: 'Program', body: code });
    case '.cs':
      return (code: string) => ({ type: 'Program', body: code });
    case '.asp':
    case '.aspx':
      return (code: string) => ({ type: 'Program', body: code });
    default:
      return (code: string) => ({ type: 'Program', body: code });
  }
}

// Add type definition for supported file extensions
type SupportedExtension = '.js' | '.php' | '.rb' | '.c' | '.cpp' | '.cs' | '.asp';

function analyzeCodeComplexity(code: string, fileExtension: string): VulnerabilityMetrics {
  try {
    const parseCode = getLanguageParser(fileExtension);
    const ast = parseCode(code);
    
    let complexity = 0;
    let securityRisk = 0;
    let performanceImpact = 0;

    // Language-specific patterns with proper typing
    const patterns = {
      securityRisks: {
        '.js': ['eval', 'exec', 'innerHTML', 'document.write'],
        '.php': ['eval', 'exec', 'shell_exec', 'system'],
        '.rb': ['eval', 'exec', 'system', 'send'],
        '.c': ['gets', 'strcpy', 'strcat', 'sprintf'],
        '.cpp': ['gets', 'strcpy', 'strcat', 'sprintf'],
        '.cs': ['System.Diagnostics.Process.Start', 'Execute', 'ExecuteReader', 'SqlCommand', 'cmd.exe'],
        '.asp': ['Execute', 'ExecuteGlobal', 'Response.Write', 'Server.CreateObject']
      } as Record<SupportedExtension, string[]>,
      
      vulnerablePatterns: {
        sql: /(?:SELECT|INSERT|UPDATE|DELETE).*(?:FROM|INTO|WHERE)/i,
        xss: /<script>|document\.|innerHTML/i,
        commandInjection: /exec|eval|system|shell/i,
        fileOperations: /(?:read|write)File|fopen|file_get_contents/i,
        csharpInjection: /Process\.Start|ExecuteNonQuery|cmd\.exe/i,
        aspInjection: /Execute|ExecuteGlobal|CreateObject/i
      }
    };

    function analyzePatterns(code: string): number {
      let riskScore = 0;
      const risks = patterns.securityRisks[fileExtension as SupportedExtension] || [];
      risks.forEach((risk: string) => {
        if (code.includes(risk)) riskScore += 0.2;
      });
      Object.values(patterns.vulnerablePatterns).forEach((pattern: RegExp) => {
        if (pattern.test(code)) riskScore += 0.15;
      });
      return Math.min(riskScore, 1);
    }

    function analyzeComplexity(code: string): number {
      let score = 0;
      score += (code.match(/if|for|while|switch|catch/g) || []).length * 0.1;
      score += (code.match(/\{[^{}]*\{/g) || []).length * 0.15;
      score += (code.match(/function|def|void/g) || []).length * 0.05;
      if (fileExtension === '.cs' || fileExtension === '.asp' || fileExtension === '.aspx') {
        score += (code.match(/public|private|protected|internal/g) || []).length * 0.05;
        score += (code.match(/class|interface|struct/g) || []).length * 0.1;
        score += (code.match(/using|try|catch|finally/g) || []).length * 0.08;
        score += (code.match(/async|await/g) || []).length * 0.1;
      }
      return Math.min(score, 1);
    }

    function analyzePerformance(code: string): number {
      let score = 0;
      score += (code.match(/for|while|do/g) || []).length * 0.1;
      score += (code.match(/map|reduce|filter|forEach/g) || []).length * 0.08;
      score += (code.match(/function\s+(\w+)[\s\S]*?\1\s*\(/g) || []).length * 0.15;
      if (fileExtension === '.cs' || fileExtension === '.asp' || fileExtension === '.aspx') {
        score += (code.match(/Parallel\.|Task\.|async|await/g) || []).length * 0.1;
        score += (code.match(/\.ToList\(\)|\.ToArray\(\)/g) || []).length * 0.08;
        score += (code.match(/Select|Where|OrderBy|GroupBy/g) || []).length * 0.05;
        score += (code.match(/Session\[|Application\[|Cache\[/g) || []).length * 0.15;
      }
      return Math.min(score, 1);
    }

    securityRisk = analyzePatterns(code);
    complexity = analyzeComplexity(code);
    performanceImpact = analyzePerformance(code);

    return {
      complexity,
      securityRisk,
      performanceImpact,
      obfuscationLevel: Math.min((complexity + securityRisk * 1.5) / 2, 1)
    };
  } catch (error) {
    console.warn(`Error analyzing ${fileExtension} code:`, error);
    return {
      complexity: 0.5,
      securityRisk: 0.5,
      performanceImpact: 0.5,
      obfuscationLevel: 0.5
    };
  }
}

async function processTrainingSamples() {
  const samplesDir = path.join(__dirname, '../../../test/samples');
  const trainingData: TrainingDataItem[] = [];

  const categories = fs.readdirSync(samplesDir);
  for (const category of categories) {
    const categoryPath = path.join(samplesDir, category);
    if (fs.statSync(categoryPath).isDirectory()) {
      const files = fs.readdirSync(categoryPath);
      for (const file of files) {
        const fileExtension = path.extname(file);
        if (!fileExtension || fs.statSync(path.join(categoryPath, file)).isDirectory()) {
          continue;
        }
        try {
          const filePath = path.join(categoryPath, file);
          const code = fs.readFileSync(filePath, 'utf8');
          const metrics = analyzeCodeComplexity(code, fileExtension);
          trainingData.push({
            code,
            metrics,
            category,
            file
          });
        } catch (error) {
          console.warn(`Error processing file ${file}:`, error);
          continue;
        }
      }
    }
  }

  const outputPath = path.join(__dirname, 'data', 'training_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(trainingData, null, 2));
  console.log(`Processed ${trainingData.length} training samples`);
  console.log('Training data saved to:', outputPath);
}

processTrainingSamples().catch(console.error);
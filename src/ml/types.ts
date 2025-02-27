export interface CodeMetrics {
  complexity: number;
  securityRisk: number;
  performanceImpact: number;
  obfuscationLevel: number;
}

export interface ObfuscationStrategy {
  type: 'structural' | 'encryption' | 'optimization';
  technique: string;
  intensity: number;
}

export interface CodeAnalysisResult extends CodeMetrics {
  suggestedStrategies: ObfuscationStrategy[];
}
/**
 * Utilitários para cálculos estatísticos do FieldFocus
 * Implementa todas as fórmulas especificadas na documentação funcional
 */

// Tabela de valores Z para níveis de confiança
export const Z_SCORES = {
  90: 1.645,
  95: 1.96,
  99: 2.576
} as const;

export type ConfidenceLevel = keyof typeof Z_SCORES;

/**
 * Calcula o tamanho da amostra para população infinita
 * Fórmula: n = (Z² × p × (1-p)) / e²
 */
export function calculateBaseSample(
  confidenceLevel: ConfidenceLevel,
  marginError: number,
  expectedProportion: number = 0.5
): number {
  const z = Z_SCORES[confidenceLevel];
  const e = marginError / 100; // Converter percentual para decimal
  const p = expectedProportion;
  
  const numerator = z * z * p * (1 - p);
  const denominator = e * e;
  
  const baseSample = numerator / denominator;
  
  return Math.ceil(baseSample);
}

/**
 * Aplica correção para população finita
 * Fórmula: n_final = n_base / (1 + (n_base - 1) / N)
 */
export function applyFinitePopulationCorrection(
  baseSample: number,
  populationSize: number
): number {
  if (populationSize <= 10000) {
    const correction = 1 + (baseSample - 1) / populationSize;
    const finalSample = baseSample / correction;
    return Math.ceil(finalSample);
  }
  
  return baseSample;
}

/**
 * Calcula o tamanho final da amostra
 */
export function calculateSampleSize(
  confidenceLevel: ConfidenceLevel,
  marginError: number,
  expectedProportion: number = 0.5,
  populationSize?: number
): {
  baseSample: number;
  finalSample: number;
  zScore: number;
  correctionApplied: boolean;
} {
  const baseSample = calculateBaseSample(confidenceLevel, marginError, expectedProportion);
  const zScore = Z_SCORES[confidenceLevel];
  
  let finalSample = baseSample;
  let correctionApplied = false;
  
  if (populationSize && populationSize <= 10000) {
    finalSample = applyFinitePopulationCorrection(baseSample, populationSize);
    correctionApplied = true;
  }
  
  return {
    baseSample,
    finalSample,
    zScore,
    correctionApplied
  };
}

/**
 * Calcula cotas para estratificação proporcional
 * Fórmula: n_i = n_final × (N_i / N_total)
 */
export function calculateStratifiedQuotas(
  totalSample: number,
  strata: Array<{ id: string; name: string; population: number }>
): Array<{
  id: string;
  name: string;
  population: number;
  quota: number;
  percentage: number;
  isValid: boolean;
  warning?: string;
}> {
  const totalPopulation = strata.reduce((sum, stratum) => sum + stratum.population, 0);
  
  let quotas = strata.map(stratum => {
    const percentage = stratum.population / totalPopulation;
    const rawQuota = totalSample * percentage;
    const quota = Math.round(rawQuota);
    
    return {
      id: stratum.id,
      name: stratum.name,
      population: stratum.population,
      quota,
      percentage: percentage * 100,
      rawQuota,
      isValid: quota >= 30,
      warning: quota < 30 ? `Estrato com menos de 30 entrevistas (${quota}). Não recomendado.` : undefined
    };
  });
  
  // Ajustar diferenças de arredondamento
  const totalQuotas = quotas.reduce((sum, q) => sum + q.quota, 0);
  const difference = totalSample - totalQuotas;
  
  if (difference !== 0) {
    // Ajustar na maior cota
    const largestQuotaIndex = quotas.reduce((maxIndex, quota, index) => 
      quota.quota > quotas[maxIndex].quota ? index : maxIndex, 0
    );
    
    quotas[largestQuotaIndex].quota += difference;
  }
  
  return quotas.map(({ rawQuota, ...quota }) => quota);
}

/**
 * Calcula carga de trabalho da equipe
 */
export function calculateWorkload(
  totalSample: number,
  fieldDays: number,
  numberOfResearchers: number
): {
  interviewsPerDay: number;
  interviewsPerResearcher: number;
  workloadLevel: 'optimal' | 'intense' | 'excessive';
  color: string;
  message: string;
} {
  const interviewsPerDay = totalSample / fieldDays;
  const interviewsPerResearcher = interviewsPerDay / numberOfResearchers;
  
  let workloadLevel: 'optimal' | 'intense' | 'excessive';
  let color: string;
  let message: string;
  
  if (interviewsPerResearcher < 15) {
    workloadLevel = 'optimal';
    color = '#10B981'; // Verde
    message = 'Carga de trabalho ótima';
  } else if (interviewsPerResearcher <= 25) {
    workloadLevel = 'intense';
    color = '#F59E0B'; // Amarelo
    message = 'Carga de trabalho intensa, mas viável';
  } else {
    workloadLevel = 'excessive';
    color = '#EF4444'; // Vermelho
    message = 'Carga de trabalho muito alta, risco de não cumprimento';
  }
  
  return {
    interviewsPerDay: Math.round(interviewsPerDay * 100) / 100,
    interviewsPerResearcher: Math.round(interviewsPerResearcher * 100) / 100,
    workloadLevel,
    color,
    message
  };
}

/**
 * Calcula intervalo de confiança para uma proporção observada
 * Fórmula: IC = p_obs ± Z × √(p_obs × (1 - p_obs) / n)
 */
export function calculateConfidenceInterval(
  observedProportion: number,
  sampleSize: number,
  confidenceLevel: ConfidenceLevel
): {
  lower: number;
  upper: number;
  marginError: number;
} {
  const z = Z_SCORES[confidenceLevel];
  const p = observedProportion;
  const n = sampleSize;
  
  const standardError = Math.sqrt((p * (1 - p)) / n);
  const marginError = z * standardError;
  
  const lower = Math.max(0, p - marginError);
  const upper = Math.min(1, p + marginError);
  
  return {
    lower: Math.round(lower * 1000) / 10, // Converter para percentual com 1 casa decimal
    upper: Math.round(upper * 1000) / 10,
    marginError: Math.round(marginError * 1000) / 10
  };
}

/**
 * Analisa resultados de uma pergunta de múltipla escolha
 */
export function analyzeQuestionResults(
  responses: string[],
  options: string[],
  confidenceLevel: ConfidenceLevel
): Array<{
  option: string;
  count: number;
  percentage: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    marginError: number;
  };
}> {
  const totalResponses = responses.length;
  
  return options.map(option => {
    const count = responses.filter(response => response === option).length;
    const percentage = (count / totalResponses) * 100;
    const proportion = count / totalResponses;
    
    const confidenceInterval = calculateConfidenceInterval(
      proportion,
      totalResponses,
      confidenceLevel
    );
    
    return {
      option,
      count,
      percentage: Math.round(percentage * 10) / 10,
      confidenceInterval
    };
  });
}
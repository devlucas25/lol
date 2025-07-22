/**
 * Utilitários para cálculos estatísticos do FieldFocus
 * Implementa todas as fórmulas especificadas na documentação funcional
 */

// Tabela de valores Z para níveis de confiança (FIXA NO SISTEMA)
export const Z_SCORES = {
  90: 1.645,
  95: 1.96,
  99: 2.576
} as const;

export type ConfidenceLevel = keyof typeof Z_SCORES;

/**
 * Calcula o tamanho da amostra para população infinita
 * Fórmula: n_base = (Z² × p × (1-p)) / e²
 */
export function calculateBaseSample(
  confidenceLevel: ConfidenceLevel,
  marginError: number,
  expectedProportion: number = 0.5 // Padrão 0.5 para máxima segurança estatística
): {
  baseSample: number;
  zScore: number;
  calculation: {
    z: number;
    p: number;
    e: number;
    numerator: number;
    denominator: number;
  };
} {
  const z = Z_SCORES[confidenceLevel];
  const e = marginError / 100; // Converter percentual para decimal
  const p = expectedProportion;
  
  const numerator = z * z * p * (1 - p);
  const denominator = e * e;
  
  const baseSample = numerator / denominator;
  
  return {
    baseSample: Math.ceil(baseSample),
    zScore: z,
    calculation: {
      z,
      p,
      e,
      numerator,
      denominator
    }
  };
}

/**
 * Aplica correção para população finita
 * Fórmula: n_final = n_base / (1 + (n_base - 1) / N)
 * REGRA: Só aplicar se N <= 10.000
 */
export function applyFinitePopulationCorrection(
  baseSample: number,
  populationSize: number
): {
  finalSample: number;
  correctionApplied: boolean;
  correctionFactor: number;
} {
  if (populationSize > 10000) {
    return {
      finalSample: baseSample,
      correctionApplied: false,
      correctionFactor: 1
    };
  }
  
  const correctionFactor = 1 + (baseSample - 1) / populationSize;
  const finalSample = baseSample / correctionFactor;
  
  return {
    finalSample: Math.ceil(finalSample),
    correctionApplied: true,
    correctionFactor
  };
}

/**
 * Calcula o tamanho final da amostra com todos os detalhes
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
  details: {
    z: number;
    p: number;
    e: number;
    numerator: number;
    denominator: number;
    correctionFactor?: number;
  };
} {
  // Validações de entrada
  if (marginError < 1 || marginError > 10) {
    throw new Error('Margem de erro deve estar entre 1% e 10%');
  }
  
  if (expectedProportion < 0.01 || expectedProportion > 0.99) {
    throw new Error('Proporção esperada deve estar entre 1% e 99%');
  }
  
  const baseResult = calculateBaseSample(confidenceLevel, marginError, expectedProportion);
  
  let finalSample = baseResult.baseSample;
  let correctionApplied = false;
  let correctionFactor: number | undefined;
  
  if (populationSize && populationSize > 10) {
    const correctionResult = applyFinitePopulationCorrection(baseResult.baseSample, populationSize);
    finalSample = correctionResult.finalSample;
    correctionApplied = correctionResult.correctionApplied;
    correctionFactor = correctionResult.correctionFactor;
  }
  
  return {
    baseSample: baseResult.baseSample,
    finalSample,
    zScore: baseResult.zScore,
    correctionApplied,
    details: {
      ...baseResult.calculation,
      correctionFactor
    }
  };
}

/**
 * Calcula cotas para estratificação proporcional
 * Fórmula: n_i = n_final × (N_i / N_total)
 * REGRAS DE VALIDAÇÃO E ARREDONDAMENTO
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
  if (strata.length === 0) {
    throw new Error('Pelo menos um estrato deve ser definido');
  }
  
  const totalPopulation = strata.reduce((sum, stratum) => sum + stratum.population, 0);
  
  if (totalPopulation === 0) {
    throw new Error('População total dos estratos não pode ser zero');
  }
  
  // Calcular cotas brutas
  let quotas = strata.map(stratum => {
    const percentage = (stratum.population / totalPopulation) * 100;
    const rawQuota = totalSample * (stratum.population / totalPopulation);
    const quota = Math.round(rawQuota);
    
    return {
      id: stratum.id,
      name: stratum.name,
      population: stratum.population,
      quota,
      percentage,
      rawQuota,
      isValid: quota >= 30, // REGRA: Mínimo 30 entrevistas por estrato
      warning: quota < 30 ? `Estrato com menos de 30 entrevistas (${quota}). Não recomendado para validade estatística.` : undefined
    };
  });
  
  // REGRA DE ARREDONDAMENTO: Ajustar diferenças para que a soma seja exata
  const totalQuotas = quotas.reduce((sum, q) => sum + q.quota, 0);
  const difference = totalSample - totalQuotas;
  
  if (difference !== 0) {
    // Ajustar na maior cota (estratégia conservadora)
    const largestQuotaIndex = quotas.reduce((maxIndex, quota, index) => 
      quota.quota > quotas[maxIndex].quota ? index : maxIndex, 0
    );
    
    quotas[largestQuotaIndex].quota += difference;
    
    // Recalcular validação após ajuste
    quotas[largestQuotaIndex].isValid = quotas[largestQuotaIndex].quota >= 30;
    if (quotas[largestQuotaIndex].quota < 30) {
      quotas[largestQuotaIndex].warning = `Estrato com menos de 30 entrevistas (${quotas[largestQuotaIndex].quota}). Não recomendado para validade estatística.`;
    }
  }
  
  return quotas.map(({ rawQuota, ...quota }) => quota);
}

/**
 * Calcula carga de trabalho da equipe
 * Fórmula: Entrevistas por dia por pesquisador = n_final / (dias × pesquisadores)
 * REGRAS DE FEEDBACK VISUAL POR CORES
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
  details: {
    totalSample: number;
    fieldDays: number;
    numberOfResearchers: number;
  };
} {
  if (fieldDays <= 0 || numberOfResearchers <= 0) {
    throw new Error('Dias de campo e número de pesquisadores devem ser maiores que zero');
  }
  
  const interviewsPerDay = totalSample / fieldDays;
  const interviewsPerResearcher = interviewsPerDay / numberOfResearchers;
  
  // REGRAS DE FEEDBACK VISUAL
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
    message,
    details: {
      totalSample,
      fieldDays,
      numberOfResearchers
    }
  };
}

/**
 * Calcula intervalo de confiança para uma proporção observada
 * Fórmula: IC = p_obs ± Z × √(p_obs × (1 - p_obs) / n_real)
 */
export function calculateConfidenceInterval(
  observedProportion: number,
  sampleSize: number,
  confidenceLevel: ConfidenceLevel
): {
  lower: number;
  upper: number;
  marginError: number;
  details: {
    observedProportion: number;
    sampleSize: number;
    zScore: number;
    standardError: number;
  };
} {
  if (sampleSize <= 0) {
    throw new Error('Tamanho da amostra deve ser maior que zero');
  }
  
  if (observedProportion < 0 || observedProportion > 1) {
    throw new Error('Proporção observada deve estar entre 0 e 1');
  }
  
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
    marginError: Math.round(marginError * 1000) / 10,
    details: {
      observedProportion: p,
      sampleSize: n,
      zScore: z,
      standardError
    }
  };
}

/**
 * Analisa resultados de uma pergunta de múltipla escolha
 * Calcula intervalos de confiança para cada opção
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
  
  if (totalResponses === 0) {
    return options.map(option => ({
      option,
      count: 0,
      percentage: 0,
      confidenceInterval: {
        lower: 0,
        upper: 0,
        marginError: 0
      }
    }));
  }
  
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
      confidenceInterval: {
        lower: confidenceInterval.lower,
        upper: confidenceInterval.upper,
        marginError: confidenceInterval.marginError
      }
    };
  });
}

/**
 * Valida se os parâmetros estatísticos estão dentro dos limites aceitáveis
 */
export function validateStatisticalParameters(
  confidenceLevel: ConfidenceLevel,
  marginError: number,
  expectedProportion: number,
  populationSize?: number
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validar margem de erro
  if (marginError < 1 || marginError > 10) {
    errors.push('Margem de erro deve estar entre 1% e 10%');
  }
  
  // Validar proporção esperada
  if (expectedProportion < 0.01 || expectedProportion > 0.99) {
    errors.push('Proporção esperada deve estar entre 1% e 99%');
  }
  
  // Avisos sobre proporção esperada
  if (expectedProportion !== 0.5) {
    warnings.push('Recomenda-se usar 50% para máxima segurança estatística quando não há informação prévia');
  }
  
  // Validar população
  if (populationSize !== undefined && populationSize <= 0) {
    errors.push('Tamanho da população deve ser maior que zero');
  }
  
  // Avisos sobre população
  if (populationSize && populationSize <= 10000) {
    warnings.push('População finita detectada. Correção será aplicada automaticamente.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
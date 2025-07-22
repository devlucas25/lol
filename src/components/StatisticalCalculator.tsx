import React, { useState, useEffect } from 'react';
import { Calculator, Info, AlertTriangle } from 'lucide-react';
import { calculateSampleSize, calculateStratifiedQuotas, calculateWorkload, type ConfidenceLevel } from '../utils/statistical';

interface StatisticalCalculatorProps {
  onCalculationComplete: (result: {
    sampleSize: number;
    quotas: Array<{
      id: string;
      name: string;
      population: number;
      quota: number;
      percentage: number;
      isValid: boolean;
      warning?: string;
    }>;
    workload: {
      interviewsPerDay: number;
      interviewsPerResearcher: number;
      workloadLevel: 'optimal' | 'intense' | 'excessive';
      color: string;
      message: string;
    };
  }) => void;
}

export function StatisticalCalculator({ onCalculationComplete }: StatisticalCalculatorProps) {
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>(95);
  const [marginError, setMarginError] = useState(5);
  const [expectedProportion, setExpectedProportion] = useState(50);
  const [populationSize, setPopulationSize] = useState<number | undefined>();
  const [fieldDays, setFieldDays] = useState(7);
  const [numberOfResearchers, setNumberOfResearchers] = useState(3);
  
  const [areas, setAreas] = useState([
    { id: '1', name: 'Centro', population: 4000 },
    { id: '2', name: 'Zona Norte', population: 3000 },
    { id: '3', name: 'Zona Sul', population: 3000 }
  ]);

  const [calculation, setCalculation] = useState<any>(null);

  useEffect(() => {
    // Recalcular automaticamente quando os parâmetros mudarem
    const sampleResult = calculateSampleSize(
      confidenceLevel,
      marginError,
      expectedProportion / 100,
      populationSize
    );

    const quotas = calculateStratifiedQuotas(sampleResult.finalSample, areas);
    const workload = calculateWorkload(sampleResult.finalSample, fieldDays, numberOfResearchers);

    const result = {
      sampleSize: sampleResult.finalSample,
      quotas,
      workload,
      details: sampleResult
    };

    setCalculation(result);
    onCalculationComplete(result);
  }, [confidenceLevel, marginError, expectedProportion, populationSize, fieldDays, numberOfResearchers, areas, onCalculationComplete]);

  const addArea = () => {
    const newId = (areas.length + 1).toString();
    setAreas([...areas, { id: newId, name: `Área ${newId}`, population: 1000 }]);
  };

  const updateArea = (id: string, field: 'name' | 'population', value: string | number) => {
    setAreas(areas.map(area => 
      area.id === id ? { ...area, [field]: value } : area
    ));
  };

  const removeArea = (id: string) => {
    if (areas.length > 1) {
      setAreas(areas.filter(area => area.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Parâmetros Estatísticos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Parâmetros Estatísticos</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível de Confiança
            </label>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(Number(e.target.value) as ConfidenceLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={90}>90% (Z = 1.645)</option>
              <option value={95}>95% (Z = 1.96)</option>
              <option value={99}>99% (Z = 2.576)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Margem de Erro (%)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={marginError}
              onChange={(e) => setMarginError(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proporção Esperada (%)
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={expectedProportion}
              onChange={(e) => setExpectedProportion(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use 50% para máxima segurança estatística
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanho da População (opcional)
            </label>
            <input
              type="number"
              min="1"
              value={populationSize || ''}
              onChange={(e) => setPopulationSize(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Deixe vazio para população infinita"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {calculation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Resultado do Cálculo</span>
            </div>
            <p className="text-lg font-bold text-blue-900">
              Tamanho da Amostra: {calculation.sampleSize} entrevistas
            </p>
            <div className="text-xs text-blue-700 mt-1 space-y-1">
              <p>Amostra base: {calculation.details.baseSample}</p>
              {calculation.details.correctionApplied && (
                <p>Correção para população finita aplicada</p>
              )}
              <p>Z-score: {calculation.details.zScore}</p>
            </div>
          </div>
        )}
      </div>

      {/* Estratificação Geográfica */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Estratificação Geográfica</h3>
          <button
            onClick={addArea}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Adicionar Área
          </button>
        </div>

        <div className="space-y-3">
          {areas.map((area) => (
            <div key={area.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
              <input
                type="text"
                value={area.name}
                onChange={(e) => updateArea(area.id, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome da área"
              />
              <input
                type="number"
                min="1"
                value={area.population}
                onChange={(e) => updateArea(area.id, 'population', Number(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="População"
              />
              {areas.length > 1 && (
                <button
                  onClick={() => removeArea(area.id)}
                  className="px-2 py-1 text-red-600 hover:text-red-700"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>

        {calculation && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Cotas Calculadas</h4>
            <div className="space-y-2">
              {calculation.quotas.map((quota: any) => (
                <div
                  key={quota.id}
                  className={`flex items-center justify-between p-3 rounded-md ${
                    quota.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div>
                    <span className="font-medium">{quota.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({quota.percentage.toFixed(1)}% da população)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{quota.quota} entrevistas</span>
                    {!quota.isValid && (
                      <div className="flex items-center text-red-600 text-xs mt-1">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        <span>Menos de 30 entrevistas</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Planejamento da Equipe */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Planejamento da Equipe</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dias de Campo
            </label>
            <input
              type="number"
              min="1"
              value={fieldDays}
              onChange={(e) => setFieldDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Pesquisadores
            </label>
            <input
              type="number"
              min="1"
              value={numberOfResearchers}
              onChange={(e) => setNumberOfResearchers(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {calculation && (
          <div
            className="p-4 rounded-md border"
            style={{
              backgroundColor: `${calculation.workload.color}10`,
              borderColor: `${calculation.workload.color}40`
            }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: calculation.workload.color }}
              />
              <span className="font-medium" style={{ color: calculation.workload.color }}>
                {calculation.workload.message}
              </span>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Entrevistas por dia: {calculation.workload.interviewsPerDay}</p>
              <p>Entrevistas por pesquisador/dia: {calculation.workload.interviewsPerResearcher}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
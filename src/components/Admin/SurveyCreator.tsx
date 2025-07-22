import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { StatisticalCalculator } from '../StatisticalCalculator';
import { QuestionBuilder } from './QuestionBuilder';
import type { Question, SurveyArea } from '../../types';

interface SurveyCreatorProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function SurveyCreator({ onComplete, onCancel }: SurveyCreatorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    confidence_level: 95 as const,
    margin_error: 5,
    expected_proportion: 50,
    population_size: undefined as number | undefined,
    field_days: 7,
    sample_size: 0,
    questions: [] as Question[],
    areas: [] as SurveyArea[]
  });

  const { createSurvey, currentUser } = useApp();

  const steps = [
    { id: 1, title: 'Informações Básicas' },
    { id: 2, title: 'Cálculos Estatísticos' },
    { id: 3, title: 'Questionário' },
    { id: 4, title: 'Revisão' }
  ];

  const handleCalculationComplete = (result: any) => {
    setSurveyData(prev => ({
      ...prev,
      sample_size: result.sampleSize,
      areas: result.quotas.map((quota: any, index: number) => ({
        id: quota.id,
        survey_id: '',
        name: quota.name,
        population: quota.population,
        quota: quota.quota,
        center_lat: -23.5505 + (index * 0.01), // Mock coordinates
        center_lng: -46.6333 + (index * 0.01),
        radius: 100,
        assigned_researchers: []
      }))
    }));
  };

  const handleSave = () => {
    if (!currentUser) return;

    createSurvey({
      title: surveyData.title,
      description: surveyData.description,
      admin_id: currentUser.id,
      status: 'draft',
      margin_error: surveyData.margin_error,
      confidence_level: surveyData.confidence_level,
      expected_proportion: surveyData.expected_proportion / 100,
      sample_size: surveyData.sample_size,
      field_days: surveyData.field_days,
      questions: surveyData.questions,
      areas: surveyData.areas,
      population_size: surveyData.population_size
    });

    onComplete();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Pesquisa
              </label>
              <input
                type="text"
                value={surveyData.title}
                onChange={(e) => setSurveyData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Pesquisa de Satisfação Municipal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={surveyData.description}
                onChange={(e) => setSurveyData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva os objetivos e contexto da pesquisa..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <StatisticalCalculator onCalculationComplete={handleCalculationComplete} />
        );

      case 3:
        return (
          <QuestionBuilder
            questions={surveyData.questions}
            onChange={(questions) => setSurveyData(prev => ({ ...prev, questions }))}
          />
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Pesquisa</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informações Gerais</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Título:</strong> {surveyData.title}</p>
                    <p><strong>Descrição:</strong> {surveyData.description}</p>
                    <p><strong>Tamanho da Amostra:</strong> {surveyData.sample_size}</p>
                    <p><strong>Dias de Campo:</strong> {surveyData.field_days}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Parâmetros Estatísticos</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nível de Confiança:</strong> {surveyData.confidence_level}%</p>
                    <p><strong>Margem de Erro:</strong> {surveyData.margin_error}%</p>
                    <p><strong>Proporção Esperada:</strong> {surveyData.expected_proportion}%</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Áreas de Coleta</h4>
                <div className="space-y-2">
                  {surveyData.areas.map((area) => (
                    <div key={area.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <span>{area.name}</span>
                      <span className="text-sm text-gray-600">{area.quota} entrevistas</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Questionário</h4>
                <p className="text-sm text-gray-600">{surveyData.questions.length} perguntas criadas</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return surveyData.title.trim() && surveyData.description.trim();
      case 2:
        return surveyData.sample_size > 0 && surveyData.areas.length > 0;
      case 3:
        return surveyData.questions.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.id}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {steps[currentStep - 1].title}
        </h2>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={currentStep === 1 ? onCancel : () => setCurrentStep(prev => prev - 1)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentStep === 1 ? 'Cancelar' : 'Voltar'}</span>
        </button>

        <div className="flex space-x-3">
          {currentStep === steps.length ? (
            <button
              onClick={handleSave}
              disabled={!canProceed()}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Pesquisa</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Próximo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
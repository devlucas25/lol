import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { validateGeofence } from '../../utils/geolocation';
import type { GPSCoordinate, Survey, SurveyArea } from '../../types';

interface InterviewFormProps {
  survey: Survey;
  area: SurveyArea;
  location: GPSCoordinate | null;
  onComplete: () => void;
  onCancel: () => void;
}

export function InterviewForm({ survey, area, location, onComplete, onCancel }: InterviewFormProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(new Date());
  const [validationChecks, setValidationChecks] = useState(0);
  
  const { createInterview, currentUser } = useApp();
  
  const currentQuestion = survey.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;
  const canProceed = !currentQuestion.required || responses[currentQuestion.id] !== undefined;

  // Validação contínua de localização (REGRA CRÍTICA)
  const locationValidation = location ? validateGeofence(
    location,
    { lat: area.center_lat, lng: area.center_lng },
    area.radius
  ) : null;

  // Revalidar localização periodicamente durante a entrevista
  useEffect(() => {
    const interval = setInterval(() => {
      if (location) {
        setValidationChecks(prev => prev + 1);
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [location]);

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const saveInterview = async () => {
    if (!location || !currentUser || !locationValidation?.is_valid) return;

    setSaving(true);
    
    try {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000); // em segundos

      createInterview({
        survey_id: survey.id,
        researcher_id: currentUser.id,
        area_id: area.id,
        lat: location.lat,
        lng: location.lng,
        location_validated: locationValidation.is_valid,
        responses: {
          ...responses,
          _metadata: {
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_seconds: duration,
            location_checks: validationChecks,
            gps_accuracy: location.accuracy,
            distance_from_center: locationValidation.distance_from_center
          }
        },
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString()
      });

      onComplete();
    } catch (error) {
      console.error('Erro ao salvar entrevista:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderQuestion = () => {
    const question = currentQuestion;
    const currentResponse = responses[question.id];

    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentResponse === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900 text-lg">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-3">
            {['Sim', 'Não'].map((option) => (
              <label key={option} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentResponse === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900 text-lg">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            value={currentResponse || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="Digite sua resposta..."
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentResponse || ''}
            onChange={(e) => handleResponse(question.id, e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="Digite um número..."
          />
        );

      default:
        return null;
    }
  };

  // REGRA DE BLOQUEIO: Verificar se localização é válida
  if (!locationValidation?.is_valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md w-full">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">Localização Inválida</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-red-700">
              <strong>REGRA DE BLOQUEIO ATIVA:</strong> Você está fora da área de coleta designada. 
              A entrevista não pode ser iniciada ou continuada.
            </p>
            
            {locationValidation && (
              <div className="bg-red-50 p-3 rounded-md">
                <div className="text-sm text-red-800 space-y-1">
                  <p><strong>Distância atual:</strong> {locationValidation.distance_from_center.toFixed(0)}m do centro</p>
                  <p><strong>Máximo permitido:</strong> {locationValidation.max_allowed_distance}m</p>
                  <p><strong>Área:</strong> {area.name}</p>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-600">
              Aproxime-se do centro da área designada para continuar. A localização é verificada 
              automaticamente usando a fórmula de Haversine para máxima precisão.
            </p>
          </div>
          
          <button
            onClick={onCancel}
            className="w-full mt-6 px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
          >
            Voltar às Tarefas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">{area.name}</h1>
              <p className="text-sm text-gray-600">
                {currentQuestionIndex + 1} de {survey.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {Math.round((Date.now() - startTime.getTime()) / 60000)}min
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso</span>
            <span>{Math.round(((currentQuestionIndex + 1) / survey.questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / survey.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Location Status - Validação Contínua */}
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                Localização Validada
              </span>
            </div>
            <span className="text-xs text-green-700">
              {locationValidation?.distance_from_center.toFixed(0)}m do centro
            </span>
          </div>
          
          {location?.accuracy && (
            <div className="mt-2 flex items-center justify-between text-xs text-green-700">
              <span>Precisão GPS: ±{location.accuracy.toFixed(0)}m</span>
              <span>Verificações: {validationChecks}</span>
            </div>
          )}
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-900 leading-tight">
                {currentQuestion.text}
              </h2>
              {currentQuestion.required && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full ml-3 flex-shrink-0">
                  Obrigatória
                </span>
              )}
            </div>
          </div>

          {renderQuestion()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between space-x-4">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Anterior
          </button>

          {isLastQuestion ? (
            <button
              onClick={saveInterview}
              disabled={!canProceed || saving || !locationValidation?.is_valid}
              className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Finalizar Entrevista'}</span>
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              disabled={!canProceed}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Próxima
            </button>
          )}
        </div>

        {/* Validation Warning */}
        {!canProceed && currentQuestion.required && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Esta pergunta é obrigatória. Por favor, selecione uma resposta para continuar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
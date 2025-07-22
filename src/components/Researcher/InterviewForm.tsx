import React, { useState } from 'react';
import { ArrowLeft, Save, MapPin, AlertCircle } from 'lucide-react';
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
  
  const { createInterview, currentUser } = useApp();
  
  const currentQuestion = survey.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;
  const canProceed = !currentQuestion.required || responses[currentQuestion.id] !== undefined;

  // Validate location
  const locationValidation = location ? validateGeofence(
    location,
    { lat: area.center_lat, lng: area.center_lng },
    area.radius
  ) : null;

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
    if (!location || !currentUser) return;

    setSaving(true);
    
    try {
      createInterview({
        survey_id: survey.id,
        researcher_id: currentUser.id,
        area_id: area.id,
        lat: location.lat,
        lng: location.lng,
        location_validated: locationValidation?.is_valid || false,
        responses,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
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
              <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentResponse === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-3">
            {['Sim', 'Não'].map((option) => (
              <label key={option} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentResponse === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-900">{option}</span>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite sua resposta..."
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentResponse || ''}
            onChange={(e) => handleResponse(question.id, e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite um número..."
          />
        );

      default:
        return null;
    }
  };

  // Check if location is valid
  if (!locationValidation?.is_valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md w-full">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Localização Inválida</h2>
          </div>
          <p className="text-red-700 mb-4">
            Você está fora da área de coleta designada. Aproxime-se do centro da área para iniciar a entrevista.
          </p>
          {locationValidation && (
            <div className="text-sm text-red-600 space-y-1">
              <p>Distância atual: {locationValidation.distance_from_center.toFixed(0)}m</p>
              <p>Máximo permitido: {locationValidation.max_allowed_distance}m</p>
            </div>
          )}
          <button
            onClick={onCancel}
            className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Voltar
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
            <div className="w-16" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / survey.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Location Status */}
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              Localização validada ({locationValidation?.distance_from_center.toFixed(0)}m do centro)
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {currentQuestion.text}
            </h2>
            {currentQuestion.required && (
              <p className="text-sm text-red-600">* Pergunta obrigatória</p>
            )}
          </div>

          {renderQuestion()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between space-x-4">
          <button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {isLastQuestion ? (
            <button
              onClick={saveInterview}
              disabled={!canProceed || saving}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Finalizar'}</span>
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              disabled={!canProceed}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
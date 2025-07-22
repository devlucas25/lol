import React, { useState, useEffect } from 'react';
import { MapPin, List, User, LogOut, Play, CheckCircle, History } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { GeolocationStatus } from '../GeolocationStatus';
import { InterviewForm } from './InterviewForm';
import { InterviewHistory } from './InterviewHistory';
import { validateGeofence } from '../../utils/geolocation';

export function ResearcherApp() {
  const [currentView, setCurrentView] = useState<'tasks' | 'interview' | 'history'>('tasks');
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  
  const { currentUser, logout, surveys, interviews, getInterviewsBySurvey } = useApp();
  const { location, error, loading, requestLocation } = useGeolocation({ watch: true });

  // Get active surveys for this researcher
  const activeSurveys = surveys.filter(s => s.status === 'active');

  const getAreaProgress = (survey: any) => {
    const surveyInterviews = getInterviewsBySurvey(survey.id);
    return survey.areas.map((area: any) => {
      const areaInterviews = surveyInterviews.filter((i: any) => i.area_id === area.id);
      return {
        ...area,
        completed: areaInterviews.length,
        remaining: area.quota - areaInterviews.length,
        percentage: (areaInterviews.length / area.quota) * 100
      };
    });
  };

  const canStartInterview = (area: any) => {
    if (!location) return false;
    
    const validation = validateGeofence(
      location,
      { lat: area.center_lat, lng: area.center_lng },
      area.radius
    );
    
    return validation.is_valid && area.remaining > 0;
  };

  const startInterview = (survey: any, area: any) => {
    setSelectedSurvey(survey);
    setSelectedArea(area);
    setCurrentView('interview');
  };

  const completeInterview = () => {
    setCurrentView('tasks');
    setSelectedSurvey(null);
    setSelectedArea(null);
  };

  if (currentView === 'interview' && selectedSurvey && selectedArea) {
    return (
      <InterviewForm
        survey={selectedSurvey}
        area={selectedArea}
        location={location}
        onComplete={completeInterview}
        onCancel={completeInterview}
      />
    );
  }

  if (currentView === 'history') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Histórico</h1>
                <p className="text-sm text-gray-600">Suas entrevistas realizadas</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4">
          <InterviewHistory />
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex">
            <button
              onClick={() => setCurrentView('tasks')}
              className="flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-600"
            >
              <List className="w-5 h-5 mb-1" />
              <span className="text-xs">Tarefas</span>
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className="flex-1 flex flex-col items-center py-3 text-blue-600"
            >
              <History className="w-5 h-5 mb-1" />
              <span className="text-xs">Histórico</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">FieldFocus</h1>
              <p className="text-sm text-gray-600">Olá, {currentUser?.name}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Location Status */}
        <GeolocationStatus
          location={location}
          error={error}
          loading={loading}
          onRequestLocation={requestLocation}
        />

        {/* Active Surveys */}
        <div className="space-y-4">
          {activeSurveys.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma pesquisa ativa</p>
              <p className="text-sm text-gray-400">Aguarde a atribuição de tarefas</p>
            </div>
          ) : (
            activeSurveys.map((survey) => {
              const areaProgress = getAreaProgress(survey);
              const totalCompleted = areaProgress.reduce((sum, area) => sum + area.completed, 0);
              const totalTarget = areaProgress.reduce((sum, area) => sum + area.quota, 0);

              return (
                <div key={survey.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">{survey.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Progresso: {totalCompleted}/{totalTarget}
                      </span>
                      <span className="text-blue-600 font-medium">
                        {((totalCompleted / totalTarget) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {areaProgress.map((area) => {
                      const canStart = canStartInterview(area);
                      const isCompleted = area.remaining <= 0;
                      
                      return (
                        <div key={area.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{area.name}</h3>
                              <p className="text-sm text-gray-600">
                                {area.completed}/{area.quota} entrevistas
                                {area.remaining > 0 && (
                                  <span className="text-blue-600 ml-1">
                                    ({area.remaining} restantes)
                                  </span>
                                )}
                              </p>
                            </div>
                            
                            {isCompleted ? (
                              <div className="flex items-center space-x-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Concluída</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => startInterview(survey, area)}
                                disabled={!canStart}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium ${
                                  canStart
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                <Play className="w-4 h-4" />
                                <span>Iniciar</span>
                              </button>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(area.percentage, 100)}%` }}
                            />
                          </div>

                          {!canStart && !isCompleted && location && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                              <p className="text-xs text-yellow-800">
                                {area.remaining <= 0 
                                  ? 'Cota desta área já foi atingida'
                                  : 'Aproxime-se da área para iniciar uma entrevista'
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex">
          <button
            onClick={() => setCurrentView('tasks')}
            className="flex-1 flex flex-col items-center py-3 text-blue-600"
          >
            <List className="w-5 h-5 mb-1" />
            <span className="text-xs">Tarefas</span>
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className="flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-600"
          >
            <History className="w-5 h-5 mb-1" />
            <span className="text-xs">Histórico</span>
          </button>
        </div>
      </div>
    </div>
  );
}
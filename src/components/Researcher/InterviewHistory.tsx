import React from 'react';
import { Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { formatCoordinates } from '../../utils/geolocation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function InterviewHistory() {
  const { interviews, surveys, currentUser } = useApp();

  // Filtrar entrevistas do pesquisador atual
  const myInterviews = interviews.filter(i => i.researcher_id === currentUser?.id);

  const getSurveyTitle = (surveyId: string) => {
    const survey = surveys.find(s => s.id === surveyId);
    return survey?.title || 'Pesquisa não encontrada';
  };

  const getAreaName = (surveyId: string, areaId: string) => {
    const survey = surveys.find(s => s.id === surveyId);
    const area = survey?.areas.find(a => a.id === areaId);
    return area?.name || 'Área não encontrada';
  };

  const getDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return 'Em andamento';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end.getTime() - start.getTime();
    const durationMin = Math.round(durationMs / 60000);
    
    return `${durationMin} min`;
  };

  if (myInterviews.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Nenhuma entrevista realizada ainda</p>
        <p className="text-sm text-gray-400">Suas entrevistas aparecerão aqui após serem concluídas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Histórico de Entrevistas</h2>
      
      <div className="space-y-3">
        {myInterviews.map((interview) => (
          <div key={interview.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {getSurveyTitle(interview.survey_id)}
                </h3>
                <p className="text-sm text-gray-600">
                  {getAreaName(interview.survey_id, interview.area_id)}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {interview.location_validated ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">GPS Validado</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">GPS Inválido</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Duração: {getDuration(interview.started_at, interview.completed_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{formatCoordinates(interview.lat, interview.lng)}</span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {format(new Date(interview.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(interview.started_at), 'HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Resumo das Respostas */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Resumo das respostas:</p>
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(interview.responses).map(([questionId, answer]) => {
                  if (questionId.startsWith('_')) return null; // Skip metadata
                  return (
                    <div key={questionId} className="flex justify-between">
                      <span className="font-medium">{questionId}:</span>
                      <span className="max-w-32 truncate">{String(answer)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
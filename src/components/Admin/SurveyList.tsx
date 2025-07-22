import React from 'react';
import { Eye, Play, Pause, BarChart3 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface SurveyListProps {
  onMonitor: (surveyId: string) => void;
}

export function SurveyList({ onMonitor }: SurveyListProps) {
  const { surveys, interviews, updateSurvey } = useApp();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'draft': return 'Rascunho';
      case 'completed': return 'Concluída';
      default: return status;
    }
  };

  const getProgress = (survey: any) => {
    const surveyInterviews = interviews.filter(i => i.survey_id === survey.id);
    const completed = surveyInterviews.length;
    const target = survey.sample_size;
    return { completed, target, percentage: target > 0 ? (completed / target) * 100 : 0 };
  };

  const toggleSurveyStatus = (survey: any) => {
    const newStatus = survey.status === 'active' ? 'draft' : 'active';
    updateSurvey(survey.id, { status: newStatus });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Minhas Pesquisas</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {surveys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma pesquisa criada ainda</p>
            <p className="text-sm text-gray-400">Clique em "Nova Pesquisa" para começar</p>
          </div>
        ) : (
          surveys.map((survey) => {
            const progress = getProgress(survey);
            return (
              <div key={survey.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{survey.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(survey.status)}`}>
                        {getStatusText(survey.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
                    
                    <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                      <span>Amostra: {survey.sample_size}</span>
                      <span>Áreas: {survey.areas.length}</span>
                      <span>Perguntas: {survey.questions.length}</span>
                      <span>Progresso: {progress.completed}/{progress.target} ({progress.percentage.toFixed(1)}%)</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleSurveyStatus(survey)}
                      className={`p-2 rounded-md ${
                        survey.status === 'active'
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={survey.status === 'active' ? 'Pausar pesquisa' : 'Ativar pesquisa'}
                    >
                      {survey.status === 'active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={() => onMonitor(survey.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Monitorar pesquisa"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
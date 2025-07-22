import React from 'react';
import { ArrowLeft, Users, MapPin, BarChart3, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { analyzeQuestionResults } from '../../utils/statistical';

interface SurveyMonitorProps {
  surveyId: string;
  onBack: () => void;
}

export function SurveyMonitor({ surveyId, onBack }: SurveyMonitorProps) {
  const { getSurvey, getInterviewsBySurvey } = useApp();
  
  const survey = getSurvey(surveyId);
  const interviews = getInterviewsBySurvey(surveyId);

  if (!survey) {
    return <div>Pesquisa não encontrada</div>;
  }

  const getAreaProgress = () => {
    return survey.areas.map(area => {
      const areaInterviews = interviews.filter(i => i.area_id === area.id);
      return {
        ...area,
        completed: areaInterviews.length,
        percentage: (areaInterviews.length / area.quota) * 100
      };
    });
  };

  const getQuestionAnalysis = () => {
    return survey.questions.map(question => {
      const responses = interviews
        .map(interview => interview.responses[question.id])
        .filter(response => response !== undefined);

      if (question.type === 'multiple_choice' && question.options) {
        const analysis = analyzeQuestionResults(
          responses,
          question.options,
          survey.confidence_level as 90 | 95 | 99
        );
        return { question, analysis, totalResponses: responses.length };
      }

      return { question, analysis: null, totalResponses: responses.length };
    });
  };

  const areaProgress = getAreaProgress();
  const questionAnalysis = getQuestionAnalysis();
  const totalCompleted = interviews.length;
  const totalTarget = survey.sample_size;
  const overallProgress = (totalCompleted / totalTarget) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
            <p className="text-gray-600">{survey.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{overallProgress.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Progresso Geral</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entrevistas</p>
              <p className="text-2xl font-bold text-gray-900">{totalCompleted}/{totalTarget}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Áreas Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{survey.areas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Resposta</p>
              <p className="text-2xl font-bold text-gray-900">{overallProgress.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dias Restantes</p>
              <p className="text-2xl font-bold text-gray-900">{survey.field_days}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Area Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Progresso por Área</h2>
        <div className="space-y-4">
          {areaProgress.map((area) => (
            <div key={area.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{area.name}</h3>
                  <span className="text-sm text-gray-600">
                    {area.completed}/{area.quota} ({area.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      area.percentage >= 100 ? 'bg-green-500' :
                      area.percentage >= 75 ? 'bg-blue-500' :
                      area.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(area.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question Results */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultados das Perguntas</h2>
        <div className="space-y-6">
          {questionAnalysis.map((item, index) => (
            <div key={item.question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  {index + 1}. {item.question.text}
                </h3>
                <span className="text-sm text-gray-500">
                  {item.totalResponses} respostas
                </span>
              </div>

              {item.analysis ? (
                <div className="space-y-3">
                  {item.analysis.map((result) => (
                    <div key={result.option} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{result.option}</span>
                          <span className="text-sm text-gray-600">
                            {result.count} ({result.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          IC {survey.confidence_level}%: {result.confidenceInterval.lower}% - {result.confidenceInterval.upper}% 
                          (±{result.confidenceInterval.marginError}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {item.totalResponses > 0 ? 'Análise não disponível para este tipo de pergunta' : 'Nenhuma resposta ainda'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
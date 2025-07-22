import React from 'react';
import { ArrowLeft, Users, MapPin, BarChart3, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { analyzeQuestionResults, calculateConfidenceInterval } from '../../utils/statistical';

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
      const validatedInterviews = areaInterviews.filter(i => i.location_validated);
      
      return {
        ...area,
        completed: areaInterviews.length,
        validated: validatedInterviews.length,
        percentage: (areaInterviews.length / area.quota) * 100,
        validationRate: areaInterviews.length > 0 ? (validatedInterviews.length / areaInterviews.length) * 100 : 0
      };
    });
  };

  const getQuestionAnalysis = () => {
    return survey.questions.map(question => {
      const responses = interviews
        .map(interview => interview.responses[question.id])
        .filter(response => response !== undefined);

      if (question.type === 'multiple_choice' && question.options && responses.length > 0) {
        const analysis = analyzeQuestionResults(
          responses,
          question.options,
          survey.confidence_level as 90 | 95 | 99
        );
        return { question, analysis, totalResponses: responses.length };
      }

      // Para outros tipos de pergunta, calcular estatísticas básicas
      if (responses.length > 0) {
        let basicStats = null;
        
        if (question.type === 'yes_no') {
          const yesCount = responses.filter(r => r === 'Sim').length;
          const noCount = responses.filter(r => r === 'Não').length;
          const yesPercentage = (yesCount / responses.length) * 100;
          
          // Calcular intervalo de confiança para a proporção de "Sim"
          const ci = calculateConfidenceInterval(
            yesCount / responses.length,
            responses.length,
            survey.confidence_level as 90 | 95 | 99
          );
          
          basicStats = [
            {
              option: 'Sim',
              count: yesCount,
              percentage: Math.round(yesPercentage * 10) / 10,
              confidenceInterval: ci
            },
            {
              option: 'Não',
              count: noCount,
              percentage: Math.round((100 - yesPercentage) * 10) / 10,
              confidenceInterval: {
                lower: 100 - ci.upper,
                upper: 100 - ci.lower,
                marginError: ci.marginError
              }
            }
          ];
        }
        
        return { question, analysis: basicStats, totalResponses: responses.length };
      }

      return { question, analysis: null, totalResponses: responses.length };
    });
  };

  const areaProgress = getAreaProgress();
  const questionAnalysis = getQuestionAnalysis();
  const totalCompleted = interviews.length;
  const totalTarget = survey.sample_size;
  const overallProgress = (totalCompleted / totalTarget) * 100;
  const validatedInterviews = interviews.filter(i => i.location_validated).length;
  const validationRate = totalCompleted > 0 ? (validatedInterviews / totalCompleted) * 100 : 0;

  // Calcular estatísticas de tempo
  const completedInterviews = interviews.filter(i => i.completed_at);
  const avgDuration = completedInterviews.length > 0 
    ? completedInterviews.reduce((sum, interview) => {
        const start = new Date(interview.started_at).getTime();
        const end = new Date(interview.completed_at!).getTime();
        return sum + (end - start);
      }, 0) / completedInterviews.length / 60000 // em minutos
    : 0;

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
          <p className="text-3xl font-bold text-blue-600">{overallProgress.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Progresso Geral</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Entrevistas</p>
              <p className="text-lg font-bold text-gray-900">{totalCompleted}/{totalTarget}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Validadas GPS</p>
              <p className="text-lg font-bold text-gray-900">{validatedInterviews}</p>
              <p className="text-xs text-gray-500">{validationRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Áreas Ativas</p>
              <p className="text-lg font-bold text-gray-900">{survey.areas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Tempo Médio</p>
              <p className="text-lg font-bold text-gray-900">{avgDuration.toFixed(1)}min</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Taxa Conclusão</p>
              <p className="text-lg font-bold text-gray-900">{overallProgress.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Area Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Progresso por Área (Estratificação)</h2>
        <div className="space-y-4">
          {areaProgress.map((area) => (
            <div key={area.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{area.name}</h3>
                  <p className="text-sm text-gray-600">
                    População: {area.population.toLocaleString()} • 
                    Cota: {area.quota} • 
                    Coletadas: {area.completed}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">
                    {area.percentage.toFixed(1)}%
                  </span>
                  <p className="text-xs text-gray-600">
                    {area.validated}/{area.completed} validadas GPS
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {/* Barra de progresso principal */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      area.percentage >= 100 ? 'bg-green-500' :
                      area.percentage >= 75 ? 'bg-blue-500' :
                      area.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(area.percentage, 100)}%` }}
                  />
                </div>
                
                {/* Barra de validação GPS */}
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-green-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${area.validationRate}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progresso da cota</span>
                  <span>Taxa de validação GPS: {area.validationRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question Results with Statistical Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Resultados das Perguntas (Análise Estatística)
        </h2>
        <div className="space-y-6">
          {questionAnalysis.map((item, index) => (
            <div key={item.question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-gray-900 text-lg">
                  {index + 1}. {item.question.text}
                </h3>
                <div className="text-right text-sm text-gray-500">
                  <p>{item.totalResponses} respostas</p>
                  <p>NC: {survey.confidence_level}%</p>
                </div>
              </div>

              {item.analysis ? (
                <div className="space-y-3">
                  {item.analysis.map((result) => (
                    <div key={result.option} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{result.option}</span>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">
                            {result.percentage}%
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({result.count} respostas)
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          <strong>Intervalo de Confiança {survey.confidence_level}%:</strong>
                        </span>
                        <span className="font-mono text-gray-800">
                          {result.confidenceInterval.lower}% - {result.confidenceInterval.upper}% 
                          <span className="text-gray-600 ml-2">
                            (±{result.confidenceInterval.marginError}%)
                          </span>
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Fórmula: IC = p_obs ± Z × √(p_obs × (1 - p_obs) / n_real)
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {item.totalResponses > 0 
                      ? 'Análise estatística não disponível para este tipo de pergunta' 
                      : 'Nenhuma resposta coletada ainda'
                    }
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Statistical Summary */}
      {totalCompleted > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Resumo Estatístico</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-800"><strong>Parâmetros Originais:</strong></p>
              <ul className="text-blue-700 space-y-1">
                <li>• Nível de Confiança: {survey.confidence_level}%</li>
                <li>• Margem de Erro: {survey.margin_error}%</li>
                <li>• Amostra Planejada: {survey.sample_size}</li>
              </ul>
            </div>
            <div>
              <p className="text-blue-800"><strong>Coleta Atual:</strong></p>
              <ul className="text-blue-700 space-y-1">
                <li>• Entrevistas: {totalCompleted}/{totalTarget}</li>
                <li>• Progresso: {overallProgress.toFixed(1)}%</li>
                <li>• Validadas GPS: {validationRate.toFixed(1)}%</li>
              </ul>
            </div>
            <div>
              <p className="text-blue-800"><strong>Qualidade:</strong></p>
              <ul className="text-blue-700 space-y-1">
                <li>• Tempo médio: {avgDuration.toFixed(1)} min</li>
                <li>• Estratos ativos: {survey.areas.length}</li>
                <li>• Taxa de conclusão: {(completedInterviews.length / totalCompleted * 100).toFixed(1)}%</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
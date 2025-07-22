import React, { useState } from 'react';
import { Plus, BarChart3, Users, MapPin, Settings, LogOut } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { SurveyCreator } from './SurveyCreator';
import { SurveyList } from './SurveyList';
import { SurveyMonitor } from './SurveyMonitor';

type AdminView = 'dashboard' | 'create' | 'monitor';

export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const { currentUser, logout, surveys, interviews } = useApp();

  const activeSurveys = surveys.filter(s => s.status === 'active').length;
  const totalInterviews = interviews.length;
  const completedSurveys = surveys.filter(s => s.status === 'completed').length;

  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <SurveyCreator 
            onComplete={() => setCurrentView('dashboard')}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'monitor':
        return selectedSurveyId ? (
          <SurveyMonitor 
            surveyId={selectedSurveyId}
            onBack={() => {
              setCurrentView('dashboard');
              setSelectedSurveyId(null);
            }}
          />
        ) : null;
      default:
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pesquisas Ativas</p>
                    <p className="text-2xl font-bold text-gray-900">{activeSurveys}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Entrevistas Coletadas</p>
                    <p className="text-2xl font-bold text-gray-900">{totalInterviews}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pesquisas Concluídas</p>
                    <p className="text-2xl font-bold text-gray-900">{completedSurveys}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Survey List */}
            <SurveyList 
              onMonitor={(surveyId) => {
                setSelectedSurveyId(surveyId);
                setCurrentView('monitor');
              }}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">FieldFocus Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {currentUser?.name}</span>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded-md font-medium ${
              currentView === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('create')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
              currentView === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Pesquisa</span>
          </button>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}
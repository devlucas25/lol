import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Survey, Interview, User } from '../types';

interface AppContextType {
  // Auth
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Surveys
  surveys: Survey[];
  createSurvey: (survey: Omit<Survey, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSurvey: (id: string, updates: Partial<Survey>) => Promise<void>;
  getSurvey: (id: string) => Survey | undefined;
  loadSurveys: () => Promise<void>;
  
  // Interviews
  interviews: Interview[];
  createInterview: (interview: Omit<Interview, 'id' | 'created_at'>) => Promise<void>;
  getInterviewsBySurvey: (surveyId: string) => Interview[];
  loadInterviews: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar sessão ao inicializar
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setCurrentUser(user);
      await loadSurveys();
      await loadInterviews();
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Para demonstração, vamos fazer login direto com o usuário do banco
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return false;
      }

      // Simular autenticação (em produção, usar supabase.auth.signInWithPassword)
      setCurrentUser(user);
      await loadSurveys();
      await loadInterviews();
      
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setSurveys([]);
    setInterviews([]);
  };

  const loadSurveys = async () => {

    try {
      let query = supabase.from('surveys').select('*');
      
      if (currentUser?.role === 'admin') {
        query = query.eq('admin_id', currentUser.id);
      } else {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error);
    }
  };

  const createSurvey = async (surveyData: Omit<Survey, 'id' | 'created_at' | 'updated_at'>) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('surveys')
        .insert([{
          ...surveyData,
          admin_id: currentUser.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setSurveys(prev => [data, ...prev]);
    } catch (error) {
      console.error('Erro ao criar pesquisa:', error);
      throw error;
    }
  };

  const updateSurvey = async (id: string, updates: Partial<Survey>) => {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setSurveys(prev => prev.map(survey => 
        survey.id === id ? data : survey
      ));
    } catch (error) {
      console.error('Erro ao atualizar pesquisa:', error);
      throw error;
    }
  };

  const getSurvey = (id: string) => {
    return surveys.find(survey => survey.id === id);
  };

  const loadInterviews = async () => {

    try {
      let query = supabase.from('interviews').select('*');
      
      if (currentUser?.role === 'researcher') {
        query = query.eq('researcher_id', currentUser.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Erro ao carregar entrevistas:', error);
    }
  };

  const createInterview = async (interviewData: Omit<Interview, 'id' | 'created_at'>) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert([{
          ...interviewData,
          researcher_id: currentUser.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setInterviews(prev => [data, ...prev]);
    } catch (error) {
      console.error('Erro ao criar entrevista:', error);
      throw error;
    }
  };

  const getInterviewsBySurvey = (surveyId: string) => {
    return interviews.filter(interview => interview.survey_id === surveyId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      currentUser,
      loading,
      login,
      logout,
      surveys,
      createSurvey,
      updateSurvey,
      getSurvey,
      loadSurveys,
      interviews,
      createInterview,
      getInterviewsBySurvey,
      loadInterviews
    }}>
      {children}
    </AppContext.Provider>
  );
}
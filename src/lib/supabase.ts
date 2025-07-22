import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para o banco de dados
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'researcher';
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'researcher';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'researcher';
          created_at?: string;
        };
      };
      surveys: {
        Row: {
          id: string;
          title: string;
          description: string;
          admin_id: string;
          status: 'draft' | 'active' | 'completed';
          population_size: number | null;
          margin_error: number;
          confidence_level: number;
          expected_proportion: number;
          sample_size: number;
          field_days: number;
          questions: any;
          areas: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          admin_id: string;
          status?: 'draft' | 'active' | 'completed';
          population_size?: number | null;
          margin_error: number;
          confidence_level: number;
          expected_proportion: number;
          sample_size: number;
          field_days: number;
          questions: any;
          areas: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          admin_id?: string;
          status?: 'draft' | 'active' | 'completed';
          population_size?: number | null;
          margin_error?: number;
          confidence_level?: number;
          expected_proportion?: number;
          sample_size?: number;
          field_days?: number;
          questions?: any;
          areas?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      interviews: {
        Row: {
          id: string;
          survey_id: string;
          researcher_id: string;
          area_id: string;
          lat: number;
          lng: number;
          location_validated: boolean;
          responses: any;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey_id: string;
          researcher_id: string;
          area_id: string;
          lat: number;
          lng: number;
          location_validated: boolean;
          responses: any;
          started_at: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey_id?: string;
          researcher_id?: string;
          area_id?: string;
          lat?: number;
          lng?: number;
          location_validated?: boolean;
          responses?: any;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher';
  created_at: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  admin_id: string;
  status: 'draft' | 'active' | 'completed';
  
  // Parâmetros estatísticos
  population_size?: number;
  margin_error: number;
  confidence_level: number;
  expected_proportion: number;
  sample_size: number;
  
  // Configurações
  field_days: number;
  questions: Question[];
  areas: SurveyArea[];
  
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text' | 'number' | 'yes_no';
  options?: string[];
  required: boolean;
  order: number;
}

export interface SurveyArea {
  id: string;
  survey_id: string;
  name: string;
  population: number;
  quota: number;
  center_lat: number;
  center_lng: number;
  radius: number; // em metros
  assigned_researchers: string[];
}

export interface Researcher {
  id: string;
  user_id: string;
  survey_id: string;
  assigned_areas: string[];
  daily_target: number;
  completed_interviews: number;
}

export interface Interview {
  id: string;
  survey_id: string;
  researcher_id: string;
  area_id: string;
  
  // Localização
  lat: number;
  lng: number;
  location_validated: boolean;
  
  // Dados
  responses: Record<string, any>;
  
  // Timestamps
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface StatisticalResult {
  question_id: string;
  question_text: string;
  total_responses: number;
  results: {
    option: string;
    count: number;
    percentage: number;
    confidence_interval: {
      lower: number;
      upper: number;
      margin_error: number;
    };
  }[];
}

// Tipos para cálculos estatísticos
export interface SampleCalculation {
  base_sample: number;
  final_sample: number;
  z_score: number;
  population_correction_applied: boolean;
}

export interface StratificationResult {
  area_id: string;
  area_name: string;
  population: number;
  quota: number;
  percentage: number;
  completed: number;
  remaining: number;
}

// Tipos para geolocalização
export interface GPSCoordinate {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export interface GeofenceValidation {
  is_valid: boolean;
  distance_from_center: number;
  max_allowed_distance: number;
  current_location: GPSCoordinate;
  area_center: GPSCoordinate;
}
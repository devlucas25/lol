/*
  # Adicionar dados de demonstração

  1. Dados de Demonstração
    - Usuários de teste (admin e pesquisador)
    - Pesquisas de exemplo
    - Entrevistas simuladas

  2. Funcionalidades
    - Dados realistas para demonstração
    - Diferentes cenários de uso
    - Resultados estatísticos variados
*/

-- Inserir usuários de demonstração
INSERT INTO users (id, email, name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@fieldfocus.com', 'Dr. Maria Silva', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'pesquisador@fieldfocus.com', 'João Santos', 'researcher'),
  ('550e8400-e29b-41d4-a716-446655440003', 'ana.costa@fieldfocus.com', 'Ana Costa', 'researcher'),
  ('550e8400-e29b-41d4-a716-446655440004', 'carlos.lima@fieldfocus.com', 'Carlos Lima', 'researcher')
ON CONFLICT (id) DO NOTHING;

-- Inserir pesquisa de demonstração
INSERT INTO surveys (
  id, 
  title, 
  description, 
  admin_id, 
  status, 
  margin_error, 
  confidence_level, 
  expected_proportion, 
  sample_size, 
  field_days,
  population_size,
  questions,
  areas
) VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  'Pesquisa de Satisfação Municipal 2024',
  'Avaliação da satisfação dos cidadãos com os serviços públicos municipais, incluindo saúde, educação, transporte e segurança.',
  '550e8400-e29b-41d4-a716-446655440001',
  'active',
  5,
  95,
  0.5,
  384,
  10,
  50000,
  '[
    {
      "id": "q1",
      "text": "Como você avalia os serviços de saúde pública do município?",
      "type": "multiple_choice",
      "options": ["Excelente", "Bom", "Regular", "Ruim", "Péssimo"],
      "required": true,
      "order": 1
    },
    {
      "id": "q2", 
      "text": "Você utiliza o transporte público municipal?",
      "type": "yes_no",
      "required": true,
      "order": 2
    },
    {
      "id": "q3",
      "text": "Se sim, como avalia a qualidade do transporte público?",
      "type": "multiple_choice", 
      "options": ["Excelente", "Bom", "Regular", "Ruim", "Péssimo", "Não utilizo"],
      "required": false,
      "order": 3
    },
    {
      "id": "q4",
      "text": "Qual sua idade?",
      "type": "number",
      "required": true,
      "order": 4
    },
    {
      "id": "q5",
      "text": "Comentários adicionais sobre os serviços municipais:",
      "type": "text",
      "required": false,
      "order": 5
    }
  ]',
  '[
    {
      "id": "area1",
      "survey_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Centro",
      "population": 20000,
      "quota": 154,
      "center_lat": -23.5505,
      "center_lng": -46.6333,
      "radius": 100,
      "assigned_researchers": ["550e8400-e29b-41d4-a716-446655440002"]
    },
    {
      "id": "area2", 
      "survey_id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Zona Norte",
      "population": 15000,
      "quota": 115,
      "center_lat": -23.5205,
      "center_lng": -46.6233,
      "radius": 100,
      "assigned_researchers": ["550e8400-e29b-41d4-a716-446655440003"]
    },
    {
      "id": "area3",
      "survey_id": "660e8400-e29b-41d4-a716-446655440001", 
      "name": "Zona Sul",
      "population": 15000,
      "quota": 115,
      "center_lat": -23.5805,
      "center_lng": -46.6433,
      "radius": 100,
      "assigned_researchers": ["550e8400-e29b-41d4-a716-446655440004"]
    }
  ]'
) ON CONFLICT (id) DO NOTHING;

-- Inserir entrevistas de demonstração
INSERT INTO interviews (
  id,
  survey_id,
  researcher_id, 
  area_id,
  lat,
  lng,
  location_validated,
  responses,
  started_at,
  completed_at
) VALUES 
  -- Entrevistas do Centro (João Santos)
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'area1',
    -23.5505,
    -46.6333,
    true,
    '{"q1": "Bom", "q2": "Sim", "q3": "Regular", "q4": 35, "q5": "Precisa melhorar os horários"}',
    '2024-01-15T09:00:00Z',
    '2024-01-15T09:15:00Z'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'area1',
    -23.5510,
    -46.6330,
    true,
    '{"q1": "Regular", "q2": "Não", "q3": "Não utilizo", "q4": 42, "q5": ""}',
    '2024-01-15T10:30:00Z',
    '2024-01-15T10:42:00Z'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'area1',
    -23.5500,
    -46.6340,
    true,
    '{"q1": "Excelente", "q2": "Sim", "q3": "Bom", "q4": 28, "q5": "Muito satisfeito com os serviços"}',
    '2024-01-15T14:00:00Z',
    '2024-01-15T14:18:00Z'
  ),
  -- Entrevistas da Zona Norte (Ana Costa)
  (
    '770e8400-e29b-41d4-a716-446655440004',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003',
    'area2',
    -23.5205,
    -46.6233,
    true,
    '{"q1": "Ruim", "q2": "Sim", "q3": "Ruim", "q4": 55, "q5": "Transporte sempre atrasado"}',
    '2024-01-16T08:30:00Z',
    '2024-01-16T08:45:00Z'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440005',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003',
    'area2',
    -23.5200,
    -46.6240,
    true,
    '{"q1": "Regular", "q2": "Sim", "q3": "Regular", "q4": 31, "q5": "Pode melhorar"}',
    '2024-01-16T11:15:00Z',
    '2024-01-16T11:28:00Z'
  ),
  -- Entrevistas da Zona Sul (Carlos Lima)
  (
    '770e8400-e29b-41d4-a716-446655440006',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440004',
    'area3',
    -23.5805,
    -46.6433,
    true,
    '{"q1": "Bom", "q2": "Não", "q3": "Não utilizo", "q4": 67, "q5": "Saúde pública melhorou muito"}',
    '2024-01-17T09:45:00Z',
    '2024-01-17T10:02:00Z'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440007',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440004',
    'area3',
    -23.5810,
    -46.6430,
    true,
    '{"q1": "Excelente", "q2": "Sim", "q3": "Excelente", "q4": 24, "q5": "Muito bom o atendimento"}',
    '2024-01-17T15:20:00Z',
    '2024-01-17T15:35:00Z'
  )
ON CONFLICT (id) DO NOTHING;

-- Inserir segunda pesquisa (rascunho)
INSERT INTO surveys (
  id,
  title,
  description, 
  admin_id,
  status,
  margin_error,
  confidence_level,
  expected_proportion,
  sample_size,
  field_days,
  population_size,
  questions,
  areas
) VALUES (
  '660e8400-e29b-41d4-a716-446655440002',
  'Avaliação de Segurança Pública',
  'Pesquisa sobre a percepção de segurança e efetividade das políticas de segurança pública.',
  '550e8400-e29b-41d4-a716-446655440001',
  'draft',
  4,
  95,
  0.5,
  600,
  14,
  80000,
  '[
    {
      "id": "q1",
      "text": "Como você se sente em relação à segurança no seu bairro?",
      "type": "multiple_choice",
      "options": ["Muito seguro", "Seguro", "Neutro", "Inseguro", "Muito inseguro"],
      "required": true,
      "order": 1
    },
    {
      "id": "q2",
      "text": "Você já foi vítima de algum crime nos últimos 12 meses?",
      "type": "yes_no", 
      "required": true,
      "order": 2
    }
  ]',
  '[
    {
      "id": "area1",
      "survey_id": "660e8400-e29b-41d4-a716-446655440002",
      "name": "Região Central",
      "population": 40000,
      "quota": 300,
      "center_lat": -23.5505,
      "center_lng": -46.6333,
      "radius": 100,
      "assigned_researchers": []
    },
    {
      "id": "area2",
      "survey_id": "660e8400-e29b-41d4-a716-446655440002", 
      "name": "Periferia",
      "population": 40000,
      "quota": 300,
      "center_lat": -23.6005,
      "center_lng": -46.6833,
      "radius": 100,
      "assigned_researchers": []
    }
  ]'
) ON CONFLICT (id) DO NOTHING;
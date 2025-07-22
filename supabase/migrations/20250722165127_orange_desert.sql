/*
  # Criação das tabelas principais do FieldFocus

  1. Novas Tabelas
    - `users` - Usuários do sistema (admins e pesquisadores)
    - `surveys` - Pesquisas criadas pelos administradores
    - `interviews` - Entrevistas coletadas pelos pesquisadores

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para controle de acesso baseado em roles
*/

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'researcher')),
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de pesquisas
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  admin_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  population_size integer,
  margin_error numeric NOT NULL,
  confidence_level integer NOT NULL,
  expected_proportion numeric NOT NULL,
  sample_size integer NOT NULL,
  field_days integer NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]',
  areas jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de entrevistas
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES surveys(id) ON DELETE CASCADE,
  researcher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  area_id text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  location_validated boolean DEFAULT false,
  responses jsonb NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Políticas para surveys
CREATE POLICY "Admins can manage own surveys"
  ON surveys
  FOR ALL
  TO authenticated
  USING (admin_id::text = auth.uid()::text);

CREATE POLICY "Researchers can read active surveys"
  ON surveys
  FOR SELECT
  TO authenticated
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'researcher'
    )
  );

-- Políticas para interviews
CREATE POLICY "Researchers can manage own interviews"
  ON interviews
  FOR ALL
  TO authenticated
  USING (researcher_id::text = auth.uid()::text);

CREATE POLICY "Admins can read interviews from own surveys"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM surveys 
      WHERE surveys.id = interviews.survey_id 
      AND surveys.admin_id::text = auth.uid()::text
    )
  );

-- Inserir usuários de demonstração
INSERT INTO users (id, email, name, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@fieldfocus.com', 'Administrador', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440002', 'pesquisador@fieldfocus.com', 'João Silva', 'researcher')
ON CONFLICT (email) DO NOTHING;
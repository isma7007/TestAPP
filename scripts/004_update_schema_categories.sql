-- Actualizar esquema para soportar múltiples categorías y gamificación
-- Añadir tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  total_tests INTEGER DEFAULT 100,
  questions_per_test INTEGER DEFAULT 30,
  passing_score INTEGER DEFAULT 27,
  time_limit_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar todas las categorías
INSERT INTO categories (code, name, description, questions_per_test, passing_score, time_limit_minutes) VALUES
('B', 'Permiso B (Turismo)', 'Automóviles hasta 3.500 kg y hasta 8 plazas', 30, 27, 30),
('A1', 'Permiso A1 (Motocicleta)', 'Motocicletas hasta 125cc y 11kW', 30, 27, 30),
('A2', 'Permiso A2 (Motocicleta)', 'Motocicletas hasta 35kW', 30, 27, 30),
('AM', 'Permiso AM (Ciclomotor)', 'Ciclomotores hasta 50cc', 30, 27, 30),
('C1', 'Permiso C1 (Camión)', 'Vehículos entre 3.500 y 7.500 kg', 30, 27, 30),
('C', 'Permiso C (Camión)', 'Vehículos de más de 3.500 kg', 30, 27, 30),
('D1', 'Permiso D1 (Autobús)', 'Autobuses hasta 16 plazas', 30, 27, 30),
('D', 'Permiso D (Autobús)', 'Autobuses de más de 8 plazas', 30, 27, 30),
('BE', 'Permiso B+E (Remolque)', 'Turismo con remolque', 30, 27, 30),
('CE', 'Permiso C+E (Remolque)', 'Camión con remolque', 30, 27, 30),
('ADR', 'ADR (Mercancías peligrosas)', 'Transporte de mercancías peligrosas', 30, 27, 30),
('CAP_M', 'CAP (Mercancías)', 'Certificado de aptitud profesional mercancías', 30, 27, 30),
('CAP_V', 'CAP (Viajeros)', 'Certificado de aptitud profesional viajeros', 30, 27, 30),
('COMP_M', 'Comp. profesional (Mercancías)', 'Competencia profesional mercancías', 30, 27, 30),
('COMP_V', 'Comp. profesional (Viajeros)', 'Competencia profesional viajeros', 30, 27, 30),
('CS', 'Consejero de seguridad', 'Consejero de seguridad ADR', 30, 27, 30),
('RP', 'Recuperación de puntos', 'Curso de recuperación de puntos', 30, 27, 30)
ON CONFLICT (code) DO NOTHING;

-- Actualizar tabla de resultados para incluir categoría y modo
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS category_code VARCHAR(10) REFERENCES categories(code),
ADD COLUMN IF NOT EXISTS test_mode VARCHAR(20) DEFAULT 'exam' CHECK (test_mode IN ('exam', 'study')),
ADD COLUMN IF NOT EXISTS time_taken INTEGER DEFAULT 0;

-- Crear tabla de gamificación
CREATE TABLE IF NOT EXISTS user_gamification (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_code VARCHAR(10) REFERENCES categories(code),
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  tests_completed INTEGER DEFAULT 0,
  tests_passed INTEGER DEFAULT 0,
  perfect_scores INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity DATE DEFAULT CURRENT_DATE,
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_code)
);

-- Crear tabla de logros
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  points INTEGER DEFAULT 0,
  category_code VARCHAR(10) REFERENCES categories(code),
  condition_type VARCHAR(50) NOT NULL,
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar logros básicos
INSERT INTO achievements (code, name, description, icon, points, condition_type, condition_value) VALUES
('first_test', 'Primer Test', 'Completa tu primer test', 'trophy', 10, 'tests_completed', 1),
('first_pass', 'Primera Aprobación', 'Aprueba tu primer test', 'check-circle', 25, 'tests_passed', 1),
('perfect_score', 'Puntuación Perfecta', 'Consigue 30/30 en un test', 'star', 50, 'perfect_scores', 1),
('streak_3', 'Racha de 3', 'Aprueba 3 tests seguidos', 'flame', 30, 'streak', 3),
('streak_5', 'Racha de 5', 'Aprueba 5 tests seguidos', 'flame', 50, 'streak', 5),
('level_5', 'Nivel 5', 'Alcanza el nivel 5', 'award', 100, 'level', 5),
('level_10', 'Nivel 10', 'Alcanza el nivel 10', 'award', 200, 'level', 10),
('hundred_tests', '100 Tests', 'Completa 100 tests', 'target', 500, 'tests_completed', 100)
ON CONFLICT (code) DO NOTHING;

-- Función para actualizar gamificación
CREATE OR REPLACE FUNCTION update_gamification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar o actualizar estadísticas de gamificación
  INSERT INTO user_gamification (user_id, category_code, tests_completed, tests_passed, perfect_scores, total_points)
  VALUES (
    NEW.user_id, 
    NEW.category_code, 
    1, 
    CASE WHEN NEW.passed THEN 1 ELSE 0 END,
    CASE WHEN NEW.score = 30 THEN 1 ELSE 0 END,
    CASE 
      WHEN NEW.score = 30 THEN 50 -- Puntuación perfecta
      WHEN NEW.passed THEN 25 -- Aprobado
      ELSE 10 -- Completado
    END
  )
  ON CONFLICT (user_id, category_code) 
  DO UPDATE SET
    tests_completed = user_gamification.tests_completed + 1,
    tests_passed = user_gamification.tests_passed + CASE WHEN NEW.passed THEN 1 ELSE 0 END,
    perfect_scores = user_gamification.perfect_scores + CASE WHEN NEW.score = 30 THEN 1 ELSE 0 END,
    total_points = user_gamification.total_points + CASE 
      WHEN NEW.score = 30 THEN 50
      WHEN NEW.passed THEN 25
      ELSE 10
    END,
    level = GREATEST(1, (user_gamification.total_points + CASE 
      WHEN NEW.score = 30 THEN 50
      WHEN NEW.passed THEN 25
      ELSE 10
    END) / 100),
    last_activity = CURRENT_DATE,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para gamificación
DROP TRIGGER IF EXISTS gamification_trigger ON test_results;
CREATE TRIGGER gamification_trigger
  AFTER INSERT ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_gamification();

-- TABLA DE COLABORADORES Y RANKING
-- Ejecuta este código en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ranking_pos INTEGER, -- Posición real en el ranking basado en puntaje
  nombre TEXT NOT NULL,
  area TEXT NOT NULL,
  puntaje_total INTEGER DEFAULT 0,
  n_logros INTEGER DEFAULT 0,
  
  -- Habilidades Individuales (0 a 100)
  p_adaptabilidad INTEGER DEFAULT 0,
  p_resolucion_problemas INTEGER DEFAULT 0,
  p_objetividad INTEGER DEFAULT 0,
  p_integracion INTEGER DEFAULT 0,
  p_responsabilidad INTEGER DEFAULT 0,
  p_compromiso INTEGER DEFAULT 0,
  p_autogestion INTEGER DEFAULT 0,
  p_colaboracion INTEGER DEFAULT 0,
  p_negociacion INTEGER DEFAULT 0,
  p_comunicacion INTEGER DEFAULT 0,
  p_respeto INTEGER DEFAULT 0,
  p_creatividad INTEGER DEFAULT 0,
  p_actitud_positiva INTEGER DEFAULT 0,
  p_iniciativa INTEGER DEFAULT 0,
  
  -- Habilidades por Categoría (Promedios calculados)
  cat_trabajo_equipo INTEGER DEFAULT 0,
  cat_disciplina INTEGER DEFAULT 0,
  cat_servicio_cliente INTEGER DEFAULT 0,
  cat_participacion INTEGER DEFAULT 0,
  
  -- Datos de Clasificación y Recompensas
  clasificacion TEXT, -- E.g., 'General', 'Soldado'
  bono BOOLEAN DEFAULT FALSE,
  home_office BOOLEAN DEFAULT FALSE,
  tipo_recompensa TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_colaboradores_modtime
    BEFORE UPDATE ON colaboradores
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- Comentarios de tabla
COMMENT ON TABLE colaboradores IS 'Lista de colaboradores con sus puntajes, habilidades y clasificaciones militares.';

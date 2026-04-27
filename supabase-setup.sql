-- Execute este SQL no painel do Supabase (SQL Editor)
-- Cria a tabela que armazena todos os dados do sistema

CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atualiza o timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON app_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilita acesso público (RLS)
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_publico" ON app_data
  FOR ALL USING (true) WITH CHECK (true);

-- Habilita Realtime para sincronização entre usuários
ALTER PUBLICATION supabase_realtime ADD TABLE app_data;

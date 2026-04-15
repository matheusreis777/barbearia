-- Adicionar coluna bairro se não existir
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS bairro TEXT;

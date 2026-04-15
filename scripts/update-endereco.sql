-- Remover coluna endereco e adicionar novos campos
ALTER TABLE public.empresas DROP COLUMN IF EXISTS endereco;

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS estado TEXT;

-- Script para adicionar colunas faltantes na tabela empresas
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas de endereço
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS estado TEXT;

-- Remover coluna endereco antiga (se existir)
ALTER TABLE public.empresas DROP COLUMN IF EXISTS endereco;

-- Comment
COMMENT ON TABLE public.empresas IS 'Tabela de empresas com campos de endereço';

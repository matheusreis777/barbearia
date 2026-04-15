-- Script consolidado para atualizar tabela empresas (versão final)
-- Execute no Supabase SQL Editor

-- 1. Adicionar auth_id (se não existir)
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS auth_id UUID;

-- 2. Se ainda existir usuario_id, copiar dados (só executa se coluna existir)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'usuario_id') THEN
        UPDATE public.empresas e
        SET auth_id = u.auth_id
        FROM public.usuarios u
        WHERE e.usuario_id = u.id
        AND e.auth_id IS NULL;
    END IF;
END $$;

-- 3. Remover constraint unique se existir
ALTER TABLE public.empresas DROP CONSTRAINT IF EXISTS empresas_auth_id_key;

-- 4. Remover constraint FK antiga se existir
ALTER TABLE public.empresas DROP CONSTRAINT IF EXISTS fk_auth_user;

-- 5. Tornar auth_id não nulo (só se houver dados)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.empresas WHERE auth_id IS NOT NULL LIMIT 1) THEN
        ALTER TABLE public.empresas ALTER COLUMN auth_id SET NOT NULL;
    END IF;
END $$;

-- 6. Adicionar constraint de foreign key
ALTER TABLE public.empresas 
ADD CONSTRAINT fk_auth_user 
FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Remover coluna usuario_id (se ainda existir)
ALTER TABLE public.empresas DROP COLUMN IF EXISTS usuario_id;

-- 8. Remover coluna endereco antiga (se existir)
ALTER TABLE public.empresas DROP COLUMN IF EXISTS endereco;

-- 9. Adicionar colunas de endereço
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS estado TEXT;

-- Comentário
COMMENT ON COLUMN public.empresas.auth_id IS 'ID do usuário auth do Supabase';

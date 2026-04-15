-- Script para corrigir RLS da tabela empresas
-- Execute no Supabase SQL Editor

-- 1. Drop das policies existentes
DROP POLICY IF EXISTS "Usuários podem ver suas próprias empresas" ON public.empresas;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias empresas" ON public.empresas;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias empresas" ON public.empresas;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias empresas" ON public.empresas;

-- 2. Criar novas policies usando auth_id
CREATE POLICY "Usuários podem ver suas próprias empresas" ON public.empresas
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Usuários podem criar suas próprias empresas" ON public.empresas
  FOR INSERT WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas próprias empresas" ON public.empresas
  FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Usuários podem deletar suas próprias empresas" ON public.empresas
  FOR DELETE USING (auth_id = auth.uid());

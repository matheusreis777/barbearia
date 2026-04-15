-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Policy para usuários lerem seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados" ON public.usuarios
  FOR SELECT USING (auth.uid() = auth_id);

-- Policy para usuários atualizarem seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados" ON public.usuarios
  FOR UPDATE USING (auth.uid() = auth_id);

-- Policy para usuários criarem seus próprios dados
CREATE POLICY "Usuários podem criar seus próprios dados" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Policy para admin (servidor) acessar todos os dados
CREATE POLICY "Admin pode acessar todos os usuários" ON public.usuarios
  FOR ALL USING (auth.jwt() ->> 'role' = 'authenticated');

-- Criar função para inserir usuário automaticamente após cadastro no auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (auth_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comment
COMMENT ON TABLE public.usuarios IS 'Tabela de usuários vinculados ao auth do Supabase';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger que cria registro na tabela usuarios após cadastro no auth';

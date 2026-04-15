-- Criar tabela de empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Policy: usuário só vê suas próprias empresas
CREATE POLICY "Usuários podem ver suas próprias empresas" ON public.empresas
  FOR SELECT USING (usuario_id IN (SELECT id FROM public.usuarios WHERE auth_id = auth.uid()));

-- Policy: usuário só cria sua própria empresa
CREATE POLICY "Usuários podem criar suas próprias empresas" ON public.empresas
  FOR INSERT WITH CHECK (usuario_id IN (SELECT id FROM public.usuarios WHERE auth_id = auth.uid()));

-- Policy: usuário só atualiza suas próprias empresas
CREATE POLICY "Usuários podem atualizar suas próprias empresas" ON public.empresas
  FOR UPDATE USING (usuario_id IN (SELECT id FROM public.usuarios WHERE auth_id = auth.uid()));

-- Policy: usuário só deleta suas próprias empresas
CREATE POLICY "Usuários podem deletar suas próprias empresas" ON public.empresas
  FOR DELETE USING (usuario_id IN (SELECT id FROM public.usuarios WHERE auth_id = auth.uid()));

-- Comentários
COMMENT ON TABLE public.empresas IS 'Tabela de empresas vinculadas aos usuários';

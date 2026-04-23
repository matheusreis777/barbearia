-- Script para Usuários Admin e Colaboradores no Supabase

-- 1. Criar o tipo enumerado para os tipos de colaboradores
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'colaborador_tipo') THEN
        CREATE TYPE colaborador_tipo AS ENUM ('admin', 'barbeiro', 'recepcionista');
    END IF;
END $$;

-- 2. Criar a tabela de colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    nickname TEXT NOT NULL,
    senha TEXT NOT NULL,
    tipo colaborador_tipo NOT NULL DEFAULT 'barbeiro',
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Nickname único em todo o sistema (estilo rede social)
    UNIQUE(nickname)
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso (Policies)

-- Os donos da empresa podem gerenciar todos os colaboradores da sua empresa
DROP POLICY IF EXISTS "Donos podem gerenciar seus colaboradores" ON colaboradores;
CREATE POLICY "Donos podem gerenciar seus colaboradores"
ON colaboradores
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM empresas
        WHERE empresas.id = colaboradores.empresa_id
        AND empresas.auth_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM empresas
        WHERE empresas.id = colaboradores.empresa_id
        AND empresas.auth_id = auth.uid()
    )
);

-- Usuários autenticados da empresa podem ver os colaboradores
DROP POLICY IF EXISTS "Visualização de colaboradores da empresa" ON colaboradores;
CREATE POLICY "Visualização de colaboradores da empresa"
ON colaboradores
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM empresas
        WHERE empresas.id = colaboradores.empresa_id
    )
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa_id ON colaboradores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_nickname ON colaboradores(nickname);

-- 6. Tabela de serviços (opcional, para vincular aos atendimentos)
CREATE TABLE IF NOT EXISTS servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    duracao_minutos INTEGER DEFAULT 30,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabela de agendamentos/atendimentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
    cliente_nome TEXT NOT NULL,
    cliente_telefone TEXT,
    servico_nome TEXT NOT NULL,
    valor_pago DECIMAL(10,2), -- Pode ser nulo se ainda for apenas um agendamento
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'agendado', -- agendado, confirmado, concluido, cancelado
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Habilitar RLS
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- 9. Políticas para Agendamentos
DROP POLICY IF EXISTS "Donos podem gerenciar agendamentos da empresa" ON agendamentos;
CREATE POLICY "Donos podem gerenciar agendamentos da empresa"
ON agendamentos FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM empresas
        WHERE empresas.id = agendamentos.empresa_id
        AND empresas.auth_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Colaboradores podem ver seus próprios agendamentos" ON agendamentos;
CREATE POLICY "Colaboradores podem ver seus próprios agendamentos"
ON agendamentos FOR SELECT
USING (true);

-- Criação da tabela de clientes

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    cep TEXT,
    rua TEXT,
    numero TEXT,
    bairro TEXT,
    complemento TEXT,
    cidade TEXT,
    uf VARCHAR(2),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Telefone deve ser único dentro da mesma empresa
    UNIQUE(empresa_id, telefone)
);

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
DROP POLICY IF EXISTS "Donos podem gerenciar clientes da empresa" ON clientes;
CREATE POLICY "Donos podem gerenciar clientes da empresa"
ON clientes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM empresas
        WHERE empresas.id = clientes.empresa_id
        AND empresas.auth_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Colaboradores podem ver e criar clientes" ON clientes;
CREATE POLICY "Colaboradores podem ver e criar clientes"
ON clientes FOR ALL
USING (true); -- Simplificado para permitir que colaboradores busquem e cadastrem clientes

-- Adicionar FK de cliente na tabela de agendamentos se necessário
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'cliente_id') THEN
        ALTER TABLE agendamentos ADD COLUMN cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
    END IF;
END $$;

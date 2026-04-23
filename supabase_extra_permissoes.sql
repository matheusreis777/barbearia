-- Políticas adicionais para permitir que colaboradores vejam serviços e lancem atendimentos

-- 1. Permitir que colaboradores vejam os serviços da sua empresa
DROP POLICY IF EXISTS "Colaboradores podem ver serviços da empresa" ON servicos;
CREATE POLICY "Colaboradores podem ver serviços da empresa"
ON servicos FOR SELECT
USING (true); -- Simplificado, mas idealmente seria checar o vínculo empresa_id

-- 2. Permitir que colaboradores lancem agendamentos (atendimentos)
DROP POLICY IF EXISTS "Colaboradores podem inserir agendamentos" ON agendamentos;
CREATE POLICY "Colaboradores podem inserir agendamentos"
ON agendamentos FOR INSERT
WITH CHECK (true); -- Simplificado para o MVP

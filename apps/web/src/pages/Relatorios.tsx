import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getUser } from '@barbearia/auth';

interface Atendimento {
  id: string;
  cliente_nome: string;
  servico_nome: string;
  colaborador_id: string | null;
  valor_pago: number;
  data_inicio: string;
  status: string;
}

interface Colaborador {
  id: string;
  nome: string;
}

export default function Relatorios() {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterColab, setFilterColab] = useState('');
  const [filterServico, setFilterServico] = useState('');
  const [filterData, setFilterData] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (empresa) {
        setEmpresaId(empresa.id);
        
        // Buscar Colaboradores para o filtro
        const { data: cols } = await supabase
          .from('colaboradores')
          .select('id, nome')
          .eq('empresa_id', empresa.id);
        setColaboradores(cols || []);

        // Buscar Atendimentos (todos os concluídos)
        const { data: atends, error: err } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('empresa_id', empresa.id)
          .eq('status', 'concluido')
          .order('data_inicio', { ascending: false });

        if (err) throw err;
        setAtendimentos(atends || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAtendimentos = atendimentos.filter(a => {
    const matchColab = !filterColab || a.colaborador_id === filterColab || (filterColab === 'admin' && !a.colaborador_id);
    const matchServico = !filterServico || a.servico_nome.toLowerCase().includes(filterServico.toLowerCase());
    const matchData = !filterData || a.data_inicio.startsWith(filterData);
    return matchColab && matchServico && matchData;
  });

  const totalFaturado = filteredAtendimentos.reduce((acc, curr) => acc + Number(curr.valor_pago), 0);

  if (loading) return <div style={styles.loadingContainer}><div style={styles.spinner}></div></div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
            ← Voltar
          </button>
          <h1 style={styles.title}>Relatório de Atendimentos</h1>
        </div>
      </header>

      <div style={styles.main}>
        <section style={styles.filtersCard}>
          <h2 style={styles.cardTitle}>Filtros</h2>
          <div style={styles.filterGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Colaborador</label>
              <select 
                style={styles.input} 
                value={filterColab} 
                onChange={(e) => setFilterColab(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="admin">Administrador (Sem vínculo)</option>
                {colaboradores.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            
            <div style={styles.field}>
              <label style={styles.label}>Serviço</label>
              <input 
                type="text" 
                placeholder="Ex: Corte" 
                style={styles.input}
                value={filterServico}
                onChange={(e) => setFilterServico(e.target.value)}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Data</label>
              <input 
                type="date" 
                style={styles.input}
                value={filterData}
                onChange={(e) => setFilterData(e.target.value)}
              />
            </div>
          </div>
          
          <div style={styles.summaryBox}>
             <span style={styles.summaryLabel}>Total no Período / Filtro</span>
             <span style={styles.summaryValue}>R$ {totalFaturado.toFixed(2)}</span>
          </div>
        </section>

        <section style={styles.listCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Resultados ({filteredAtendimentos.length})</h2>
          </div>
          
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data/Hora</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Serviço</th>
                  <th style={styles.th}>Profissional</th>
                  <th style={styles.th}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredAtendimentos.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.emptyTd}>Nenhum atendimento encontrado para os filtros selecionados.</td>
                  </tr>
                ) : (
                  filteredAtendimentos.map((a) => (
                    <tr key={a.id} style={styles.tr}>
                      <td style={styles.td}>
                        {new Date(a.data_inicio).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={styles.td}>{a.cliente_nome}</td>
                      <td style={styles.td}>
                        <span style={styles.servicoBadge}>{a.servico_nome}</span>
                      </td>
                      <td style={styles.td}>
                        {a.colaborador_id 
                          ? colaboradores.find(c => c.id === a.colaborador_id)?.nome || 'Removido'
                          : 'Administrador'
                        }
                      </td>
                      <td style={{...styles.td, fontWeight: 'bold', color: '#ff6600'}}>
                        R$ {Number(a.valor_pago).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '40px 20px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#a0a0a0',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '8px',
    padding: 0,
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ff6600',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  filtersCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    color: '#a0a0a0',
    fontWeight: '500',
  },
  input: {
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
  },
  summaryBox: {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #ff660033',
  },
  summaryLabel: {
    color: '#a0a0a0',
    fontSize: '14px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ff6600',
  },
  listCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  cardHeader: {
    marginBottom: '20px',
    borderBottom: '1px solid #404040',
    paddingBottom: '12px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    color: '#a0a0a0',
    fontSize: '13px',
    fontWeight: '600',
    borderBottom: '2px solid #404040',
  },
  tr: {
    borderBottom: '1px solid #333',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '16px 12px',
    fontSize: '14px',
  },
  servicoBadge: {
    backgroundColor: '#2d2d2d',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #404040',
    fontSize: '12px',
  },
  emptyTd: {
    textAlign: 'center',
    padding: '40px',
    color: '#a0a0a0',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #2d2d2d',
    borderTop: '4px solid #ff6600',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

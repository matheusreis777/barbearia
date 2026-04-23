import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getUser } from '@barbearia/auth';

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao_minutos: number;
  ativo: boolean;
}

export default function Servicos() {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('30');

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
        const { data: servs, error: err } = await supabase
          .from('servicos')
          .select('*')
          .eq('empresa_id', empresa.id)
          .order('nome');

        if (err) throw err;
        setServicos(servs || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return;
    
    setError('');
    setSaving(true);
    
    try {
      const { data, error: insertError } = await supabase
        .from('servicos')
        .insert({
          empresa_id: empresaId,
          nome,
          preco: parseFloat(preco),
          duracao_minutos: parseInt(duracao)
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setServicos([...servicos, data]);
      setNome('');
      setPreco('');
      setDuracao('30');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar serviço.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('servicos')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (updateError) throw updateError;
      
      setServicos(servicos.map(s => 
        s.id === id ? { ...s, ativo: !currentStatus } : s
      ));
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
    }
  };

  if (loading) return <div style={styles.loadingContainer}><div style={styles.spinner}></div></div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
            ← Voltar
          </button>
          <h1 style={styles.title}>Catálogo de Serviços</h1>
        </div>
      </header>

      <div style={styles.main}>
        <section style={styles.section}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Novo Serviço</h2>
            {error && <div style={styles.error}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Nome do Serviço</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  style={styles.input}
                  placeholder="Ex: Corte de Cabelo"
                  required
                />
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    style={styles.input}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Duração (min)</label>
                  <input
                    type="number"
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <button type="submit" style={styles.button} disabled={saving}>
                {saving ? 'Salvando...' : 'Adicionar ao Catálogo'}
              </button>
            </form>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Serviços Cadastrados</h2>
            <div style={styles.grid}>
              {servicos.length === 0 ? (
                <p style={styles.emptyText}>Nenhum serviço cadastrado.</p>
              ) : (
                servicos.map((s) => (
                  <div key={s.id} style={{
                    ...styles.serviceCard,
                    borderColor: s.ativo ? '#404040' : '#3d1f1f',
                    opacity: s.ativo ? 1 : 0.7
                  }}>
                    <div style={styles.serviceHeader}>
                      <span style={styles.serviceName}>{s.nome}</span>
                      <button 
                        onClick={() => handleToggleAtivo(s.id, s.ativo)}
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: s.ativo ? '#10b98122' : '#ef444422',
                          color: s.ativo ? '#10b981' : '#ef4444',
                          borderColor: s.ativo ? '#10b98144' : '#ef444444'
                        }}
                      >
                        {s.ativo ? 'ATIVO' : 'INATIVO'}
                      </button>
                    </div>
                    
                    <div style={styles.serviceBody}>
                      <div style={styles.priceTag}>
                        <span style={styles.currency}>R$</span>
                        <span style={styles.value}>{Number(s.preco).toFixed(2)}</span>
                      </div>
                      <div style={styles.durationBadge}>
                        ⏱️ {s.duracao_minutos} min
                      </div>
                    </div>

                    <div style={styles.serviceFooter}>
                       <button 
                        onClick={() => handleToggleAtivo(s.id, s.ativo)}
                        style={styles.toggleBtn}
                       >
                         {s.ativo ? 'Pausar Serviço' : 'Ativar Serviço'}
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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
    maxWidth: '1000px',
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
    maxWidth: '1000px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#ff6600',
    borderBottom: '1px solid #404040',
    paddingBottom: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#a0a0a0',
  },
  input: {
    padding: '12px 14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
  },
  button: {
    padding: '14px',
    backgroundColor: '#ff6600',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    backgroundColor: '#3d1f1f',
    color: '#ff6600',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid #5a2a2a',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  serviceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #404040',
    transition: 'all 0.2s ease',
  },
  serviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  serviceName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid',
    background: 'none',
    cursor: 'pointer',
  },
  serviceBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  priceTag: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  currency: {
    fontSize: '14px',
    color: '#ff6600',
    fontWeight: '600',
  },
  value: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ff6600',
  },
  durationBadge: {
    fontSize: '13px',
    color: '#a0a0a0',
    backgroundColor: '#2d2d2d',
    padding: '6px 12px',
    borderRadius: '10px',
  },
  serviceFooter: {
    borderTop: '1px solid #2d2d2d',
    paddingTop: '16px',
  },
  toggleBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'transparent',
    border: '1px solid #404040',
    borderRadius: '10px',
    color: '#a0a0a0',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  emptyText: {
    textAlign: 'center',
    color: '#a0a0a0',
    padding: '40px',
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

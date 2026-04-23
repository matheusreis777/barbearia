import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getUser } from '@barbearia/auth';

interface Colaborador {
  id: string;
  nome: string;
  nickname: string;
  tipo: string;
  ativo: boolean;
}

export default function Colaboradores() {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [nome, setNome] = useState('');
  const [nickname, setNickname] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('barbeiro');

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

      // Buscar ID da empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (empresa) {
        setEmpresaId(empresa.id);
        
        // Buscar colaboradores
        const { data: cols, error: err } = await supabase
          .from('colaboradores')
          .select('*')
          .eq('empresa_id', empresa.id)
          .order('nome');

        if (err) throw err;
        setColaboradores(cols || []);
      } else {
        navigate('/cadastro-empresa');
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar dados.');
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
        .from('colaboradores')
        .insert({
          empresa_id: empresaId,
          nome,
          nickname,
          senha, // Idealmente seria hasheada no backend/edge function
          tipo
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.message.includes('unique')) {
          throw new Error('Este nickname já está em uso por outro usuário no sistema.');
        }
        throw insertError;
      }

      setColaboradores([...colaboradores, data]);
      
      // Limpar form
      setNome('');
      setNickname('');
      setSenha('');
      setTipo('barbeiro');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar colaborador.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('colaboradores')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (updateError) throw updateError;
      
      setColaboradores(colaboradores.map(c => 
        c.id === id ? { ...c, ativo: !currentStatus } : c
      ));
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status.');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
            ← Voltar
          </button>
          <h1 style={styles.title}>Colaboradores</h1>
        </div>
      </header>

      <div style={styles.main}>
        <section style={styles.section}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Novo Colaborador</h2>
            {error && <div style={styles.error}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  style={styles.input}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Nickname (Login)</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    style={styles.input}
                    placeholder="joaosilva"
                    required
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    style={styles.input}
                    placeholder="******"
                    required
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Tipo de Acesso</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  style={styles.select}
                >
                  <option value="barbeiro">Barbeiro</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <button type="submit" style={styles.button} disabled={saving}>
                {saving ? 'Cadastrando...' : 'Cadastrar Colaborador'}
              </button>
            </form>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Lista de Colaboradores</h2>
            <div style={styles.list}>
              {colaboradores.length === 0 ? (
                <p style={styles.emptyText}>Nenhum colaborador cadastrado.</p>
              ) : (
                colaboradores.map((col) => (
                  <div key={col.id} style={styles.listItem}>
                    <div style={styles.listInfo}>
                      <span style={styles.name}>{col.nome}</span>
                      <span style={styles.nickname}>@{col.nickname}</span>
                      <span style={{...styles.badge, ...styles.badgeType}}>
                        {col.tipo}
                      </span>
                    </div>
                    <div style={styles.listActions}>
                      <button 
                        onClick={() => handleToggleAtivo(col.id, col.ativo)}
                        style={{
                          ...styles.statusButton,
                          backgroundColor: col.ativo ? '#10b981' : '#ef4444'
                        }}
                      >
                        {col.ativo ? 'Ativo' : 'Inativo'}
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
  select: {
    padding: '12px 14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
    cursor: 'pointer',
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
    transition: 'background-color 0.2s',
  },
  error: {
    backgroundColor: '#3d1f1f',
    color: '#ff6b6b',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
    border: '1px solid #5a2a2a',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listItem: {
    backgroundColor: '#1a1a1a',
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #404040',
  },
  listInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  name: {
    fontSize: '16px',
    fontWeight: '600',
  },
  nickname: {
    fontSize: '13px',
    color: '#a0a0a0',
  },
  badge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
    width: 'fit-content',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  badgeType: {
    backgroundColor: '#ff660022',
    color: '#ff6600',
    border: '1px solid #ff660044',
  },
  statusButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    minWidth: '70px',
  },
  emptyText: {
    textAlign: 'center',
    color: '#a0a0a0',
    padding: '20px',
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

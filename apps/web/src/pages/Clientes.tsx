import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getUser } from '@barbearia/auth';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  criado_em: string;
}

export default function Clientes() {
  const navigate = useNavigate();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

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
        const { data: cls, error: err } = await supabase
          .from('clientes')
          .select('*')
          .eq('empresa_id', empresa.id)
          .order('nome');

        if (err) throw err;
        setClientes(cls || []);
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
    } else if (value.length > 0) {
      value = value.replace(/^(\d{0,2}).*/, '($1');
    }
    setTelefone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return;
    
    setError('');
    setSaving(true);
    
    try {
      const cleanPhone = telefone.replace(/\D/g, '');
      
      const { data, error: insertError } = await supabase
        .from('clientes')
        .insert({
          empresa_id: empresaId,
          nome,
          telefone: cleanPhone
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Este telefone já está cadastrado.');
        }
        throw insertError;
      }

      setClientes([data, ...clientes]);
      setNome('');
      setTelefone('');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar cliente.');
    } finally {
      setSaving(false);
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.telefone.includes(searchTerm.replace(/\D/g, ''))
  );

  if (loading) return <div style={styles.loadingContainer}><div style={styles.spinner}></div></div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
            ← Voltar
          </button>
          <h1 style={styles.title}>Gestão de Clientes</h1>
        </div>
      </header>

      <div style={styles.main}>
        <section style={styles.section}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Novo Cliente</h2>
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

              <div style={styles.field}>
                <label style={styles.label}>WhatsApp / Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={handlePhoneChange}
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <button type="submit" style={styles.button} disabled={saving}>
                {saving ? 'Cadastrando...' : 'Cadastrar Cliente'}
              </button>
            </form>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Clientes Base</h2>
              <input 
                type="text" 
                placeholder="Pesquisar por nome ou tel..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            
            <div style={styles.grid}>
              {filteredClientes.length === 0 ? (
                <p style={styles.emptyText}>Nenhum cliente encontrado.</p>
              ) : (
                filteredClientes.map((c) => (
                  <div key={c.id} style={styles.clientCard}>
                    <div style={styles.clientIcon}>👤</div>
                    <div style={styles.clientInfo}>
                      <span style={styles.clientName}>{c.nome}</span>
                      <span style={styles.clientPhone}>
                        {c.telefone.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                      </span>
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
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #404040',
    paddingBottom: '12px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ff6600',
    margin: 0,
  },
  searchInput: {
    padding: '8px 12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    width: '250px',
    outline: 'none',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '15px',
    outline: 'none',
  },
  button: {
    padding: '14px',
    backgroundColor: '#ff6600',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  clientCard: {
    backgroundColor: '#1a1a1a',
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #404040',
  },
  clientIcon: {
    width: '44px',
    height: '44px',
    backgroundColor: '#2d2d2d',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
  },
  clientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  clientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
  },
  clientPhone: {
    fontSize: '14px',
    color: '#a0a0a0',
  },
  emptyText: {
    textAlign: 'center',
    color: '#a0a0a0',
    padding: '40px',
    gridColumn: '1 / -1',
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

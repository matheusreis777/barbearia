import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, signOut, supabase } from '@barbearia/auth';

interface Colaborador {
  id: string;
  nome: string;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [colaboradorId, setColaboradorId] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [valorFinal, setValorFinal] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agendamentosHoje, setAgendamentosHoje] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const { data: { user: authUser } } = await getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }
      setUser(authUser);

      // Buscar Empresa
      const { data: empresaData } = await supabase
        .from('empresas')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (empresaData) {
        setEmpresa(empresaData);
        
        // Buscar Colaboradores
        const { data: cols } = await supabase
          .from('colaboradores')
          .select('id, nome')
          .eq('empresa_id', empresaData.id)
          .eq('ativo', true);
        setColaboradores(cols || []);

        // Buscar Serviços
        const { data: servs } = await supabase
          .from('servicos')
          .select('id, nome, preco')
          .eq('empresa_id', empresaData.id)
          .eq('ativo', true);
        setServicos(servs || []);

        // Buscar Agendamentos de Hoje para o resumo
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const { data: agends } = await supabase
          .from('agendamentos')
          .select('*')
          .eq('empresa_id', empresaData.id)
          .eq('status', 'concluido')
          .gte('data_inicio', hoje.toISOString());
        setAgendamentosHoje(agends || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar cliente por telefone (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const digits = clienteTelefone.replace(/\D/g, '');
      if (digits.length >= 10 && empresa) {
        const { data } = await supabase
          .from('clientes')
          .select('id, nome')
          .eq('empresa_id', empresa.id)
          .eq('telefone', digits)
          .maybeSingle();
        
        if (data) {
          setClienteId(data.id);
          setClienteNome(data.nome);
        } else {
          setClienteId(null);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [clienteTelefone, empresa]);

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
    setClienteTelefone(value);
  };

  const handleLaunchService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa || !servicoId) return; // Removida obrigatoriedade de colaboradorId
    setSaving(true);
    
    try {
      const servico = servicos.find(s => s.id === servicoId);
      const agora = new Date();
      let finalClienteId = clienteId;

      if (!finalClienteId) {
        const { data: newClient, error: clientErr } = await supabase
          .from('clientes')
          .insert({
            empresa_id: empresa.id,
            nome: clienteNome,
            telefone: clienteTelefone.replace(/\D/g, '')
          })
          .select('id')
          .single();
        
        if (clientErr) throw clientErr;
        finalClienteId = newClient.id;
      }
      
      const { error } = await supabase
        .from('agendamentos')
        .insert({
          empresa_id: empresa.id,
          colaborador_id: colaboradorId || null, // Se não selecionar, salva como nulo
          cliente_id: finalClienteId,
          cliente_nome: clienteNome,
          servico_nome: servico?.nome,
          valor_pago: parseFloat(valorFinal),
          data_inicio: agora.toISOString(),
          data_fim: new Date(agora.getTime() + 30 * 60000).toISOString(),
          status: 'concluido'
        });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowModal(false);
        setClienteNome('');
        setClienteTelefone('');
        setClienteId(null);
        setColaboradorId('');
        setServicoId('');
        setValorFinal('');
        fetchInitialData();
      }, 1500);

    } catch (err) {
      console.error(err);
      alert('Erro ao lançar serviço');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) return <div style={styles.container}><p style={{color: 'white'}}>Carregando...</p></div>;

  const faturamentoHoje = agendamentosHoje.reduce((acc, curr) => acc + Number(curr.valor_pago), 0);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes modalScale {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes successPop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>{empresa?.nome || 'Dashboard'}</h1>
        <button onClick={handleSignOut} style={styles.button}>Sair</button>
      </div>

      <div style={styles.card}>
        <div style={styles.dashboardHeader}>
          <div>
            <h2 style={styles.subtitle}>Painel Administrativo</h2>
            <p style={styles.text}>{user?.user_metadata?.nome || user?.email}</p>
          </div>
          <div style={styles.todaySummary}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Faturamento Hoje</span>
              <span style={styles.summaryValue}>R$ {faturamentoHoje.toFixed(2)}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Atendimentos</span>
              <span style={styles.summaryValue}>{agendamentosHoje.length}</span>
            </div>
          </div>
        </div>
        
        <div style={styles.menuGrid}>
          <button 
            onClick={() => setShowModal(true)} 
            style={{...styles.menuCard, background: 'linear-gradient(135deg, #ff6600, #ff8533)'}}
          >
            <span style={styles.menuIcon}>✂️</span>
            <span style={{...styles.menuTitle, color: 'white'}}>Novo Atendimento</span>
            <span style={{...styles.menuDesc, color: '#ffebdc'}}>Lançar serviço realizado</span>
          </button>

          <button 
            onClick={() => navigate('/servicos')} 
            style={styles.menuCard}
          >
            <span style={styles.menuIcon}>🏷️</span>
            <span style={styles.menuTitle}>Serviços</span>
            <span style={styles.menuDesc}>Catálogo e preços</span>
          </button>

          <button 
            onClick={() => navigate('/colaboradores')} 
            style={styles.menuCard}
          >
            <span style={styles.menuIcon}>👥</span>
            <span style={styles.menuTitle}>Equipe</span>
            <span style={styles.menuDesc}>Gerenciar profissionais</span>
          </button>
          
          <button style={{...styles.menuCard, opacity: 0.5, cursor: 'default'}}>
            <span style={styles.menuIcon}>📅</span>
            <span style={styles.menuTitle}>Agenda</span>
            <span style={styles.menuDesc}>Em breve</span>
          </button>
        </div>
      </div>

      {/* Modal Lançamento */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            {success ? (
              <div style={styles.successContainer}>
                <div style={styles.successCheck}>✓</div>
                <h3 style={styles.successTitle}>Lançado com Sucesso!</h3>
                <p style={styles.successSubtitle}>O faturamento diário foi atualizado.</p>
              </div>
            ) : (
              <>
                <div style={styles.modalHeader}>
                  <h3 style={{color: '#ff6600', margin: 0}}>Lançar Atendimento</h3>
                  <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
                </div>
                
                <form onSubmit={handleLaunchService} style={styles.modalForm}>
                  <div style={styles.field}>
                    <label style={styles.label}>WhatsApp / Telefone</label>
                    <input
                      type="text"
                      value={clienteTelefone}
                      onChange={handlePhoneChange}
                      style={styles.input}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>
                      Nome do Cliente {clienteId && <span style={{color: '#10b981', fontSize: '11px', fontWeight: 'bold'}}>• CADASTRADO</span>}
                    </label>
                    <input
                      type="text"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      style={{
                        ...styles.input,
                        borderColor: clienteId ? '#10b981' : '#404040',
                        backgroundColor: clienteId ? '#064e3b22' : '#1a1a1a'
                      }}
                      placeholder="Nome"
                      required
                      disabled={!!clienteId}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Profissional</label>
                    <select 
                      style={styles.input} 
                      value={colaboradorId}
                      onChange={(e) => setColaboradorId(e.target.value)}
                    >
                      <option value="">Próprio Administrador / Nenhum</option>
                      {colaboradores.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Serviço</label>
                    <select 
                      style={styles.input} 
                      value={servicoId}
                      onChange={(e) => {
                        const s = servicos.find(x => x.id === e.target.value);
                        setServicoId(e.target.value);
                        if (s) setValorFinal(s.preco.toString());
                      }}
                      required
                    >
                      <option value="">Selecione o serviço...</option>
                      {servicos.map(s => (
                        <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Valor Final (R$)</label>
                    <div style={styles.inputWithPrefix}>
                      <span style={styles.prefix}>R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={valorFinal}
                        onChange={(e) => setValorFinal(e.target.value)}
                        style={styles.inputBare}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" style={styles.submitBtn} disabled={saving}>
                    {saving ? 'Processando...' : 'Confirmar Lançamento'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    backgroundColor: '#1a1a1a',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    maxWidth: '1000px',
    margin: '0 auto 32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ff6600',
    margin: 0,
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  subtitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#ff6600',
  },
  userInfo: {
    marginBottom: '32px',
    paddingBottom: '20px',
    borderBottom: '1px solid #404040',
  },
  text: {
    marginBottom: '4px',
    color: '#a0a0a0',
    fontSize: '15px',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },
  menuCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: 'white',
  },
  menuIcon: {
    fontSize: '32px',
    marginBottom: '16px',
  },
  menuTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#ff6600',
  },
  menuDesc: {
    fontSize: '14px',
    color: '#a0a0a0',
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#2d2d2d',
    width: '100%',
    maxWidth: '450px',
    padding: '28px',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    animation: 'modalScale 0.3s ease-out',
    border: '1px solid #444',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#a0a0a0',
    fontSize: '20px',
    cursor: 'pointer',
  },
  modalForm: {
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
    fontSize: '13px',
    color: '#a0a0a0',
    fontWeight: '600',
  },
  input: {
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
  },
  submitBtn: {
    padding: '14px',
    backgroundColor: '#ff6600',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px',
    cursor: 'pointer',
    transition: 'transform 0.1s, background-color 0.2s',
  },
  dashboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #404040',
    flexWrap: 'wrap',
    gap: '20px',
  },
  todaySummary: {
    display: 'flex',
    gap: '24px',
    backgroundColor: '#1a1a1a',
    padding: '16px 24px',
    borderRadius: '16px',
    border: '1px solid #404040',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#a0a0a0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ff6600',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    animation: 'successPop 0.5s ease-out forwards',
  },
  successCheck: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
  },
  successTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '8px',
  },
  successSubtitle: {
    fontSize: '15px',
    color: '#a0a0a0',
  },
  inputWithPrefix: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '10px',
    padding: '0 12px',
    gap: '8px',
  },
  prefix: {
    color: '#606060',
    fontSize: '15px',
    fontWeight: 'bold',
  },
  inputBare: {
    padding: '12px 0',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
  },
};

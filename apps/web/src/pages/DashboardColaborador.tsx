import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@barbearia/auth';

interface Agendamento {
  id: string;
  cliente_nome: string;
  servico_nome: string;
  valor_pago: number;
  data_inicio: string;
  status: string;
}

export default function DashboardColaborador() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [servicos, setServicos] = useState<any[]>([]);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [servicoId, setServicoId] = useState('');
  const [valorFinal, setValorFinal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem('barbearia_collab_session');
    if (!savedSession) {
      navigate('/login-colaborador');
      return;
    }
    const parsedSession = JSON.parse(savedSession);
    setSession(parsedSession);
    
    fetchAgendamentos(parsedSession.id);
    fetchServicos(parsedSession.empresa_id);
  }, [navigate]);

  // Buscar cliente por telefone
  useEffect(() => {
    const timer = setTimeout(async () => {
      const digits = clienteTelefone.replace(/\D/g, '');
      if (digits.length >= 10 && session) {
        const { data } = await supabase
          .from('clientes')
          .select('id, nome')
          .eq('empresa_id', session.empresa_id)
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
  }, [clienteTelefone, session]);

  const fetchServicos = async (empresaId: string) => {
    try {
      const { data } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true);
      setServicos(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgendamentos = async (collabId: string) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('colaborador_id', collabId)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      setAgendamentos(data || []);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    // Aplicar máscara (00) 00000-0000
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
    if (!session || !servicoId) return;
    setSaving(true);
    
    try {
      const servico = servicos.find(s => s.id === servicoId);
      const agora = new Date();
      let finalClienteId = clienteId;

      // Se não houver clienteId (novo cliente), cadastrar agora
      if (!finalClienteId) {
        const { data: newClient, error: clientErr } = await supabase
          .from('clientes')
          .insert({
            empresa_id: session.empresa_id,
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
          empresa_id: session.empresa_id,
          colaborador_id: session.id,
          cliente_id: finalClienteId,
          cliente_nome: clienteNome,
          servico_nome: servico.nome,
          valor_pago: parseFloat(valorFinal),
          data_inicio: agora.toISOString(),
          data_fim: new Date(agora.getTime() + 30 * 60000).toISOString(),
          status: 'concluido'
        });

      if (error) throw error;
      
      // Reset and close
      setShowModal(false);
      setClienteNome('');
      setClienteTelefone('');
      setClienteId(null);
      setServicoId('');
      setValorFinal('');
      fetchAgendamentos(session.id);
    } catch (err) {
      alert('Erro ao lançar serviço');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('barbearia_collab_session');
    navigate('/login-colaborador');
  };

  if (!session) return null;

  const totalGeral = agendamentos
    .filter(a => a.status === 'concluido')
    .reduce((acc, current) => acc + Number(current.valor_pago || 0), 0);
    
  const totalHoje = agendamentos
    .filter(a => a.status === 'concluido' && new Date(a.data_inicio).toDateString() === new Date().toDateString())
    .reduce((acc, current) => acc + Number(current.valor_pago || 0), 0);

  // Filtrar agendamentos do dia por status
  const hojeStr = new Date().toDateString();
  const proximosAgendamentos = agendamentos
    .filter(a => a.status === 'agendado' && new Date(a.data_inicio).toDateString() === hojeStr)
    .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

  const ultimosAtendimentos = agendamentos
    .filter(a => a.status === 'concluido')
    .slice(0, 5);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes modalScale {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <header style={styles.header}>
        <div style={styles.headerMain}>
          <div style={styles.brand}>
            <span style={styles.brandDot}></span>
            <h1 style={styles.headerTitle}>{session.empresa_nome}</h1>
          </div>
          <button onClick={handleLogout} style={styles.logoutIconButton}>
            🚪
          </button>
        </div>
        <div style={styles.profileSection}>
          <div style={styles.avatar}>
            {session.nome.charAt(0).toUpperCase()}
          </div>
          <div style={styles.userMeta}>
            <h2 style={styles.userName}>Olá, {session.nome.split(' ')[0]}</h2>
            <span style={styles.userRole}>{session.tipo}</span>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Quick Actions */}
        <div style={styles.actionGrid}>
          <button 
            onClick={() => setShowModal(true)}
            style={{...styles.actionCard, background: 'linear-gradient(135deg, #ff6600, #ff8533)'}}
          >
            <span style={styles.actionIcon}>✂️</span>
            <span style={styles.actionText}>Novo Serviço</span>
          </button>
          <button 
            onClick={() => navigate('/agenda-colaborador')}
            style={{...styles.actionCard, background: '#2d2d2d'}}
          >
            <span style={styles.actionIcon}>📅</span>
            <span style={styles.actionText}>Ver Agenda</span>
          </button>
        </div>

        {/* Modal Lançamento */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3>Lançar Atendimento</h3>
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
                    Nome do Cliente {clienteId && <span style={{color: '#10b981', fontSize: '11px'}}>(✓ Identificado)</span>}
                  </label>
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    style={styles.input}
                    placeholder="Nome"
                    required
                    disabled={!!clienteId}
                  />
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
                    <option value="">Selecione...</option>
                    {servicos.map(s => (
                      <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Valor Final (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={valorFinal}
                    onChange={(e) => setValorFinal(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <button type="submit" style={styles.submitBtn} disabled={saving}>
                  {saving ? 'Salvando...' : 'Confirmar Atendimento'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {session.tipo === 'barbeiro' && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Hoje</span>
                <span style={styles.statValue}>R$ {totalHoje.toFixed(2)}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total</span>
                <span style={styles.statValue}>R$ {totalGeral.toFixed(2)}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Serviços</span>
                <span style={styles.statValue}>{agendamentos.filter(a => a.status === 'concluido').length}</span>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>📅 Hoje ({proximosAgendamentos.length})</h3>
            </div>

            <div style={styles.historyList}>
              {loading ? (
                <div style={styles.loader}>Buscando compromissos...</div>
              ) : proximosAgendamentos.length > 0 ? (
                proximosAgendamentos.map((agend) => (
                  <div key={agend.id} style={{...styles.historyCard, borderLeft: '4px solid #ff6600'}}>
                    <div style={styles.historyMain}>
                      <div style={styles.historyInfo}>
                        <span style={styles.clientName}>{agend.cliente_nome}</span>
                        <span style={styles.serviceName}>{agend.servico_nome}</span>
                      </div>
                      <div style={styles.historyValue}>
                        <span style={{...styles.price, color: '#ffffff'}}>
                          {new Date(agend.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <p>Sem agendamentos para hoje.</p>
                </div>
              )}
            </div>

            {/* Recent History */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>✅ Últimos Atendimentos</h3>
            </div>

            <div style={styles.historyList}>
              {loading ? (
                <div style={styles.loader}>Buscando histórico...</div>
              ) : ultimosAtendimentos.length > 0 ? (
                ultimosAtendimentos.map((atend) => (
                  <div key={atend.id} style={styles.historyCard}>
                    <div style={styles.historyMain}>
                      <div style={styles.historyInfo}>
                        <span style={styles.clientName}>{atend.cliente_nome}</span>
                        <span style={styles.serviceName}>{atend.servico_nome}</span>
                      </div>
                      <div style={styles.historyValue}>
                        <span style={styles.price}>R$ {Number(atend.valor_pago || 0).toFixed(2)}</span>
                        <span style={styles.date}>{new Date(atend.data_inicio).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <p>Ainda não há registros concluídos.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#151515',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: '#1a1a1a',
    padding: '24px 20px 32px',
    borderBottomLeftRadius: '24px',
    borderBottomRightRadius: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#ff6600',
    borderRadius: '50%',
    boxShadow: '0 0 10px #ff6600',
  },
  headerTitle: {
    fontSize: '14px',
    color: '#a0a0a0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: 0,
  },
  logoutIconButton: {
    background: '#252525',
    border: 'none',
    borderRadius: '10px',
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '18px',
    cursor: 'pointer',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '56px',
    height: '56px',
    backgroundColor: '#ff6600',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 4px 15px rgba(255, 102, 0, 0.4)',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
  },
  userRole: {
    fontSize: '13px',
    color: '#a0a0a0',
    textTransform: 'capitalize',
  },
  main: {
    padding: '0 20px 40px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '-24px',
    marginBottom: '32px',
  },
  actionCard: {
    padding: '24px 16px',
    borderRadius: '20px',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    color: 'white',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  },
  actionIcon: {
    fontSize: '32px',
  },
  actionText: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  sectionHeader: {
    marginBottom: '16px',
    marginTop: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '24px',
  },
  statItem: {
    backgroundColor: '#1a1a1a',
    padding: '16px 12px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid #252525',
  },
  statLabel: {
    fontSize: '11px',
    color: '#a0a0a0',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#ff6600',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historyCard: {
    backgroundColor: '#1a1a1a',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #252525',
  },
  historyMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  historyInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  clientName: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  serviceName: {
    fontSize: '13px',
    color: '#a0a0a0',
  },
  historyValue: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  price: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#ff6600',
  },
  date: {
    fontSize: '11px',
    color: '#606060',
  },
  historyStatus: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  statusTag: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  loader: {
    textAlign: 'center',
    padding: '40px',
    color: '#ff6600',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#606060',
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    fontSize: '14px',
  },
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
    backgroundColor: '#252525',
    width: '100%',
    maxWidth: '400px',
    padding: '24px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    animation: 'modalScale 0.3s ease-out',
    border: '1px solid #333',
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
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    color: '#a0a0a0',
    fontWeight: '600',
  },
  input: {
    padding: '14px',
    backgroundColor: '#151515',
    border: '1px solid #333',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  },
  submitBtn: {
    padding: '16px',
    backgroundColor: '#ff6600',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px',
    cursor: 'pointer',
  },
};



import { useState, Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, signOut } from '@barbearia/auth';

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  let result = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 2) result += '.';
    if (i === 5) result += '.';
    if (i === 8) result += '/';
    if (i === 12) result += '-';
    result += digits[i];
  }
  return result;
}

function formatTelefone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  let result = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 0) result += '(';
    if (i === 2) result += ') ';
    if (i === 7 && digits.length > 10) result += '-';
    if (i === 6 && digits.length <= 10) result += '-';
    result += digits[i];
  }
  return result;
}

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  let result = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 5) result += '-';
    result += digits[i];
  }
  return result;
}

export default function CadastroEmpresa({ 
  onEmpresaCriada,
  setGlobalLoading
}: { 
  onEmpresaCriada: (id: string) => void;
  setGlobalLoading?: Dispatch<SetStateAction<boolean>>;
}) {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCNPJ(e.target.value));
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatTelefone(e.target.value));
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCEP(e.target.value));
  };

  const handleCepBlur = async () => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        return;
      }
      
      setRua(data.logradouro || '');
      setBairro(data.bairro || '');
      setCidade(data.localidade || '');
      setEstado(data.uf || '');
    } catch {
      // silenciosamente falha
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (setGlobalLoading) setGlobalLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const { data, error: err } = await supabase
        .from('empresas')
        .insert({
          auth_id: user.id,
          nome,
          cnpj: cnpj || null,
          telefone: telefone || null,
          cep: cep || null,
          rua: rua || null,
          numero: numero || null,
          bairro: bairro || null,
          complemento: complemento || null,
          cidade: cidade || null,
          estado: estado || null,
        })
        .select()
        .single();

      if (err) {
        setError(err.message);
      } else if (data) {
        onEmpresaCriada(data.id);
        navigate('/dashboard');
      }
    } catch {
      setError('Erro ao criar empresa. Tente novamente.');
    } finally {
      setLoading(false);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Cadastrar Empresa</h1>
        <p style={styles.subtitle}>Informe os dados da sua empresa</p>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.sectionTitle}>Dados da Empresa</div>
          
          <div style={styles.field}>
            <label style={styles.label}>Nome da Empresa *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
              placeholder="Nome da sua barbearia"
              required
            />
          </div>
          
          <div style={styles.rowHalf}>
            <div style={styles.field}>
              <label style={styles.label}>CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={handleCnpjChange}
                style={styles.input}
                placeholder="00.000.000/0001-00"
                maxLength={18}
              />
            </div>
            
            <div style={styles.field}>
              <label style={styles.label}>Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={handleTelefoneChange}
                style={styles.input}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>
          
          <div style={styles.divider} />
          
          <div style={styles.sectionTitle}>Endereço</div>
          
          <div style={styles.rowHalf}>
            <div style={styles.fieldFlex2}>
              <label style={styles.label}>CEP {cepLoading && <span style={styles.loadingText}>(buscando...)</span>}</label>
              <input
                type="text"
                value={cep}
                onChange={handleCepChange}
                onBlur={handleCepBlur}
                style={styles.input}
                placeholder="00000-000"
                maxLength={9}
                disabled={cepLoading}
              />
            </div>
            
            <div style={styles.fieldFlex3}>
              <label style={styles.label}>Rua</label>
              <input
                type="text"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                style={styles.input}
                placeholder="Rua, Avenida, etc"
              />
            </div>
          </div>
          
          <div style={styles.rowHalf}>
            <div style={styles.fieldFlex2}>
              <label style={styles.label}>Número</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                style={styles.input}
                placeholder="Número"
              />
            </div>
            
            <div style={styles.fieldFlex3}>
              <label style={styles.label}>Bairro</label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                style={styles.input}
                placeholder="Bairro"
              />
            </div>
          </div>
          
          <div style={styles.field}>
            <label style={styles.label}>Complemento</label>
            <input
              type="text"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              style={styles.input}
              placeholder="Sala, Andar, etc"
            />
          </div>
          
          <div style={styles.rowHalf}>
            <div style={styles.fieldFlex3}>
              <label style={styles.label}>Cidade</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                style={styles.input}
                placeholder="Cidade"
              />
            </div>
            
            <div style={styles.fieldFlex2}>
              <label style={styles.label}>Estado</label>
              <input
                type="text"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                style={styles.input}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Criando...' : 'Cadastrar Empresa'}
          </button>
          
          <button 
            type="button" 
            style={styles.logoutButton}
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100vh',
    padding: '40px 20px',
    backgroundColor: '#1a1a1a',
  },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textAlign: 'center',
    color: '#ff6600',
  },
  subtitle: {
    color: '#a0a0a0',
    marginBottom: '28px',
    textAlign: 'center',
    fontSize: '15px',
  },
  error: {
    backgroundColor: '#3d1f1f',
    color: '#ff6b6b',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #5a2a2a',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ff6600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
    marginTop: '8px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#404040',
    margin: '8px 0',
  },
  rowHalf: {
    display: 'flex',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  fieldFlex2: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 2,
  },
  fieldFlex3: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 3,
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #404040',
    borderRadius: '6px',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
  },
  button: {
    padding: '14px',
    backgroundColor: '#ff6600',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '16px',
  },
  logoutButton: {
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#a0a0a0',
    border: '1px solid #404040',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '12px',
    width: '100%',
  },
  loadingText: {
    fontSize: '12px',
    color: '#ff6600',
    fontWeight: 'normal',
  },
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@barbearia/auth';

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

export default function CadastroEmpresa({ onEmpresaCriada }: { onEmpresaCriada: (id: string) => void }) {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCNPJ(e.target.value));
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatTelefone(e.target.value));
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCEP(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!usuario) {
        setError('Usuário não encontrado');
        return;
      }

      const { data, error: err } = await supabase
        .from('empresas')
        .insert({
          usuario_id: usuario.id,
          nome,
          cnpj: cnpj || null,
          telefone: telefone || null,
          cep: cep || null,
          rua: rua || null,
          numero: numero || null,
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
          
          <div style={styles.row}>
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
          
          <div style={styles.row}>
            <div style={{...styles.field, flex: 2}}>
              <label style={styles.label}>CEP</label>
              <input
                type="text"
                value={cep}
                onChange={handleCepChange}
                style={styles.input}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            
            <div style={{...styles.field, flex: 1}}>
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
          
          <div style={styles.field}>
            <label style={styles.label}>Cidade</label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              style={styles.input}
              placeholder="Cidade"
            />
          </div>
          
          <div style={styles.field}>
            <label style={styles.label}>Rua</label>
            <input
              type="text"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              style={styles.input}
              placeholder="Rua, Avenida, etc"
            />
          </div>
          
          <div style={styles.row}>
            <div style={{...styles.field, flex: 2}}>
              <label style={styles.label}>Número</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                style={styles.input}
                placeholder="Número"
              />
            </div>
            
            <div style={{...styles.field, flex: 3}}>
              <label style={styles.label}>Complemento</label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                style={styles.input}
                placeholder="Sala, Andar, etc"
              />
            </div>
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Criando...' : 'Cadastrar Empresa'}
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
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textAlign: 'center',
    color: '#222',
  },
  subtitle: {
    color: '#666',
    marginBottom: '28px',
    textAlign: 'center',
    fontSize: '15px',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fcc',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
    marginTop: '8px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '8px 0',
  },
  row: {
    display: 'flex',
    gap: '12px',
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
    color: '#333',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
    transition: 'border-color 0.2s',
    outline: 'none',
  },
  button: {
    padding: '14px',
    backgroundColor: '#222',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'background-color 0.2s',
  },
};

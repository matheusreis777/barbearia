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
          <div style={styles.field}>
            <label style={styles.label}>Nome da Empresa *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
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
          
          <div style={styles.field}>
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
          
          <div style={styles.field}>
            <label style={styles.label}>Rua</label>
            <input
              type="text"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
              style={styles.input}
              placeholder="Rua, avenue, etc"
            />
          </div>
          
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Número</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                style={styles.input}
                placeholder="Nº"
              />
            </div>
            
            <div style={styles.field}>
              <label style={styles.label}>Complemento</label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                style={styles.input}
                placeholder="Sala, andar, etc"
              />
            </div>
          </div>
          
          <div style={styles.row}>
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
              <label style={styles.label}>Estado (UF)</label>
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
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '32px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    marginBottom: '24px',
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  button: {
    padding: '12px',
    backgroundColor: '#222',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@barbearia/auth';

function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3.$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3.$4-$5');
}

function formatTelefone(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/^(\d{2})\s(\d{5})(\d)/, '$1 $2-$3');
}

export default function CadastroEmpresa({ onEmpresaCriada }: { onEmpresaCriada: (id: string) => void }) {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCNPJ(e.target.value));
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatTelefone(e.target.value));
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
          endereco: endereco || null,
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
          
          <div style={styles.field}>
            <label style={styles.label}>Endereço</label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              style={styles.input}
              placeholder="Rua, número, bairro, cidade"
            />
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
    maxWidth: '400px',
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
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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

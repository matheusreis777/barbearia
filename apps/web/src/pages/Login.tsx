import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, supabase } from '@barbearia/auth';

interface LoginProps {
  setGlobalLoading?: (loading: boolean) => void;
  onLoginSuccess?: (empresaId: string | null) => void;
}

export default function Login({ setGlobalLoading, onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validação básica local
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    if (!email.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }

    setLoading(true);
    if (setGlobalLoading) setGlobalLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        // Tratamento de erros genéricos em português
        if (signInError.message === 'Invalid login credentials' || signInError.status === 400) {
          setError('E-mail ou senha incorretos.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
        } else {
          setError('Ocorreu um erro ao tentar entrar. Tente novamente mais tarde.');
        }
      } else if (data.user) {
        // Verificar se já possui empresa vinculada
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('auth_id', data.user.id)
          .maybeSingle();
        
        if (onLoginSuccess) {
          onLoginSuccess(empresa?.id || null);
        }

        if (empresa) {
          navigate('/dashboard');
        } else {
          navigate('/cadastro-empresa');
        }
      }
    } catch (err: any) {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Entrar</h1>
        <p style={styles.subtitle}>Bem-vindo à Barbearia</p>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <p style={styles.footer}>
          Não tem uma conta? <Link to="/register" style={styles.link}>Cadastre-se</Link>
        </p>
        <p style={styles.footerColab}>
          Sou colaborador? <Link to="/login-colaborador" style={styles.linkColab}>Acessar área de equipe</Link>
        </p>
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
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '400px',
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
    marginBottom: '24px',
    textAlign: 'center',
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
    color: '#ffffff',
  },
  input: {
    padding: '12px 14px',
    border: '1px solid #404040',
    borderRadius: '6px',
    fontSize: '15px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    outline: 'none',
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
    marginTop: '8px',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#a0a0a0',
  },
  link: {
    color: '#ff6600',
    textDecoration: 'underline',
  },
  footerColab: {
    marginTop: '16px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#a0a0a0',
    borderTop: '1px solid #404040',
    paddingTop: '16px',
  },
  linkColab: {
    color: '#a0a0a0',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};

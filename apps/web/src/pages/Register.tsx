import { useState, Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { signUp } from '@barbearia/auth';

export default function Register({ setGlobalLoading }: { setGlobalLoading?: Dispatch<SetStateAction<boolean>> }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validações básicas
    if (!nome || !email || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!email.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }

    setLoading(true);
    if (setGlobalLoading) setGlobalLoading(true);

    try {
      const { error: signUpError } = await signUp(email, password, { nome });
      
      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('Este e-mail já está em uso.');
        } else {
          setError('Ocorreu um erro ao criar a conta. Tente novamente.');
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
      if (setGlobalLoading) setGlobalLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Verifique seu email</h1>
          <p style={styles.subtitle}>
            Enviamos um link de confirmação para <strong>{email}</strong>
          </p>
          <p style={styles.footer}>
            Já tem conta? <Link to="/login" style={styles.link}>Entrar</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Cadastrar</h1>
        <p style={styles.subtitle}>Crie sua conta</p>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
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
              minLength={6}
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>
        
        <p style={styles.footer}>
          Já tem conta? <Link to="/login" style={styles.link}>Entrar</Link>
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
};

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@barbearia/auth';

export default function LoginColaborador() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Buscar o colaborador pelo nickname
      const { data: colaborador, error: fetchError } = await supabase
        .from('colaboradores')
        .select('*, empresas(nome)')
        .eq('nickname', nickname.toLowerCase().trim())
        .eq('ativo', true)
        .single();

      if (fetchError || !colaborador) {
        throw new Error('Usuário não encontrado ou inativo.');
      }

      // Validar a senha (no mundo real seria hash + salt)
      if (colaborador.senha !== password) {
        throw new Error('Senha incorreta.');
      }

      // Login bem sucedido
      // Armazenar sessão do colaborador (custom)
      const collabSession = {
        id: colaborador.id,
        nome: colaborador.nome,
        nickname: colaborador.nickname,
        tipo: colaborador.tipo,
        empresa_id: colaborador.empresa_id,
        empresa_nome: colaborador.empresas?.nome,
        loginType: 'colaborador'
      };

      localStorage.setItem('barbearia_collab_session', JSON.stringify(collabSession));
      
      // Redirecionar para o painel do colaborador (que podemos criar depois)
      navigate('/dashboard-colaborador');
      
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Área do Colaborador</h1>
          <p style={styles.subtitle}>Entre com seu nickname e senha</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Nickname</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>@</span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={styles.inputWithIcon}
                placeholder="seu.nickname"
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="******"
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Acessando...' : 'Entrar no Painel'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            É o dono da barbearia? <Link to="/login" style={styles.link}>Login Admin</Link>
          </p>
        </div>
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
    backgroundColor: '#1a1a1a',
    padding: '20px',
  },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    border: '1px solid #404040',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ff6600',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#a0a0a0',
    fontSize: '15px',
  },
  error: {
    backgroundColor: '#3d1f1f',
    color: '#ff6b6b',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #5a2a2a',
    textAlign: 'center',
  },
  form: {
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
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#ff6600',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  inputWithIcon: {
    padding: '14px 14px 14px 38px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '16px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  input: {
    padding: '14px 14px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '16px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '16px',
    backgroundColor: '#ff6600',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    boxShadow: '0 4px 12px rgba(255, 102, 0, 0.3)',
    transition: 'transform 0.1s, background-color 0.2s',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
    paddingTop: '24px',
    borderTop: '1px solid #404040',
  },
  footerText: {
    color: '#a0a0a0',
    fontSize: '14px',
  },
  link: {
    color: '#ff6600',
    textDecoration: 'none',
    fontWeight: 'bold',
    marginLeft: '4px',
  },
};

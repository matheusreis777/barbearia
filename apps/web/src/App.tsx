import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange, supabase } from '@barbearia/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CadastroEmpresa from './pages/CadastroEmpresa';

function App() {
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    const checkEmpresa = async (userId: string) => {
      setGlobalLoading(true);
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (usuario) {
        const { data: empresas } = await supabase
          .from('empresas')
          .select('id')
          .eq('usuario_id', usuario.id)
          .maybeSingle();
        
        if (empresas) {
          setEmpresaId(empresas.id);
        }
      }
      setLoading(false);
      setGlobalLoading(false);
    };

    getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) {
        checkEmpresa(data.session.user.id);
      } else {
        setLoading(false);
        setGlobalLoading(false);
      }
    });

    onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        checkEmpresa(session.user.id);
      } else {
        setEmpresaId(null);
        setLoading(false);
        setGlobalLoading(false);
      }
    });
  }, []);

  const setEmpresa = (id: string | null) => {
    setEmpresaId(id);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <>
      {globalLoading && (
        <div style={styles.globalLoading}>
          <div style={styles.globalSpinner}></div>
        </div>
      )}
      <Routes>
        <Route path="/login" element={session ? <Navigate to={empresaId ? "/dashboard" : "/cadastro-empresa"} /> : <Login setGlobalLoading={setGlobalLoading} />} />
        <Route path="/register" element={session ? <Navigate to={empresaId ? "/dashboard" : "/cadastro-empresa"} /> : <Register setGlobalLoading={setGlobalLoading} />} />
        <Route path="/cadastro-empresa" element={session ? <CadastroEmpresa onEmpresaCriada={setEmpresa} setGlobalLoading={setGlobalLoading} /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={empresaId ? <Dashboard /> : <Navigate to="/cadastro-empresa" />} />
        <Route path="/" element={<Navigate to={session ? (empresaId ? '/dashboard' : '/cadastro-empresa') : '/login'} />} />
      </Routes>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#ff6600',
    fontSize: '18px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #2d2d2d',
    borderTop: '4px solid #ff6600',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  globalLoading: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  globalSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #2d2d2d',
    borderTop: '4px solid #ff6600',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default App;

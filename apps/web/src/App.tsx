import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange, supabase } from '@barbearia/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CadastroEmpresa from './pages/CadastroEmpresa';

function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    const checkEmpresa = async (userId: string) => {
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
    };

    getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user?.id) {
        checkEmpresa(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        checkEmpresa(session.user.id);
      } else {
        setEmpresaId(null);
        setLoading(false);
      }
    });
  }, []);

  const setEmpresa = (id: string | null) => {
    setEmpresaId(id);
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to={empresaId ? "/dashboard" : "/cadastro-empresa"} /> : <Login />} />
      <Route path="/register" element={session ? <Navigate to={empresaId ? "/dashboard" : "/cadastro-empresa"} /> : <Register />} />
      <Route path="/cadastro-empresa" element={session ? <CadastroEmpresa onEmpresaCriada={setEmpresa} /> : <Navigate to="/login" />} />
      <Route path="/dashboard" element={empresaId ? <Dashboard /> : <Navigate to="/cadastro-empresa" />} />
      <Route path="/" element={<Navigate to={session ? (empresaId ? '/dashboard' : '/cadastro-empresa') : '/login'} />} />
    </Routes>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  },
};

export default App;

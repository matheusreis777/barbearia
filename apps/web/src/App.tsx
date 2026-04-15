import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange } from '@barbearia/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CadastroEmpresa from './pages/CadastroEmpresa';

function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    onAuthStateChange((_event, session) => {
      setSession(session);
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

import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSession, onAuthStateChange, supabase } from '@barbearia/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CadastroEmpresa from './pages/CadastroEmpresa';

import Colaboradores from './pages/Colaboradores';
import Servicos from './pages/Servicos';
import Clientes from './pages/Clientes';
import Relatorios from './pages/Relatorios';
import LoginColaborador from './pages/LoginColaborador';
import DashboardColaborador from './pages/DashboardColaborador';
import AgendaColaborador from './pages/AgendaColaborador';

function App() {
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [checkingEmpresa, setCheckingEmpresa] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  const checkEmpresa = async (userId: string) => {
    setCheckingEmpresa(true);
    try {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();
      
      if (empresa) {
        setEmpresaId(empresa.id);
        return empresa.id;
      }
      return null;
    } finally {
      setCheckingEmpresa(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await getSession();
      setSession(data.session);
      
      if (data.session?.user?.id) {
        await checkEmpresa(data.session.user.id);
      }
      
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        checkEmpresa(session.user.id);
      } else {
        setEmpresaId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (id: string | null) => {
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
      {(globalLoading || checkingEmpresa) && (
        <div style={styles.globalLoading}>
          <div style={styles.globalSpinner}></div>
        </div>
      )}
      <Routes>
        <Route 
          path="/login" 
          element={
            session ? (
              checkingEmpresa ? <div></div> : <Navigate to={empresaId ? "/dashboard" : "/cadastro-empresa"} />
            ) : (
              <Login setGlobalLoading={setGlobalLoading} onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            session ? (
              checkingEmpresa ? <div></div> : <Navigate to={empresaId ? "/dashboard" : "/cadastro-empresa"} />
            ) : (
              <Register setGlobalLoading={setGlobalLoading} />
            )
          } 
        />
        <Route 
          path="/cadastro-empresa" 
          element={
            session ? (
              <CadastroEmpresa onEmpresaCriada={handleLoginSuccess} setGlobalLoading={setGlobalLoading} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            session ? (
              checkingEmpresa ? <div></div> : (empresaId ? <Dashboard /> : <Navigate to="/cadastro-empresa" />)
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/login-colaborador" 
          element={<LoginColaborador />} 
        />
        <Route 
          path="/dashboard-colaborador" 
          element={<DashboardColaborador />} 
        />
        <Route 
          path="/agenda-colaborador" 
          element={<AgendaColaborador />} 
        />
        <Route 
          path="/colaboradores" 
          element={
            session ? (
              checkingEmpresa ? <div></div> : (empresaId ? <Colaboradores /> : <Navigate to="/cadastro-empresa" />)
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/servicos" 
          element={
            session ? (
              checkingEmpresa ? <div></div> : (empresaId ? <Servicos /> : <Navigate to="/cadastro-empresa" />)
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/clientes" 
          element={
            session ? (
              checkingEmpresa ? <div></div> : (empresaId ? <Clientes /> : <Navigate to="/cadastro-empresa" />)
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/relatorios" 
          element={
            session ? (
              checkingEmpresa ? <div></div> : (empresaId ? <Relatorios /> : <Navigate to="/cadastro-empresa" />)
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/" 
          element={
            <Navigate to={session ? (empresaId ? '/dashboard' : '/cadastro-empresa') : '/login'} />
          } 
        />
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, signOut } from '@barbearia/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <button onClick={handleSignOut} style={styles.button}>Sair</button>
      </div>
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Bem-vindo!</h2>
        {user && (
          <div style={styles.userInfo}>
            <p style={styles.text}><strong>Admin:</strong> {user.user_metadata?.nome || user.email}</p>
            <p style={styles.text}><strong>Email:</strong> {user.email}</p>
          </div>
        )}
        
        <div style={styles.menuGrid}>
          <button 
            onClick={() => navigate('/colaboradores')} 
            style={styles.menuCard}
          >
            <span style={styles.menuIcon}>👥</span>
            <span style={styles.menuTitle}>Colaboradores</span>
            <span style={styles.menuDesc}>Gerencie sua equipe</span>
          </button>
          
          <button style={{...styles.menuCard, opacity: 0.5, cursor: 'default'}}>
            <span style={styles.menuIcon}>✂️</span>
            <span style={styles.menuTitle}>Serviços</span>
            <span style={styles.menuDesc}>Em breve</span>
          </button>
          
          <button style={{...styles.menuCard, opacity: 0.5, cursor: 'default'}}>
            <span style={styles.menuIcon}>📅</span>
            <span style={styles.menuTitle}>Agenda</span>
            <span style={styles.menuDesc}>Em breve</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    backgroundColor: '#1a1a1a',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ff6600',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#ff6600',
  },
  userInfo: {
    marginBottom: '32px',
    paddingBottom: '20px',
    borderBottom: '1px solid #404040',
  },
  text: {
    marginBottom: '4px',
    color: '#a0a0a0',
    fontSize: '15px',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '20px',
  },
  menuCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #404040',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: 'white',
  },
  menuIcon: {
    fontSize: '32px',
    marginBottom: '16px',
  },
  menuTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#ff6600',
  },
  menuDesc: {
    fontSize: '14px',
    color: '#a0a0a0',
  },
};

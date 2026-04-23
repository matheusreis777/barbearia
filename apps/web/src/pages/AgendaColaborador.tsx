import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { supabase } from '@barbearia/auth';

export default function AgendaColaborador() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('barbearia_collab_session');
    if (!savedSession) {
      navigate('/login-colaborador');
      return;
    }
    const parsedSession = JSON.parse(savedSession);
    setSession(parsedSession);
    fetchAgendamentos(parsedSession.id);
  }, [navigate]);

  const fetchAgendamentos = async (collabId: string) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('colaborador_id', collabId);

      if (error) throw error;

      const formattedEvents = (data || []).map(agend => ({
        id: agend.id,
        title: `${agend.cliente_nome} - ${agend.servico_nome}`,
        start: agend.data_inicio,
        end: agend.data_fim,
        backgroundColor: agend.status === 'concluido' ? '#10b981' : '#ff6600',
        borderColor: 'transparent',
        extendedProps: {
          status: agend.status,
          cliente: agend.cliente_nome,
          servico: agend.servico_nome
        }
      }));

      setEvents(formattedEvents);
    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <button onClick={() => navigate('/dashboard-colaborador')} style={styles.backButton}>
            ← Voltar ao Painel
          </button>
          <h1 style={styles.title}>Minha Agenda</h1>
          <p style={styles.subtitle}>{session.empresa_nome}</p>
        </div>
        <div style={styles.badge}>{session.nome}</div>
      </header>

      <div style={styles.calendarCard}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          locale={ptBrLocale}
          events={events}
          height="auto"
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: '08:00',
            endTime: '20:00',
          }}
          nowIndicator={true}
          themeSystem="standard"
          eventClick={(info) => {
            alert(`Cliente: ${info.event.extendedProps.cliente}\nServiço: ${info.event.extendedProps.servico}\nStatus: ${info.event.extendedProps.status}`);
          }}
        />
      </div>

      <style>{`
        .fc { 
          --fc-button-bg-color: #2d2d2d;
          --fc-button-border-color: #404040;
          --fc-button-hover-bg-color: #404040;
          --fc-button-active-bg-color: #ff6600;
          --fc-button-active-border-color: #ff6600;
          --fc-border-color: #404040;
          --fc-page-bg-color: #2d2d2d;
          --fc-neutral-bg-color: #1a1a1a;
          --fc-list-event-hover-bg-color: #1a1a1a;
          --fc-today-bg-color: rgba(255, 102, 0, 0.05);
          color: #ffffff;
        }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #404040; }
        .fc-col-header-cell { background-color: #1a1a1a; padding: 10px 0 !important; }
        .fc-toolbar-title { color: #ff6600; font-weight: bold; }
        .fc-button:focus { box-shadow: none !important; }
        .fc-timegrid-slot-label { font-size: 12px; color: #a0a0a0; }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '40px 20px',
  },
  header: {
    maxWidth: '1100px',
    margin: '0 auto 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#a0a0a0',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '8px',
    padding: 0,
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ff6600',
  },
  subtitle: {
    color: '#a0a0a0',
    fontSize: '16px',
  },
  badge: {
    backgroundColor: '#ff660022',
    color: '#ff6600',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: '1px solid #ff660044',
  },
  calendarCard: {
    maxWidth: '1100px',
    margin: '0 auto',
    backgroundColor: '#2d2d2d',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    border: '1px solid #404040',
  },
};

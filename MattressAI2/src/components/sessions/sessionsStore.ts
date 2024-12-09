import { create } from 'zustand';

interface Session {
  id: string;
  customerName: string;
  date: string;
  time: string;
  assistant: 'lite' | 'plus';
  verified: boolean;
}

interface SessionsState {
  sessions: Session[];
  recentSessions: Session[];
  setSession: (sessions: Session[]) => void;
  getRecentSessions: () => Session[];
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [
    {
      id: '1',
      customerName: 'John Doe',
      date: '2024-03-18',
      time: '10:30 AM',
      assistant: 'plus',
      verified: true,
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      date: '2024-03-18',
      time: '11:45 AM',
      assistant: 'lite',
      verified: false,
    },
    {
      id: '3',
      customerName: 'N/A',
      date: '2024-03-18',
      time: '2:15 PM',
      assistant: 'lite',
      verified: false,
    },
  ],
  recentSessions: [
    {
      id: '1',
      customerName: 'John Doe',
      date: '2024-03-18',
      time: '10:30 AM',
      assistant: 'plus',
      verified: true,
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      date: '2024-03-18',
      time: '11:45 AM',
      assistant: 'lite',
      verified: false,
    },
  ],
  setSession: (sessions) => set({ 
    sessions,
    recentSessions: sessions.slice(0, 4)
  }),
  getRecentSessions: () => get().sessions.slice(0, 4),
}));
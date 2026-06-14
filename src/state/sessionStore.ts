import { create } from 'zustand';
import { SessionInfo, SessionAlert } from '../domain/session/SessionInfo';
import { SessionRepository } from '../data/session/SessionRepository';

type SessionState = {
  /** List of active sessions */
  sessions: SessionInfo[];
  /** List of alerts */
  alerts: SessionAlert[];
  /** Loading state for sessions */
  isLoadingSessions: boolean;
  /** Loading state for alerts */
  isLoadingAlerts: boolean;
  /** Error message if fetch fails */
  error: string | null;
  /** Whether the section has been initialized */
  isInitialized: boolean;

  /** Fetch sessions from API */
  fetchSessions: (token: string) => Promise<void>;
  /** Fetch alerts from API */
  fetchAlerts: (token: string) => Promise<void>;
  /** Fetch both sessions and alerts */
  fetchAll: (token: string) => Promise<void>;
  /** Clear all session data (on logout) */
  clearSession: () => void;
  /** Reset initialization state */
  resetInitialized: () => void;
};

const sessionRepository = new SessionRepository();

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  alerts: [],
  isLoadingSessions: false,
  isLoadingAlerts: false,
  error: null,
  isInitialized: false,

  fetchSessions: async (token: string) => {
    set({ isLoadingSessions: true, error: null });
    try {
      const sessions = await sessionRepository.getSessions(token);
      set({ sessions, isLoadingSessions: false });
    } catch (err: any) {
      const message = err?.message || 'Error fetching sessions';
      set({ error: message, isLoadingSessions: false });
      console.warn('[sessionStore] fetchSessions error:', message);
    }
  },

  fetchAlerts: async (token: string) => {
    set({ isLoadingAlerts: true, error: null });
    try {
      const alerts = await sessionRepository.getAlerts(token);
      set({ alerts, isLoadingAlerts: false });
    } catch (err: any) {
      const message = err?.message || 'Error fetching alerts';
      set({ error: message, isLoadingAlerts: false });
      console.warn('[sessionStore] fetchAlerts error:', message);
    }
  },

  fetchAll: async (token: string) => {
    const { fetchSessions, fetchAlerts } = get();
    set({ isInitialized: true });
    await Promise.all([fetchSessions(token), fetchAlerts(token)]);
  },

  clearSession: () => {
    set({
      sessions: [],
      alerts: [],
      isLoadingSessions: false,
      isLoadingAlerts: false,
      error: null,
      isInitialized: false,
    });
  },

  resetInitialized: () => {
    set({ isInitialized: false });
  },
}));

export default useSessionStore;

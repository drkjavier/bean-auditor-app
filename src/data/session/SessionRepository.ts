import { SessionService } from '../../domain/session/SessionService';
import { SessionInfo, SessionAlert } from '../../domain/session/SessionInfo';
import { fetchWithAuth } from '../../infrastructure/api/fetchWithAuth';
import { AUTH_BASE_URL } from '../../infrastructure/api/config';

/**
 * Implementation of SessionService using the auth API.
 * Uses fetchWithAuth for authenticated requests.
 *
 * Note: GET /api/v1/auth/sessions returns a single session object (not an array).
 * GET /api/v1/auth/alerts returns { alerts: [...], total: number }.
 */
export class SessionRepository implements SessionService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || AUTH_BASE_URL;
  }

  async getSessions(token: string): Promise<SessionInfo[]> {
    const url = `${this.baseUrl}/api/v1/auth/sessions`;

    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Error fetching sessions: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // API may return:
    // - A single session object: { session_id, created_at, ... }
    // - An array of sessions: [...]
    // - A wrapper object: { sessions: [...], total: number }
    if (Array.isArray(data)) {
      return data as SessionInfo[];
    }
    if (data && Array.isArray(data.sessions)) {
      return data.sessions as SessionInfo[];
    }
    if (data && data.session_id) {
      // Single session object — wrap in array
      return [data as SessionInfo];
    }

    return [];
  }

  async getAlerts(token: string): Promise<SessionAlert[]> {
    const url = `${this.baseUrl}/api/v1/auth/alerts`;

    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Error fetching alerts: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // API returns { alerts: [...], total: number }
    if (data && Array.isArray(data.alerts)) {
      return data.alerts as SessionAlert[];
    }
    if (Array.isArray(data)) {
      return data as SessionAlert[];
    }

    return [];
  }
}

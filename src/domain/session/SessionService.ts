import { SessionInfo, SessionAlert } from './SessionInfo';

/**
 * Interface for session-related operations.
 * Implementations handle API communication and data transformation.
 */
export interface SessionService {
  /**
   * Get all active sessions for the current user
   * @param token - Bearer token for authentication
   * @returns Array of active sessions
   * @throws {Error} On network error or unauthorized access
   */
  getSessions(token: string): Promise<SessionInfo[]>;

  /**
   * Get all alerts for the current user
   * @param token - Bearer token for authentication
   * @returns Array of security alerts
   * @throws {Error} On network error or unauthorized access
   */
  getAlerts(token: string): Promise<SessionAlert[]>;
}

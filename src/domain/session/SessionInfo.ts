/**
 * Session information returned by GET /api/v1/auth/sessions
 * Represents an active user session on a device.
 */
export type SessionInfo = {
  /** Unique session identifier (UUID) */
  session_id: string;
  /** Session creation timestamp (ISO 8601) */
  created_at: string;
  /** Session expiration timestamp (ISO 8601, default TTL 15min) */
  expires_at: string;
  /** IP address of the client that created the session */
  ip_address: string;
  /** User-Agent string from the browser/client */
  user_agent: string;
};

/**
 * Alert information returned by GET /api/v1/auth/alerts
 * Represents a security alert for the user.
 */
export type SessionAlert = {
  /** Unique alert identifier (UUID) */
  id: string;
  /** Alert type (e.g., 'brute_force', 'login', 'password_change', 'suspicious_activity') */
  type: string;
  /** Alert severity level (e.g., 'low', 'medium', 'high', 'critical') */
  severity: string;
  /** User ID associated with the alert */
  user_id: string;
  /** IP address that triggered the alert */
  ip_address: string;
  /** User-Agent string from the request */
  user_agent: string;
  /** Alert message/description */
  message: string;
  /** Timestamp when the alert was created (ISO 8601) */
  timestamp: string;
};

/**
 * API response for sessions endpoint
 */
export type SessionsApiResponse = {
  sessions: SessionInfo[];
  total: number;
};

/**
 * API response for alerts endpoint
 */
export type AlertsApiResponse = {
  alerts: SessionAlert[];
  total: number;
  unread_count: number;
};

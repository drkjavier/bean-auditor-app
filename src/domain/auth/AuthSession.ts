/**
 * User information returned by the authentication API.
 * Contains identity, roles and tenant data needed for authorization.
 */
export type AuthUser = {
  /** Unique user identifier (e.g., "usr_001") */
  id: string;
  /** Username */
  username: string;
  /** User email */
  email: string;
  /** User roles for access control */
  roles: string[];
  /** Tenant identifier for multi-tenant isolation */
  tenant_id: string;
};

/**
 * Authentication session returned after successful login.
 * Contains token info and user profile.
 */
export type AuthSession = {
  /** The authenticated username */
  username: string;
  /** JWT access token for API requests */
  accessToken: string;
  /** Optional refresh token for token renewal */
  refreshToken?: string;
  /** Token expiration timestamp (epoch ms). If the API returns ISO string, convert before storing. */
  expiresAt: number;
  /** User profile and authorization data */
  user?: AuthUser;
};

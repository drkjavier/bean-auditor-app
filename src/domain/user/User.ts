/**
 * User model - Represents a system user in the application.
 *
 * Users are synced from the server and used for audit attribution.
 * Contains role information for access control.
 */

export type UserRole = 'admin' | 'auditor' | 'viewer';

export type User = {
  /** Unique identifier (UUID) */
  id: string;

  /** Username (unique) */
  username: string;

  /** Display name */
  display_name: string;

  /** Email address */
  email: string;

  /** User role */
  role: UserRole;

  /** Whether user is active */
  is_active: boolean;

  /** Server-assigned version for conflict resolution */
  version: number;

  /** Timestamp when created (epoch ms) */
  created_at: number;

  /** Timestamp when last updated (epoch ms) */
  updated_at: number;

  /** Whether this record needs to be synced to server */
  sync_pending: boolean;
};

export type CreateUser = Omit<User, 'created_at' | 'updated_at' | 'sync_pending' | 'version'> & {
  created_at?: number;
  updated_at?: number;
  sync_pending?: boolean;
  version?: number;
};

export type UpdateUser = Partial<Omit<User, 'id' | 'created_at'>> & {
  updated_at?: number;
};

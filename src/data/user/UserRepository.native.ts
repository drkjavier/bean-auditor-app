/**
 * User Repository - Native implementation (SQLite)
 *
 * CRUD operations for user records in local database.
 */

import { execute, queryRows } from '../sqlite/db.native';
import { User, CreateUser, UpdateUser } from '../../domain/user/User';

type AnyRow = Record<string, unknown>;

export class UserRepository {
  /**
   * Get all users.
   */
  getAll(): User[] {
    const rows = queryRows('SELECT * FROM users ORDER BY display_name');
    return rows.map(this.rowToUser);
  }

  /**
   * Get user by ID.
   */
  getById(id: string): User | null {
    const rows = queryRows('SELECT * FROM users WHERE id = ?', [id]);
    return rows.length > 0 ? this.rowToUser(rows[0]) : null;
  }

  /**
   * Get user by username.
   */
  getByUsername(username: string): User | null {
    const rows = queryRows('SELECT * FROM users WHERE username = ?', [username]);
    return rows.length > 0 ? this.rowToUser(rows[0]) : null;
  }

  /**
   * Get users by role.
   */
  getByRole(role: User['role']): User[] {
    const rows = queryRows('SELECT * FROM users WHERE role = ? ORDER BY display_name', [role]);
    return rows.map(this.rowToUser);
  }

  /**
   * Get active users only.
   */
  getActive(): User[] {
    const rows = queryRows('SELECT * FROM users WHERE is_active = 1 ORDER BY display_name');
    return rows.map(this.rowToUser);
  }

  /**
   * Create a new user.
   */
  create(user: CreateUser): User {
    const now = Date.now();
    const newUser: User = {
      ...user,
      created_at: user.created_at ?? now,
      updated_at: user.updated_at ?? now,
      sync_pending: user.sync_pending ?? true,
      version: user.version ?? 1,
    };

    execute(
      `INSERT INTO users
       (id, username, display_name, email, role, is_active, version, created_at, updated_at, sync_pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newUser.id,
        newUser.username,
        newUser.display_name,
        newUser.email,
        newUser.role,
        newUser.is_active ? 1 : 0,
        newUser.version,
        newUser.created_at,
        newUser.updated_at,
        newUser.sync_pending ? 1 : 0,
      ]
    );

    return newUser;
  }

  /**
   * Update an existing user.
   */
  update(id: string, updates: UpdateUser): User | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const now = Date.now();
    const updatedUser: User = {
      ...existing,
      ...updates,
      updated_at: now,
      sync_pending: true,
      version: existing.version + 1,
    };

    execute(
      `UPDATE users SET
        display_name = ?, email = ?, role = ?, is_active = ?,
        version = ?, updated_at = ?, sync_pending = ?
       WHERE id = ?`,
      [
        updatedUser.display_name,
        updatedUser.email,
        updatedUser.role,
        updatedUser.is_active ? 1 : 0,
        updatedUser.version,
        updatedUser.updated_at,
        updatedUser.sync_pending ? 1 : 0,
        id,
      ]
    );

    return updatedUser;
  }

  /**
   * Delete a user.
   */
  delete(id: string): boolean {
    execute('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }

  /**
   * Get count of users.
   */
  count(): number {
    const rows = queryRows('SELECT COUNT(*) as count FROM users');
    return (rows[0]?.count as number) || 0;
  }

  /**
   * Get pending sync count.
   */
  pendingCount(): number {
    const rows = queryRows('SELECT COUNT(*) as count FROM users WHERE sync_pending = 1');
    return (rows[0]?.count as number) || 0;
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  private rowToUser(row: AnyRow): User {
    return {
      id: row.id as string,
      username: row.username as string,
      display_name: row.display_name as string,
      email: row.email as string,
      role: row.role as User['role'],
      is_active: (row.is_active as number) === 1,
      version: (row.version as number) ?? 1,
      created_at: row.created_at as number,
      updated_at: row.updated_at as number,
      sync_pending: (row.sync_pending as number) === 1,
    };
  }
}

export const userRepository = new UserRepository();
export default userRepository;

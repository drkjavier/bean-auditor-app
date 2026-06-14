/**
 * Farm Repository - Native implementation (SQLite)
 *
 * CRUD operations for farm records in local database.
 */

import { execute, queryRows } from '../sqlite/db.native';
import { Farm, CreateFarm, UpdateFarm } from '../../domain/farm/Farm';

type AnyRow = Record<string, unknown>;

export class FarmRepository {
  /**
   * Get all farms.
   */
  getAll(): Farm[] {
    const rows = queryRows('SELECT * FROM farms ORDER BY name');
    return rows.map(this.rowToFarm);
  }

  /**
   * Get farm by ID.
   */
  getById(id: string): Farm | null {
    const rows = queryRows('SELECT * FROM farms WHERE id = ?', [id]);
    return rows.length > 0 ? this.rowToFarm(rows[0]) : null;
  }

  /**
   * Get farms by status.
   */
  getByStatus(status: Farm['status']): Farm[] {
    const rows = queryRows('SELECT * FROM farms WHERE status = ? ORDER BY name', [status]);
    return rows.map(this.rowToFarm);
  }

  /**
   * Create a new farm.
   */
  create(farm: CreateFarm): Farm {
    const now = Date.now();
    const newFarm: Farm = {
      ...farm,
      created_at: farm.created_at ?? now,
      updated_at: farm.updated_at ?? now,
      sync_pending: farm.sync_pending ?? true,
      version: farm.version ?? 1,
    };

    execute(
      `INSERT INTO farms
       (id, name, location, lat, lon, owner, area_hectares, status, version, created_at, updated_at, sync_pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newFarm.id,
        newFarm.name,
        newFarm.location,
        newFarm.lat,
        newFarm.lon,
        newFarm.owner,
        newFarm.area_hectares ?? null,
        newFarm.status,
        newFarm.version,
        newFarm.created_at,
        newFarm.updated_at,
        newFarm.sync_pending ? 1 : 0,
      ]
    );

    return newFarm;
  }

  /**
   * Update an existing farm.
   */
  update(id: string, updates: UpdateFarm): Farm | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const now = Date.now();
    const updatedFarm: Farm = {
      ...existing,
      ...updates,
      updated_at: now,
      sync_pending: true,
      version: existing.version + 1,
    };

    execute(
      `UPDATE farms SET
        name = ?, location = ?, lat = ?, lon = ?, owner = ?,
        area_hectares = ?, status = ?, version = ?,
        updated_at = ?, sync_pending = ?
       WHERE id = ?`,
      [
        updatedFarm.name,
        updatedFarm.location,
        updatedFarm.lat,
        updatedFarm.lon,
        updatedFarm.owner,
        updatedFarm.area_hectares ?? null,
        updatedFarm.status,
        updatedFarm.version,
        updatedFarm.updated_at,
        updatedFarm.sync_pending ? 1 : 0,
        id,
      ]
    );

    return updatedFarm;
  }

  /**
   * Delete a farm.
   */
  delete(id: string): boolean {
    const result = execute('DELETE FROM farms WHERE id = ?', [id]);
    return true; // SQLite doesn't easily expose affected rows in this driver
  }

  /**
   * Get count of farms.
   */
  count(): number {
    const rows = queryRows('SELECT COUNT(*) as count FROM farms');
    return (rows[0]?.count as number) || 0;
  }

  /**
   * Get pending sync count.
   */
  pendingCount(): number {
    const rows = queryRows('SELECT COUNT(*) as count FROM farms WHERE sync_pending = 1');
    return (rows[0]?.count as number) || 0;
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  private rowToFarm(row: AnyRow): Farm {
    return {
      id: row.id as string,
      name: row.name as string,
      location: row.location as string,
      lat: row.lat as number,
      lon: row.lon as number,
      owner: row.owner as string,
      area_hectares: row.area_hectares as number | null,
      status: row.status as Farm['status'],
      version: (row.version as number) ?? 1,
      created_at: row.created_at as number,
      updated_at: row.updated_at as number,
      sync_pending: (row.sync_pending as number) === 1,
    };
  }
}

export const farmRepository = new FarmRepository();
export default farmRepository;

/**
 * Farm model - Represents a coffee farm (finca) in the system.
 *
 * Farms are the geographic units where tags are located.
 * They contain metadata about the farm and are synced from the server.
 */

export type Farm = {
  /** Unique identifier (UUID) */
  id: string;

  /** Human-readable farm name */
  name: string;

  /** Farm location description */
  location: string;

  /** Geographic coordinates */
  lat: number;
  lon: number;

  /** Owner or responsible person */
  owner: string;

  /** Total area in hectares */
  area_hectares: number | null;

  /** Farm status */
  status: 'active' | 'inactive' | 'pending';

  /** Server-assigned version for conflict resolution */
  version: number;

  /** Timestamp when created (epoch ms) */
  created_at: number;

  /** Timestamp when last updated (epoch ms) */
  updated_at: number;

  /** Whether this record needs to be synced to server */
  sync_pending: boolean;
};

export type CreateFarm = Omit<Farm, 'created_at' | 'updated_at' | 'sync_pending' | 'version'> & {
  created_at?: number;
  updated_at?: number;
  sync_pending?: boolean;
  version?: number;
};

export type UpdateFarm = Partial<Omit<Farm, 'id' | 'created_at'>> & {
  updated_at?: number;
};

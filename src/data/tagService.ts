import { tagsMock, Tag } from './mocks/tagsMock';

export type { Tag };

export type TagFilter = {
  color?: string;   // hex del color, ej: '#FF0000'
  audited?: boolean;
  from?: string;    // ISO date — se asume 00:00:00 del día
  to?: string;      // ISO date — se asume 23:59:59 del día
};

// Simple in-memory service that returns a Promise to emulate async API
export async function fetchTags(filter?: TagFilter): Promise<Tag[]> {
  // Simulate latency
  await new Promise(res => setTimeout(res, 120));

  let items = tagsMock.slice();

  if (filter) {
    const { color, audited, from, to } = filter;

    if (color) {
      const colorNorm = color.trim().toLowerCase();
      // tagsMock uses `colorHex` for the color field. Guard against undefined
      // and normalize both sides before comparing to avoid runtime errors.
      items = items.filter(t => (t.colorHex ?? '').trim().toLowerCase() === colorNorm);
    }
    if (typeof audited === 'boolean') {
      items = items.filter(t => t.audited === audited);
    }
    if (from) {
      const f = new Date(from);
      if (!isNaN(f.getTime())) items = items.filter(t => new Date(t.timestamp) >= f);
    }
    if (to) {
      const tt = new Date(to);
      if (!isNaN(tt.getTime())) items = items.filter(t => new Date(t.timestamp) <= tt);
    }
  }

  return items;
}

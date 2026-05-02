import { tagsMock, Tag } from './mocks/tagsMock';

export type TagFilter = {
  q?: string; // search in unique_id
  state?: string;
  from?: string; // ISO date
  to?: string; // ISO date
};

// Simple in-memory service that returns a Promise to emulate async API
export async function fetchTags(filter?: TagFilter): Promise<Tag[]> {
  // Simulate latency
  await new Promise(res => setTimeout(res, 120));

  let items = tagsMock.slice();

  if (filter) {
    const { q, state, from, to } = filter;
    if (q) {
      const qn = String(q).trim().toLowerCase().slice(0, 64);
      items = items.filter(t => t.unique_id.toLowerCase().includes(qn));
    }
    if (state) {
      items = items.filter(t => t.state === state);
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

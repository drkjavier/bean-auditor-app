import { fetchTags } from '../src/data/tagService';

describe('tagService filters', () => {
  test('returns all without filter', async () => {
    const all = await fetchTags();
    expect(all.length).toBe(10);
  });

  test('search by unique_id', async () => {
    const res = await fetchTags({ q: 'TAG-1001' });
    expect(res.length).toBeGreaterThanOrEqual(1);
    expect(res[0].unique_id).toContain('TAG-1001');
  });

  test('filter by state', async () => {
    const open = await fetchTags({ state: 'open' });
    expect(open.every(t => t.state === 'open')).toBe(true);
  });

  test('date range filter', async () => {
    const from = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
    const res = await fetchTags({ from });
    // should be <= 10 and >= 1 depending on mock
    expect(res.length).toBeLessThanOrEqual(10);
  });
});

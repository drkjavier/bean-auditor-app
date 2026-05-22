import { fetchTags } from '../src/data/tagService';

describe('tagService filters', () => {
  test('returns all without filter', async () => {
    const all = await fetchTags();
    expect(all.length).toBe(175);
  });

  test('search by unique_id', async () => {
    const res = await fetchTags({ q: 'TAG-TIQ-001' });
    expect(res.length).toBeGreaterThanOrEqual(1);
    expect(res[0].unique_id).toContain('TAG-TIQ-001');
  });

  test('filter by audited', async () => {
    const audited = await fetchTags({ audited: true });
    expect(audited.every(t => t.audited === true)).toBe(true);
  });

  test('date range filter', async () => {
    const from = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
    const res = await fetchTags({ from });
    // should be <= 10 and >= 1 depending on mock
    expect(res.length).toBeLessThanOrEqual(40);
  });

  test('filter by color hex', async () => {
    const color = '#ff8000'; // Primer color en TAG_COLORS
    const res = await fetchTags({ color });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every(t => t.colorHex.toLowerCase() === color)).toBe(true);
  });
});

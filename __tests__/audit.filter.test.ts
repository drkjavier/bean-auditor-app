import { fetchTags } from '../src/data/tagService';

describe('tagService filters', () => {
  test('returns all without filter', async () => {
    const all = await fetchTags();
    expect(all.length).toBeGreaterThanOrEqual(45);
    expect(all.length).toBeLessThanOrEqual(55);
  });

  test('search by unique_id via color filter is not supported; smoke test by color', async () => {
    const res = await fetchTags({ color: '#ff8000' });
    expect(res.length).toBeGreaterThanOrEqual(1);
  });

  test('filter by audit_status audited', async () => {
    const audited = await fetchTags({ audit_status: 'audited' });
    expect(audited.every(t => t.audit_status === 'audited')).toBe(true);
  });

  test('filter by audit_status not_audited', async () => {
    const notAudited = await fetchTags({ audit_status: 'not_audited' });
    expect(notAudited.every(t => t.audit_status === 'not_audited')).toBe(true);
  });

  test('filter by audit_status pending includes null (null ≡ pending)', async () => {
    const pending = await fetchTags({ audit_status: 'pending' });
    expect(pending.length).toBeGreaterThan(0);
    // Business rule: null is the same concept as pending
    expect(pending.every(t => t.audit_status === 'pending' || t.audit_status == null)).toBe(true);
  });

  test('date range filter', async () => {
    const from = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
    const res = await fetchTags({ from });
    // ~50 tags spread over 90 days → a few in last 5 days
    expect(res.length).toBeGreaterThanOrEqual(2);
  });

  test('filter by color hex', async () => {
    const color = '#ff8000';
    const res = await fetchTags({ color });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every(t => t.colorHex.toLowerCase() === color)).toBe(true);
  });
});

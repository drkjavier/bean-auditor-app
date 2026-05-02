// Mock data: 10 tags con id, unique_id, color, lat, lon, timestamp
export type Tag = {
  id: number;
  unique_id: string;
  color: string; // hex color
  lat: number;
  lon: number;
  timestamp: string; // ISO
  state?: 'open' | 'closed' | 'pending';
};

export const tagsMock: Tag[] = Array.from({ length: 10 }).map((_, i) => {
  const latBase = 37.77; // San Francisco-ish for demo
  const lonBase = -122.42;
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#0ea5e9'];
  const states: Tag['state'][] = ['open', 'closed', 'pending'];
  const ts = new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString();

  return {
    id: i + 1,
    unique_id: `TAG-${1000 + i}`,
    color: colors[i % colors.length],
    lat: +(latBase + (i * 0.01)).toFixed(6),
    lon: +(lonBase - (i * 0.01)).toFixed(6),
    timestamp: ts,
    state: states[i % states.length],
  };
});

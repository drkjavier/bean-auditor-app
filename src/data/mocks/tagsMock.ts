// Mock data: 10 tags con id, unique_id, color, lat, lon, timestamp
// Ubicación: Finca bananera (Finca Mocá Grande - referencia histórica en la zona)
// Coordenadas base usadas (aprox para la finca): 14.276500, -91.369200
export type Tag = {
  id: number;
  unique_id: string;
  color: string; // hex color
  lat: number;
  lon: number;
  timestamp: string; // ISO
  state?: 'open' | 'closed' | 'pending';
};

// Generamos 10 tags dispersos alrededor de la finca (radio pequeño ~100-500m)
export const tagsMock: Tag[] = Array.from({ length: 10 }).map((_, i) => {
  const latBase = 14.283333; // Tiquisate central (approx)
  const lonBase = -91.366667;
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#0ea5e9'];
  const states: Tag['state'][] = ['open', 'closed', 'pending'];

  // Distribución determinista en una pequeña elipse para simular tags dentro de la finca
  const angle = (i / 10) * Math.PI * 2; // ángulo alrededor del centro
  // radio en grados (~0.0005 = ~55m, 0.001 = ~111m)
  const r = 0.0004 + (i % 4) * 0.00035; // entre ~44m y ~155m

  const lat = +(latBase + Math.cos(angle) * r).toFixed(6);
  const lon = +(lonBase + Math.sin(angle) * r).toFixed(6);

  const ts = new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString();

  return {
    id: i + 1,
    unique_id: `TAG-TIQ-${100 + i}`,
    color: colors[i % colors.length],
    lat,
    lon,
    timestamp: ts,
    state: states[i % states.length],
  };
});

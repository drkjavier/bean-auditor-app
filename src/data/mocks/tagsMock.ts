// Mock data: 175 tags con uuid único, colorHex, unique_id, lat, lon, timestamp, audited
// Ubicación base: Finca bananera Tiquisate, Guatemala
// Coordenadas base: 14.283333, -91.366667
// Radio máximo por tag: ~3 metros (≈ 0.000027 grados)
import { TAG_COLORS } from '../../domain/constants/tagColors';
import { AuditStatus } from '../../domain/audit/AuditRecord';

export type Tag = {
  uuid: string;     // identificador técnico único
  colorHex: string; // hex del color, ej: '#FF0000'
  unique_id: string;
  lat: number;
  lon: number;
  timestamp: string; // ISO
  audit_status: AuditStatus | null;
  sync_pending: boolean;
};

const LAT_BASE = 14.283333;
const LON_BASE = -91.366667;
// 3 metros en grados ≈ 0.000027
const MAX_RADIUS_DEG = 0.000027;

// Generador pseudo-aleatorio determinista (LCG simple)
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const rand = lcg(42);

export const tagsMock: Tag[] = Array.from({ length: 175 }).map((_, i) => {
  const colorEntry = TAG_COLORS[i % TAG_COLORS.length];

  // Posición aleatoria dentro de un radio de 3m (0.000027°)
  const angle = rand() * Math.PI * 2;
  const radius = rand() * MAX_RADIUS_DEG;
  const lat = +(LAT_BASE + Math.cos(angle) * radius).toFixed(7);
  const lon = +(LON_BASE + Math.sin(angle) * radius).toFixed(7);

  // Timestamps distribuidos en los últimos 30 días
  const daysAgo = rand() * 30;
  const ts = new Date(Date.now() - daysAgo * 86400000).toISOString();

  const seq = String(i + 1).padStart(3, '0');

  return {
    uuid: `550e8400-e29b-41d4-a716-${String(i + 1).padStart(12, '0')}`,
    colorHex: colorEntry.hex,
    unique_id: `TAG-TIQ-${seq}`,
    lat,
    lon,
    timestamp: ts,
    audit_status: i % 3 === 0 ? 'audited' : i % 3 === 1 ? 'not_audited' : 'pending',
    sync_pending: false,
  };
});

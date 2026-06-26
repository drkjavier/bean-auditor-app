/**
 * Tests for geoUtils module
 */

import {
  bearing,
  distance,
  getNearestUncAuditTag,
  formatDistance,
  getBearingDescription,
} from '../../../domain/farm/geoUtils';
import type { GeoPosition } from '../../../domain/farm/geoUtils';
import type { Tag } from '../../../data/mocks/tagsMock';

// Mock data
const FINCA_CENTER: GeoPosition = { lat: 14.283333, lon: -91.366667 };

const mockTags: Tag[] = [
  {
    uuid: 'tag-001',
    colorHex: '#FF0000',
    unique_id: 'TAG-001',
    lat: 14.284000,
    lon: -91.366000,
    timestamp: '2026-06-25T10:00:00Z',
    audit_status: 'pending',
    sync_pending: false,
  },
  {
    uuid: 'tag-002',
    colorHex: '#00FF00',
    unique_id: 'TAG-002',
    lat: 14.282000,
    lon: -91.367000,
    timestamp: '2026-06-25T10:00:00Z',
    audit_status: 'audited',
    sync_pending: false,
  },
  {
    uuid: 'tag-003',
    colorHex: '#0000FF',
    unique_id: 'TAG-003',
    lat: 14.285000,
    lon: -91.365000,
    timestamp: '2026-06-25T10:00:00Z',
    audit_status: 'not_audited',
    sync_pending: false,
  },
  {
    uuid: 'tag-004',
    colorHex: '#FFFF00',
    unique_id: 'TAG-004',
    lat: 14.283500,
    lon: -91.366500,
    timestamp: '2026-06-25T10:00:00Z',
    audit_status: 'pending',
    sync_pending: false,
  },
];

describe('geoUtils', () => {
  describe('bearing', () => {
    it('should calculate bearing to the north', () => {
      const from: GeoPosition = { lat: 14.2833, lon: -91.3667 };
      const to: GeoPosition = { lat: 14.2840, lon: -91.3667 }; // Same longitude, north
      
      const result = bearing(from, to);
      
      // Should be approximately 0 (north)
      expect(result).toBeCloseTo(0, 0);
    });

    it('should calculate bearing to the east', () => {
      const from: GeoPosition = { lat: 14.2833, lon: -91.3667 };
      const to: GeoPosition = { lat: 14.2833, lon: -91.3660 }; // Same latitude, east
      
      const result = bearing(from, to);
      
      // Should be approximately 90 (east)
      expect(result).toBeCloseTo(90, 0);
    });

    it('should calculate bearing to the south', () => {
      const from: GeoPosition = { lat: 14.2833, lon: -91.3667 };
      const to: GeoPosition = { lat: 14.2826, lon: -91.3667 }; // Same longitude, south
      
      const result = bearing(from, to);
      
      // Should be approximately 180 (south)
      expect(result).toBeCloseTo(180, 0);
    });

    it('should calculate bearing to the west', () => {
      const from: GeoPosition = { lat: 14.2833, lon: -91.3667 };
      const to: GeoPosition = { lat: 14.2833, lon: -91.3674 }; // Same latitude, west
      
      const result = bearing(from, to);
      
      // Should be approximately 270 (west)
      expect(result).toBeCloseTo(270, 0);
    });

    it('should return positive bearing between 0 and 360', () => {
      const from: GeoPosition = { lat: 14.2833, lon: -91.3667 };
      const to: GeoPosition = { lat: 14.2840, lon: -91.3660 }; // Northeast
      
      const result = bearing(from, to);
      
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(360);
    });
  });

  describe('distance', () => {
    it('should return 0 for same point', () => {
      const point: GeoPosition = { lat: 14.2833, lon: -91.3667 };
      
      const result = distance(point, point);
      
      expect(result).toBe(0);
    });

    it('should calculate distance between two points', () => {
      const from: GeoPosition = { lat: 14.2833, lon: -91.3667 };
      const to: GeoPosition = { lat: 14.2840, lon: -91.3660 };
      
      const result = distance(from, to);
      
      // Should be approximately 100-150 meters
      expect(result).toBeGreaterThan(50);
      expect(result).toBeLessThan(200);
    });

    it('should return distance in meters', () => {
      const from: GeoPosition = { lat: 14.2833, lon: -91.3667 };
      const to: GeoPosition = { lat: 14.2834, lon: -91.3667 }; // ~11 meters north
      
      const result = distance(from, to);
      
      // Should be approximately 11 meters
      expect(result).toBeCloseTo(11, 0);
    });

    it('should be symmetric', () => {
      const a: GeoPosition = { lat: 14.2833, lon: -91.3667 };
      const b: GeoPosition = { lat: 14.2840, lon: -91.3660 };
      
      const distAB = distance(a, b);
      const distBA = distance(b, a);
      
      expect(distAB).toBeCloseTo(distBA, 0);
    });
  });

  describe('getNearestUncAuditTag', () => {
    it('should return null for empty tags array', () => {
      const result = getNearestUncAuditTag([], FINCA_CENTER);
      
      expect(result).toBeNull();
    });

    it('should return null when all tags are audited', () => {
      const allAudited: Tag[] = [
        { ...mockTags[0], audit_status: 'audited' },
        { ...mockTags[1], audit_status: 'audited' },
      ];
      
      const result = getNearestUncAuditTag(allAudited, FINCA_CENTER);
      
      expect(result).toBeNull();
    });

    it('should find the nearest un-audited tag', () => {
      // TAG-004 is closest to FINCA_CENTER
      const result = getNearestUncAuditTag(mockTags, FINCA_CENTER);
      
      expect(result).not.toBeNull();
      expect(result?.unique_id).toBe('TAG-004');
    });

    it('should exclude audited tags', () => {
      const result = getNearestUncAuditTag(mockTags, FINCA_CENTER);
      
      // Should not return TAG-002 which is audited
      expect(result?.unique_id).not.toBe('TAG-002');
    });

    it('should include not_audited and pending tags', () => {
      const result = getNearestUncAuditTag(mockTags, FINCA_CENTER);
      
      // TAG-001 is pending, TAG-003 is not_audited, TAG-004 is pending
      expect(['TAG-001', 'TAG-003', 'TAG-004']).toContain(result?.unique_id);
    });

    it('should handle single un-audited tag', () => {
      const singleTag: Tag[] = [
        { ...mockTags[0], audit_status: 'pending' },
      ];
      
      const result = getNearestUncAuditTag(singleTag, FINCA_CENTER);
      
      expect(result).not.toBeNull();
      expect(result?.unique_id).toBe('TAG-001');
    });
  });

  describe('formatDistance', () => {
    it('should format 0 meters', () => {
      expect(formatDistance(0)).toBe('0m');
    });

    it('should format negative as 0', () => {
      expect(formatDistance(-10)).toBe('0m');
    });

    it('should format meters < 1000', () => {
      expect(formatDistance(150)).toBe('150m');
      expect(formatDistance(999)).toBe('999m');
    });

    it('should format kilometers >= 1000', () => {
      expect(formatDistance(1000)).toBe('1.0km');
      expect(formatDistance(2500)).toBe('2.5km');
      expect(formatDistance(1500)).toBe('1.5km');
    });

    it('should round meters to integer', () => {
      expect(formatDistance(150.7)).toBe('151m');
      expect(formatDistance(150.2)).toBe('150m');
    });

    it('should format kilometers with 1 decimal', () => {
      expect(formatDistance(1234)).toBe('1.2km');
      expect(formatDistance(5678)).toBe('5.7km');
    });
  });

  describe('getBearingDescription', () => {
    it('should return Norte for 0 degrees', () => {
      expect(getBearingDescription(0)).toBe('Norte');
    });

    it('should return Noreste for 45 degrees', () => {
      expect(getBearingDescription(45)).toBe('Noreste');
    });

    it('should return Este for 90 degrees', () => {
      expect(getBearingDescription(90)).toBe('Este');
    });

    it('should return Sureste for 135 degrees', () => {
      expect(getBearingDescription(135)).toBe('Sureste');
    });

    it('should return Sur for 180 degrees', () => {
      expect(getBearingDescription(180)).toBe('Sur');
    });

    it('should return Suroeste for 225 degrees', () => {
      expect(getBearingDescription(225)).toBe('Suroeste');
    });

    it('should return Oeste for 270 degrees', () => {
      expect(getBearingDescription(270)).toBe('Oeste');
    });

    it('should return Noroeste for 315 degrees', () => {
      expect(getBearingDescription(315)).toBe('Noroeste');
    });

    it('should normalize angles > 360', () => {
      expect(getBearingDescription(360)).toBe('Norte');
      expect(getBearingDescription(405)).toBe('Noreste'); // 360 + 45
    });

    it('should normalize negative angles', () => {
      expect(getBearingDescription(-90)).toBe('Oeste');
      expect(getBearingDescription(-45)).toBe('Noroeste');
    });
  });
});

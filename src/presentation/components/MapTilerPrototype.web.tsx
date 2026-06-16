/**
 * MapTiler Prototype Component (Web)
 * 
 * Web implementation using MapTiler SDK JS.
 * Tests zoom level 22 (3.7cm/pixel resolution) to verify 0.5m separation requirement.
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MAPTILER_CONFIG } from '../../infrastructure/config/maptiler.config';

type Props = {
  style?: any;
};

export default function MapTilerPrototype({ style }: Props) {
  const [zoom, setZoom] = useState(12);
  const [mapType, setMapType] = useState<'street' | 'satellite' | 'hybrid'>('satellite');
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Test coordinates - two points separated by ~0.5m
  const testPoints = [
    { lat: 37.7749, lon: -122.4194, label: 'Point A' },
    { lat: 37.774905, lon: -122.4194, label: 'Point B (~0.5m away)' },
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Dynamic import to avoid SSR issues
    import('@maptiler/sdk').then(({ Map: MapTilerMap, config, MapStyle }) => {
      config.apiKey = MAPTILER_CONFIG.apiKey;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new MapTilerMap({
          container: mapContainerRef.current,
          style: MapStyle.SATELLITE,
          zoom: zoom,
          center: [testPoints[0].lon, testPoints[0].lat],
          maxZoom: MAPTILER_CONFIG.maxZoom,
        });

        mapInstanceRef.current.on('load', () => {
          setMapReady(true);
          
          // Add test markers
          testPoints.forEach((point, index) => {
            const marker = new (mapInstanceRef.current as any).Marker({ 
              color: index === 0 ? '#2563eb' : '#dc2626' 
            })
              .setLngLat([point.lon, point.lat])
              .setPopup(new (mapInstanceRef.current as any).Popup().setHTML(`<strong>${point.label}</strong>`))
              .addTo(mapInstanceRef.current);
          });
        });
      }
    }).catch((error) => {
      console.error('Failed to load MapTiler SDK:', error);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [zoom]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      import('@maptiler/sdk').then(({ MapStyle }) => {
        const styleMap = {
          street: MapStyle.STREETS,
          satellite: MapStyle.SATELLITE,
          hybrid: MapStyle.HYBRID,
        };
        mapInstanceRef.current.setStyle(styleMap[mapType]);
      });
    }
  }, [mapType]);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 1, MAPTILER_CONFIG.maxZoom);
    setZoom(newZoom);
    console.log(`🔍 Zoom level: ${newZoom} (${getResolutionText(newZoom)})`);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 1, MAPTILER_CONFIG.minZoom);
    setZoom(newZoom);
    console.log(`🔍 Zoom level: ${newZoom} (${getResolutionText(newZoom)})`);
  };

  const getResolutionText = (zoomLevel: number): string => {
    const metersPerPixel = 156543.03392 * Math.cos(0) / Math.pow(2, zoomLevel);
    if (metersPerPixel < 1) {
      return `${(metersPerPixel * 100).toFixed(1)}cm/pixel`;
    }
    return `${metersPerPixel.toFixed(2)}m/pixel`;
  };

  const canZoomIn = zoom < MAPTILER_CONFIG.maxZoom;
  const canZoomOut = zoom > MAPTILER_CONFIG.minZoom;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ MapTiler Prototype (Web)</Text>
        <Text style={styles.subtitle}>High-Precision Map Validation</Text>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Zoom Info Overlay */}
        <View style={styles.zoomOverlay}>
          <Text style={styles.zoomText}>
            Zoom: {zoom} | {getResolutionText(zoom)}
          </Text>
          <Text style={styles.zoomSubtext}>
            Max: {MAPTILER_CONFIG.maxZoom} | Min: {MAPTILER_CONFIG.minZoom}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Zoom Controls */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Zoom</Text>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleZoomOut}
              disabled={!canZoomOut}
              style={[styles.button, !canZoomOut && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
            >
              <Text style={styles.buttonText}>−</Text>
            </Pressable>
            <Text style={styles.zoomValue}>{zoom}</Text>
            <Pressable
              onPress={handleZoomIn}
              disabled={!canZoomIn}
              style={[styles.button, !canZoomIn && styles.buttonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
            >
              <Text style={styles.buttonText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Map Type Controls */}
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Map Type</Text>
          <View style={styles.buttonRow}>
            {(['street', 'satellite', 'hybrid'] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setMapType(type)}
                style={[
                  styles.mapTypeButton,
                  mapType === type && styles.mapTypeButtonActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${type} view`}
                accessibilityState={{ selected: mapType === type }}
              >
                <Text
                  style={[
                    styles.mapTypeButtonText,
                    mapType === type && styles.mapTypeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Test Points Info */}
        <View style={styles.testPointsInfo}>
          <Text style={styles.testPointsTitle}>📍 Test Points (0.5m separation)</Text>
          {testPoints.map((point, index) => (
            <Text key={index} style={styles.testPointText}>
              {point.label}: {point.lat.toFixed(6)}, {point.lon.toFixed(6)}
            </Text>
          ))}
        </View>
      </View>

      {/* Status */}
      <View style={styles.status}>
        <Text style={styles.statusText}>
          {mapReady ? '✅ Map Ready' : '⏳ Loading...'}
        </Text>
        <Text style={styles.statusSubtext}>
          Platform: web | Max Zoom: {MAPTILER_CONFIG.maxZoom}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  mapContainer: {
    height: 400,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  zoomOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  zoomText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  zoomSubtext: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  controls: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  controlGroup: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  zoomValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    minWidth: 40,
    textAlign: 'center',
  },
  mapTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mapTypeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  mapTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  mapTypeButtonTextActive: {
    color: '#ffffff',
  },
  testPointsInfo: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testPointsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  testPointText: {
    fontSize: 11,
    color: '#475569',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  status: {
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  statusSubtext: {
    fontSize: 10,
    color: '#4ade80',
    marginTop: 2,
  },
});

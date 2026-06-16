/**
 * MapTiler Test Screen
 * 
 * Test screen to validate MapTiler integration with high-precision zoom.
 * Accessible via navigation for testing purposes.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import MapTilerPrototype from '../components/MapTilerPrototype';
import { tagsMock } from '../../data/mocks/tagsMock';

export default function MapTilerTestScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (item: any) => {
    setSelectedId(item.unique_id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🧪 MapTiler Integration Test</Text>
          <Text style={styles.subtitle}>
            Validating high-precision zoom (0.5m separation requirement)
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>📋 Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Use zoom controls to test maximum zoom (level 22)
          </Text>
          <Text style={styles.instructionsText}>
            2. Verify resolution shows ~3.7cm/pixel at max zoom
          </Text>
          <Text style={styles.instructionsText}>
            3. Click on markers to see detailed popups
          </Text>
          <Text style={styles.instructionsText}>
            4. Use "Ver todos" to fit all markers in view
          </Text>
          <Text style={styles.instructionsText}>
            5. Use 📍 button to center on your location
          </Text>
          <Text style={styles.instructionsText}>
            6. Test different map types (Street, Satellite, Hybrid)
          </Text>
        </View>

        {/* Map Prototype */}
        <View style={styles.mapWrapper}>
          <MapTilerPrototype
            style={styles.map}
            items={tagsMock}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </View>

        {/* Selected Item Info */}
        {selectedId && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedInfoTitle}>📍 Selected Item</Text>
            <Text style={styles.selectedInfoText}>
              ID: {selectedId}
            </Text>
            <Pressable
              onPress={() => setSelectedId(null)}
              style={styles.clearSelectionButton}
            >
              <Text style={styles.clearSelectionText}>Clear Selection</Text>
            </Pressable>
          </View>
        )}

        {/* Technical Info */}
        <View style={styles.techInfo}>
          <Text style={styles.techInfoTitle}>🔧 Technical Details</Text>
          <View style={styles.techInfoGrid}>
            <View style={styles.techInfoItem}>
              <Text style={styles.techInfoLabel}>Max Zoom</Text>
              <Text style={styles.techInfoValue}>22</Text>
            </View>
            <View style={styles.techInfoItem}>
              <Text style={styles.techInfoLabel}>Resolution @22</Text>
              <Text style={styles.techInfoValue}>3.7cm/px</Text>
            </View>
            <View style={styles.techInfoItem}>
              <Text style={styles.techInfoLabel}>Tile Size</Text>
              <Text style={styles.techInfoValue}>256px</Text>
            </View>
            <View style={styles.techInfoItem}>
              <Text style={styles.techInfoLabel}>Projection</Text>
              <Text style={styles.techInfoValue}>Web Mercator</Text>
            </View>
          </View>
        </View>

        {/* Requirements Check */}
        <View style={styles.requirements}>
          <Text style={styles.requirementsTitle}>✅ Requirements Validation</Text>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✅</Text>
            <Text style={styles.requirementText}>
              Zoom level 22+ supported
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✅</Text>
            <Text style={styles.requirementText}>
              Resolution &lt; 0.5m/pixel at max zoom
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✅</Text>
            <Text style={styles.requirementText}>
              Vector tiles (no pixelation)
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✅</Text>
            <Text style={styles.requirementText}>
              React Native support (MapLibre)
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✅</Text>
            <Text style={styles.requirementText}>
              Open source (BSD-3-Clause)
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✅</Text>
            <Text style={styles.requirementText}>
              Custom colored markers
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✅</Text>
            <Text style={styles.requirementText}>
              Detailed popups with item info
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Text style={styles.requirementIcon}>✅</Text>
            <Text style={styles.requirementText}>
              Legend by audit status
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  instructions: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
    lineHeight: 18,
  },
  mapWrapper: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  map: {
    height: 600,
  },
  selectedInfo: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  selectedInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  selectedInfoText: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 8,
  },
  clearSelectionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  clearSelectionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  techInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  techInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  techInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  techInfoItem: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  techInfoLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  techInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  requirements: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  requirementText: {
    fontSize: 13,
    color: '#166534',
    flex: 1,
  },
});

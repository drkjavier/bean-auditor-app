import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, LatLng, Region } from 'react-native-maps';
import type { Tag } from '../../data/mocks/tagsMock';
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

type Props = {
  items: Tag[];
  style?: any;
  selectedId?: number | null;
  onSelect?: (item: Tag) => void;
};

export default function MapCanvasNative({ items, style, selectedId, onSelect }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);

  async function requestLocation(): Promise<boolean> {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      }) as string;
      const status = await check(permission);
      if (status === RESULTS.GRANTED) return true;

      if (status === RESULTS.BLOCKED) {
        // Permission blocked - suggest opening settings
        Alert.alert(
          'Permiso bloqueado',
          'El permiso de ubicación está bloqueado. Abre los ajustes para habilitarlo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => {
              // try library helper first, fallback to Linking
              try { (require('react-native-permissions').openSettings || Linking.openSettings)(); } catch (_) { Linking.openSettings(); }
            } },
          ],
        );
        return false;
      }

      if (status === RESULTS.UNAVAILABLE) {
        Alert.alert('No disponible', 'Este dispositivo no soporta ubicación en esta configuración.');
        return false;
      }

      // DENIED or LIMITED - request and evaluate
      const res = await request(permission);
      if (res === RESULTS.GRANTED) return true;
      if (res === RESULTS.BLOCKED) {
        // user denied with 'do not ask again'
        Alert.alert(
          'Permiso bloqueado',
          'El permiso quedó bloqueado. Abre ajustes para habilitarlo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => {
              try { (require('react-native-permissions').openSettings || Linking.openSettings)(); } catch (_) { Linking.openSettings(); }
            } },
          ],
        );
        return false;
      }

      return false;
    } catch (e) {
      // don't leak detailed errors
      return false;
    }
  }

  async function centerOnMe() {
    const ok = await requestLocation();
    if (!ok) {
      Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación. Activa el permiso si quieres centrar el mapa.');
      return;
    }

    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        // avoid keeping coordinates longer than necessary if pin not required
        setUserLoc({ latitude, longitude });
        if (mapRef.current) {
          try {
            mapRef.current.animateToRegion({
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            } as Region);
          } catch (e) {
            // swallow animation errors in tests/runtime to avoid crash
          }
        }
      },
      (err) => {
        // err.code/message are platform specific; don't surface raw data
        Alert.alert('Error', 'No fue posible obtener la posición');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
    );
  }

  const initialRegion = items.length > 0
    ? ({ latitude: items[0].lat, longitude: items[0].lon, latitudeDelta: 0.1, longitudeDelta: 0.1 } as Region)
    : ({ latitude: 37.77, longitude: -122.42, latitudeDelta: 0.5, longitudeDelta: 0.5 } as Region);

  return (
    <View style={[styles.container, style]} accessibilityLabel="Mapa nativo de auditorías">
      <View style={styles.toolbar}>
        <TouchableOpacity testID="centerOnMeBtn" onPress={centerOnMe} accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>Mi ubicación</Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {items.map(item => (
          <Marker
            key={String(item.id)}
            coordinate={{ latitude: item.lat, longitude: item.lon }}
            pinColor={item.color}
            onPress={() => onSelect?.(item)}
            accessibilityLabel={`Marcador ${item.unique_id}`}
          />
        ))}
        {userLoc ? <Marker coordinate={userLoc} pinColor="#000" /> : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 320,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: 320,
  },
  toolbar: {
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'flex-end',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});

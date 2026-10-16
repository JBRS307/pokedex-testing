import * as Location from 'expo-location';
import { useCallback } from 'react';
import { LatLng } from 'react-native-maps';

export default function useUserLocation() {
  const [permission, requestPermission] = Location.useForegroundPermissions();

  const getCoordinate = useCallback(async (): Promise<LatLng | null> => {
    const granted = permission?.granted ? permission : await requestPermission();

    if (!granted?.granted) {
      return null;
    }
    try {
      const { coords } = await Location.getCurrentPositionAsync();
      return { latitude: coords.latitude, longitude: coords.longitude };
    } catch {
      return null;
    }
  }, [permission, requestPermission]);

  return { granted: permission?.granted ?? false, getCoordinate };
}

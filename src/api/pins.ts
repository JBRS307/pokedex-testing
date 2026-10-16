import AsyncStorage from '@react-native-async-storage/async-storage';
import { LatLng } from 'react-native-maps';

const PINS_KEY = 'map:pins';

export type Pin = {
  id: string;
  name: string;
  coordinate: LatLng;
};

export async function getPins(): Promise<Pin[]> {
  try {
    const json = await AsyncStorage.getItem(PINS_KEY);
    return json ? (JSON.parse(json) as Pin[]) : [];
  } catch {
    return [];
  }
}

export async function addPin(pin: Pin): Promise<Pin[]> {
  const pins = [...(await getPins()), pin];
  await AsyncStorage.setItem(PINS_KEY, JSON.stringify(pins));
  return pins;
}

export async function removePin(id: string): Promise<Pin[]> {
  const pins = (await getPins()).filter((p) => p.id !== id);
  await AsyncStorage.setItem(PINS_KEY, JSON.stringify(pins));
  return pins;
}

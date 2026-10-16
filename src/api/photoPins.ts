import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { LatLng } from 'react-native-maps';

const PHOTO_PINS_KEY = 'map:photo-pins';
const PHOTO_DIR = new Directory(Paths.document, 'photo-pins');

export type PhotoPin = {
  id: string;
  coordinate: LatLng;
  createdAt: number;
};

export function photoUri(id: string): string {
  return new File(PHOTO_DIR, `${id}.jpg`).uri;
}

export async function savePhoto(sourceUri: string, id: string): Promise<void> {
  if (!PHOTO_DIR.exists) PHOTO_DIR.create({ intermediates: true });
  await new File(sourceUri).copy(new File(PHOTO_DIR, `${id}.jpg`));
}

export async function getPhotoPins(): Promise<PhotoPin[]> {
  try {
    const json = await AsyncStorage.getItem(PHOTO_PINS_KEY);
    return json ? (JSON.parse(json) as PhotoPin[]) : [];
  } catch {
    return [];
  }
}

export async function addPhotoPin(pin: PhotoPin): Promise<PhotoPin[]> {
  const pins = [...(await getPhotoPins()), pin];
  await AsyncStorage.setItem(PHOTO_PINS_KEY, JSON.stringify(pins));
  return pins;
}

export async function removePhotoPin(id: string): Promise<PhotoPin[]> {
  const pins = (await getPhotoPins()).filter((p) => p.id !== id);
  await AsyncStorage.setItem(PHOTO_PINS_KEY, JSON.stringify(pins));
  try {
    new File(PHOTO_DIR, `${id}.jpg`).delete();
  } catch {}
  return pins;
}

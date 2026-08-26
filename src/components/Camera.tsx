import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraRef,
  isScannedFace,
  ScannedObject,
  ScannedObjectType,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { Linking, StyleSheet, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { Asset, usePermissions } from 'expo-media-library';
import { Image } from 'expo-image';
import useFavoriteSprite from '@/hooks/useFavoriteSprite';
import {
  centeredRect,
  foreheadPoint,
  remapNormalized,
  spriteRotation,
  spriteSize,
  toPixels,
  type Face,
} from '@/api/spriteRenderer';
import useUserLocation from '@/hooks/useUserLocation';
import usePhotoPins from '@/hooks/usePhotoPins';
import * as Crypto from 'expo-crypto';
import { savePhoto } from '@/api/photoPins';

const SCAN_TYPES: ScannedObjectType[] = ['face'];

export default function VisionCamera() {
  // Permisions
  const { hasPermission, requestPermission } = useCameraPermission();
  const [mediaPermission, requestMediaPermission] = usePermissions({
    writeOnly: true,
    granularPermissions: ['photo'],
  });

  // Camera
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<CameraRef>(null);
  const backCamera = useCameraDevice('back');
  const frontCamera = useCameraDevice('front');
  const isFocused = useIsFocused();
  const photoOutput = usePhotoOutput();

  // Geolocation
  const { getCoordinate } = useUserLocation();
  const { addPhotoPin } = usePhotoPins();

  // Face scanning
  const { spriteUrl, spriteImage } = useFavoriteSprite();
  const facesRef = useRef<Face[]>([]);
  const [faces, setFaces] = useState<Face[]>([]);
  const onObjectsScanned = useCallback((objects: ScannedObject[]) => {
    const preview = cameraRef.current;
    if (preview == null) return;

    const next: Face[] = [];
    for (const object of objects) {
      if (!isScannedFace(object)) continue;
      try {
        const converted = preview.convertScannedObjectCoordinatesToViewCoordinates(object);
        next.push({
          faceID: object.faceID,
          view: converted.boundingBox,
          camera: object.boundingBox,
          rollAngle: object.hasRollAngle ? object.rollAngle : null,
        });
        facesRef.current = next;
        setFaces(next);
      } catch {
        continue;
      }
    }
  }, []);
  const objectOutput = useObjectOutput({
    types: SCAN_TYPES,
    onObjectsScanned,
  });

  const device = cameraPosition === 'back' ? backCamera : frontCamera;
  const canSwap = backCamera !== undefined && frontCamera !== undefined;

  const swapCamera = () => {
    facesRef.current = [];
    setFaces([]);
    setCameraPosition((pos) => (pos === 'back' ? 'front' : 'back'));
  };

  const takePhoto = async () => {
    if (!mediaPermission?.granted) {
      const res = await requestMediaPermission();
      if (!res.granted) return;
    }

    const locationPromise = getCoordinate();

    const sprite = spriteImage.current;
    const detected = facesRef.current;

    const photo = await photoOutput.capturePhoto({ flashMode: 'off' }, {});
    try {
      let image = await photo.toImageAsync();

      if (sprite != null) {
        for (const face of detected) {
          const box = toPixels(remapNormalized(face.camera), image.width, image.height);
          const rotation = spriteRotation(face, false);

          const size = spriteSize(box);
          const anchor = foreheadPoint(box, rotation);

          const scale = Math.min(size / sprite.width, size / sprite.height);
          const stamp = rotation !== 0 ? await sprite.rotateAsync(rotation) : sprite;

          const r = centeredRect(anchor, stamp.width * scale, stamp.height * scale);
          image = await image.renderIntoAsync(stamp, r.x, r.y, r.width, r.height);
        }
      }

      const path = await image.saveToTemporaryFileAsync('jpg');
      const uri = `file://${path}`;
      await Asset.create(uri);

      const coordinate = await locationPromise;
      if (coordinate) {
        const id = Crypto.randomUUID();
        await savePhoto(uri, id);
        addPhotoPin({ id, coordinate, createdAt: Date.now() });
      }
    } finally {
      photo.dispose();
    }
  };

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return <NoCameraPermission />;
  }
  if (device === undefined) {
    return <View />;
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        isActive={isFocused}
        device={device}
        outputs={[photoOutput, objectOutput]}
        orientationSource="custom"
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {faces.map((face) => (
          <FaceSprite
            key={face.faceID}
            face={face}
            spriteUrl={spriteUrl}
            cameraPosition={cameraPosition}
          />
        ))}
      </View>
      <TakePhotoButton onPress={takePhoto} />
      {canSwap && <SwapCameraButton onPress={swapCamera} />}
    </View>
  );
}

type FaceSpritesProps = {
  face: Face;
  spriteUrl: string | null;
  cameraPosition: 'front' | 'back';
};

function FaceSprite({ face, spriteUrl, cameraPosition }: FaceSpritesProps) {
  const rotation = spriteRotation(face, cameraPosition === 'front');
  const size = spriteSize(face.view);
  const r = centeredRect(foreheadPoint(face.view, rotation), size, size);
  return (
    <Image
      key={face.faceID}
      source={spriteUrl}
      contentFit="contain"
      style={{
        position: 'absolute',
        left: r.x,
        top: r.y,
        width: r.width,
        height: r.height,
        transform: [{ rotate: `${rotation}deg` }],
      }}
    />
  );
}

function TakePhotoButton({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.shutterRing,
        { bottom: insets.bottom + 24 },
        pressed && styles.shutterRingPressed,
      ]}
      onPress={onPress}
      hitSlop={12}
    >
      <View style={styles.shutterInner} />
    </Pressable>
  );
}

function SwapCameraButton({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.swapButton,
        { bottom: insets.bottom + 24 },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <FontAwesome6 name="camera-rotate" size={24} color="white" iconStyle="solid" />
    </Pressable>
  );
}

function NoCameraPermission() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera access needed</Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => Linking.openSettings()}
      >
        <Text style={styles.buttonText}>Open settings</Text>
      </Pressable>
    </View>
  );
}

export function SimpleCamera() {
  // Permisions
  const { hasPermission, requestPermission } = useCameraPermission();
  const [mediaPermission, requestMediaPermission] = usePermissions({
    writeOnly: true,
    granularPermissions: ['photo'],
  });

  // Camera
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<CameraRef>(null);
  const backCamera = useCameraDevice('back');
  const frontCamera = useCameraDevice('front');
  const isFocused = useIsFocused();
  const photoOutput = usePhotoOutput();

  const device = cameraPosition === 'back' ? backCamera : frontCamera;
  const canSwap = backCamera !== undefined && frontCamera !== undefined;

  const swapCamera = () => setCameraPosition((pos) => (pos === 'back' ? 'front' : 'back'));

  const takePhoto = async () => {
    if (!mediaPermission?.granted) {
      const res = await requestMediaPermission();
      if (!res.granted) return;
    }

    const { filePath } = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {});
    await Asset.create(`file://${filePath}`);
  };

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  if (!hasPermission) {
    return <NoCameraPermission />;
  }
  if (device === undefined) {
    return <View />;
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        outputs={[photoOutput]}
      />
      <TakePhotoButton onPress={takePhoto} />
      {canSwap && <SwapCameraButton onPress={swapCamera} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: '#1F2430',
  },
  cameraContainer: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: 'white',
  },
  message: {
    fontSize: 14,
    color: '#B4B9C0',
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#E3350D',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2430',
  },
  shutterRing: {
    position: 'absolute',
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 36, 48, 0.35)',
  },
  shutterRingPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.94 }],
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E3350D',
  },
  swapButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 36, 48, 0.7)',
  },
});

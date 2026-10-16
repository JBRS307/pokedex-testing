import { fetchPokemonCard, pokemonTypeColor } from '@/api/pokemon';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { LatLng, LongPressEvent, Marker, Region } from 'react-native-maps';
import PokemonSheet, { PokemonSheetHandle } from './PokemonSheet';
import useUserLocation from '@/hooks/useUserLocation';
import { Pin } from '@/api/pins';
import usePins from '@/hooks/usePins';
import * as Crypto from 'expo-crypto';
import { PhotoPin, photoUri } from '@/api/photoPins';
import { Image } from 'expo-image';
import usePhotoPins from '@/hooks/usePhotoPins';

const DEFAULT_REGION: Region = {
  latitude: 50.04877618022289,
  longitude: 19.965496857911305,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const INITIAL_SNORLAX: Pin = {
  id: 'DefaultSnorlax',
  name: 'snorlax',
  coordinate: { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude },
};

export default function Map() {
  const mapRef = useRef<MapView>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const { granted, getCoordinate } = useUserLocation();

  const { pins, addPin, removePin } = usePins();
  const { pins: photoPins, removePhotoPin } = usePhotoPins();
  const [photoPreview, setPhotoPreview] = useState<PhotoPin | null>(null);
  const inputRef = useRef<PokemonNameInputHandle>(null);
  const sheetRef = useRef<PokemonSheetHandle>(null);

  useEffect(() => {
    let cancelled = false;
    getCoordinate().then((coordinate) => {
      if (cancelled) return;
      setInitialRegion(
        coordinate
          ? {
              ...coordinate,
              latitudeDelta: DEFAULT_REGION.latitudeDelta,
              longitudeDelta: DEFAULT_REGION.longitudeDelta,
            }
          : DEFAULT_REGION,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [getCoordinate]);

  const openCard = (name: string) => sheetRef.current?.open(name);

  const handleLongPress = (e: LongPressEvent) => {
    const coordinate = e.nativeEvent.coordinate;
    inputRef.current?.open(coordinate);
  };
  const submitPin = (coordinate: LatLng, name: string) => {
    addPin({ id: Crypto.randomUUID(), coordinate, name });
  };

  const goToUserLocation = async () => {
    const coordinate = await getCoordinate();
    if (!coordinate) return;
    mapRef.current?.animateToRegion(
      { ...coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      500,
    );
  };

  if (initialRegion === null) {
    return <ActivityIndicator style={styles.container} size="large" />;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onLongPress={handleLongPress}
        showsUserLocation={granted}
      >
        <PokemonMarker pin={INITIAL_SNORLAX} removePin={() => {}} onPress={openCard} />
        {pins.map((pin) => (
          <PokemonMarker
            key={pin.id}
            pin={pin}
            removePin={removePin}
            onPress={openCard}
            draggable
          />
        ))}
        {photoPins.map((pin) => (
          <PhotoMarker key={pin.id} pin={pin} onPress={setPhotoPreview} />
        ))}
      </MapView>

      {photoPreview !== null && (
        <View style={styles.previewCard}>
          <Image
            source={photoUri(photoPreview.id)}
            style={styles.previewImage}
            contentFit="cover"
          />
          <View style={styles.previewActions}>
            <Pressable
              hitSlop={8}
              onPress={() => {
                removePhotoPin(photoPreview.id);
                setPhotoPreview(null);
              }}
            >
              <MaterialIcons name="delete-outline" size={22} color="#E3350D" />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => setPhotoPreview(null)}>
              <MaterialIcons name="close" size={22} color="#333" />
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.locateButton} onPress={goToUserLocation}>
        <MaterialIcons name="my-location" size={24} color="#333" />
      </Pressable>

      <PokemonNameInput ref={inputRef} onSubmit={submitPin} />

      <PokemonSheet ref={sheetRef} />
    </View>
  );
}

type PokemonMarkerProps = {
  pin: Pin;
  draggable?: boolean;
  removePin: (id: string) => void;
  onPress: (name: string) => void;
};

function PokemonMarker({ pin, removePin, onPress }: PokemonMarkerProps) {
  const {
    data: pokemon,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['pokemon', 'card', pin.name],
    queryFn: async () => await fetchPokemonCard(pin.name),
    staleTime: Infinity,
  });

  if (isPending || isError) {
    return <DefaultMarker pin={pin} removePin={removePin} onPress={() => {}} />;
  }

  return (
    <Marker
      draggable
      coordinate={pin.coordinate}
      pinColor={pokemonTypeColor(pokemon.types[0])}
      onPress={() => onPress(pokemon.name)}
      onDragStart={() => removePin(pin.id)}
      tracksViewChanges={false}
    />
  );
}

type PhotoMarkerProps = {
  pin: PhotoPin;
  onPress: (pin: PhotoPin) => void;
};

function PhotoMarker({ pin, onPress }: PhotoMarkerProps) {
  const [trackViewChanges, setTrackViewChanges] = useState(true);

  return (
    <Marker
      draggable
      coordinate={pin.coordinate}
      tracksViewChanges={trackViewChanges}
      onPress={() => onPress(pin)}
    >
      <View style={styles.photoMarker}>
        <Image
          source={photoUri(pin.id)}
          style={styles.photoMarkerImage}
          contentFit="cover"
          onLoadEnd={() => setTrackViewChanges(false)}
        />
      </View>
    </Marker>
  );
}

function DefaultMarker({ pin, removePin }: PokemonMarkerProps) {
  return (
    <Marker
      draggable
      title={pin.name}
      coordinate={pin.coordinate}
      pinColor={pokemonTypeColor()}
      onDragStart={() => removePin(pin.id)}
      tracksViewChanges={false}
    />
  );
}

type PokemonNameInputHandle = {
  open: (pendingCoordinate: LatLng) => void;
};

type PokemonNameInputProps = {
  ref: React.Ref<PokemonNameInputHandle>;
  onSubmit: (pendingCoordinate: LatLng, name: string) => void;
};

function PokemonNameInput(props: PokemonNameInputProps) {
  const [label, setLabel] = useState('');
  const [pendingCoordinate, setPendingCoordinate] = useState<LatLng | null>(null);

  const { ref, onSubmit } = props;

  const submitInput = () => {
    if (pendingCoordinate !== null) {
      onSubmit(pendingCoordinate, label.trim().toLowerCase());
    }
    setPendingCoordinate(null);
  };

  useImperativeHandle(
    ref,
    () => ({
      open: (pendingCoordinate: LatLng) => {
        setLabel('');
        setPendingCoordinate(pendingCoordinate);
      },
    }),
    [],
  );

  return (
    <Modal
      visible={pendingCoordinate !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setPendingCoordinate(null)}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Pokemon name"
            autoFocus
            onSubmitEditing={submitInput}
          />
          <View style={styles.actions}>
            <Button title="Cancel" onPress={() => setPendingCoordinate(null)} />
            <Button title="Submit" onPress={submitInput} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  locateButton: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  dialog: {
    width: '80%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  photoMarker: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  photoMarkerImage: { width: '100%', height: '100%' },
  previewCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  previewImage: { width: '100%', height: 180 },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    padding: 12,
  },
});

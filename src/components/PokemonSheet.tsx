import { ModalBottomSheet } from '@swmansion/react-native-bottom-sheet';
import { useImperativeHandle, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Pokemon from './Pokemon';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export type PokemonSheetHandle = {
  open: (name: string) => void;
};

export default function PokemonSheet({ ref }: { ref: React.Ref<PokemonSheetHandle> }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [shownPokemon, setShownPokemon] = useState<string | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: (name: string) => {
        setShownPokemon(name);
        setIndex(1);
      },
    }),
    [],
  );

  return (
    <ModalBottomSheet
      index={index}
      onIndexChange={setIndex}
      onSettle={() => {}}
      extendUnderStatusBar
    >
      {shownPokemon !== null && <StatusBar style="light" animated />}
      <View style={styles.modal}>
        {shownPokemon !== null && <Pokemon name={shownPokemon} />}

        <Pressable
          onPress={() => setIndex(0)}
          hitSlop={12}
          style={({ pressed }) => [
            styles.back,
            { top: insets.top + 16, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <FontAwesome name="arrow-left" size={20} color="white" />
        </Pressable>
      </View>
    </ModalBottomSheet>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  back: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});

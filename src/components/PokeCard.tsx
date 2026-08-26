import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchPokemonCard, pokemonTypeColor } from '@/api/pokemon';
import { capitalize } from '@/api/utils';

type PokeCardProps = {
  name: string;
  onPress: (name: string) => void;
};

export default function PokeCard({ name, onPress }: PokeCardProps) {
  const {
    data: pokemon,
    isPending,
    error,
  } = useQuery({
    queryKey: ['pokemon', 'card', name],
    queryFn: async () => await fetchPokemonCard(name),
    staleTime: Infinity,
  });

  if (isPending) {
    return (
      <View style={[styles.card, styles.placeholder]}>
        <ActivityIndicator color="#B4B9C0" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.card, styles.placeholder]}>
        <Text style={styles.errorText}>Something went wrong...</Text>
      </View>
    );
  }

  const typeColor = pokemonTypeColor(pokemon.types[0]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: typeColor },
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(pokemon.name)}
    >
      <View style={styles.spriteWell}>
        {pokemon.sprite_url && (
          <Image
            source={pokemon.sprite_url}
            style={styles.sprite}
            contentFit="contain"
            transition={1200}
          />
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {capitalize(pokemon.name)}
      </Text>

      <View style={styles.types}>
        {pokemon.types.map((type: string) => (
          <View key={type} style={styles.typeChip}>
            <Text style={styles.typeText}>{capitalize(type)}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 196,
    margin: 6,
    padding: 12,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#1F2430',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  placeholder: {
    height: 196,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6E8EC',
  },
  errorText: {
    color: '#8A8F98',
    fontSize: 12,
    textAlign: 'center',
  },
  spriteWell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: 110,
    height: 110,
  },
  name: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
});

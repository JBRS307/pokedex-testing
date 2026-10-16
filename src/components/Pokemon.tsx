import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  clearFavorite,
  fetchPokemonDetails,
  isFavorite,
  PokemonDetails,
  pokemonTypeColor,
  saveFavorite,
  STAT_LABELS,
  STAT_MAX,
  STAT_ORDER,
} from '@/api/pokemon';

export default function Pokemon({ name }: { name: string }) {
  const {
    data: details,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['pokemon', 'details', name],
    queryFn: async () => await fetchPokemonDetails(name),
    staleTime: Infinity,
  });
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    isFavorite(name).then((v) => setFavorite(v));
  }, [name]);

  if (isPending || isError) {
    return <EmptyPokemon />;
  }
  const toggleFavorite = async () => {
    if (favorite) {
      await clearFavorite();
      setFavorite(false);
    } else {
      await saveFavorite(details);
      setFavorite(true);
    }
  };

  return <PokemonView details={details} favorite={favorite} onToggleFavorite={toggleFavorite} />;
}

type PokemonViewProps = {
  details?: PokemonDetails;
  favorite?: boolean;
  onToggleFavorite?: () => void;
};

export function PokemonView({ details, favorite, onToggleFavorite }: PokemonViewProps) {
  const insets = useSafeAreaInsets();
  const typeColor = pokemonTypeColor(details?.types[0]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
    >
      <Introduction
        name={details?.name}
        sprite_url={details?.sprite_url}
        types={details?.types}
        typeColor={typeColor}
        favorite={favorite}
        onToggleFavorite={onToggleFavorite}
      />
      <Stats typeColor={typeColor} stats={details?.stats} />
      <Profile height={details?.height} weight={details?.weight} abilities={details?.abilities} />
    </ScrollView>
  );
}

export function EmptyPokemon() {
  return <PokemonView />;
}

type IntroductionProps = {
  name?: string;
  sprite_url?: string;
  types?: string[];
  typeColor: string;

  favorite?: boolean;
  onToggleFavorite?: () => void;
};

function Introduction(props: IntroductionProps) {
  const insets = useSafeAreaInsets();

  const { name, sprite_url, favorite, types, typeColor, onToggleFavorite } = props;

  return (
    <View style={[styles.hero, { backgroundColor: typeColor, paddingTop: insets.top + 24 }]}>
      {onToggleFavorite && (
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={12}
          style={({ pressed }) => [
            styles.favorite,
            { top: insets.top + 12, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <FontAwesome name={favorite ? 'heart' : 'heart-o'} size={22} color="white" />
        </Pressable>
      )}

      <View style={styles.spriteWell}>
        {sprite_url && (
          <Image source={sprite_url} style={styles.sprite} contentFit="contain" transition={200} />
        )}
      </View>

      {name ? (
        <Text style={styles.name}>{capitalize(name)}</Text>
      ) : (
        <View style={styles.namePlaceholder} />
      )}

      <View style={styles.types}>
        {types
          ? types.map((type: string) => (
              <View key={type} style={styles.typeChip}>
                <Text style={styles.typeText}>{capitalize(type)}</Text>
              </View>
            ))
          : [0, 1].map((i: number) => (
              <View key={i} style={[styles.typeChip, styles.typeChipPlaceholder]} />
            ))}
      </View>
    </View>
  );
}

type StatsProps = {
  typeColor: string;
  stats?: Record<string, number>;
};

function Stats({ typeColor, stats }: StatsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Base stats</Text>
      {STAT_ORDER.map((key) => (
        <StatRow key={key} label={STAT_LABELS[key]} value={stats?.[key]} color={typeColor} />
      ))}
    </View>
  );
}

type ProfileProps = {
  height?: number;
  weight?: number;
  abilities?: { name: string; hidden: boolean }[];
};

function Profile({ height, weight, abilities }: ProfileProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Profile</Text>
      <Field
        label="Height"
        value={height === undefined ? undefined : `${(height / 10).toFixed(1)} m`}
      />
      <Field
        label="Weight"
        value={weight === undefined ? undefined : `${(weight / 10).toFixed(1)} kg`}
      />
      <Field
        label="Abilities"
        value={abilities
          ?.map((a) => capitalize(a.name.replace('-', ' ')) + (a.hidden ? ' (hidden)' : ''))
          .join(', ')}
      />
    </View>
  );
}

type StatRowProps = {
  label: string;
  value?: number;
  color: string;
};

function StatRow({ label, value, color }: StatRowProps) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <View style={styles.statTrack}>
        {value !== undefined && (
          <View
            style={[
              styles.statFill,
              { width: `${Math.min(value / STAT_MAX, 1) * 100}%`, backgroundColor: color },
            ]}
          />
        )}
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {value !== undefined ? (
        <Text style={styles.fieldValue}>{value}</Text>
      ) : (
        <View style={styles.fieldPlaceholder} />
      )}
    </View>
  );
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  content: {
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  number: {
    alignSelf: 'flex-end',
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },
  favorite: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  spriteWell: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sprite: {
    width: 170,
    height: 170,
  },
  spritePlaceholder: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  name: {
    marginTop: 14,
    fontSize: 30,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  namePlaceholder: {
    marginTop: 18,
    width: 160,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  types: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  typeChipPlaceholder: {
    width: 74,
    height: 26,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'white',
    shadowColor: '#1F2430',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8F98',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    width: 68,
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8F98',
  },
  statValue: {
    width: 36,
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2430',
  },
  statTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E6E8EC',
  },
  statFill: {
    height: '100%',
    borderRadius: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  fieldLabel: {
    width: 104,
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8F98',
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2430',
  },
  fieldPlaceholder: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E6E8EC',
  },
});

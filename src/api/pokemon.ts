import AsyncStorage from '@react-native-async-storage/async-storage';

export const POKEMON_URL = 'https://pokeapi.co/api/v2/pokemon';

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

export const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

export const STAT_MAX = 150;

export async function fetchPokemonDetails(name: string): Promise<PokemonDetails> {
  const res = await fetch(`${POKEMON_URL}/${name}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const pd = await res.json();

  const abilities = pd.abilities.map((a: any) => ({
    name: a.ability.name,
    hidden: a.is_hidden,
  }));

  return {
    name: pd.name,
    sprite_url: pd.sprites.other['official-artwork'].front_default,
    types: pd.types.map((t: any) => t.type.name),
    stats: Object.fromEntries(pd.stats.map((s: any) => [s.stat.name, s.base_stat])),
    height: pd.height,
    weight: pd.weight,
    abilities,
  };
}

export async function fetchPokemonCard(name: string): Promise<PokemonCardInfo> {
  const res = await fetch(`${POKEMON_URL}/${name}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const p = await res.json();
  return {
    name: p.name,
    sprite_url: p.sprites.other['official-artwork'].front_default,
    types: p.types.map((t: any) => t.type.name),
  };
}

const TYPE_COLORS: Record<string, string> = {
  normal: '#9FA19F',
  fire: '#E8702A',
  water: '#4A90D9',
  electric: '#E5C22B',
  grass: '#5FBB5A',
  ice: '#61CEC0',
  fighting: '#C0392B',
  poison: '#9B59B6',
  ground: '#D2A34B',
  flying: '#8FA9DE',
  psychic: '#EF6F8C',
  bug: '#94BC4A',
  rock: '#B8A038',
  ghost: '#6B5A9B',
  dragon: '#5A4FCF',
  dark: '#5A5366',
  steel: '#7B8A94',
  fairy: '#EE99AC',
};

const DEFAULT_COLOR = '#9FA19F';

export function pokemonTypeColor(pokemonType?: string) {
  return (pokemonType && TYPE_COLORS[pokemonType]) ?? DEFAULT_COLOR;
}

export type PokemonDetails = {
  name: string;
  sprite_url: string;
  types: string[];
  stats: Record<string, number>;
  height: number;
  weight: number;
  abilities: { name: string; hidden: boolean }[];
};

export type PokemonCardInfo = {
  name: string;
  sprite_url: string;
  types: string[];
};

const FAVORITE_KEY = 'favorite:pokemon';

export async function getFavorite(): Promise<PokemonDetails | null> {
  try {
    const json = await AsyncStorage.getItem(FAVORITE_KEY);
    return json ? (JSON.parse(json) as PokemonDetails) : null;
  } catch {
    return null;
  }
}

export async function isFavorite(name: string): Promise<boolean> {
  const fav = await getFavorite();
  return fav?.name === name;
}

export async function saveFavorite(details: PokemonDetails): Promise<void> {
  await AsyncStorage.setItem(FAVORITE_KEY, JSON.stringify(details));
}

export async function clearFavorite(): Promise<void> {
  await AsyncStorage.removeItem(FAVORITE_KEY);
}

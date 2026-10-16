import Pokemon from '@/components/Pokemon';
import { useLocalSearchParams } from 'expo-router';

export default function PokemonDetails() {
  const { id: idStr } = useLocalSearchParams<{ id: string }>();
  const id = Number(idStr);

  return <Pokemon id={id} />;
}

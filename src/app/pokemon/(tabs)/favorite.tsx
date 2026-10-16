import { clearFavorite, getFavorite, PokemonDetails } from '@/api/pokemon';
import { EmptyPokemon, PokemonView } from '@/components/Pokemon';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export default function FavoritePokemon() {
  const [favoriteDetails, setFavoriteDetails] = useState<PokemonDetails | null>(null);

  useFocusEffect(
    useCallback(() => {
      getFavorite().then((fav) => setFavoriteDetails(fav));
    }, []),
  );

  const toggleFavorite = async () => {
    await clearFavorite();
    setFavoriteDetails(null);
  };

  if (favoriteDetails) {
    return (
      <PokemonView details={favoriteDetails} favorite={true} onToggleFavorite={toggleFavorite} />
    );
  }
  return <EmptyPokemon />;
}

import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import PokeCard from '@/components/PokeCard';
import { useRef } from 'react';
import { POKEMON_URL } from '@/api/pokemon';
import PokemonSheet, { PokemonSheetHandle } from './PokemonSheet';

export default function PokeList() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const sheetRef = useRef<PokemonSheetHandle>(null);

  const openCard = (name: string) => sheetRef.current?.open(name);

  const { data, fetchNextPage, isFetching, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['pokemon', 'list'],
    queryFn: ({ pageParam }) => fetch(pageParam).then((r) => r.json()),
    initialPageParam: `${POKEMON_URL}?limit=30`,
    getNextPageParam: (last) => last.next ?? undefined,
  });

  const onRefresh = async () => {
    await queryClient.resetQueries({ queryKey: ['pokemon', 'list'], exact: true });
  };

  return (
    <View style={styles.container}>
      <FlashList
        data={data?.pages.flatMap((p) => p.results) ?? []}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        numColumns={2}
        refreshing={isFetching && !isFetchingNextPage}
        onRefresh={onRefresh}
        contentContainerStyle={{
          paddingTop: 8,
          paddingHorizontal: 8,
          paddingBottom: insets.bottom + 8,
        }}
        renderItem={({ item: pokemon }) => <PokeCard name={pokemon.name} onPress={openCard} />}
      />

      <PokemonSheet ref={sheetRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  footer: {
    paddingVertical: 20,
  },
});

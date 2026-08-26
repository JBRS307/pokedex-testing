import { getFavorite } from '@/api/pokemon';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { loadImage, Image as NitroImage } from 'react-native-nitro-image';

export default function useFavoriteSprite() {
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  const spriteImage = useRef<NitroImage | null>(null);
  const loadedName = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        const favDetails = await getFavorite();
        if (cancelled) return;

        if (favDetails === null) {
          spriteImage.current = null;
          loadedName.current = null;
          setSpriteUrl(null);
          return;
        }

        setSpriteUrl(favDetails.sprite_url);
        if (loadedName.current === favDetails.name) return;

        const image = await loadImage({ url: favDetails.sprite_url });
        if (cancelled) return;

        spriteImage.current = image;
        loadedName.current = favDetails.name;
      })();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  return { spriteUrl, spriteImage };
}

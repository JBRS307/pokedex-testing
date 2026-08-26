import { addPhotoPin, getPhotoPins, removePhotoPin } from '@/api/photoPins';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const PHOTO_PINS_QUERY_KEY = ['map', 'photo-pins'];

export default function usePhotoPins() {
  const queryClient = useQueryClient();

  const { data: pins = [], isPending } = useQuery({
    queryKey: PHOTO_PINS_QUERY_KEY,
    queryFn: getPhotoPins,
    staleTime: Infinity,
  });

  const add = useMutation({
    mutationFn: addPhotoPin,
    onSuccess: (pins) => queryClient.setQueryData(PHOTO_PINS_QUERY_KEY, pins),
  });

  const remove = useMutation({
    mutationFn: removePhotoPin,
    onSuccess: (pins) => queryClient.setQueryData(PHOTO_PINS_QUERY_KEY, pins),
  });

  return { pins, isPending, addPhotoPin: add.mutate, removePhotoPin: remove.mutate };
}

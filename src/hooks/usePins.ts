import { addPin, getPins, removePin } from '@/api/pins';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const PINS_QUERY_KEY = ['map', 'pins'];

export default function usePins() {
  const queryClient = useQueryClient();

  const { data: pins = [], isPending } = useQuery({
    queryKey: PINS_QUERY_KEY,
    queryFn: getPins,
    staleTime: Infinity,
  });

  const add = useMutation({
    mutationFn: addPin,
    onSuccess: (pins) => queryClient.setQueryData(PINS_QUERY_KEY, pins),
  });

  const remove = useMutation({
    mutationFn: removePin,
    onSuccess: (pins) => queryClient.setQueryData(PINS_QUERY_KEY, pins),
  });

  return { pins, isPending, addPin: add.mutate, removePin: remove.mutate };
}

import { BottomSheetProvider } from '@swmansion/react-native-bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const client = new QueryClient();
export default function RootLayout() {
  return (
    <QueryClientProvider client={client}>
      <BottomSheetProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="dark" />
      </BottomSheetProvider>
    </QueryClientProvider>
  );
}

import { Text, StyleSheet, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { FontAwesome } from '@expo/vector-icons';

export default function PokemonTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={styles.container}>
      <TabList style={[styles.tabList, { paddingTop: insets.top + 8 }]}>
        <TabTrigger name="list" href="/pokemon" asChild>
          <TabButton icon="th-large">List</TabButton>
        </TabTrigger>
        <TabTrigger name="favourite" href="/pokemon/favorite" asChild>
          <TabButton icon="heart">Favourite</TabButton>
        </TabTrigger>
        <TabTrigger name="map" href="/pokemon/map" asChild>
          <TabButton icon="map">Map</TabButton>
        </TabTrigger>
        <TabTrigger name="camera" href="/pokemon/camera" asChild>
          <TabButton icon="camera">Camera</TabButton>
        </TabTrigger>
      </TabList>

      <TabSlot />
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  ref?: React.Ref<View>;
};

function TabButton({ icon, children, isFocused, ref, ...props }: TabButtonProps) {
  return (
    <Pressable
      ref={ref}
      {...props}
      style={({ pressed }) => [
        styles.tab,
        isFocused && styles.tabFocused,
        pressed && styles.tabPressed,
      ]}
    >
      <FontAwesome name={icon} size={18} color={isFocused ? 'white' : '#8A8F98'} />
      <Text numberOfLines={1} style={[styles.tabText, isFocused && styles.tabTextFocused]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  tabList: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#F4F5F7',
  },
  tab: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: 'white',
    shadowColor: '#1F2430',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tabFocused: {
    backgroundColor: '#EE6B6E',
  },
  tabPressed: {
    opacity: 0.85,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#8A8F98',
  },
  tabTextFocused: {
    color: 'white',
  },
});

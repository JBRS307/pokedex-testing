import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href="/pokemon" asChild>
        <Pressable>
          <Image
            source={require('@/assets/pokeball.jpeg')}
            style={styles.pokeball}
            contentFit="contain"
          />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pokeball: {
    width: 200,
    height: 200,
  },
});

import Map from '@/components/Map';
import { Platform, Text, View } from 'react-native';

export default function MapTab() {
  if (Platform.OS === 'ios') {
    return <Map />;
  } else if (Platform.OS === 'android') {
    return (
      <View>
        <Text>Google maps not supported.</Text>
      </View>
    );
  } else {
    return <Text>Maps available only on Android and iOS.</Text>;
  }
}

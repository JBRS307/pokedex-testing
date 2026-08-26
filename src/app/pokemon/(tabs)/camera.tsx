import VisionCamera, { SimpleCamera } from '@/components/Camera';
import { Platform } from 'react-native';

export default function CameraTab() {
  if (Platform.OS === 'ios') {
    return <VisionCamera />;
  } else {
    return <SimpleCamera />;
  }
}

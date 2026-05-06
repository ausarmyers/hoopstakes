import { View, Text } from 'react-native';

// Add this right inside your main component
<View style={{ backgroundColor: 'red', padding: 20 }}>
  <Text style={{ color: 'white', fontSize: 24 }}>✅ DEV BUILD WORKING</Text>
</View>

import { Redirect } from 'expo-router';
import { useStore } from '../lib/store';

export default function Index() {
  const user = useStore((s) => s.user);
  if (!user) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(tabs)/home" />;
}
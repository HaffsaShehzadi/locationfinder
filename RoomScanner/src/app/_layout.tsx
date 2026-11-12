import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

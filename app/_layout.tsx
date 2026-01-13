import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import SplashScreen from '@/src/screens/SplashScreen';

export const unstable_settings = {
  // Pas de route par défaut spécifique
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoggedIn } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [splashFinished, setSplashFinished] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Gérer le splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFinished(true);
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Gérer la redirection après le splash
  useEffect(() => {
    if (!splashFinished || isLoggedIn === null) return;

    // Vérifier si nous sommes déjà sur la bonne route
    const isOnTabsRoute = segments[0]?.startsWith('(tabs)');
    const isOnLoginRoute = segments[0] === 'login';

    if (isLoggedIn) {
      // Si connecté et pas sur tabs, rediriger
      if (!isOnTabsRoute) {
        router.replace('/(tabs)');
      }
    } else {
      // Si non connecté et pas sur login, rediriger
      if (!isOnLoginRoute) {
        router.replace('/login');
      }
    }
  }, [splashFinished, isLoggedIn]);

  // Afficher le splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Si l'auth n'est pas encore initialisé après le splash, afficher une view vide
  if (isLoggedIn === null) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

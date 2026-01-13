import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

// Fonction pour adapter les tailles en fonction de la largeur de l'écran
const getResponsiveSize = (smallSize: number, mediumSize: number, largeSize: number): number => {
  if (width < 375) return smallSize; // Petit écran (iPhone 6/7/8)
  if (width < 768) return mediumSize; // Écran moyen (iPhone 11/12/13)
  return largeSize; // Grand écran (iPad, grand téléphone)
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: [
          styles.tabBar,
          Platform.OS === 'ios' && {
            paddingBottom: 24,
            height: 90,
          },
          Platform.OS === 'android' && {
            paddingBottom: getResponsiveSize(8, 10, 12),
            height: getResponsiveSize(60, 70, 80),
          },
        ],
        tabBarLabelStyle: [
          styles.tabBarLabel,
          {
            fontSize: getResponsiveSize(8, 9, 10),
            marginTop: getResponsiveSize(0, 1, 2),
          },
        ],
        headerShown: false,
        tabBarIconStyle: [
          styles.tabBarIcon,
          {
            marginBottom: getResponsiveSize(1, 2, 4),
          },
        ],
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={getResponsiveSize(20, 24, 28)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bandit"
        options={{
          title: 'Bandit',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="groups" size={getResponsiveSize(20, 24, 28)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Capturer',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="camera-alt" size={getResponsiveSize(20, 24, 28)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="valider"
        options={{
          title: 'Valider',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="done-all" size={getResponsiveSize(20, 24, 28)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="infraction"
        options={{
          title: 'Infraction',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="warning" size={getResponsiveSize(20, 24, 28)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="settings" size={getResponsiveSize(20, 24, 28)} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    paddingHorizontal: 0,
    marginHorizontal: 0,
    borderRadius: 0,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontWeight: '600',
    color: '#999',
  },
  tabBarIcon: {
    marginBottom: 0,
  },
});

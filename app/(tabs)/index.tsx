import { useAuth } from '@/src/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Fonction pour adapter les tailles en fonction de la largeur de l'écran
const getResponsiveSize = (smallSize: number, mediumSize: number, largeSize: number): number => {
  if (width < 375) return smallSize;
  if (width < 768) return mediumSize;
  return largeSize;
};

// Fonction pour adapter les font sizes
const getResponsiveFontSize = (smallSize: number, mediumSize: number): number => {
  return width < 375 ? smallSize : mediumSize;
};

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalCaptures: 12,
    totalInfractions: 8,
    totalValidations: 10,
    totalBandits: 5,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  // Fonction pour traduire les rôles
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Administrateur';
      case 'ROLE_SUPERVISEUR':
        return 'Superviseur';
      case 'ROLE_OPJ':
        return 'Agent OPJ';
      default:
        return 'Utilisateur';
    }
  };

  // Fonction pour obtenir l'icône du rôle
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'admin-panel-settings';
      case 'ROLE_SUPERVISEUR':
        return 'supervisor-account';
      case 'ROLE_OPJ':
        return 'badge';
      default:
        return 'person';
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      Alert.alert('Erreur', 'Impossible de charger les données');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', onPress: () => {} },
      {
        text: 'Déconnexion',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = `${user?.prenom?.charAt(0) || 'U'}${user?.nom?.charAt(0) || 'U'}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066cc" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Principal - Bleu Officiel */}
        <View style={[styles.header, { paddingHorizontal: getResponsiveSize(12, 16, 20) }]}>
          <View style={styles.headerContent}>
            <View style={styles.userSection}>
              <View style={[styles.avatarContainer, { width: getResponsiveSize(48, 56, 64), height: getResponsiveSize(48, 56, 64), borderRadius: getResponsiveSize(24, 28, 32) }]}>
                <Text style={[styles.avatarText, { fontSize: getResponsiveSize(14, 18, 22) }]}>{initials}</Text>
              </View>
              <View style={styles.userTextSection}>
                <Text style={[styles.greetingText, { fontSize: getResponsiveSize(11, 12, 13) }]}>Bienvenue</Text>
                <Text 
                  style={[styles.userName, { fontSize: getResponsiveSize(13, 15, 17) }]}
                  numberOfLines={1}
                >
                  {user?.prenom} {user?.nom}
                </Text>
                <View style={styles.roleTag}>
                  <MaterialIcons name={getRoleIcon(user?.role)} size={getResponsiveSize(10, 12, 14)} color="#0066cc" />
                  <Text style={[styles.roleTagText, { fontSize: getResponsiveSize(9, 11, 12) }]}>
                    {getRoleLabel(user?.role)}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.logoutButton, { width: getResponsiveSize(40, 44, 48), height: getResponsiveSize(40, 44, 48), borderRadius: getResponsiveSize(20, 22, 24) }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialIcons name="logout" size={getResponsiveSize(18, 22, 24)} color="#0066cc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenu Principal */}
        <View style={[styles.mainContent, { paddingHorizontal: getResponsiveSize(12, 16, 20), paddingVertical: getResponsiveSize(14, 20, 24) }]}>
          {/* Section Statistiques */}
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { fontSize: getResponsiveSize(13, 15, 17) }]}>Statistiques</Text>
            <View style={[styles.statsGrid, { gap: getResponsiveSize(6, 8, 10) }]}>
              <StatItem
                icon="camera-alt"
                label="Captures"
                value={stats.totalCaptures}
              />
              <StatItem
                icon="warning"
                label="Infractions"
                value={stats.totalInfractions}
              />
              <StatItem
                icon="done-all"
                label="Validées"
                value={stats.totalValidations}
              />
              <StatItem
                icon="people"
                label="Personnes"
                value={stats.totalBandits}
              />
            </View>
          </View>

          {/* Section Actions Rapides */}
          <View style={styles.actionSection}>
            <Text style={[styles.sectionTitle, { fontSize: getResponsiveSize(13, 15, 17) }]}>Actions Rapides</Text>
            <View style={[styles.quickActionGrid, { gap: getResponsiveSize(6, 8, 10) }]}>
              <QuickActionButton
                icon="camera-alt"
                label="Capturer"
                onPress={() => console.log('Capturer')}
              />
              <QuickActionButton
                icon="done-all"
                label="Valider"
                onPress={() => console.log('Valider')}
              />
              <QuickActionButton
                icon="list"
                label="Infractions"
                onPress={() => console.log('Infractions')}
              />
              <QuickActionButton
                icon="search"
                label="Rechercher"
                onPress={() => console.log('Rechercher')}
              />
            </View>
          </View>

          {/* Section Information */}
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { fontSize: getResponsiveSize(13, 15, 17) }]}>Informations</Text>
            <InfoCard
              icon="info"
              title="À propos de l'application"
              description="OPJ Capture Mobile v1.0"
            />
            <InfoCard
              icon="sync"
              title="Synchronisation"
              description="Données synchronisées en temps réel"
            />
            <InfoCard
              icon="security"
              title="Sécurité"
              description="Données chiffrées et protégées"
            />
          </View>

          {/* Footer */}
          <View style={[styles.footer, { marginBottom: getResponsiveSize(8, 12, 16) }]}>
            <Text style={[styles.footerText, { fontSize: getResponsiveSize(12, 13, 14) }]}>OPJ Capture Mobile</Text>
            <Text style={[styles.footerVersion, { fontSize: getResponsiveSize(10, 11, 12) }]}>v1.0 • © 2026</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant: Carte Statistique
function StatItem({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <View style={[styles.statCard, { paddingVertical: getResponsiveSize(12, 16, 18), minHeight: getResponsiveSize(100, 120, 140), marginBottom: getResponsiveSize(6, 8, 10) }]}>
      <View style={[styles.statIconContainer, { width: getResponsiveSize(36, 44, 50), height: getResponsiveSize(36, 44, 50), borderRadius: getResponsiveSize(18, 22, 25), marginBottom: getResponsiveSize(6, 8, 10) }]}>
        <MaterialIcons name={icon as any} size={getResponsiveSize(20, 24, 28)} color="#0066cc" />
      </View>
      <Text style={[styles.statValue, { fontSize: getResponsiveSize(15, 18, 20) }]}>{value}</Text>
      <Text style={[styles.statLabel, { fontSize: getResponsiveSize(11, 12, 13) }]}>{label}</Text>
    </View>
  );
}

// Composant: Bouton Action Rapide
function QuickActionButton({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.quickActionButton, { paddingVertical: getResponsiveSize(12, 16, 18), minHeight: getResponsiveSize(100, 120, 140) }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.quickActionIconBg, { width: getResponsiveSize(36, 44, 50), height: getResponsiveSize(36, 44, 50), borderRadius: getResponsiveSize(18, 22, 25), marginBottom: getResponsiveSize(6, 8, 10) }]}>
        <MaterialIcons name={icon as any} size={getResponsiveSize(20, 24, 28)} color="#0066cc" />
      </View>
      <Text style={[styles.quickActionLabel, { fontSize: getResponsiveSize(11, 12, 13) }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Composant: Carte Information
function InfoCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={[styles.infoCard, { paddingHorizontal: getResponsiveSize(10, 12, 14), paddingVertical: getResponsiveSize(10, 12, 14), marginBottom: getResponsiveSize(6, 8, 10) }]}>
      <View style={[styles.infoIconContainer, { width: getResponsiveSize(32, 36, 40), height: getResponsiveSize(32, 36, 40), borderRadius: getResponsiveSize(16, 18, 20), marginRight: getResponsiveSize(10, 12, 14) }]}>
        <MaterialIcons name={icon as any} size={getResponsiveSize(16, 20, 22)} color="#0066cc" />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoTitle, { fontSize: getResponsiveSize(12, 13, 14) }]}>{title}</Text>
        <Text style={[styles.infoDesc, { fontSize: getResponsiveSize(10, 11, 12) }]}>{description}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={getResponsiveSize(16, 20, 22)} color="#ccc" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#666',
    fontWeight: '500',
  },

  // ========== HEADER ==========
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    paddingVertical: getResponsiveSize(10, 12, 14),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveSize(8, 12, 14),
  },
  avatarText: {
    fontWeight: '700',
    color: '#0066cc',
  },
  userTextSection: {
    flex: 1,
  },
  greetingText: {
    color: '#999',
    fontWeight: '500',
  },
  userName: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 2,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleTagText: {
    fontWeight: '600',
    color: '#0066cc',
    marginLeft: 4,
  },
  logoutButton: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: getResponsiveSize(6, 8, 10),
  },

  // ========== MAIN CONTENT ==========
  mainContent: {
    paddingVertical: 20,
  },

  // ========== STATISTICS ==========
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    justifyContent: 'center',
  },
  statIconContainer: {
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    color: '#0066cc',
  },
  statLabel: {
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },

  // ========== QUICK ACTIONS ==========
  actionSection: {
    marginBottom: 24,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    justifyContent: 'center',
  },
  quickActionIconBg: {
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },

  // ========== INFO SECTION ==========
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoIconContainer: {
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoDesc: {
    color: '#888',
    marginTop: 2,
  },

  // ========== FOOTER ==========
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  footerText: {
    fontWeight: '600',
    color: '#333',
  },
  footerVersion: {
    color: '#999',
    marginTop: 4,
  },
});

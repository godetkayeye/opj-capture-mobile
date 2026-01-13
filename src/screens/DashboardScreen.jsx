import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getApiUrl } from '../api/config';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalCaptures: 0,
    totalInfractions: 0,
    totalValidations: 0,
    totalBandits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Récupérer les infos utilisateur
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }

      // Récupérer les statistiques depuis l'API
      try {
        const response = await fetch(getApiUrl('/api/stats'), {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats({
            totalCaptures: data.totalCaptures || 0,
            totalInfractions: data.totalInfractions || 0,
            totalValidations: data.totalValidations || 0,
            totalBandits: data.totalBandits || 0,
          });
        }
      } catch (statsErr) {
        console.warn('Impossible de charger les statistiques:', statsErr);
        // Continuer sans stats si l'endpoint n'existe pas
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
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
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

  // Fonction pour obtenir le titre du rôle
  const getRoleTitle = () => {
    if (!user?.role) return 'Utilisateur';
    
    switch (user.role) {
      case 'ROLE_ADMIN':
        return 'Administrateur';
      case 'ROLE_SUPERVISEUR':
        return 'Superviseur';
      case 'ROLE_OPJ':
        return 'Officier (OPJ)';
      case 'ROLE_VALIDATOR':
        return 'Validateur';
      default:
        return 'Utilisateur';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Bienvenue,</Text>
          <Text style={styles.userName}>
            {user?.prenom} {user?.nom}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleTitle()}</Text>
          </View>
          {user?.matricule && (
            <Text style={styles.matriculeText}>Matricule: {user.matricule}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <Text style={styles.statsDate}>Mis à jour: {new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
        
        <View style={styles.statsGrid}>
          {/* Captures Card */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}
            onPress={() => router.push('/captures')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#0066cc' }]}>
              <MaterialIcons name="photo-camera" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.totalCaptures}</Text>
            <Text style={styles.statLabel}>Captures</Text>
          </TouchableOpacity>

          {/* Infractions Card */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#fff3e0' }]}
            onPress={() => router.push('/infractions')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#ff9800' }]}>
              <MaterialIcons name="warning" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.totalInfractions}</Text>
            <Text style={styles.statLabel}>Infractions</Text>
          </TouchableOpacity>

          {/* Validations Card */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}
            onPress={() => router.push('/validations')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#9c27b0' }]}>
              <MaterialIcons name="check-circle" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.totalValidations}</Text>
            <Text style={styles.statLabel}>Validations</Text>
          </TouchableOpacity>

          {/* Bandits Card */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#ffebee' }]}
            onPress={() => router.push('/bandits')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#f44336' }]}>
              <MaterialIcons name="person" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.totalBandits}</Text>
            <Text style={styles.statLabel}>Bandits</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>

        {user?.role === 'ROLE_OPJ' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/captures/new')}
          >
            <MaterialIcons name="photo-camera" size={28} color="#0066cc" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Nouvelle Capture</Text>
              <Text style={styles.actionDesc}>Créer une nouvelle capture</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/captures')}
        >
          <MaterialIcons name="list" size={28} color="#0066cc" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Captures</Text>
            <Text style={styles.actionDesc}>Consulter toutes les captures</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/infractions')}
        >
          <MaterialIcons name="warning" size={28} color="#ff9800" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Infractions</Text>
            <Text style={styles.actionDesc}>Gérer les infractions</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>

        {(user?.role === 'ROLE_SUPERVISEUR' || user?.role === 'ROLE_VALIDATOR') && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/validations')}
          >
            <MaterialIcons name="check-circle" size={28} color="#9c27b0" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Validations</Text>
              <Text style={styles.actionDesc}>Valider les captures</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/bandits')}
        >
          <MaterialIcons name="person" size={28} color="#f44336" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Bandits</Text>
            <Text style={styles.actionDesc}>Consulter les bandits</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Role Info */}
      <View style={styles.roleInfoContainer}>
        <MaterialIcons name="info" size={24} color="#0066cc" />
        <View style={styles.roleInfoContent}>
          <Text style={styles.roleInfoTitle}>Votre Rôle</Text>
          <Text style={styles.roleInfoText}>{getRoleTitle()}</Text>
          <Text style={styles.roleInfoDesc}>
            {user?.role === 'ROLE_OPJ' && 'Vous pouvez créer et consulter les captures'}
            {user?.role === 'ROLE_SUPERVISEUR' && 'Vous pouvez superviser tous les accès'}
            {user?.role === 'ROLE_VALIDATOR' && 'Vous pouvez valider les captures'}
            {user?.role === 'ROLE_ADMIN' && 'Vous avez accès à toutes les fonctionnalités'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>OPJ Capture v1.0 Mobile</Text>
        <Text style={styles.footerText}>© 2026 Tous droits réservés</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  matriculeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  statsHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#999',
  },
  roleInfoContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  roleInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  roleInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 4,
  },
  roleInfoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  roleInfoDesc: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});
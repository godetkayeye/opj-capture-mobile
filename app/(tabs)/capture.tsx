import { getApiUrl } from '@/src/api/config';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface User {
  id: number;
  role: string;
}

interface Capture {
  id: number;
  bandit: { id: number; nom: string; prenom?: string; surnom?: string; photo?: string };
  opj: { id: number; nom: string; prenom: string; matricule: string };
  dateCapture: string;
  dateCaptureFormatted: string;
  lieuCapture: string;
  status: string;
  commentaire?: string;
  validation?: { id: number; statut: string; remarque: string; dateValidation: string };
  preuves: any[];
  createdAt: string;
}

export default function CaptureScreen() {
  const router = useRouter();
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Charger les infos utilisateur et captures au focus
  useFocusEffect(
    React.useCallback(() => {
      setPage(1);
      setCaptures([]);
      setHasMore(true);
      loadUserAndCaptures();
    }, [])
  );

  // Charger l'utilisateur et les captures
  const loadUserAndCaptures = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      await loadCaptures(1);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Charger les captures
  const loadCaptures = async (pageNum: number) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const url = getApiUrl(`/api/captures`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const capturesData = Array.isArray(data) ? data : (data['hydra:member'] || []);
        
        setCaptures(capturesData);
        setHasMore(false); // Pas de pagination pour le moment
      } else {
        if (pageNum === 1) {
          Alert.alert('Erreur', 'Impossible de charger les captures');
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      if (pageNum === 1) {
        Alert.alert('Erreur', 'Erreur de connexion au serveur');
      }
    } finally {
      if (pageNum === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Rafraîchir la liste
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/captures?page=1'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const capturesData = Array.isArray(data) ? data : (data['hydra:member'] || []);
        setCaptures(capturesData);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Charger plus
  const loadMore = () => {
    // Désactivé pour le moment - chargement simple sans pagination
  };

  // Vérifier si l'utilisateur peut supprimer
  const canDelete = (capture: Capture): boolean => {
    if (!user) return false;
    // Admin peut tout supprimer
    if (user.role === 'ROLE_ADMIN') return true;
    // OPJ peut supprimer ses propres captures
    if (user.role === 'ROLE_OPJ' && capture.opj?.id === user.id) return true;
    return false;
  };

  // Supprimer une capture
  const deleteCapture = async (id: number) => {
    Alert.alert('Confirmation', 'Êtes-vous sûr de vouloir supprimer cette capture ?', [
      { text: 'Annuler', onPress: () => {} },
      {
        text: 'Supprimer',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(getApiUrl(`/api/captures/${id}`), {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              setCaptures(captures.filter(c => c.id !== id));
              Alert.alert('Succès', 'Capture supprimée');
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer la capture');
            }
          } catch (err) {
            console.error('Erreur:', err);
            Alert.alert('Erreur', 'Erreur de connexion');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  // Rendu d'une capture
  const renderCaptureItem = ({ item }: { item: Capture }) => (
    <View style={styles.captureCard}>
      <View style={styles.cardImageWrapper}>
        {item.bandit?.photo ? (
          <Image
            source={{ uri: item.bandit.photo }}
            style={styles.captureImage}
            onError={(e) => console.log('Erreur image:', e)}
          />
        ) : (
          <View style={styles.noPhotoPlaceholder}>
            <MaterialIcons name="image-not-supported" size={32} color="#c5d3e0" />
          </View>
        )}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <MaterialIcons name="camera-alt" size={12} color="#fff" />
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.captureContent}>
        {/* Header avec nom et boutons d'action */}
        <View style={styles.headerSection}>
          <View style={styles.nameContainer}>
            <Text style={styles.banditName} numberOfLines={1}>
              {item.bandit?.nom?.toUpperCase()}
            </Text>
            {item.bandit?.surnom && (
              <Text style={styles.banditPrenom} numberOfLines={1}>
                ({item.bandit.surnom})
              </Text>
            )}
            {item.opj && (
              <Text style={styles.opjText} numberOfLines={1}>
                OPJ: {item.opj.prenom} {item.opj.nom}
              </Text>
            )}
          </View>
          <View style={styles.actionButtonsContainer}>
            {/* Bouton Éditer */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                router.push({
                  pathname: '/new-capture',
                  params: { captureId: item.id }
                });
              }}
            >
              <MaterialIcons name="edit" size={16} color="#fff" />
              <Text style={styles.buttonText}>Éditer</Text>
            </TouchableOpacity>
            
            {/* Bouton Supprimer */}
            {canDelete(item) && (
              <TouchableOpacity
                style={styles.deleteActionButton}
                onPress={() => deleteCapture(item.id)}
              >
                <MaterialIcons name="delete" size={16} color="#fff" />
                <Text style={styles.buttonText}>Supprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Statut */}
        <View style={styles.infractionTag}>
          <MaterialIcons name="check-circle" size={12} color="#0066cc" />
          <Text style={styles.infraction} numberOfLines={1}>
            {item.status}
          </Text>
        </View>

        {/* Bouton Preuves */}
        {item.preuves && item.preuves.length > 0 && (
          <TouchableOpacity
            style={styles.preuveButton}
            onPress={() => {
              Alert.alert(
                'Preuves',
                `${item.preuves.length} preuve(s) disponible(s)`,
                [
                  { text: 'Fermer', onPress: () => {} }
                ]
              );
            }}
          >
            <MaterialIcons name="image" size={14} color="#fff" />
            <Text style={styles.buttonText}>
              {item.preuves.length} preuve{item.preuves.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Lieu de capture */}
        <Text style={styles.description} numberOfLines={2}>
          {item.lieuCapture}
        </Text>

        {/* Localisation et date */}
        <View style={styles.footerSection}>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={12} color="#0066cc" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dateCaptureFormatted}
            </Text>
          </View>
          <Text style={styles.date}>
            {item.commentaire ? '📝' : '✓'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {user?.role === 'ROLE_ADMIN' ? 'Toutes les Captures' : 'Mes Captures'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {captures.length} capture{captures.length > 1 ? 's' : ''}
        </Text>
      </View>

      {loading && captures.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : captures.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="image-not-supported" size={64} color="#d0d8e0" />
          <Text style={styles.emptyText}>Aucune capture pour le moment</Text>
          <Text style={styles.emptySubtext}>
            Créez votre première capture en utilisant le bouton "+"
          </Text>
        </View>
      ) : (
        <FlatList
          data={captures}
          renderItem={renderCaptureItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 10 }} /> : null
          }
        />
      )}

      {/* Bouton flottant pour nouvelle capture */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/new-capture')}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#0066cc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0066cc',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 80,
  },
  captureCard: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 8,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: '#f1f5f9',
  },
  captureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0066cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  captureContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  nameContainer: {
    flex: 1,
  },
  banditName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0066cc',
    letterSpacing: -0.3,
  },
  banditPrenom: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  opjText: {
    fontSize: 10,
    color: '#0066cc',
    fontWeight: '600',
    marginTop: 4,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
  },
  deleteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
  },
  preuveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  infractionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
  },
  infraction: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '700',
    flex: 1,
  },
  description: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '400',
    lineHeight: 16,
    marginVertical: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '600',
    flex: 1,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 4,
  },
  date: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});

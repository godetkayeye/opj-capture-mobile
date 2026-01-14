import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Capture,
    User,
    loadUserData,
    loadCaptures,
    refreshCaptures,
    deleteCapture,
    canDeleteCapture,
    getHeaderTitle,
} from '../../lib/capture/capture.logic';
import { styles } from '../../lib/capture/capture.styles';

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
      const userData = await loadUserData();
      setUser(userData);
      await handleLoadCaptures(1);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Charger les captures
  const handleLoadCaptures = async (pageNum: number) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const capturesData = await loadCaptures(pageNum);
      setCaptures(capturesData);
      setHasMore(false);
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
      const capturesData = await refreshCaptures();
      setCaptures(capturesData);
    } finally {
      setRefreshing(false);
    }
  };

  // Charger plus
  const loadMore = () => {
    // Désactivé pour le moment - chargement simple sans pagination
  };

  // Supprimer une capture
  const handleDeleteCapture = async (id: number) => {
    const updated = await deleteCapture(id, captures);
    setCaptures(updated);
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
              <Text style={styles.editButtonText}>Éditer</Text>
            </TouchableOpacity>
            
            {/* Bouton Supprimer */}
            {canDeleteCapture(user, item) && (
              <TouchableOpacity
                style={styles.deleteActionButton}
                onPress={() => handleDeleteCapture(item.id)}
              >
                <MaterialIcons name="delete" size={16} color="#fff" />
                <Text style={styles.deleteButtonText}>Supprimer</Text>
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
            <MaterialIcons name="image" size={16} color="#fff" />
            <Text style={styles.preuveButtonText}>
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
          {getHeaderTitle(user)}
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

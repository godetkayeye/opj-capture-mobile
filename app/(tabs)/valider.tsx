import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#0066cc',
  white: '#ffffff',
  black: '#000000',
  lightGray: '#f5f5f5',
  border: '#e8e8e8',
  success: '#4caf50',
  danger: '#f44336',
  warning: '#ff9800',
  textDark: '#333333',
  textLight: '#666666',
};

interface Capture {
  id: number;
  bandit?: {
    id: number;
    nom: string;
    prenom: string;
    photo?: string;
    surnom?: string;
  };
  infraction?: {
    id: number;
    libelle: string;
  };
  opj?: {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
  } | string;
  dateCapture?: string;
  dateCaptureFormatted?: string;
  lieuCapture?: string;
  status?: string;
  validation?: string | { statut: string; dateValidation: string; remarque: string };
  description?: string;
  latitude?: number;
  longitude?: number;
  preuves?: any;
  commentaire?: string;
}

export default function ValiderScreen() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationComment, setValidationComment] = useState('');

  useEffect(() => {
    loadValidatedCaptures();
  }, []);

  const getApiUrl = (endpoint: string) => {
    const baseUrl = 'http://72.61.97.77:8000';
    return `${baseUrl}${endpoint}`;
  };

  const loadValidatedCaptures = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const url = getApiUrl('/api/captures');

      console.log('Chargement des captures validées:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Captures chargées:', data);

      // Filtrer pour afficher uniquement les captures validées
      const captureList = Array.isArray(data) ? data : data.data || [];
      const validatedCaptures = captureList.filter((capture: Capture) => {
        // Vérifier les différents formats de statut possible
        const isValidated =
          capture.status === 'VALIDEE' ||
          capture.status === 'validé' ||
          capture.validation === 'VALIDEE' ||
          capture.validation === 'validé' ||
          (capture.validation && typeof capture.validation === 'object' && capture.validation.statut === 'VALIDEE');
        return isValidated;
      });

      console.log('Captures validées filtrées:', validatedCaptures);
      setCaptures(validatedCaptures);
    } catch (error) {
      console.error('Erreur chargement captures validées:', error);
      Alert.alert('Erreur', 'Impossible de charger les captures validées');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadValidatedCaptures();
    setRefreshing(false);
  };

  const handleRejectCapture = (captureId: number) => {
    Alert.alert(
      'Rejeter la capture',
      'Êtes-vous sûr de vouloir rejeter cette capture?',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Rejeter',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(
                getApiUrl(`/api/captures/${captureId}`),
                {
                  method: 'PATCH',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ validation: 'rejeté' }),
                }
              );

              if (response.ok) {
                Alert.alert('Succès', 'Capture rejetée');
                loadValidatedCaptures();
              } else {
                Alert.alert('Erreur', 'Impossible de rejeter la capture');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Erreur de connexion');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleAddComment = async () => {
    if (!selectedCapture) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        getApiUrl(`/api/captures/${selectedCapture.id}`),
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ commentaire: validationComment }),
        }
      );

      if (response.ok) {
        Alert.alert('Succès', 'Commentaire ajouté');
        setValidationModalVisible(false);
        setValidationComment('');
        loadValidatedCaptures();
      } else {
        Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion');
    }
  };

  const handleOpenPreuve = (preuve: any) => {
    const fileUrl = preuve.url || preuve.path || preuve.uri;
    
    if (!fileUrl) {
      Alert.alert('Erreur', 'Impossible d\'accéder au fichier');
      return;
    }

    const fileName = preuve.filename || preuve.name || 'Fichier';
    const fileType = preuve.type || preuve.mimeType || '';
    const isImage = fileType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isVideo = fileType.includes('video') || fileName.match(/\.(mp4|avi|mov|mkv|flv|wmv)$/i);
    const isPDF = fileType.includes('pdf') || fileName.match(/\.pdf$/i);

    // Pour les images, afficher une prévisualisation
    if (isImage) {
      Alert.alert('Image', `${fileName}\n\nLe fichier s'ouvrira dans votre navigateur.`, [
        {
          text: 'Ouvrir',
          onPress: () => {
            // En production, vous pouvez utiliser Linking.openURL ou un viewer intégré
            try {
              require('react-native').Linking.openURL(fileUrl);
            } catch (error) {
              console.error('Erreur ouverture image:', error);
              Alert.alert('Erreur', 'Impossible d\'ouvrir l\'image');
            }
          },
        },
        { text: 'Annuler', onPress: () => {} },
      ]);
    } else if (isPDF || isVideo) {
      // Pour PDF et vidéos, proposer d'ouvrir avec une application
      Alert.alert(
        isVideo ? 'Vidéo' : 'Document PDF',
        `${fileName}\n\nOuvrir le fichier avec l'application par défaut?`,
        [
          {
            text: 'Ouvrir',
            onPress: () => {
              try {
                require('react-native').Linking.openURL(fileUrl);
              } catch (error) {
                console.error('Erreur ouverture fichier:', error);
                Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
              }
            },
          },
          { text: 'Annuler', onPress: () => {} },
        ]
      );
    } else {
      // Fichiers génériques
      Alert.alert('Fichier', `${fileName}\n\nOuvrir le fichier?`, [
        {
          text: 'Ouvrir',
          onPress: () => {
            try {
              require('react-native').Linking.openURL(fileUrl);
            } catch (error) {
              console.error('Erreur ouverture fichier:', error);
              Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
            }
          },
        },
        { text: 'Annuler', onPress: () => {} },
      ]);
    }
  };

  const filteredCaptures = captures.filter((capture) =>
    `${capture.bandit?.prenom || ''} ${capture.bandit?.nom || ''} ${
      capture.infraction?.libelle || ''
    }`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const renderCaptureItem = ({ item }: { item: Capture }) => (
    <View style={styles.captureCard}>
      <View style={styles.captureContent}>
        {item.bandit?.photo ? (
          <Image
            source={{ uri: item.bandit.photo }}
            style={styles.capturePhoto}
            onError={() => console.log('Erreur photo')}
          />
        ) : (
          <View style={[styles.capturePhoto, styles.photoPlaceholder]}>
            <MaterialIcons name="person" size={40} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.captureInfo}>
          <Text style={styles.captureName}>
            {item.bandit?.prenom} {item.bandit?.nom}
          </Text>
          <Text style={styles.captureInfraction}>
            {item.infraction?.libelle || 'Infraction inconnue'}
          </Text>
          <View style={styles.captureMetaContainer}>
            {item.opj && (
              <Text style={styles.captureMeta}>
                OPJ: {typeof item.opj === 'string' ? item.opj : `${item.opj.prenom} ${item.opj.nom}`}
              </Text>
            )}
            {item.dateCaptureFormatted && (
              <Text style={styles.captureMeta}>{item.dateCaptureFormatted}</Text>
            )}
          </View>
          <View style={styles.validationBadge}>
            <MaterialIcons name="check-circle" size={14} color={COLORS.success} />
            <Text style={styles.validationText}>Validé</Text>
          </View>
        </View>
      </View>

      <View style={styles.captureActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.detailButton]}
          onPress={() => {
            setSelectedCapture(item);
            setDetailModalVisible(true);
          }}
        >
          <MaterialIcons name="info" size={18} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.commentButton]}
          onPress={() => {
            setSelectedCapture(item);
            setValidationModalVisible(true);
          }}
        >
          <MaterialIcons name="comment" size={18} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectCapture(item.id)}
        >
          <MaterialIcons name="close" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && captures.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Captures Validées</Text>
        <Text style={styles.headerSubtitle}>{captures.length} capture(s)</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une capture..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textLight}
        />
        {searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {filteredCaptures.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle-outline" size={60} color={COLORS.textLight} />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'Aucune capture validée trouvée' : 'Aucune capture validée'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCaptures}
          renderItem={renderCaptureItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Détails de la Capture</Text>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailModalBody}>
                {selectedCapture && (
                  <>
                    {selectedCapture.bandit?.photo && (
                      <Image
                        source={{ uri: selectedCapture.bandit.photo }}
                        style={styles.detailPhoto}
                        onError={() => console.log('Erreur photo')}
                      />
                    )}

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Bandit</Text>
                      <Text style={styles.detailValue}>
                        {selectedCapture.bandit?.prenom} {selectedCapture.bandit?.nom}
                      </Text>
                    </View>

                    {selectedCapture.infraction?.libelle && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Infraction</Text>
                        <Text style={styles.detailValue}>
                          {selectedCapture.infraction.libelle}
                        </Text>
                      </View>
                    )}

                    {selectedCapture.description && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Description</Text>
                        <Text style={styles.detailValue}>
                          {selectedCapture.description}
                        </Text>
                      </View>
                    )}

                    {selectedCapture.opj && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>OPJ</Text>
                        <Text style={styles.detailValue}>
                          {typeof selectedCapture.opj === 'string'
                            ? selectedCapture.opj
                            : `${selectedCapture.opj.prenom} ${selectedCapture.opj.nom}`}
                        </Text>
                      </View>
                    )}

                    {selectedCapture.dateCaptureFormatted && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Date de Capture</Text>
                        <Text style={styles.detailValue}>
                          {selectedCapture.dateCaptureFormatted}
                        </Text>
                      </View>
                    )}

                    {selectedCapture.lieuCapture && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Lieu</Text>
                        <Text style={styles.detailValue}>
                          {selectedCapture.lieuCapture}
                        </Text>
                      </View>
                    )}

                    {selectedCapture.commentaire && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Commentaire</Text>
                        <Text style={styles.detailValue}>
                          {selectedCapture.commentaire}
                        </Text>
                      </View>
                    )}

                    {selectedCapture.preuves && selectedCapture.preuves.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Preuves</Text>
                        <View style={styles.preuvesList}>
                          {selectedCapture.preuves.map((preuve: any, index: number) => {
                            // Déterminer le type de preuve
                            const fileType = preuve.type || preuve.mimeType || '';
                            const fileName = preuve.filename || preuve.name || `Preuve ${index + 1}`;
                            const isImage =
                              fileType.includes('image') ||
                              fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                            const isPDF =
                              fileType.includes('pdf') ||
                              fileName.match(/\.pdf$/i);
                            const isVideo =
                              fileType.includes('video') ||
                              fileName.match(/\.(mp4|avi|mov|mkv|flv|wmv)$/i);

                            return (
                              <View key={index} style={styles.preuveItem}>
                                <View style={styles.preuveIconContainer}>
                                  {isImage && (
                                    <>
                                      <MaterialIcons name="image" size={24} color={COLORS.primary} />
                                      {preuve.url || preuve.path ? (
                                        <Image
                                          source={{ uri: preuve.url || preuve.path }}
                                          style={styles.preuveImageThumbnail}
                                          onError={() => console.log('Erreur preuve')}
                                        />
                                      ) : null}
                                    </>
                                  )}
                                  {isPDF && (
                                    <MaterialIcons name="picture-as-pdf" size={24} color={COLORS.danger} />
                                  )}
                                  {isVideo && (
                                    <MaterialIcons name="videocam" size={24} color={COLORS.warning} />
                                  )}
                                  {!isImage && !isPDF && !isVideo && (
                                    <MaterialIcons name="attachment" size={24} color={COLORS.textLight} />
                                  )}
                                </View>

                                <View style={styles.preuveInfo}>
                                  <Text style={styles.preuveFileName}>{fileName}</Text>
                                  {preuve.description && (
                                    <Text style={styles.preuveDescription}>
                                      {preuve.description}
                                    </Text>
                                  )}
                                  <View style={styles.preuveTypeContainer}>
                                    {isImage && (
                                      <Text style={[styles.preuveType, styles.preuveTypeImage]}>
                                        📷 Photo
                                      </Text>
                                    )}
                                    {isPDF && (
                                      <Text style={[styles.preuveType, styles.preuveTypePDF]}>
                                        📄 PDF
                                      </Text>
                                    )}
                                    {isVideo && (
                                      <Text style={[styles.preuveType, styles.preuveTypeVideo]}>
                                        🎥 Vidéo
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              <View style={styles.detailModalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.closeButton]}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={validationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setValidationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.commentModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un Commentaire</Text>
                <TouchableOpacity onPress={() => setValidationModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.commentModalBody}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Entrez votre commentaire..."
                  multiline
                  numberOfLines={6}
                  value={validationComment}
                  onChangeText={setValidationComment}
                  placeholderTextColor={COLORS.textLight}
                />
              </ScrollView>

              <View style={styles.commentModalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setValidationModalVisible(false);
                    setValidationComment('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleAddComment}
                >
                  <Text style={styles.saveButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: COLORS.textDark,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  captureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginVertical: 6,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  captureContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  capturePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: COLORS.lightGray,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInfo: {
    flex: 1,
  },
  captureName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  captureInfraction: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  captureMetaContainer: {
    marginTop: 4,
  },
  captureMeta: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  validationText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  captureActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    borderRadius: 6,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailButton: {
    backgroundColor: COLORS.warning,
  },
  commentButton: {
    backgroundColor: COLORS.primary,
  },
  rejectButton: {
    backgroundColor: COLORS.danger,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    paddingTop: 16,
  },
  commentModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  detailModalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  detailModalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: COLORS.lightGray,
  },
  detailSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textDark,
    lineHeight: 20,
  },
  commentModalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    textAlignVertical: 'top',
    backgroundColor: COLORS.lightGray,
  },
  commentModalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  closeButton: {
    backgroundColor: COLORS.lightGray,
  },
  closeButtonText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelButtonText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  preuvesList: {
    marginTop: 12,
    gap: 12,
  },
  preuveItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  preuveIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preuveImageThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginTop: 8,
  },
  preuveInfo: {
    flex: 1,
  },
  preuveFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  preuveDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  preuveTypeContainer: {
    marginTop: 6,
  },
  preuveType: {
    fontSize: 11,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  preuveTypeImage: {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32',
  },
  preuveTypePDF: {
    backgroundColor: '#ffcccc',
    color: '#c62828',
  },
  preuveTypeVideo: {
    backgroundColor: '#ffe0b2',
    color: '#e65100',
  },
});

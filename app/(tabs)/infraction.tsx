import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { canManageInfractions } from '../../lib/auth/rolePermissions';

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

interface Infraction {
  id: number;
  libelle: string;
  description?: string;
  createdAt?: string;
  isApproved?: boolean;
  approvedBy?: {
    id: number;
    nom: string;
    prenom: string;
  };
  approvedAt?: string;
}

export default function InfractionScreen() {
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedInfraction, setSelectedInfraction] = useState<Infraction | null>(null);
  const [editingInfraction, setEditingInfraction] = useState<Infraction | null>(null);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    libelle: '',
    description: '',
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Charger les données utilisateur
      const userJson = await AsyncStorage.getItem('user');
      const userData = userJson ? JSON.parse(userJson) : null;
      setUser(userData);

      // Charger les infractions
      await loadInfractions();
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const getApiUrl = (endpoint: string) => {
    const baseUrl = 'http://72.61.97.77:8000';
    return `${baseUrl}${endpoint}`;
  };

  const loadInfractions = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const url = getApiUrl('/api/infractions');

      console.log('Chargement des infractions:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Infractions chargées:', data);

      const infractionsArray = Array.isArray(data) ? data : data.data || [];
      setInfractions(infractionsArray);
    } catch (error) {
      console.error('Erreur chargement infractions:', error);
      Alert.alert('Erreur', 'Impossible de charger les infractions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInfractions();
    setRefreshing(false);
  };

  const handleAddInfraction = () => {
    setEditingInfraction(null);
    setFormData({ libelle: '', description: '' });
    setModalVisible(true);
  };

  const handleEditInfraction = (infraction: Infraction) => {
    setDetailModalVisible(false);
    setEditingInfraction(infraction);
    setFormData({
      libelle: infraction.libelle,
      description: infraction.description || '',
    });
    setModalVisible(true);
  };

  const handleDeleteInfraction = (id: number) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cette infraction?',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(getApiUrl(`/api/infractions/${id}`), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert('Succès', 'Infraction supprimée');
                loadInfractions();
              } else {
                const errorData = await response.json();
                Alert.alert('Erreur', errorData.message || 'Impossible de supprimer l\'infraction');
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

  const handleApproveInfraction = (id: number) => {
    Alert.alert(
      'Approuver',
      'Êtes-vous sûr de vouloir approuver cette infraction?',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Approuver',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(
                getApiUrl(`/api/infractions/${id}/approve`),
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Succès', 'Infraction approuvée');
                loadInfractions();
              } else {
                Alert.alert('Erreur', 'Impossible d\'approuver l\'infraction');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Erreur de connexion');
            }
          },
        },
      ]
    );
  };

  const handleRejectInfraction = (id: number) => {
    Alert.alert(
      'Rejeter',
      'Êtes-vous sûr de vouloir rejeter cette infraction?',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Rejeter',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(
                getApiUrl(`/api/infractions/${id}/reject`),
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Succès', 'Infraction rejetée');
                loadInfractions();
              } else {
                Alert.alert('Erreur', 'Impossible de rejeter l\'infraction');
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

  const handleSaveInfraction = async () => {
    if (!formData.libelle.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le champ libellé');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const method = editingInfraction ? 'PUT' : 'POST';
      const url = editingInfraction
        ? getApiUrl(`/api/infractions/${editingInfraction.id}`)
        : getApiUrl('/api/infractions');

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert('Succès', editingInfraction ? 'Infraction modifiée' : 'Infraction créée');
        setModalVisible(false);
        loadInfractions();
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Erreur serveur');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion');
    }
  };

  const filteredInfractions = infractions.filter((infraction) =>
    `${infraction.libelle} ${infraction.description || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const renderInfractionItem = ({ item }: { item: Infraction }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedInfraction(item);
        setDetailModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.infractionCard}>
        <View style={styles.infractionContent}>
          <View style={styles.infractionIconContainer}>
            <MaterialIcons name="gavel" size={32} color={COLORS.primary} />
          </View>

          <View style={styles.infractionInfo}>
            <Text style={styles.infractionLibelle}>{item.libelle}</Text>
            {item.description && (
              <Text style={styles.infractionDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            {item.createdAt && (
              <Text style={styles.infractionMeta}>Créée: {item.createdAt}</Text>
            )}
          </View>

          <View style={styles.approvalBadgeContainer}>
            {item.isApproved ? (
              <View style={styles.approvedBadge}>
                <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                <Text style={styles.approvedText}>Approuvée</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <MaterialIcons name="schedule" size={20} color={COLORS.warning} />
                <Text style={styles.pendingText}>En attente</Text>
              </View>
            )}
          </View>
        </View>

        {item.isApproved && item.approvedBy && (
          <View style={styles.approvedByContainer}>
            <Text style={styles.approvedByText}>
              Approuvée par {item.approvedBy.prenom} {item.approvedBy.nom}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && infractions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion des Infractions</Text>
        <Text style={styles.headerSubtitle}>{infractions.length} infraction(s)</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une infraction..."
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

      {filteredInfractions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="warning-outline" size={60} color={COLORS.textLight} />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'Aucune infraction trouvée' : 'Aucune infraction enregistrée'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInfractions}
          renderItem={renderInfractionItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {canManageInfractions(user?.role || 'ROLE_OPJ') && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddInfraction}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Modal d'ajout/modification */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingInfraction ? 'Modifier l\'infraction' : 'Ajouter une infraction'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Libellé *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Vol à main armée"
                    value={formData.libelle}
                    onChangeText={(text) => setFormData({ ...formData, libelle: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textAreaInput]}
                    placeholder="Entrez la description détaillée..."
                    multiline
                    numberOfLines={5}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveInfraction}
                >
                  <Text style={styles.saveButtonText}>
                    {editingInfraction ? 'Modifier' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de détails */}
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
                <Text style={styles.modalTitle}>Détails de l'infraction</Text>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailModalBody}>
                {selectedInfraction && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Libellé</Text>
                      <Text style={styles.detailValue}>{selectedInfraction.libelle}</Text>
                    </View>

                    {selectedInfraction.description && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Description</Text>
                        <Text style={styles.detailValue}>
                          {selectedInfraction.description}
                        </Text>
                      </View>
                    )}

                    {selectedInfraction.createdAt && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Date de Création</Text>
                        <Text style={styles.detailValue}>
                          {selectedInfraction.createdAt}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Statut</Text>
                      <View style={styles.statusContainer}>
                        {selectedInfraction.isApproved ? (
                          <View style={styles.approvedStatus}>
                            <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                            <Text style={styles.approvedStatusText}>Approuvée</Text>
                          </View>
                        ) : (
                          <View style={styles.pendingStatus}>
                            <MaterialIcons name="schedule" size={20} color={COLORS.warning} />
                            <Text style={styles.pendingStatusText}>En attente d'approbation</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {selectedInfraction.isApproved && selectedInfraction.approvedBy && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Approuvée par</Text>
                        <Text style={styles.detailValue}>
                          {selectedInfraction.approvedBy.prenom}{' '}
                          {selectedInfraction.approvedBy.nom}
                        </Text>
                      </View>
                    )}

                    {selectedInfraction.approvedAt && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Date d'Approbation</Text>
                        <Text style={styles.detailValue}>
                          {selectedInfraction.approvedAt}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailActionsContainer}>
                      {canManageInfractions(user?.role || 'ROLE_OPJ') && (
                        <>
                          <TouchableOpacity
                            style={[styles.detailActionButton, styles.editDetailButton]}
                            onPress={() => handleEditInfraction(selectedInfraction)}
                          >
                            <MaterialIcons name="edit" size={18} color={COLORS.white} />
                            <Text style={styles.detailActionButtonText}>Modifier</Text>
                          </TouchableOpacity>

                          {!selectedInfraction.isApproved && (
                            <TouchableOpacity
                              style={[styles.detailActionButton, styles.approveDetailButton]}
                              onPress={() => handleApproveInfraction(selectedInfraction.id)}
                            >
                              <MaterialIcons name="check-circle" size={18} color={COLORS.white} />
                              <Text style={styles.detailActionButtonText}>Approuver</Text>
                            </TouchableOpacity>
                          )}

                          {selectedInfraction.isApproved && (
                            <TouchableOpacity
                              style={[styles.detailActionButton, styles.rejectDetailButton]}
                              onPress={() => handleRejectInfraction(selectedInfraction.id)}
                            >
                              <MaterialIcons name="close" size={18} color={COLORS.white} />
                              <Text style={styles.detailActionButtonText}>Rejeter</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={[styles.detailActionButton, styles.deleteDetailButton]}
                            onPress={() => {
                              setDetailModalVisible(false);
                              handleDeleteInfraction(selectedInfraction.id);
                            }}
                          >
                            <MaterialIcons name="delete" size={18} color={COLORS.white} />
                            <Text style={styles.detailActionButtonText}>Supprimer</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
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
    paddingBottom: 80,
  },
  infractionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infractionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infractionIconContainer: {
    marginRight: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infractionInfo: {
    flex: 1,
  },
  infractionLibelle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  infractionDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    lineHeight: 16,
  },
  infractionMeta: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  approvalBadgeContainer: {
    marginLeft: 8,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c8e6c9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  approvedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe0b2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.warning,
  },
  approvedByContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  approvedByText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '500',
    fontStyle: 'italic',
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
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    paddingTop: 16,
  },
  detailModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
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
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  detailModalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailModalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textDark,
  },
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
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
  closeButton: {
    backgroundColor: COLORS.lightGray,
  },
  closeButtonText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '600',
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
  statusContainer: {
    marginTop: 8,
  },
  approvedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c8e6c9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 8,
  },
  approvedStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe0b2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 8,
  },
  pendingStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.warning,
  },
  detailActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailActionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  editDetailButton: {
    backgroundColor: COLORS.primary,
  },
  approveDetailButton: {
    backgroundColor: COLORS.success,
  },
  rejectDetailButton: {
    backgroundColor: COLORS.warning,
  },
  deleteDetailButton: {
    backgroundColor: COLORS.danger,
  },
  detailActionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

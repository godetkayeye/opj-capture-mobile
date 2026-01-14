import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { canDeleteBandit, filterBanditsByRole } from '../../lib/auth/rolePermissions';
import {
  Bandit,
  FormData,
  handleCameraPhoto,
  handleDateChange,
  handleDeleteBandit,
  handlePickImage,
  handleSaveBandit,
  loadBandits,
  loadCaptures,
  loadInfractions,
  toggleInfraction,
} from '../../lib/bandit/bandit.logic';
import { COLORS, styles } from '../../lib/bandit/bandit.styles';

export default function BanditScreen() {
  const [bandits, setBandits] = useState<Bandit[]>([]);
  const [allBandits, setAllBandits] = useState<Bandit[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBandit, setSelectedBandit] = useState<Bandit | null>(null);
  const [editingBandit, setEditingBandit] = useState<Bandit | null>(null);
  const [infractions, setInfractions] = useState([]);
  const [selectedInfractions, setSelectedInfractions] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    surnom: '',
    dateNaissance: '',
    sexe: 'M',
    etat: 'Capturé',
    photo: '',
    infractions: [],
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setLoading(true);
    try {
      // Charger les données utilisateur
      const userJson = await AsyncStorage.getItem('user');
      const userData = userJson ? JSON.parse(userJson) : null;
      setUser(userData);

      console.log('📱 Données utilisateur:', userData);

      // Charger les bandits et infractions
      const [banditList, infractionList, captureList] = await Promise.all([
        loadBandits(),
        loadInfractions(),
        loadCaptures(),
      ]);

      console.log('🔍 Bandits reçus de l\'API:', banditList);
      console.log('📸 Captures reçues de l\'API:', captureList);

      // Stocker tous les bandits
      setAllBandits(banditList);

      // Appliquer le filtrage basé sur le rôle
      const role = userData?.role || 'ROLE_OPJ';
      const userId = userData?.id;

      console.log('🔐 Rôle utilisateur:', role);
      console.log('👤 ID utilisateur:', userId);

      const userCaptureIds = captureList
        .filter((capture: any) => {
          const isOwner = capture.responsable?.id === userId || 
                         capture.opj?.id === userId || 
                         capture.createdBy === userId;
          console.log(`📋 Capture ${capture.id} appartient à l'utilisateur?`, isOwner);
          return isOwner;
        })
        .map((capture: any) => capture.id);

      console.log('📌 IDs des captures de l\'utilisateur:', userCaptureIds);

      const filteredBandits = filterBanditsByRole(banditList, role, userId, userCaptureIds);
      
      console.log('✅ Bandits filtrés:', filteredBandits);

      setBandits(filteredBandits);
      setInfractions(infractionList);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [banditList, captureList] = await Promise.all([
        loadBandits(),
        loadCaptures(),
      ]);

      const role = user?.role || 'ROLE_OPJ';
      const userId = user?.id;
      const userCaptureIds = captureList
        .filter((capture: any) => {
          return capture.responsable?.id === userId || 
                 capture.opj?.id === userId || 
                 capture.createdBy === userId;
        })
        .map((capture: any) => capture.id);

      const filteredBandits = filterBanditsByRole(banditList, role, userId, userCaptureIds);
      setBandits(filteredBandits);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddBandit = () => {
    setEditingBandit(null);
    setSelectedInfractions([]);
    setFormData({
      nom: '',
      surnom: '',
      dateNaissance: '',
      sexe: 'M',
      etat: 'Capturé',
      photo: '',
      infractions: [],
    });
    setModalVisible(true);
  };

  const handleViewBanditDetail = (bandit: Bandit) => {
    setSelectedBandit(bandit);
    setDetailModalVisible(true);
  };

  const handleEditBandit = (bandit: Bandit) => {
    setDetailModalVisible(false);
    setEditingBandit(bandit);
    const infractionIds = bandit.infractions?.map((inf: any) => inf.id || inf) || [];
    setSelectedInfractions(infractionIds);
    setFormData({
      nom: bandit.nom,
      surnom: bandit.surnom || '',
      dateNaissance: bandit.dateNaissance || '',
      sexe: bandit.sexe || '',
      etat: bandit.etat || '',
      photo: bandit.photo || '',
      infractions: infractionIds,
    });
    setModalVisible(true);
  };

  const handleDeleteBanditLocal = (id: number) => {
    handleDeleteBandit(id, async () => {
      const banditList = await loadBandits();
      setBandits(banditList);
    });
  };

  const handlePhotoPickLocal = async () => {
    const base64 = await handlePickImage();
    if (base64) {
      setFormData({ ...formData, photo: base64 });
    }
  };

  const handleCameraLocal = async () => {
    const base64 = await handleCameraPhoto();
    if (base64) {
      setFormData({ ...formData, photo: base64 });
    }
  };

  const handleToggleInfraction = (infractionId: number) => {
    setSelectedInfractions(toggleInfraction(infractionId, selectedInfractions));
  };

  const handleDateChangeLocal = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const formattedDate = handleDateChange(selectedDate);
      setFormData({ ...formData, dateNaissance: formattedDate });
      if (Platform.OS === 'android') {
        setShowDatePicker(false);
      }
    }
  };

  const handleSaveBanditLocal = async () => {
    const success = await handleSaveBandit(formData, selectedInfractions, editingBandit);
    if (success) {
      setModalVisible(false);
      const banditList = await loadBandits();
      setBandits(banditList);
    }
  };

  const filteredBandits = bandits.filter((bandit) =>
    `${bandit.nom} ${bandit.surnom || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const renderBanditItem = ({ item }: { item: Bandit }) => (
    <View style={styles.banditCard}>
      <View style={styles.banditContent}>
        {item.photo && (
          <Image
            source={{ uri: item.photo }}
            style={styles.banditPhoto}
            onError={() => console.log('Error loading photo')}
          />
        )}
        {!item.photo && (
          <View style={[styles.banditPhoto, styles.photoPlaceholder]}>
            <MaterialIcons name="person" size={40} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.banditInfo}>
          <Text style={styles.banditName}>{item.nom}</Text>
          {item.surnom && <Text style={styles.banditSurnom}>{item.surnom}</Text>}
          {item.etat && <Text style={styles.banditEtat}>{item.etat}</Text>}
          {item.dateAjout && (
            <Text style={styles.banditDate}>
              Ajouté: {new Date(item.dateAjout).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.banditActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.detailButton]}
          onPress={() => handleViewBanditDetail(item)}
        >
          <MaterialIcons name="info" size={18} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditBandit(item)}
        >
          <MaterialIcons name="edit" size={18} color={COLORS.white} />
        </TouchableOpacity>
        {canDeleteBandit(item, user?.role || 'ROLE_OPJ', user?.id) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteBanditLocal(item.id)}
          >
            <MaterialIcons name="delete" size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading && bandits.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion des Bandits</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bandit..."
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

      {filteredBandits.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="people-outline" size={60} color={COLORS.textLight} />
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'No bandit found' : 'No bandits registered'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBandits}
          renderItem={renderBanditItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <TouchableOpacity
        style={styles.fabButton}
        onPress={handleAddBandit}
        activeOpacity={0.7}
      >
        <MaterialIcons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (showDatePicker) {
            setShowDatePicker(false);
          } else {
            setModalVisible(false);
          }
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingBandit ? 'Modifier un bandit' : 'Ajouter un bandit'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              {!showDatePicker ? (
                <ScrollView style={styles.modalBody}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Photo</Text>
                    <View style={styles.photoContainer}>
                      {formData.photo ? (
                        <Image
                          source={{ uri: formData.photo }}
                          style={styles.photoPreview}
                        />
                      ) : (
                        <View style={[styles.photoPreview, styles.photoPlaceholder]}>
                          <MaterialIcons name="photo-camera" size={40} color={COLORS.primary} />
                        </View>
                      )}
                      <View style={styles.photoButtonsContainer}>
                        <TouchableOpacity
                          style={[styles.photoButton, styles.cameraButton]}
                          onPress={handleCameraLocal}
                        >
                          <MaterialIcons name="camera-alt" size={18} color={COLORS.white} />
                          <Text style={styles.photoButtonText}>Caméra</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.photoButton, styles.galleryButton]}
                          onPress={handlePhotoPickLocal}
                        >
                          <MaterialIcons name="image" size={18} color={COLORS.white} />
                          <Text style={styles.photoButtonText}>Galerie</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Nom *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nom"
                      value={formData.nom}
                      onChangeText={(text) => setFormData({ ...formData, nom: text })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Surnom</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Surnom (optionnel)"
                      value={formData.surnom}
                      onChangeText={(text) => setFormData({ ...formData, surnom: text })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Statut</Text>
                    <View style={styles.stateContainer}>
                      {['Capturé', 'Transféré', 'Libéré'].map((etat) => (
                        <TouchableOpacity
                          key={etat}
                          style={[
                            styles.stateButton,
                            formData.etat === etat && styles.stateButtonActive,
                          ]}
                          onPress={() => setFormData({ ...formData, etat })}
                        >
                          <Text
                            style={[
                              styles.stateButtonText,
                              formData.etat === etat && styles.stateButtonTextActive,
                            ]}
                          >
                            {etat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Date de naissance</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
                      <Text style={styles.dateInputText}>
                        {formData.dateNaissance
                          ? new Date(formData.dateNaissance).toLocaleDateString('en-US')
                          : 'Select date'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Genre</Text>
                    <View style={styles.sexeContainer}>
                      {[
                        { label: 'Male', value: 'M' },
                        { label: 'Female', value: 'F' },
                      ].map(({ label, value }) => (
                        <TouchableOpacity
                          key={value}
                          style={[
                            styles.sexeButton,
                            formData.sexe === value && styles.sexeButtonActive,
                          ]}
                          onPress={() => setFormData({ ...formData, sexe: value })}
                        >
                          <MaterialIcons
                            name={value === 'M' ? 'male' : 'female'}
                            size={20}
                            color={formData.sexe === value ? COLORS.white : COLORS.primary}
                          />
                          <Text
                            style={[
                              styles.sexeButtonText,
                              formData.sexe === value && styles.sexeButtonTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Infractions</Text>
                    <Text style={styles.infractionNote}>Sélectionner les infractions associées</Text>
                    <View style={styles.infractionList}>
                      {infractions.map((infraction: any) => (
                        <TouchableOpacity
                          key={infraction.id}
                          style={[
                            styles.infractionItem,
                            selectedInfractions.includes(infraction.id) &&
                              styles.infractionItemActive,
                          ]}
                          onPress={() => handleToggleInfraction(infraction.id)}
                        >
                          <View style={styles.infractionCheckbox}>
                            {selectedInfractions.includes(infraction.id) && (
                              <MaterialIcons name="check" size={16} color={COLORS.white} />
                            )}
                          </View>
                          <View style={styles.infractionContent}>
                            <Text style={styles.infractionTitle}>{infraction.libelle}</Text>
                            {infraction.description && (
                              <Text style={styles.infractionDescription} numberOfLines={2}>
                                {infraction.description}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.datePickerView}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerHeaderButton}>Annuler</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>Sélectionner la date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerHeaderButton}>OK</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.datePickerContent}>
                    <DateTimePicker
                      value={formData.dateNaissance ? new Date(formData.dateNaissance) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                      onChange={handleDateChangeLocal}
                      textColor={COLORS.textDark}
                    />
                  </View>
                </View>
              )}

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveBanditLocal}
                >
                  <Text style={styles.saveButtonText}>
                    {editingBandit ? 'Modifier' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
                <Text style={styles.modalTitle}>Détails du Bandit</Text>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailModalBody}>
                {selectedBandit && (
                  <>
                    <View style={styles.detailPhotoContainer}>
                      <TouchableOpacity
                        onPress={() => selectedBandit.photo && setPhotoModalVisible(true)}
                        disabled={!selectedBandit.photo}
                      >
                        {selectedBandit.photo ? (
                          <Image
                            source={{ uri: selectedBandit.photo }}
                            style={styles.detailPhoto}
                            onError={() => console.log('Error loading photo')}
                          />
                        ) : (
                          <View style={[styles.detailPhoto, styles.photoPlaceholder]}>
                            <MaterialIcons name="person" size={60} color={COLORS.primary} />
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Nom</Text>
                      <Text style={styles.detailValue}>{selectedBandit.nom}</Text>
                    </View>

                    {selectedBandit.surnom && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Surnom</Text>
                        <Text style={styles.detailValue}>{selectedBandit.surnom}</Text>
                      </View>
                    )}

                    {selectedBandit.dateNaissance && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Date de naissance</Text>
                        <Text style={styles.detailValue}>
                          {new Date(selectedBandit.dateNaissance).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                    )}

                    {selectedBandit.sexe && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Genre</Text>
                        <View style={styles.sexeValueContainer}>
                          <MaterialIcons
                            name={selectedBandit.sexe === 'M' ? 'male' : 'female'}
                            size={18}
                            color={COLORS.primary}
                          />
                          <Text style={styles.detailValue}>
                            {selectedBandit.sexe === 'M' ? 'Masculin' : 'Féminin'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedBandit.etat && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Statut</Text>
                        <View style={styles.etatBadgeContainer}>
                          <Text
                            style={[
                              styles.etatBadge,
                              selectedBandit.etat === 'Capturé' && styles.etatCapture,
                              selectedBandit.etat === 'Transféré' && styles.etatTransfert,
                              selectedBandit.etat === 'Libéré' && styles.etatLibere,
                            ]}
                          >
                            {selectedBandit.etat}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedBandit.infractions && selectedBandit.infractions.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Infractions Associées</Text>
                        <View style={styles.infractionDetailList}>
                          {selectedBandit.infractions.map((infraction: any, index: number) => (
                            <View key={index} style={styles.infractionDetailItem}>
                              <MaterialIcons name="warning" size={16} color={COLORS.danger} />
                              <View style={styles.infractionDetailContent}>
                                <Text style={styles.infractionDetailTitle}>
                                  {infraction.libelle || infraction}
                                </Text>
                                {infraction.description && (
                                  <Text style={styles.infractionDetailDesc}>
                                    {infraction.description}
                                  </Text>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedBandit.dateAjout && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Date d'ajout</Text>
                        <Text style={styles.detailValue}>
                          {new Date(selectedBandit.dateAjout).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailActionsContainer}>
                      <TouchableOpacity
                        style={[styles.detailActionButton, styles.editDetailButton]}
                        onPress={() => handleEditBandit(selectedBandit)}
                      >
                        <MaterialIcons name="edit" size={18} color={COLORS.white} />
                        <Text style={styles.detailActionButtonText}>Modifier</Text>
                      </TouchableOpacity>
                      {canDeleteBandit(selectedBandit, user?.role || 'ROLE_OPJ', user?.id) && (
                        <TouchableOpacity
                          style={[styles.detailActionButton, styles.deleteDetailButton]}
                          onPress={() => {
                            setDetailModalVisible(false);
                            handleDeleteBanditLocal(selectedBandit.id);
                          }}
                        >
                          <MaterialIcons name="delete" size={18} color={COLORS.white} />
                          <Text style={styles.detailActionButtonText}>Supprimer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.detailModalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.photoViewerContainer}>
          <TouchableOpacity
            style={styles.photoViewerCloseButton}
            onPress={() => setPhotoModalVisible(false)}
          >
            <MaterialIcons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>

          {selectedBandit?.photo && (
            <Image
              source={{ uri: selectedBandit.photo }}
              style={styles.photoViewerImage}
              resizeMode="contain"
            />
          )}

          <View style={styles.photoViewerInfo}>
            <Text style={styles.photoViewerName}>{selectedBandit?.nom}</Text>
            {selectedBandit?.surnom && (
              <Text style={styles.photoViewerSurnom}>{selectedBandit.surnom}</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

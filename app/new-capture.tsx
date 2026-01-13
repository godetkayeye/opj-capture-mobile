import { getApiUrl } from '@/src/api/config';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Bandit {
  id: number;
  nom: string;
  prenom?: string;
  surnom?: string;
  photo?: string;
}

interface Infraction {
  id: number;
  libelle: string;
  code?: string;
}

export default function NewCaptureScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [banditId, setBanditId] = useState('');
  const [infractionId, setInfractionId] = useState('');
  const [bandits, setBandits] = useState<Bandit[]>([]);
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [showBanditPicker, setShowBanditPicker] = useState(false);
  const [showInfractionPicker, setShowInfractionPicker] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationType, setLocationType] = useState<'gps' | 'address'>('gps');

  React.useEffect(() => {
    loadBanditsAndInfractions();
    // Ne pas demander la permission au démarrage - attendre que l'utilisateur clique
    // requestLocationPermission();
    requestMediaPermissions();
  }, []);

  const requestMediaPermissions = async () => {
    try {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus.status !== 'granted' || mediaLibraryStatus.status !== 'granted') {
        Alert.alert('Permissions', 'Les permissions pour la caméra et la galerie sont nécessaires');
      }
    } catch (err) {
      console.error('Erreur permissions:', err);
    }
  };

  const loadBanditsAndInfractions = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      console.log('Token disponible:', token ? 'OUI' : 'NON');
      
      if (!token) {
        Alert.alert('Erreur d\'authentification', 'Veuillez vous reconnecter.');
        return;
      }

      const [banditsRes, infractionsRes] = await Promise.all([
        fetch(getApiUrl('/api/bandits'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl('/api/infractions'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      console.log('Réponse bandits:', banditsRes.status);
      console.log('Réponse infractions:', infractionsRes.status);

      if (banditsRes.ok) {
        const banditsData = await banditsRes.json();
        console.log('Bandits chargés:', banditsData);
        setBandits(banditsData['hydra:member'] || banditsData);
      } else {
        console.error('Erreur bandits:', banditsRes.status);
      }

      if (infractionsRes.ok) {
        const infractionsData = await infractionsRes.json();
        console.log('Infractions chargées:', infractionsData);
        setInfractions(infractionsData['hydra:member'] || infractionsData);
      } else {
        console.error('Erreur infractions:', infractionsRes.status);
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
      Alert.alert('Erreur de connexion', 'Impossible de charger les données. Vérifiez votre connexion et votre authentification.');
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la localisation pour utiliser le GPS');
      }
    } catch (err) {
      console.error('Erreur permission localisation:', err);
      Alert.alert('Erreur', 'Impossible de demander la permission de localisation');
    }
  };

  const getCurrentLocation = async () => {
    try {
      Alert.alert('Localisation', 'Récupération de votre position...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation.coords);
      Alert.alert('Succès', `Position obtenue: ${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}`);
    } catch (err) {
      console.error('Erreur localisation:', err);
      Alert.alert('Erreur', 'Impossible de récupérer votre position. Vérifiez que le GPS est activé.');
    }
  };

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Erreur caméra:', err);
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Erreur galerie:', err);
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!image) {
      Alert.alert('Erreur', 'Veuillez ajouter une photo');
      return;
    }
    if (!banditId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un bandit');
      return;
    }
    if (!infractionId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une infraction');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter une description');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Erreur', 'Token d\'authentification manquant. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      // Convertir l'image en base64
      console.log('Conversion de l\'image en base64...');
      const imageBase64 = await fetch(image.uri)
        .then(response => response.blob())
        .then(blob => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Extraire la partie base64
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });

      console.log('Image convertie, taille:', imageBase64.length, 'bytes');

      // Construire l'objet à envoyer
      const captureData: any = {
        description: description,
        bandit: banditId,
        infraction: infractionId,
        photo: `data:image/jpeg;base64,${imageBase64}`,
      };

      // Ajouter la localisation
      if (locationType === 'gps' && location) {
        captureData.latitude = location.latitude;
        captureData.longitude = location.longitude;
      } else if (locationType === 'address' && address.trim()) {
        captureData.lieuCapture = address;
      }

      console.log('Envoi de la capture au serveur...');
      const url = getApiUrl('/api/captures');
      console.log('URL:', url);
      console.log('Données:', JSON.stringify(captureData, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(captureData),
      });

      console.log('Réponse status:', response.status);
      const responseText = await response.text();
      console.log('Réponse brute:', responseText);

      if (response.ok) {
        Alert.alert('Succès', 'Capture créée avec succès', [
          {
            text: 'OK',
            onPress: () => {
              setImage(null);
              setDescription('');
              setBanditId('');
              setInfractionId('');
              setAddress('');
              setLocation(null);
              router.back();
            },
          },
        ]);
      } else {
        try {
          const errorData = JSON.parse(responseText);
          Alert.alert('Erreur', errorData.message || `Erreur ${response.status}`);
        } catch {
          Alert.alert('Erreur', `Erreur serveur: ${response.status}\n${responseText}`);
        }
      }
    } catch (err: any) {
      console.error('Erreur submission:', err);
      Alert.alert('Erreur de connexion', err.message || 'Impossible de se connecter au serveur.\n\nVérifiez:\n- La connexion réseau\n- L\'URL du serveur\n- Les permissions réseau');
    } finally {
      setLoading(false);
    }
  };

  const selectedBandit = bandits.find((b) => b.id === parseInt(banditId));
  const selectedInfraction = infractions.find((i) => i.id === parseInt(infractionId));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0066cc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Capture</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {/* Photo Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="camera-alt" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Photo du suspect</Text>
          </View>

          {image ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImage(null)}
              >
                <MaterialIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="image-not-supported" size={48} color="#cbd5e1" />
              <Text style={styles.placeholderText}>Aucune photo</Text>
            </View>
          )}

          <View style={styles.photoButtonsGroup}>
            <TouchableOpacity
              style={[styles.photoBtn, styles.cameraBtnStyle]}
              onPress={takePicture}
              disabled={loading}
            >
              <MaterialIcons name="camera-alt" size={18} color="#fff" />
              <Text style={styles.photoBtnText}>Caméra</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoBtn, styles.galleryBtnStyle]}
              onPress={pickImage}
              disabled={loading}
            >
              <MaterialIcons name="photo-library" size={18} color="#0066cc" />
              <Text style={[styles.photoBtnText, { color: '#0066cc' }]}>
                Galerie
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bandit Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Suspect</Text>
          </View>

          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowBanditPicker(true)}
            disabled={loading}
          >
            <Text
              style={[
                styles.selectInputText,
                !banditId && styles.selectInputPlaceholder,
              ]}
            >
              {selectedBandit
                ? `${selectedBandit.nom} ${selectedBandit.surnom ? `(${selectedBandit.surnom})` : ''}`
                : 'Sélectionner un suspect'}
            </Text>
            <MaterialIcons name="expand-more" size={20} color="#0066cc" />
          </TouchableOpacity>
        </View>

        {/* Infraction Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="warning" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Infraction</Text>
          </View>

          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowInfractionPicker(true)}
            disabled={loading}
          >
            <Text
              style={[
                styles.selectInputText,
                !infractionId && styles.selectInputPlaceholder,
              ]}
            >
              {selectedInfraction
                ? selectedInfraction.libelle
                : 'Sélectionner une infraction'}
            </Text>
            <MaterialIcons name="expand-more" size={20} color="#0066cc" />
          </TouchableOpacity>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="description" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Détails</Text>
          </View>

          <TextInput
            style={styles.textarea}
            placeholder="Décrivez les circonstances et détails importants..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            editable={!loading}
          />
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="location-on" size={20} color="#0066cc" />
            <Text style={styles.sectionTitle}>Localisation</Text>
          </View>

          <View style={styles.locationOptions}>
            <TouchableOpacity
              style={[
                styles.locationOption,
                locationType === 'gps' && styles.locationOptionActive,
              ]}
              onPress={async () => {
                setLocationType('gps');
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status === 'granted') {
                  getCurrentLocation();
                } else {
                  requestLocationPermission();
                }
              }}
              disabled={loading}
            >
              <MaterialIcons
                name="my-location"
                size={18}
                color={locationType === 'gps' ? '#fff' : '#0066cc'}
              />
              <Text
                style={[
                  styles.locationOptionText,
                  locationType === 'gps' && styles.locationOptionTextActive,
                ]}
              >
                GPS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationOption,
                locationType === 'address' && styles.locationOptionActive,
              ]}
              onPress={() => setLocationType('address')}
              disabled={loading}
            >
              <MaterialIcons
                name="place"
                size={18}
                color={locationType === 'address' ? '#fff' : '#0066cc'}
              />
              <Text
                style={[
                  styles.locationOptionText,
                  locationType === 'address' && styles.locationOptionTextActive,
                ]}
              >
                Adresse
              </Text>
            </TouchableOpacity>
          </View>

          {locationType === 'gps' && location && (
            <View style={styles.locationInfo}>
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text style={styles.locationInfoText}>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          {locationType === 'address' && (
            <TextInput
              style={styles.addressInput}
              placeholder="Ex: Avenue Kikwit, Kinshasa"
              placeholderTextColor="#94a3b8"
              value={address}
              onChangeText={setAddress}
              editable={!loading}
            />
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Enregistrer la capture</Text>
            </>
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bandit Picker Modal */}
      <Modal
        visible={showBanditPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBanditPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un suspect</Text>
            <TouchableOpacity onPress={() => setShowBanditPicker(false)}>
              <MaterialIcons name="close" size={24} color="#0066cc" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={bandits}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setBanditId(item.id.toString());
                  setShowBanditPicker(false);
                }}
              >
                <View style={styles.modalItemContent}>
                  {item.photo && (
                    <Image
                      source={{ uri: item.photo }}
                      style={styles.modalItemImage}
                    />
                  )}
                  <View style={styles.modalItemText}>
                    <Text style={styles.modalItemName}>{item.nom}</Text>
                    {item.surnom && (
                      <Text style={styles.modalItemSubtext}>{item.surnom}</Text>
                    )}
                  </View>
                </View>
                {banditId === item.id.toString() && (
                  <MaterialIcons name="check" size={20} color="#0066cc" />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Infraction Picker Modal */}
      <Modal
        visible={showInfractionPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfractionPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner une infraction</Text>
            <TouchableOpacity onPress={() => setShowInfractionPicker(false)}>
              <MaterialIcons name="close" size={24} color="#0066cc" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={infractions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setInfractionId(item.id.toString());
                  setShowInfractionPicker(false);
                }}
              >
                <View style={styles.modalItemContent}>
                  <View style={styles.modalItemText}>
                    <Text style={styles.modalItemName}>{item.libelle}</Text>
                    {item.code && (
                      <Text style={styles.modalItemSubtext}>{item.code}</Text>
                    )}
                  </View>
                </View>
                {infractionId === item.id.toString() && (
                  <MaterialIcons name="check" size={20} color="#0066cc" />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066cc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
  },
  imagePreview: {
    position: 'relative',
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  photoButtonsGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cameraBtnStyle: {
    backgroundColor: '#0066cc',
  },
  galleryBtnStyle: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  photoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectInputText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  selectInputPlaceholder: {
    color: '#94a3b8',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1e293b',
    textAlignVertical: 'top',
    backgroundColor: '#f8fafc',
  },
  locationOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  locationOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  locationOptionActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  locationOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066cc',
  },
  locationOptionTextActive: {
    color: '#fff',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  locationInfoText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '500',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0066cc',
    marginBottom: 20,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginVertical: 0,
  },
  modalItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  modalItemText: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalItemSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});

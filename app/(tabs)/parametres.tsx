import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  matricule: string;
  role: string;
}

export default function ParametresScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [serverUrlModalVisible, setServerUrlModalVisible] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://72.61.97.77:8000');

  useEffect(() => {
    loadUserInfo();
    loadSettings();
  }, []);

  const getApiUrl = (endpoint: string) => {
    return `${serverUrl}${endpoint}`;
  };

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const notifs = await AsyncStorage.getItem('notifications_enabled');
      const location = await AsyncStorage.getItem('location_enabled');
      const offline = await AsyncStorage.getItem('offline_mode');
      const url = await AsyncStorage.getItem('server_url');

      if (notifs !== null) setNotifications(notifs === 'true');
      if (location !== null) setLocationEnabled(location === 'true');
      if (offline !== null) setOfflineMode(offline === 'true');
      if (url !== null) setServerUrl(url);
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const saveSettings = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (error) {
      console.error('Erreur sauvegarde paramètre:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        getApiUrl('/api/user/change-password'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      if (response.ok) {
        Alert.alert('Succès', 'Mot de passe modifié avec succès');
        setChangePasswordModalVisible(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Impossible de modifier le mot de passe');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion');
    }
  };

  const handleSaveServerUrl = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une URL valide');
      return;
    }

    await saveSettings('server_url', serverUrl);
    Alert.alert('Succès', 'URL du serveur mise à jour');
    setServerUrlModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter?',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Déconnecter',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              router.replace('/login');
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la déconnexion');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Vider le cache',
      'Cela supprimera tous les fichiers temporaires stockés localement.',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Vider',
          onPress: async () => {
            try {
              // Vous pouvez ajouter ici la logique de nettoyage du cache
              Alert.alert('Succès', 'Cache vidé avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors du nettoyage du cache');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Section Profil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil Utilisateur</Text>

          <View style={styles.profileCard}>
            <View style={styles.profileIconContainer}>
              <MaterialIcons name="account-circle" size={60} color={COLORS.primary} />
            </View>

            {user && (
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user.prenom} {user.nom}
                </Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
                <View style={styles.profileDetailsContainer}>
                  <View style={styles.profileDetail}>
                    <Text style={styles.profileDetailLabel}>Rôle</Text>
                    <Text style={styles.profileDetailValue}>{user.role}</Text>
                  </View>
                  <View style={styles.profileDetail}>
                    <Text style={styles.profileDetailLabel}>Matricule</Text>
                    <Text style={styles.profileDetailValue}>{user.matricule}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Section Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setChangePasswordModalVisible(true)}
          >
            <View style={styles.settingIconContainer}>
              <MaterialIcons name="lock" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Changer le mot de passe</Text>
              <Text style={styles.settingDescription}>
                Modifiez votre mot de passe de sécurité
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Section Paramètres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres Application</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialIcons name="notifications" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                {notifications ? 'Activées' : 'Désactivées'}
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={(value) => {
                setNotifications(value);
                saveSettings('notifications_enabled', value);
              }}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialIcons name="location-on" size={24} color={COLORS.danger} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Localisation</Text>
              <Text style={styles.settingDescription}>
                {locationEnabled ? 'Activée' : 'Désactivée'}
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={(value) => {
                setLocationEnabled(value);
                saveSettings('location_enabled', value);
              }}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <MaterialIcons name="cloud-off" size={24} color={COLORS.warning} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Mode Hors-ligne</Text>
              <Text style={styles.settingDescription}>
                {offlineMode ? 'Activé' : 'Désactivé'}
              </Text>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={(value) => {
                setOfflineMode(value);
                saveSettings('offline_mode', value);
              }}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Section Serveur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration Serveur</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setServerUrlModalVisible(true)}
          >
            <View style={styles.settingIconContainer}>
              <MaterialIcons name="dns" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>URL du Serveur</Text>
              <Text style={styles.settingDescription} numberOfLines={1}>
                {serverUrl}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Section Stockage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stockage</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearCache}
          >
            <View style={styles.settingIconContainer}>
              <MaterialIcons name="delete-outline" size={24} color={COLORS.danger} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Vider le cache</Text>
              <Text style={styles.settingDescription}>
                Supprime les fichiers temporaires
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Section À propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Développeur</Text>
            <Text style={styles.aboutValue}>Ir. Godfrey Kay</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Email</Text>
            <Text style={styles.aboutValue}>godetkayeye07@gmail.com</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Dernière mise à jour</Text>
            <Text style={styles.aboutValue}>13 Jan 2026</Text>
          </View>
        </View>

        {/* Bouton Déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color={COLORS.white} />
          <Text style={styles.logoutButtonText}>Se Déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Changer le mot de passe */}
      <Modal
        visible={changePasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Changer le mot de passe</Text>
                <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Mot de passe actuel</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Entrez votre mot de passe actuel"
                    secureTextEntry
                    value={passwordData.currentPassword}
                    onChangeText={(text) =>
                      setPasswordData({ ...passwordData, currentPassword: text })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nouveau mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Entrez votre nouveau mot de passe"
                    secureTextEntry
                    value={passwordData.newPassword}
                    onChangeText={(text) =>
                      setPasswordData({ ...passwordData, newPassword: text })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirmer le mot de passe</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmez votre nouveau mot de passe"
                    secureTextEntry
                    value={passwordData.confirmPassword}
                    onChangeText={(text) =>
                      setPasswordData({ ...passwordData, confirmPassword: text })
                    }
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setChangePasswordModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.saveButtonText}>Modifier</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal URL Serveur */}
      <Modal
        visible={serverUrlModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setServerUrlModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>URL du Serveur</Text>
                <TouchableOpacity onPress={() => setServerUrlModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Adresse URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: http://72.61.97.77:8000"
                    value={serverUrl}
                    onChangeText={setServerUrl}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setServerUrlModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveServerUrl}
                >
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
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
  content: {
    padding: 12,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
    marginLeft: 4,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileIconContainer: {
    marginBottom: 12,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  profileDetailsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    width: '100%',
    gap: 12,
  },
  profileDetail: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  profileDetailLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  profileDetailValue: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: 'bold',
    marginTop: 4,
  },
  settingItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  settingIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  aboutItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  aboutValue: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
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
    maxHeight: '80%',
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
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
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
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
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
});

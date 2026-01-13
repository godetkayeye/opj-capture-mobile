import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface Bandit {
  id: number;
  nom: string;
  surnom?: string;
  photo?: string;
  dateAjout?: string;
  dateNaissance?: string;
  sexe?: string;
  etat?: string;
  infractions?: any[];
}

export interface FormData {
  nom: string;
  surnom: string;
  dateNaissance: string;
  sexe: string;
  etat: string;
  photo: string;
  infractions: number[];
}

const BASE_URL = 'http://72.61.97.77:8000';

export const getApiUrl = (endpoint: string) => {
  return `${BASE_URL}${endpoint}`;
};

export const loadBandits = async (url?: string) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const endpoint = url || '/api/bandits';
    const fullUrl = getApiUrl(endpoint);

    console.log('Chargement des bandits depuis:', fullUrl);

    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('Bandits chargés:', data);

    // Gérer les formats de réponse différents
    const banditList = Array.isArray(data) ? data : data.data || data.bandits || [];
    return banditList;
  } catch (error) {
    console.error('Erreur chargement bandits:', error);
    Alert.alert('Erreur', 'Impossible de charger les bandits');
    return [];
  }
};

export const loadInfractions = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(getApiUrl('/api/infractions'), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const infractionList = Array.isArray(data) ? data : data.data || data.infractions || [];
      return infractionList;
    }
    return [];
  } catch (error) {
    console.error('Erreur chargement infractions:', error);
    return [];
  }
};

export const handleDeleteBandit = (id: number, callback: () => void) => {
  Alert.alert(
    'Supprimer',
    'Êtes-vous sûr de vouloir supprimer ce bandit?',
    [
      { text: 'Annuler', onPress: () => {} },
      {
        text: 'Supprimer',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(getApiUrl(`/api/bandits/${id}`), {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              Alert.alert('Succès', 'Bandit supprimé');
              callback();
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer le bandit');
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

export const handlePickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    }
    return '';
  } catch (error) {
    console.error('Erreur sélection photo:', error);
    Alert.alert('Erreur', 'Impossible de sélectionner la photo');
    return '';
  }
};

export const handleCameraPhoto = async () => {
  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    }
    return '';
  } catch (error) {
    console.error('Erreur capture photo:', error);
    Alert.alert('Erreur', 'Impossible de prendre une photo');
    return '';
  }
};

export const toggleInfraction = (
  infractionId: number,
  selectedInfractions: number[]
): number[] => {
  if (selectedInfractions.includes(infractionId)) {
    return selectedInfractions.filter((id) => id !== infractionId);
  } else {
    return [...selectedInfractions, infractionId];
  }
};

export const getSexeLabel = (sexeValue: string) => {
  if (sexeValue === 'M') return 'Masculin';
  if (sexeValue === 'F') return 'Féminin';
  return '';
};

export const getSexeValue = (label: string) => {
  if (label === 'Masculin') return 'M';
  if (label === 'Féminin') return 'F';
  return 'M';
};

export const handleDateChange = (selectedDate: Date | undefined): string => {
  if (selectedDate) {
    return selectedDate.toISOString().split('T')[0];
  }
  return '';
};

export const handleSaveBandit = async (
  formData: FormData,
  selectedInfractions: number[],
  editingBandit: Bandit | null
) => {
  if (!formData.nom.trim()) {
    Alert.alert('Erreur', 'Veuillez remplir le champ Nom');
    return false;
  }

  try {
    const token = await AsyncStorage.getItem('token');
    const method = editingBandit ? 'PUT' : 'POST';
    const url = editingBandit
      ? getApiUrl(`/api/bandits/${editingBandit.id}`)
      : getApiUrl('/api/bandits');

    const dataToSend = {
      ...formData,
      infractions: selectedInfractions,
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    if (response.ok) {
      Alert.alert('Succès', editingBandit ? 'Bandit modifié' : 'Bandit créé');
      return true;
    } else {
      const errorText = await response.text();
      console.error('Erreur réponse:', response.status, errorText);
      Alert.alert('Erreur', `Erreur ${response.status}: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('Erreur connexion:', error);
    Alert.alert('Erreur', `Erreur de connexion: ${error}`);
    return false;
  }
};

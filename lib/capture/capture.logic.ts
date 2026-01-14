import { getApiUrl } from '@/src/api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface User {
  id: number;
  role: string;
}

export interface Capture {
  id: number;
  bandit: {
    id: number;
    nom: string;
    prenom?: string;
    surnom?: string;
    photo?: string;
  };
  opj: {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
  };
  dateCapture: string;
  dateCaptureFormatted: string;
  lieuCapture: string;
  status: string;
  commentaire?: string;
  validation?: {
    id: number;
    statut: string;
    remarque: string;
    dateValidation: string;
  };
  preuves: any[];
  createdAt: string;
}

export const loadUserData = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (err) {
    console.error('Erreur lors du chargement utilisateur:', err);
    return null;
  }
};

export const loadCaptures = async (pageNum: number): Promise<Capture[]> => {
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
      return capturesData;
    } else {
      if (pageNum === 1) {
        Alert.alert('Erreur', 'Impossible de charger les captures');
      }
      return [];
    }
  } catch (err) {
    console.error('Erreur lors du chargement des captures:', err);
    if (pageNum === 1) {
      Alert.alert('Erreur', 'Erreur de connexion au serveur');
    }
    return [];
  }
};

export const refreshCaptures = async (): Promise<Capture[]> => {
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
      return capturesData;
    }
    return [];
  } catch (err) {
    console.error('Erreur lors du rafraîchissement:', err);
    return [];
  }
};

export const deleteCapture = async (id: number, captures: Capture[]): Promise<Capture[]> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette capture ?',
      [
        { text: 'Annuler', onPress: () => resolve(captures) },
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
                const updated = captures.filter(c => c.id !== id);
                Alert.alert('Succès', 'Capture supprimée');
                resolve(updated);
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la capture');
                resolve(captures);
              }
            } catch (err) {
              console.error('Erreur:', err);
              Alert.alert('Erreur', 'Erreur de connexion');
              resolve(captures);
            }
          },
          style: 'destructive',
        },
      ]
    );
  });
};

export const canDeleteCapture = (user: User | null, capture: Capture): boolean => {
  if (!user) return false;
  if (user.role === 'ROLE_ADMIN') return true;
  if (user.role === 'ROLE_OPJ' && capture.opj?.id === user.id) return true;
  return false;
};

export const getHeaderTitle = (user: User | null): string => {
  if (!user) return 'Mes Captures';
  return user.role === 'ROLE_ADMIN' ? 'Toutes les Captures' : 'Mes Captures';
};

import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { getApiUrl } from '../api/config';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('Données brutes de connexion:', JSON.stringify(data, null, 2));
        
        // Récupérer l'utilisateur
        let user = data.user || data.data;
        
        // Essayer différents formats possibles de token
        let token = data.token || data.access_token || data.accessToken || data['access-token'];
        
        // Si pas de token, en générer un basique avec email:id
        if (!token && user) {
          token = `bearer_${user.id}_${Date.now()}`;
          console.log('Token généré localement:', token);
        }
        
        console.log('Token extrait:', token ? 'Présent' : 'ABSENT');
        console.log('Format token:', typeof token);
        console.log('User extrait:', user);
        
        // Vérifier qu'on a au moins l'utilisateur
        if (!user) {
          setError('Données utilisateur manquantes dans la réponse du serveur');
          setLoading(false);
          return;
        }
        
        // Vérifier qu'on a un token (généré ou reçu)
        if (!token) {
          setError('Impossible de générer le token d\'authentification');
          setLoading(false);
          return;
        }
        
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('token', token);
        
        console.log('Authentification réussie - Token et user sauvegardés');
        
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        let errorMessage = 'Erreur de connexion';
        try {
          const data = await response.json();
          console.log('Erreur réponse complète:', JSON.stringify(data, null, 2));
          errorMessage = data.message || data.error || `Erreur ${response.status}`;
        } catch (e) {
          console.log('Impossible de parser la réponse d\'erreur');
          errorMessage = `Erreur serveur ${response.status}`;
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Erreur complète de connexion:', JSON.stringify(err, null, 2));
      console.error('Message erreur:', err.message);
      setError('Erreur de connexion au serveur.\n\nVérifiez:\n- La connexion réseau\n- L\'URL du serveur\n- Les identifiants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="security" size={48} color="#0066cc" />
            </View>
          </View>
          <Text style={styles.appTitle}>OPJ Capture</Text>
          <Text style={styles.appSubtitle}>Gestion des Infractions</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color="#c62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adresse Email</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#0066cc" />
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="#bbb"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor="#0066cc"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mot de passe</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#0066cc" />
              <TextInput
                style={[styles.input, { paddingRight: 45 }]}
                placeholder="Entrez votre mot de passe"
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
                selectionColor="#0066cc"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <MaterialIcons 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#0066cc"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotPasswordLink}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>OPJ Capture v1.0</Text>
          <Text style={styles.footerSubtext}>© 2026 - Tous droits réservés</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: width > 600 ? 40 : 20,
    justifyContent: 'center',
    paddingTop: height < 700 ? 20 : 40,
    paddingBottom: 30,
  },
  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: height > 800 ? 50 : 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  appTitle: {
    fontSize: width > 600 ? 32 : 28,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Form
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: width > 600 ? 32 : 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    height: 50,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#0066cc',
    fontSize: 13,
    fontWeight: '600',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    marginTop: 60,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});

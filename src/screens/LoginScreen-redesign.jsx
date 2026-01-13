import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
        
        // Stocker les informations utilisateur
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('token', data.token || '');
        
        // Attendre un peu pour que le contexte se mette à jour
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        let errorMessage = 'Erreur de connexion';
        try {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
        } catch {
          errorMessage = `Erreur ${response.status}`;
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Erreur de connexion au serveur. Vérifiez votre connexion réseau.');
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Illustration Section */}
        <View style={styles.illustrationSection}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="security" size={80} color="#0066cc" />
          </View>
          <Text style={styles.appTitle}>OPJ Capture</Text>
          <Text style={styles.appSubtitle}>Plateforme de Gestion des Infractions</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Error Alert */}
          {error ? (
            <View style={styles.errorAlert}>
              <MaterialIcons name="error-outline" size={20} color="#d32f2f" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Adresse Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="email" size={20} color="#0066cc" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="vous@example.com"
                placeholderTextColor="#bbb"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Mot de passe</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock" size={20} color="#0066cc" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 45 }]}
                placeholder="Entrez votre mot de passe"
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color="#0066cc"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

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
              <View style={styles.buttonContent}>
                <MaterialIcons name="login" size={20} color="#fff" />
                <Text style={styles.loginButtonText}>Se connecter</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Demo Credentials Card */}
          <View style={styles.demoCard}>
            <View style={styles.demoBadge}>
              <MaterialIcons name="info" size={16} color="#0066cc" />
              <Text style={styles.demoBadgeText}>Accès de test</Text>
            </View>
            <Text style={styles.demoTitle}>Identifiants de démonstration :</Text>
            
            <View style={styles.demoItem}>
              <MaterialIcons name="person" size={16} color="#0066cc" />
              <View style={styles.demoItemText}>
                <Text style={styles.demoLabel}>Email</Text>
                <Text style={styles.demoValue}>admin@opj.com</Text>
              </View>
            </View>
            
            <View style={styles.demoItem}>
              <MaterialIcons name="vpn-key" size={16} color="#0066cc" />
              <View style={styles.demoItemText}>
                <Text style={styles.demoLabel}>Mot de passe</Text>
                <Text style={styles.demoValue}>Admin123!</Text>
              </View>
            </View>
          </View>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <MaterialIcons name="shield" size={16} color="#4caf50" />
            <Text style={styles.securityText}>Connexion sécurisée avec chiffrement SSL</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>OPJ Capture v1.0</Text>
          <Text style={styles.footerSubtext}>© 2026 Tous droits réservés</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
  },
  // Illustration Section
  illustrationSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    backgroundColor: '#fff',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0066cc',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 20,
  },
  // Form Container
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  // Error Alert
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  // Input Fields
  inputGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fafafa',
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 8,
  },
  // Forgot Password
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#0066cc',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Login Button
  loginButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    height: 54,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  // Demo Card
  demoCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
    padding: 16,
    marginTop: 24,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  demoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0066cc',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  demoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  demoItemText: {
    marginLeft: 10,
    flex: 1,
  },
  demoLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  demoValue: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '600',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Security Info
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f8e9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  securityText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
    marginLeft: 8,
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});

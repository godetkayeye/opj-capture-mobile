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
    View,
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
        scrollEventThrottle={16}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="security" size={60} color="#0066cc" />
          </View>
          <Text style={styles.appName}>OPJ Capture</Text>
          <Text style={styles.appSubtitle}>Gestion des Infractions</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color="#d32f2f" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse Email</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color="#0066cc" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="#999"
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
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#0066cc" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 45 }]}
                placeholder="••••••••"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
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

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="login" size={20} color="#fff" style={styles.btnIcon} />
                <Text style={styles.loginBtnText}>Se connecter</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotLinkText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Credentials Card */}
        <View style={styles.demoCard}>
          <View style={styles.demoBadge}>
            <MaterialIcons name="info" size={18} color="#0066cc" />
            <Text style={styles.demoBadgeText}>Identifiants de test</Text>
          </View>
          <View style={styles.demoRow}>
            <MaterialIcons name="person" size={16} color="#666" />
            <Text style={styles.demoText}>admin@opj.com</Text>
          </View>
          <View style={styles.demoRow}>
            <MaterialIcons name="key" size={16} color="#666" />
            <Text style={styles.demoText}>Admin123!</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>OPJ Capture © 2026</Text>
          <Text style={styles.versionText}>v1.0.0</Text>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingTop: height * 0.05,
    paddingBottom: height * 0.05,
  },
  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: height * 0.08,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // Form Card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  // Error Box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  // Input Groups
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e6f2',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f8f9fc',
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
  eyeBtn: {
    padding: 8,
    marginLeft: 4,
  },
  // Login Button
  loginBtn: {
    backgroundColor: '#0066cc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnDisabled: {
    opacity: 0.65,
  },
  btnIcon: {
    marginRight: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Forgot Password Link
  forgotLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  forgotLinkText: {
    color: '#0066cc',
    fontSize: 13,
    fontWeight: '600',
  },
  // Demo Card
  demoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  demoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0066cc',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  versionText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});

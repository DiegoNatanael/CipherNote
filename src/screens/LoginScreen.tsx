// src/screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { hasMasterPassword, setMasterPassword, verifyMasterPassword } from '../utils/crypto';
import { useCrypto } from '../contexts/CryptoContext';

// Define the props for LoginScreen using RootStackParamList
type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setEncryptionKey } = useCrypto();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const firstTime = !(await hasMasterPassword());
        setIsFirstLaunch(firstTime);
      } catch (e) {
        console.error('Error checking master password status:', e);
        Alert.alert('Error', 'Could not check app status. Please restart.');
      } finally {
        setLoading(false);
      }
    };

    checkFirstLaunch();
  }, []);

  const handleSetMasterPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const derivedKey = await setMasterPassword(password);
      setEncryptionKey(derivedKey);
      navigation.replace('Home');
    } catch (e) {
      console.error('Error setting master password:', e);
      setError('Failed to set master password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) {
      setError('Please enter your master password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const derivedKey = await verifyMasterPassword(password);
      if (derivedKey) {
        setEncryptionKey(derivedKey);
        navigation.replace('Home');
      } else {
        setError('Incorrect master password.');
      }
    } catch (e) {
      console.error('Error verifying master password:', e);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00f2ea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CipherNote</Text>

      {isFirstLaunch ? (
        <>
          <Text style={styles.subtitle}>Set your Master Password</Text>
          <Text style={styles.warningText}>
            Warning: This password is the ONLY way to access your notes. There is NO recovery if you forget it.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Master Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Master Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleSetMasterPassword} disabled={loading}>
            <Text style={styles.buttonText}>Set Password</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Enter Master Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Master Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>Unlock Notes</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212', // Dark background
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00f2ea', // Accent color
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 15,
  },
  warningText: {
    color: '#ff6347', // A warning/danger color
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    paddingHorizontal: 10,
  },
  input: {
    width: '90%',
    padding: 15,
    backgroundColor: '#1e1e1e', // Slightly lighter dark for input
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00f2ea',
  },
  button: {
    width: '90%',
    padding: 15,
    backgroundColor: '#00f2ea', // Accent color
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#121212', // Dark text on accent button
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff6347',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});

export default LoginScreen;
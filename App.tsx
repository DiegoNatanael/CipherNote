import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CryptoProvider } from './src/contexts/CryptoContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <CryptoProvider>
        <AppNavigator />
      </CryptoProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
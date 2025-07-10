// src/contexts/CryptoContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';
import { clearMasterPassword, hasMasterPassword, verifyMasterPassword } from '../utils/crypto';
import { Alert } from 'react-native';

// Define the shape of the context value
interface CryptoContextType {
  encryptionKey: CryptoJS.lib.WordArray | null;
  setEncryptionKey: (key: CryptoJS.lib.WordArray | null) => void;
  isAuthenticated: boolean;
  clearAllCryptoData: () => Promise<void>;
}

// Create the context
const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

// Define the provider component
interface CryptoProviderProps {
  children: ReactNode;
}

export const CryptoProvider: React.FC<CryptoProviderProps> = ({ children }) => {
  const [encryptionKey, setEncryptionKey] = useState<CryptoJS.lib.WordArray | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isKeySetRef = useRef(false); // To track if the key has been set in the current session

  useEffect(() => {
    setIsAuthenticated(encryptionKey !== null);
  }, [encryptionKey]);

  const clearAllCryptoData = async () => {
    try {
      await clearMasterPassword();
      setEncryptionKey(null);
      isKeySetRef.current = false;
      Alert.alert(
        'Data Cleared',
        'Master password and all notes have been permanently deleted from this device. You will need to set a new master password on next launch.'
      );
    } catch (error) {
      console.error('Error clearing all crypto data:', error);
      Alert.alert('Error', 'Failed to clear all data. Please try again.');
    }
  };

  const contextValue: CryptoContextType = {
    encryptionKey,
    setEncryptionKey: (key) => {
      setEncryptionKey(key);
      isKeySetRef.current = !!key; // Update ref when key is set/cleared
    },
    isAuthenticated,
    clearAllCryptoData,
  };

  return (
    <CryptoContext.Provider value={contextValue}>
      {children}
    </CryptoContext.Provider>
  );
};

// Custom hook to use the CryptoContext
export const useCrypto = () => {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};
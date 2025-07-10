import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import * as ExpoCrypto from 'expo-crypto'; // For robust IV generation

// --- Constants for Key Derivation ---
const PBKDF2_ITERATIONS = 10000;
const KEY_SIZE = 256 / 32; // AES-256 (256 bits / 32 bits per word)
const SALT_SIZE = 128 / 8; // 128 bits for salt (16 bytes)
const IV_SIZE = 128 / 8; // AES block size is 128 bits (16 bytes) for IV
const SECURE_STORE_SALT_KEY = 'ciphernote_salt'; // Key for storing the PBKDF2 salt
const TEST_DATA_KEY = 'ciphernote_test_data'; // Key for storing encrypted test data for password verification
const TEST_PLAIN_TEXT = "CipherNoteTest"; // Plaintext used for master password verification

/**
 * Generates a random salt for PBKDF2 key derivation.
 * @returns A CryptoJS WordArray representing the random salt.
 */
const generateSalt = (): CryptoJS.lib.WordArray => {
  const salt = CryptoJS.lib.WordArray.random(SALT_SIZE);
  console.log('DEBUG: generateSalt - Generated salt:', salt.toString());
  return salt;
};

/**
 * Derives a strong encryption key from a master password and a salt using PBKDF2.
 * @param password The user's master password.
 * @param salt The salt (CryptoJS WordArray) used for key derivation.
 * @returns A CryptoJS WordArray representing the derived encryption key.
 */
const deriveKey = (password: string, salt: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray => {
  console.log('DEBUG: deriveKey - Input password length:', password.length);
  console.log('DEBUG: deriveKey - Input salt (type, words, sigBytes):', typeof salt, salt?.words, salt?.sigBytes);
  try {
    const derived = CryptoJS.PBKDF2(password, salt, {
      keySize: KEY_SIZE,
      iterations: PBKDF2_ITERATIONS,
    });
    console.log('DEBUG: deriveKey - CryptoJS.PBKDF2 returned:', derived?.toString());
    return derived;
  } catch (error) {
    console.error('DEBUG: deriveKey - Error during PBKDF2 derivation:', error);
    throw error;
  }
};

/**
 * Encrypts data using AES-256 with a derived key and an explicitly generated IV.
 * @param data The plaintext string to encrypt.
 * @param key The CryptoJS WordArray encryption key.
 * @returns The encrypted data as a string in format "iv:ciphertext".
 */
export const encryptData = (data: string, key: CryptoJS.lib.WordArray): string => {
  console.log('DEBUG: encryptData - Input data length:', data.length);
  console.log('DEBUG: encryptData - Input key (type, words, sigBytes):', typeof key, key?.words, key?.sigBytes);

  if (!data || !key) {
    console.error('ERROR: encryptData received invalid input (data or key is null/undefined). Data:', data, 'Key:', key);
    throw new Error('Encrypt data received invalid input.');
  }

  // Generate random IV using expo-crypto
  const ivUint8 = ExpoCrypto.getRandomBytes(IV_SIZE);
  const iv = CryptoJS.lib.WordArray.create(Array.from(ivUint8));
  console.log('DEBUG: encryptData - Generated IV:', iv.toString());

  // Perform encryption with explicit IV
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  // Return the encrypted data in a format that includes the IV
  return iv.toString() + ':' + encrypted.toString();
};

/**
 * Decrypts data using AES-256 with a derived key.
 * Expects input in format "iv:ciphertext".
 * @param encryptedText The encrypted string (from encryptData).
 * @param key The CryptoJS WordArray encryption key.
 * @returns The decrypted plaintext string, or null if decryption fails or input is invalid.
 */
export const decryptData = (encryptedText: string, key: CryptoJS.lib.WordArray): string | null => {
  console.log('DEBUG: decryptData - encryptedText (first 50 chars):', encryptedText ? encryptedText.substring(0, 50) : 'null/undefined');
  console.log('DEBUG: decryptData - Input key (type, words, sigBytes):', typeof key, key?.words, key?.sigBytes);

  try {
    if (!encryptedText || typeof encryptedText !== 'string' || !key) {
      console.warn('WARN: decryptData received invalid input type for encryptedText or key.');
      return null;
    }

    // Split the input into IV and ciphertext
    const [ivString, ciphertext] = encryptedText.split(':');
    if (!ivString || !ciphertext) {
      console.warn('WARN: decryptData - Invalid encrypted data format. Expected "iv:ciphertext"');
      return null;
    }

    // Parse the IV and attempt decryption
    const iv = CryptoJS.enc.Hex.parse(ivString);
    
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    console.log('DEBUG: decryptData - Result of CryptoJS.AES.decrypt:', decrypted);
    console.log('DEBUG: decryptData - decrypted.words:', decrypted?.words);
    console.log('DEBUG: decryptData - decrypted.sigBytes:', decrypted?.sigBytes);

    // CRITICAL CHECK: Ensure decrypted has valid bytes before converting to string
    if (!decrypted || !decrypted.words || decrypted.words.length === 0 || decrypted.sigBytes <= 0) {
      console.warn('WARN: Decryption resulted in no valid words/bytes or zero sigBytes.');
      return null;
    }

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    console.log('DEBUG: decryptData - Converted plaintext (first 50 chars):', plaintext ? plaintext.substring(0, 50) : 'null/empty');

    if (!plaintext) {
      console.warn('WARN: Decryption resulted in empty plaintext string.');
      return null;
    }

    return plaintext;

  } catch (error) {
    console.error('ERROR: Decryption failed:', error);
    return null;
  }
};

/**
 * Stores the PBKDF2 salt securely.
 * The salt is essential for deriving the same key every time.
 * @param salt The CryptoJS WordArray salt to store.
 */
const storeSalt = async (salt: CryptoJS.lib.WordArray) => {
  try {
    // Ensure salt is convertible to string. toString(Base64) is reliable.
    await SecureStore.setItemAsync(SECURE_STORE_SALT_KEY, salt.toString(CryptoJS.enc.Base64));
    console.log('LOG: Salt stored securely.');
  } catch (error) {
    console.error('ERROR: Failed to store salt:', error);
    throw new Error('Failed to store critical encryption data.');
  }
};

/**
 * Retrieves the PBKDF2 salt securely.
 * @returns The CryptoJS WordArray salt, or null if not found.
 */
const getStoredSalt = async (): Promise<CryptoJS.lib.WordArray | null> => {
  try {
    const saltBase64 = await SecureStore.getItemAsync(SECURE_STORE_SALT_KEY);
    if (saltBase64) {
      return CryptoJS.enc.Base64.parse(saltBase64); // This expects a string
    }
    return null;
  } catch (error) {
    console.error('ERROR: Failed to retrieve salt:', error);
    return null;
  }
};

/**
 * Checks if a master password has been set (by checking for the stored salt).
 * @returns True if a master password has been set, false otherwise.
 */
export const hasMasterPassword = async (): Promise<boolean> => {
  const salt = await getStoredSalt();
  return salt !== null;
};

/**
 * Sets the master password for the first time.
 * Generates a new salt, derives the key, and stores the salt securely.
 * It also sets a test encrypted value for future password verification.
 * @param password The master password to set.
 * @returns The derived encryption key (CryptoJS WordArray).
 */
export const setMasterPassword = async (password: string): Promise<CryptoJS.lib.WordArray> => {
  if (!password) {
    throw new Error('Password cannot be empty.');
  }
  const salt = generateSalt();
  await storeSalt(salt);

  const derivedKey = deriveKey(password, salt);

  // Ensure derivedKey is not undefined or empty after derivation
  if (!derivedKey || derivedKey.sigBytes === 0) {
      console.error('ERROR: Derived key is undefined or empty after derivation.');
      throw new Error('Failed to derive encryption key.');
  }

  // Encrypt and store test data immediately after setting the password
  try {
    const encryptedTest = encryptData(TEST_PLAIN_TEXT, derivedKey);
    await SecureStore.setItemAsync(TEST_DATA_KEY, encryptedTest);
    console.log('DEBUG: Test data set securely.');
  } catch (e) {
    console.error('ERROR: Failed to set test data:', e);
    throw new Error('Failed to secure internal test data for password verification.');
  }

  return derivedKey;
};


/**
 * Verifies the entered master password and returns the derived key if correct.
 * @param password The master password entered by the user.
 * @returns The derived encryption key (CryptoJS WordArray) if successful, or null if verification fails.
 */
export const verifyMasterPassword = async (password: string): Promise<CryptoJS.lib.WordArray | null> => {
  if (!password) {
    return null;
  }

  const salt = await getStoredSalt();
  if (!salt) {
    console.warn('WARN: Attempted to verify password but no salt found.');
    return null;
  }

  const derivedKey = deriveKey(password, salt);

  const STORED_TEST_DATA = await SecureStore.getItemAsync(TEST_DATA_KEY);

  // CRITICAL CHECK: If test data is missing, we cannot verify the password.
  if (!STORED_TEST_DATA) {
      console.error('ERROR: Missing stored test data for password verification. Data may be corrupted or never saved.');
      return null;
  }

  const decryptedTest = decryptData(STORED_TEST_DATA, derivedKey);

  if (decryptedTest === TEST_PLAIN_TEXT) {
      return derivedKey; // Password is correct
  } else {
      console.warn('WARN: Decrypted test data does not match. Incorrect password or data corruption.');
      return null;
  }
};

/**
 * Removes the master password and all associated secure data.
 * USE WITH EXTREME CAUTION: This will make all notes inaccessible!
 */
export const clearMasterPassword = async () => {
  try {
    await SecureStore.deleteItemAsync(SECURE_STORE_SALT_KEY);
    await SecureStore.deleteItemAsync(TEST_DATA_KEY);
    console.log('LOG: Master password and associated data cleared.');
  } catch (error) {
    console.error('ERROR: Failed to clear master password:', error);
    throw new Error('Failed to clear master password data.');
  }
};
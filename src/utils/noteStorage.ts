// src/utils/noteStorage.ts
import * as FileSystem from 'expo-file-system';
import { encryptData, decryptData } from './crypto';
import CryptoJS from 'crypto-js'; // For type inference of encryptionKey
import 'react-native-get-random-values'; // Ensure this is imported once globally in App.tsx

// Define the structure for a Note
export interface Note {
  id: string; // Unique identifier for the note (e.g., a timestamp)
  content: string; // The plaintext content of the note
  timestamp: number; // Last modified timestamp for sorting
}

// Define the structure for a Note stored in the file system
export interface StoredNoteMetadata {
  id: string;
  timestamp: number;
}

// Directory where notes will be stored
const NOTES_DIR = `${FileSystem.documentDirectory}notes/`;
const METADATA_FILE = `${NOTES_DIR}metadata.json`; // File to store note metadata (id and timestamp)

/**
 * Ensures the notes directory exists.
 */
const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(NOTES_DIR);
  if (!dirInfo.isDirectory) {
    await FileSystem.makeDirectoryAsync(NOTES_DIR, { intermediates: true });
  }
};

/**
 * Saves or updates a note.
 * @param note The note object to save.
 * @param encryptionKey The derived encryption key.
 * @returns The updated note object.
 */
export const saveNote = async (note: Note, encryptionKey: CryptoJS.lib.WordArray): Promise<Note> => {
  if (!encryptionKey) {
    throw new Error('Encryption key is not available. Cannot save note.');
  }

  await ensureDirExists();

  // Encrypt the note content
  const encryptedContent = encryptData(note.content, encryptionKey);
  const filePath = `${NOTES_DIR}${note.id}.encrypted`;

  // Write the encrypted content to a file
  await FileSystem.writeAsStringAsync(filePath, encryptedContent);

  // Update or add metadata
  let metadata: StoredNoteMetadata[] = [];
  try {
    const rawMetadata = await FileSystem.readAsStringAsync(METADATA_FILE);
    metadata = JSON.parse(rawMetadata);
  } catch (e) {
    // File doesn't exist or is corrupted, start fresh
    console.warn('Metadata file not found or corrupted, initializing new metadata.', e);
    metadata = [];
  }

  const existingIndex = metadata.findIndex(m => m.id === note.id);
  const newMetadata = { id: note.id, timestamp: note.timestamp };

  if (existingIndex !== -1) {
    metadata[existingIndex] = newMetadata;
  } else {
    metadata.push(newMetadata);
  }

  await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify(metadata));

  return note;
};

/**
 * Loads a single note by its ID.
 * @param id The ID of the note to load.
 * @param encryptionKey The derived encryption key.
 * @returns The decrypted note content, or null if not found/decryption fails.
 */
export const loadNoteContent = async (id: string, encryptionKey: CryptoJS.lib.WordArray): Promise<string | null> => {
  if (!encryptionKey) {
    throw new Error('Encryption key is not available. Cannot load note content.');
  }

  const filePath = `${NOTES_DIR}${id}.encrypted`;
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      return null;
    }

    const encryptedContent = await FileSystem.readAsStringAsync(filePath);
    const decryptedContent = decryptData(encryptedContent, encryptionKey);
    return decryptedContent;

  } catch (error) {
    console.error(`Error loading note content for ID ${id}:`, error);
    return null;
  }
};

/**
 * Gets a list of all notes (metadata only for performance on home screen).
 * The actual content is only loaded when a note is opened.
 * @returns A sorted array of StoredNoteMetadata.
 */
export const getAllNoteMetadata = async (): Promise<StoredNoteMetadata[]> => {
  await ensureDirExists();
  try {
    const rawMetadata = await FileSystem.readAsStringAsync(METADATA_FILE);
    const metadata: StoredNoteMetadata[] = JSON.parse(rawMetadata);
    // Sort by timestamp, most recent first
    return metadata.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.warn('No metadata file found or corrupted, returning empty list.', e);
    return [];
  }
};

/**
 * Deletes a note by its ID.
 * @param id The ID of the note to delete.
 */
export const deleteNote = async (id: string) => {
  await ensureDirExists();
  const filePath = `${NOTES_DIR}${id}.encrypted`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
      console.log(`Deleted note file: ${filePath}`);
    }

    // Also remove from metadata
    let metadata: StoredNoteMetadata[] = [];
    try {
      const rawMetadata = await FileSystem.readAsStringAsync(METADATA_FILE);
      metadata = JSON.parse(rawMetadata);
    } catch (e) {
      // Ignore, metadata might not exist, or be corrupted, but we're deleting anyway
    }

    const updatedMetadata = metadata.filter(m => m.id !== id);
    await FileSystem.writeAsStringAsync(METADATA_FILE, JSON.stringify(updatedMetadata));
    console.log(`Removed note ID ${id} from metadata.`);

  } catch (error) {
    console.error(`Error deleting note ${id}:`, error);
    throw new Error(`Failed to delete note.`);
  }
};

/**
 * Generates a unique ID for a new note.
 * Uses current timestamp for simplicity and sorting.
 */
export const generateNoteId = (): string => {
  return Date.now().toString(); // Simple timestamp-based ID
};
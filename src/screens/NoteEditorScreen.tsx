import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCrypto } from '../contexts/CryptoContext';
import { saveNote, loadNoteContent, deleteNote, generateNoteId } from '../utils/noteStorage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Define props for NoteEditorScreen
type NoteEditorScreenProps = StackScreenProps<RootStackParamList, 'NoteEditor'>;

const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({ navigation, route }) => {
  const { noteId } = route.params;
  const { encryptionKey, isAuthenticated } = useCrypto();

  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(noteId || null);
  const [isSaving, setIsSaving] = useState(false); 
  const contentRef = useRef(content); // To capture the latest content for auto-save

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    const fetchOrCreateNote = async () => {
      if (!isAuthenticated || !encryptionKey) {
        Alert.alert('Error', 'Authentication required to load/save notes.');
        navigation.replace('Login');
        return;
      }

      if (noteId) { 
        setLoading(true);
        try {
          const loadedContent = await loadNoteContent(noteId, encryptionKey);
          if (loadedContent !== null) {
            setContent(loadedContent);
            setCurrentNoteId(noteId); // Confirm the ID for the loaded note
          } else {
            Alert.alert('Error', 'Note not found or could not be decrypted. It might have been deleted or corrupted.');
            navigation.goBack();
          }
        } catch (e) {
          console.error('Error fetching note:', e);
          Alert.alert('Error', 'Failed to load note.');
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      } else { 
        setContent(''); 
        setCurrentNoteId(null); 
        setLoading(false);
      }
    };

    fetchOrCreateNote();
  }, [noteId, encryptionKey, isAuthenticated, navigation]);


  useFocusEffect(
    useCallback(() => {
      return async () => {
        if (isAuthenticated && encryptionKey && contentRef.current.trim() !== '') {
          try {
            setIsSaving(true); 
            const idToSave = currentNoteId || generateNoteId(); // Use existing ID or generate new for truly new notes

            await saveNote(
              {
                id: idToSave,
                content: contentRef.current,
                timestamp: Date.now(), // Update timestamp on save
              },
              encryptionKey
            );
            console.log('Note auto-saved. ID:', idToSave);
          } catch (e) {
            console.error('Auto-save failed:', e);
            Alert.alert('Save Error', 'Failed to auto-save note. Please check your password and try again.');
          } finally {
            setIsSaving(false); 
          }
        } else if (contentRef.current.trim() === '' && currentNoteId) { 
          console.log('Existing note emptied. It will not be saved. Consider auto-deletion.');
        } else {
          console.log('Note not saved (no content or not authenticated, or new empty note).');
        }
      };
    }, [isAuthenticated, encryptionKey, currentNoteId])
  );


  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to permanently delete this note?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!isAuthenticated || !encryptionKey || !currentNoteId) {
              Alert.alert('Error', 'Cannot delete note without proper authentication or note ID.');
              return;
            }
            try {
              setLoading(true);
              await deleteNote(currentNoteId);
              Alert.alert('Deleted', 'Note successfully deleted.');
              navigation.goBack(); 
            } catch (e) {
              console.error('Error deleting note:', e);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00f2ea" />
        <Text style={styles.loadingText}>Loading note...</Text>
      </View>
    );
  }

  const isNewNote = !currentNoteId;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Increased offset slightly for iOS header
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={28} color="#00f2ea" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNewNote ? 'New Note' : 'Edit Note'}
        </Text>
        {isSaving && (
          <ActivityIndicator size="small" color="#00f2ea" style={styles.savingIndicator} />
        )}
        {!isNewNote && (
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={28} color="#ff6347" />
          </TouchableOpacity>
        )}
        {isNewNote && (
          <View style={styles.headerButtonPlaceholder} />
        )}
      </View>

      <TextInput
        style={styles.textInput}
        multiline
        autoFocus 
        textAlignVertical="top" 
        value={content}
        onChangeText={setContent}
        placeholder="Start typing your private note..."
        placeholderTextColor="#888"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50, 
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#00f2ea',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButton: {
    padding: 5,
  },
  headerButtonPlaceholder: {
    width: 38, 
    height: 38,
  },
  savingIndicator: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -12 }], // Center the spinner visually
  },
  textInput: {
    flex: 1, // Ensures TextInput takes available space and pushes content up
    fontSize: 18,
    color: '#fff',
    padding: 20,
    paddingTop: 15, // Adjust for top padding when multiline starts
    textAlignVertical: 'top', // For Android
  },
});

export default NoteEditorScreen;
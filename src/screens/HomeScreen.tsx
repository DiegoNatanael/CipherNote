// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCrypto } from '../contexts/CryptoContext';
import { getAllNoteMetadata, StoredNoteMetadata, generateNoteId, deleteNote } from '../utils/noteStorage';
import { Ionicons } from '@expo/vector-icons'; // For the floating action button icon

// Props for HomeScreen
type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

// Helper function for date formatting
const formatNoteDate = (timestamp: number): string => {
  const noteDate = new Date(timestamp);
  const now = new Date();

  const isToday = noteDate.toDateString() === now.toDateString();
  const isYesterday = new Date(noteDate.setDate(noteDate.getDate() + 1)).toDateString() === now.toDateString(); // Check against 'yesterday'
  noteDate.setDate(noteDate.getDate() - 1); // Revert date modification

  if (isToday) {
    return `Today at ${noteDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    return `Yesterday at ${noteDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    // For older notes, show full date
    return noteDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isAuthenticated, encryptionKey, clearAllCryptoData } = useCrypto();
  const [notes, setNotes] = useState<StoredNoteMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to load notes from storage
  const loadNotes = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      if (!isAuthenticated) {
        setNotes([]);
        navigation.replace('Login');
        return;
      }
      const loadedNotes = await getAllNoteMetadata();
      setNotes(loadedNotes);
    } catch (e) {
      console.error('Error loading notes:', e);
      Alert.alert('Error', 'Failed to load notes. Please restart the app.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, navigation]);

  // Load notes when component mounts or authentication status changes
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotes(); // Reload notes every time the screen comes into focus
    });
    return unsubscribe;
  }, [navigation, loadNotes]);

  const handleCreateNewNote = () => {
    navigation.navigate('NoteEditor', { initialContent: '' });
  };

  const handleOpenNote = (noteId: string) => {
    navigation.navigate('NoteEditor', { noteId });
  };

  const handleDeleteNote = (noteId: string) => {
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
            try {
              setLoading(true);
              await deleteNote(noteId);
              Alert.alert('Deleted', 'Note successfully deleted.');
              loadNotes(); // Reload the list after deletion
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

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete your master password and ALL notes from this device. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearAllCryptoData();
          },
        },
      ]
    );
  };

  const renderNoteItem = ({ item }: { item: StoredNoteMetadata }) => {
    const firstLine = item.content?.split('\n')[0].trim();
    const previewText = firstLine ? firstLine.substring(0, 80) + (firstLine.length > 80 ? '...' : '') : 'New Note';
    const dateDisplay = formatNoteDate(item.timestamp);

    return (
      <View style={styles.noteItemContainer}>
        <TouchableOpacity style={styles.noteItem} onPress={() => handleOpenNote(item.id)}>
          <Text style={styles.notePreviewText}>{previewText}</Text>
          <Text style={styles.noteTimestamp}>{dateDisplay}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteNote(item.id)}>
          <Ionicons name="trash-outline" size={24} color="#ff6347" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CipherNotes</Text>
        <TouchableOpacity onPress={handleClearAllData} style={styles.clearAllButton}>
          <Ionicons name="alert-circle-outline" size={28} color="#ff6347" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerMessage}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.loadingText}>Fetching your secure notes...</Text>
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="document-text-outline" size={80} color="#00f2ea" style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateText}>No notes yet.</Text>
          <Text style={styles.emptyStateSubText}>Tap the '+' button to create your first private note!</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.noteListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadNotes}
              tintColor="#00f2ea"
            />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreateNewNote}>
        <Ionicons name="add" size={35} color="#121212" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#00f2ea',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00f2ea',
  },
  clearAllButton: {
    padding: 5,
  },
  noteListContent: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  noteItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden', 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  noteItem: {
    flex: 1,
    padding: 15,
  },
  notePreviewText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
    fontWeight: '600',
  },
  noteTimestamp: {
    fontSize: 12,
    color: '#aaa',
  },
  deleteButton: {
    padding: 15,
    backgroundColor: '#330000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00f2ea',
    justifyContent: 'center',
    alignItems: 'center',
    right: 25,
    bottom: 25,
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyStateText: {
    color: '#ccc',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  emptyStateSubText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HomeScreen;
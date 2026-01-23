
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface FieldBed {
  id: string;
  name: string;
  type: 'field' | 'bed';
  square_footage?: number;
  acreage?: number;
  irrigation_type?: string;
  soil_type?: string;
}

interface Note {
  id: string;
  noteType: 'photo' | 'voice';
  fileUrl: string;
  caption?: string;
  createdAt: string;
}

export default function FieldDetailsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();

  const [field, setField] = useState<FieldBed | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const loadFieldAndNotes = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading field details and notes for:', id);
      
      // Load field details
      const fieldResponse = await fetch(`${BACKEND_URL}/api/fields-beds`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (fieldResponse.ok) {
        const fields = await fieldResponse.json();
        const currentField = fields.find((f: FieldBed) => f.id === id);
        setField(currentField || null);
      }

      // Load notes for this field/bed
      const notesResponse = await fetch(`${BACKEND_URL}/api/field-bed-notes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        console.log(`Loaded ${notesData.length} notes`);
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Error loading field details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadFieldAndNotes();
  }, [loadFieldAndNotes]);

  const pickImage = async () => {
    console.log('User tapped upload photo');
    
    // Web fallback: use file input
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Photo upload is not available on web. Please use the mobile app.');
      return;
    }
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    console.log('User tapped take photo');
    
    // Web fallback: camera not available
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web. Please use the mobile app.');
      return;
    }
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      console.log('Uploading photo:', uri);
      
      // First upload the image file
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'field-photo.jpg',
      } as any);

      const uploadResponse = await fetch(`${BACKEND_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await uploadResponse.json();
      console.log('Image uploaded:', url);

      // Create the photo note in the database
      const noteResponse = await fetch(`${BACKEND_URL}/api/field-bed-notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldBedId: id,
          noteType: 'photo',
          fileUrl: url,
        }),
      });

      if (noteResponse.ok) {
        console.log('Photo note created successfully');
        Alert.alert('Success', 'Photo added successfully');
        loadFieldAndNotes();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    console.log('User started voice recording');
    
    // Web fallback: audio recording not available
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Voice recording is not available on web. Please use the mobile app.');
      return;
    }
    
    try {
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant microphone access to record voice notes');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    console.log('User stopped voice recording');
    if (!recording) return;

    setIsRecording(false);
    setUploading(true);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording saved to:', uri);
      
      if (uri) {
        // Upload the audio file using the image upload endpoint (supports multiple file types)
        const formData = new FormData();
        formData.append('image', {
          uri,
          type: 'audio/m4a',
          name: 'voice-note.m4a',
        } as any);

        const uploadResponse = await fetch(`${BACKEND_URL}/api/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload audio');
        }

        const { url } = await uploadResponse.json();
        console.log('Audio uploaded:', url);

        // Create the voice note in the database
        const noteResponse = await fetch(`${BACKEND_URL}/api/field-bed-notes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fieldBedId: id,
            noteType: 'voice',
            fileUrl: url,
          }),
        });

        if (noteResponse.ok) {
          console.log('Voice note created successfully');
          Alert.alert('Success', 'Voice note added successfully');
          loadFieldAndNotes();
        }
      }
    } catch (error) {
      console.error('Error saving voice note:', error);
      Alert.alert('Error', 'Failed to save voice note');
    } finally {
      setRecording(null);
      setUploading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting note:', noteId);
              // Delete the note from the database
              const response = await fetch(`${BACKEND_URL}/api/field-bed-notes/${noteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });

              if (response.ok) {
                console.log('Note deleted successfully');
                loadFieldAndNotes();
              }
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title: 'Field Details' }} />
        <ActivityIndicator size="large" color={farmGreen} />
      </View>
    );
  }

  if (!field) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: true, title: 'Field Details' }} />
        <Text style={[styles.errorText, { color: colors.text }]}>Field not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: field.name }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Field Info */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Field Information</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Type:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{field.type.toUpperCase()}</Text>
            </View>
            {field.acreage && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Size:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{field.acreage} acres</Text>
              </View>
            )}
            {field.square_footage && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Size:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{field.square_footage} sq ft</Text>
              </View>
            )}
            {field.irrigation_type && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Irrigation:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{field.irrigation_type}</Text>
              </View>
            )}
            {field.soil_type && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Soil:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{field.soil_type}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: farmGreen }]}
              onPress={takePhoto}
              disabled={uploading}
            >
              <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="camera" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: farmGreen }]}
              onPress={pickImage}
              disabled={uploading}
            >
              <IconSymbol ios_icon_name="photo.fill" android_material_icon_name="photo" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Upload Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isRecording ? '#ef4444' : farmGreen }]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={uploading}
            >
              <IconSymbol 
                ios_icon_name="mic.fill" 
                android_material_icon_name={isRecording ? "stop" : "mic"} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {isRecording ? 'Stop Recording' : 'Voice Note'}
              </Text>
            </TouchableOpacity>
          </View>

          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={farmGreen} />
              <Text style={[styles.uploadingText, { color: colors.icon }]}>Uploading...</Text>
            </View>
          )}

          {/* Notes Section */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Notes ({notes.length})
            </Text>

            {notes.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                No notes yet. Add a photo or voice note to get started.
              </Text>
            ) : (
              <View style={styles.notesGrid}>
                {notes.map((note) => (
                  <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.background }]}>
                    {note.noteType === 'photo' ? (
                      <Image source={{ uri: note.fileUrl }} style={styles.noteImage} />
                    ) : (
                      <View style={styles.voiceNoteContainer}>
                        <IconSymbol ios_icon_name="mic.fill" android_material_icon_name="mic" size={48} color={farmGreen} />
                        <Text style={[styles.voiceNoteText, { color: colors.text }]}>Voice Note</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteNote(note.id)}
                    >
                      <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={[styles.noteDate, { color: colors.icon }]}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  uploadingText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  noteCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  noteImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  voiceNoteContainer: {
    width: '100%',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNoteText: {
    fontSize: 14,
    marginTop: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 20,
    padding: 8,
  },
  noteDate: {
    fontSize: 12,
    padding: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
});

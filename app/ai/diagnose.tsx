
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

export default function DiagnoseScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      console.log('User selected image for diagnosis');
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      console.log('User took photo for diagnosis');
      setImageUri(result.assets[0].uri);
    }
  };

  const handleDiagnose = async () => {
    if (!description && !imageUri) {
      Alert.alert('Error', 'Please provide a description or image');
      return;
    }

    setLoading(true);
    try {
      console.log('Requesting AI plant diagnosis');
      let imageUrl = null;

      // Upload image if provided
      if (imageUri) {
        const formData = new FormData();
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'plant.jpg',
        } as any);

        const uploadResponse = await fetch(`${BACKEND_URL}/api/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        }
      }

      const response = await fetch(`${BACKEND_URL}/api/ai/diagnose-plant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ description, image_url: imageUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Received AI diagnosis');
        setDiagnosis(data);
      } else {
        throw new Error('Failed to get diagnosis');
      }
    } catch (error: any) {
      console.error('Error getting diagnosis:', error);
      Alert.alert('Error', error.message || 'Could not diagnose plant issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Plant Diagnosis',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol
              ios_icon_name="cross.case.fill"
              android_material_icon_name="local-hospital"
              size={32}
              color={farmGreen}
            />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Describe the issue or upload a photo, and our AI will help identify the problem and suggest solutions
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.card, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              placeholder="Describe what you're seeing (e.g., yellow leaves, spots, wilting...)"
              placeholderTextColor={colors.icon}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.label, { color: colors.text }]}>Photo (Optional)</Text>
            <View style={styles.imageButtons}>
              <TouchableOpacity
                style={[styles.imageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={takePhoto}
              >
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera"
                  size={24}
                  color={colors.text}
                />
                <Text style={[styles.imageButtonText, { color: colors.text }]}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.imageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={pickImage}
              >
                <IconSymbol
                  ios_icon_name="photo.fill"
                  android_material_icon_name="image"
                  size={24}
                  color={colors.text}
                />
                <Text style={[styles.imageButtonText, { color: colors.text }]}>Choose Photo</Text>
              </TouchableOpacity>
            </View>

            {imageUri && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setImageUri(null)}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="close"
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.diagnoseButton, { backgroundColor: farmGreen }]}
              onPress={handleDiagnose}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto-awesome"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.diagnoseButtonText}>Diagnose with AI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {diagnosis && (
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>Diagnosis</Text>
              <Text style={[styles.resultText, { color: colors.text }]}>{diagnosis.diagnosis}</Text>
              
              <Text style={[styles.resultTitle, { color: colors.text }]}>Recommendations</Text>
              <Text style={[styles.resultText, { color: colors.text }]}>{diagnosis.recommendations}</Text>
              
              {diagnosis.severity && (
                <>
                  <Text style={[styles.resultTitle, { color: colors.text }]}>Severity</Text>
                  <Text style={[styles.resultText, { color: colors.text }]}>{diagnosis.severity}</Text>
                </>
              )}
            </View>
          )}
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
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  diagnoseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  diagnoseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
    gap: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

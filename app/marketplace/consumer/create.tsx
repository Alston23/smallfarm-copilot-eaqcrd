
import React, { useState, useEffect, useCallback } from 'react';
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
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedGet, authenticatedPost } from '@/utils/api';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface Crop {
  id: string;
  name: string;
  category: string;
}

const UNITS = ['lbs', 'oz', 'kg', 'g', 'bunches', 'heads', 'bags', 'boxes', 'crates'];
const OUTLETS = ['Farmers Market', 'CSA', 'Roadside Stand', 'Restaurant', 'Grocery Store', 'Direct to Consumer', 'Wholesale', 'Other'];

export default function CreateConsumerListingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const [selectedCropId, setSelectedCropId] = useState('');
  const [outlet, setOutlet] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('lbs');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadCrops = useCallback(async () => {
    console.log('Loading crops for listing');
    setLoadingCrops(true);
    try {
      const data = await authenticatedGet<Crop[]>('/api/crops');
      console.log('Loaded crops:', data.length);
      setCrops(data);
    } catch (error) {
      console.error('Error loading crops:', error);
      Alert.alert('Error', 'Failed to load crops');
    } finally {
      setLoadingCrops(false);
    }
  }, []);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const pickImage = async () => {
    console.log('User tapped Pick Image button');
    
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          setUploadingImage(true);
          try {
            await uploadImageWeb(file);
          } finally {
            setUploadingImage(false);
          }
        }
      };
      input.click();
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    console.log('User tapped Take Photo button');
    
    if (Platform.OS === 'web') {
      setShowCameraModal(true);
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImageWeb = async (file: File) => {
    try {
      console.log('Uploading image from web:', file.name);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('Image uploaded:', data.url);
      setImageUri(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const uploadImage = async (uri: string) => {
    console.log('Uploading image:', uri);
    setUploadingImage(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('Image uploaded:', data.url);
      setImageUri(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    console.log('User tapped Create Listing button');

    if (!selectedCropId || !outlet || !price || !quantity) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await authenticatedPost('/api/marketplace/consumer/listings', {
        cropId: selectedCropId,
        outlet,
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        unit,
        description,
        imageKey: imageUri || undefined,
      });

      console.log('Listing created successfully');
      Alert.alert('Success', 'Your listing has been created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadButtonText = Platform.OS === 'web' ? 'Upload Photo' : 'Choose Photo';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Listing',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {loadingCrops ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={farmGreen} />
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>Crop *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
                  {crops.map((crop) => (
                    <TouchableOpacity
                      key={crop.id}
                      style={[
                        styles.cropChip,
                        { 
                          backgroundColor: selectedCropId === crop.id ? farmGreen : colors.card,
                          borderColor: selectedCropId === crop.id ? farmGreen : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedCropId(crop.id)}
                    >
                      <Text
                        style={[
                          styles.cropChipText,
                          { color: selectedCropId === crop.id ? '#fff' : colors.text },
                        ]}
                      >
                        {crop.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>Sales Outlet *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
                  {OUTLETS.map((outletOption) => (
                    <TouchableOpacity
                      key={outletOption}
                      style={[
                        styles.cropChip,
                        { 
                          backgroundColor: outlet === outletOption ? farmGreen : colors.card,
                          borderColor: outlet === outletOption ? farmGreen : colors.border,
                        },
                      ]}
                      onPress={() => setOutlet(outletOption)}
                    >
                      <Text
                        style={[
                          styles.cropChipText,
                          { color: outlet === outletOption ? '#fff' : colors.text },
                        ]}
                      >
                        {outletOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Price per Unit *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor={colors.icon}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Quantity *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="0"
                    placeholderTextColor={colors.icon}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>Unit</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
                  {UNITS.map((unitOption) => (
                    <TouchableOpacity
                      key={unitOption}
                      style={[
                        styles.cropChip,
                        { 
                          backgroundColor: unit === unitOption ? farmGreen : colors.card,
                          borderColor: unit === unitOption ? farmGreen : colors.border,
                        },
                      ]}
                      onPress={() => setUnit(unitOption)}
                    >
                      <Text
                        style={[
                          styles.cropChipText,
                          { color: unit === unitOption ? '#fff' : colors.text },
                        ]}
                      >
                        {unitOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add details about your product..."
                  placeholderTextColor={colors.icon}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>Photo (Optional)</Text>
                {imageUri ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: colors.card }]}
                      onPress={() => setImageUri(null)}
                    >
                      <IconSymbol
                        ios_icon_name="xmark.circle.fill"
                        android_material_icon_name="cancel"
                        size={24}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imageButtons}>
                    <TouchableOpacity
                      style={[styles.imageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={takePhoto}
                      disabled={uploadingImage}
                    >
                      <IconSymbol
                        ios_icon_name="camera.fill"
                        android_material_icon_name="camera"
                        size={24}
                        color={farmGreen}
                      />
                      <Text style={[styles.imageButtonText, { color: colors.text }]}>Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.imageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={pickImage}
                      disabled={uploadingImage}
                    >
                      <IconSymbol
                        ios_icon_name="photo.fill"
                        android_material_icon_name="image"
                        size={24}
                        color={farmGreen}
                      />
                      <Text style={[styles.imageButtonText, { color: colors.text }]}>
                        {uploadButtonText}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {uploadingImage && (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color={farmGreen} />
                    <Text style={[styles.uploadingText, { color: colors.icon }]}>Uploading...</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: farmGreen }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Listing</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showCameraModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <IconSymbol
              ios_icon_name="camera.fill"
              android_material_icon_name="camera"
              size={48}
              color={farmGreen}
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Camera Not Available</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              The camera feature is only available on the mobile app. Please use the &quot;Upload Photo&quot; button to select an image from your computer.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: farmGreen }]}
              onPress={() => setShowCameraModal(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cropScroll: {
    marginTop: 8,
  },
  cropChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  cropChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  inputGroup: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
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
    fontWeight: '500',
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
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 20,
    padding: 4,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/IconSymbol';
import { farmGreen } from '@/constants/Colors';

interface ImageUploadButtonsProps {
  onImageSelected: (uri: string) => Promise<void>;
  disabled?: boolean;
  colors: {
    card: string;
    border: string;
    text: string;
    background: string;
  };
}

export function ImageUploadButtons({ onImageSelected, disabled, colors }: ImageUploadButtonsProps) {
  const [showWebModal, setShowWebModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleTakePhoto = async () => {
    console.log('User tapped Take Photo button');

    // Web: Show modal explaining feature is mobile-only
    if (Platform.OS === 'web') {
      setShowWebModal(true);
      return;
    }

    // Mobile: Request camera permission and launch camera
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
      setUploading(true);
      try {
        await onImageSelected(result.assets[0].uri);
      } finally {
        setUploading(false);
      }
    }
  };

  const handlePickImage = async () => {
    console.log('User tapped Upload Photo button');

    // Web: Use file input
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            setUploading(true);
            try {
              await onImageSelected(dataUrl);
            } finally {
              setUploading(false);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    // Mobile: Request library permission and launch picker
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
      setUploading(true);
      try {
        await onImageSelected(result.assets[0].uri);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <>
      <View style={styles.imageButtons}>
        <TouchableOpacity
          style={[styles.imageButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleTakePhoto}
          disabled={disabled || uploading}
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
          onPress={handlePickImage}
          disabled={disabled || uploading}
        >
          <IconSymbol
            ios_icon_name="photo.fill"
            android_material_icon_name="image"
            size={24}
            color={farmGreen}
          />
          <Text style={[styles.imageButtonText, { color: colors.text }]}>
            {Platform.OS === 'web' ? 'Upload Photo' : 'Choose Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color={farmGreen} />
          <Text style={[styles.uploadingText, { color: colors.text }]}>Uploading...</Text>
        </View>
      )}

      {/* Web Modal for Camera Not Available */}
      <Modal
        visible={showWebModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWebModal(false)}
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
              onPress={() => setShowWebModal(false)}
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

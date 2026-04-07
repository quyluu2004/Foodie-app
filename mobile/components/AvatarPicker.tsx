import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface AvatarPickerProps {
  avatarUri: string | null;
  onAvatarSelected: (uri: string | null) => void;
  size?: number;
}

export default function AvatarPicker({ 
  avatarUri, 
  onAvatarSelected, 
  size = 120 
}: AvatarPickerProps) {
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Quyền truy cập',
        'Cần quyền truy cập thư viện ảnh để chọn avatar.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onAvatarSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2 }]}
        onPress={pickImage}
        activeOpacity={0.8}
      >
        {avatarUri ? (
          <Image 
            source={{ uri: avatarUri }} 
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
            <Ionicons name="person" size={size * 0.5} color="#999" />
          </View>
        )}
        <View style={[styles.editButton, { width: size * 0.35, height: size * 0.35, borderRadius: size * 0.175 }]}>
          <Ionicons name="camera" size={size * 0.2} color="white" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Ionicons name="image-outline" size={20} color="#E53E3E" />
        <Text style={styles.buttonText}>Chọn ảnh từ thư viện</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#E53E3E',
    backgroundColor: '#f8f9fa',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E53E3E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E53E3E',
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#E53E3E',
    fontWeight: '600',
  },
});


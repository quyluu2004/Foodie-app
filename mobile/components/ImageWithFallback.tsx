import React, { useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageWithFallbackProps {
  imageUrl: string | null | undefined;
  style: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholder?: React.ReactNode;
  fallbackIcon?: string;
  fallbackIconSize?: number;
  fallbackIconColor?: string;
  fallbackEmoji?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  imageUrl,
  style,
  resizeMode = 'cover',
  placeholder,
  fallbackIcon = 'restaurant-outline',
  fallbackIconSize = 48,
  fallbackIconColor = '#CCCCCC',
  fallbackEmoji,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Fix common URL typos (httpps:// -> https://) before processing
  const fixedImageUrl = React.useMemo(() => {
    if (!imageUrl) return null;
    // Fix httpps:// typo
    if (imageUrl.includes('httpps://')) {
      const fixed = imageUrl.replace(/httpps:\/\//gi, 'https://');
      if (__DEV__) {
        console.warn('🔧 [ImageWithFallback] Fixed URL typo:', imageUrl.substring(0, 50), '->', fixed.substring(0, 50));
      }
      return fixed;
    }
    return imageUrl;
  }, [imageUrl]);

  // Debug: Log imageUrl in development
  React.useEffect(() => {
    if (__DEV__ && fixedImageUrl) {
      console.log('🖼️ [ImageWithFallback] Image URL:', fixedImageUrl?.substring(0, 100));
    }
  }, [fixedImageUrl]);

  if (!fixedImageUrl || fixedImageUrl.trim() === '') {
    if (__DEV__) {
      console.warn('⚠️ [ImageWithFallback] No imageUrl provided');
    }
    return (
      <View style={[style, styles.placeholderContainer]}>
        {placeholder || (
          fallbackEmoji ? (
            <Text style={styles.emojiText}>{fallbackEmoji}</Text>
          ) : (
            <Ionicons name={fallbackIcon} size={fallbackIconSize} color={fallbackIconColor} />
          )
        )}
      </View>
    );
  }

  if (imageError) {
    return (
      <View style={[style, styles.placeholderContainer]}>
        {placeholder || (
          fallbackEmoji ? (
            <Text style={styles.emojiText}>{fallbackEmoji}</Text>
          ) : (
            <Ionicons name={fallbackIcon} size={fallbackIconSize} color={fallbackIconColor} />
          )
        )}
      </View>
    );
  }

  return (
    <View style={style}>
      {imageLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#FF8C42" />
        </View>
      )}
      <Image
        source={{ 
          uri: fixedImageUrl,
          cache: 'default' // Allow caching for better performance
        }}
        style={style}
        resizeMode={resizeMode}
        onError={(error) => {
          if (__DEV__) {
            console.warn('⚠️ [ImageWithFallback] Failed to load:', fixedImageUrl?.substring(0, 100));
            console.warn('⚠️ [ImageWithFallback] Error details:', error.nativeEvent?.error || error);
          }
          setImageError(true);
          setImageLoading(false);
        }}
        onLoad={() => {
          if (__DEV__) {
            console.log('✅ [ImageWithFallback] Image loaded successfully');
          }
          setImageLoading(false);
        }}
        onLoadStart={() => {
          setImageLoading(true);
          setImageError(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 48,
  },
});


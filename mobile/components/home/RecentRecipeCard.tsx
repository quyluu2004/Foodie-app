import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeSaves, Recipe } from '@/hooks/useRecipes';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { formatTime } from './types';
import { getRecentCardWidthFor } from './homeLayout';

interface Props {
    recipe: Recipe;
    onPress: (id: string) => void;
}

export const RecentRecipeCard = ({ recipe, onPress }: Props) => {
    const { width: windowWidth } = useWindowDimensions();
    const cardW = getRecentCardWidthFor(windowWidth);
    const imageH = Math.round(cardW * 0.82);

    const { isSaved, toggleSave } = useRecipeSaves(recipe._id);

    return (
        <TouchableOpacity
            style={[styles.recentCard, { width: cardW }]}
            onPress={() => onPress(recipe._id)}
            activeOpacity={0.92}
        >
            <View style={[styles.recentImageContainer, { height: imageH }]}>
                <ImageWithFallback
                    imageUrl={
                        recipe.mediaType === 'video' && recipe.videoThumbnail
                            ? recipe.videoThumbnail
                            : normalizeImageUrl(recipe.imageUrl, recipe.updatedAt) || recipe.imageUrl
                    }
                    style={styles.recentImage}
                    resizeMode="cover"
                    fallbackEmoji="🍽️"
                />
                <TouchableOpacity
                    style={styles.recentBookmark}
                    onPress={(e) => { e.stopPropagation(); toggleSave(); }}
                >
                    <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={17} color="#FF8C42" />
                </TouchableOpacity>
            </View>
            <View style={styles.recentInfo}>
                <View style={styles.recentMetaRow}>
                    <Ionicons name="time-outline" size={13} color="#888" />
                    <Text style={styles.recentTime}>{formatTime(recipe.cookTimeMinutes || recipe.time)}</Text>
                </View>
                <Text style={styles.recentTitle} numberOfLines={2}>{recipe.title}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    recentCard: {
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 3,
    },
    recentImageContainer: { width: '100%', position: 'relative', backgroundColor: '#F5F5F5' },
    recentImage: { width: '100%', height: '100%' },
    recentBookmark: {
        position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    recentInfo: { padding: 12 },
    recentMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    recentTime: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#666' },
    recentTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#1A1A1A', lineHeight: 20 },
});

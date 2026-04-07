import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/hooks/useRecipes';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ImageWithFallback } from '@/components/ImageWithFallback';

interface Props {
    recipe: Recipe;
    onPress: (id: string) => void;
}

export const SearchResultItem = ({ recipe, onPress }: Props) => {
    const categoryObj = typeof recipe.category === 'object' ? recipe.category : null;
    const categoryName = recipe.categoryName || categoryObj?.name || (typeof recipe.category === 'string' ? recipe.category : 'Công thức');
    const cookTime = recipe.cookTimeMinutes || recipe.time || 0;
    const rating = recipe.averageRating || 0;
    const ratingCount = recipe.ratingCount || 0;

    return (
        <TouchableOpacity
            style={styles.searchResultItem}
            onPress={() => onPress(recipe._id)}
            activeOpacity={0.7}
        >
            <View style={styles.searchResultImageContainer}>
                <ImageWithFallback
                    imageUrl={
                        recipe.mediaType === 'video' && recipe.videoThumbnail
                            ? recipe.videoThumbnail
                            : normalizeImageUrl(recipe.imageUrl, recipe.updatedAt) || recipe.imageUrl
                    }
                    style={styles.searchResultImage}
                    resizeMode="cover"
                    fallbackIcon="restaurant-outline"
                    fallbackIconSize={32}
                />
            </View>
            <View style={styles.searchResultContent}>
                <Text style={styles.searchResultTitle} numberOfLines={1}>{recipe.title}</Text>
                <View style={styles.searchResultMeta}>
                    <Text style={styles.searchResultSubtitle} numberOfLines={1}>{categoryName}</Text>
                    {cookTime > 0 && (
                        <>
                            <Text style={styles.searchResultSeparator}>•</Text>
                            <Text style={styles.searchResultSubtitle}>{cookTime} phút</Text>
                        </>
                    )}
                    {rating > 0 && (
                        <>
                            <Text style={styles.searchResultSeparator}>•</Text>
                            <View style={styles.searchResultRating}>
                                <Ionicons name="star" size={12} color="#FFD700" />
                                <Text style={styles.searchResultRatingText}>
                                    {rating.toFixed(1)} ({ratingCount})
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    searchResultItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
        paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    searchResultImageContainer: {
        width: 56, height: 56, borderRadius: 12, overflow: 'hidden',
        marginRight: 12, backgroundColor: '#F5F5F5',
    },
    searchResultImage: { width: '100%', height: '100%' },
    searchResultContent: { flex: 1, justifyContent: 'center' },
    searchResultTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold', color: '#1A1A1A', marginBottom: 4 },
    searchResultMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    searchResultSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#666' },
    searchResultSeparator: { fontSize: 13, color: '#CCCCCC' },
    searchResultRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    searchResultRatingText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#666' },
});

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeSaves } from '@/hooks/useRecipes';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { formatTime, getRatingPercentage } from './types';
import { getRecipeCardWidthFor, getRecipeCardImageHeight } from './homeLayout';

interface Props {
    recipe: any;
    /** Giữ tương thích gọi từ map(..., index) */
    index?: number;
    onPress: (id: string) => void;
}

export const RecipeCard = ({ recipe, onPress }: Props) => {
    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = getRecipeCardWidthFor(windowWidth);
    const imageHeight = getRecipeCardImageHeight(cardWidth);

    const { isSaved, toggleSave } = useRecipeSaves(recipe._id);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 300 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const getDifficultyTag = () => {
        const difficulty = recipe.difficulty?.toLowerCase() || '';
        if (difficulty.includes('dễ') || difficulty.includes('easy')) {
            return { label: 'Dễ', color: '#2D9D78' };
        }
        if (difficulty.includes('trung')) {
            return { label: 'TB', color: '#E8A849' };
        }
        if (difficulty.includes('khó') || difficulty.includes('hard')) {
            return { label: 'Khó', color: '#D64545' };
        }
        if (difficulty.includes('một nồi') || recipe.title?.toLowerCase().includes('one-pot')) {
            return { label: 'Một nồi', color: '#5B8DEF' };
        }
        return null;
    };

    const tag = getDifficultyTag();

    return (
        <Animated.View style={[animatedStyle, { width: cardWidth }]}>
            <TouchableOpacity
                style={[styles.recipeCard, { width: cardWidth }]}
                onPress={() => onPress(recipe._id)}
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
                activeOpacity={0.92}
            >
                <View style={[styles.recipeImageContainer, { width: cardWidth, height: imageHeight }]}>
                    <ImageWithFallback
                        imageUrl={
                            (recipe.videoThumbnail || (recipe.mediaType === 'video' && recipe.videoUrl))
                                ? normalizeImageUrl(recipe.videoThumbnail, recipe.updatedAt) || recipe.videoThumbnail
                                : normalizeImageUrl(recipe.imageUrl, recipe.updatedAt) || recipe.imageUrl
                        }
                        style={styles.recipeImage}
                        resizeMode="cover"
                        fallbackEmoji="🍽️"
                    />
                    {tag && (
                        <View style={[styles.recipeTag, { backgroundColor: tag.color }]}>
                            <Text style={styles.recipeTagText}>{tag.label}</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.recipeBookmark}
                        onPress={(e) => { e.stopPropagation(); toggleSave(); }}
                    >
                        <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color="#FF8C42" />
                    </TouchableOpacity>
                </View>
                <View style={[styles.recipeInfo, { width: cardWidth }]}>
                    <View style={styles.recipeMeta}>
                        <Ionicons name="time-outline" size={14} color="#888" />
                        <Text style={styles.recipeTime}>{formatTime(recipe.cookTimeMinutes || recipe.time)}</Text>
                        <View style={styles.recipeRating}>
                            <Ionicons name="heart" size={13} color="#FF8C42" />
                            <Text style={styles.recipeRatingText}>{getRatingPercentage(recipe)}%</Text>
                        </View>
                    </View>
                    <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    recipeCard: {
        marginRight: 14,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    recipeImageContainer: {
        position: 'relative',
        backgroundColor: '#F5F5F5',
    },
    recipeImage: { width: '100%', height: '100%' },
    recipeTag: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    recipeTagText: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
    recipeBookmark: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    recipeInfo: { padding: 14, paddingTop: 12 },
    recipeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    recipeTime: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#666', flex: 1 },
    recipeRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    recipeRatingText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_600SemiBold', color: '#FF8C42' },
    recipeTitle: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Poppins_700Bold',
        color: '#1A1A1A',
        lineHeight: 22,
    },
});

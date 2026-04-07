import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRecipeSaves, Recipe } from '@/hooks/useRecipes';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { formatTime, getRatingPercentage } from './types';
import { MAX_HOME_CONTENT_WIDTH } from './homeLayout';

interface Props {
    recipe: Recipe;
    onPress: (id: string) => void;
}

export const FeaturedRecipeCard = ({ recipe, onPress }: Props) => {
    if (!recipe) return null;
    const { width: windowWidth } = useWindowDimensions();
    const contentW = Platform.OS === 'web' ? Math.min(windowWidth, MAX_HOME_CONTENT_WIDTH) : windowWidth;
    const heroHeight = Math.round(Math.min(contentW - 32, 420) * 0.58);

    const { isSaved, toggleSave } = useRecipeSaves(recipe._id);
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const titleDisplay = recipe.title?.trim() || 'Công thức nổi bật';

    return (
        <Animated.View style={animatedStyle}>
            <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => onPress(recipe._id)}
                onPressIn={() => (scale.value = withSpring(0.985))}
                onPressOut={() => (scale.value = withSpring(1))}
                activeOpacity={0.95}
            >
                <View style={[styles.featuredImageContainer, { height: Math.max(heroHeight, 220) }]}>
                    <ImageWithFallback
                        imageUrl={
                            recipe.mediaType === 'video' && recipe.videoThumbnail
                                ? recipe.videoThumbnail
                                : normalizeImageUrl(recipe.imageUrl, recipe.updatedAt) || recipe.imageUrl
                        }
                        style={styles.featuredImage}
                        resizeMode="cover"
                        fallbackEmoji="🍽️"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)']}
                        locations={[0, 0.45, 1]}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.featuredOverlayText}>
                        <Text style={styles.featuredBadge}>Gợi ý hôm nay</Text>
                        <Text style={styles.featuredOverlayName} numberOfLines={2}>{titleDisplay}</Text>
                        <View style={styles.featuredRow}>
                            <Ionicons name="time-outline" size={15} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.featuredMeta}>{formatTime(recipe.cookTimeMinutes || recipe.time)}</Text>
                            <Text style={styles.featuredDot}>·</Text>
                            <Text style={styles.featuredMeta}>{recipe.difficulty || 'Dễ'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.featuredBookmark}
                        onPress={(e) => { e.stopPropagation(); toggleSave(); }}
                    >
                        <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color="#FF8C42" />
                    </TouchableOpacity>
                </View>
                <View style={styles.featuredInfo}>
                    <View style={styles.featuredMetaBottom}>
                        <View style={styles.ratingPill}>
                            <Ionicons name="heart" size={14} color="#FF8C42" />
                            <Text style={styles.featuredRatingText}>{getRatingPercentage(recipe)}% yêu thích</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    featuredCard: {
        marginHorizontal: 16,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    featuredImageContainer: { width: '100%', position: 'relative' },
    featuredImage: { width: '100%', height: '100%' },
    featuredOverlayText: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 18,
    },
    featuredBadge: {
        alignSelf: 'flex-start',
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Inter_600SemiBold',
        color: '#1A1A1A',
        backgroundColor: 'rgba(255,230,200,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    featuredOverlayName: {
        fontSize: 22,
        fontWeight: '700',
        fontFamily: 'Poppins_700Bold',
        color: '#FFFFFF',
        lineHeight: 28,
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
    },
    featuredRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
    featuredMeta: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.92)' },
    featuredDot: { color: 'rgba(255,255,255,0.6)', marginHorizontal: 8, fontSize: 14 },
    featuredBookmark: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
    },
    featuredInfo: { paddingVertical: 14, paddingHorizontal: 18, backgroundColor: '#FFFBF8' },
    featuredMetaBottom: { flexDirection: 'row', alignItems: 'center' },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFF5EE',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    featuredRatingText: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', color: '#C45C2C' },
});

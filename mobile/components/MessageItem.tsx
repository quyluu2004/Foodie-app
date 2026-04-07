import React, { memo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatBubble } from './ChatBubble';
import { ImageWithFallback } from './ImageWithFallback';
import { router } from 'expo-router';
import { normalizeImageUrl } from '@/utils/imageUrl';

const { width } = Dimensions.get('window');
const RECIPE_CARD_WIDTH = width * 0.7;

interface Recipe {
    _id: string;
    title: string;
    imageUrl?: string;
    updatedAt?: string | Date;
    cookTimeMinutes?: number;
    averageRating?: number;
    ratingCount?: number;
    difficulty?: string;
    mediaType?: 'image' | 'video';
    videoThumbnail?: string;
    videoUrl?: string;
}

interface MessageItemProps {
    item: {
        id: string;
        text: string;
        isUser: boolean;
        timestamp: Date;
        recipeIds?: string[];
        imageUri?: string;
    };
    recipes: { [key: string]: Recipe };
    formatTime: (date: Date) => string;
}

export const MessageItem = memo(({ item, recipes, formatTime }: MessageItemProps) => {
    return (
        <View style={item.isUser ? styles.userMessageContainer : styles.aiMessageContainer}>
            {/* User Uploaded Image */}
            {item.imageUri && item.isUser && (
                <View style={styles.userImageContainer}>
                    <Image source={{ uri: item.imageUri }} style={styles.userImage} resizeMode="cover" />
                </View>
            )}

            {/* Message Text Bubble */}
            {item.text && item.text.length > 0 && (
                <ChatBubble
                    message={item.text}
                    isUser={item.isUser}
                    timestamp={formatTime(item.timestamp)}
                />
            )}

            {/* Recipe Cards Carousel (AI Only) */}
            {!item.isUser && item.recipeIds && item.recipeIds.length > 0 && (
                <View style={styles.recipeCardsContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.recipeCardsScroll}
                        removeClippedSubviews={true} // Optimization for Android
                    >
                        {item.recipeIds.map((recipeId) => {
                            const recipe = recipes[recipeId];

                            // Loading State Placeholder
                            if (!recipe) {
                                return (
                                    <View key={recipeId} style={styles.loadingCard}>
                                        <ActivityIndicator size="small" color="#FF8C42" />
                                    </View>
                                );
                            }

                            // Render Card
                            return (
                                <TouchableOpacity
                                    key={recipeId}
                                    style={styles.recipeCard}
                                    onPress={() => router.push(`/modal?id=${recipeId}`)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.recipeImageContainer}>
                                        <ImageWithFallback
                                            imageUrl={
                                                recipe.mediaType === 'video' && recipe.videoThumbnail
                                                    ? recipe.videoThumbnail
                                                    : normalizeImageUrl(recipe.imageUrl, recipe.updatedAt) || recipe.imageUrl
                                            }
                                            style={styles.recipeImage}
                                            resizeMode="cover"
                                            fallbackEmoji="🍽️"
                                        />
                                    </View>
                                    <View style={styles.recipeInfo}>
                                        <Text style={styles.recipeTitle} numberOfLines={2}>
                                            {recipe.title || 'Công thức'}
                                        </Text>
                                        <View style={styles.recipeMeta}>
                                            <View style={styles.recipeMetaItem}>
                                                <Ionicons name="time-outline" size={14} color="#6B7280" />
                                                <Text style={styles.recipeMetaText}>
                                                    {recipe.cookTimeMinutes || 'N/A'} phút
                                                </Text>
                                            </View>
                                            {recipe.difficulty && (
                                                <View style={styles.recipeMetaItem}>
                                                    <Ionicons name="flag-outline" size={14} color="#6B7280" />
                                                    <Text style={styles.recipeMetaText}>
                                                        {recipe.difficulty}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}, (prevProps, nextProps) => {
    // Custom memo comparison to prevent unnecessary re-renders
    // Re-render if message ID changed, text changed, or if recipes loaded (recipeIds present in nextProps but not fully loaded in prevProps)
    if (prevProps.item.id !== nextProps.item.id) return false;
    if (prevProps.item.text !== nextProps.item.text) return false;

    // Check if recipes updated for this item
    if (nextProps.item.recipeIds) {
        const prevRecipesMissing = nextProps.item.recipeIds.some(id => !prevProps.recipes[id]);
        const nextRecipesLoaded = nextProps.item.recipeIds.some(id => nextProps.recipes[id]);
        if (prevRecipesMissing && nextRecipesLoaded) return false; // Need update
    }

    return true;
});

const styles = StyleSheet.create({
    userMessageContainer: {
        alignItems: 'flex-end',
        marginBottom: 16,
        paddingHorizontal: 16,
        width: '100%',
    },
    aiMessageContainer: {
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingHorizontal: 16,
        width: '100%',
    },
    userImageContainer: {
        marginRight: 16,
        marginBottom: 8,
        borderRadius: 12,
        overflow: 'hidden',
        maxWidth: width * 0.7,
    },
    userImage: {
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: 12,
    },
    recipeCardsContainer: {
        marginTop: 8,
        width: '100%',
    },
    recipeCardsScroll: {
        paddingRight: 16,
        paddingBottom: 4, // Avoid shadow clipping
        gap: 12,
    },
    recipeCard: {
        width: RECIPE_CARD_WIDTH,
        height: 280,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    loadingCard: {
        width: RECIPE_CARD_WIDTH,
        height: 280,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recipeImageContainer: {
        width: '100%',
        height: 180,
        backgroundColor: '#F0F0F0',
    },
    recipeImage: {
        width: '100%',
        height: '100%',
    },
    recipeInfo: {
        padding: 12,
        flex: 1,
        justifyContent: 'center',
    },
    recipeTitle: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Poppins_700Bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    recipeMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    recipeMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    recipeMetaText: {
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        color: '#6B7280',
    },
});

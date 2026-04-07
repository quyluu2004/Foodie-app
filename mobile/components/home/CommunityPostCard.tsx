import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { normalizeImageUrl } from '@/utils/imageUrl';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Post } from './types';
import { getRecipeCardWidthFor, getRecipeCardImageHeight } from './homeLayout';

interface Props {
    post: Post;
}

export const CommunityPostCard = ({ post }: Props) => {
    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = getRecipeCardWidthFor(windowWidth);
    const imageHeight = Math.round(getRecipeCardImageHeight(cardWidth) * 0.92);

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const caption =
      post.caption?.trim() ||
      (post as { title?: string }).title?.trim() ||
      '';

    return (
        <Animated.View style={[animatedStyle, { width: cardWidth }]}>
            <TouchableOpacity
                style={[styles.communityCard, { width: cardWidth }]}
                onPress={() => router.push(`/post-detail?id=${post._id}`)}
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
                activeOpacity={0.92}
            >
                {post.imageUrl ? (
                    <Image
                        source={{ uri: normalizeImageUrl(post.imageUrl, post.updatedAt) || post.imageUrl }}
                        style={[styles.communityImage, { width: cardWidth, height: imageHeight }]}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.communityPlaceholder, { width: cardWidth, height: imageHeight }]}>
                        <Text style={styles.placeholderEmoji}>📷</Text>
                    </View>
                )}
                {!!caption && (
                    <View style={styles.captionBar}>
                        <Text style={styles.captionText} numberOfLines={2}>{caption}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    communityCard: {
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
    communityImage: { backgroundColor: '#F5F5F5' },
    communityPlaceholder: {
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: { fontSize: 36, opacity: 0.5 },
    captionBar: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#FAFAFA',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    captionText: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
        color: '#333',
        lineHeight: 19,
    },
});

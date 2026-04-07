import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Category } from './types';
import { getCategoryCardWidthFor } from './homeLayout';

interface Props {
    category: Category;
    sectionId?: string;
}

export const CategoryCard = ({ category, sectionId }: Props) => {
    const { width: windowWidth } = useWindowDimensions();
    const cardW = getCategoryCardWidthFor(windowWidth);
    const imageH = Math.round(cardW * 0.78);

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
        router.push({
            pathname: '/section-recipes',
            params: {
                title: category.title || category.name || '',
                subCategoryId: category.id || category._id || '',
                sectionId: sectionId || '',
            }
        });
    };

    const recipesArray = Array.isArray(category.recipes) ? category.recipes : [];
    const firstRecipe = recipesArray.length > 0
        ? (typeof recipesArray[0] === 'object' ? recipesArray[0] as any : null)
        : null;
    const recipeImage = firstRecipe?.imageUrl || firstRecipe?.image || category.imageUrl;
    const recipeCount = Array.isArray(category.recipes) ? category.recipes.length : (typeof category.recipes === 'number' ? category.recipes : category.recipeCount || 0);

    const borderColor = category.style?.borderColor || '#E8D5C4';
    const borderWidth = category.style?.borderWidth ?? 1;
    const borderRadius = category.style?.borderRadius ?? 18;

    const layerOffset = category.style?.backgroundLayer?.enabled ? (category.style.backgroundLayer.offset || 6) : 0;
    const layerColor = category.style?.backgroundLayer?.color || '#FFE8D6';
    const layerBorderRadius = category.style?.backgroundLayer?.borderRadius || 18;

    const layerStyle = category.style?.backgroundLayer?.enabled
        ? {
            position: 'absolute' as const,
            top: layerOffset, left: layerOffset, right: -layerOffset, bottom: -layerOffset,
            backgroundColor: layerColor, borderRadius: layerBorderRadius, zIndex: 0,
        }
        : null;

    return (
        <Animated.View style={[animatedStyle, { marginRight: 12 }]}>
            <View style={{ position: 'relative' }}>
                {layerStyle && <View style={layerStyle} />}
                <TouchableOpacity
                    style={[styles.categoryCardNew, {
                        width: cardW,
                        borderWidth, borderColor, borderRadius,
                        position: 'relative' as const, zIndex: 1,
                        backgroundColor: '#FFFFFF', overflow: 'hidden' as const,
                    }]}
                    onPress={handlePress}
                    onPressIn={() => (scale.value = withSpring(0.96))}
                    onPressOut={() => (scale.value = withSpring(1))}
                    activeOpacity={0.92}
                >
                    <View style={[styles.categoryImageContainerNew, { height: imageH }]}>
                        <ImageWithFallback
                            imageUrl={normalizeImageUrl(recipeImage) || recipeImage}
                            style={styles.categoryImageNew}
                            resizeMode="cover"
                            fallbackEmoji={category.icon || '🍽️'}
                            placeholder={
                                <View style={[styles.categoryImagePlaceholderNew, { backgroundColor: (category.color || '#FF8C42') + '18' }]}>
                                    <Text style={styles.categoryImageEmoji}>{category.icon || '🍽️'}</Text>
                                </View>
                            }
                        />
                        {recipeCount > 0 && (
                            <View style={styles.categoryRecipeTag}>
                                <Text style={styles.categoryRecipeTagText}>{recipeCount} món</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.categoryTitleContainerNew}>
                        <Text style={styles.categoryTitleNew} numberOfLines={2}>{category.title}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    categoryCardNew: { overflow: 'hidden' },
    categoryImageContainerNew: { width: '100%', position: 'relative' },
    categoryImageNew: { width: '100%', height: '100%' },
    categoryImagePlaceholderNew: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    categoryImageEmoji: { fontSize: 52 },
    categoryRecipeTag: {
        position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
        borderWidth: 1, borderColor: '#F0E8E0',
    },
    categoryRecipeTagText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_600SemiBold', color: '#5C4033' },
    categoryTitleContainerNew: { padding: 12, paddingTop: 10 },
    categoryTitleNew: { fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#1A1A1A', textAlign: 'left', lineHeight: 20 },
});

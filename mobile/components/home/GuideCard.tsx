import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SpecialGuide } from './types';

interface Props {
    guide: SpecialGuide;
}

export const GuideCard = ({ guide }: Props) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <TouchableOpacity
                style={[styles.guideCard, { borderLeftColor: guide.color }]}
                onPress={() => router.push(`/(tabs)/recipes?guide=${guide.id}`)}
                onPressIn={() => (scale.value = withSpring(0.98))}
                onPressOut={() => (scale.value = withSpring(1))}
                activeOpacity={0.9}
            >
                <Text style={styles.guideImage}>{guide.image}</Text>
                <View style={styles.guideInfo}>
                    <Text style={styles.guideTitle}>{guide.title}</Text>
                    <Text style={styles.guideDescription} numberOfLines={2}>{guide.description}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    guideCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderRadius: 18, padding: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: '#F0F0F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    },
    guideImage: { fontSize: 40, marginRight: 16 },
    guideInfo: { flex: 1 },
    guideTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#1A1A1A', marginBottom: 4 },
    guideDescription: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#666', lineHeight: 20 },
});

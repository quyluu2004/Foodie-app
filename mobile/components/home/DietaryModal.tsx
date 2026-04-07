import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DIETARY_DIETS, INGREDIENTS_TO_AVOID } from './types';

interface Props {
    visible: boolean;
    selectedDiets: string[];
    selectedIngredients: string[];
    onChangeDiets: (diets: string[]) => void;
    onChangeIngredients: (ingredients: string[]) => void;
    onClose: () => void;
}

export const DietaryModal = ({
    visible, selectedDiets, selectedIngredients,
    onChangeDiets, onChangeIngredients, onClose,
}: Props) => {
    const toggleDiet = (id: string) => {
        if (selectedDiets.includes(id)) {
            onChangeDiets(selectedDiets.filter(d => d !== id));
        } else {
            onChangeDiets([...selectedDiets, id]);
        }
    };

    const toggleIngredient = (id: string) => {
        if (selectedIngredients.includes(id)) {
            onChangeIngredients(selectedIngredients.filter(i => i !== id));
        } else {
            onChangeIngredients([...selectedIngredients, id]);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer} edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.modalHeader}>
                    <TouchableOpacity style={styles.modalBackButton} onPress={onClose}>
                        <Ionicons name="arrow-back" size={24} color="#FF8C42" />
                        <Text style={styles.modalBackText}>Khám phá</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Tùy chọn dinh dưỡng</Text>
                    <View style={styles.modalHeaderRight} />
                </View>

                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
                    <Text style={styles.modalDescription}>
                        Chúng tôi sẽ chỉ hiển thị các công thức phù hợp với tùy chọn của bạn trên trang chủ. Bạn vẫn có thể xem tất cả các công thức mà cộng đồng Foodie đang làm, ngay cả khi chúng không phù hợp với chế độ ăn của bạn.
                    </Text>

                    {/* Chế độ ăn */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Chế độ ăn</Text>
                        <View style={styles.chipsContainer}>
                            {DIETARY_DIETS.map((diet) => {
                                const isSelected = selectedDiets.includes(diet.id);
                                return (
                                    <TouchableOpacity
                                        key={diet.id}
                                        style={[styles.dietChip, isSelected && styles.dietChipSelected]}
                                        onPress={() => toggleDiet(diet.id)}
                                    >
                                        <Text style={[styles.dietChipText, isSelected && styles.dietChipTextSelected]}>{diet.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Nguyên liệu cần tránh */}
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Nguyên liệu cần tránh</Text>
                        <View style={styles.chipsContainer}>
                            {INGREDIENTS_TO_AVOID.map((ingredient) => {
                                const isSelected = selectedIngredients.includes(ingredient.id);
                                return (
                                    <TouchableOpacity
                                        key={ingredient.id}
                                        style={[styles.dietChip, isSelected && styles.dietChipSelected]}
                                        onPress={() => toggleIngredient(ingredient.id)}
                                    >
                                        <Text style={[styles.dietChipText, isSelected && styles.dietChipTextSelected]}>{ingredient.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Text style={styles.modalCloseButtonText}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    modalBackButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modalBackText: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold', color: '#FF8C42' },
    modalTitle: {
        fontSize: 18, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#FF8C42', flex: 1, textAlign: 'center',
    },
    modalHeaderRight: { width: 80 },
    modalScrollView: { flex: 1 },
    modalScrollContent: { paddingBottom: 40 },
    modalDescription: {
        fontSize: 15, fontFamily: 'Inter_400Regular', color: '#1A1A1A',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, lineHeight: 22,
    },
    modalSection: { paddingHorizontal: 20, marginBottom: 32 },
    modalSectionTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Poppins_700Bold', color: '#1A1A1A', marginBottom: 16 },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    dietChip: {
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20,
        backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#FF8C42', minWidth: 100, alignItems: 'center',
    },
    dietChipSelected: { backgroundColor: '#FF8C42' },
    dietChipText: { fontSize: 15, fontWeight: '500', fontFamily: 'Inter_500Medium', color: '#1A1A1A' },
    dietChipTextSelected: { color: '#FFFFFF', fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
    modalFooter: {
        paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#FFFFFF',
    },
    modalCloseButton: {
        backgroundColor: '#FF8C42', paddingVertical: 14, paddingHorizontal: 32,
        borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    },
    modalCloseButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});

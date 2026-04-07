// Type definitions dùng chung cho Home Screen components
import { Recipe } from '@/hooks/useRecipes';

export interface Category {
    _id?: string;
    id?: string;
    name?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    icon?: string;
    color?: string;
    recipes?: number | string[] | any[];
    recipeCount?: number;
    style?: {
        borderWidth?: number;
        borderColor?: string;
        borderRadius?: number;
        backgroundColor?: string;
        backgroundLayer?: {
            enabled?: boolean;
            offset?: number;
            color?: string;
            borderRadius?: number;
        };
    };
    gradient?: string[];
}

export interface Post {
    _id: string;
    imageUrl?: string;
    caption?: string;
    author?: {
        _id: string;
        name: string;
        avatarUrl?: string;
    };
    likes?: string[];
    comments?: any[];
    createdAt?: string;
    updatedAt?: string;
}

export interface SpecialGuide {
    id: string;
    title: string;
    description: string;
    image: string;
    color: string;
}

// Constants
export const DIETARY_DIETS = [
    { id: 'vegetarian', label: 'Chay', icon: 'flower' },
];

export const INGREDIENTS_TO_AVOID = [
    { id: 'pork', label: 'Thịt heo', icon: 'ellipse' },
    { id: 'beef', label: 'Thịt bò', icon: 'ellipse' },
    { id: 'chicken', label: 'Thịt gà', icon: 'ellipse' },
    { id: 'seafood', label: 'Hải sản', icon: 'ellipse' },
    { id: 'eggs', label: 'Trứng', icon: 'ellipse' },
    { id: 'dairy', label: 'Sữa', icon: 'ellipse' },
    { id: 'peanuts', label: 'Đậu phộng', icon: 'ellipse' },
    { id: 'soy', label: 'Đậu nành', icon: 'ellipse' },
    { id: 'gluten', label: 'Gluten', icon: 'ellipse' },
];

export const DIETARY_FILTERS = [
    { id: 'all', label: 'Tất cả', icon: 'restaurant', color: '#FF8C42' },
    { id: 'vegan', label: 'Thuần chay', icon: 'leaf', color: '#4ECDC4' },
    { id: 'gluten-free', label: 'Không gluten', icon: 'nutrition', color: '#FFE66D' },
    { id: 'keto', label: 'Keto', icon: 'flame', color: '#FF6B6B' },
    { id: 'low-carb', label: 'Ít tinh bột', icon: 'barbell', color: '#95E1D3' },
    { id: 'vegetarian', label: 'Chay', icon: 'flower', color: '#A7F3D0' },
];

export const RECIPE_CATEGORIES = [
    { id: 'cozy-meals', title: 'Món xẽ', subtitle: '', icon: '🌙', color: '#FFB6C1', gradient: ['#FFB6C1', '#FFC0CB'] },
    { id: 'easy-recipes', title: 'Ăn vặt tối', subtitle: '', icon: '⚡', color: '#87CEEB', gradient: ['#87CEEB', '#ADD8E6'] },
    { id: 'one-pot', title: 'Món chay', subtitle: '', icon: '🍲', color: '#90EE90', gradient: ['#90EE90', '#98FB98'] },
    { id: 'quick-meals', title: 'Món nướng', subtitle: '', icon: '🔥', color: '#FF8C42', gradient: ['#FF8C42', '#FFA366'] },
];

export const SPECIAL_GUIDES: SpecialGuide[] = [
    { id: 'slow-cooker', title: 'Món nấu chậm', description: 'Mọi người đang chia sẻ những món ăn họ làm trong nồi nấu chậm', image: '🍲', color: '#FF6B6B' },
    { id: 'meal-prep', title: 'Mẹo chuẩn bị bữa ăn', description: 'Mẹo chuẩn bị bữa ăn cho cả tuần', image: '🥘', color: '#4ECDC4' },
];

// Helper functions
export const formatTime = (minutes: number | string | undefined): string => {
    if (!minutes) return '0 phút';
    const mins = typeof minutes === 'string' ? parseInt(minutes) : minutes;
    if (isNaN(mins)) return '0 phút';
    if (mins < 60) return `${mins} phút`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}p` : `${hours} giờ`;
};

export const getRatingPercentage = (recipe: any): number => {
    const rating = recipe.averageRating || recipe.rating || 0;
    return Math.round((rating / 5) * 100);
};

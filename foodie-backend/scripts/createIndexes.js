/**
 * Database Indexes
 * Script tạo compound indexes để tối ưu query performance
 * Chạy: node scripts/createIndexes.js
 */

import '../src/config/env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';

const createIndexes = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        console.log('📊 Đang tạo database indexes...\n');

        const db = mongoose.connection.db;

        // ========== RECIPE INDEXES ==========
        const recipes = db.collection('recipes');

        // Tìm kiếm theo category + sắp xếp theo rating
        await recipes.createIndex(
            { category: 1, averageRating: -1 },
            { name: 'idx_recipe_category_rating', background: true }
        );
        console.log('  ✅ recipes: category + rating');

        // Tìm kiếm theo author + sắp xếp theo ngày tạo
        await recipes.createIndex(
            { author: 1, createdAt: -1 },
            { name: 'idx_recipe_author_date', background: true }
        );
        console.log('  ✅ recipes: author + date');

        // Full text search trên title, description
        await recipes.createIndex(
            { title: 'text', description: 'text', tags: 'text' },
            { name: 'idx_recipe_text_search', background: true, default_language: 'none' }
        );
        console.log('  ✅ recipes: text search (title, description, tags)');

        // Sắp xếp theo mới nhất
        await recipes.createIndex(
            { createdAt: -1 },
            { name: 'idx_recipe_created', background: true }
        );
        console.log('  ✅ recipes: createdAt');

        // Trạng thái + ngày tạo (cho admin)
        await recipes.createIndex(
            { status: 1, createdAt: -1 },
            { name: 'idx_recipe_status_date', background: true }
        );
        console.log('  ✅ recipes: status + date');

        // ========== POST INDEXES ==========
        const posts = db.collection('posts');

        await posts.createIndex(
            { author: 1, createdAt: -1 },
            { name: 'idx_post_author_date', background: true }
        );
        console.log('  ✅ posts: author + date');

        await posts.createIndex(
            { createdAt: -1 },
            { name: 'idx_post_created', background: true }
        );
        console.log('  ✅ posts: createdAt');

        // ========== COMMENT INDEXES ==========
        const comments = db.collection('comments');

        // Tìm comments theo recipe/post
        await comments.createIndex(
            { targetType: 1, targetId: 1, createdAt: -1 },
            { name: 'idx_comment_target', background: true }
        );
        console.log('  ✅ comments: target + date');

        // ========== FAVORITE INDEXES ==========
        const favorites = db.collection('favorites');

        // Unique compound index cho user + recipe
        await favorites.createIndex(
            { user: 1, recipe: 1 },
            { name: 'idx_favorite_user_recipe', unique: true, background: true }
        );
        console.log('  ✅ favorites: user + recipe (unique)');

        // ========== FOLLOW INDEXES ==========
        const follows = db.collection('follows');

        await follows.createIndex(
            { follower: 1, following: 1 },
            { name: 'idx_follow_pair', unique: true, background: true }
        );
        console.log('  ✅ follows: follower + following (unique)');

        await follows.createIndex(
            { following: 1 },
            { name: 'idx_follow_following', background: true }
        );
        console.log('  ✅ follows: following');

        // ========== NOTIFICATION INDEXES ==========
        const notifications = db.collection('notifications');

        await notifications.createIndex(
            { recipient: 1, read: 1, createdAt: -1 },
            { name: 'idx_notification_recipient', background: true }
        );
        console.log('  ✅ notifications: recipient + read + date');

        // TTL index: tự động xóa notifications cũ hơn 90 ngày
        await notifications.createIndex(
            { createdAt: 1 },
            { name: 'idx_notification_ttl', expireAfterSeconds: 90 * 24 * 60 * 60, background: true }
        );
        console.log('  ✅ notifications: TTL 90 days');

        // ========== MESSAGE INDEXES ==========
        const messages = db.collection('messages');

        await messages.createIndex(
            { conversationId: 1, createdAt: -1 },
            { name: 'idx_message_conversation', background: true }
        );
        console.log('  ✅ messages: conversation + date');

        await messages.createIndex(
            { sender: 1, recipient: 1, createdAt: -1 },
            { name: 'idx_message_users', background: true }
        );
        console.log('  ✅ messages: sender + recipient + date');

        // ========== RATING INDEXES ==========
        const ratings = db.collection('ratings');

        await ratings.createIndex(
            { recipe: 1, user: 1 },
            { name: 'idx_rating_recipe_user', unique: true, background: true }
        );
        console.log('  ✅ ratings: recipe + user (unique)');

        // ========== SAVED RECIPES ==========
        const savedRecipes = db.collection('savedrecipes');

        await savedRecipes.createIndex(
            { user: 1, recipe: 1 },
            { name: 'idx_saved_user_recipe', unique: true, background: true }
        );
        console.log('  ✅ savedrecipes: user + recipe (unique)');

        // ========== AUDIT LOG ==========
        const auditLogs = db.collection('auditlogs');

        await auditLogs.createIndex(
            { createdAt: -1 },
            { name: 'idx_audit_date', background: true }
        );
        console.log('  ✅ auditlogs: date');

        // TTL: tự động xóa audit logs cũ hơn 1 năm
        await auditLogs.createIndex(
            { createdAt: 1 },
            { name: 'idx_audit_ttl', expireAfterSeconds: 365 * 24 * 60 * 60, background: true }
        );
        console.log('  ✅ auditlogs: TTL 1 year');

        console.log('\n✅ Tất cả indexes đã được tạo thành công!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi tạo indexes:', error);
        process.exit(1);
    }
};

createIndexes();

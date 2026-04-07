import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { postAPI } from '@/contexts/api';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeImageUrl } from '@/utils/imageUrl';
import LoadingPizza from '@/components/LoadingPizza';

interface Reply {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  text: string;
  likes: string[];
  createdAt: string;
}

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  text: string;
  likes: string[];
  replies: Reply[];
  createdAt: string;
}

interface Post {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  caption: string;
  imageUrl: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await postAPI.getById(id as string);
      const postData = response.data;
      setPost(postData);
      setIsLiked(postData.likes.includes(user?._id || ''));
      
      // Cập nhật liked comments và replies
      const likedCommentsSet = new Set<string>();
      const likedRepliesSet = new Set<string>();
      
      postData.comments?.forEach((comment: Comment) => {
        if (comment.likes?.includes(user?._id || '')) {
          likedCommentsSet.add(comment._id);
        }
        comment.replies?.forEach((reply: Reply) => {
          if (reply.likes?.includes(user?._id || '')) {
            likedRepliesSet.add(reply._id);
          }
        });
      });
      
      setLikedComments(likedCommentsSet);
      setLikedReplies(likedRepliesSet);
    } catch (error: any) {
      console.error('❌ Error loading post:', error);
      Alert.alert('Lỗi', 'Không thể tải bài đăng');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);

    // Optimistic update
    setPost({
      ...post,
      likes: newIsLiked
        ? [...post.likes, user?._id || '']
        : post.likes.filter((id) => id !== user?._id),
    });

    try {
      await postAPI.toggleLike(post._id);
    } catch (error) {
      // Revert on error
      setIsLiked(!newIsLiked);
      loadPost();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !post) return;

    setSubmittingComment(true);
    let commentToAdd = commentText.trim();
    
    // Nếu đang reply và text chưa có @username, thêm vào đầu
    if (replyingTo && !commentToAdd.startsWith(`@${replyingTo.username}`)) {
      commentToAdd = `@${replyingTo.username} ${commentToAdd}`;
    }
    
    const finalText = commentToAdd;
    setCommentText('');
    const currentReplyingTo = replyingTo;
    setReplyingTo(null);

    try {
      if (currentReplyingTo) {
        // Reply to comment
        await postAPI.replyComment(post._id, currentReplyingTo.commentId, finalText);
      } else {
        // Add new comment
        await postAPI.addComment(post._id, finalText);
      }
      // Reload to get actual data
      loadPost();
    } catch (error: any) {
      console.error('❌ Error adding comment/reply:', error);
      Alert.alert('Lỗi', 'Không thể thêm bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!post) return;

    const isLiked = likedComments.has(commentId);
    
    // Optimistic update
    setLikedComments((prev) => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });

    setPost({
      ...post,
      comments: post.comments.map((comment) => {
        if (comment._id === commentId) {
          return {
            ...comment,
            likes: isLiked
              ? comment.likes.filter((id) => id !== user?._id)
              : [...comment.likes, user?._id || ''],
          };
        }
        return comment;
      }),
    });

    try {
      await postAPI.likeComment(post._id, commentId);
    } catch (error) {
      loadPost();
    }
  };

  const handleLikeReply = async (commentId: string, replyId: string) => {
    if (!post) return;

    const isLiked = likedReplies.has(replyId);
    
    // Optimistic update
    setLikedReplies((prev) => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(replyId);
      } else {
        newSet.add(replyId);
      }
      return newSet;
    });

    setPost({
      ...post,
      comments: post.comments.map((comment) => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply._id === replyId) {
                return {
                  ...reply,
                  likes: isLiked
                    ? reply.likes.filter((id) => id !== user?._id)
                    : [...reply.likes, user?._id || ''],
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      }),
    });

    try {
      await postAPI.likeReply(post._id, commentId, replyId);
    } catch (error) {
      loadPost();
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
    // Chỉ set @username nếu input đang trống
    if (!commentText.trim()) {
      setCommentText(`@${username} `);
    }
  };

  // Hàm render text với @username được highlight
  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <Text key={index} style={styles.mentionText}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingPizza size={100} color="#FF8C42" showText={true} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không tìm thấy bài đăng</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài đăng</Text>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/report',
            params: { type: 'post', targetId: post._id }
          })}
          style={styles.reportButton}
        >
          <Ionicons name="flag-outline" size={24} color="#FF8C42" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => router.push(`/user-profile?id=${post.user._id}`)}
            activeOpacity={0.7}
          >
            {post.user.avatarUrl ? (
              <Image source={{ uri: normalizeImageUrl(post.user.avatarUrl) || post.user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
            )}
            <View>
              <Text style={styles.username}>{post.user.name}</Text>
              <Text style={styles.time}>{formatTime(post.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Image */}
        {post.imageUrl && (
          <Image 
            source={{ uri: normalizeImageUrl(post.imageUrl, post.updatedAt) || post.imageUrl }} 
            style={styles.postImage} 
          />
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={32}
              color={isLiked ? '#FF8C42' : '#1A1A1A'}
            />
          </TouchableOpacity>
          <Text style={styles.likesCount}>{post.likes.length} lượt thích</Text>
        </View>

        {/* Caption */}
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{post.user.name}</Text>{' '}
            {post.caption}
          </Text>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Bình luận ({post.comments.length})
          </Text>
          {post.comments.map((comment) => {
            const isCommentLiked = likedComments.has(comment._id);
            const commentLikesCount = comment.likes?.length || 0;
            
            return (
              <View key={comment._id}>
                {/* Comment */}
                <View style={styles.commentItem}>
                  <TouchableOpacity
                    onPress={() => router.push(`/user-profile?id=${comment.user._id}`)}
                    activeOpacity={0.7}
                  >
                    {comment.user.avatarUrl ? (
                      <Image
                        source={{ uri: normalizeImageUrl(comment.user.avatarUrl) || comment.user.avatarUrl }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <View style={styles.commentAvatarPlaceholder}>
                        <Ionicons name="person" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.commentContent}>
                    <View style={styles.commentTextRow}>
                      <Text style={styles.commentText}>
                        <Text style={styles.commentUsername}>{comment.user.name}</Text>{' '}
                        {renderTextWithMentions(comment.text)}
                      </Text>
                      <View style={styles.commentRightActions}>
                        {/* Like Button */}
                        {user?._id && (
                          <TouchableOpacity
                            onPress={() => handleLikeComment(comment._id)}
                            style={styles.commentLikeButton}
                          >
                            <Ionicons
                              name={isCommentLiked ? 'heart' : 'heart-outline'}
                              size={18}
                              color={isCommentLiked ? '#FF8C42' : '#666'}
                            />
                          </TouchableOpacity>
                        )}
                        {/* Report Button */}
                        {user?._id && comment.user._id !== user._id && (
                          <TouchableOpacity
                            onPress={() => router.push({
                              pathname: '/report',
                              params: { type: 'comment', targetId: comment._id }
                            })}
                            style={styles.commentActionButton}
                          >
                            <Ionicons name="flag-outline" size={16} color="#666" />
                          </TouchableOpacity>
                        )}
                        {/* More Options Button (3 dots) */}
                        {user?._id && (
                          <TouchableOpacity
                            onPress={() => {
                              const isCommentAuthor = comment.user._id === user._id;
                              const options: any[] = [];
                              if (isCommentAuthor) {
                                options.push(
                                  {
                                    text: 'Xóa bình luận',
                                    style: 'destructive' as const,
                                    onPress: async () => {
                                      Alert.alert(
                                        'Xóa bình luận',
                                        'Bạn có chắc muốn xóa bình luận này?',
                                        [
                                          { text: 'Hủy', style: 'cancel' },
                                          {
                                            text: 'Xóa',
                                            style: 'destructive',
                                            onPress: async () => {
                                              try {
                                                // TODO: Implement delete comment API call
                                                Alert.alert('Thông báo', 'Chức năng xóa bình luận đang được phát triển');
                                              } catch (error) {
                                                Alert.alert('Lỗi', 'Không thể xóa bình luận');
                                              }
                                            },
                                          },
                                        ]
                                      );
                                    },
                                  },
                                  { text: 'Hủy', style: 'cancel' as const }
                                );
                              } else {
                                options.push(
                                  {
                                    text: 'Báo cáo vi phạm',
                                    onPress: () => router.push({
                                      pathname: '/report',
                                      params: { type: 'comment', targetId: comment._id }
                                    }),
                                  },
                                  { text: 'Hủy', style: 'cancel' as const }
                                );
                              }
                              Alert.alert('Tùy chọn', '', options);
                            }}
                            style={styles.commentActionButton}
                          >
                            <Ionicons name="ellipsis-horizontal" size={16} color="#666" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <View style={styles.commentActions}>
                      <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
                      {commentLikesCount > 0 && (
                        <Text style={styles.commentLikes}>{commentLikesCount} ❤️</Text>
                      )}
                      <TouchableOpacity
                        onPress={() => handleReply(comment._id, comment.user.name)}
                        style={styles.commentActionButton}
                      >
                        <Text style={styles.commentActionText}>Trả lời</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <View style={styles.repliesContainer}>
                    {comment.replies.map((reply) => {
                      const isReplyLiked = likedReplies.has(reply._id);
                      const replyLikesCount = reply.likes?.length || 0;
                      
                      return (
                        <View key={reply._id} style={styles.replyItem}>
                          <TouchableOpacity
                            onPress={() => router.push(`/user-profile?id=${reply.user._id}`)}
                            activeOpacity={0.7}
                          >
                            {reply.user.avatarUrl ? (
                              <Image
                                source={{ uri: normalizeImageUrl(reply.user.avatarUrl) || reply.user.avatarUrl }}
                                style={styles.replyAvatar}
                              />
                            ) : (
                              <View style={styles.replyAvatarPlaceholder}>
                                <Ionicons name="person" size={12} color="#FFFFFF" />
                              </View>
                            )}
                          </TouchableOpacity>
                          <View style={styles.replyContent}>
                            <Text style={styles.replyText}>
                              <Text style={styles.replyUsername}>{reply.user.name}</Text>{' '}
                              {renderTextWithMentions(reply.text)}
                            </Text>
                            <View style={styles.replyActions}>
                              <Text style={styles.replyTime}>{formatTime(reply.createdAt)}</Text>
                              {replyLikesCount > 0 && (
                                <Text style={styles.replyLikes}>{replyLikesCount} ❤️</Text>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleLikeReply(comment._id, reply._id)}
                            style={styles.replyLikeButton}
                          >
                            <Ionicons
                              name={isReplyLiked ? 'heart' : 'heart-outline'}
                              size={16}
                              color={isReplyLiked ? '#FF8C42' : '#666'}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        {replyingTo && (
          <View style={styles.replyingToContainer}>
            <Text style={styles.replyingToText}>
              Đang trả lời <Text style={styles.replyingToUsername}>@{replyingTo.username}</Text>
            </Text>
            <TouchableOpacity onPress={() => {
              setReplyingTo(null);
              setCommentText('');
            }}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.commentInputRow}>
          {user?.avatarUrl ? (
            <Image source={{ uri: normalizeImageUrl(user.avatarUrl) || user.avatarUrl }} style={styles.inputAvatar} />
          ) : (
            <View style={styles.inputAvatarPlaceholder}>
              <Ionicons name="person" size={16} color="#FFFFFF" />
            </View>
          )}
          <TextInput
            style={styles.commentInput}
            placeholder={replyingTo ? `Trả lời @${replyingTo.username}...` : "Thêm bình luận..."}
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={!commentText.trim() || submittingComment}
            style={[
              styles.sendButton,
              (!commentText.trim() || submittingComment) && styles.sendButtonDisabled,
            ]}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FF8C42',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 500,
    backgroundColor: '#000000',
    resizeMode: 'contain',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  likesCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  captionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  caption: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  captionUsername: {
    fontWeight: '600',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  commentUsername: {
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  commentLikes: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  commentActionButton: {
    paddingVertical: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  commentLikeButton: {
    padding: 4,
    marginLeft: 8,
  },
  repliesContainer: {
    marginLeft: 44,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  replyAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyText: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 18,
  },
  replyUsername: {
    fontWeight: '600',
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  replyTime: {
    fontSize: 11,
    color: '#999',
  },
  replyLikes: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  replyLikeButton: {
    padding: 4,
    marginLeft: 8,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#F9F9F9',
  },
  replyingToText: {
    fontSize: 13,
    color: '#666',
  },
  replyingToUsername: {
    fontWeight: '600',
    color: '#FF8C42',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  mentionText: {
    color: '#FF8C42',
    fontWeight: '600',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  inputAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#FF8C42',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
});


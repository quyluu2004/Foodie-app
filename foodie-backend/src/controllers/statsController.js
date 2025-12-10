import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Post from "../models/Post.js";
import Favorite from "../models/Favorite.js";
import Saved from "../models/Saved.js";
import RecipeCooked from "../models/RecipeCooked.js";
import Follow from "../models/Follow.js";
import Collection from "../models/Collection.js";
import Report from "../models/Report.js";
import Comment from "../models/Comment.js";
import Category from "../models/Category.js";
import Like from "../models/Like.js";

// Lấy thống kê "Công thức đã lưu"
export const getSavedRecipesStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tổng số công thức đã lưu (dùng model Saved, không phải Favorite)
    const totalSaved = await Saved.countDocuments({ user: userId });

    // Số bộ sưu tập
    const totalCollections = await Collection.countDocuments({ user: userId });

    // Danh sách bộ sưu tập
    const collections = await Collection.find({ user: userId })
      .populate("recipes", "title imageUrl")
      .sort({ createdAt: -1 })
      .limit(10);

    // Top 3 công thức được lưu nhiều nhất (từ tất cả users) - dùng model Saved
    const topSavedRecipes = await Saved.aggregate([
      {
        $group: {
          _id: "$recipe",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    const topRecipes = await Recipe.find({
      _id: { $in: topSavedRecipes.map((r) => r._id) },
    }).select("title imageUrl category");

    // Công thức đã lưu của user (dùng model Saved)
    const savedRecipes = await Saved.find({ user: userId })
      .populate({
        path: "recipe",
        select: "title imageUrl videoThumbnail category categoryName author",
        populate: { path: "author", select: "name email avatarUrl" },
      })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      totalSaved,
      totalCollections,
      collections: collections.map((c) => ({
        _id: c._id,
        name: c.name,
        description: c.description,
        recipeCount: c.recipes.length,
        recipes: c.recipes.slice(0, 3), // Chỉ lấy 3 recipe đầu
      })),
      topSavedRecipes: topRecipes,
      savedRecipes: savedRecipes.map((s) => s.recipe).filter(Boolean),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thống kê công thức đã lưu:", error);
    res.status(500).json({
      message: "Lỗi lấy thống kê công thức đã lưu",
      error: error.message,
    });
  }
};

// Lấy thống kê "Đã nấu"
export const getCookedStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tổng số món đã nấu
    const totalCooked = await RecipeCooked.countDocuments({ user: userId });

    // Số món thành công
    const successCount = await RecipeCooked.countDocuments({
      user: userId,
      success: true,
    });

    // % thành công
    const successRate = totalCooked > 0 ? (successCount / totalCooked) * 100 : 0;

    // Lần nấu gần nhất
    const lastCooked = await RecipeCooked.findOne({ user: userId })
      .populate("recipe", "title imageUrl")
      .sort({ createdAt: -1 });

    // Top 3 món nấu nhiều nhất
    const topCooked = await RecipeCooked.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$recipe",
          count: { $sum: 1 },
          lastCooked: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1, lastCooked: -1 } },
      { $limit: 3 },
    ]);

    const topRecipes = await Recipe.find({
      _id: { $in: topCooked.map((r) => r._id) },
    }).select("title imageUrl category");

    // Lịch sử nấu gần đây
    const recentHistory = await RecipeCooked.find({ user: userId })
      .populate("recipe", "title imageUrl")
      .sort({ createdAt: -1 })
      .limit(10);

    // Tính huy hiệu
    let badge = "Đầu bếp mới";
    if (totalCooked >= 50) {
      badge = "Đầu bếp vàng";
    } else if (totalCooked >= 20) {
      badge = "Đầu bếp bạc";
    }

    res.status(200).json({
      totalCooked,
      successRate: Math.round(successRate * 10) / 10,
      lastCooked,
      topCooked: topRecipes.map((recipe, index) => ({
        recipe,
        count: topCooked[index]?.count || 0,
      })),
      recentHistory,
      badge,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thống kê đã nấu:", error);
    res.status(500).json({
      message: "Lỗi lấy thống kê đã nấu",
      error: error.message,
    });
  }
};

// Lấy thống kê "Hoạt động"
export const getActivityStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Số người theo dõi (followers)
    const followersCount = await Follow.countDocuments({ following: userId });

    // Số người đang theo dõi (following)
    const followingCount = await Follow.countDocuments({ follower: userId });

    // Số lượt thích nhận được (từ posts)
    const posts = await Post.find({ user: userId });
    const totalLikesReceived = posts.reduce(
      (sum, post) => sum + post.likes.length,
      0
    );

    // Số bình luận nhận được (từ posts)
    const totalCommentsReceived = posts.reduce(
      (sum, post) => sum + post.comments.length,
      0
    );

    // Số lần công thức được người khác lưu (dùng model Saved, không phải Favorite)
    const userRecipes = await Recipe.find({ author: userId });
    const recipeIds = userRecipes.map((r) => r._id);
    const totalRecipeSaves = await Saved.countDocuments({
      recipe: { $in: recipeIds },
      user: { $ne: userId }, // Không tính chính user
    });

    // Số báo cáo của user
    const totalReports = await Report.countDocuments({ reporter: userId });
    const pendingReports = await Report.countDocuments({ 
      reporter: userId, 
      status: 'pending' 
    });
    const resolvedReports = await Report.countDocuments({ 
      reporter: userId, 
      status: 'resolved' 
    });

    // Tổng số hoạt động
    const totalActivities = {
      likes: totalLikesReceived,
      comments: totalCommentsReceived,
      follows: followingCount,
      recipeSaves: totalRecipeSaves,
      posts: posts.length,
    };

    res.status(200).json({
      followersCount,
      followingCount,
      totalLikesReceived,
      totalCommentsReceived,
      totalRecipeSaves,
      totalActivities,
      totalReports,
      pendingReports,
      resolvedReports,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thống kê hoạt động:", error);
    res.status(500).json({
      message: "Lỗi lấy thống kê hoạt động",
      error: error.message,
    });
  }
};

// Lấy danh sách người đã like posts của user
export const getLikesReceived = async (req, res) => {
  try {
    const userId = req.user._id;

    const posts = await Post.find({ user: userId }).populate("likes", "name email avatarUrl");

    // Tổng hợp tất cả users đã like
    const likesMap = new Map();
    posts.forEach((post) => {
      post.likes.forEach((user) => {
        if (user._id.toString() !== userId.toString()) {
          const userIdStr = user._id.toString();
          if (!likesMap.has(userIdStr)) {
            likesMap.set(userIdStr, {
              user,
              likeCount: 0,
              lastLiked: null,
            });
          }
          const entry = likesMap.get(userIdStr);
          entry.likeCount += 1;
        }
      });
    });

    const likesList = Array.from(likesMap.values())
      .sort((a, b) => b.likeCount - a.likeCount)
      .map((entry) => ({
        user: entry.user,
        likeCount: entry.likeCount,
      }));

    res.status(200).json({
      users: likesList.map((item) => item.user),
      total: likesList.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách likes received:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách likes received",
      error: error.message,
    });
  }
};

// Lấy danh sách người đã comment trên posts của user
export const getCommentsReceived = async (req, res) => {
  try {
    const userId = req.user._id;

    const posts = await Post.find({ user: userId })
      .populate("comments.user", "name email avatarUrl");

    // Tổng hợp tất cả users đã comment
    const commentsMap = new Map();
    posts.forEach((post) => {
      post.comments.forEach((comment) => {
        const commentUserId = comment.user._id.toString();
        if (commentUserId !== userId.toString()) {
          if (!commentsMap.has(commentUserId)) {
            commentsMap.set(commentUserId, {
              user: comment.user,
              commentCount: 0,
            });
          }
          const entry = commentsMap.get(commentUserId);
          entry.commentCount += 1;
        }
      });
    });

    const commentsList = Array.from(commentsMap.values())
      .sort((a, b) => b.commentCount - a.commentCount)
      .map((entry) => ({
        user: entry.user,
        commentCount: entry.commentCount,
      }));

    res.status(200).json({
      users: commentsList.map((item) => item.user),
      total: commentsList.length,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách comments received:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách comments received",
      error: error.message,
    });
  }
};

// Helper function để tính thời gian trước
function getTimeAgo(date) {
  if (!date) return 'Không xác định';
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString('vi-VN');
}

// Helper function để parse time ago thành số phút (để sort)
function parseTimeAgo(timeStr) {
  if (!timeStr) return 0;
  if (timeStr === 'Vừa xong') return 0;
  const match = timeStr.match(/(\d+)/);
  if (!match) return 999999;
  const num = parseInt(match[1]);
  if (timeStr.includes('phút')) return num;
  if (timeStr.includes('giờ')) return num * 60;
  if (timeStr.includes('ngày')) return num * 1440;
  return 999999;
}

// Lấy thống kê Dashboard (Admin only)
export const getDashboardStats = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Chỉ admin mới có quyền truy cập",
      });
    }

    // Tổng số users
    const totalUsers = await User.countDocuments({});
    
    // Tổng số recipes
    const totalRecipes = await Recipe.countDocuments({});
    
    // Tổng số categories
    const totalCategories = await Category.countDocuments({});
    
    // Tổng số comments (từ cả Post và Recipe comments)
    const postComments = await Post.aggregate([
      { $project: { commentCount: { $size: { $ifNull: ["$comments", []] } } } },
      { $group: { _id: null, total: { $sum: "$commentCount" } } }
    ]);
    const recipeComments = await Comment.countDocuments({});
    const totalComments = (postComments[0]?.total || 0) + recipeComments;

    // Tính growth data (6 tháng gần nhất) - dựa trên số users mới
    const now = new Date();
    const growthData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const usersCount = await User.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      
      growthData.push({
        name: `T${6 - i}`,
        value: usersCount
      });
    }

    // Activity logs (10 hoạt động gần nhất)
    const activityLogs = [];
    
    // Lấy 5 users mới nhất
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
    recentUsers.forEach((user) => {
      const timeAgo = getTimeAgo(user.createdAt);
      activityLogs.push({
        id: `user-${user._id}`,
        action: 'Người dùng mới đăng ký',
        user: user.email || user.name || 'N/A',
        time: timeAgo,
        createdAt: user.createdAt
      });
    });

    // Lấy 3 recipes mới nhất
    const recentRecipes = await Recipe.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('author', 'name email')
      .select('title author createdAt');
    recentRecipes.forEach((recipe) => {
      const timeAgo = getTimeAgo(recipe.createdAt);
      activityLogs.push({
        id: `recipe-${recipe._id}`,
        action: 'Công thức mới được tạo',
        user: recipe.author?.email || recipe.author?.name || 'N/A',
        time: timeAgo,
        createdAt: recipe.createdAt
      });
    });

    // Lấy 2 comments mới nhất
    const recentComments = await Comment.find({})
      .sort({ createdAt: -1 })
      .limit(2)
      .populate('user', 'name email')
      .select('user createdAt');
    recentComments.forEach((comment) => {
      const timeAgo = getTimeAgo(comment.createdAt);
      activityLogs.push({
        id: `comment-${comment._id}`,
        action: 'Bình luận mới',
        user: comment.user?.email || comment.user?.name || 'N/A',
        time: timeAgo,
        createdAt: comment.createdAt
      });
    });

    // Sắp xếp theo thời gian (mới nhất trước)
    activityLogs.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    // Tính % thay đổi so với tháng trước
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const thisMonthUsers = await User.countDocuments({
      createdAt: { $gte: thisMonthStart }
    });
    const userChange = lastMonthUsers > 0 
      ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : (thisMonthUsers > 0 ? 100 : 0);

    const lastMonthRecipes = await Recipe.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const thisMonthRecipes = await Recipe.countDocuments({
      createdAt: { $gte: thisMonthStart }
    });
    const recipeChange = lastMonthRecipes > 0
      ? Math.round(((thisMonthRecipes - lastMonthRecipes) / lastMonthRecipes) * 100)
      : (thisMonthRecipes > 0 ? 100 : 0);

    const lastMonthCategories = await Category.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const thisMonthCategories = await Category.countDocuments({
      createdAt: { $gte: thisMonthStart }
    });
    const categoryChange = lastMonthCategories > 0
      ? Math.round(((thisMonthCategories - lastMonthCategories) / lastMonthCategories) * 100)
      : (thisMonthCategories > 0 ? 100 : 0);

    const lastMonthComments = await Comment.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const thisMonthComments = await Comment.countDocuments({
      createdAt: { $gte: thisMonthStart }
    });
    const commentChange = lastMonthComments > 0
      ? Math.round(((thisMonthComments - lastMonthComments) / lastMonthComments) * 100)
      : (thisMonthComments > 0 ? 100 : 0);

    // Thêm các metrics khác
    const totalPosts = await Post.countDocuments({});
    const totalLikes = await Like.countDocuments({});
    const totalSaves = await Saved.countDocuments({});
    const pendingRecipes = await Recipe.countDocuments({ status: 'pending' });
    const approvedRecipes = await Recipe.countDocuments({ status: 'approved' });
    const rejectedRecipes = await Recipe.countDocuments({ status: 'rejected' });
    
    // Top 5 recipes được like nhiều nhất
    let topRecipes = [];
    try {
      const topLikedRecipes = await Like.aggregate([
        { $group: { _id: "$recipe", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      if (topLikedRecipes.length > 0) {
        const recipeIds = topLikedRecipes.map(r => r._id).filter(Boolean);
        if (recipeIds.length > 0) {
          const topRecipesData = await Recipe.find({
            _id: { $in: recipeIds }
          }).select('title imageUrl videoThumbnail averageRating ratingCount').limit(5);
          
          // Sắp xếp topRecipesData theo thứ tự likes
          topRecipes = topLikedRecipes
            .map(likeData => {
              const recipe = topRecipesData.find(r => r._id.toString() === likeData._id.toString());
              if (!recipe) return null;
              return {
                _id: recipe._id,
                title: recipe.title,
                imageUrl: recipe.videoThumbnail || recipe.imageUrl,
                likes: likeData.count || 0,
                rating: recipe.averageRating || 0,
              };
            })
            .filter(Boolean);
        }
      }
      
      // Fallback: Lấy top recipes theo rating nếu không có likes hoặc không đủ 5
      if (topRecipes.length < 5) {
        const topRecipesByRating = await Recipe.find({})
          .select('title imageUrl videoThumbnail averageRating ratingCount likes')
          .sort({ averageRating: -1, ratingCount: -1, createdAt: -1 })
          .limit(5);
        
        const existingIds = new Set(topRecipes.map(r => r._id.toString()));
        const additionalRecipes = topRecipesByRating
          .filter(recipe => !existingIds.has(recipe._id.toString()))
          .slice(0, 5 - topRecipes.length)
          .map(recipe => ({
            _id: recipe._id,
            title: recipe.title,
            imageUrl: recipe.videoThumbnail || recipe.imageUrl,
            likes: recipe.likes?.length || 0,
            rating: recipe.averageRating || 0,
          }));
        
        topRecipes = [...topRecipes, ...additionalRecipes].slice(0, 5);
      }
    } catch (error) {
      console.error("❌ Lỗi lấy top recipes:", error);
      // Fallback cuối cùng: Lấy 5 recipes mới nhất
      try {
        const recentRecipes = await Recipe.find({})
          .select('title imageUrl videoThumbnail averageRating ratingCount likes')
          .sort({ createdAt: -1 })
          .limit(5);
        
        topRecipes = recentRecipes.map(recipe => ({
          _id: recipe._id,
          title: recipe.title,
          imageUrl: recipe.videoThumbnail || recipe.imageUrl,
          likes: recipe.likes?.length || 0,
          rating: recipe.averageRating || 0,
        }));
      } catch (fallbackError) {
        console.error("❌ Lỗi fallback top recipes:", fallbackError);
        topRecipes = [];
      }
    }

    // Top 5 users có nhiều recipes nhất
    let topUsers = [];
    try {
      const topUsersByRecipes = await Recipe.aggregate([
        { $match: { author: { $ne: null } } }, // Chỉ lấy recipes có author
        { $group: { _id: "$author", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      if (topUsersByRecipes.length > 0) {
        const userIds = topUsersByRecipes.map(u => u._id).filter(Boolean);
        if (userIds.length > 0) {
          const topUsersData = await User.find({
            _id: { $in: userIds }
          }).select('name email avatarUrl').limit(5);
          
          topUsers = topUsersData.map(user => {
            const recipeData = topUsersByRecipes.find(u => u._id.toString() === user._id.toString());
            return {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl,
              recipeCount: recipeData?.count || 0,
            };
          });
        }
      }
      
      // Fallback: Lấy top users theo số posts nếu không có recipes hoặc không đủ 5
      if (topUsers.length < 5) {
        const topUsersByPosts = await Post.aggregate([
          { $match: { user: { $ne: null } } },
          { $group: { _id: "$user", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]);
        
        if (topUsersByPosts.length > 0) {
          const userIds = topUsersByPosts.map(u => u._id).filter(Boolean);
          if (userIds.length > 0) {
            const existingIds = new Set(topUsers.map(u => u._id.toString()));
            const topUsersData = await User.find({
              _id: { $in: userIds }
            }).select('name email avatarUrl').limit(5);
            
            const additionalUsers = topUsersData
              .filter(user => !existingIds.has(user._id.toString()))
              .map(user => {
                const postData = topUsersByPosts.find(u => u._id.toString() === user._id.toString());
                return {
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  avatarUrl: user.avatarUrl,
                  recipeCount: postData?.count || 0,
                };
              });
            
            topUsers = [...topUsers, ...additionalUsers].slice(0, 5);
          }
        }
      }
      
      // Fallback cuối cùng: Lấy 5 users mới nhất nếu vẫn chưa đủ
      if (topUsers.length < 5) {
        const existingIds = new Set(topUsers.map(u => u._id.toString()));
        const recentUsers = await User.find({})
          .select('name email avatarUrl')
          .sort({ createdAt: -1 })
          .limit(5);
        
        const additionalUsers = recentUsers
          .filter(user => !existingIds.has(user._id.toString()))
          .slice(0, 5 - topUsers.length)
          .map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            recipeCount: 0,
          }));
        
        topUsers = [...topUsers, ...additionalUsers].slice(0, 5);
      }
    } catch (error) {
      console.error("❌ Lỗi lấy top users:", error);
      // Fallback cuối cùng: Lấy 5 users mới nhất
      try {
        const recentUsers = await User.find({})
          .select('name email avatarUrl')
          .sort({ createdAt: -1 })
          .limit(5);
        
        topUsers = recentUsers.map(user => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          recipeCount: 0,
        }));
      } catch (fallbackError) {
        console.error("❌ Lỗi fallback top users:", fallbackError);
        topUsers = [];
      }
    }

    // Phân bố recipes theo category
    const categoryDistribution = await Recipe.aggregate([
      { $group: { _id: "$categoryName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Phân bố recipes theo status
    const statusDistribution = await Recipe.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      stats: {
        totalUsers,
        totalRecipes,
        totalCategories,
        totalComments,
        totalPosts,
        totalLikes,
        totalSaves,
        pendingRecipes,
        approvedRecipes,
        rejectedRecipes,
      },
      changes: {
        users: userChange,
        recipes: recipeChange,
        categories: categoryChange,
        comments: commentChange,
      },
      growthData,
      activityLogs: activityLogs.slice(0, 10), // Chỉ lấy 10 hoạt động gần nhất
      topRecipes,
      topUsers,
      categoryDistribution: categoryDistribution.map(cat => ({
        name: cat._id || 'Chưa phân loại',
        value: cat.count
      })),
      statusDistribution: statusDistribution.map(status => ({
        name: status._id === 'approved' ? 'Đã duyệt' : 
              status._id === 'pending' ? 'Chờ duyệt' : 
              status._id === 'rejected' ? 'Từ chối' : status._id,
        value: status.count
      })),
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thống kê dashboard:", error);
    res.status(500).json({
      message: "Lỗi lấy thống kê dashboard",
      error: error.message,
    });
  }
};

// Lấy thống kê Analytics (Admin only)
export const getAnalyticsStats = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Chỉ admin mới có quyền truy cập",
      });
    }

    // Top recipes (theo likes và saves)
    const topRecipesByLikes = await Like.aggregate([
      { $group: { _id: "$recipe", likes: { $sum: 1 } } },
      { $sort: { likes: -1 } },
      { $limit: 5 }
    ]);

    const topRecipesBySaves = await Saved.aggregate([
      { $group: { _id: "$recipe", saves: { $sum: 1 } } },
      { $sort: { saves: -1 } },
      { $limit: 5 }
    ]);

    // Lấy thông tin đầy đủ của top recipes
    const topRecipesMap = new Map();
    
    // Thêm recipes từ likes
    for (const item of topRecipesByLikes) {
      if (item._id) {
        const recipe = await Recipe.findById(item._id).select('title');
        if (recipe) {
          topRecipesMap.set(recipe._id.toString(), {
            name: recipe.title,
            likes: item.likes || 0,
            saves: 0
          });
        }
      }
    }
    
    // Thêm/update recipes từ saves
    for (const item of topRecipesBySaves) {
      if (item._id) {
        const recipe = await Recipe.findById(item._id).select('title');
        if (recipe) {
          const existing = topRecipesMap.get(recipe._id.toString());
          if (existing) {
            existing.saves = item.saves || 0;
          } else {
            topRecipesMap.set(recipe._id.toString(), {
              name: recipe.title,
              likes: 0,
              saves: item.saves || 0
            });
          }
        }
      }
    }

    const topRecipes = Array.from(topRecipesMap.values())
      .sort((a, b) => (b.likes + b.saves) - (a.likes + a.saves))
      .slice(0, 5);

    // User growth (6 tháng gần nhất)
    const now = new Date();
    const userGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const usersCount = await User.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      
      userGrowth.push({
        month: `T${6 - i}`,
        users: usersCount
      });
    }

    // Recipe growth (6 tháng gần nhất)
    const recipeGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const recipesCount = await Recipe.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      
      recipeGrowth.push({
        month: `T${6 - i}`,
        recipes: recipesCount
      });
    }

    // Interaction data (Likes, Comments, Saves)
    const totalLikes = await Like.countDocuments({});
    const totalComments = await Comment.countDocuments({});
    const totalSaves = await Saved.countDocuments({});

    const interactionData = [
      { name: 'Likes', value: totalLikes },
      { name: 'Comments', value: totalComments },
      { name: 'Saves', value: totalSaves },
    ];

    res.status(200).json({
      topRecipes,
      userGrowth,
      recipeGrowth,
      interactionData,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thống kê analytics:", error);
    res.status(500).json({
      message: "Lỗi lấy thống kê analytics",
      error: error.message,
    });
  }
};


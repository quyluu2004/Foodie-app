import { useState, useEffect } from 'react';
import CardStat from '../components/CardStat';
import ChartLine from '../components/ChartLine';
import { 
  Users, ChefHat, FolderTree, MessageSquare, Activity, 
  FileText, Heart, Bookmark, AlertCircle, CheckCircle, XCircle,
  TrendingUp, Award, BarChart3
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#FF4D4D', '#FFA94D', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    totalCategories: 0,
    totalComments: 0,
    totalPosts: 0,
    totalLikes: 0,
    totalSaves: 0,
    pendingRecipes: 0,
    approvedRecipes: 0,
    rejectedRecipes: 0,
  });
  const [growthData, setGrowthData] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [topRecipes, setTopRecipes] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Lấy dữ liệu từ API dashboard stats
      try {
        const dashboardRes = await api.get('/stats/dashboard');
        const dashboardData = dashboardRes.data;
        
        if (dashboardData.stats) {
          setStats({
            totalUsers: dashboardData.stats.totalUsers || 0,
            totalRecipes: dashboardData.stats.totalRecipes || 0,
            totalCategories: dashboardData.stats.totalCategories || 0,
            totalComments: dashboardData.stats.totalComments || 0,
            totalPosts: dashboardData.stats.totalPosts || 0,
            totalLikes: dashboardData.stats.totalLikes || 0,
            totalSaves: dashboardData.stats.totalSaves || 0,
            pendingRecipes: dashboardData.stats.pendingRecipes || 0,
            approvedRecipes: dashboardData.stats.approvedRecipes || 0,
            rejectedRecipes: dashboardData.stats.rejectedRecipes || 0,
            changes: dashboardData.changes || {
              users: 0,
              recipes: 0,
              categories: 0,
              comments: 0,
            },
          });
        }
        
        if (dashboardData.growthData) {
          setGrowthData(dashboardData.growthData);
        }
        
        if (dashboardData.activityLogs) {
          setActivityLogs(dashboardData.activityLogs);
        }

        if (dashboardData.topRecipes) {
          setTopRecipes(dashboardData.topRecipes);
        }

        if (dashboardData.topUsers) {
          setTopUsers(dashboardData.topUsers);
        }

        if (dashboardData.categoryDistribution) {
          setCategoryDistribution(dashboardData.categoryDistribution);
        }

        if (dashboardData.statusDistribution) {
          setStatusDistribution(dashboardData.statusDistribution);
        }
      } catch (err) {
        console.warn('Error fetching dashboard stats:', err);
        // Set empty data if API fails
        setGrowthData([]);
        setActivityLogs([]);
        setTopRecipes([]);
        setTopUsers([]);
        setCategoryDistribution([]);
        setStatusDistribution([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen animate__animated animate__fadeIn">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto pulse-loading"></div>
          <p className="mt-4 text-gray-600 animate__animated animate__pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate__animated animate__fadeInUp page-transition w-full">
      <div className="animate__animated animate__fadeInDown">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#FFFFFF] mb-2 header-gradient inline-block">
          📊 Dashboard
        </h1>
        <p className="text-gray-600 dark:text-[#E5E5E5] mt-2">Tổng quan hệ thống Foodie</p>
      </div>

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <CardStat
          title="Tổng số người dùng"
          value={stats.totalUsers}
          icon={Users}
          color="primary"
          change={stats.changes?.users || 0}
          index={0}
        />
        <CardStat
          title="Tổng số công thức"
          value={stats.totalRecipes}
          icon={ChefHat}
          color="secondary"
          change={stats.changes?.recipes || 0}
          index={1}
        />
        <CardStat
          title="Tổng số danh mục"
          value={stats.totalCategories}
          icon={FolderTree}
          color="blue"
          change={stats.changes?.categories || 0}
          index={2}
        />
        <CardStat
          title="Tổng số bình luận"
          value={stats.totalComments}
          icon={MessageSquare}
          color="green"
          change={stats.changes?.comments || 0}
          index={3}
        />
      </div>

      {/* Stats Cards - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <CardStat
          title="Tổng số bài viết"
          value={stats.totalPosts}
          icon={FileText}
          color="purple"
          index={4}
        />
        <CardStat
          title="Tổng số lượt thích"
          value={stats.totalLikes}
          icon={Heart}
          color="pink"
          index={5}
        />
        <CardStat
          title="Tổng số lượt lưu"
          value={stats.totalSaves}
          icon={Bookmark}
          color="orange"
          index={6}
        />
        <CardStat
          title="Công thức chờ duyệt"
          value={stats.pendingRecipes}
          icon={AlertCircle}
          color="yellow"
          index={7}
          onClick={() => navigate('/recipes?status=pending')}
          clickable
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card animate__animated animate__fadeInUp animate-delay-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#FFFFFF] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Biểu đồ tăng trưởng người dùng
            </h3>
          </div>
          <ChartLine data={growthData} dataKey="value" name="Số người dùng mới" />
        </div>
        
        <div className="card animate__animated animate__fadeInUp animate-delay-500">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#FFFFFF] mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Hoạt động gần đây
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {activityLogs.length > 0 ? (
              activityLogs.map((log, index) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#333333] rounded-lg hover:bg-gray-100 dark:hover:bg-[#404040] transition-colors animate__animated animate__fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Activity className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-[#FFFFFF] truncate">{log.action}</p>
                    <p className="text-xs text-gray-500 dark:text-[#E5E5E5] truncate">{log.user} • {log.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-[#E5E5E5] text-center py-8">Chưa có hoạt động nào</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card animate__animated animate__fadeInUp animate-delay-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#FFFFFF] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Phân bố theo danh mục
          </h3>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 dark:text-[#E5E5E5] text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>

        <div className="card animate__animated animate__fadeInUp animate-delay-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#FFFFFF] mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Trạng thái công thức
          </h3>
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#FF4D4D" name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 dark:text-[#E5E5E5] text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Top Recipes and Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card animate__animated animate__fadeInUp animate-delay-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#FFFFFF] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Top công thức được yêu thích
          </h3>
          <div className="space-y-3">
            {topRecipes.length > 0 ? (
              topRecipes.map((recipe, index) => (
                <div
                  key={recipe._id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#333333] rounded-lg hover:bg-gray-100 dark:hover:bg-[#404040] transition-colors cursor-pointer"
                  onClick={() => navigate(`/recipes?search=${encodeURIComponent(recipe.title)}`)}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {index + 1}
                  </div>
                  {recipe.imageUrl && (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-[#FFFFFF] truncate">{recipe.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 dark:text-[#E5E5E5] flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {recipe.likes}
                      </span>
                      {recipe.rating > 0 && (
                        <span className="text-xs text-gray-500 dark:text-[#E5E5E5] flex items-center gap-1">
                          ⭐ {recipe.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-[#E5E5E5] text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        <div className="card animate__animated animate__fadeInUp animate-delay-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#FFFFFF] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Top người dùng tích cực
          </h3>
          <div className="space-y-3">
            {topUsers.length > 0 ? (
              topUsers.map((user, index) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#333333] rounded-lg hover:bg-gray-100 dark:hover:bg-[#404040] transition-colors cursor-pointer"
                  onClick={() => navigate(`/users?search=${encodeURIComponent(user.email)}`)}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {index + 1}
                  </div>
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=FF4D4D&color=fff`;
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-[#FFFFFF] truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#E5E5E5] flex items-center gap-1 mt-1">
                      <ChefHat className="w-3 h-3" />
                      {user.recipeCount} công thức
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-[#E5E5E5] text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

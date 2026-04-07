import { useState, useEffect } from 'react';
import CardStat from '../components/CardStat';
import {
  Users, ChefHat, FolderTree, MessageSquare, Activity,
  FileText, Heart, Bookmark, AlertCircle, CheckCircle, XCircle,
  TrendingUp, Award, BarChart3, RefreshCw, Clock, Sparkles
} from 'lucide-react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const CHART_COLORS = ['#FF8C42', '#FF4D4D', '#4CAF50', '#2196F3', '#9C27B0', '#FFA94D'];

function SectionHeader({ icon: Icon, title, subtitle, iconColor = 'text-orange-500', iconBg = 'bg-orange-50 dark:bg-orange-900/20' }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} style={{ width: '18px', height: '18px' }} />
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#2A2A2A] border border-gray-100 dark:border-[#3A3A3A] rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0, totalRecipes: 0, totalCategories: 0, totalComments: 0,
    totalPosts: 0, totalLikes: 0, totalSaves: 0,
    pendingRecipes: 0, approvedRecipes: 0, rejectedRecipes: 0,
    changes: { users: 0, recipes: 0, categories: 0, comments: 0 },
  });
  const [growthData, setGrowthData] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [topRecipes, setTopRecipes] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await api.get('/stats/dashboard');
      const d = res.data;
      if (d.stats) {
        setStats({
          totalUsers: d.stats.totalUsers || 0,
          totalRecipes: d.stats.totalRecipes || 0,
          totalCategories: d.stats.totalCategories || 0,
          totalComments: d.stats.totalComments || 0,
          totalPosts: d.stats.totalPosts || 0,
          totalLikes: d.stats.totalLikes || 0,
          totalSaves: d.stats.totalSaves || 0,
          pendingRecipes: d.stats.pendingRecipes || 0,
          approvedRecipes: d.stats.approvedRecipes || 0,
          rejectedRecipes: d.stats.rejectedRecipes || 0,
          changes: d.changes || { users: 0, recipes: 0, categories: 0, comments: 0 },
        });
      }
      if (d.growthData) setGrowthData(d.growthData);
      if (d.activityLogs) setActivityLogs(d.activityLogs);
      if (d.topRecipes) setTopRecipes(d.topRecipes);
      if (d.topUsers) setTopUsers(d.topUsers);
      if (d.categoryDistribution) setCategoryDistribution(d.categoryDistribution);
      if (d.statusDistribution) setStatusDistribution(d.statusDistribution);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-200 animate-pulse">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const approvalRate = stats.totalRecipes > 0
    ? Math.round(stats.approvedRecipes / stats.totalRecipes * 100)
    : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 w-full">

      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 rounded-2xl p-6 shadow-lg shadow-orange-200/50 dark:shadow-orange-900/30">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 right-16 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute top-4 right-32 w-8 h-8 bg-white/20 rounded-full" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-white/80" />
              <p className="text-white/80 text-sm font-medium">{greeting}, Admin!</p>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
              Tổng quan Foodie Admin
            </h1>
            <p className="text-white/70 text-sm capitalize">{dateStr}</p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            <button
              onClick={() => fetchDashboardData(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all backdrop-blur-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            {stats.pendingRecipes > 0 && (
              <button
                onClick={() => navigate('/recipes')}
                className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <AlertCircle className="w-4 h-4" />
                {stats.pendingRecipes} chờ duyệt
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Row 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStat title="Người dùng" value={stats.totalUsers} icon={Users} color="primary" change={stats.changes?.users} index={0} />
        <CardStat title="Công thức" value={stats.totalRecipes} icon={ChefHat} color="secondary" change={stats.changes?.recipes} index={1} />
        <CardStat title="Bình luận" value={stats.totalComments} icon={MessageSquare} color="green" change={stats.changes?.comments} index={2} />
        <CardStat title="Bài viết" value={stats.totalPosts} icon={FileText} color="blue" index={3} />
      </div>

      {/* ── Stats Row 2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CardStat title="Lượt thích" value={stats.totalLikes} icon={Heart} color="pink" index={4} />
        <CardStat title="Lượt lưu" value={stats.totalSaves} icon={Bookmark} color="orange" index={5} />
        <CardStat title="Danh mục" value={stats.totalCategories} icon={FolderTree} color="purple" change={stats.changes?.categories} index={6} />
        <CardStat
          title="Chờ duyệt"
          value={stats.pendingRecipes}
          icon={AlertCircle}
          color="yellow"
          index={7}
          onClick={() => navigate('/recipes')}
          clickable
        />
      </div>

      {/* ── Recipe Status Summary + Growth Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status summary card */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm p-5">
          <SectionHeader
            icon={CheckCircle}
            title="Tình trạng công thức"
            subtitle={`Tổng ${stats.totalRecipes} công thức`}
            iconColor="text-green-600"
            iconBg="bg-green-50 dark:bg-green-900/20"
          />

          <div className="space-y-3 mb-4">
            {[
              { label: 'Đã duyệt', count: stats.approvedRecipes, color: 'bg-emerald-500', pct: stats.totalRecipes ? Math.round(stats.approvedRecipes / stats.totalRecipes * 100) : 0 },
              { label: 'Chờ duyệt', count: stats.pendingRecipes, color: 'bg-amber-500', pct: stats.totalRecipes ? Math.round(stats.pendingRecipes / stats.totalRecipes * 100) : 0 },
              { label: 'Từ chối', count: stats.rejectedRecipes, color: 'bg-red-500', pct: stats.totalRecipes ? Math.round(stats.rejectedRecipes / stats.totalRecipes * 100) : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.count}</span>
                    <span className="text-xs text-gray-400 w-8 text-right">{item.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-[#3A3A3A] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-50 dark:border-[#3A3A3A] flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-[#3A3A3A] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full" style={{ width: `${approvalRate}%` }} />
            </div>
            <span className="text-xs font-bold text-orange-500">{approvalRate}% tỷ lệ duyệt</span>
          </div>
        </div>

        {/* Growth chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm p-5">
          <SectionHeader
            icon={TrendingUp}
            title="Tăng trưởng người dùng"
            subtitle="Số người dùng mới theo thời gian"
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/20"
          />
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8C42" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF8C42" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name="Người dùng mới" stroke="#FF8C42" strokeWidth={2.5} fill="url(#colorGrowth)" dot={false} activeDot={{ r: 5, fill: '#FF8C42', strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[220px] text-gray-300 dark:text-gray-600">
              <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm font-medium">Chưa có dữ liệu tăng trưởng</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category distribution */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm p-5">
          <SectionHeader
            icon={BarChart3}
            title="Phân bố danh mục"
            subtitle="Tỷ lệ công thức theo từng loại"
            iconColor="text-purple-600"
            iconBg="bg-purple-50 dark:bg-purple-900/20"
          />
          {categoryDistribution.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryDistribution.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{item.name}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-gray-300 dark:text-gray-600">
              <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">Chưa có dữ liệu</p>
            </div>
          )}
        </div>

        {/* Recipe status bar chart */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm p-5">
          <SectionHeader
            icon={Activity}
            title="Trạng thái công thức"
            subtitle="Phân loại theo trạng thái duyệt"
            iconColor="text-orange-500"
            iconBg="bg-orange-50 dark:bg-orange-900/20"
          />
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusDistribution} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Số lượng" radius={[6, 6, 0, 0]}>
                  {statusDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-gray-300 dark:text-gray-600">
              <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Recipes + Top Users + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top recipes */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm p-5">
          <SectionHeader
            icon={Award}
            title="Top công thức"
            subtitle="Được yêu thích nhất"
            iconColor="text-amber-500"
            iconBg="bg-amber-50 dark:bg-amber-900/20"
          />
          <div className="space-y-2">
            {topRecipes.length > 0 ? (
              topRecipes.map((recipe, i) => (
                <div
                  key={recipe._id}
                  onClick={() => navigate(`/recipes?search=${encodeURIComponent(recipe.title)}`)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50/50 dark:hover:bg-[#333333] transition-colors cursor-pointer group"
                >
                  <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white' : i === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 dark:bg-[#3A3A3A] text-gray-500 dark:text-gray-400'
                  }`}>{i + 1}</span>
                  {recipe.imageUrl && (
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-orange-600 transition-colors">{recipe.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-400" />{recipe.likes}
                      </span>
                      {recipe.rating > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          ⭐ {recipe.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* Top users */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm p-5">
          <SectionHeader
            icon={Users}
            title="Top người dùng"
            subtitle="Tích cực nhất hệ thống"
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/20"
          />
          <div className="space-y-2">
            {topUsers.length > 0 ? (
              topUsers.map((user, i) => (
                <div
                  key={user._id}
                  onClick={() => navigate(`/users?search=${encodeURIComponent(user.email)}`)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/50 dark:hover:bg-[#333333] transition-colors cursor-pointer group"
                >
                  <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white' : i === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 dark:bg-[#3A3A3A] text-gray-500 dark:text-gray-400'
                  }`}>{i + 1}</span>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-[#3A3A3A]" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=FF8C42&color=fff`; }} />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ring-2 ring-white dark:ring-[#3A3A3A]">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{user.name || user.email}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <ChefHat className="w-3 h-3 text-orange-400" />{user.recipeCount} công thức
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-gray-100 dark:border-[#3A3A3A] shadow-sm p-5">
          <SectionHeader
            icon={Clock}
            title="Hoạt động gần đây"
            subtitle="Lịch sử hoạt động hệ thống"
            iconColor="text-violet-600"
            iconBg="bg-violet-50 dark:bg-violet-900/20"
          />
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {activityLogs.length > 0 ? (
              activityLogs.map((log, i) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-violet-50/30 dark:hover:bg-[#333333] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug truncate">{log.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{log.user} • {log.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300 dark:text-gray-600">
                <Clock className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">Chưa có hoạt động</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

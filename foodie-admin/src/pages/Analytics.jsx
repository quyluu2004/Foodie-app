import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../utils/api';

const COLORS = ['#FF4D4D', '#FFA94D', '#4CAF50', '#2196F3', '#9C27B0'];

export default function Analytics() {
  const [topRecipes, setTopRecipes] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [recipeGrowth, setRecipeGrowth] = useState([]);
  const [interactionData, setInteractionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Lấy dữ liệu từ API analytics stats
      const analyticsRes = await api.get('/stats/analytics');
      const analyticsData = analyticsRes.data;
      
      if (analyticsData.topRecipes) {
        setTopRecipes(analyticsData.topRecipes);
      } else {
        setTopRecipes([]);
      }
      
      if (analyticsData.userGrowth) {
        setUserGrowth(analyticsData.userGrowth);
      } else {
        setUserGrowth([]);
      }
      
      if (analyticsData.recipeGrowth) {
        setRecipeGrowth(analyticsData.recipeGrowth);
      } else {
        setRecipeGrowth([]);
      }
      
      if (analyticsData.interactionData) {
        setInteractionData(analyticsData.interactionData);
      } else {
        setInteractionData([]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data if API fails
      setTopRecipes([]);
      setUserGrowth([]);
      setRecipeGrowth([]);
      setInteractionData([]);
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
    <div className="p-4 lg:p-6 space-y-6 w-full animate__animated animate__fadeInUp page-transition">
      <div className="animate__animated animate__fadeInDown">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 header-gradient inline-block">
          📊 Thống kê & Phân tích
        </h1>
        <p className="text-gray-600 mt-2">Phân tích dữ liệu hệ thống Foodie</p>
      </div>

      {/* Top Recipes */}
      <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top món ăn được yêu thích nhất</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topRecipes}>
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
            <Legend />
            <Bar dataKey="likes" fill="#FF4D4D" name="Lượt thích" />
            <Bar dataKey="saves" fill="#FFA94D" name="Lượt lưu" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tăng trưởng người dùng</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#FF4D4D"
                strokeWidth={2}
                name="Số người dùng"
                dot={{ fill: '#FF4D4D', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tăng trưởng công thức</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recipeGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="recipes"
                stroke="#FFA94D"
                strokeWidth={2}
                name="Số công thức"
                dot={{ fill: '#FFA94D', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interaction Chart */}
      <div className="bg-white rounded-card p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Phân tích tương tác</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={interactionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {interactionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


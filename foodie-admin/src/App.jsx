import { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// ========================================
// 🚀 Lazy Loading — Mỗi page được tải riêng biệt
// Chỉ tải khi user navigate đến trang đó
// Giảm initial bundle size đáng kể
// ========================================
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Recipes = lazy(() => import('./pages/Recipes'));
const Posts = lazy(() => import('./pages/Posts'));
const Homepage = lazy(() => import('./pages/Homepage'));
const Categories = lazy(() => import('./pages/Categories'));
const Comments = lazy(() => import('./pages/Comments'));
const Ratings = lazy(() => import('./pages/Ratings'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Chat = lazy(() => import('./pages/Chat'));
const Notifications = lazy(() => import('./pages/Notifications'));
const CreatorRequests = lazy(() => import('./pages/CreatorRequests'));

// Loading spinner khi đang tải page
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', minHeight: '400px', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '48px', height: '48px', border: '4px solid #FF8C42',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#999', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
        Đang tải...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Error boundary để catch lỗi
  try {
    return (
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Login Route - Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - Require Authentication */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex h-screen bg-gray-50 dark:bg-[#2D2D2D]">
                    <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
                    <div
                      className={`flex-1 flex flex-col ml-0 lg:ml-${sidebarCollapsed ? '20' : '64'} w-full lg:w-auto transition-all duration-300`}
                      style={{ marginLeft: sidebarCollapsed ? '80px' : '256px' }}
                    >
                      <Navbar onToggleSidebar={toggleSidebar} isSidebarCollapsed={sidebarCollapsed} />
                      <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full bg-white dark:bg-[#2D2D2D]">
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/recipes" element={<Recipes />} />
                            <Route path="/posts" element={<Posts />} />
                            <Route path="/homepage" element={<Homepage />} />
                            <Route path="/categories" element={<Categories />} />
                            <Route path="/chat" element={<Chat />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/comments" element={<Comments />} />
                            <Route path="/ratings" element={<Ratings />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/creator-requests" element={<CreatorRequests />} />
                          </Routes>
                        </Suspense>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    );
  } catch (error) {
    console.error('App Error:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '800px',
          margin: '20px auto'
        }}>
          <h1 style={{ color: '#FF4D4D', marginBottom: '10px' }}>⚠️ Lỗi khi render App</h1>
          <p style={{ color: '#666', marginBottom: '10px' }}>{error.message}</p>
          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', color: '#FF4D4D', fontWeight: 'bold' }}>Chi tiết lỗi</summary>
            <pre style={{
              backgroundColor: '#F5F5F5',
              padding: '10px',
              borderRadius: '8px',
              overflow: 'auto',
              marginTop: '10px',
              fontSize: '12px'
            }}>{error.stack}</pre>
          </details>
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#FFF3CD', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: '#856404' }}>
              <strong>💡 Gợi ý:</strong> Mở Browser Console (F12) để xem chi tiết lỗi.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

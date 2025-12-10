import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Recipes from './pages/Recipes';
import Posts from './pages/Posts';
import Homepage from './pages/Homepage';
import Categories from './pages/Categories';
import Comments from './pages/Comments';
import Ratings from './pages/Ratings';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Login from './pages/Login';

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
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/recipes" element={<Recipes />} />
                        <Route path="/posts" element={<Posts />} />
                        <Route path="/homepage" element={<Homepage />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/comments" element={<Comments />} />
                        <Route path="/ratings" element={<Ratings />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/analytics" element={<Analytics />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
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

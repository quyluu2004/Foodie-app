import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ChefHat } from 'lucide-react';
import api from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password,
      });

      if (response.data?.token) {
        // Lưu token vào localStorage
        localStorage.setItem('adminToken', response.data.token);
        
        // Lưu thông tin user (optional)
        if (response.data.user) {
          localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        }

        // Redirect về Dashboard
        navigate('/');
      } else {
        setError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animate__animated animate__fadeIn" style={{ backgroundColor: '#f9fafc' }}>
      <div className="max-w-md w-full mx-4 animate__animated animate__fadeInUp">
        {/* Logo và Title */}
        <div className="text-center mb-8 animate__animated animate__fadeInDown">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-4 shadow-lg animate__animated animate__pulse">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 header-gradient inline-block">Foodie Admin</h1>
          <p className="text-gray-600 mt-2">Đăng nhập để quản trị hệ thống</p>
        </div>

        {/* Login Form */}
        <div className="card animate__animated animate__fadeInUp animate-delay-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate__animated animate__shakeX">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          {/* Default Credentials Hint */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              💡 Tài khoản mặc định: <strong>Admin@123</strong> / <strong>123456</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Foodie Admin. All rights reserved.
        </p>
      </div>
    </div>
  );
}


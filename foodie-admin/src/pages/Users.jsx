import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TableUsers from '../components/TableUsers';
import ModalPromote from '../components/ModalPromote';
import api from '../utils/api';
import { X, Key, User, Mail, Calendar, Shield, ArrowUp, Plus } from 'lucide-react';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: '',
    gender: '',
    birthDate: '',
    role: 'user',
  });
  const [addAvatarFile, setAddAvatarFile] = useState(null);
  const [addAvatarPreview, setAddAvatarPreview] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (userId, reason) => {
    try {
      const response = await api.put(`/auth/users/${userId}/promote`, {
        role: 'creator',
        reason: reason
      });
      
      // Refresh danh sách users
      await fetchUsers();
      
      // Show success message
      alert('✅ Đã nâng cấp user lên Creator thành công!\n📧 Email thông báo đã được gửi cho user.');
      
      return response.data;
    } catch (error) {
      console.error('Error promoting user:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi nâng cấp user';
      throw new Error(errorMessage);
    }
  };

  const handleOpenPromoteModal = (user) => {
    setSelectedUser(user);
    setShowPromoteModal(true);
  };

  const handleDelete = async (userId) => {
    if (!confirm('Bạn có chắc muốn xóa user này?')) return;
    
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
      alert('Đã xóa user thành công!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Có lỗi xảy ra khi xóa user');
    }
  };

  const handleViewDetail = async (user) => {
    try {
      const response = await api.get(`/auth/users/${user._id}/detail`);
      setSelectedUser(response.data?.user || user);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching user detail:', error);
      // Fallback to basic user info
      setSelectedUser(user);
      setShowDetailModal(true);
    }
  };

  const handleChatWithUser = (user) => {
    // Navigate to chat page with user ID
    navigate(`/chat?userId=${user._id}&userName=${encodeURIComponent(user.name || 'Người dùng')}`);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (!confirm(`Bạn có chắc muốn đổi mật khẩu cho ${selectedUser?.name}? Mật khẩu mới sẽ được gửi cho người dùng qua tin nhắn.`)) {
      return;
    }

    try {
      setChangingPassword(true);
      await api.put(`/auth/users/${selectedUser._id}/password`, { newPassword });
      alert('Đổi mật khẩu thành công! Mật khẩu mới đã được gửi cho người dùng qua tin nhắn.');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!addFormData.name.trim() || !addFormData.email.trim() || !addFormData.password) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (addFormData.password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (addFormData.password !== addFormData.confirmPassword) {
      alert('Mật khẩu và xác nhận mật khẩu không khớp');
      return;
    }

    try {
      setCreatingUser(true);
      const formDataToSend = new FormData();
      formDataToSend.append('name', addFormData.name.trim());
      formDataToSend.append('email', addFormData.email.trim().toLowerCase());
      formDataToSend.append('password', addFormData.password);
      if (addFormData.phone) formDataToSend.append('phone', addFormData.phone.trim());
      if (addFormData.bio) formDataToSend.append('bio', addFormData.bio.trim());
      if (addFormData.gender) formDataToSend.append('gender', addFormData.gender);
      if (addFormData.birthDate) formDataToSend.append('birthDate', addFormData.birthDate);
      if (addAvatarFile) formDataToSend.append('avatar', addAvatarFile);

      // Tạo user với role được chỉ định
      const response = await api.post('/auth/register', formDataToSend, {
        headers: {
          // Không set Content-Type, để axios tự động set với boundary
        },
      });

      // Nếu role không phải user, cần promote user sau khi tạo
      if (addFormData.role !== 'user') {
        const userId = response.data?.user?._id;
        if (userId) {
          await api.put(`/auth/users/${userId}/promote`, {
            role: addFormData.role,
            reason: `Admin tạo tài khoản với vai trò ${addFormData.role}`
          });
        }
      }

      alert('Đã tạo người dùng thành công!');
      setShowAddModal(false);
      setAddFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        bio: '',
        gender: '',
        birthDate: '',
        role: 'user',
      });
      setAddAvatarPreview(null);
      setAddAvatarFile(null);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error response:', error.response?.data);
      alert(`Có lỗi xảy ra khi tạo người dùng: ${error.response?.data?.message || error.message}`);
    } finally {
      setCreatingUser(false);
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
    <div className="p-4 lg:p-6 animate__animated animate__fadeInUp page-transition w-full">
      <div className="mb-6 animate__animated animate__fadeInDown">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-[#FFFFFF] mb-2 header-gradient inline-block">
              👥 Quản lý người dùng
            </h1>
            <p className="text-gray-600 dark:text-[#E5E5E5] mt-2">Quản lý tất cả người dùng trong hệ thống</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors font-semibold shadow-lg hover:shadow-xl animate__animated animate__fadeIn"
          >
            <Plus className="w-5 h-5" />
            Thêm người dùng
          </button>
        </div>
      </div>
      <div className="animate__animated animate__fadeInUp animate-delay-200">
        <TableUsers 
          users={users} 
          onPromote={handleOpenPromoteModal} 
          onDelete={handleDelete}
          onViewDetail={handleViewDetail}
          onChat={handleChatWithUser}
        />
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl dark:shadow-2xl border dark:border-[#404040] max-w-2xl w-full max-h-[90vh] flex flex-col animate__animated animate__zoomIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#404040]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#FFFFFF]">Chi tiết người dùng</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-[#FFFFFF]">{selectedUser.name}</h3>
                    <p className="text-gray-600 dark:text-[#E5E5E5]">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#333333] rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-[#E5E5E5]" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-[#FFFFFF]">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#333333] rounded-lg">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-[#E5E5E5]" />
                    <div>
                      <p className="text-xs text-gray-500">Vai trò</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-[#FFFFFF]">
                        {selectedUser.role === 'admin' ? 'Quản trị' :
                         selectedUser.role === 'creator' ? 'Người tạo' : 'Người dùng'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#333333] rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-[#E5E5E5]" />
                    <div>
                      <p className="text-xs text-gray-500">Ngày đăng ký</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-[#FFFFFF]">
                        {selectedUser.createdAt 
                          ? new Date(selectedUser.createdAt).toLocaleString('vi-VN')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {selectedUser.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#333333] rounded-lg">
                      <User className="w-5 h-5 text-gray-600 dark:text-[#E5E5E5]" />
                      <div>
                        <p className="text-xs text-gray-500">Số điện thoại</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-[#FFFFFF]">{selectedUser.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedUser.bio && (
                  <div className="p-3 bg-gray-50 dark:bg-[#333333] rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Giới thiệu</p>
                    <p className="text-sm text-gray-900 dark:text-[#FFFFFF]">{selectedUser.bio}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-[#404040]">
              {selectedUser.role !== 'creator' && selectedUser.role !== 'admin' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenPromoteModal(selectedUser);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <ArrowUp className="w-4 h-4" />
                  Nâng cấp lên Creator
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowPasswordModal(true);
                }}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <Key className="w-4 h-4" />
                Đổi mật khẩu
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedUser(null);
                }}
                className="px-6 py-2.5 border border-gray-300 dark:border-[#404040] rounded-lg text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl dark:shadow-2xl border dark:border-[#404040] max-w-md w-full animate__animated animate__zoomIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#404040]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#FFFFFF]">Đổi mật khẩu</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Đổi mật khẩu cho <span className="font-semibold">{selectedUser.name}</span> ({selectedUser.email})
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-[#404040]">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-6 py-2.5 border border-gray-300 dark:border-[#404040] rounded-lg text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  changingPassword || !newPassword || !confirmPassword
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      <ModalPromote
        isOpen={showPromoteModal}
        onClose={() => {
          setShowPromoteModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onPromote={handlePromote}
      />

      {/* Modal thêm người dùng mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl dark:shadow-2xl dark:border dark:border-[#404040] max-w-2xl w-full max-h-[90vh] flex flex-col animate__animated animate__zoomIn my-auto dark:text-[#FFFFFF]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#404040] flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-[#FFFFFF]">Thêm người dùng mới</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    phone: '',
                    bio: '',
                    gender: '',
                    birthDate: '',
                    role: 'user',
                  });
                  setAddAvatarPreview(null);
                  setAddAvatarFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleAddUser} id="add-user-form" className="space-y-4">
                {/* Name */}
                <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">
                    Tên người dùng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                    required
                    placeholder="Nhập tên người dùng..."
                  />
                </div>

                {/* Email */}
                <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                    required
                    placeholder="Nhập email..."
                  />
                </div>

                {/* Password */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={addFormData.password}
                        onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                        minLength="6"
                        required
                        placeholder="Tối thiểu 6 ký tự"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={addFormData.confirmPassword}
                        onChange={(e) => setAddFormData({ ...addFormData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                        minLength="6"
                        required
                        placeholder="Nhập lại mật khẩu"
                      />
                    </div>
                  </div>
                </div>

                {/* Role */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">
                    Vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addFormData.role}
                    onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                    required
                  >
                    <option value="user">Người dùng</option>
                    <option value="creator">Người tạo</option>
                    <option value="admin">Quản trị</option>
                  </select>
                </div>

                {/* Phone, Gender, BirthDate */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Số điện thoại</label>
                      <input
                        type="tel"
                        value={addFormData.phone}
                        onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                        placeholder="Ví dụ: 0123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Giới tính</label>
                      <select
                        value={addFormData.gender}
                        onChange={(e) => setAddFormData({ ...addFormData, gender: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Ngày sinh</label>
                      <input
                        type="date"
                        value={addFormData.birthDate}
                        onChange={(e) => setAddFormData({ ...addFormData, birthDate: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Giới thiệu</label>
                  <textarea
                    value={addFormData.bio}
                    onChange={(e) => setAddFormData({ ...addFormData, bio: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium"
                    rows="3"
                    placeholder="Nhập giới thiệu về người dùng..."
                  />
                </div>

                {/* Avatar */}
                  <div className="bg-white dark:bg-[#333333] p-4 rounded-lg border border-gray-200 dark:border-[#404040] shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-[#E5E5E5] mb-3">Ảnh đại diện</label>
                  {addAvatarPreview && (
                    <div className="relative mb-4">
                      <img
                        src={addAvatarPreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-full border-2 border-orange-300 dark:border-orange-600 shadow-md"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setAddAvatarFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAddAvatarPreview(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-[#333333] text-gray-900 dark:text-[#FFFFFF] font-medium cursor-pointer"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-[#404040] bg-white dark:bg-[#333333] rounded-b-lg flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    phone: '',
                    bio: '',
                    gender: '',
                    birthDate: '',
                    role: 'user',
                  });
                  setAddAvatarPreview(null);
                  setAddAvatarFile(null);
                }}
                className="px-6 py-2.5 border border-gray-300 dark:border-[#404040] rounded-lg text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="add-user-form"
                disabled={creatingUser}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  creatingUser
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                }`}
              >
                {creatingUser ? (
                  'Đang tạo...'
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Lưu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


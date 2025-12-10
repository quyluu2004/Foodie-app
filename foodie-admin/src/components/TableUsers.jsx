import { useState } from 'react';
import { Search, Filter, MoreVertical, UserCheck, Trash2, Eye, MessageCircle } from 'lucide-react';

export default function TableUsers({ users = [], onPromote, onDelete, onViewDetail, onChat }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-white dark:bg-[#333333] rounded-card shadow-sm dark:shadow-lg border border-gray-100 dark:border-[#404040]">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Danh sách người dùng</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả</option>
              <option value="user">Người dùng</option>
              <option value="creator">Người tạo</option>
              <option value="admin">Quản trị</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#1A1A1A]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người dùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tham gia
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-[#404040]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-[#E5E5E5]">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-[#404040]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="ml-4">
                        <div 
                          className="text-sm font-medium text-gray-900 dark:text-[#FFFFFF] cursor-pointer hover:text-primary transition-colors"
                          onClick={() => onViewDetail?.(user)}
                          title="Click để xem chi tiết"
                        >
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-[#E5E5E5]">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'creator'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role === 'admin'
                        ? 'Quản trị'
                        : user.role === 'creator'
                        ? 'Người tạo'
                        : 'Người dùng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-[#E5E5E5]">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewDetail?.(user)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onChat?.(user)}
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                        title="Chat trực tiếp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      {user.role !== 'creator' && user.role !== 'admin' && (
                        <button
                          onClick={() => onPromote?.(user)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Nâng cấp lên Creator"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete?.(user._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


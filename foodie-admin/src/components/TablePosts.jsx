import { useState } from 'react';
import { Search, Eye, Edit, Trash2 } from 'lucide-react';

export default function TablePosts({ posts = [], onEdit, onDelete }) {
  // onDelete now receives the full post object instead of just postId
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Danh sách bài đăng</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary hover:border-gray-400 transition-all bg-white dark:bg-gray-800 text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ảnh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Nội dung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Người đăng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Lượt thích
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Bình luận
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ngày đăng
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => {
                // Get user info
                const userName = (() => {
                  const user = post.user;
                  if (typeof user === 'object' && user !== null) {
                    return user.name || user.email || 'N/A';
                  }
                  if (typeof user === 'string') {
                    return user;
                  }
                  return 'N/A';
                })();

                const userEmail = (() => {
                  const user = post.user;
                  if (typeof user === 'object' && user !== null) {
                    return user.email || '';
                  }
                  return '';
                })();

                // Normalize image URL
                const normalizeImageUrl = (url) => {
                  if (!url) return null;
                  return url
                    .replace(/192\.168\.1\.50/g, '192.168.2.229')
                    .replace(/192\.168\.1\.52/g, '192.168.2.229')
                    .replace(/192\.168\.1\.197/g, '192.168.2.229')
                    .replace(/192\.168\.2\.39/g, '192.168.2.229')
                    .replace(/10\.12\.117\.94/g, '192.168.2.229')
                    .replace(/172\.16\.1\.238/g, '192.168.2.229')
                    .replace(/localhost/g, '192.168.2.229');
                };

                const normalizedImageUrl = normalizeImageUrl(post.imageUrl);

                // Check if image exists and is valid
                const hasImage = normalizedImageUrl && 
                                 normalizedImageUrl.trim() !== '' && 
                                 normalizedImageUrl !== 'null' && 
                                 normalizedImageUrl !== 'undefined';

                const commentsCount = post.comments?.length || 0;
                const likesCount = post.likes?.length || 0;

                return (
                <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 table-row">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative w-20 h-20">
                      {hasImage ? (
                        <>
                          <img
                            src={normalizedImageUrl}
                            alt={post.caption || 'Post'}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="image-placeholder w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 hidden"
                          >
                            <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-1">No Image</span>
                          </div>
                        </>
                      ) : (
                        <div className="image-placeholder w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                          <span className="text-gray-400 dark:text-gray-500 text-xs text-center px-1">No Image</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 max-w-xs">
                      {post.caption || 'Không có nội dung'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{userName}</div>
                    {userEmail && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{userEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium">
                      ❤️ {likesCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">
                      💬 {commentsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString('vi-VN')
                      : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit?.(post)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-all duration-200"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete?.(post)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-all duration-200"
                        title="Xóa bài đăng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


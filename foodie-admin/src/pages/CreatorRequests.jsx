import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  FileText,
  ExternalLink,
  X
} from 'lucide-react';

export default function CreatorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.get(`/creator-requests${params}`);
      setRequests(response.data?.requests || []);
    } catch (error) {
      console.error('Error fetching creator requests:', error);
      alert('Có lỗi xảy ra khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (requestId) => {
    try {
      const response = await api.get(`/creator-requests/${requestId}`);
      setSelectedRequest(response.data?.request);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching request detail:', error);
      alert('Có lỗi xảy ra khi tải chi tiết yêu cầu');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await api.put(`/creator-requests/${selectedRequest._id}/approve`, {
        adminNotes: adminNotes.trim()
      });
      
      alert('✅ Đã duyệt yêu cầu và nâng cấp user lên Creator thành công!');
      setShowApproveModal(false);
      setShowDetailModal(false);
      setAdminNotes('');
      await fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối (ít nhất 10 ký tự)');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      alert('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/creator-requests/${selectedRequest._id}/reject`, {
        rejectionReason: rejectionReason.trim(),
        adminNotes: adminNotes.trim()
      });
      
      alert('✅ Đã từ chối yêu cầu thành công!');
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectionReason('');
      setAdminNotes('');
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối yêu cầu');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: (
        <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Đang chờ
        </span>
      ),
      approved: (
        <span className="text-xs font-medium text-green-800 dark:text-green-200 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Đã duyệt
        </span>
      ),
      rejected: (
        <span className="text-xs font-medium text-red-800 dark:text-red-200 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Đã từ chối
        </span>
      ),
    };
    return badges[status] || badges.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C42] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Yêu cầu đăng ký Creator</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Xem xét và xử lý các yêu cầu đăng ký trở thành Creator
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#FF8C42] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-[#FF8C42] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Đang chờ ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'bg-[#FF8C42] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Đã duyệt
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-[#FF8C42] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Đã từ chối
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thông tin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ngày gửi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1F1F1F] divide-y divide-gray-200 dark:divide-gray-700">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Không có yêu cầu nào
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={request.user?.avatarUrl || 'https://via.placeholder.com/40'}
                          alt={request.user?.name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.user?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {request.user?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{request.fullName}</div>
                        {request.specialties && request.specialties.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Chuyên môn: {request.specialties.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetail(request._id)}
                        className="text-[#FF8C42] hover:text-[#FF6B35] flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Chi tiết yêu cầu</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin người dùng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tên</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Số điện thoại</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.user?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Vai trò hiện tại</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.user?.role || 'user'}</p>
                  </div>
                </div>
              </div>

              {/* Request Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Thông tin yêu cầu
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Họ và tên</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white">{selectedRequest.email}</p>
                  </div>
                  {selectedRequest.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Số điện thoại</label>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.phone}</p>
                    </div>
                  )}
                  {selectedRequest.bio && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Giới thiệu</label>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.bio}</p>
                    </div>
                  )}
                  {selectedRequest.experience && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Kinh nghiệm</label>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.experience}</p>
                    </div>
                  )}
                  {selectedRequest.specialties && selectedRequest.specialties.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Chuyên môn</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedRequest.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#FF8C42] text-white rounded-full text-sm"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedRequest.socialLinks && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Liên kết mạng xã hội</label>
                      <div className="space-y-2 mt-2">
                        {selectedRequest.socialLinks.facebook && (
                          <a
                            href={selectedRequest.socialLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Facebook
                          </a>
                        )}
                        {selectedRequest.socialLinks.instagram && (
                          <a
                            href={selectedRequest.socialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-pink-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Instagram
                          </a>
                        )}
                        {selectedRequest.socialLinks.youtube && (
                          <a
                            href={selectedRequest.socialLinks.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-red-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            YouTube
                          </a>
                        )}
                        {selectedRequest.socialLinks.website && (
                          <a
                            href={selectedRequest.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Lý do muốn trở thành Creator</label>
                    <p className="text-gray-900 dark:text-white mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {selectedRequest.motivation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Review Info */}
              {selectedRequest.status !== 'pending' && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin xử lý</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Người xử lý</label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedRequest.reviewedBy?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian xử lý</label>
                      <p className="text-gray-900 dark:text-white">{formatDate(selectedRequest.reviewedAt)}</p>
                    </div>
                    {selectedRequest.rejectionReason && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Lý do từ chối</label>
                        <p className="text-gray-900 dark:text-white">{selectedRequest.rejectionReason}</p>
                      </div>
                    )}
                    {selectedRequest.adminNotes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ghi chú từ admin</label>
                        <p className="text-gray-900 dark:text-white">{selectedRequest.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowApproveModal(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Duyệt yêu cầu
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Duyệt yêu cầu</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF8C42] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows="4"
                  placeholder="Nhập ghi chú cho user (nếu có)"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setAdminNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Từ chối yêu cầu</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lý do từ chối *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF8C42] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows="4"
                  placeholder="Nhập lý do từ chối (ít nhất 10 ký tự)"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {rejectionReason.length}/10 ký tự tối thiểu
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#FF8C42] focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows="3"
                  placeholder="Nhập ghi chú cho user (nếu có)"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setAdminNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || rejectionReason.trim().length < 10}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


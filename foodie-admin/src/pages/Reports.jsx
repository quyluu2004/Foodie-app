import { useState, useEffect } from 'react';
import { Flag, Trash2, CheckCircle, XCircle, X } from 'lucide-react';
import api from '../utils/api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveAction, setResolveAction] = useState('ignore'); // 'delete', 'warn', 'ignore'
  const [resolveReason, setResolveReason] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports');
      setReports(response.data?.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClick = (report) => {
    setSelectedReport(report);
    setResolveAction('ignore');
    setResolveReason('');
    setShowResolveModal(true);
  };

  const handleResolveConfirm = async () => {
    if (!selectedReport) return;

    try {
      const response = await api.put(`/reports/${selectedReport._id}/resolve`, {
        action: resolveAction,
        reason: resolveReason.trim(),
      });
      
      setReports(reports.map(r => 
        r._id === selectedReport._id ? { ...r, status: 'resolved', resolvedBy: response.data.report.resolvedBy, resolvedAt: response.data.report.resolvedAt } : r
      ));
      
      setShowResolveModal(false);
      setSelectedReport(null);
      setResolveAction('ignore');
      setResolveReason('');
      
      const actionMessages = {
        delete: 'Đã xóa nội dung vi phạm',
        warn: 'Đã cảnh báo người dùng',
        ignore: 'Đã đánh dấu báo cáo đã xử lý'
      };
      alert(actionMessages[resolveAction] || 'Đã xử lý báo cáo!');
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Có lỗi xảy ra khi xử lý báo cáo');
    }
  };

  const handleDelete = async (reportId, targetType, targetId) => {
    if (!confirm('Bạn có chắc muốn xóa báo cáo này?')) return;
    
    try {
      await api.delete(`/reports/${reportId}`);
      setReports(reports.filter((r) => r._id !== reportId));
      alert('Đã xóa báo cáo!');
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Có lỗi xảy ra khi xóa báo cáo');
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'recipe':
        return 'Công thức';
      case 'post':
        return 'Bài đăng';
      case 'comment':
        return 'Bình luận';
      case 'user':
        return 'Người dùng';
      default:
        return type;
    }
  };

  const getTargetContent = (report) => {
    if (report.targetInfo) {
      if (report.type === 'recipe') {
        return report.targetInfo.title || 'N/A';
      } else if (report.type === 'post') {
        return report.targetInfo.caption || 'N/A';
      } else if (report.type === 'comment') {
        return report.targetInfo.text || 'N/A';
      }
    }
    return 'N/A';
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
    <div className="p-4 lg:p-6 w-full animate__animated animate__fadeInUp page-transition">
      <div className="mb-6 animate__animated animate__fadeInDown">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 header-gradient inline-block">
          🚩 Quản lý báo cáo
        </h1>
        <p className="text-gray-600 mt-2">Xử lý các báo cáo vi phạm từ người dùng</p>
        {reports.length > 0 && (
          <p className="text-sm text-gray-500 mt-2 animate__animated animate__fadeIn">
            Tổng: <strong className="text-primary">{reports.length}</strong> báo cáo
            {' • '}
            <strong className="text-yellow-600">
              {reports.filter(r => r.status === 'pending').length} chờ xử lý
            </strong>
          </p>
        )}
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-white rounded-card p-8 text-center text-gray-500 shadow-sm border border-gray-100">
            Không có báo cáo nào
          </div>
        ) : (
          reports.map((report) => (
            <div key={report._id} className="bg-white rounded-card p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Flag className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{report.reason}</h3>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : report.status === 'resolved'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-300'
                      }`}
                    >
                      {report.status === 'pending' ? '⏳ Chờ xử lý' : report.status === 'resolved' ? '✅ Đã xử lý' : '❌ Đã từ chối'}
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-gray-600 mb-3">{report.description}</p>
                  )}
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      <span className="font-medium">Người báo cáo:</span>{' '}
                      {report.reporter?.name || 'N/A'} ({report.reporter?.email || 'N/A'})
                    </p>
                    <p>
                      <span className="font-medium">Loại:</span> {getTypeLabel(report.type)}
                    </p>
                    <p>
                      <span className="font-medium">Nội dung:</span> {getTargetContent(report)}
                    </p>
                    <p>
                      <span className="font-medium">Thời gian:</span>{' '}
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {report.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolveClick(report)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors hover:scale-105 active:scale-95"
                      title="Xử lý báo cáo"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(report._id, report.type, report.targetId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:scale-105 active:scale-95"
                      title="Xóa báo cáo"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate__animated animate__fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate__animated animate__zoomIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Xử lý báo cáo</h3>
              <button 
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedReport(null);
                  setResolveAction('ignore');
                  setResolveReason('');
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Lý do báo cáo:</strong> {selectedReport.reason}
              </p>
              {selectedReport.description && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Mô tả:</strong> {selectedReport.description}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hành động xử lý:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="ignore"
                    checked={resolveAction === 'ignore'}
                    onChange={(e) => setResolveAction(e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">Bỏ qua (chỉ đánh dấu đã xử lý)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="warn"
                    checked={resolveAction === 'warn'}
                    onChange={(e) => setResolveAction(e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">Cảnh báo người dùng</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="delete"
                    checked={resolveAction === 'delete'}
                    onChange={(e) => setResolveAction(e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-red-600 font-semibold">
                    Xóa nội dung vi phạm
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="resolveReason" className="block text-sm font-medium text-gray-700 mb-2">
                Lý do xử lý (tùy chọn):
              </label>
              <textarea
                id="resolveReason"
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                placeholder="Nhập lý do xử lý..."
              ></textarea>
            </div>

            {resolveAction === 'delete' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Cảnh báo:</strong> Hành động này sẽ xóa vĩnh viễn nội dung bị báo cáo và gửi thông báo cho tác giả.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedReport(null);
                  setResolveAction('ignore');
                  setResolveReason('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleResolveConfirm}
                className={`px-4 py-2 rounded-md transition-colors ${
                  resolveAction === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : resolveAction === 'warn'
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {resolveAction === 'delete' ? 'Xóa nội dung' : resolveAction === 'warn' ? 'Cảnh báo' : 'Xử lý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


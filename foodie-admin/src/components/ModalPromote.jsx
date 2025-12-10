import { useState } from 'react';
import { X, ArrowUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function ModalPromote({ 
  isOpen, 
  onClose, 
  user, 
  onPromote 
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form khi modal đóng/mở
  const handleClose = () => {
    setReason('');
    setError('');
    setLoading(false);
    onClose();
  };

  // Validation
  const validate = () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do nâng cấp');
      return false;
    }
    if (reason.trim().length < 10) {
      setError('Lý do nâng cấp phải có ít nhất 10 ký tự');
      return false;
    }
    if (reason.trim().length > 500) {
      setError('Lý do nâng cấp không được vượt quá 500 ký tự');
      return false;
    }
    setError('');
    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      await onPromote(user._id, reason.trim());
      handleClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi nâng cấp user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const remainingChars = 500 - reason.length;
  const canSubmit = reason.trim().length >= 10 && reason.trim().length <= 500 && !loading;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn">
      <div className="bg-white dark:bg-[#333333] rounded-lg shadow-xl dark:shadow-2xl border dark:border-[#404040] max-w-md w-full animate__animated animate__zoomIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#404040]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#FFFFFF]">
              Nâng cấp người dùng lên Creator
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="bg-gray-50 dark:bg-[#2D2D2D] rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-[#FFFFFF]">
                  {user.name || 'Người dùng'}
                </p>
                <p className="text-sm text-gray-600 dark:text-[#E5E5E5]">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-[#404040]">
              <span className="text-sm text-gray-600 dark:text-[#E5E5E5]">Vai trò hiện tại:</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 dark:bg-[#404040] text-gray-700 dark:text-[#E5E5E5]">
                {user.role === 'admin' ? 'Quản trị' : user.role === 'creator' ? 'Creator' : 'Người dùng'}
              </span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                Creator
              </span>
            </div>
          </div>

          {/* Reason Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-[#E5E5E5] mb-2">
              Lý do nâng cấp <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              onBlur={validate}
              placeholder="Nhập lý do nâng cấp user này lên Creator (tối thiểu 10 ký tự)..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 dark:border-[#404040] focus:ring-green-500'
              } bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-[#FFFFFF]`}
              rows={4}
              disabled={loading}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-[#CCCCCC]">
                💡 Ví dụ: "User đã đóng góp nhiều công thức chất lượng, xứng đáng là Creator"
              </p>
              <p className={`text-xs ${
                remainingChars < 0 
                  ? 'text-red-500' 
                  : remainingChars < 50 
                    ? 'text-yellow-500' 
                    : 'text-gray-500 dark:text-[#CCCCCC]'
              }`}>
                {remainingChars} ký tự còn lại
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Lưu ý:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>User sẽ nhận được email thông báo</li>
                  <li>Thay đổi này sẽ được ghi vào audit log</li>
                  <li>User sẽ có quyền tạo và quản lý công thức của mình</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-[#404040]">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 dark:border-[#404040] rounded-lg text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              canSubmit
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Xác nhận nâng cấp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


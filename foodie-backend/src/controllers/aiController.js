import { chatWithAI, chatWithImage } from "../services/aiService.js";

/**
 * POST /ai/chat
 * Chat với AI về nấu ăn và công thức
 * Có thể nhận cả text và image
 */
export const chat = async (req, res) => {
  const requestId = Date.now().toString();
  try {
    // console.log(`📥 [AI Controller #${requestId}] Received request`); // Debug only

    const { message } = req.body;
    const imageFile = req.file; // File từ multer

    // Nếu có hình ảnh, sử dụng chatWithImage
    if (imageFile) {
      if (!message || typeof message !== 'string') {
        // Nếu không có message, dùng message mặc định
        const result = await chatWithImage(imageFile, 'Phân tích hình ảnh này và tìm các công thức liên quan');
        return res.status(200).json({
          success: result.success,
          message: result.message
        });
      }

      const result = await chatWithImage(imageFile, message.trim());
      return res.status(200).json({
        success: result.success,
        message: result.message
      });
    }

    // Nếu không có hình ảnh, sử dụng chat thông thường
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      // console.log('⚠️ [AI Controller] Empty message');
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập câu hỏi của bạn hoặc gửi hình ảnh."
      });
    }

    if (message.length > 500) {
      // console.log('⚠️ [AI Controller] Message too long:', message.length);
      return res.status(400).json({
        success: false,
        message: "Câu hỏi quá dài. Vui lòng rút ngắn câu hỏi của bạn."
      });
    }

    const result = await chatWithAI(message.trim());

    return res.status(200).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error(`❌ [AI Controller #${requestId}] Error in AI chat controller:`, error);
    // Keep minimum error details for debugging production issues
    console.error('❌ Error message:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau."
    });
  }
};


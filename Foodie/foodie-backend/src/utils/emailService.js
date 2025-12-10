import nodemailer from 'nodemailer';

// Tạo transporter cho email
// Sử dụng Gmail SMTP hoặc service khác
const createTransporter = () => {
  // Kiểm tra xem có cấu hình email không
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Email gửi
      pass: process.env.EMAIL_PASSWORD, // App password hoặc password
    },
  };

  // Nếu không có cấu hình email, trả về null (không gửi email)
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️ Email chưa được cấu hình. Bỏ qua gửi email.');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
};

// Gửi email xác nhận đăng ký
export const sendRegistrationEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('⚠️ Không thể gửi email vì chưa cấu hình email service');
      return false;
    }

    const mailOptions = {
      from: `"Foodie App" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '🎉 Chào mừng bạn đến với Foodie!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #FF8C42 0%, #FFA366 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #FF8C42;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Chào mừng đến với Foodie!</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${userName || 'Bạn'}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Foodie</strong> - ứng dụng chia sẻ công thức nấu ăn hàng đầu!</p>
            
            <p>Tài khoản của bạn đã được tạo thành công với email: <strong>${userEmail}</strong></p>
            
            <p>Bây giờ bạn có thể:</p>
            <ul>
              <li>✅ Khám phá hàng ngàn công thức nấu ăn ngon</li>
              <li>✅ Chia sẻ công thức của riêng bạn</li>
              <li>✅ Lưu các công thức yêu thích</li>
              <li>✅ Tương tác với cộng đồng Foodie</li>
            </ul>
            
            <p>Chúc bạn có những trải nghiệm tuyệt vời với Foodie!</p>
            
            <p>Trân trọng,<br><strong>Đội ngũ Foodie</strong></p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>&copy; 2025 Foodie App. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Chào mừng đến với Foodie!

Xin chào ${userName || 'Bạn'}!

Cảm ơn bạn đã đăng ký tài khoản tại Foodie - ứng dụng chia sẻ công thức nấu ăn hàng đầu!

Tài khoản của bạn đã được tạo thành công với email: ${userEmail}

Bây giờ bạn có thể:
- Khám phá hàng ngàn công thức nấu ăn ngon
- Chia sẻ công thức của riêng bạn
- Lưu các công thức yêu thích
- Tương tác với cộng đồng Foodie

Chúc bạn có những trải nghiệm tuyệt vời với Foodie!

Trân trọng,
Đội ngũ Foodie

---
Email này được gửi tự động, vui lòng không trả lời.
© 2025 Foodie App. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email đã được gửi:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Lỗi gửi email:', error);
    // Không throw error để không làm gián đoạn quá trình đăng ký
    return false;
  }
};

// Gửi email thông báo khi user được nâng cấp lên Creator
export const sendPromotionEmail = async (userEmail, userName, reason, promotedBy) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('⚠️ Không thể gửi email vì chưa cấu hình email service');
      return false;
    }

    const mailOptions = {
      from: `"Foodie App" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '🎉 Chúc mừng! Bạn đã được nâng cấp lên Creator',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .benefits {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #10B981;
            }
            .reason-box {
              background: #F0FDF4;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #10B981;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #10B981;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Chúc mừng bạn!</h1>
            <p style="font-size: 18px; margin-top: 10px;">Bạn đã được nâng cấp lên Creator</p>
          </div>
          <div class="content">
            <h2>Xin chào ${userName || 'Bạn'}!</h2>
            <p>Chúng tôi rất vui thông báo rằng tài khoản của bạn đã được nâng cấp lên <strong>Creator</strong>!</p>
            
            <div class="benefits">
              <h3 style="margin-top: 0; color: #10B981;">🎯 Quyền lợi mới của bạn:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>✅ <strong>Tạo công thức tự do</strong> - Công thức của bạn sẽ được tự động duyệt và hiển thị ngay</li>
                <li>✅ <strong>Sửa công thức</strong> - Bạn có thể chỉnh sửa công thức đã tạo bất cứ lúc nào</li>
                <li>✅ <strong>Xóa công thức</strong> - Tự quản lý nội dung của mình</li>
                <li>✅ <strong>Tự quản lý</strong> - Không cần chờ admin duyệt, độc lập hơn</li>
                <li>✅ <strong>Và nhiều quyền lợi khác...</strong></li>
              </ul>
            </div>

            ${reason ? `
            <div class="reason-box">
              <h4 style="margin-top: 0; color: #059669;">📝 Lý do nâng cấp:</h4>
              <p style="margin: 0; font-style: italic;">"${reason}"</p>
            </div>
            ` : ''}

            <p>Cảm ơn bạn đã đóng góp cho cộng đồng Foodie! Chúng tôi tin rằng với quyền lợi mới, bạn sẽ tạo ra nhiều nội dung chất lượng hơn nữa.</p>
            
            <p style="text-align: center;">
              <a href="#" class="button">Khám phá ngay</a>
            </p>
            
            <p>Trân trọng,<br><strong>Đội ngũ Foodie Admin</strong></p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>&copy; 2025 Foodie App. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Chúc mừng! Bạn đã được nâng cấp lên Creator

Xin chào ${userName || 'Bạn'}!

Chúng tôi rất vui thông báo rằng tài khoản của bạn đã được nâng cấp lên Creator!

🎯 Quyền lợi mới của bạn:
- Tạo công thức tự do - Công thức của bạn sẽ được tự động duyệt và hiển thị ngay
- Sửa công thức - Bạn có thể chỉnh sửa công thức đã tạo bất cứ lúc nào
- Xóa công thức - Tự quản lý nội dung của mình
- Tự quản lý - Không cần chờ admin duyệt, độc lập hơn
- Và nhiều quyền lợi khác...

${reason ? `\n📝 Lý do nâng cấp:\n"${reason}"\n` : ''}

Cảm ơn bạn đã đóng góp cho cộng đồng Foodie! Chúng tôi tin rằng với quyền lợi mới, bạn sẽ tạo ra nhiều nội dung chất lượng hơn nữa.

Trân trọng,
Đội ngũ Foodie Admin

---
Email này được gửi tự động, vui lòng không trả lời.
© 2025 Foodie App. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email promotion đã được gửi:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Lỗi gửi email promotion:', error);
    return false;
  }
};


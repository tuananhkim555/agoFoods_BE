import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),  // Đổi từ SMTP_HOST thành MAIL_HOST
      port: this.configService.get<number>('MAIL_PORT'),  // Đổi từ SMTP_PORT thành MAIL_PORT
      secure: this.configService.get<number>('MAIL_PORT') === 465,  // Kiểm tra cổng SSL (465 cho SSL, 587 cho TLS)
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),  // Đổi từ SMTP_USER thành MAIL_USERNAME
        pass: this.configService.get<string>('MAIL_PASSWORD'),  // Đổi từ SMTP_PASS thành MAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false,  // Bỏ qua xác thực TLS (có thể chỉnh sửa tùy nhu cầu bảo mật)
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    try {
      const result = await this.transporter.sendMail({
        from: `"${this.configService.get<string>('MAIL_FROM_NAME')}" <${this.configService.get<string>('MAIL_FROM_ADDRESS')}>`,
        to: email,
        subject: 'Xác thực tài khoản của bạn',
        html: `
          <div style="max-width: 500px; margin: left; padding: 20px; font-family: Arial, sans-serif; text-align: center; border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333;">Chào mừng bạn đến với "${this.configService.get<string>('MAIL_FROM_NAME')}"</h2>
            <p style="font-size: 16px; color: #555;">Nhấp vào nút bên dưới để xác thực tài khoản của bạn:</p>
            <a href="http://localhost:3000/api/auth/verify-email?token=${token}"
              style="display: inline-block; padding: 12px 20px; font-size: 16px; color: #fff; background-color:rgb(253, 93, 0); text-decoration: none; border-radius: 5px; margin-top: 10px;">
              Xác thực ngay để trải nghiệm dịch vụ
            </a>
            <p style="font-size: 14px; color: #888; margin-top: 20px;">
              Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.
            </p>
          </div>
        `,
      });
      return result;
    } catch (error) {
      console.error('Lỗi gửi mail:', error);
      throw new Error('Không thể gửi email');
    }
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const resetUrl = `http://localhost:3000/api/auth/reset-password?token=${token}`;
    const mailOptions = {
      from: `"${this.configService.get<string>('MAIL_FROM_NAME')}" <${this.configService.get<string>('MAIL_FROM_ADDRESS')}>`, // Đổi từ SMTP_USER thành MAIL_FROM_ADDRESS và thêm MAIL_FROM_NAME
      to: email,
      subject: 'Đặt lại mật khẩu',
      html: `<p>Nhấp vào liên kết sau để đặt lại mật khẩu:</p>
             <a href="${resetUrl}">${resetUrl}</a>`,
    };

    return this.transporter.sendMail(mailOptions);
  }
}

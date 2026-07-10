import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendResetEmail(to: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: 'Đặt lại mật khẩu - ToyShop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="text-align: center; padding: 24px 0;">
          <span style="font-size: 48px;">🧸</span>
          <h1 style="font-size: 20px; margin: 8px 0;">ToyShop</h1>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px;">
          <h2 style="font-size: 18px; margin: 0 0 12px;">Đặt lại mật khẩu</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            Bạn nhận được email này vì chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}"
               style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: 600;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">
            Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
          </p>
        </div>
      </div>
    `,
  });
}

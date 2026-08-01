import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

function parseSender(from: string): { name: string; address: string } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim() || 'Ele Store',
      address: match[2].trim(),
    };
  }
  return { name: 'Ele Store', address: from.trim() };
}

function buildResetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="text-align: center; padding: 24px 0;">
        <h1 style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 0;">Ele Store</h1>
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
  `;
}

async function sendViaBrevoApi(to: string, resetUrl: string): Promise<void> {
  const { name, address } = parseSender(config.smtp.from);
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.brevoApiKey,
    },
    body: JSON.stringify({
      sender: { name, email: address },
      to: [{ email: to }],
      subject: 'Đặt lại mật khẩu - Ele Store',
      htmlContent: buildResetEmailHtml(resetUrl),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${detail}`);
  }
}

export async function sendResetEmail(to: string, resetUrl: string): Promise<void> {
  if (config.brevoApiKey) {
    await sendViaBrevoApi(to, resetUrl);
    return;
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: 'Đặt lại mật khẩu - Ele Store',
    html: buildResetEmailHtml(resetUrl),
  });
}

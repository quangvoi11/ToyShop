import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { config } from '../config';
import { brand } from '../config/brand';
import { ensureEmailAssets, getEmailAssetUrl } from './email-asset.service';

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
      name: match[1].trim() || brand.name,
      address: match[2].trim(),
    };
  }
  return { name: brand.name, address: from.trim() };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let logoDataUrlCache: string | null | undefined;
function getLogoDataUrl(): string | null {
  if (logoDataUrlCache !== undefined) return logoDataUrlCache;
  logoDataUrlCache = null;
  const candidates = [
    path.join(process.cwd(), 'assets', 'logo-hero.png'),
    path.join(__dirname, '..', '..', 'assets', 'logo-hero.png'),
    path.join(__dirname, '..', 'assets', 'logo-hero.png'),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    logoDataUrlCache = `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
    break;
  }
  return logoDataUrlCache;
}

function buildTemplate(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
  buttonText?: string;
  buttonUrl?: string;
  note?: string;
}): string {
  const { colors, font, contact } = brand;
  const logo = getEmailAssetUrl('logo') || getLogoDataUrl();
  const header = logo
    ? `
              <td align="center" style="padding: 8px 0 12px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="right" style="padding-right: 12px; vertical-align: middle; ">
                      <img src="${logo}" alt="${escapeHtml(brand.name)}" style="height: 200px; width: auto; display: block;" />
                    </td>
                  </tr>
                </table>
              </td>`
    : `
              <td align="center" style="padding: 8px 0 2px;">
                <span style="font-size: 32px; font-weight: 700; color: ${colors.sky}; letter-spacing: 0.5px;">${escapeHtml(brand.name)}</span>
              </td>`;
  const socialIcon = (
    key: 'facebook' | 'instagram' | 'youtube',
    label: string,
    svg: string,
  ): string => {
    const url = getEmailAssetUrl(key);
    if (url) {
      return `<a href="${escapeHtml(contact[key])}" aria-label="${label}" style="display: inline-block; margin: 0 5px; text-decoration: none;">
                <img src="${escapeHtml(url)}" alt="${label}" width="36" height="36" style="display: block; border-radius: 50%;" />
              </a>`;
    }
    return `<a href="${escapeHtml(contact[key])}" aria-label="${label}" style="display: inline-block; width: 36px; height: 36px; border-radius: 50%; background: #374151; text-align: center; line-height: 36px; margin: 0 5px; text-decoration: none;">
              ${svg}
            </a>`;
  };
  const button =
    opts.buttonText && opts.buttonUrl
      ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${escapeHtml(opts.buttonUrl)}"
           style="display: inline-block; background: ${colors.primary}; color: #ffffff; padding: 12px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
          ${escapeHtml(opts.buttonText)}
        </a>
      </div>`
      : '';
  const note = opts.note
    ? `<p style="color: ${colors.muted}; font-size: 13px; margin: 16px 0 0;">${escapeHtml(opts.note)}</p>`
    : '';

  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(opts.title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${colors.bg}; font-family: ${font}; color: ${colors.text};">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(opts.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${colors.bg}; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
            <!-- Header -->
            <tr>
              ${header}
            </tr>
            <!-- Body -->
            <tr>
              <td style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid ${colors.border};">
                <h2 style="font-size: 18px; margin: 0 0 12px;">${escapeHtml(opts.title)}</h2>
                <div style="color: ${colors.muted}; line-height: 1.6; font-size: 14px;">${opts.bodyHtml}</div>
                ${button}
                ${note}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 24px 8px 0;">
                <p style="margin: 0 0 8px; font-size: 13px; color: ${colors.muted}; line-height: 1.6;">
                  ${escapeHtml(contact.address)} &bull; ${escapeHtml(contact.phone)} &bull; ${escapeHtml(contact.email)}
                </p>
                <p style="margin: 0 0 8px; font-size: 13px; color: ${colors.muted};">
                  ${escapeHtml(contact.hours)}
                </p>
                <p style="margin: 0 0 8px; line-height: 36px;">
                  ${socialIcon('facebook', 'Facebook', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="#ffffff" style="vertical-align: middle;"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.6V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.3H7.5V13h2.8v8h3.2z"/></svg>`)}
                  ${socialIcon('instagram', 'Instagram', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffffff" stroke-width="1.8" style="vertical-align: middle;"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.3" fill="#ffffff" stroke="none"/></svg>`)}
                  ${socialIcon('youtube', 'YouTube', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="#ffffff" style="vertical-align: middle;"><path d="M23 12s0-3.6-.5-5.2a2.8 2.8 0 0 0-2-2C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.6.4a2.8 2.8 0 0 0-2 2C1 8.4 1 12 1 12s0 3.6.5 5.2a2.8 2.8 0 0 0 2 2c1.7.4 8.6.4 8.6.4s6.9 0 8.6-.4a2.8 2.8 0 0 0 2-2C23 15.6 23 12 23 12zM9.5 15.5v-7l6 3.5-6 3.5z"/></svg>`)}
                </p>
                <p style="margin: 0; font-size: 12px; color: ${colors.muted};">
                  &copy; 2026 ${escapeHtml(brand.name)}. Tất cả quyền được bảo lưu.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string,
): Promise<void> {
  await ensureEmailAssets();
  const html = buildTemplate({
    title: 'Xác thực tài khoản Ele Store',
    preheader: 'Xác thực email để hoàn tất đăng ký tài khoản Ele Store của bạn.',
    bodyHtml: `
      <p>Chào ${escapeHtml(name)},</p>
      <p>Chào mừng bạn đến với Ele Store! Vui lòng xác thực email của bạn để kích hoạt tài khoản và tiếp tục mua sắm.</p>
    `,
    buttonText: 'Verify Email',
    buttonUrl: verifyUrl,
    note: 'Link hết hạn sau 24 giờ. Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email này.',
  });
  return send('Xác thực tài khoản - Ele Store', to, html);
}

export async function sendResetEmail(to: string, resetUrl: string): Promise<void> {
  await ensureEmailAssets();
  const html = buildTemplate({
    title: 'Đặt lại mật khẩu',
    preheader:
      'Bạn nhận được email này vì chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
    bodyHtml: `
      <p>Bạn nhận được email này vì chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
    `,
    buttonText: 'Đặt lại mật khẩu',
    buttonUrl: resetUrl,
    note: 'Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.',
  });
  return send('Đặt lại mật khẩu - Ele Store', to, html);
}

async function send(subject: string, to: string, html: string): Promise<void> {
  if (config.brevoApiKey) {
    await sendViaBrevoApi(to, subject, html);
    return;
  }
  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
  });
}

async function sendViaBrevoApi(to: string, subject: string, html: string): Promise<void> {
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
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${detail}`);
  }
}

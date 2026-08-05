import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { brand } from '../config/brand';

type Money = number | { toNumber(): number };

interface InvoiceItem {
  productName: string;
  productSku: string;
  variantName?: string | null;
  price: Money;
  quantity: number;
  total: Money;
}

interface InvoiceOrder {
  orderCode: string;
  status: string;
  paymentMethod?: string | null;
  paymentStatus?: string;
  subtotal: Money;
  shippingFee: Money;
  discount: Money;
  total: Money;
  couponCode?: string | null;
  createdAt: Date | string;
  shippingRecipientName?: string | null;
  shippingPhone?: string | null;
  shippingStreet?: string | null;
  shippingWard?: string | null;
  shippingCity?: string | null;
  items: InvoiceItem[];
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string | null } | null;
  customerName?: string;
  customerEmail?: string;
}

function assetsDir(): string {
  const local = path.resolve(__dirname, '../assets');
  if (fs.existsSync(local)) return local;
  return path.resolve(__dirname, '../../assets');
}

const ASSETS_DIR = assetsDir();
const FONT_REGULAR = path.join(ASSETS_DIR, 'fonts', 'Roboto-Regular.ttf');
const FONT_BOLD = path.join(ASSETS_DIR, 'fonts', 'Roboto-Bold.ttf');
const LOGO_PATH = path.join(ASSETS_DIR, 'logo-hero.png');

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận',
  BANK_TRANSFER: 'Chuyển khoản',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  CREDIT_CARD: 'Thẻ tín dụng',
};

function money(v: Money): number {
  return Number(v);
}

function formatVnd(v: Money): string {
  return `${money(v).toLocaleString('vi-VN')} đ`;
}

function formatDate(v: Date | string | undefined | null): string {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('vi-VN');
}

function fallback(v: string | null | undefined): string {
  return v && v.trim() ? v : '—';
}

const TABLE_COLS = {
  name: { x: 40, w: 215 },
  sku: { x: 255, w: 80 },
  price: { x: 335, w: 80 },
  qty: { x: 415, w: 45 },
  total: { x: 460, w: 95 },
} as const;

const COL_HEADER = '#ffffff';
const HEADER_H = 26;
const ROW_H = 22;

export function generateInvoicePDF(order: InvoiceOrder): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: { Title: `Hoa don ${order.orderCode}` },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('Roboto', FONT_REGULAR);
    doc.registerFont('Roboto-Bold', FONT_BOLD);

    const pageW = doc.page.width;
    const margin = 40;
    const right = pageW - margin;
    const c = brand.colors;

    // ─── Header ───────────────────────────────────────────────
    doc.image(LOGO_PATH, margin, 20, { fit: [200, 200] });

    doc
      .font('Roboto-Bold')
      .fontSize(12)
      .fillColor(c.text)
      .text('Thông tin cửa hàng', right - 240, 46, { width: 240, align: 'right' });
    doc.font('Roboto').fontSize(9).fillColor(c.muted);
    doc.text(brand.contact.address, right - 240, 64, { width: 240, align: 'right' });
    doc.text(`ĐT: ${brand.contact.phone}`, right - 240, 76, { width: 240, align: 'right' });
    doc.text(`Email: ${brand.contact.email}`, right - 240, 88, { width: 240, align: 'right' });
    doc.text(brand.contact.hours, right - 240, 100, { width: 240, align: 'right' });

    doc.moveTo(margin, 146).lineTo(right, 146).strokeColor(c.border).lineWidth(1).stroke();

    // ─── Order info ───────────────────────────────────────────
    doc
      .font('Roboto-Bold')
      .fontSize(18)
      .fillColor(c.text)
      .text('HÓA ĐƠN', margin, 160, { align: 'center', width: right - margin });

    let y = 196;
    doc.font('Roboto').fontSize(10).fillColor(c.text);
    doc.text(`Mã đơn: ${order.orderCode}`, margin, y);
    doc.text(`Ngày đặt: ${formatDate(order.createdAt)}`, margin, y + 16);
    doc.text(`Trạng thái: ${STATUS_LABELS[order.status] || order.status}`, margin, y + 32);
    doc.text(
      `Phương thức thanh toán: ${PAYMENT_METHOD_LABELS[order.paymentMethod || ''] || fallback(order.paymentMethod || null)}`,
      margin,
      y + 48,
    );

    // ─── Customer & shipping boxes ────────────────────────────
    y = 300;
    const boxW = (right - margin - 20) / 2;
    const buyerName =
      order.customerName ||
      `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
      '—';
    const buyerEmail = order.customerEmail || order.user?.email || '—';
    const fullAddress =
      [order.shippingStreet, order.shippingWard, order.shippingCity].filter(Boolean).join(', ') ||
      '—';
    const addressLabel = `Địa chỉ: ${fallback(fullAddress)}`;

    doc.font('Roboto').fontSize(10);
    const addressH = doc.heightOfString(addressLabel, { width: boxW - 24 });
    const boxH = Math.max(72, 66 + addressH + 12);

    drawBox(margin, y, boxW, boxH);
    doc
      .font('Roboto-Bold')
      .fontSize(10)
      .fillColor(c.primary)
      .text('KHÁCH HÀNG', margin + 12, y + 12);
    doc.font('Roboto').fontSize(10).fillColor(c.text);
    doc.text(`Họ tên: ${fallback(buyerName)}`, margin + 12, y + 30);
    doc.text(`Email: ${fallback(buyerEmail)}`, margin + 12, y + 48);

    const box2x = margin + boxW + 20;
    drawBox(box2x, y, boxW, boxH);
    doc
      .font('Roboto-Bold')
      .fontSize(10)
      .fillColor(c.primary)
      .text('ĐỊA CHỈ GIAO HÀNG', box2x + 12, y + 12);
    doc.font('Roboto').fontSize(10).fillColor(c.text);
    doc.text(`Người nhận: ${fallback(order.shippingRecipientName || null)}`, box2x + 12, y + 30);
    doc.text(`SĐT: ${fallback(order.shippingPhone || null)}`, box2x + 12, y + 48);
    doc.text(addressLabel, box2x + 12, y + 66, { width: boxW - 24 });

    // ─── Items table ──────────────────────────────────────────
    y = y + boxH + 20;
    drawTableHeader(doc, y);
    y += HEADER_H;

    for (const item of order.items) {
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 40;
        drawTableHeader(doc, y);
        y += HEADER_H;
      }
      doc.rect(margin, y, right - margin, ROW_H).fill('#ffffff');
      doc
        .rect(margin, y, right - margin, ROW_H)
        .strokeColor(c.border)
        .lineWidth(0.5)
        .stroke();
      doc.font('Roboto').fontSize(9.5).fillColor(c.text);
      const name = item.variantName
        ? `${item.productName} (${item.variantName})`
        : item.productName;
      doc.text(name, TABLE_COLS.name.x + 4, y + 6, {
        width: TABLE_COLS.name.w - 8,
        height: ROW_H - 4,
        ellipsis: true,
      });
      doc.text(item.productSku, TABLE_COLS.sku.x + 4, y + 6, { width: TABLE_COLS.sku.w - 8 });
      doc.text(formatVnd(item.price), TABLE_COLS.price.x + 4, y + 6, {
        width: TABLE_COLS.price.w - 8,
      });
      doc.text(String(item.quantity), TABLE_COLS.qty.x + 4, y + 6, { width: TABLE_COLS.qty.w - 8 });
      doc.text(formatVnd(item.total), TABLE_COLS.total.x + 4, y + 6, {
        width: TABLE_COLS.total.w - 8,
      });
      y += ROW_H;
    }

    // ─── Totals ───────────────────────────────────────────────
    if (y + 100 > doc.page.height - 40) {
      doc.addPage();
      y = 40;
    }
    y += 12;
    const labelW = 160;
    const valueW = right - margin - labelW;
    doc.font('Roboto').fontSize(10).fillColor(c.text);
    doc.text('Tạm tính', margin, y, { width: labelW });
    doc.text(formatVnd(order.subtotal), margin + labelW, y, { width: valueW, align: 'right' });
    y += 20;

    doc.text('Phí vận chuyển', margin, y, { width: labelW });
    doc.text(
      money(order.shippingFee) === 0 ? 'Miễn phí' : formatVnd(order.shippingFee),
      margin + labelW,
      y,
      { width: valueW, align: 'right' },
    );
    y += 20;

    if (order.couponCode) {
      doc.text(`Voucher (Mã: ${order.couponCode})`, margin, y, { width: labelW });
      doc
        .font('Roboto-Bold')
        .fillColor(c.primary)
        .text(`-${formatVnd(order.discount)}`, margin + labelW, y, {
          width: valueW,
          align: 'right',
        });
      y += 20;
      doc.font('Roboto').fillColor(c.text);
    }

    y += 4;
    doc
      .moveTo(margin, y)
      .lineTo(margin + labelW + valueW, y)
      .strokeColor(c.border)
      .lineWidth(1)
      .stroke();
    y += 12;
    doc
      .font('Roboto-Bold')
      .fontSize(14)
      .fillColor(c.primary)
      .text('Tổng thanh toán', margin, y, { width: labelW });
    doc.text(formatVnd(order.total), margin + labelW, y, { width: valueW, align: 'right' });

    // ─── Footer ───────────────────────────────────────────────
    y = doc.page.height - 90;
    doc
      .font('Roboto-Bold')
      .fontSize(11)
      .fillColor(c.text)
      .text('Cảm ơn bạn đã mua sắm tại Ele Store!', 0, y, { align: 'center', width: pageW });
    doc
      .font('Roboto')
      .fontSize(9)
      .fillColor(c.muted)
      .text(
        `${brand.contact.address} • ${brand.contact.phone} • ${brand.contact.email} • ${brand.contact.hours}`,
        0,
        y + 20,
        { align: 'center', width: pageW },
      );
    doc.text(`© 2026 ${brand.name}. Tất cả quyền được bảo lưu.`, 0, y + 36, {
      align: 'center',
      width: pageW,
    });

    doc.end();

    function drawBox(x: number, y: number, w: number, h: number) {
      doc.rect(x, y, w, h).strokeColor(c.border).lineWidth(0.8).stroke();
    }

    function drawTableHeader(d: PDFKit.PDFDocument, yPos: number) {
      d.rect(margin, yPos, right - margin, HEADER_H).fill(c.primary);
      d.font('Roboto-Bold').fontSize(10).fillColor(COL_HEADER);
      d.text('Tên sản phẩm', TABLE_COLS.name.x + 4, yPos + 8, { width: TABLE_COLS.name.w - 8 });
      d.text('SKU', TABLE_COLS.sku.x + 4, yPos + 8, { width: TABLE_COLS.sku.w - 8 });
      d.text('Đơn giá', TABLE_COLS.price.x + 4, yPos + 8, { width: TABLE_COLS.price.w - 8 });
      d.text('SL', TABLE_COLS.qty.x + 4, yPos + 8, { width: TABLE_COLS.qty.w - 8 });
      d.text('Thành tiền', TABLE_COLS.total.x + 4, yPos + 8, { width: TABLE_COLS.total.w - 8 });
    }
  });
}

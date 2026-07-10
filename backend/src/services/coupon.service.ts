import { prisma } from '../utils/prisma';

interface CouponValidResult {
  valid: true;
  discountType: string;
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
}

interface CouponInvalidResult {
  valid: false;
  message: string;
}

type CouponResult = CouponValidResult | CouponInvalidResult;

export async function validateCoupon(code: string): Promise<CouponResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  const now = new Date();

  if (!coupon || !coupon.isActive) return { valid: false, message: 'Mã không hợp lệ' };
  if (coupon.startsAt > now || coupon.expiresAt < now) return { valid: false, message: 'Mã đã hết hạn' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, message: 'Mã đã hết lượt dùng' };

  return {
    valid: true,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    minOrder: coupon.minOrder ? Number(coupon.minOrder) : 0,
    maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
  };
}

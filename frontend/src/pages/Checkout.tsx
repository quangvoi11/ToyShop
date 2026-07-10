import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { RootState } from '../store';
import { fetchCart } from '../store/slices/cartSlice';
import { createOrder } from '../api/orders';
import { getAddresses, createAddress } from '../api/addresses';
import { validateCoupon } from '../api/coupons';
import { formatCurrency } from '../lib/utils';

const paymentMethods = [
  { value: 'COD', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵' },
  { value: 'MOMO', label: 'Ví MoMo', icon: '💜' },
  { value: 'VNPAY', label: 'VNPay', icon: '🏦' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', icon: '🏧' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((s: RootState) => s.cart);
  const { user } = useSelector((s: RootState) => s.auth);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    valid: boolean; discountType?: string; discountValue?: number; minOrder?: number; maxDiscount?: number | null;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [addressForm, setAddressForm] = useState({
    label: '', street: '', ward: '', district: '', city: '', phone: '', isDefault: true,
  });

  const { data: addresses, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => getAddresses(),
    enabled: !!user,
  });

  useEffect(() => {
    dispatch(fetchCart() as any);
  }, [dispatch]);

  useEffect(() => {
    if (addresses?.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr.id);
    }
  }, [addresses, selectedAddress]);

  const subtotal = items.reduce((sum: number, item: any) => {
    const price = Number(item.product?.salePrice || item.product?.basePrice || 0);
    return sum + price * item.quantity;
  }, 0);
  const shipping = subtotal >= 500000 ? 0 : 30000;

  let discount = 0;
  if (appliedCoupon?.valid && appliedCoupon.discountValue) {
    const dv = appliedCoupon.discountValue;
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discount = Math.min(subtotal * dv / 100, appliedCoupon.maxDiscount || Infinity);
    } else {
      discount = Math.min(dv, subtotal);
    }
  }
  const total = subtotal + shipping - discount;

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const addr = await createAddress(addressForm);
      setSelectedAddress(addr.id);
      setShowAddressForm(false);
      refetchAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      const result = await validateCoupon(couponCode.trim());
      if (result.valid) {
        if (subtotal < result.minOrder) {
          setCouponError(`Đơn hàng tối thiểu ${formatCurrency(result.minOrder)}`);
          return;
        }
        setAppliedCoupon(result);
      } else {
        setCouponError(result.message || 'Mã không hợp lệ');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Không thể kiểm tra mã giảm giá');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleSubmit = async () => {
    if (!selectedAddress) return;
    setSubmitting(true);
    try {
      const order = await createOrder({
        addressId: selectedAddress,
        paymentMethod,
        note,
        couponCode: appliedCoupon?.valid ? couponCode.trim() : undefined,
      });
      navigate(`/orders/${order.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="container-main py-8">
      <h1 className="mb-8 text-2xl font-bold">Thanh toán</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping address */}
          <div className="rounded-xl border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
              <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-sm font-medium text-primary hover:underline">
                {showAddressForm ? 'Hủy' : 'Thêm địa chỉ'}
              </button>
            </div>

            {showAddressForm ? (
              <form onSubmit={handleSubmitAddress} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <input placeholder="Label (VD: Nhà riêng)" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                  <input placeholder="Số điện thoại *" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" required />
                </div>
                <input placeholder="Địa chỉ (số nhà, đường) *" value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" required />
                <div className="grid gap-3 md:grid-cols-3">
                  <input placeholder="Phường/Xã *" value={addressForm.ward} onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" required />
                  <input placeholder="Quận/Huyện *" value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" required />
                  <input placeholder="Thành phố *" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" required />
                </div>
                <button type="submit" className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  Lưu địa chỉ
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {addresses?.map((addr: any) => (
                  <label key={addr.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 hover:bg-gray-50">
                    <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-0.5" />
                    <div>
                      <p className="font-medium">{addr.label ? `${addr.label} - ` : ''}{addr.street}</p>
                      <p className="text-sm text-gray-500">{addr.ward}, {addr.district}, {addr.city}</p>
                      <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Phương thức thanh toán</h2>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <label key={pm.value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-gray-50">
                  <input type="radio" name="payment" value={pm.value} checked={paymentMethod === pm.value} onChange={() => setPaymentMethod(pm.value)} />
                  <span className="text-xl">{pm.icon}</span>
                  <span className="text-sm font-medium">{pm.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Ghi chú</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho đơn hàng..."
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
            />
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Đơn hàng</h2>
            <div className="mb-4 space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-lg">🧱</div>
                  <div className="flex-1 text-sm">
                    <p className="line-clamp-1">{item.product?.name}</p>
                    <p className="text-gray-500">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(Number(item.product?.salePrice || item.product?.basePrice || 0) * item.quantity)}</p>
                </div>
              ))}
            </div>
            <hr className="mb-4" />
            {/* Coupon */}
            <div className="mb-4">
              {appliedCoupon?.valid ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 text-sm">
                  <span className="text-green-700">Giảm: -{formatCurrency(discount)}</span>
                  <button onClick={handleRemoveCoupon} className="text-green-600 hover:underline">Hủy</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Mã giảm giá"
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
                  >
                    Áp dụng
                  </button>
                </div>
              )}
              {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phí vận chuyển</span><span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between"><span className="text-gray-500">Giảm giá</span><span className="text-red-500">-{formatCurrency(discount)}</span></div>
              )}
              <hr />
              <div className="flex justify-between text-lg font-bold"><span>Tổng</span><span className="text-primary">{formatCurrency(total)}</span></div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedAddress}
              className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : `Đặt hàng - ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

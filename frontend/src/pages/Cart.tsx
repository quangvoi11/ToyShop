import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { RootState } from '../store';
import { fetchCart, updateCartItemThunk, removeCartItemThunk } from '../store/slices/cartSlice';
import { formatCurrency } from '../lib/utils';

interface CartProduct {
  sku?: string;
  name?: string;
  slug?: string;
  salePrice?: number | string;
  basePrice?: number | string;
}

interface CartItem {
  id: string;
  quantity: number;
  product?: CartProduct;
}

export default function Cart() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s: RootState) => s.cart);

  useEffect(() => {
    dispatch(fetchCart() as any);
  }, [dispatch]);

  const subtotal = items.reduce((sum: number, item: CartItem) => {
    const price = item.product?.salePrice
      ? Number(item.product.salePrice)
      : Number(item.product?.basePrice || 0);
    return sum + price * item.quantity;
  }, 0);

  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  if (loading && items.length === 0) {
    return (
      <div className="container-main py-20 text-center">
        <div className="animate-pulse">
          <div className="mx-auto mb-4 h-8 w-48 rounded bg-gray-200" />
          <div className="mx-auto mb-2 h-4 w-64 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-main py-20 text-center">
        <ShoppingBag className="mx-auto mb-6 h-16 w-16 text-gray-300" />
        <h1 className="mb-2 text-2xl font-bold">Giỏ hàng trống</h1>
        <p className="mb-6 text-gray-500">Hãy thêm sản phẩm vào giỏ hàng</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <h1 className="mb-8 text-2xl font-bold">Giỏ hàng ({items.length} sản phẩm)</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: CartItem) => (
            <div key={item.id} className="flex gap-4 rounded-xl border bg-white p-4">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <span className="text-3xl">🧱</span>
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    to={`/products/${item.product?.slug}`}
                    className="font-medium hover:text-primary"
                  >
                    {item.product?.name}
                  </Link>
                  <p className="text-sm text-gray-500">{item.product?.sku}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-lg border">
                    <button
                      onClick={() =>
                        dispatch(
                          updateCartItemThunk({
                            itemId: item.id,
                            quantity: Math.max(1, item.quantity - 1),
                          }) as any,
                        )
                      }
                      className="p-1.5 hover:bg-gray-50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() =>
                        dispatch(
                          updateCartItemThunk({
                            itemId: item.id,
                            quantity: item.quantity + 1,
                          }) as any,
                        )
                      }
                      className="p-1.5 hover:bg-gray-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-primary">
                      {formatCurrency(
                        Number(item.product?.salePrice || item.product?.basePrice || 0) *
                          item.quantity,
                      )}
                    </p>
                    <button
                      onClick={() => dispatch(removeCartItemThunk(item.id) as any)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Tổng đơn hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Miễn phí giao hàng cho đơn trên 500.000₫</p>
              )}
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90"
            >
              Thanh toán
            </Link>
            <Link
              to="/products"
              className="mt-3 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

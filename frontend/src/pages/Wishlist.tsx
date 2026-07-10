import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Trash2, Eye } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '../api/wishlist';
import { addToCartThunk } from '../store/slices/cartSlice';
import { formatCurrency } from '../lib/utils';
import { store } from '../store';
import type { WishlistItemSummary } from '../../../shared/types';

export default function Wishlist() {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  });

  const removeMut = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  if (isLoading) {
    return (
      <div className="container-main py-8">
        <h1 className="mb-8 text-2xl font-bold">Sản phẩm yêu thích</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-white p-4">
              <div className="mb-4 aspect-square rounded-lg bg-gray-200" />
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="container-main py-20 text-center">
        <Heart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Chưa có sản phẩm yêu thích</p>
        <Link to="/products" className="mt-4 inline-block text-primary hover:underline">Khám phá sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <h1 className="mb-8 text-2xl font-bold">Sản phẩm yêu thích ({items.length})</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item: WishlistItemSummary) => (
          <div key={item.id} className="group rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md">
            <Link to={`/products/${item.productSlug}`} className="mb-4 block aspect-square overflow-hidden rounded-lg bg-gray-100">
              {item.primaryImage ? (
                <img src={item.primaryImage} alt={item.productName} className="h-full w-full object-cover transition group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl">🧱</div>
              )}
            </Link>
            <Link to={`/products/${item.productSlug}`}>
              <h3 className="mb-2 text-sm font-medium line-clamp-2 hover:text-primary">{item.productName}</h3>
            </Link>
            <div className="mb-3">
              {item.salePrice ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{formatCurrency(Number(item.salePrice))}</span>
                  <span className="text-xs text-gray-400 line-through">{formatCurrency(Number(item.basePrice))}</span>
                </div>
              ) : (
                <span className="font-bold text-primary">{formatCurrency(Number(item.basePrice))}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => store.dispatch(addToCartThunk({ productId: item.productId, quantity: 1 }))}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-medium text-white hover:bg-primary/90"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> Thêm giỏ
              </button>
              <Link
                to={`/products/${item.productSlug}`}
                className="flex items-center justify-center rounded-lg border px-3 py-2 text-xs hover:bg-gray-50"
              >
                <Eye className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => removeMut.mutate(item.productId)}
                className="flex items-center justify-center rounded-lg border px-3 py-2 text-xs text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

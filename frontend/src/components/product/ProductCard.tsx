import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToCartThunk } from '@/store/slices/cartSlice';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/api/wishlist';
import { toast } from 'sonner';

export interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number | string;
  salePrice?: number | string | null;
  stock: number;
  isFeatured: boolean;
  soldCount?: number;
  images?: { url: string }[];
  category?: { name: string } | null;
}

interface ProductCardProps {
  product: FeaturedProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: !!user,
  });
  const wished = !!user && wishlist?.some((w: { productId: string }) => w.productId === product.id);

  const addWishMut = useMutation({
    mutationFn: () => addToWishlist(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Đã thêm vào yêu thích');
    },
    onError: () => toast.error('Không thể thêm vào yêu thích'),
  });

  const removeWishMut = useMutation({
    mutationFn: () => removeFromWishlist(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Đã xóa khỏi yêu thích');
    },
    onError: () => toast.error('Không thể xóa khỏi yêu thích'),
  });

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await dispatch(addToCartThunk({ productId: product.id, quantity: 1 })).unwrap();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      toast.success('Đã thêm vào giỏ hàng');
    } catch {
      toast.error('Không thể thêm vào giỏ hàng');
    }
  };

  const handleWishlistToggle = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (wished) removeWishMut.mutate();
    else addWishMut.mutate();
  };

  const price = Number(product.basePrice);
  const salePrice = product.salePrice != null ? Number(product.salePrice) : null;
  const discountPercent = salePrice != null ? Math.round(((price - salePrice) / price) * 100) : 0;

  return (
    <div className="group relative flex h-full flex-col rounded-xl border bg-white p-3 transition-all hover:shadow-lg">
      {discountPercent > 0 && (
        <span className="absolute left-3 top-3 z-10 rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
          -{discountPercent}%
        </span>
      )}
      <button
        onClick={handleWishlistToggle}
        className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm transition-colors hover:bg-white hover:text-red-500 ${wished ? 'text-red-500' : 'text-gray-400'}`}
        aria-label="Yêu thích"
      >
        <Heart className={`h-4 w-4 ${wished ? 'fill-red-500' : ''}`} />
      </button>
      <Link to={`/products/${product.slug}`}>
        <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl">🧱</span>
            </div>
          )}
        </div>
      </Link>
      <p className="mb-1 text-xs text-gray-500">{product.category?.name}</p>
      <Link to={`/products/${product.slug}`} className="mb-2 flex-1">
        <h3 className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
          {product.name}
        </h3>
      </Link>
      <div className="mb-2 flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-lg font-bold text-primary">
          {formatCurrency(salePrice ?? price)}
        </span>
        {salePrice != null && (
          <span className="text-xs text-gray-400 line-through">
            {formatCurrency(price)}
          </span>
        )}
      </div>
      <button
        onClick={handleAddToCart}
        disabled={product.stock <= 0}
        className={`mt-auto flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition-colors ${added ? 'bg-green-600' : 'bg-primary hover:bg-primary/90'} disabled:opacity-50`}
      >
        <ShoppingCart className="h-4 w-4" />
        {product.stock <= 0 ? 'Hết hàng' : added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
      </button>
    </div>
  );
}

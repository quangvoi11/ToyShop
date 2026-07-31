import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-400 shadow-sm transition-colors hover:bg-white hover:text-red-500"
        aria-label="Yêu thích"
      >
        <Heart className="h-4 w-4" />
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
      <button className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90">
        <ShoppingCart className="h-4 w-4" />
        Thêm vào giỏ
      </button>
    </div>
  );
}

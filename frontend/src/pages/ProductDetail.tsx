import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { ShoppingCart, Heart, Star, Minus, Plus } from 'lucide-react';
import { getProductBySlug } from '../api/products';
import { addToCartThunk } from '../store/slices/cartSlice';
import { formatCurrency } from '../lib/utils';

export default function ProductDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container-main py-8">
        <div className="animate-pulse">
          <div className="mb-8 h-8 w-48 rounded bg-gray-200" />
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square rounded-xl bg-gray-200" />
            <div>
              <div className="mb-4 h-6 w-3/4 rounded bg-gray-200" />
              <div className="mb-4 h-8 w-1/3 rounded bg-gray-200" />
              <div className="mb-4 h-4 w-full rounded bg-gray-200" />
              <div className="mb-4 h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-12 w-48 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-lg font-medium text-gray-500">Sản phẩm không tồn tại</p>
        <Link to="/products" className="mt-4 inline-block text-primary hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    dispatch(addToCartThunk({ productId: product.id, quantity }) as any);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discount = product.salePrice
    ? Math.round((1 - Number(product.salePrice) / Number(product.basePrice)) * 100)
    : 0;

  return (
    <div className="container-main py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary">Sản phẩm</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-primary">{product.category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image gallery */}
        <div>
          <div className="mb-4 flex aspect-square items-center justify-center rounded-xl bg-gray-100">
            <span className="text-8xl">🧱</span>
          </div>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <button key={i} className={`h-20 w-20 rounded-lg border-2 bg-gray-100 p-2 ${i === 1 ? 'border-primary' : 'border-transparent'}`}>
                <span className="flex h-full items-center justify-center text-2xl">🧱</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product info */}
        <div>
          <p className="mb-2 text-sm text-gray-500">{product.category?.name}</p>
          <h1 className="mb-4 text-2xl font-bold md:text-3xl">{product.name}</h1>

          <div className="mb-4 flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(product.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.reviewCount || 0} đánh giá)</span>
          </div>

          <div className="mb-6">
            {product.salePrice ? (
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-primary">{formatCurrency(Number(product.salePrice))}</p>
                <p className="text-lg text-gray-400 line-through">{formatCurrency(Number(product.basePrice))}</p>
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">-{discount}%</span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-primary">{formatCurrency(Number(product.basePrice))}</p>
            )}
          </div>

          <p className="mb-6 leading-relaxed text-gray-600">{product.description || 'Sản phẩm đồ chơi chính hãng, chất lượng cao.'}</p>

          {/* Quantity */}
          <div className="mb-6 flex items-center gap-4">
            <span className="text-sm font-medium">Số lượng:</span>
            <div className="flex items-center rounded-lg border">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-50">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-gray-50">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-gray-500">{product.stock} sản phẩm có sẵn</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-all ${added ? 'bg-green-600' : 'bg-primary hover:bg-primary/90'}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {added ? 'Đã thêm ✓' : 'Thêm vào giỏ hàng'}
            </button>
            <button className="flex items-center justify-center rounded-lg border p-3 hover:bg-gray-50">
              <Heart className="h-5 w-5" />
            </button>
          </div>

          {/* SKU */}
          <div className="mt-6 space-y-1 text-sm text-gray-500">
            <p>Mã SKU: {product.sku}</p>
            {product.brand && <p>Thương hiệu: {product.brand.name}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, Heart, Star, Minus, Plus, MessageSquare, Send } from 'lucide-react';
import { getProductBySlug } from '../api/products';
import { getWishlist, addToWishlist, removeFromWishlist } from '../api/wishlist';
import { getProductReviews, createReview } from '../api/reviews';
import { addToCartThunk } from '../store/slices/cartSlice';
import { formatCurrency } from '../lib/utils';
import type { RootState } from '../store';
import type { WishlistItemSummary, ReviewSummary } from '../../../shared/types';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [wished, setWished] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: !!slug,
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: !!user,
  });

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ['product-reviews', product?.id],
    queryFn: () => getProductReviews(product!.id),
    enabled: !!product?.id,
  });

  useEffect(() => {
    if (wishlist && product) {
      setWished(wishlist.some((w: WishlistItemSummary) => w.productId === product.id));
    }
  }, [wishlist, product]);

  const addWishMut = useMutation({
    mutationFn: () => addToWishlist(product!.id),
    onSuccess: () => {
      setWished(true);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const removeWishMut = useMutation({
    mutationFn: () => removeFromWishlist(product!.id),
    onSuccess: () => {
      setWished(false);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const reviewMut = useMutation({
    mutationFn: () => createReview(product!.id, { rating: reviewRating, comment: reviewComment }),
    onSuccess: () => {
      setReviewComment('');
      setReviewRating(5);
      refetchReviews();
      queryClient.invalidateQueries({ queryKey: ['product', slug] });
    },
  });

  const handleAddToCart = () => {
    dispatch(addToCartThunk({ productId: product.id, quantity }) as any);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

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

  const discount = product.salePrice
    ? Math.round((1 - Number(product.salePrice) / Number(product.basePrice)) * 100)
    : 0;

  const images = product.images?.length > 0 ? product.images : [];

  const handleWishlistToggle = () => {
    if (!user) return;
    if (wished) {
      removeWishMut.mutate();
    } else {
      addWishMut.mutate();
    }
  };

  const avgRating = product.averageRating || 0;

  return (
    <div className="container-main py-8">
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
          <div className="mb-4 flex aspect-square items-center justify-center rounded-xl bg-gray-100 overflow-hidden">
            {images.length > 0 ? (
              <img src={images[activeImg]?.url} alt={images[activeImg]?.alt || product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-8xl">🧱</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img: ProductImage, i: number) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(i)}
                  className={`h-20 w-20 overflow-hidden rounded-lg border-2 bg-gray-100 p-1 ${i === activeImg ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <p className="mb-2 text-sm text-gray-500">{product.category?.name}</p>
          <h1 className="mb-4 text-2xl font-bold md:text-3xl">{product.name}</h1>

          <div className="mb-4 flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.reviewCount || 0} đánh giá)</span>
            {product.soldCount > 0 && (
              <span className="text-sm text-gray-500">| Đã bán {product.soldCount}</span>
            )}
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
            {product.viewCount > 0 && (
              <span className="text-sm text-gray-400">| {product.viewCount} lượt xem</span>
            )}
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
            <button
              onClick={handleWishlistToggle}
              className={`flex items-center justify-center rounded-lg border p-3 hover:bg-gray-50 ${wished ? 'bg-red-50' : ''}`}
              disabled={!user}
              title={!user ? 'Đăng nhập để yêu thích' : ''}
            >
              <Heart className={`h-5 w-5 ${wished ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {/* SKU */}
          <div className="mt-6 space-y-1 text-sm text-gray-500">
            <p>Mã SKU: {product.sku}</p>
            {product.brand && <p>Thương hiệu: {product.brand.name}</p>}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Đánh giá sản phẩm ({product.reviewCount || 0})
        </h2>

        {/* Review Form */}
        {user ? (
          <div className="mb-8 rounded-xl border bg-white p-6">
            <h3 className="mb-4 font-semibold">Viết đánh giá</h3>
            <div className="mb-3 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewRating(star)} type="button">
                  <Star className={`h-5 w-5 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
            />
            <button
              onClick={() => reviewMut.mutate()}
              disabled={reviewMut.isPending || !reviewComment.trim()}
              className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {reviewMut.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        ) : (
          <div className="mb-8 rounded-xl border bg-gray-50 p-6 text-center text-sm text-gray-500">
            <Link to="/login" className="text-primary hover:underline">Đăng nhập</Link> để viết đánh giá
          </div>
        )}

        {/* Review List */}
        <div className="space-y-4">
          {reviews?.length > 0 ? (
            reviews.map((review: ReviewSummary) => (
              <div key={review.id} className="rounded-xl border bg-white p-4">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {review.userName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.userName}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ))
          ) : (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
              <MessageSquare className="mx-auto mb-2 h-6 w-6" />
              Chưa có đánh giá nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

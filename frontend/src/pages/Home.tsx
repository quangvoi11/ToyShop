import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Star, Truck, Shield, Gift, CreditCard } from 'lucide-react';
import { getFeaturedProducts } from '../api/products';
import { getCategories } from '../api/categories';
import { formatCurrency } from '../lib/utils';

const banners = [
  {
    id: 1,
    title: 'LEGO Chính Hãng',
    subtitle: 'Giảm đến 30% cho bộ sưu tập LEGO mới',
    bg: 'bg-gradient-to-r from-orange-500 to-red-500',
    cta: 'Mua ngay',
    link: '/products?category=lego',
  },
  {
    id: 2,
    title: 'Búp bê & Phụ kiện',
    subtitle: 'Bộ sưu tập búp bê thời trang mới nhất',
    bg: 'bg-gradient-to-r from-pink-500 to-rose-500',
    cta: 'Khám phá',
    link: '/products?category=bup-be',
  },
  {
    id: 3,
    title: 'Xe điều khiển từ xa',
    subtitle: 'Tốc độ, mạnh mẽ, điều khiển không giới hạn',
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    cta: 'Xem thêm',
    link: '/products?category=xe-dieu-khien',
  },
];

const features = [
  { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng trên 500.000₫' },
  { icon: Shield, title: 'Bảo hành chính hãng', desc: 'Cam kết 100% chính hãng' },
  { icon: Gift, title: 'Quà tặng hấp dẫn', desc: 'Nhiều ưu đãi bất ngờ' },
  { icon: CreditCard, title: 'Thanh toán linh hoạt', desc: 'COD, Visa, MoMo, VNPay' },
];

export default function Home() {
  const [bannerIdx, setBannerIdx] = useState(0);

  const { data: products } = useQuery({ queryKey: ['featured-products'], queryFn: getFeaturedProducts });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className={cn('relative flex transition-all duration-500', `-translate-x-0`)} style={{ transform: `translateX(-${bannerIdx * 100}%)` }}>
          {banners.map((banner) => (
            <div key={banner.id} className={`flex w-full flex-shrink-0 items-center justify-between px-8 py-16 md:px-16 lg:px-24 ${banner.bg} min-h-[300px] md:min-h-[400px]`}>
              <div className="max-w-lg">
                <h2 className="mb-3 text-3xl font-bold text-white md:text-5xl">{banner.title}</h2>
                <p className="mb-6 text-lg text-white/90">{banner.subtitle}</p>
                <Link to={banner.link} className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-gray-900 shadow-lg transition-transform hover:scale-105">
                  {banner.cta}
                </Link>
              </div>
              <div className="hidden text-8xl md:block">🧸</div>
            </div>
          ))}
        </div>

        {/* Banner controls */}
        <button onClick={() => setBannerIdx((i) => (i - 1 + banners.length) % banners.length)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => setBannerIdx((i) => (i + 1) % banners.length)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white">
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)} className={`h-2.5 w-2.5 rounded-full transition-all ${i === bannerIdx ? 'w-8 bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      </section>

      {/* Features bar */}
      <section className="border-b bg-white py-6">
        <div className="container-main grid grid-cols-2 gap-4 md:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container-main">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Danh mục sản phẩm</h2>
            <Link to="/products" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories?.map((cat: any) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="group rounded-xl border p-6 text-center transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="mb-3 text-4xl">
                  {cat.slug === 'lego' ? '🧱' : cat.slug === 'bup-be' ? '👧' : cat.slug === 'xe-dieu-khien' ? '🚗' : cat.slug === 'do-choi-giao-duc' ? '📚' : '🧸'}
                </div>
                <h3 className="font-semibold group-hover:text-primary">{cat.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{cat._count?.products || 0} sản phẩm</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 py-12">
        <div className="container-main">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Sản phẩm nổi bật</h2>
            <Link to="/products" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products?.map((product: any) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="group rounded-xl border bg-white p-4 transition-all hover:shadow-lg"
              >
                <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {product.images?.length > 0
                    ? <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    : <div className="flex h-full items-center justify-center"><span className="text-6xl">🧱</span></div>}
                </div>
                <p className="mb-2 text-xs text-gray-500">{product.category?.name}</p>
                <h3 className="mb-2 line-clamp-2 text-sm font-medium group-hover:text-primary">{product.name}</h3>
                <div className="mb-2 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                  {product.soldCount > 0 && <span className="ml-auto text-xs text-gray-400">Đã bán {product.soldCount}</span>}
                </div>
                <p className="text-lg font-bold text-primary">{formatCurrency(Number(product.basePrice))}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 py-16 text-center text-white">
        <div className="container-main">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">🎉 Khai trương ToyShop</h2>
          <p className="mb-8 text-lg text-white/90">Giảm đến 20% cho đơn hàng đầu tiên. Mã: <span className="rounded-lg bg-white/20 px-4 py-1 font-mono font-bold">TOYSHOP20</span></p>
          <Link to="/products" className="inline-block rounded-full bg-white px-10 py-3 font-semibold text-purple-700 shadow-lg transition-transform hover:scale-105">
            Mua sắm ngay
          </Link>
        </div>
      </section>

      {/* Brands */}
      <section className="py-12">
        <div className="container-main">
          <h2 className="mb-8 text-center text-2xl font-bold">Thương hiệu</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
            {['LEGO', 'Hot Wheels', 'Barbie', 'Fisher-Price', 'Gấu bông'].map((brand) => (
              <div key={brand} className="rounded-xl border px-8 py-4 text-lg font-bold text-gray-600">{brand}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

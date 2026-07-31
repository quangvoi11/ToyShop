import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Truck, Shield, Gift, CreditCard } from 'lucide-react';
import { getFeaturedProducts } from '../api/products';
import { getCategories } from '../api/categories';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryGrid from '@/components/home/CategoryGrid';
import BrandSlider from '@/components/home/BrandSlider';
import ProductCard, { type FeaturedProduct } from '@/components/product/ProductCard';

const features = [
  { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng trên 500.000₫' },
  { icon: Shield, title: 'Bảo hành chính hãng', desc: 'Cam kết 100% chính hãng' },
  { icon: Gift, title: 'Quà tặng hấp dẫn', desc: 'Nhiều ưu đãi bất ngờ' },
  { icon: CreditCard, title: 'Thanh toán linh hoạt', desc: 'COD, Visa, MoMo, VNPay' },
];

export default function Home() {
  const { data: products } = useQuery({ queryKey: ['featured-products'], queryFn: getFeaturedProducts });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  return (
    <div>
      <HeroBanner />

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

      <section className="py-12">
        <div className="container-main">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Danh mục HOT</h2>
            <Link to="/products" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
          </div>
          {categories && <CategoryGrid categories={categories} />}
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="container-main">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Sản phẩm nổi bật</h2>
            <Link to="/products" className="text-sm font-medium text-primary hover:underline">Xem tất cả</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products?.map((product: FeaturedProduct) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-main">
          <h2 className="mb-8 text-center text-2xl font-bold">Thương hiệu</h2>
          <BrandSlider />
        </div>
      </section>

      <section className="py-12">
        <div className="container-main grid gap-6 md:grid-cols-2">
          <Link
            to="/products"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent-blue to-blue-800 p-8 text-white"
          >
            <h3 className="relative z-10 mb-2 text-xl font-bold">Thành viên Ele Store</h3>
            <p className="relative z-10 mb-4 text-sm text-white/80">Tích điểm đổi quà, ưu đãi độc quyền mỗi tháng</p>
            <span className="relative z-10 inline-block rounded-full bg-accent-gold px-5 py-2 text-sm font-semibold text-accent-blue transition-transform group-hover:scale-105">
              Khám phá ngay
            </span>
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
          </Link>
          <Link
            to="/products"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent-gold to-yellow-600 p-8 text-white"
          >
            <h3 className="relative z-10 mb-2 text-xl font-bold">Trả góp 0%</h3>
            <p className="relative z-10 mb-4 text-sm text-white/80">Mua đồ chơi trả góp với lãi suất 0% qua thẻ tín dụng</p>
            <span className="relative z-10 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-accent-gold transition-transform group-hover:scale-105">
              Đăng ký ngay
            </span>
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

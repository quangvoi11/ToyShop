import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

const slides = [
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

export default function HeroBanner() {
  return (
    <Swiper
      modules={[EffectFade, Autoplay, Pagination]}
      effect="fade"
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      loop
      className="h-[250px] md:h-[420px]"
    >
      {slides.map((slide) => (
        <SwiperSlide key={slide.id}>
          <div className={`flex h-full items-center justify-between px-8 md:px-16 lg:px-24 ${slide.bg}`}>
            <div className="max-w-lg">
              <h2 className="mb-3 text-3xl font-bold text-white md:text-5xl">{slide.title}</h2>
              <p className="mb-6 text-lg text-white/90">{slide.subtitle}</p>
              <Link
                to={slide.link}
                className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-gray-900 shadow-lg transition-transform hover:scale-105"
              >
                {slide.cta}
              </Link>
            </div>
            <div className="hidden md:block">
              <img src="/images/logo-hero.png" alt="Ele Store" className="h-56 w-auto opacity-95" />
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

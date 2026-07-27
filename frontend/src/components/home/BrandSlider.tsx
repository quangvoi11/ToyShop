import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';

const brands = ['LEGO', 'Hot Wheels', 'Barbie', 'Fisher-Price', 'Gundam', 'Playmobil'];

export default function BrandSlider() {
  return (
    <Swiper
      modules={[FreeMode]}
      freeMode
      slidesPerView="auto"
      spaceBetween={24}
      className="!px-4"
    >
      {brands.map((brand) => (
        <SwiperSlide key={brand} className="!w-auto">
          <div className="flex h-16 w-36 cursor-pointer items-center justify-center rounded-xl border px-6 text-sm font-bold text-gray-400 grayscale transition-all hover:border-accent-gold hover:text-accent-gold hover:grayscale-0">
            {brand}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

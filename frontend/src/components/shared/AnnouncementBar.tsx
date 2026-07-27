import { useState, useEffect } from 'react';
import { Truck, Zap, Users, CreditCard, Store } from 'lucide-react';

const announcements = [
  { text: 'MIỄN PHÍ GIAO HÀNG', icon: Truck },
  { text: 'GIAO HÀNG HỎA TỐC', icon: Zap },
  { text: 'THÀNH VIÊN', icon: Users },
  { text: 'TRẢ GÓP 0%', icon: CreditCard },
  { text: 'CỬA HÀNG', icon: Store },
];

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = announcements[index];

  return (
    <div className="hidden bg-accent-blue text-white md:block">
      <div className="container-main flex h-9 items-center justify-center">
        <div className="flex items-center gap-2 transition-opacity duration-500">
          <current.icon className="h-4 w-4" />
          <span className="text-xs font-medium tracking-wider">{current.text}</span>
        </div>
      </div>
    </div>
  );
}

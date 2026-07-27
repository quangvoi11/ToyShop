import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-main py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <img src="/images/logo-header.png" alt="Ele Store" className="h-10 w-auto" />
              <h3 className="text-xl font-bold text-white">Ele Store</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed">
              Cửa hàng đồ chơi trực tuyến hàng đầu Việt Nam. Cam kết sản phẩm chính hãng, giao hàng
              toàn quốc.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/nhat.quang.596650"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-primary/20"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/quungvoi/?hl=en"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-primary/20"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.youtube.com/@TheReviewerrrrr"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-primary/20"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Danh mục
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products?category=lego" className="transition-colors hover:text-white">
                  LEGO
                </Link>
              </li>
              <li>
                <Link to="/products?category=bup-be" className="transition-colors hover:text-white">
                  Búp bê
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=xe-dieu-khien"
                  className="transition-colors hover:text-white"
                >
                  Xe điều khiển
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=do-choi-giao-duc"
                  className="transition-colors hover:text-white"
                >
                  Đồ chơi giáo dục
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=thu-nhoi-bong"
                  className="transition-colors hover:text-white"
                >
                  Thú nhồi bông
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Chính sách
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Hướng dẫn mua hàng
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Phương thức vận chuyển
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Thông tin liên hệ
            </h4>
            <ul className="mb-6 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Thành phố Hà Nội</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>096.146.2003</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>support@elestore.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Thứ 2 - Thứ 7: 8:00 - 21:00
                  <br />
                  Chủ nhật: 9:00 - 18:00
                </span>
              </li>
            </ul>

            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Đăng ký nhận tin
            </h4>
            <div className="flex">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 rounded-l-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="rounded-r-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                Đăng ký
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
          <p className="text-sm">© 2026 Ele Store. Tất cả quyền được bảo lưu.</p>
          <div className="flex items-center gap-3">
            <div className="rounded border border-gray-700 px-3 py-1 text-xs">COD</div>
            <div className="rounded border border-gray-700 px-3 py-1 text-xs">VNPay</div>
            <div className="rounded border border-gray-700 px-3 py-1 text-xs">MoMo</div>
            <div className="rounded border border-gray-700 px-3 py-1 text-xs">Visa</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

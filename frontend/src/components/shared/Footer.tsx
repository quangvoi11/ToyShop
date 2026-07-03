import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-main py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">🧸 ToyShop</h3>
            <p className="mb-4 text-sm leading-relaxed">
              Cửa hàng đồ chơi trực tuyến hàng đầu Việt Nam. Cam kết sản phẩm chính hãng, giao hàng toàn quốc.
            </p>
            <p className="text-sm">📞 1900.1234</p>
            <p className="text-sm">✉️ support@toyshop.vn</p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Danh mục</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products?category=lego" className="hover:text-white">LEGO</Link></li>
              <li><Link to="/products?category=bup-be" className="hover:text-white">Búp bê</Link></li>
              <li><Link to="/products?category=xe-dieu-khien" className="hover:text-white">Xe điều khiển</Link></li>
              <li><Link to="/products?category=do-choi-giao-duc" className="hover:text-white">Đồ chơi giáo dục</Link></li>
              <li><Link to="/products?category=thu-nhoi-bong" className="hover:text-white">Thú nhồi bông</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white">Hướng dẫn mua hàng</Link></li>
              <li><Link to="/" className="hover:text-white">Chính sách đổi trả</Link></li>
              <li><Link to="/" className="hover:text-white">Chính sách bảo mật</Link></li>
              <li><Link to="/" className="hover:text-white">Phương thức vận chuyển</Link></li>
              <li><Link to="/" className="hover:text-white">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Đăng ký nhận tin</h4>
            <p className="mb-3 text-sm">Nhận ưu đãi và thông tin sản phẩm mới qua email.</p>
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

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm">
          <p>© 2026 ToyShop. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}

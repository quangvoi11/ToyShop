import { Settings } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="text-sm text-gray-500">Quản lý cài đặt cửa hàng</p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Thông tin cửa hàng</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Tên cửa hàng</label>
            <p className="text-sm">Ele Store</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm">admin@toystShop.com</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Số điện thoại</label>
            <p className="text-sm">0123 456 789</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Địa chỉ</label>
            <p className="text-sm">TP. Hồ Chí Minh, Việt Nam</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
        <p className="text-sm text-gray-500">Tính năng đang được phát triển.</p>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Vận chuyển</h2>
        <p className="text-sm text-gray-500">Tính năng đang được phát triển.</p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Warehouse, Package, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminInventory, adjustStock, getAdminMovements, getAdminWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, getAdminBatches, createBatch, getAdminProducts } from '../../api/admin';
import { formatCurrency } from '../../lib/utils';

type Tab = 'stock' | 'adjust' | 'warehouses' | 'batches';

const tabs: { key: Tab; label: string }[] = [
  { key: 'stock', label: 'Tồn kho' },
  { key: 'adjust', label: 'Điều chỉnh' },
  { key: 'warehouses', label: 'Kho hàng' },
  { key: 'batches', label: 'Lô hàng' },
];

export default function AdminInventory() {
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý kho hàng</h1>
        </div>
      </div>

      <div className="mb-6 flex border-b">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setPage(1); setSearch(''); }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'stock' && <StockTab page={page} setPage={setPage} search={search} setSearch={setSearch} />}
      {activeTab === 'adjust' && <AdjustTab />}
      {activeTab === 'warehouses' && <WarehousesTab />}
      {activeTab === 'batches' && <BatchesTab />}
    </div>
  );
}

function StockTab({ page, setPage, search, setSearch }: { page: number; setPage: (p: number) => void; search: string; setSearch: (s: string) => void }) {
  const { data: result, isLoading } = useQuery({
    queryKey: ['admin-inventory', page, search],
    queryFn: () => getAdminInventory({ page, search: search || undefined }),
  });

  const items = result?.data || [];
  const meta = result?.meta;

  return (
    <div>
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Tìm kiếm sản phẩm..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Sản phẩm</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Tồn kho</th>
              <th className="px-4 py-3 font-medium">Số lô</th>
              <th className="px-4 py-3 font-medium">Cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((i: { id: string; name: string; sku: string; stock: number; batchCount: number; lowStock: boolean }) => (
                <tr key={i.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{i.name}</td>
                  <td className="px-4 py-3 text-gray-500">{i.sku}</td>
                  <td className="px-4 py-3 font-medium">{i.stock}</td>
                  <td className="px-4 py-3">{i.batchCount}</td>
                  <td className="px-4 py-3">
                    {i.lowStock && <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Tồn thấp</span>}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-4 py-20 text-center text-gray-500">
                <Package className="mx-auto mb-2 h-8 w-8" />
                <p>Chưa có dữ liệu</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdjustTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ productId: '', warehouseId: '', type: 'IN', quantity: 1, note: '', reference: '' });
  const [showForm, setShowForm] = useState(true);

  const { data: warehouses } = useQuery({ queryKey: ['admin-warehouses'], queryFn: getAdminWarehouses });
  const { data: products } = useQuery({ queryKey: ['admin-products', 1], queryFn: () => getAdminProducts(1) });
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['admin-movements', page],
    queryFn: () => getAdminMovements({ page }),
  });

  const adjustMut = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setForm({ productId: '', warehouseId: '', type: 'IN', quantity: 1, note: '', reference: '' });
      toast.success('Đã điều chỉnh tồn kho');
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Điều chỉnh thất bại');
    },
  });

  const handleSubmit = () => {
    if (!form.productId) { toast.error('Vui lòng chọn sản phẩm'); return; }
    if (!form.warehouseId) { toast.error('Vui lòng chọn kho'); return; }
    adjustMut.mutate(form);
  };

  const movements = movementsData?.data || [];
  const meta = movementsData?.meta;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Điều chỉnh tồn kho</h2>
          <button onClick={() => setShowForm(!showForm)} className="text-sm text-primary hover:underline">{showForm ? 'Thu gọn' : 'Mở rộng'}</button>
        </div>
        {showForm && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Sản phẩm *</label>
              <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Chọn sản phẩm</option>
                {products?.data?.map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kho *</label>
              <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Chọn kho</option>
                {warehouses?.map((w: { id: string; name: string }) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Loại *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="IN">Nhập kho</option>
                <option value="OUT">Xuất kho</option>
                <option value="ADJUST">Điều chỉnh</option>
                <option value="RETURN">Trả hàng</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Số lượng *</label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ghi chú</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tham chiếu</label>
              <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Mã đơn / Mã lô" />
            </div>
            <div className="flex items-end">
              <button onClick={handleSubmit} disabled={adjustMut.isPending}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                {adjustMut.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <h3 className="px-4 py-3 text-sm font-semibold text-gray-700 border-b">Lịch sử điều chỉnh</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Sản phẩm</th>
              <th className="px-4 py-3 font-medium">Kho</th>
              <th className="px-4 py-3 font-medium">Loại</th>
              <th className="px-4 py-3 font-medium">Số lượng</th>
              <th className="px-4 py-3 font-medium">Ghi chú</th>
              <th className="px-4 py-3 font-medium">Người tạo</th>
              <th className="px-4 py-3 font-medium">Ngày</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : movements.length > 0 ? (
              movements.map((m: { id: string; product: { name: string }; warehouse: { name: string }; type: string; quantity: number; note?: string; creator: { firstName: string; lastName: string }; createdAt: string }) => (
                <tr key={m.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{m.product?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{m.warehouse?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${m.type === 'IN' || m.type === 'RETURN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {m.type === 'IN' ? 'Nhập' : m.type === 'OUT' ? 'Xuất' : m.type === 'RETURN' ? 'Trả' : 'Đ/c'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${(m.quantity || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{m.note || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{m.creator?.firstName} {m.creator?.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(m.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-4 py-20 text-center text-gray-500">Chưa có điều chỉnh nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function WarehousesTab() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', address: '' });

  const { data: warehouses, isLoading } = useQuery({ queryKey: ['admin-warehouses'], queryFn: getAdminWarehouses });

  const createMut = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-warehouses'] });
      setShowModal(false);
      setForm({ name: '', address: '' });
      toast.success('Đã tạo kho');
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Tạo kho thất bại');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; address?: string } }) => updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-warehouses'] });
      setShowModal(false);
      setEditingId(null);
      setForm({ name: '', address: '' });
      toast.success('Đã cập nhật kho');
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Cập nhật kho thất bại');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-warehouses'] });
      toast.success('Đã ẩn kho');
    },
    onError: () => toast.error('Không thể ẩn kho'),
  });

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên kho'); return; }
    if (editingId) {
      updateMut.mutate({ id: editingId, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const openEdit = (w: { id: string; name: string; address?: string }) => {
    setEditingId(w.id);
    setForm({ name: w.name, address: w.address || '' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => { setEditingId(null); setForm({ name: '', address: '' }); setShowModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Thêm kho
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Tên kho</th>
              <th className="px-4 py-3 font-medium">Địa chỉ</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : warehouses?.length > 0 ? (
              warehouses.map((w: { id: string; name: string; address?: string; isActive: boolean }) => (
                <tr key={w.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3 text-gray-500">{w.address || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {w.isActive ? 'Hoạt động' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(w)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => { if (confirm('Ẩn kho này?')) deleteMut.mutate(w.id); }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-4 py-20 text-center text-gray-500">
                <Warehouse className="mx-auto mb-2 h-8 w-8" />
                <p>Chưa có kho nào</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-20 pb-10">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? 'Sửa kho' : 'Thêm kho'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Tên kho *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Địa chỉ</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                <Save className="h-4 w-4" />
                {createMut.isPending || updateMut.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BatchesTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: '', warehouseId: '', batchCode: '', quantity: 1, costPrice: 0, expiryDate: '' });

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin-batches', page],
    queryFn: () => getAdminBatches({ page }),
  });

  const { data: warehouses } = useQuery({ queryKey: ['admin-warehouses'], queryFn: getAdminWarehouses });
  const { data: products } = useQuery({ queryKey: ['admin-products', 1], queryFn: () => getAdminProducts(1) });

  const createMut = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-batches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      setShowModal(false);
      setForm({ productId: '', warehouseId: '', batchCode: '', quantity: 1, costPrice: 0, expiryDate: '' });
      toast.success('Đã tạo lô hàng');
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Tạo lô hàng thất bại');
    },
  });

  const handleSave = () => {
    if (!form.productId) { toast.error('Vui lòng chọn sản phẩm'); return; }
    if (!form.warehouseId) { toast.error('Vui lòng chọn kho'); return; }
    if (!form.batchCode.trim()) { toast.error('Vui lòng nhập mã lô'); return; }
    createMut.mutate({ ...form, costPrice: Number(form.costPrice), expiryDate: form.expiryDate || undefined });
  };

  const batches = result?.data || [];
  const meta = result?.meta;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Thêm lô hàng
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Mã lô</th>
              <th className="px-4 py-3 font-medium">Sản phẩm</th>
              <th className="px-4 py-3 font-medium">Kho</th>
              <th className="px-4 py-3 font-medium">SL còn/SL gốc</th>
              <th className="px-4 py-3 font-medium">Giá vốn</th>
              <th className="px-4 py-3 font-medium">Hạn SD</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : batches.length > 0 ? (
              batches.map((b: { id: string; batchCode: string; product: { name: string }; warehouse: { name: string }; remainingQuantity: number; quantity: number; costPrice: number; expiryDate?: string; createdAt: string }) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.batchCode}</td>
                  <td className="px-4 py-3">{b.product?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{b.warehouse?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{b.remainingQuantity}</span> / {b.quantity}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(Number(b.costPrice))}</td>
                  <td className="px-4 py-3 text-gray-500">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(b.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-4 py-20 text-center text-gray-500">
                <Package className="mx-auto mb-2 h-8 w-8" />
                <p>Chưa có lô hàng nào</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-20 pb-10">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Thêm lô hàng</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Sản phẩm *</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="">Chọn sản phẩm</option>
                  {products?.data?.map((p: { id: string; name: string }) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Kho *</label>
                <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="">Chọn kho</option>
                  {warehouses?.map((w: { id: string; name: string }) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mã lô *</label>
                <input value={form.batchCode} onChange={(e) => setForm({ ...form, batchCode: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Số lượng *</label>
                  <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Giá vốn *</label>
                  <input type="number" min={0} step={1000} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Hạn sử dụng</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleSave} disabled={createMut.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                <Save className="h-4 w-4" />
                {createMut.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Tag, X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminBrands, getAdminBrand, createBrand, updateBrand, deleteBrand, uploadImage } from '../../api/admin';

interface BrandForm {
  name: string;
  slug: string;
  logo: string;
  isActive: boolean;
}

const emptyForm: BrandForm = { name: '', slug: '', logo: '', isActive: true };

const generateSlug = (name: string) =>
  name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminBrands() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin-brands', page],
    queryFn: () => getAdminBrands(page),
  });

  useEffect(() => {
    if (showModal && editingId) {
      getAdminBrand(editingId).then((brand) => {
        setForm({
          name: brand.name,
          slug: brand.slug,
          logo: brand.logo || '',
          isActive: brand.isActive,
        });
      });
    }
    if (showModal && !editingId) {
      setForm(emptyForm);
    }
  }, [showModal, editingId]);

  const createMut = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setShowModal(false);
      toast.success('Đã tạo thương hiệu');
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Tạo thương hiệu thất bại');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BrandForm }) => updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setShowModal(false);
      toast.success('Đã cập nhật thương hiệu');
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Cập nhật thương hiệu thất bại');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      toast.success('Đã xóa thương hiệu');
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Xóa thương hiệu thất bại');
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const url = await uploadImage(file, 'toyshop/brands');
      setForm((f) => ({ ...f, logo: url }));
      toast.success('Đã tải ảnh lên');
    } catch {
      toast.error('Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Vui lòng nhập tên thương hiệu'); return; }
    const data = { ...form, slug: form.slug || generateSlug(form.name), logo: form.logo || undefined };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: data as BrandForm });
    } else {
      createMut.mutate(data);
    }
  };

  const brands = result?.data || [];
  const meta = result?.meta;

  const filtered = brands.filter((b: { name: string }) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý thương hiệu</h1>
          <p className="text-sm text-gray-500">{meta?.total || 0} thương hiệu</p>
        </div>
        <button onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Thêm thương hiệu
        </button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Logo</th>
              <th className="px-4 py-3 font-medium">Tên</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Số SP</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((b: { id: string; name: string; slug: string; logo?: string; isActive: boolean; _count?: { products: number } }) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="h-10 w-10 rounded-lg object-cover bg-gray-100" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><Tag className="h-5 w-5 text-gray-400" /></div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-gray-500">{b.slug}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{b._count?.products || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {b.isActive ? 'Hoạt động' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditingId(b.id); setShowModal(true); }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => { if (confirm('Ẩn thương hiệu này?')) deleteMut.mutate(b.id); }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-4 py-20 text-center text-gray-500">
                <Tag className="mx-auto mb-2 h-8 w-8" />
                <p>Chưa có thương hiệu nào</p>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Tên thương hiệu *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || generateSlug(e.target.value) })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Logo</label>
                <div className="flex flex-wrap items-center gap-3">
                  {form.logo && (
                    <div className="relative h-24 w-24 rounded-lg border bg-gray-50 overflow-hidden group">
                      <img src={form.logo} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => setForm({ ...form, logo: '' })}
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100">×</button>
                    </div>
                  )}
                  <label className={`flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:bg-gray-50 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : <Plus className="h-6 w-6 text-gray-400" />}
                    <input type="file" accept="image/*" hidden onChange={handleFileSelect} disabled={uploading} />
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Hoạt động
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending || uploading}
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

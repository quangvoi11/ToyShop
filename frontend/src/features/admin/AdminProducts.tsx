import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, Search, Package, X, Save, Loader2,
} from 'lucide-react';
import {
  getAdminProducts, getAdminProduct, createProduct, updateProduct, deleteProduct,
  getAdminCategories, getAdminBrands, uploadImage,
} from '../../api/admin';

interface ProductImageInput {
  id?: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
  file?: File;
}
import { formatCurrency } from '../../lib/utils';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  category?: { id: string; name: string };
  images?: { url: string }[];
}

interface CategoryItem {
  id: string;
  name: string;
}

interface BrandItem {
  id: string;
  name: string;
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  salePrice: number | null;
  sku: string;
  barcode: string;
  stock: number;
  weight: number | null;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string;
  brandId: string | null;
  images: ProductImageInput[];
}

const emptyForm: ProductForm = {
  name: '', slug: '', description: '', basePrice: 0, salePrice: null,
  sku: '', barcode: '', stock: 0, weight: null, isFeatured: false,
  isActive: true, categoryId: '', brandId: '', images: [],
};

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => getAdminProducts(page),
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  const { data: brands } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: getAdminBrands,
  });

  useEffect(() => {
    if (showModal && editingId) {
      getAdminProduct(editingId).then((product) => {
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          basePrice: Number(product.basePrice),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          sku: product.sku,
          barcode: product.barcode || '',
          stock: Number(product.stock),
          weight: product.weight ? Number(product.weight) : null,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          categoryId: product.categoryId,
          brandId: product.brandId || '',
          images: product.images?.map((img: { id: string; url: string; alt?: string; isPrimary: boolean; sortOrder?: number }, idx: number) => ({
            id: img.id,
            url: img.url,
            alt: img.alt || '',
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder ?? idx,
          })) || [],
        });
      });
    }
    if (showModal && !editingId) {
      setForm(emptyForm);
    }
  }, [showModal, editingId]);

  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowModal(false);
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr?.response?.data?.message || 'Tạo sản phẩm thất bại');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductForm }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowModal(false);
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr?.response?.data?.message || 'Cập nhật sản phẩm thất bại');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr?.response?.data?.message || 'Xoá sản phẩm thất bại');
    },
  });

  const uploadMut = useMutation({
    mutationFn: uploadImage,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const tempIdx = form.images.length;

    setForm((f) => ({
      ...f,
      images: [...f.images, {
        url: URL.createObjectURL(file),
        alt: '',
        isPrimary: f.images.length === 0,
        sortOrder: f.images.length,
      }],
    }));

    uploadMut.mutate(file, {
      onSuccess: (url) => {
        setForm((f) => {
          const imgs = [...f.images];
          imgs[tempIdx] = { ...imgs[tempIdx], url };
          return { ...f, images: imgs };
        });
      },
      onError: () => {
        setForm((f) => ({
          ...f,
          images: f.images.filter((_, i) => i !== tempIdx),
        }));
      },
    });
  };

  const removeImage = (idx: number) => {
    if (form.images[idx].id && !confirm('Xoá ảnh này?')) return;
    setForm((f) => {
      const removedWasPrimary = f.images[idx].isPrimary;
      const remaining = f.images.filter((_, i) => i !== idx);
      if (removedWasPrimary && remaining.length > 0) {
        remaining[0].isPrimary = true;
      }
      return { ...f, images: remaining };
    });
  };

  const setPrimary = (idx: number) => {
    setForm((f) => ({
      ...f,
      images: f.images.map((img, i) => ({ ...img, isPrimary: i === idx })),
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) { alert('Vui lòng nhập tên sản phẩm'); return false; }
    if (!form.sku.trim()) { alert('Vui lòng nhập SKU'); return false; }
    if (form.basePrice <= 0) { alert('Giá gốc phải lớn hơn 0'); return false; }
    if (!form.categoryId) { alert('Vui lòng chọn danh mục'); return false; }
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const data = {
      ...form,
      brandId: form.brandId || null,
      weight: form.weight || null,
      images: form.images.map(({ url, alt, isPrimary, sortOrder }) => ({
        url,
        alt: alt || '',
        isPrimary,
        sortOrder,
      })),
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data });
    } else {
      createMut.mutate(data);
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: name
        .toLowerCase()
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }));
  };

  const products = (result?.data as ProductRow[])?.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-500">{result?.meta?.total || 0} sản phẩm</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Tìm kiếm..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Sản phẩm</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Danh mục</th>
              <th className="px-4 py-3 font-medium">Giá</th>
              <th className="px-4 py-3 font-medium">Kho</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-20 text-center text-gray-500">Đang tải...</td></tr>
            ) : products?.length > 0 ? (
              products.map((p: ProductRow) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0]?.url ? (
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          className="h-40 w-40 rounded-lg object-cover bg-gray-100 border"
                        />
                      ) : (
                        <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-gray-100 text-xl border">🧱</div>
                      )}
                      <div>
                        <p className="font-medium line-clamp-1">{p.name}</p>
                        {p.isFeatured && <span className="text-xs text-yellow-600">★ Nổi bật</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3">{p.category?.name || '-'}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(Number(p.basePrice))}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock > 0 ? 'text-green-600' : 'text-red-600'}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.isActive ? 'Hoạt động' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(p.id)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Ẩn sản phẩm này?')) deleteMut.mutate(p.id); }}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-4 py-20 text-center text-gray-500">
                <Package className="mx-auto mb-2 h-8 w-8" />
                <p>Chưa có sản phẩm nào</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result?.meta && result.meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: result.meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}
            >{p}</button>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Tên sản phẩm *</label>
                  <input value={form.name} onChange={(e) => generateSlug(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm" required />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Mô tả</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">SKU *</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Mã vạch</label>
                  <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Giá gốc *</label>
                  <input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Giá khuyến mãi</label>
                  <input type="number" value={form.salePrice || ''} onChange={(e) => setForm({ ...form, salePrice: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Số lượng tồn kho</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Cân nặng (kg)</label>
                  <input type="number" step="0.1" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Danh mục</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="">Chọn danh mục</option>
                    {categories?.map((c: CategoryItem) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Thương hiệu</label>
                  <select value={form.brandId ?? ''} onChange={(e) => setForm({ ...form, brandId: e.target.value || null })}
                    className="w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="">Chọn thương hiệu</option>
                    {brands?.map((b: BrandItem) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                  Sản phẩm nổi bật
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Hoạt động
                </label>
              </div>

              {/* Images */}
              <div>
                <label className="mb-2 block text-sm font-medium">Hình ảnh sản phẩm</label>
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img, idx) => (
                    <div key={img.id || idx} className="relative h-24 w-24 rounded-lg border bg-gray-50 overflow-hidden group">
                      <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" />
                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 text-xs bg-yellow-400 rounded px-1">★</span>
                      )}
                      {!img.url.startsWith('blob:') && (
                        <>
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          <button
                            onClick={() => setPrimary(idx)}
                            className="absolute bottom-1 left-1 text-xs bg-white/80 rounded px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Đặt làm chính
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  <label className={`flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:bg-gray-50 ${uploadMut.isPending ? 'pointer-events-none opacity-50' : ''}`}>
                    {uploadMut.isPending ? (
                      <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                    ) : (
                      <Plus className="h-6 w-6 text-gray-400" />
                    )}
                    <input type="file" accept="image/*" hidden onChange={handleFileSelect} disabled={uploadMut.isPending} />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleSave}
                disabled={createMut.isPending || updateMut.isPending || uploadMut.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
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

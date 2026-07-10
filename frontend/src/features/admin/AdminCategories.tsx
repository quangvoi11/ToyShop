import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit2, Trash2, Search, FolderTree, X, Save, Loader2, ChevronRight, ChevronDown,
} from 'lucide-react';
import {
  getAdminCategoryTree, getAdminCategories, getAdminCategory, createCategory, updateCategory, deleteCategory,
  uploadImage, type CategoryInput,
} from '../../api/admin';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  productsCount?: number;
  children?: CategoryNode[];
  depth?: number;
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: CategoryForm = {
  name: '', slug: '', description: '', image: '', parentId: '', sortOrder: 0, isActive: true,
};

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function AdminCategories() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: tree, isLoading } = useQuery({
    queryKey: ['admin-category-tree'],
    queryFn: getAdminCategoryTree,
  });

  const { data: flat } = useQuery({
    queryKey: ['admin-category-flat'],
    queryFn: getAdminCategories,
  });

  const nodes: CategoryNode[] = tree || [];

  const flattenAll = (list: CategoryNode[], depth = 0): CategoryNode[] => {
    const out: CategoryNode[] = [];
    list.forEach((n) => {
      out.push({ ...n, depth });
      if (n.children?.length) out.push(...flattenAll(n.children, depth + 1));
    });
    return out;
  };

  const rows = useMemo(() => {
    const all = flattenAll(nodes);
    if (!search) {
      const visible: CategoryNode[] = [];
      const pushVisible = (list: CategoryNode[], depth: number) => {
        list.forEach((n) => {
          visible.push({ ...n, depth });
          if (n.children?.length && !collapsed[n.id]) pushVisible(n.children, depth + 1);
        });
      };
      pushVisible(nodes, 0);
      return visible;
    }
    const q = search.toLowerCase();
    return all.filter((n) => n.name.toLowerCase().includes(q));
  }, [nodes, search, collapsed]);

  useEffect(() => {
    if (showModal && editingId) {
      getAdminCategory(editingId).then((c: CategoryNode) => {
        setForm({
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          image: c.image || '',
          parentId: c.parentId || '',
          sortOrder: c.sortOrder,
          isActive: c.isActive,
        });
      });
    }
    if (showModal && !editingId) {
      setForm(emptyForm);
    }
  }, [showModal, editingId]);

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-category-tree'] });
      queryClient.invalidateQueries({ queryKey: ['admin-category-flat'] });
      setShowModal(false);
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr?.response?.data?.message || 'Tạo danh mục thất bại');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryInput }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-category-tree'] });
      queryClient.invalidateQueries({ queryKey: ['admin-category-flat'] });
      setShowModal(false);
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr?.response?.data?.message || 'Cập nhật danh mục thất bại');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-category-tree'] });
      queryClient.invalidateQueries({ queryKey: ['admin-category-flat'] });
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr?.response?.data?.message || 'Ẩn danh mục thất bại');
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
    } catch {
      alert('Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) { alert('Vui lòng nhập tên danh mục'); return false; }
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const data: CategoryInput = {
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      description: form.description || null,
      image: form.image || null,
      parentId: form.parentId || null,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: data as unknown as CategoryInput });
    } else {
      createMut.mutate(data as unknown as CategoryInput);
    }
  };

  const descendantIds = (rootId: string): Set<string> => {
    const all: CategoryNode[] = flat || [];
    const childrenOf = new Map<string, string[]>();
    all.forEach((c) => {
      if (c.parentId) {
        if (!childrenOf.has(c.parentId)) childrenOf.set(c.parentId, []);
        childrenOf.get(c.parentId)!.push(c.id);
      }
    });
    const ids = new Set<string>();
    const stack = [rootId];
    while (stack.length) {
      const cur = stack.pop()!;
      (childrenOf.get(cur) || []).forEach((k) => {
        if (!ids.has(k)) { ids.add(k); stack.push(k); }
      });
    }
    return ids;
  };

  const parentOptions = (() => {
    const all: CategoryNode[] = flat || [];
    const banned = new Set<string>();
    if (editingId) {
      banned.add(editingId);
      descendantIds(editingId).forEach((d) => banned.add(d));
    }
    return all.filter((c) => !banned.has(c.id));
  })();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
          <p className="text-sm text-gray-500">{flattenAll(nodes).length} danh mục</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Thêm danh mục
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Tìm kiếm danh mục..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {/* Table (tree) */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Danh mục</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Danh mục cha</th>
              <th className="px-4 py-3 font-medium">Số SP</th>
              <th className="px-4 py-3 font-medium">Thứ tự</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-20 text-center text-gray-500">Đang tải...</td></tr>
            ) : rows.length > 0 ? (
              rows.map((c) => {
                const hasChildren = (c.children?.length ?? 0) > 0;
                const isCollapsed = collapsed[c.id];
                return (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" style={{ paddingLeft: (c.depth ?? 0) * 20 }}>
                        {hasChildren ? (
                          <button
                            onClick={() => setCollapsed((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                            className="text-gray-400 hover:text-gray-700"
                          >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        ) : (
                          <span className="w-4" />
                        )}
                        {c.image ? (
                          <img src={c.image} alt={c.name} className="h-8 w-8 rounded object-cover bg-gray-100" />
                        ) : (
                          <FolderTree className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.slug}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.parentId
                        ? flattenAll(nodes).find((n) => n.id === c.parentId)?.name || '-'
                        : <span className="text-gray-400">— Cấp 1</span>}
                    </td>
                    <td className="px-4 py-3">{c.productsCount ?? 0}</td>
                    <td className="px-4 py-3 text-gray-500">{c.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {c.isActive ? 'Hoạt động' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditingId(c.id); setShowModal(true); }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Ẩn danh mục này? Các danh mục con vẫn giữ nguyên.')) deleteMut.mutate(c.id); }}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={7} className="px-4 py-20 text-center text-gray-500">
                <FolderTree className="mx-auto mb-2 h-8 w-8" />
                <p>Chưa có danh mục nào</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Tên danh mục *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || generateSlug(e.target.value) })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" rows={3}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Danh mục cha</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">— Cấp 1 (không có cha) —</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {' '.repeat((c.depth ?? 0) * 2)}{c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Thứ tự hiển thị</label>
                  <input
                    type="number" value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox" checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    Hoạt động
                  </label>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="mb-2 block text-sm font-medium">Hình ảnh</label>
                <div className="flex items-center gap-3">
                  {form.image && (
                    <img src={form.image} alt="" className="h-16 w-16 rounded-lg object-cover bg-gray-100" />
                  )}
                  <label className={`flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:bg-gray-50 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : <Plus className="h-6 w-6 text-gray-400" />}
                    <input type="file" accept="image/*" hidden onChange={handleFileSelect} disabled={uploading} />
                  </label>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: '' })}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Xoá ảnh
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={createMut.isPending || updateMut.isPending || uploading}
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

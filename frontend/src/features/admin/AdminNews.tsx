import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Newspaper, X, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminArticles, getAdminArticle, createArticle, updateArticle, deleteArticle, toggleArticlePublish, getAdminCategories, uploadImage } from '../../api/admin';

interface ArticleForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  tags: string;
  categoryId: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
}

const emptyForm: ArticleForm = {
  title: '', slug: '', content: '', excerpt: '', thumbnail: '', tags: '', categoryId: '',
  seoTitle: '', seoDescription: '', isPublished: false,
};

const generateSlug = (name: string) =>
  name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminNews() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const params: { page: number; search?: string; isPublished?: boolean } = { page };
  if (search) params.search = search;
  if (publishedFilter === 'published') params.isPublished = true;
  if (publishedFilter === 'draft') params.isPublished = false;

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin-articles', page, search, publishedFilter],
    queryFn: () => getAdminArticles(params),
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  useEffect(() => {
    if (showModal && editingId) {
      getAdminArticle(editingId).then((a) => {
        setForm({
          title: a.title,
          slug: a.slug,
          content: a.content,
          excerpt: a.excerpt || '',
          thumbnail: a.thumbnail || '',
          tags: Array.isArray(a.tags) ? a.tags.join(', ') : (a.tags || ''),
          categoryId: a.categoryId || '',
          seoTitle: a.seoTitle || '',
          seoDescription: a.seoDescription || '',
          isPublished: a.isPublished,
        });
      }).catch(() => {
        toast.error('Không thể tải bài viết');
        setShowModal(false);
        setEditingId(null);
      });
    }
    if (showModal && !editingId) {
      setForm(emptyForm);
    }
  }, [showModal, editingId]);

  const createMut = useMutation({
    mutationFn: (body: Parameters<typeof createArticle>[0]) => createArticle(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setShowModal(false);
      toast.success('Đã tạo bài viết');
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Tạo bài viết thất bại');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ArticleForm> }) => updateArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setShowModal(false);
      toast.success('Đã cập nhật bài viết');
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Cập nhật bài viết thất bại');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setDeleteConfirm(null);
      toast.success('Đã xóa bài viết');
    },
    onError: () => toast.error('Không thể xóa bài viết'),
  });

  const publishMut = useMutation({
    mutationFn: toggleArticlePublish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success('Đã cập nhật trạng thái xuất bản');
    },
    onError: () => toast.error('Không thể cập nhật trạng thái'),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const url = await uploadImage(file, 'toyshop/articles');
      setForm((f) => ({ ...f, thumbnail: url }));
      toast.success('Đã tải ảnh lên');
    } catch {
      toast.error('Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
    if (!form.content.trim()) { toast.error('Vui lòng nhập nội dung'); return; }
    const body = {
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      content: form.content,
      excerpt: form.excerpt || null,
      thumbnail: form.thumbnail || null,
      tags: form.tags || '[]',
      categoryId: form.categoryId || null,
      isPublished: form.isPublished,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: body as unknown as Partial<ArticleForm> });
    } else {
      createMut.mutate(body as Parameters<typeof createArticle>[0]);
    }
  };

  const articles = result?.data || [];
  const meta = result?.meta;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý tin tức</h1>
          <p className="text-sm text-gray-500">{meta?.total || 0} bài viết</p>
        </div>
        <button onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Thêm bài viết
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={publishedFilter} onChange={(e) => { setPublishedFilter(e.target.value as 'all' | 'published' | 'draft'); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">Tất cả</option>
          <option value="published">Đã đăng</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Ảnh</th>
              <th className="px-4 py-3 font-medium">Tiêu đề</th>
              <th className="px-4 py-3 font-medium">Danh mục</th>
              <th className="px-4 py-3 font-medium">Tác giả</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Lượt xem</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : articles.length > 0 ? (
              articles.map((a: { id: string; title: string; slug: string; thumbnail?: string; category?: { name: string }; author: { firstName: string; lastName: string }; isPublished: boolean; viewCount: number; createdAt: string }) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {a.thumbnail ? (
                      <img src={a.thumbnail} alt={a.title} className="h-10 w-16 rounded object-cover bg-gray-100" />
                    ) : (
                      <div className="flex h-10 w-16 items-center justify-center rounded bg-gray-100"><Newspaper className="h-5 w-5 text-gray-400" /></div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{a.title}</td>
                  <td className="px-4 py-3 text-gray-500">{a.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.author?.firstName} {a.author?.lastName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${a.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {a.isPublished ? 'Đã đăng' : 'Nháp'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.viewCount}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditingId(a.id); setShowModal(true); }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => publishMut.mutate(a.id)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-green-600" title={a.isPublished ? 'Chuyển về nháp' : 'Đăng bài'}>
                        {a.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setDeleteConfirm(a.id)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="px-4 py-20 text-center text-gray-500">
                <Newspaper className="mx-auto mb-2 h-8 w-8" />
                <p>Chưa có bài viết nào</p>
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
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? 'Sửa bài viết' : 'Thêm bài viết'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Tiêu đề *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nội dung *</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" rows={8} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Trích dẫn</label>
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Ảnh bìa</label>
                <div className="flex flex-wrap items-center gap-3">
                  {form.thumbnail && (
                    <div className="relative h-24 w-24 rounded-lg border bg-gray-50 overflow-hidden group">
                      <img src={form.thumbnail} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => setForm({ ...form, thumbnail: '' })}
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100">×</button>
                    </div>
                  )}
                  <label className={`flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:bg-gray-50 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                    {uploading ? <Loader2 className="h-6 w-6 animate-spin text-gray-400" /> : <Plus className="h-6 w-6 text-gray-400" />}
                    <input type="file" accept="image/*" hidden onChange={handleFileSelect} disabled={uploading} />
                  </label>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Tags (phân cách bằng dấu phẩy)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="tag1, tag2, tag3" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Danh mục</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="">— Chọn danh mục —</option>
                    {categories?.map((c: { id: string; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">SEO Title</label>
                  <input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                    Đăng ngay
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">SEO Description</label>
                <textarea value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
              </div>
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

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold">Xác nhận xóa</h3>
            <p className="mb-6 text-sm text-gray-500">Bạn có chắc chắn muốn xóa bài viết này?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">Hủy</button>
              <button onClick={() => deleteMut.mutate(deleteConfirm)} disabled={deleteMut.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleteMut.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

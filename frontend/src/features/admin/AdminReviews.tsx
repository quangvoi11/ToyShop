import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Star, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminReviews, toggleReviewActive, deleteReview } from '../../api/admin';

export default function AdminReviews() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const params: { page: number; search?: string; rating?: number; isActive?: boolean } = { page };
  if (search) params.search = search;
  if (ratingFilter) params.rating = ratingFilter;
  if (activeFilter === 'active') params.isActive = true;
  if (activeFilter === 'inactive') params.isActive = false;

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, search, ratingFilter, activeFilter],
    queryFn: () => getAdminReviews(params),
  });

  const toggleMut = useMutation({
    mutationFn: toggleReviewActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Đã cập nhật trạng thái đánh giá');
    },
    onError: () => toast.error('Không thể cập nhật trạng thái'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setDeleteConfirm(null);
      toast.success('Đã xóa đánh giá');
    },
    onError: () => toast.error('Không thể xóa đánh giá'),
  });

  const reviews = result?.data || [];
  const meta = result?.meta;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
          <p className="text-sm text-gray-500">{meta?.total || 0} đánh giá</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm sản phẩm hoặc nội dung..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
        </select>
        <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value as 'all' | 'active' | 'inactive'); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hiện</option>
          <option value="inactive">Đã ẩn</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Sản phẩm</th>
              <th className="px-4 py-3 font-medium">Khách hàng</th>
              <th className="px-4 py-3 font-medium">Đánh giá</th>
              <th className="px-4 py-3 font-medium">Bình luận</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
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
            ) : reviews.length > 0 ? (
              reviews.map((r: { id: string; product: { name: string }; user: { firstName: string; lastName: string; email: string }; rating: number; comment?: string; isActive: boolean; createdAt: string }) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.product?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.user?.firstName} {r.user?.lastName}</p>
                    <p className="text-xs text-gray-500">{r.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.comment?.substring(0, 100) || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {r.isActive ? 'Hiện' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggleMut.mutate(r.id)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600" title={r.isActive ? 'Ẩn' : 'Hiện'}>
                        {r.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => setDeleteConfirm(r.id)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-4 py-20 text-center text-gray-500">
                <Star className="mx-auto mb-2 h-8 w-8" />
                <p>Chưa có đánh giá nào</p>
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

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold">Xác nhận xóa</h3>
            <p className="mb-6 text-sm text-gray-500">Bạn có chắc chắn muốn xóa đánh giá này?</p>
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

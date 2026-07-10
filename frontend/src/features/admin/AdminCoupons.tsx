import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Tag, X, Save, Search } from 'lucide-react';
import { getAdminCoupons, getAdminCoupon, createCoupon, updateCoupon, deleteCoupon } from '../../api/admin';
import { formatCurrency } from '../../lib/utils';
import { DISCOUNT_TYPE } from '../../../../shared/constants';
import type { CouponSummary, CreateCouponRequest } from '../../../../shared/types';

interface CouponForm {
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrder: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

const emptyForm: CouponForm = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: 0,
  minOrder: null,
  maxDiscount: null,
  usageLimit: null,
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
};

const formatDatetimeLocal = (dateStr: string) => {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function isExpired(dateStr: string) {
  return new Date(dateStr) < new Date();
}

export default function AdminCoupons() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin-coupons', page],
    queryFn: () => getAdminCoupons(page),
  });

  useEffect(() => {
    if (showModal && editingId) {
      getAdminCoupon(editingId).then((coupon) =>
        setForm({
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrder: coupon.minOrder ?? null,
          maxDiscount: coupon.maxDiscount ?? null,
          usageLimit: coupon.usageLimit ?? null,
          startsAt: formatDatetimeLocal(coupon.startsAt),
          expiresAt: formatDatetimeLocal(coupon.expiresAt),
          isActive: coupon.isActive,
        })
      );
    }
    if (showModal && !editingId) {
      setForm(emptyForm);
    }
    setErrors([]);
  }, [showModal, editingId]);

  const createMut = useMutation({
    mutationFn: (body: CreateCouponRequest) => createCoupon(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowModal(false);
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrors([axiosErr.response?.data?.message || 'Có lỗi xảy ra']);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCouponRequest & { isActive: boolean }> }) => updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowModal(false);
    },
    onError: (err: Error) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrors([axiosErr.response?.data?.message || 'Có lỗi xảy ra']);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDeleteConfirm(null);
    },
  });

  const validateForm = (): boolean => {
    const errs: string[] = [];
    if (!form.code.trim()) errs.push('Mã giảm giá không được để trống');
    if (form.discountValue <= 0) errs.push('Giá trị giảm phải lớn hơn 0');
    if (!form.startsAt) errs.push('Ngày bắt đầu không được để trống');
    if (!form.expiresAt) errs.push('Ngày hết hạn không được để trống');
    if (form.startsAt && form.expiresAt && new Date(form.startsAt) >= new Date(form.expiresAt)) {
      errs.push('Ngày bắt đầu phải trước ngày hết hạn');
    }
    if (form.discountType === 'FIXED' && form.maxDiscount) {
      errs.push('Giảm tối đa chỉ áp dụng cho loại PERCENTAGE');
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const body: CreateCouponRequest & { description?: string } = {
      code: form.code.toUpperCase(),
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: form.discountValue,
      minOrder: form.minOrder ?? undefined,
      maxDiscount: form.maxDiscount ?? undefined,
      usageLimit: form.usageLimit ?? undefined,
      startsAt: new Date(form.startsAt).toISOString(),
      expiresAt: new Date(form.expiresAt).toISOString(),
    };
    if (editingId) {
      updateMut.mutate({ id: editingId, data: { ...body, isActive: form.isActive } });
    } else {
      createMut.mutate(body as CreateCouponRequest);
    }
  };

  const handleEdit = (coupon: CouponSummary) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrder: coupon.minOrder ?? null,
      maxDiscount: coupon.maxDiscount ?? null,
      usageLimit: coupon.usageLimit ?? null,
      startsAt: formatDatetimeLocal(coupon.startsAt),
      expiresAt: formatDatetimeLocal(coupon.expiresAt),
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors([]);
    setShowModal(true);
  };

  const coupons: CouponSummary[] = result?.data ?? [];
  const meta = result?.meta;

  const filtered = coupons.filter((c) =>
    !search || c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý mã giảm giá</h1>
          <p className="text-sm text-gray-500">{meta?.total || 0} mã giảm giá</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Thêm mã
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Tìm kiếm mã..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Mã code</th>
              <th className="px-4 py-3 font-medium">Loại</th>
              <th className="px-4 py-3 font-medium">Giá trị</th>
              <th className="px-4 py-3 font-medium">Điều kiện</th>
              <th className="px-4 py-3 font-medium">Đã dùng / Giới hạn</th>
              <th className="px-4 py-3 font-medium">Hạn sử dụng</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length > 0 ? (
              filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold uppercase">{c.code}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.discountType === DISCOUNT_TYPE.PERCENTAGE ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {c.discountType === DISCOUNT_TYPE.PERCENTAGE ? '%' : 'VNĐ'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {c.discountType === DISCOUNT_TYPE.PERCENTAGE ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.minOrder ? `Đơn từ ${formatCurrency(c.minOrder)}` : 'Không yêu cầu'}
                  </td>
                  <td className="px-4 py-3">
                    {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(c.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.isActive && !isExpired(c.expiresAt) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.isActive && !isExpired(c.expiresAt) ? 'Còn hạn' : 'Hết hạn'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(c)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(c.id)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-20 text-center text-gray-500">
                  <Tag className="mx-auto mb-2 h-8 w-8" />
                  <p>Chưa có mã giảm giá nào</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}
            >{p}</button>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Mã code *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border px-3 py-2 text-sm uppercase" placeholder="SUMMER2024" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mô tả</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} placeholder="Mô tả ngắn..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Loại giảm</label>
                  <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                    className="w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Giá trị *</label>
                  <input type="number" min="0" step={form.discountType === 'PERCENTAGE' ? '1' : '1000'} value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Đơn tối thiểu</label>
                  <input type="number" min="0" step="1000" value={form.minOrder ?? ''}
                    onChange={(e) => setForm({ ...form, minOrder: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Giảm tối đa</label>
                  <input type="number" min="0" step="1000" value={form.maxDiscount ?? ''}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" disabled={form.discountType === 'FIXED'} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Giới hạn lượt dùng</label>
                <input type="number" min="0" value={form.usageLimit ?? ''}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Ngày bắt đầu *</label>
                  <input type="datetime-local" value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Ngày hết hạn *</label>
                  <input type="datetime-local" value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>
              {editingId && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Kích hoạt
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleSave}
                disabled={createMut.isPending || updateMut.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {createMut.isPending || updateMut.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold">Xác nhận xóa</h3>
            <p className="mb-6 text-sm text-gray-500">Bạn có chắc chắn muốn xóa mã giảm giá này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={() => deleteMut.mutate(deleteConfirm)}
                disabled={deleteMut.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMut.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User, Eye, Lock, Unlock, X } from 'lucide-react';
import { getAdminUsers, updateUserStatus, updateUserRole } from '../../api/admin';
import { formatCurrency } from '../../lib/utils';
import { ROLES_LABELS } from '../../../../shared/constants';
import type { AdminUserSummary } from '../../../../shared/types';

const roleStyles: Record<string, string> = {
  CUSTOMER: 'bg-gray-100 text-gray-700',
  STAFF: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const queryClient = useQueryClient();

  const { data: result, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: () => getAdminUsers(page, search || undefined, roleFilter || undefined),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
    },
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
    },
  });

  const users: AdminUserSummary[] = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500">{meta?.total || 0} người dùng</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Tìm kiếm email hoặc tên..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Tất cả vai trò</option>
          {Object.entries(ROLES_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Người dùng</th>
              <th className="px-4 py-3 font-medium">SĐT</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tham gia</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleStyles[u.role] || roleStyles.CUSTOMER}`}>
                      {ROLES_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-20 text-center text-gray-500">
                  <User className="mx-auto mb-2 h-8 w-8" />
                  <p>Chưa có người dùng nào</p>
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

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-20 pb-10">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Chi tiết người dùng</h2>
              <button onClick={() => setSelectedUser(null)}><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Số điện thoại</p>
                  <p className="font-medium">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vai trò</p>
                  <p className="font-medium">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleStyles[selectedUser.role] || roleStyles.CUSTOMER}`}>
                      {ROLES_LABELS[selectedUser.role] || selectedUser.role}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Trạng thái</p>
                  <p className="font-medium">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${selectedUser.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedUser.isActive ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày tham gia</p>
                  <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedUser.orderCount}</p>
                  <p className="text-gray-500">Đơn hàng</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatCurrency(selectedUser.totalSpent)}</p>
                  <p className="text-gray-500">Tổng chi tiêu</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-gray-700">Thao tác</p>
                <div className="flex flex-wrap gap-3">
                  {selectedUser.isActive ? (
                    <button
                      onClick={() => statusMut.mutate({ id: selectedUser.id, isActive: false })}
                      disabled={statusMut.isPending}
                      className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4" />
                      Khóa tài khoản
                    </button>
                  ) : (
                    <button
                      onClick={() => statusMut.mutate({ id: selectedUser.id, isActive: true })}
                      disabled={statusMut.isPending}
                      className="flex items-center gap-2 rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
                    >
                      <Unlock className="h-4 w-4" />
                      Mở khóa
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Đổi vai trò:</span>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => roleMut.mutate({ id: selectedUser.id, role: e.target.value })}
                      disabled={roleMut.isPending}
                      className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                      {Object.entries(ROLES_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

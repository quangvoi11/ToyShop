import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, MapPin, Check, X } from 'lucide-react';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../api/addresses';

interface AddressData {
  id: string;
  label: string | null;
  street: string;
  ward: string;
  district: string;
  city: string;
  phone: string;
  isDefault: boolean;
}

interface AddressForm {
  label: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  phone: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  label: '', street: '', ward: '', district: '', city: '', phone: '', isDefault: false,
};

export default function Addresses() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
  });

  const createMut = useMutation({
    mutationFn: () => createAddress(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowModal(false);
      setForm(emptyForm);
    },
  });

  const updateMut = useMutation({
    mutationFn: () => updateAddress(editingId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const setDefaultMut = useMutation({
    mutationFn: (id: string) => updateAddress(id, { isDefault: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEdit = (addr: AddressData) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || '',
      street: addr.street,
      ward: addr.ward,
      district: addr.district,
      city: addr.city,
      phone: addr.phone,
      isDefault: addr.isDefault,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateMut.mutate();
    } else {
      createMut.mutate();
    }
  };

  return (
    <div className="container-main py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Địa chỉ của tôi</h1>
          <p className="text-sm text-gray-500">{addresses?.length || 0} địa chỉ</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Thêm địa chỉ mới
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-white p-6">
              <div className="mb-3 h-5 w-48 rounded bg-gray-200" />
              <div className="mb-2 h-4 w-64 rounded bg-gray-200" />
              <div className="h-4 w-40 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : addresses?.length > 0 ? (
        <div className="space-y-4">
          {addresses.map((addr: AddressData) => (
            <div key={addr.id} className="relative rounded-xl border bg-white p-6 shadow-sm">
              {addr.isDefault && (
                <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Mặc định
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-lg bg-primary/10 p-2">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  {addr.label && <p className="mb-1 text-sm font-medium text-gray-700">{addr.label}</p>}
                  <p className="text-sm text-gray-600">{addr.street}, {addr.ward}</p>
                  <p className="text-sm text-gray-600">{addr.district}, {addr.city}</p>
                  <p className="mt-1 text-sm text-gray-500">📞 {addr.phone}</p>
                </div>
                <div className="flex items-start gap-2">
                  {!addr.isDefault && (
                    <button
                      onClick={() => setDefaultMut.mutate(addr.id)}
                      className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50"
                    >
                      <Check className="h-3 w-3" /> Đặt mặc định
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(addr)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Xóa địa chỉ này?')) deleteMut.mutate(addr.id); }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-white py-20 text-center text-gray-500">
          <MapPin className="mx-auto mb-4 h-10 w-10" />
          <p className="text-lg font-medium">Chưa có địa chỉ nào</p>
          <p className="mt-1 text-sm">Thêm địa chỉ để tiện cho việc đặt hàng</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
              <button onClick={() => { setShowModal(false); setEditingId(null); setForm(emptyForm); }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Tên gợi nhớ (VD: Nhà riêng)"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                placeholder="Số điện thoại *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
              <input
                placeholder="Địa chỉ (số nhà, đường) *"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  placeholder="Phường/Xã *"
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  className="rounded-lg border px-3 py-2 text-sm"
                  required
                />
                <input
                  placeholder="Quận/Huyện *"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="rounded-lg border px-3 py-2 text-sm"
                  required
                />
                <input
                  placeholder="Thành phố *"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                Đặt làm địa chỉ mặc định
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => { setShowModal(false); setEditingId(null); setForm(emptyForm); }}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={createMut.isPending || updateMut.isPending}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {createMut.isPending || updateMut.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, Star } from 'lucide-react';
import { getProducts } from '../api/products';
import { getCategories } from '../api/categories';
import { formatCurrency } from '../lib/utils';

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: result, isLoading } = useQuery({
    queryKey: ['products', { category, search, sort, page }],
    queryFn: () => getProducts({ category, search, sort, page, limit: 20 }),
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const hasFilters = category || search || sort !== 'newest';

  return (
    <div className="container-main py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          {search && <p className="mt-1 text-sm text-gray-500">Kết quả tìm kiếm cho "{search}"</p>}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm lg:hidden">
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className={`w-64 flex-shrink-0 ${showFilters ? 'fixed inset-0 z-50 overflow-auto bg-white p-6' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Bộ lọc</h2>
            {showFilters && <button onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></button>}
          </div>

          {/* Search */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium">Tìm kiếm</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                className="w-full rounded-lg border px-3 py-2 pr-8 text-sm"
              />
              <Search className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium">Danh mục</h3>
            <div className="space-y-1">
              <button onClick={() => updateParam('category', '')} className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 ${!category ? 'bg-primary/10 font-medium text-primary' : ''}`}>
                Tất cả
              </button>
              {categories?.map((cat: any) => (
                <button key={cat.id} onClick={() => updateParam('category', cat.slug)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 ${category === cat.slug ? 'bg-primary/10 font-medium text-primary' : ''}`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200">
              Xóa tất cả bộ lọc
            </button>
          )}
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border p-4">
                  <div className="mb-3 aspect-square rounded-lg bg-gray-200" />
                  <div className="mb-2 h-3 w-1/2 rounded bg-gray-200" />
                  <div className="mb-2 h-4 rounded bg-gray-200" />
                  <div className="h-5 w-1/3 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {result?.data?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {result.data.map((product: any) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.slug}`}
                      className="group rounded-xl border bg-white p-4 transition-all hover:shadow-lg"
                    >
                      <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-gray-100">
                        <span className="text-5xl">🧱</span>
                      </div>
                      <p className="mb-1 text-xs text-gray-500">{product.category?.name}</p>
                      <h3 className="mb-2 line-clamp-2 text-sm font-medium group-hover:text-primary">{product.name}</h3>
                      <div className="mb-2 flex items-center gap-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(Number(product.basePrice))}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Search className="mb-4 h-12 w-12" />
                  <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
                  <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
              )}

              {/* Pagination */}
              {result?.meta && result.meta.totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: result.meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParam('page', String(p))}
                      className={`h-10 w-10 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'border hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

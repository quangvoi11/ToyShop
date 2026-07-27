import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const emojis = ['🧸', '🎮', '🎲', '🎨', '🤖', '🧩', '🏎️', '🪁', '🎯', '🧱'];

interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  _count?: { products: number };
}

interface CategoryGridProps {
  categories: CategoryItem[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((cat, idx) => (
        <Link
          key={cat.id}
          to={`/products?category=${cat.slug}`}
          className="group relative overflow-hidden rounded-xl border p-6 text-center transition-all hover:border-primary hover:shadow-lg"
        >
          <div className="relative z-10 mb-3 flex h-16 items-center justify-center text-4xl">
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="transition-transform group-hover:scale-110">
                {emojis[idx % emojis.length]}
              </span>
            )}
          </div>
          <h3 className="relative z-10 font-semibold transition-colors group-hover:text-primary">
            {cat.name}
          </h3>
          <p className="relative z-10 mt-1 text-xs text-gray-500">
            {cat._count?.products || 0} sản phẩm
          </p>
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-b from-transparent via-transparent to-accent-blue/5 opacity-0 transition-opacity group-hover:opacity-100">
            <ArrowRight className="h-8 w-8 text-accent-blue opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </div>
        </Link>
      ))}
    </div>
  );
}

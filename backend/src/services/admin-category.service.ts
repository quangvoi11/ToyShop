import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { slugify } from '@shared/utils/index';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  productsCount: number;
  children: CategoryNode[];
}

function buildTree(
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
    _count: { products: number };
  }>,
): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  categories.forEach((c) => {
    map.set(c.id, {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      parentId: c.parentId,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      productsCount: c._count.products,
      children: [],
    });
  });

  const roots: CategoryNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  const aggregateProducts = (node: CategoryNode): number => {
    let total = node.productsCount;
    node.children.forEach((child) => {
      total += aggregateProducts(child);
    });
    node.productsCount = total;
    return total;
  };
  roots.forEach(aggregateProducts);

  return roots;
}

function flatten(nodes: CategoryNode[], depth = 0): Array<CategoryNode & { depth: number }> {
  const result: Array<CategoryNode & { depth: number }> = [];
  nodes.forEach((n) => {
    result.push({ ...n, depth });
    if (n.children.length) result.push(...flatten(n.children, depth + 1));
  });
  return result;
}

async function collectDescendantIds(id: string): Promise<Set<string>> {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const childrenOf = new Map<string, string[]>();
  all.forEach((c) => {
    if (c.parentId) {
      if (!childrenOf.has(c.parentId)) childrenOf.set(c.parentId, []);
      childrenOf.get(c.parentId)!.push(c.id);
    }
  });

  const ids = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    const kids = childrenOf.get(current) || [];
    kids.forEach((k) => {
      if (!ids.has(k)) {
        ids.add(k);
        stack.push(k);
      }
    });
  }
  return ids;
}

export async function getTree() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return buildTree(categories);
}

export async function getFlat() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return flatten(buildTree(categories)).map(({ children: _children, ...rest }) => rest);
}

export async function getById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!category) throw new AppError('Category not found', 404);
  return category;
}

export async function create(data: {
  name: string;
  slug?: string;
  description?: string;
  image?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const slug = data.slug || slugify(data.name);
  const existingSlug = await prisma.category.findUnique({ where: { slug } });
  if (existingSlug) throw new AppError('Slug danh mục đã tồn tại', 409);

  if (data.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new AppError('Danh mục cha không tồn tại', 400);
  }

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      image: data.image,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export async function update(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    image: string | null;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
  }>,
) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);

  if (data.slug && data.slug !== category.slug) {
    const slugExists = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (slugExists) throw new AppError('Slug danh mục đã tồn tại', 409);
  }

  if (data.parentId !== undefined && data.parentId) {
    if (data.parentId === id) throw new AppError('Danh mục không thể là cha của chính nó', 400);
    const descendants = await collectDescendantIds(id);
    if (descendants.has(data.parentId)) {
      throw new AppError('Không thể chọn danh mục con làm cha (gây vòng lặp)', 400);
    }
    const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
    if (!parent) throw new AppError('Danh mục cha không tồn tại', 400);
  }

  return prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      image: data.image,
      parentId: data.parentId === null ? null : data.parentId,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

export async function remove(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);

  return prisma.category.update({
    where: { id },
    data: { isActive: false },
  });
}

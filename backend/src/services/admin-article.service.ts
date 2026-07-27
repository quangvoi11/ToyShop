import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = toSlug(title);
  const existing = await prisma.article.findUnique({ where: { slug: baseSlug } });
  if (!existing) return baseSlug;
  return `${baseSlug}-${Date.now().toString(36)}`;
}

export async function getAll(query: any) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.isPublished !== undefined) where.isPublished = query.isPublished === 'true';
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.authorId) where.authorId = query.authorId;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search } },
      { excerpt: { contains: query.search } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return {
    data: articles,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string) {
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      category: { select: { id: true, name: true } },
    },
  });
  if (!article) throw new AppError('Bài viết không tồn tại', 404);
  return article;
}

export async function create(data: any, authorId: string) {
  const slug = data.slug || await generateUniqueSlug(data.title);

  return prisma.article.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || null,
      thumbnail: data.thumbnail || null,
      tags: data.tags || '[]',
      authorId,
      categoryId: data.categoryId || null,
      isPublished: data.isPublished || false,
      publishedAt: data.isPublished ? new Date() : null,
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      category: { select: { id: true, name: true } },
    },
  });
}

export async function update(id: string, data: any) {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) throw new AppError('Bài viết không tồn tại', 404);

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) {
    updateData.title = data.title;
    updateData.slug = data.slug || await generateUniqueSlug(data.title);
  }
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
  if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
  if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
  if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;

  return prisma.article.update({
    where: { id },
    data: updateData,
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
      category: { select: { id: true, name: true } },
    },
  });
}

export async function remove(id: string) {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) throw new AppError('Bài viết không tồn tại', 404);

  return prisma.article.delete({ where: { id } });
}

export async function togglePublish(id: string) {
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) throw new AppError('Bài viết không tồn tại', 404);

  const willPublish = !article.isPublished;
  return prisma.article.update({
    where: { id },
    data: {
      isPublished: willPublish,
      publishedAt: willPublish ? new Date() : null,
    },
  });
}

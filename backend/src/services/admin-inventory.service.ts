import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export async function getStockOverview(query: any) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = query.search || '';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        _count: { select: { batches: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    batchCount: p._count.batches,
    lowStock: p.stock < 10,
  }));

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function adjustStock(data: any, userId: string) {
  const isDecrement = data.type === 'OUT' || data.type === 'ADJUST';
  const quantity = isDecrement ? -Math.abs(data.quantity) : Math.abs(data.quantity);

  return prisma.$transaction(async (tx) => {
    if (isDecrement) {
      const product = await tx.product.findUnique({ where: { id: data.productId }, select: { stock: true } });
      if (!product) throw new AppError('Sản phẩm không tồn tại', 404);
      if (product.stock < Math.abs(quantity)) {
        throw new AppError('Tồn kho không đủ', 400);
      }
    }

    await tx.product.update({
      where: { id: data.productId },
      data: { stock: { increment: quantity } },
    });

    if (data.variantId) {
      await tx.productVariant.update({
        where: { id: data.variantId },
        data: { stock: { increment: quantity } },
      });
    }

    return tx.stockMovement.create({
      data: {
        productId: data.productId,
        variantId: data.variantId || null,
        warehouseId: data.warehouseId,
        batchId: data.batchId || null,
        type: data.type,
        quantity,
        note: data.note || null,
        reference: data.reference || null,
        createdBy: userId,
      },
    });
  });
}

export async function getMovements(query: any) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.productId) where.productId = query.productId;
  if (query.variantId) where.variantId = query.variantId;
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.type) where.type = query.type;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(query.dateFrom as string);
    if (query.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(query.dateTo as string);
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true } },
        variant: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    data: movements,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getMovementById(id: string) {
  const movement = await prisma.stockMovement.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true } },
      variant: { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true } },
      batch: { select: { id: true, batchCode: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!movement) throw new AppError('Phiếu nhập/xuất không tồn tại', 404);
  return movement;
}

export async function getAllWarehouses() {
  return prisma.warehouse.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function createWarehouse(data: { name: string; address?: string | null }) {
  const existing = await prisma.warehouse.findUnique({ where: { name: data.name } });
  if (existing) throw new AppError('Tên kho đã tồn tại', 409);

  return prisma.warehouse.create({
    data: {
      name: data.name,
      address: data.address || null,
    },
  });
}

export async function updateWarehouse(id: string, data: { name?: string; address?: string | null }) {
  const warehouse = await prisma.warehouse.findUnique({ where: { id } });
  if (!warehouse) throw new AppError('Kho không tồn tại', 404);

  if (data.name && data.name !== warehouse.name) {
    const existing = await prisma.warehouse.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError('Tên kho đã tồn tại', 409);
  }

  return prisma.warehouse.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
    },
  });
}

export async function deactivateWarehouse(id: string) {
  const warehouse = await prisma.warehouse.findUnique({ where: { id } });
  if (!warehouse) throw new AppError('Kho không tồn tại', 404);

  return prisma.warehouse.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function getAllBatches(query: any) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.productId) where.productId = query.productId;
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.expiredOnly === 'true') {
    where.expiryDate = { lte: new Date() };
  }

  const [batches, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    }),
    prisma.batch.count({ where }),
  ]);

  return {
    data: batches,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createBatch(data: any, userId: string) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.batch.create({
      data: {
        productId: data.productId,
        variantId: data.variantId || null,
        warehouseId: data.warehouseId,
        batchCode: data.batchCode,
        quantity: data.quantity,
        remainingQuantity: data.quantity,
        costPrice: data.costPrice,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
    });

    await tx.product.update({
      where: { id: data.productId },
      data: { stock: { increment: data.quantity } },
    });

    await tx.stockMovement.create({
      data: {
        productId: data.productId,
        variantId: data.variantId || null,
        warehouseId: data.warehouseId,
        batchId: batch.id,
        type: 'IN',
        quantity: data.quantity,
        note: 'Nhập kho từ lô hàng',
        createdBy: userId,
      },
    });

    return batch;
  });
}

export async function updateBatch(id: string, data: { batchCode?: string; costPrice?: number; expiryDate?: string | null }) {
  const batch = await prisma.batch.findUnique({ where: { id } });
  if (!batch) throw new AppError('Lô hàng không tồn tại', 404);

  return prisma.batch.update({
    where: { id },
    data: {
      ...(data.batchCode !== undefined ? { batchCode: data.batchCode } : {}),
      ...(data.costPrice !== undefined ? { costPrice: data.costPrice } : {}),
      ...(data.expiryDate !== undefined ? { expiryDate: data.expiryDate ? new Date(data.expiryDate) : null } : {}),
    },
  });
}

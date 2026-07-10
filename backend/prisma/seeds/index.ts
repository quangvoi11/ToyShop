import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function generateOrderCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TS${timestamp}${random}`;
}

async function main() {
  console.log('Seeding database...');

  // ─── Admin User ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@toyshop.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@toyshop.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'ToyShop',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // ─── Categories ──────────────────────────────────────────────
  const parentCategories: Record<string, string> = {};
  const categoryList = [
    { name: 'LEGO', slug: 'lego', description: 'Đồ chơi lắp ráp LEGO chính hãng' },
    { name: 'Búp bê', slug: 'bup-be', description: 'Búp bê và phụ kiện' },
    { name: 'Xe điều khiển', slug: 'xe-dieu-khien', description: 'Xe điều khiển từ xa' },
    { name: 'Đồ chơi giáo dục', slug: 'do-choi-giao-duc', description: 'Đồ chơi phát triển trí tuệ' },
    { name: 'Thú nhồi bông', slug: 'thu-nhoi-bong', description: 'Thú nhồi bông mềm mại' },
    { name: 'Mô hình & Figure', slug: 'mo-hinh-figure', description: 'Mô hình lắp ráp và tượng nhân vật' },
    { name: 'Board Game', slug: 'board-game', description: 'Board game và trò chơi gia đình' },
  ];

  for (const cat of categoryList) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    parentCategories[cat.slug] = created.id;
  }
  console.log(`Created ${categoryList.length} categories`);

  // ─── Subcategories ───────────────────────────────────────────
  const subcategories = [
    { name: 'LEGO City', slug: 'lego-city', parentSlug: 'lego' },
    { name: 'LEGO Technic', slug: 'lego-technic', parentSlug: 'lego' },
    { name: 'LEGO Star Wars', slug: 'lego-star-wars', parentSlug: 'lego' },
    { name: 'LEGO Duplo', slug: 'lego-duplo', parentSlug: 'lego' },
    { name: 'LEGO Creator', slug: 'lego-creator', parentSlug: 'lego' },
    { name: 'LEGO Friends', slug: 'lego-friends', parentSlug: 'lego' },
    { name: 'LEGO Harry Potter', slug: 'lego-harry-potter', parentSlug: 'lego' },
  ];

  for (const sub of subcategories) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: {
        name: sub.name,
        slug: sub.slug,
        parentId: parentCategories[sub.parentSlug],
      },
    });
  }
  console.log(`Created ${subcategories.length} subcategories`);

  // ─── Brands ──────────────────────────────────────────────────
  const existingBrands = await prisma.brand.findMany();
  const existingBrandSlugs = existingBrands.map(b => b.slug);

  const newBrands = [
    { name: 'LEGO', slug: 'lego' },
    { name: 'Hot Wheels', slug: 'hot-wheels' },
    { name: 'Barbie', slug: 'barbie' },
    { name: 'Fisher-Price', slug: 'fisher-price' },
    { name: 'Gấu bông', slug: 'gau-bong' },
    { name: 'Bandai', slug: 'bandai' },
    { name: 'Hasbro', slug: 'hasbro' },
    { name: 'Mattel', slug: 'mattel' },
    { name: 'Funko', slug: 'funko' },
    { name: 'Disney', slug: 'disney' },
    { name: 'VTech', slug: 'vtech' },
  ];

  const brandMap: Record<string, string> = {};
  for (const brand of newBrands) {
    const created = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    });
    brandMap[brand.slug] = created.id;
  }
  console.log(`Created ${newBrands.length} brands`);

  // ─── Demo Users ──────────────────────────────────────────────
  const customerPassword = await bcrypt.hash('customer123', 10);

  const demoUsers = [
    { email: 'customer1@toyshop.vn', password: customerPassword, firstName: 'Nguyễn', lastName: 'Văn An', role: 'CUSTOMER', isActive: true },
    { email: 'customer2@toyshop.vn', password: customerPassword, firstName: 'Trần', lastName: 'Thị Bình', role: 'CUSTOMER', isActive: true },
    { email: 'vip@toyshop.vn', password: await bcrypt.hash('vip123', 10), firstName: 'Lê', lastName: 'Văn Cường', role: 'CUSTOMER', isActive: true },
    { email: 'staff@toyshop.vn', password: await bcrypt.hash('staff123', 10), firstName: 'Phạm', lastName: 'Thị Dung', role: 'STAFF', isActive: true },
    { email: 'banned@toyshop.vn', password: customerPassword, firstName: 'Hoàng', lastName: 'Văn E', role: 'CUSTOMER', isActive: false },
  ];

  const userIds: Record<string, string> = {};
  for (const u of demoUsers) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    userIds[u.email] = created.id;
  }
  console.log(`Created ${demoUsers.length} demo users`);

  // ─── Addresses ───────────────────────────────────────────────
  const customer1Id = userIds['customer1@toyshop.vn'];

  const addresses = [
    { userId: customer1Id, label: 'Nhà riêng', street: '123 Nguyễn Huệ', ward: 'Bến Nghé', district: 'Quận 1', city: 'TP HCM', isDefault: true, phone: '0901234567' },
    { userId: customer1Id, label: 'Văn phòng', street: '456 Lê Lợi', ward: 'Phường 3', district: 'Quận Gò Vấp', city: 'TP HCM', isDefault: false, phone: '0901234567' },
  ];

  const addressIds: string[] = [];
  for (const addr of addresses) {
    const existing = await prisma.address.findFirst({
      where: { userId: addr.userId, street: addr.street },
    });
    if (existing) {
      addressIds.push(existing.id);
    } else {
      const created = await prisma.address.create({ data: addr });
      addressIds.push(created.id);
    }
  }
  console.log(`Created ${addresses.length} addresses`);

  // ─── Products ────────────────────────────────────────────────
  const legoSubSlugs = ['lego-city', 'lego-technic', 'lego-star-wars', 'lego-duplo', 'lego-creator', 'lego-friends', 'lego-harry-potter'];
  const legoSubCats = await prisma.category.findMany({
    where: { slug: { in: legoSubSlugs } },
  });
  const subCatMap: Record<string, string> = {};
  for (const sc of legoSubCats) {
    subCatMap[sc.slug] = sc.id;
  }

  const productCategoryMap: Record<string, string> = {
    'lego-city': subCatMap['lego-city'] || parentCategories['lego'],
    'lego-technic': subCatMap['lego-technic'] || parentCategories['lego'],
    'lego-star-wars': subCatMap['lego-star-wars'] || parentCategories['lego'],
    'lego-duplo': subCatMap['lego-duplo'] || parentCategories['lego'],
    'lego-creator': subCatMap['lego-creator'] || parentCategories['lego'],
    'lego-friends': subCatMap['lego-friends'] || parentCategories['lego'],
    'lego-harry-potter': subCatMap['lego-harry-potter'] || parentCategories['lego'],
  };

  const products = [
    { name: 'LEGO City Police Station 60316', slug: 'lego-city-police-station-60316', basePrice: 1290000, sku: 'LEGO-60316', categorySlug: 'lego-city', brandSlug: 'lego', stock: 50, isFeatured: true },
    { name: 'LEGO Technic Porsche 911 RSR 42096', slug: 'lego-technic-porsche-911-rsr-42096', basePrice: 3490000, sku: 'LEGO-42096', categorySlug: 'lego-technic', brandSlug: 'lego', stock: 20, isFeatured: false },
    { name: 'LEGO Star Wars Millennium Falcon 75192', slug: 'lego-star-wars-millennium-falcon-75192', basePrice: 8990000, sku: 'LEGO-75192', categorySlug: 'lego-star-wars', brandSlug: 'lego', stock: 5, isFeatured: true },
    { name: 'LEGO Duplo Farm', slug: 'lego-duplo-farm', basePrice: 650000, sku: 'LEGO-DUPLO-FARM', categorySlug: 'lego-duplo', brandSlug: 'lego', stock: 40, isFeatured: false },
    { name: 'LEGO Harry Potter Castle', slug: 'lego-harry-potter-castle', basePrice: 3200000, sku: 'LEGO-HP-CASTLE', categorySlug: 'lego-harry-potter', brandSlug: 'lego', stock: 10, isFeatured: true },
    { name: 'LEGO Creator Expert Mustang', slug: 'lego-creator-expert-mustang', basePrice: 2490000, sku: 'LEGO-CREATOR-MUSTANG', categorySlug: 'lego-creator', brandSlug: 'lego', stock: 15, isFeatured: false },
    { name: 'LEGO Friends Heartlake City 41732', slug: 'lego-friends-heartlake-city-41732', basePrice: 2590000, sku: 'LEGO-41732', categorySlug: 'lego-friends', brandSlug: 'lego', stock: 30, isFeatured: false },
    { name: 'Gundam RX-78-2 Entry Grade', slug: 'gundam-rx-78-2-entry-grade', basePrice: 180000, sku: 'BANDAI-RX78-EG', categorySlug: 'mo-hinh-figure', brandSlug: 'bandai', stock: 100, isFeatured: false },
    { name: 'Gundam Wing Zero EW Ver', slug: 'gundam-wing-zero-ew-ver', basePrice: 650000, sku: 'BANDAI-WZ-EW', categorySlug: 'mo-hinh-figure', brandSlug: 'bandai', stock: 60, isFeatured: false },
    { name: 'Barbie Dreamhouse', slug: 'barbie-dreamhouse', basePrice: 1800000, sku: 'BARBIE-DREAMHOUSE', categorySlug: 'bup-be', brandSlug: 'barbie', stock: 25, isFeatured: false },
    { name: 'Barbie Fashionista', slug: 'barbie-fashionista', basePrice: 250000, sku: 'BARBIE-FASHION', categorySlug: 'bup-be', brandSlug: 'barbie', stock: 80, isFeatured: false },
    { name: 'Hot Wheels 5-pack', slug: 'hot-wheels-5-pack', basePrice: 250000, salePrice: 199000, sku: 'HW-5PACK', categorySlug: 'xe-dieu-khien', brandSlug: 'hot-wheels', stock: 200, isFeatured: false },
    { name: 'Bộ thí nghiệm khoa học 100 thí nghiệm', slug: 'bo-thi-nghiem-khoa-hoc-100', basePrice: 350000, sku: 'EDU-SCIENCE-100', categorySlug: 'do-choi-giao-duc', brandSlug: 'fisher-price', stock: 45, isFeatured: false },
    { name: 'Board game Catan', slug: 'board-game-catan', basePrice: 450000, sku: 'BG-CATAN', categorySlug: 'board-game', brandSlug: 'hasbro', stock: 30, isFeatured: false },
    { name: 'Board game Uno', slug: 'board-game-uno', basePrice: 80000, sku: 'BG-UNO', categorySlug: 'board-game', brandSlug: 'hasbro', stock: 150, isFeatured: false },
    { name: 'Gấu bông 1m', slug: 'gau-bong-1m', basePrice: 320000, sku: 'STUFFED-1M', categorySlug: 'thu-nhoi-bong', brandSlug: 'gau-bong', stock: 35, isFeatured: true },
    { name: 'Gấu bông Disney', slug: 'gau-bong-disney', basePrice: 250000, sku: 'STUFFED-DISNEY', categorySlug: 'thu-nhoi-bong', brandSlug: 'disney', stock: 50, isFeatured: false },
    { name: 'Bộ lắp ráp robot năng lượng mặt trời', slug: 'bo-lap-rap-robot-nang-luong-mat-troi', basePrice: 280000, sku: 'EDU-SOLAR-ROBOT', categorySlug: 'do-choi-giao-duc', brandSlug: 'fisher-price', stock: 40, isFeatured: false },
    { name: 'VTech Máy tính bảng học tập', slug: 'vtech-may-tinh-bang-hoc-tap', basePrice: 550000, sku: 'VTECH-TABLET', categorySlug: 'do-choi-giao-duc', brandSlug: 'vtech', stock: 30, isFeatured: false },
    { name: 'Xe điều khiển Ferrari', slug: 'xe-dieu-khien-ferrari', basePrice: 420000, sku: 'RC-FERRARI', categorySlug: 'xe-dieu-khien', brandSlug: 'mattel', stock: 25, isFeatured: false },
    { name: 'Máy bay điều khiển', slug: 'may-bay-dieu-khien', basePrice: 380000, sku: 'RC-PLANE', categorySlug: 'xe-dieu-khien', brandSlug: 'mattel', stock: 20, isFeatured: false },
    { name: 'Funko Pop Harry Potter', slug: 'funko-pop-harry-potter', basePrice: 180000, sku: 'FUNKO-HP', categorySlug: 'mo-hinh-figure', brandSlug: 'funko', stock: 100, isFeatured: false },
    { name: 'Funko Pop Marvel', slug: 'funko-pop-marvel', basePrice: 180000, sku: 'FUNKO-MARVEL', categorySlug: 'mo-hinh-figure', brandSlug: 'funko', stock: 100, isFeatured: false },
  ];

  const productIds: string[] = [];
  for (const p of products) {
    const categoryId = productCategoryMap[p.categorySlug] || parentCategories[p.categorySlug];
    const brandId = brandMap[p.brandSlug];

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      productIds.push(existing.id);
    } else {
      const created = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          basePrice: p.basePrice,
          salePrice: (p as any).salePrice,
          sku: p.sku,
          categoryId,
          brandId,
          stock: p.stock,
          isFeatured: p.isFeatured,
        },
      });
      productIds.push(created.id);
    }
  }
  console.log(`Created ${products.length} products`);

  // ─── Orders ──────────────────────────────────────────────────
  const customer2Id = userIds['customer2@toyshop.vn'];
  const vipId = userIds['vip@toyshop.vn'];

  const orderFixtures = [
    { userId: customer1Id, addressId: addressIds[0], status: 'DELIVERED', paymentStatus: 'PAID', daysAgo: 5, itemIndexes: [0, 11], note: 'Giao hàng giờ hành chính' },
    { userId: customer2Id, addressId: addressIds[0], status: 'SHIPPING', paymentStatus: 'PAID', daysAgo: 2, itemIndexes: [1, 7], note: 'Gọi trước khi giao' },
    { userId: vipId, addressId: addressIds[0], status: 'PROCESSING', paymentStatus: 'PAID', daysAgo: 1, itemIndexes: [4, 13], note: undefined },
    { userId: customer1Id, addressId: addressIds[1], status: 'CONFIRMED', paymentStatus: 'UNPAID', daysAgo: 0, itemIndexes: [3, 15], note: undefined },
    { userId: customer2Id, addressId: addressIds[0], status: 'PENDING', paymentStatus: 'UNPAID', daysAgo: 0, itemIndexes: [9, 10], note: undefined },
    { userId: vipId, addressId: addressIds[0], status: 'CANCELLED', paymentStatus: 'UNPAID', daysAgo: 3, itemIndexes: [2], note: 'Đổi ý không mua nữa', cancelReason: 'Khách hàng yêu cầu hủy' },
    { userId: customer1Id, addressId: addressIds[0], status: 'DELIVERED', paymentStatus: 'PAID', daysAgo: 10, itemIndexes: [12, 17, 18], note: undefined },
  ];

  for (const fix of orderFixtures) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - fix.daysAgo);
    createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 12));

    let subtotal = 0;
    const orderItems = fix.itemIndexes.map((idx) => {
      const p = products[idx];
      const price = (p as any).salePrice || p.basePrice;
      const qty = Math.floor(Math.random() * 3) + 1;
      const total = price * qty;
      subtotal += total;
      return {
        productId: productIds[idx],
        productName: p.name,
        productSku: p.sku,
        price,
        quantity: qty,
        total,
      };
    });

    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    const total = subtotal + shippingFee;

    await prisma.order.create({
      data: {
        orderCode: generateOrderCode(),
        userId: fix.userId,
        addressId: fix.addressId,
        status: fix.status,
        paymentMethod: fix.paymentStatus === 'PAID' ? 'MOMO' : 'COD',
        paymentStatus: fix.paymentStatus,
        subtotal,
        shippingFee,
        total,
        note: fix.note,
        cancelReason: (fix as any).cancelReason,
        deliveredAt: fix.status === 'DELIVERED' ? createdAt : undefined,
        cancelledAt: fix.status === 'CANCELLED' ? createdAt : undefined,
        createdAt,
        items: { create: orderItems },
      },
    });
  }
  console.log(`Created ${orderFixtures.length} orders`);

  // ─── Coupons ─────────────────────────────────────────────────
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setMonth(futureDate.getMonth() + 3);

  const pastDate = new Date(now);
  pastDate.setMonth(pastDate.getMonth() - 1);

  const coupons = [
    { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10, minOrder: 200000, maxDiscount: 50000, usageLimit: 100, startsAt: pastDate, expiresAt: futureDate },
    { code: 'FREESHIP', description: 'Miễn phí vận chuyển', discountType: 'FIXED', discountValue: 30000, minOrder: 500000, maxDiscount: 30000, usageLimit: 200, startsAt: pastDate, expiresAt: futureDate },
    { code: 'GIAM50K', discountType: 'FIXED', discountValue: 50000, minOrder: 300000, usageLimit: 100, startsAt: pastDate, expiresAt: futureDate },
    { code: 'BLACKFRIDAY', discountType: 'PERCENTAGE', discountValue: 30, minOrder: 1000000, maxDiscount: 300000, usageLimit: 50, startsAt: futureDate, expiresAt: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000) },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log(`Created ${coupons.length} coupons`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

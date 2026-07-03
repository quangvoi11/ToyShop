import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin User ──────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@toyshop.com' },
    update: {},
    create: {
      email: 'admin@toyshop.com',
      password: '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9Rn6bm1FJm9t5FdCpJqG8KvGle', // Admin@123
      firstName: 'Admin',
      lastName: 'ToyShop',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // ─── Categories ──────────────────────────────────────────────
  const categories = [
    { name: 'LEGO', slug: 'lego', description: 'Đồ chơi lắp ráp LEGO chính hãng' },
    { name: 'Búp bê', slug: 'bup-be', description: 'Búp bê và phụ kiện' },
    { name: 'Xe điều khiển', slug: 'xe-dieu-khien', description: 'Xe điều khiển từ xa' },
    { name: 'Đồ chơi giáo dục', slug: 'do-choi-giao-duc', description: 'Đồ chơi phát triển trí tuệ' },
    { name: 'Thú nhồi bông', slug: 'thu-nhoi-bong', description: 'Thú nhồi bông mềm mại' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`Created ${categories.length} categories`);

  // ─── Brands ──────────────────────────────────────────────────
  const brands = [
    { name: 'LEGO', slug: 'lego' },
    { name: 'Hot Wheels', slug: 'hot-wheels' },
    { name: 'Barbie', slug: 'barbie' },
    { name: 'Fisher-Price', slug: 'fisher-price' },
    { name: 'Gấu bông', slug: 'gau-bong' },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    });
  }
  console.log(`Created ${brands.length} brands`);

  // ─── Sample Products ─────────────────────────────────────────
  const legoCategory = await prisma.category.findUnique({ where: { slug: 'lego' } });
  const legoBrand = await prisma.brand.findUnique({ where: { slug: 'lego' } });
  const carCategory = await prisma.category.findUnique({ where: { slug: 'xe-dieu-khien' } });

  if (legoCategory && legoBrand) {
    const products = [
      {
        name: 'LEGO City Police Station 60316',
        slug: 'lego-city-police-station-60316',
        basePrice: 1290000,
        sku: 'LEGO-60316',
        categoryId: legoCategory.id,
        brandId: legoBrand.id,
        stock: 50,
        isFeatured: true,
      },
      {
        name: 'LEGO Technic Porsche 911 RSR 42096',
        slug: 'lego-technic-porsche-911-rsr-42096',
        basePrice: 3490000,
        sku: 'LEGO-42096',
        categoryId: legoCategory.id,
        brandId: legoBrand.id,
        stock: 20,
        isFeatured: true,
      },
      {
        name: 'LEGO Friends Heartlake City 41732',
        slug: 'lego-friends-heartlake-city-41732',
        basePrice: 2590000,
        sku: 'LEGO-41732',
        categoryId: legoCategory.id,
        brandId: legoBrand.id,
        stock: 30,
        isFeatured: false,
      },
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: product,
      });
    }
    console.log(`Created ${products.length} products`);
  }

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

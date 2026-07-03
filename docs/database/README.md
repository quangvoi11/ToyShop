# Database

## Overview

Microsoft SQL Server 2022 running on Azure SQL Database.

## Schema

The Prisma schema is located at `backend/prisma/schema.prisma`.

### Entities

| Entity           | Description                        |
| ---------------- | ---------------------------------- |
| User             | Customer, admin, and staff accounts |
| Address          | User shipping addresses             |
| Category         | Product category hierarchy (tree)   |
| Brand            | Product brands                      |
| Product          | Core product entity                 |
| ProductVariant   | Product variations (size, color)    |
| ProductImage     | Product image gallery               |
| Review           | Product ratings and reviews         |
| Cart             | Per-user shopping cart              |
| CartItem         | Items in cart                       |
| WishlistItem     | Saved/wishlisted products           |
| Order            | Customer orders                     |
| OrderItem        | Line items on orders                |
| Coupon           | Discount codes                      |

## Migration Workflow

```bash
# Create a new migration
npm run db:migrate -- --name describe_change

# Apply migrations in production
npm run db:migrate:prod

# Reset database (dev only)
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

## ERD

See [erd/](./erd/) for entity relationship diagrams.

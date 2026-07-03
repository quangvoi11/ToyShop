# Architecture

## Overview

ToyShop follows a modern **monorepo architecture** with clear separation between frontend, backend, and shared modules.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────┐
│                    Vercel (CDN)                          │
│              React SPA (TypeScript)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Pages   │ │Components│ │  Store   │ │  Query   │  │
│  │  Router  │ │ (shadcn) │ │ (Redux)  │ │(TanStack)│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────────────────────┐
│              Azure App Service / Render                  │
│              Express API (TypeScript)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Routes  │ │Middleware│ │Services  │ │   Auth   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ Prisma ORM
          ┌──────────┴──────────┐
          │                     │
┌─────────▼─────────┐ ┌─────────▼─────────┐
│  Azure SQL DB     │ │    Cloudinary      │
│  SQL Server 2022  │ │   (Image Store)    │
└───────────────────┘ └───────────────────┘
```

## Key Design Decisions

| Decision              | Choice              | Rationale                                  |
| --------------------- | ------------------- | ------------------------------------------ |
| Monorepo              | npm workspaces      | Shared types, single CI, simplified deps   |
| Frontend State        | Redux Toolkit       | Predictable global state                   |
| Server State          | TanStack Query      | Caching, refetching, optimistic updates    |
| API Style             | REST                | Simplicity, wide tooling support           |
| ORM                   | Prisma              | Type-safe, auto-migrations, great DX       |
| Image Storage         | Cloudinary          | CDN, transformations, optimization         |
| Containerization      | Docker Compose      | Consistent dev environment                 |
| UI Framework          | shadcn/ui           | Accessible, customizable, copy-paste model |
| Authentication        | JWT (access+refresh)| Stateless, scalable                        |

## Layer Separation

### Presentation Layer (Frontend)
- React components organized by feature
- shadcn/ui for design system primitives
- Page-level orchestration with layouts

### Application Layer (Backend)
- Express controllers handle HTTP concerns
- Zod validation middleware
- Standardized JSON response format

### Domain Layer (Backend)
- Business logic in services
- Domain models defined in Prisma schema
- Independent of HTTP concerns

### Data Layer
- Prisma ORM with SQL Server
- Repository pattern for testability
- Migration-based schema changes

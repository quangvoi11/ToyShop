# ToyShop 🧸

**Production-ready Full Stack E-commerce Platform**

A modern, scalable e-commerce website for toys, built with React, Node.js, Express, TypeScript, and Prisma.

## Tech Stack

| Layer       | Technology                                        |
| ----------- | ------------------------------------------------- |
| Frontend    | React, Vite, TypeScript, Tailwind CSS, shadcn/ui  |
| State       | Redux Toolkit, TanStack Query                     |
| Backend     | Node.js, Express.js, TypeScript, Prisma ORM       |
| Database    | Microsoft SQL Server 2022                         |
| Storage     | Cloudinary                                        |
| Containers  | Docker, Docker Compose                            |
| CI/CD       | GitHub Actions                                    |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend   │────▶│     SQL       │
│  (Vercel)    │     │ (Azure App) │     │   Server      │
│  React/Vite  │◀────│ Express/TS  │◀────│   2022        │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                    ┌──────▼──────┐
                    │  Cloudinary  │
                    │  (Images)    │
                    └─────────────┘
```

## Prerequisites

- Node.js >= 20
- Docker Desktop
- SQL Server 2022 (local or Azure)
- Git

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/toyshop.git
cd toyshop

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development servers
npm run dev
```

## Project Structure

```
toyshop/
├── frontend/          # React SPA
├── backend/           # Express API
├── shared/            # Shared types and utilities
├── database/          # Database scripts and ERD
├── docker/            # Docker configuration
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## Documentation

All project documentation is in the [docs](./docs) folder:

- [Architecture](./docs/architecture/)
- [API Reference](./docs/api/)
- [Database Design](./docs/database/)
- [Development Guide](./docs/development/)
- [Deployment Guide](./docs/deployment/)
- [Contributing](./docs/guides/CONTRIBUTING.md)

## License

MIT

# Development Guide

## Prerequisites

- Windows 11
- Node.js >= 20
- Docker Desktop (optional)
- SQL Server 2022 (local or Docker)
- Visual Studio Code

## Quick Start

```bash
# Setup (install deps, migrate, seed)
.\scripts\setup.ps1

# Start development servers
npm run dev
```

## Project Scripts

| Script              | Description                           |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start frontend + backend concurrently |
| `npm run build`     | Build both apps                       |
| `npm run lint`      | Lint all packages                     |
| `npm run format`    | Format all files with Prettier        |
| `npm run test`      | Run all tests                         |
| `npm run db:migrate`| Run Prisma migrations                 |
| `npm run db:seed`   | Seed the database                     |
| `npm run db:studio` | Open Prisma Studio                    |

## Coding Standards

- TypeScript strict mode required
- Follow the existing naming conventions
- Write unit tests for all services/utilities
- Write integration tests for all API endpoints
- Use Conventional Commits
- Run `npm run lint` before committing

## Git Workflow

1. Branch from `develop` for features
2. Use `feat/`, `fix/`, `refactor/` prefixes
3. Squash merge to `develop`
4. Release branches merge to `main`

## VS Code

Recommended extensions are in `.vscode/extensions.json`.

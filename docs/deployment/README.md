# Deployment

## Environments

| Environment | Frontend        | Backend          | Database         |
| ----------- | --------------- | ---------------- | ---------------- |
| Development | `localhost:5173` | `localhost:5000`  | Local SQL Server |
| Staging     | Vercel preview  | Azure App Service| Azure SQL        |
| Production  | Vercel          | Azure App Service| Azure SQL        |

## Frontend (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

Environment variables must be configured in Vercel project settings.

## Backend (Azure App Service)

```bash
cd backend
npm run build
az webapp deploy --resource-group toyshop --name toyshop-api --src-path dist
```

## Database (Azure SQL)

- Provision via Azure Portal or CLI
- Run migrations: `npm run db:migrate:prod`
- Connection string stored in Azure App Service configuration

## Docker (Local)

```bash
# Full stack
docker compose up

# Rebuild
docker compose build

# Clean
docker compose down -v
```

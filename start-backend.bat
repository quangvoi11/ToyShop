@echo off
cd /d D:\Projects\ToyShop\backend
set DATABASE_URL=sqlserver://localhost:1433;database=ToyShop;user=sa;password=YourPassword123;trustServerCertificate=true
echo Starting ToyShop Backend...
echo.
npx ts-node-dev -r tsconfig-paths/register --respawn --transpile-only src/server.ts
pause

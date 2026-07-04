@echo off
echo ========================================
echo   ToyShop - Khoi dong tat ca dich vu
echo ========================================
echo.

:: Kiem tra Docker
docker ps --filter name=toyshop-db --format "{{.Names}}" >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/3] Dang khoi dong SQL Server (Docker)...
    docker compose -f D:\Projects\ToyShop\docker-compose.yml up -d sqlserver
    timeout /t 10 /nobreak >nul
) else (
    echo [1/3] SQL Server da san sang.
)

:: Mo backend
echo.
echo [2/3] Dang mo Backend (port 5000)...
start "ToyShop Backend" cmd /c "cd /d D:\Projects\ToyShop\backend && set DATABASE_URL=sqlserver://localhost:1433;database=ToyShop;user=sa;password=YourPassword123;trustServerCertificate=true && npx ts-node src\server.ts"
timeout /t 5 /nobreak >nul

:: Mo frontend
echo [3/3] Dang mo Frontend (port 5173)...
start "ToyShop Frontend" cmd /c "cd /d D:\Projects\ToyShop\frontend && npx vite --host"

echo.
echo ========================================
echo   Mo trinh duyet: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ========================================
echo.
echo Dang nhap: admin@toyshop.com / Admin@123
echo.
pause

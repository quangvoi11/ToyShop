param(
    [switch]$SkipDocker,
    [switch]$SkipDb
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ToyShop - Project Setup"             -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Error "Node.js is not installed. Please install Node.js >= 20."
    exit 1
}
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# Check npm
$npmVersion = npm --version
Write-Host "npm:     $npmVersion" -ForegroundColor Green

# Copy .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
npm install

if (-not $SkipDb) {
    # Generate Prisma client
    Write-Host "`nGenerating Prisma client..." -ForegroundColor Cyan
    npm run db:generate -w @toyshop/backend

    # Run migrations
    Write-Host "`nRunning database migrations..." -ForegroundColor Cyan
    npm run db:migrate -w @toyshop/backend

    # Seed database
    Write-Host "`nSeeding database..." -ForegroundColor Cyan
    npm run db:seed -w @toyshop/backend
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup complete!"                      -ForegroundColor Green
Write-Host "  Run 'npm run dev' to start."          -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

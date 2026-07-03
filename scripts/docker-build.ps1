param(
    [ValidateSet("dev", "prod")]
    [string]$Environment = "dev"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ToyShop - Docker Build"               -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($Environment -eq "dev") {
    docker compose -f docker-compose.yml -f docker/docker-compose.override.yml build
} else {
    docker compose -f docker-compose.yml build
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker build successful." -ForegroundColor Green
} else {
    Write-Error "Docker build failed."
}

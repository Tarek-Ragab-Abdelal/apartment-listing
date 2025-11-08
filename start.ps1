# ========================================
# Nawy Apartment Listing - Quick Start Script (Windows)
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nawy Apartment Listing - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
try {
    $composeVersion = docker compose version
    Write-Host "Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker Compose is not available" -ForegroundColor Red
    Write-Host "Please ensure Docker Desktop is running" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "WARNING: .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Created .env file. Please review and update if needed." -ForegroundColor Green
    Write-Host ""
}

Write-Host "Starting Nawy Apartment Listing application..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Build Docker images" -ForegroundColor Gray
Write-Host "  2. Initialize PostgreSQL database" -ForegroundColor Gray
Write-Host "  3. Run database migrations" -ForegroundColor Gray
Write-Host "  4. Seed initial data" -ForegroundColor Gray
Write-Host "  5. Start API server with health checks" -ForegroundColor Gray
Write-Host "  6. Launch web application" -ForegroundColor Gray
Write-Host ""
Write-Host "Access points:" -ForegroundColor White
Write-Host "  - Web App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - API: http://localhost:4000" -ForegroundColor Cyan
Write-Host "  - API Docs: http://localhost:4000/docs" -ForegroundColor Cyan
Write-Host ""

# Start services
docker compose up --build

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Application stopped" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

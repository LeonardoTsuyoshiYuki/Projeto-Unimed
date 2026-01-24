Write-Host "Setting up Professional Credentialing System..."

# Check if Docker is running
docker-compose ps
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running or not found. Please start Docker Desktop." -ForegroundColor Red
    exit
}

# 1. Start Database
Write-Host "Starting Database..."
docker-compose up -d db
Start-Sleep -Seconds 10 # Wait for DB to be ready

# 2. Run Migrations (using local venv)
Write-Host "Running Migrations..."
cd backend
.\venv\Scripts\python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed. Check DB connection." -ForegroundColor Red
    cd ..
    exit
}

# 3. Create Superuser (interactive)
Write-Host "Creating Admin User (Follow prompts)..."
.\venv\Scripts\python manage.py createsuperuser

cd ..

# 4. Build and Start All Services
Write-Host "Starting All Services..."
docker-compose up -d --build

Write-Host "System is running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000"
Write-Host "Backend API: http://localhost:8000/api"
Write-Host "Admin Panel: http://localhost:8000/admin"

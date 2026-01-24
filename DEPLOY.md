# Deployment Guide

This guide describes how to deploy the Unimed project in a production environment using Docker Compose.

## Prerequisites
- Docker and Docker Compose installed
- Git

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/LeonardoTsuyoshiYuki/Projeto-Unimed.git
   cd Projeto-Unimed
   ```

2. **Create Environment File**
   Create a `.env.prod` file in the root directory. Use the template below:

   ```properties
   # .env.prod
   
   # Database
   POSTGRES_DB=unimed_prod_db
   POSTGRES_USER=unimed_prod_user
   POSTGRES_PASSWORD=strong_password_here
   POSTGRES_HOST=db
   POSTGRES_PORT=5432
   
   # Backend
   SECRET_KEY=generate_a_strong_random_secret_key_here
   ALLOWED_HOSTS=your-domain.com,localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://your-domain.com,http://localhost
   
   # Email (Optional - for real emails use SendGrid/AWS SES/etc)
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=apikey
   EMAIL_HOST_PASSWORD=your_api_key
   
   # Frontend (Build Time)
   VITE_API_URL=http://your-domain.com:8000/api
   ```

3. **Build and Run**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Run Migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
   ```

5. **Create Superuser**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   ```

## Architecture
- **Backend**: Gunicorn serving Django (Port 8000). Static files served via WhiteNoise.
- **Frontend**: Nginx serving React/Vite built files (Port 80).
- **Database**: PostgreSQL 15 (Persistent volume `postgres_prod_data`).

## Maintenance
- **Logs**: `docker-compose -f docker-compose.prod.yml logs -f`
- **Stop**: `docker-compose -f docker-compose.prod.yml down`
- **Backup DB**: `docker-compose -f docker-compose.prod.yml exec db pg_dump -U unimed_prod_user unimed_prod_db > backup.sql`

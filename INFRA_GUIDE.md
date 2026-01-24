# Infrastructure Guide

## Prerequisites
- Docker
- Docker Compose

## Setup

1. **Clone the repository** (if not already done).
2. **Environment Variables**:
   - Copy `.env.example` to `.env` (root level is fine for local dev orchestrator, but typically we put .env in backend/frontend. For this docker-compose, we are using inline environment variables for simplicity in Dev, but you can create a `.env` file in the `backend` folder).

3. **Build and Run**:
   ```bash
   docker-compose up --build
   ```

4. **Access Applications**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/api`
   - SQL Admin (via Docker Exec or external tool): Port `5432`

## Services
- **db**: PostgreSQL 15.
- **backend**: Django 5.x REST API.
- **frontend**: React + Vite.

## Data Persistence
- Database data is persisted in the `postgres_data` volume.

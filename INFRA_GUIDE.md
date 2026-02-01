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

## Deployment (Production)

### Render.com Configuration
This project uses **Vite 7**, which requires **Node.js 20.19.0+** or **22.12+**.

1. **Environment**:
   - Ensure the Build Environment is set to use Node 20.19.0.
   - The project includes an `.nvmrc` file (20.19.0) and `package.json` engines config (`>=20.19.0`) which Render should auto-detect.

2. **Build Command**:
   ```bash
   npm install && npm run build
   ```

3. **Publish Directory**:
   ```bash
   dist
   ```

### Troubleshooting
If the build fails with "Unsupported Node version", ensure your environment variables or platform settings are explicitly set to Node 20.

### Validation
To simulate the production build locally:
```bash
npm run build
npm run preview
```

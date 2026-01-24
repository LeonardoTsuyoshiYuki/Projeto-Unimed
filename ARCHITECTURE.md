# System Architecture

## Overview
The Unimed Credentialing System is a full-stack web application designed to manage professional registrations. It features a secure REST API backend, a responsive React frontend, and a PostgreSQL database, all containerized for easy deployment.

## Components

### 1. Frontend (Single Page Application)
- **Framework**: React 18 + TypeScript + Vite.
- **Styling**: CSS Modules (Vanilla CSS).
- **State Management**: React Hooks.
- **Routing**: React Router v6.
- **Key Components**:
  - `ProfessionalForm`: Dynamic multi-step form for public registration.
  - `Dashboard`: Admin analytics with Recharts and data tables.
  - `ErrorBoundary`: Global error handling catch-all.

### 2. Backend (REST API)
- **Framework**: Django 5 + Django REST Framework.
- **Authentication**: JWT (SimpleJWT).
- **Database**: PostgreSQL 15.
- **Key Apps**:
  - `professionals`: Core logic for registrations, documents, and status workflow.
  - `audit`: Logging of critical actions (created, approved, rejected).
  - `core`: System health checks and utilities.

### 3. Infrastructure
- **Docker**: Containerization for separate services (db, backend, frontend).
- **Nginx**: Serving frontend static assets and handling routing in production.
- **Gunicorn**: WSGI server for production backend.
- **WhiteNoise**: Serving backend static files.

## Data Flow
1. **Public Registration**: User submits form -> Backend validates (CPF uniqueness, 90-day rule) -> Creates PENDING record -> Sends Email.
2. **Admin Review**: Admin logs in -> Views Dashboard -> updates status (APPROVED/REJECTED) -> Audit Log created -> Email Notification sent.
3. **Observability**: Health checks (`/api/health/`), structured logging for business events, and frontend error boundaries ensure reliability.

## Security
- **Auth**: JWT for Admin endpoints. Public endpoints throttle-limited.
- **Validation**: Strict server-side validation + Audit trails for all status changes.
- **Environment**: Sensitive keys (SECRET_KEY, DB credentials) managed via `.env`.

# Unimed Professional Credentialing System

![Project Status](https://img.shields.io/badge/status-production--ready-green)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![Stack](https://img.shields.io/badge/stack-Django%20%7C%20React%20%7C%20Postgres-blue)

A full-stack enterprise application designed to streamline the credentialing process for healthcare professionals. Built with a focus on **reliability**, **compliance**, and **observability**.

---

## 🚀 Motivation
The credentialing process involves strict compliance checks, document verification, and audit trails. This system replaces manual workflows with a centralized, automated platform that ensures data integrity (e.g., LGPD compliance) and provides real-time analytics for administrators.

## ✨ Key Features

### For Professionals (Public)
- **Multi-step Registration**: Intuitive wizard for personal data and document upload.
- **Validation Engine**: Real-time CPF validation and duplicate submission prevention (90-day cooldown logic).
- **Transparency**: Automated email notifications at every stage of the process.

### For Administrators (Internal)
- **Analytics Dashboard**: Real-time metrics on registration volume, approval rates, and status distribution using **Recharts**.
- **Workflow Management**: One-click approval/rejection with mandatory audit logging.
- **Observability**: Integrated health checks and structured JSON logging for all business-critical events.

---

## 📸 Screenshots

| Admin Dashboard | Registration Flow |
|:---:|:---:|
| ![Dashboard Placeholder](https://placehold.co/600x400/e2e8f0/1e293b?text=Admin+Dashboard+Analytics) | ![Form Placeholder](https://placehold.co/600x400/e2e8f0/1e293b?text=Public+Registration+Steps) |

---

## 🏗️ Architecture

The system follows a containerized **Service-Oriented Architecture**:

- **Frontend**: Single Page Application (SPA) built with **React/TypeScript**. served via Nginx. 
- **Backend**: **Django REST Framework** API enforcing business logic and permissions.
- **Database**: **PostgreSQL** for relational data and transactional integrity.
- **Infrastructure**: Fully Dockerized with separate Development and Production environments.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a deep dive into data flow and component design.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12, Django 5, Pipenv, Gunicorn, WhiteNoise.
- **Frontend**: React 18, TypeScript, Vite, CSS Modules.
- **Data & Ops**: PostgreSQL 15, Docker Compose, Nginx.
- **Testing**: Pytest (100% backend coverage), React Testing Library.

---

## 🚦 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.12+ (for local backend dev)

### Quick Run (Production Mode)
Simulate the production environment locally:

```bash
# 1. Clone repository
git clone https://github.com/LeonardoTsuyoshiYuki/Projeto-Unimed.git

# 2. Setup Env
cp .env.prod.example .env.prod

# 3. Launch
docker-compose -f docker-compose.prod.yml up --build
```
Access the application at `http://localhost`.

### Development Mode
See [INFRA_GUIDE.md](./INFRA_GUIDE.md) for detailed development setup including hot-reloading.

---

## 💡 Interview Pitch / Technical Deep Dive

### 🔧 Key Challenges & Solutions

**1. Ensuring Data Integrity & Compliance**
*Challenge*: Preventing duplicate active requests while allowing re-application after rejection.
*Solution*: Implemented a robust 90-day cooldown logic at the model validation level. Used Django's atomic transactions to ensure that audit logs and status changes are always committed together, preventing "ghost" state changes.

**2. Production Reliability**
*Challenge*: Debugging issues in a decoupled frontend/backend system.
*Solution*: Implemented **Global Error Boundaries** in React to catch UI crashes gracefully. On the backend, migrated to **Structured JSON Logging** (`python-json-logger`) to make logs machine-readable for tools like Datadog/ELK, and added a specific `/api/health/` endpoint for uptime monitoring.

**3. Performance vs. UX**
*Challenge*: Dashboard queries becoming slow with large datasets.
*Solution*: Utilized Django's database aggregation functions (`Annotate`, `TruncMonth`) to offload calculation logic to PostgreSQL, ensuring the dashboard loads instantly even with thousands of records. Frontend implements a skeleton/loading state pattern (via a custom `Spinner` component) to give immediate visual feedback.

### 🔮 Future Improvements
- **Async Processing**: Offload email sending to a Celery worker queue (Redis) to improve response times.
- **Caching**: Implement Redis caching for the Dashboard aggregation endpoints (TTL 1 hour).
- **CI/CD**: Add GitHub Actions for automated running of the `pytest` suite on every PR.

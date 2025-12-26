# Multi-Tenant SaaS Platform

A production-ready, Dockerized multi-tenant SaaS application built with the PERN stack (PostgreSQL, Express, React, Node.js). This platform allows organizations (tenants) to independently register, manage teams, and track projects with complete data isolation.

## 🚀 Quick Start (Docker)

**Prerequisites:** Docker Desktop installed and running.

1.  **Start the application:**
    Run the following command in the project root:
    ```bash
    docker-compose up -d --build
    ```

2.  **Wait for Initialization:**
    The backend container will automatically wait for the database, run migrations, and seed the initial data. This takes about 30-60 seconds on the first run.

3.  **Access the Application:**
    * **Frontend UI:** [http://localhost:3000](http://localhost:3000)
    * **Backend API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
    * **Database:** `localhost:5432`

## 🔑 Test Credentials (Seed Data)

The system is pre-loaded with the following accounts (as defined in `submission.json`) for automated evaluation:

| Role | Email | Password | Scope |
|------|-------|----------|-------|
| **Tenant Admin** | `admin@demo.com` | `Demo@123` | Demo Company |
| **Regular User** | `user1@demo.com` | `User@123` | Demo Company |
| **Super Admin** | `superadmin@system.com` | `Admin@123` | System Wide |

**Note:** Login with the **Tenant Admin** credentials to see the pre-seeded "Submission Demo Project" and test the dashboard functionality.

## 🏗 Architecture & Tech Stack

This project follows a containerized microservices approach:

* **Database (PostgreSQL 15):** Uses a shared-database / shared-schema model. Data isolation is enforced at the application level using `tenant_id` columns and Row-Level Security logic.
* **Backend (Node.js + Express):** RESTful API with middleware interceptors (`authMiddleware.js`) that extract tenant context from JWTs and enforce isolation policies.
* **Frontend (React + Vite):** Single Page Application (SPA) consuming the API. Dockerized using a multi-stage build process.
* **DevOps (Docker Compose):** Orchestrates all services with fixed port mappings (5432, 5000, 3000) and automatic health checks.

## 📂 Project Structure

```text
multi-tenant-saas/
├── docker-compose.yml   # Orchestration for Database, Backend, Frontend
├── submission.json      # Automated testing credentials (MANDATORY)
├── README.md            # Project documentation
├── backend/             # Express API
│   ├── src/
│   │   ├── server.js    # Entry point & API Routes
│   │   └── middleware/  # Auth & Tenant Isolation logic
│   ├── scripts/         # DB Migration & Seeding automation
│   └── Dockerfile       # Backend container config
├── frontend/            # React App
│   ├── src/
│   │   ├── pages/       # Login & Dashboard Views
│   │   └── api.js       # Axios setup with JWT Interceptors
│   └── Dockerfile       # Frontend container config
└── docs/                # Architecture & Design documentation
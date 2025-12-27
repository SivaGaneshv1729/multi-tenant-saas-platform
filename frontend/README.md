# Multi-Tenant SaaS Platform

A production-ready, Dockerized Project & Task Management System supporting multiple organizations with strict data isolation, RBAC, and subscription limits.

## 🚀 Features
* **Multi-Tenancy:** Complete data isolation using Shared DB/Shared Schema architecture.
* **Authentication:** JWT-based stateless auth with Role-Based Access Control (RBAC).
* **Roles:** Super Admin, Tenant Admin, and Regular Users.
* **Subscription Limits:** Enforces User and Project limits based on plans (Free/Pro/Enterprise).
* **Workspaces:** Project creation, Task assignment, and status tracking (Todo/In Progress/Done).
* **My Tasks:** Personal dashboard for users to claim unassigned tasks.
* **Dockerized:** One-command setup for DB, Backend, and Frontend.

## 🛠 Technology Stack
* **Frontend:** React 18, Material UI (MUI), Axios.
* **Backend:** Node.js, Express.js.
* **Database:** PostgreSQL 15.
* **DevOps:** Docker, Docker Compose.

## 🏗 Architecture
The system uses a 3-tier architecture.
![Architecture Diagram](docs/images/system-architecture.png)
*(See `docs/architecture.md` for details)*

## ⚙️ Installation & Setup

1.  **Prerequisites:** Ensure Docker Desktop is running.
2.  **Start the App:**
    ```bash
    docker-compose up -d --build
    ```
3.  **Wait:** Allow ~30 seconds for the database to initialize and seed data.
4.  **Access:**
    * **Frontend:** [http://localhost:3000](http://localhost:3000)
    * **Backend:** [http://localhost:5000](http://localhost:5000)

## 🔑 Default Credentials (Seed Data)

**1. System Super Admin**
* Email: `super@admin.com`
* Password: `123456`

**2. Tenant Admin (Acme Corp)**
* Email: `admin@acme.com`
* Password: `123456`

**3. Regular User (Acme Corp)**
* Email: `dev@acme.com`
* Password: `123456`

## 📚 API Documentation
Full API documentation is available in `docs/architecture.md`.
Main endpoints include:
* `POST /api/auth/login`
* `GET /api/projects`
* `POST /api/projects/:id/tasks`
* `GET /api/my-tasks`

## 🧪 Environment Variables
(Defined in `docker-compose.yml`)
* `DATABASE_URL`: Postgres connection string.
* `JWT_SECRET`: Secret for token signing.
* `FRONTEND_URL`: URL for CORS policy.
# System Architecture

## High-Level Overview
The application follows a standard **3-Tier Architecture** containerized within Docker:

1.  **Presentation Layer (Frontend):**
    * React SPA running on Nginx/Node (Port 3000).
    * Communicates via REST API to the backend.
2.  **Application Layer (Backend):**
    * Express.js API (Port 5000).
    * Stateless authentication using JWT.
    * Handles business logic and tenant isolation.
3.  **Data Layer (Database):**
    * PostgreSQL 15 (Port 5432).
    * Persistent storage via Docker Volumes.

## Database Schema (ERD Description)

* **Tenants:** `id (PK), name, subdomain, plan`
* **Users:** `id (PK), tenant_id (FK), email, password, role`
* **Projects:** `id (PK), tenant_id (FK), name, status`
* **Tasks:** `id (PK), project_id (FK), tenant_id (FK), title, status`

*Constraint:* All tables (except Tenants) have a `tenant_id` Foreign Key to enforce ownership.

## API Endpoint Strategy
All endpoints follow the pattern `/api/resource`.
* **Public:** `/api/auth/login`, `/api/health`
* **Protected:** `/api/projects`, `/api/tasks` (Require `Bearer Token`)
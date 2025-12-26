# Research & Analysis

## Multi-Tenancy Approach Analysis

For this project, I evaluated three common multi-tenancy models to determine the best fit for a SaaS Project Management Platform.

### 1. Database per Tenant
* **Pros:** Ultimate data isolation, easy backup/restore per tenant.
* **Cons:** High infrastructure cost, difficult to maintain schema updates across thousands of DBs.
* **Verdict:** Overkill for this project scope.

### 2. Schema per Tenant (Shared Database)
* **Pros:** Good logical isolation, shared resources reduce cost.
* **Cons:** Complexity in migration management, potential connection pool limits.

### 3. Shared Schema (Discriminator Column) - **CHOSEN APPROACH**
* **Description:** All tenants share the same tables, distinguished by a `tenant_id` column.
* **Pros:** Lowest infrastructure cost, easiest to scale horizontally, simple schema management.
* **Cons:** Risk of data leakage if queries are poorly written.
* **Mitigation:** I implemented strict Middleware (`authMiddleware.js`) that extracts `tenantId` from the JWT and enforces it on every API call.

## Technology Stack Justification

* **Backend: Node.js & Express**
    * *Why:* Non-blocking I/O is ideal for real-time SaaS applications. The vast ecosystem allows for rapid implementation of JWT auth and middleware.
* **Frontend: React + Vite**
    * *Why:* Vite provides instant HMR (Hot Module Replacement) for fast development. React's component-based architecture suits the Dashboard/Widget UI of a project manager.
* **Database: PostgreSQL**
    * *Why:* Relational data integrity is critical for multi-tenant systems. Postgres offers robust Row-Level Security (RLS) features and ACID compliance.
* **Containerization: Docker**
    * *Why:* Mandatory for ensuring the "works on my machine" guarantee. It allows the database and app to spin up with a single command.
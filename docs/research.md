# Research & Requirements Analysis

## 1. Multi-Tenancy Analysis

For this SaaS platform, we evaluated three common multi-tenancy approaches:

| Approach | Description | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Shared Database, Shared Schema** | All tenants share the same tables. Rows are distinguished by a `tenant_id` column. | Lowest cost, easiest to maintain, easiest deployment, shared resources. | Strict code-level security required (RLS or WHERE clauses), "noisy neighbor" risk. |
| **Shared Database, Separate Schema** | One DB, but each tenant has their own schema (tables). | Better isolation, easier data backup per tenant. | Complex migration management, higher overhead. |
| **Database per Tenant** | Each tenant has their own physical database instance. | Highest security/isolation, no noisy neighbor. | Very expensive, complex infrastructure/maintenance. |

**Chosen Approach: Shared Database, Shared Schema**
We selected this approach because:
1.  **Development Speed:** It integrates seamlessly with ORMs and standard SQL queries using a simple `WHERE tenant_id = ?` clause.
2.  **Cost Efficiency:** Using a single PostgreSQL instance reduces infrastructure overhead, ideal for a startup SaaS.
3.  **Simplicity:** Managing migrations for one schema is significantly less error-prone than managing dynamic schemas for N tenants.

## 2. Technology Stack Justification

* **Backend: Node.js & Express**
    * *Why:* Non-blocking I/O is excellent for handling concurrent API requests in a multi-tenant environment. The ecosystem offers robust libraries (`jsonwebtoken`, `bcrypt`) for security.
* **Frontend: React**
    * *Why:* Component-based architecture allows for reusable UI elements (Task Cards, Tables). React Router handles protected routes and role-based views efficiently.
* **Database: PostgreSQL**
    * *Why:* A relational database is mandatory for structured data (Users -> Projects -> Tasks). Postgres offers ACID compliance and strong foreign key constraint support (`ON DELETE CASCADE`) which is vital for data integrity.
* **Containerization: Docker**
    * *Why:* Ensures the application runs identically in development and production (evaluation). It simplifies the setup of the DB, Backend, and Frontend into a single command.

## 3. Security Considerations

1.  **Data Isolation:** Every SQL query includes `WHERE tenant_id = $1` (derived from the JWT). This prevents cross-tenant data leaks.
2.  **Stateless Authentication:** We use **JWT (JSON Web Tokens)**. The token contains the `tenantId` and `role`. This avoids server-side session storage scalability issues.
3.  **Password Security:** All passwords are hashed using **bcrypt** before storage. We never store plain text.
4.  **Role-Based Access Control (RBAC):** Middleware checks `req.user.role` before allowing sensitive actions (e.g., deleting a project).
5.  **API Rate Limiting & Validation:** Inputs are validated on the backend to prevent injection attacks.
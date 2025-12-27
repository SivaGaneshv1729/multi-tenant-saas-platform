# Product Requirements Document (PRD)

## 1. User Personas

1.  **Super Admin**
    * **Role:** System Administrator.
    * **Goal:** Monitor system health and view all registered tenants.
    * **Pain Point:** Needs a high-level view of platform usage without logging into specific accounts.
2.  **Tenant Admin**
    * **Role:** Organization Manager.
    * **Goal:** Manage team members, create projects, and oversee task distribution.
    * **Pain Point:** Needs to control costs (subscription limits) and ensure data security.
3.  **End User (Employee)**
    * **Role:** Team Member (Developer/Designer).
    * **Goal:** View assigned tasks, update status, and track deadlines.
    * **Pain Point:** Overwhelmed by tasks not relevant to them; needs a clear "My Tasks" view.

## 2. Functional Requirements

**Authentication Module**
* **FR-001:** The system shall allow tenants to register with a unique subdomain.
* **FR-002:** The system shall authenticate users using email and password.
* **FR-003:** The system shall issue a JWT upon successful login valid for 24 hours.

**Tenant Management**
* **FR-004:** The system shall isolate data so users can only access their own tenant's data.
* **FR-005:** The system shall enforce subscription limits (Max Users/Projects) based on the plan.

**User Management**
* **FR-006:** Tenant Admins shall be able to invite new users to their tenant.
* **FR-007:** Tenant Admins shall be able to edit user roles and remove users.

**Project Management**
* **FR-008:** Tenant Admins shall be able to create, update, and delete projects.
* **FR-009:** Users shall be able to view projects assigned to their tenant.

**Task Management**
* **FR-010:** Tenant Admins shall be able to create tasks and assign them to users.
* **FR-011:** Users shall be able to view tasks assigned specifically to them.
* **FR-012:** Users shall be able to claim unassigned tasks from the pool.
* **FR-013:** Users shall be able to update task status (Todo -> In Progress -> Done).

**Audit & Logging**
* **FR-014:** The system shall log critical actions (Create/Delete) to an audit table.
* **FR-015:** Super Admins shall be able to view a list of all registered tenants.

## 3. Non-Functional Requirements

* **NFR-001 (Security):** All passwords must be salted and hashed using Bcrypt.
* **NFR-002 (Availability):** The system must start all services via a single `docker-compose up` command.
* **NFR-003 (Performance):** Database queries must utilize indexes on `tenant_id` for fast retrieval.
* **NFR-004 (Usability):** The frontend must be responsive and accessible on mobile devices.
* **NFR-005 (Scalability):** The backend must be stateless to allow for future horizontal scaling.
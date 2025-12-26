# Product Requirements Document (PRD)

## User Personas
1.  **Super Admin:** System owner. Can view all tenants and manage billing.
2.  **Tenant Admin:** Organization owner. Can manage their own users and projects.
3.  **Team Member:** Regular user. Can view projects and work on tasks.

## Functional Requirements
1.  **FR-001:** System shall allow Tenant Admins to login via email/password.
2.  **FR-002:** System shall isolate data so Tenant A cannot see Tenant B's projects.
3.  **FR-003:** System shall automatically seed demo data on first startup.
4.  **FR-004:** Backend shall verify JWT tokens on all protected routes.
5.  **FR-005:** Users shall be able to view a dashboard of their projects.

## Non-Functional Requirements
1.  **NFR-001 (Portability):** System MUST run via `docker-compose up`.
2.  **NFR-002 (Security):** Passwords MUST be hashed using bcrypt.
3.  **NFR-003 (Scalability):** Database schema MUST support 1000+ tenants.
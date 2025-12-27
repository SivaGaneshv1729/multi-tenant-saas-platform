# System Architecture

## 1. High-Level Architecture
The system follows a standard 3-tier architecture containerized via Docker.



* **Client:** React SPA (Single Page Application).
* **API Gateway/Server:** Node.js Express Server handling Auth, Logic, and DB connections.
* **Data Store:** PostgreSQL Database with relational tables.

## 2. Database Schema (ERD)
The database uses a shared schema design where `tenants` is the root table, and all other tables reference it.



**Key Relationships:**
* `Tenants` (1) --- (Many) `Users`
* `Tenants` (1) --- (Many) `Projects`
* `Projects` (1) --- (Many) `Tasks`
* `Users` (1) --- (Many) `Tasks` (Assigned To)

## 3. API Architecture
The API is RESTful, returning JSON responses in the format `{ success: boolean, data: any }`.

**Module: Authentication**
1.  `POST /api/auth/register-tenant` (Public)
2.  `POST /api/auth/login` (Public)
3.  `GET /api/auth/me` (Protected)

**Module: Tenants**
4.  `GET /api/tenants` (Super Admin)
5.  `GET /api/tenants/:id` (Admin)

**Module: Users**
6.  `POST /api/users` (Admin - Create User)
7.  `GET /api/users` (List Users)
8.  `PUT /api/users/:id` (Update Role)
9.  `DELETE /api/users/:id` (Remove User)

**Module: Projects**
10. `GET /api/projects` (List)
11. `POST /api/projects` (Create)
12. `PUT /api/projects/:id` (Update)
13. `DELETE /api/projects/:id` (Delete)

**Module: Tasks**
14. `GET /api/my-tasks` (Personal Board)
15. `POST /api/projects/:id/tasks` (Create)
16. `PATCH /api/tasks/:id/status` (Update Status)
17. `PATCH /api/tasks/:id/claim` (Claim Task)
18. `DELETE /api/tasks/:id` (Delete)
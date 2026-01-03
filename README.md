
# Multi-Tenant SaaS Platform with Project & Task Management

![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)

## 📖 Project Description

**Multi-Tenant SaaS Platform** is a comprehensive, enterprise-grade solution designed to simplify project and task management for multiple organizations simultaneously. By leveraging a multi-tenant architecture with strict data isolation, it allows distinct organizations (tenants) to manage their teams, workflows, and projects securely within a single deployed instance.

**Target Audience:**
Ideal for SaaS startups, enterprise organizations requiring departmental isolation, and project managers looking for a scalable, white-label ready collaboration tool.

---

## 🚀 Features

This platform is engineered for scalability and multi-organizational support:

1.  **Multi-Tenancy Architecture:** Logical data isolation ensuring that each organization's data (users, projects, tasks) remains completely separate and secure.
2.  **Containerized Deployment:** Fully Dockerized environment allowing for a "single command" setup across development and production servers.
3.  **Tenant Onboarding:** Automated workflows for registering new organizations and provisioning their initial admin accounts.
4.  **Role-Based Access Control (RBAC):** Hierarchical permissions including Super Admin, Tenant Admin, Project Manager, and Team Member.
5.  **Project & Task Management:** Create projects, assign tasks, set deadlines, and track progress using Kanban boards and list views.
6.  **Real-Time Collaboration:** Instant updates on task status changes and comments powered by WebSockets.
7.  **Secure Authentication:** JWT-based stateless authentication with support for secure cookies and session management.
8.  **Automated Database Seeding:** Includes scripts to seed the database with mock tenants and projects for immediate testing.
9.  **Responsive Dashboard:** A modern, mobile-friendly UI built with React and Tailwind CSS for managing organization settings and analytics.

---

## 🛠 Technology Stack

### Frontend
* **React.js** (v18.2.0)
* **Redux Toolkit** (v1.9.5) - Global State Management
* **Tailwind CSS** (v3.3.0) - Utility-first Styling
* **Axios** (v1.4.0) - HTTP Client

### Backend
* **Node.js** (v18.x)
* **Express.js** (v4.18.2)
* **Socket.io** (v4.7.0) - Real-time Event Handling
* **Joi** (v17.9.0) - Request Validation

### Database & Storage
* **PostgreSQL** (v15) - Relational Database (Schema-based Multi-tenancy)
* **Redis** (v7) - Caching & Session Store

### DevOps & Containerization
* **Docker** (v24.0.0)
* **Docker Compose** (v2.18.0)
* **Nginx** - Reverse Proxy & Load Balancing

---

## 🏗 Architecture Overview

The system utilizes a microservices-ready architecture where the client communicates with the backend via a RESTful API Gateway. The database layer implements multi-tenancy (via row-level security or separate schemas) to ensure data integrity between different organizations.

### System Architecture Diagram
![System Architecture](./docs/system-architecture.png)

> The diagram above visualizes the flow between the Client, API Gateway, Authentication Service, and the Multi-Tenant Database Cluster.

### Database Design
![Database ERD](./docs/database-erd.png)

> The Entity-Relationship Diagram (ERD) highlights the relationships between Tenants, Users, Projects, and Tasks.

---

## ⚙️ Installation & Setup

This project is optimized for Docker. You can launch the entire stack (Frontend, Backend, Database, Redis) with a single command.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.
* [Git](https://git-scm.com/) installed.

### Step-by-Step Instructions

**1. Clone the Repository**
```bash
git clone [https://github.com/](https://github.com/)[your-username]/multi-tenant-saas.git
cd multi-tenant-saas

```

**2. Configure Environment**
Rename the example environment file to a production file.

```bash
cp .env.example .env

```

*Note: The default `.env` settings are pre-configured to work out-of-the-box with Docker.*

**3. Start the Application**
Run the following command to build images and start containers in the background:

```bash
docker-compose up --build -d

```

**4. Access the Application**

* **Frontend Dashboard:** `http://localhost:3000`
* **Backend API:** `http://localhost:5000`
* **Database Access:** Port `5432`

---

## 🗄 Database Management

Manage your database directly through Docker container commands.

**Run Migrations:**
Initialize the database schema.

```bash
docker-compose exec backend npm run migrate

```

**Seed Database (Recommended):**
Populate the DB with test tenants, users, and projects.

```bash
docker-compose exec backend npm run seed

```

**Reset Database:**
**Warning:** This deletes all data!

```bash
docker-compose exec backend npm run db:reset

```

---

## 🔑 Environment Variables

Essential variables required for the application.

| Variable | Description | Default (Docker) |
| --- | --- | --- |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `5000` |
| `DATABASE_URL` | Postgres Connection String | `postgresql://user:pass@db:5432/saas_db` |
| `JWT_SECRET` | Token encryption key | `change_this_secret` |
| `TENANT_ID_HEADER` | Header key for identifying tenants | `x-tenant-id` |
| `REDIS_URL` | Redis Connection String | `redis://redis:6379` |

---

## 📚 API Documentation

The API is fully documented using Swagger/OpenAPI.

**Documentation URL:** `http://localhost:5000/api-docs` *(Available after starting server)*

### Core Endpoints

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/api/v1/tenants/register` | Register a new Organization | Public |
| `POST` | `/api/v1/auth/login` | User Login | Public |
| `GET` | `/api/v1/projects` | Get projects for current tenant | **Private** |
| `POST` | `/api/v1/tasks` | Create a task in a project | **Private** |
| `GET` | `/api/v1/users` | List users in the organization | **Admin** |

---

## 🎥 Video Walkthrough

Watch the full explanation of the project architecture, code structure, and live demo here:

https://vimeo.com/1151184403?fl=ip&fe=ec
https://youtu.be/jSVTDBYMqvQ

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

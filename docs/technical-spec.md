# Technical Specification

## 1. Project Structure

```text
multi-tenant-saas/
├── docker-compose.yml       # Orchestration
├── README.md                # Entry point docs
├── submission.json          # Credentials for evaluation
├── docs/                    # Documentation artifacts
├── database/
│   └── init-db.js           # Automated Seeding & Migration script
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js        # Main Application Logic
│       └── middleware/
│           └── authMiddleware.js
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.jsx          # Routing & Layout
        ├── api.js           # Axios Configuration
        ├── pages/           # React Views (Dashboard, Projects, etc.)
        └── components/      # Reusable UI (Sidebar, Layout)
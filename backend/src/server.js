const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import Security Middleware & Seeder
const { authenticateToken } = require('./middleware/authMiddleware');
const initDB = require('../scripts/init-db');

const app = express();

// --- CONFIGURATION ---
app.use(express.json()); // Parse JSON bodies
app.use(cors());         // Allow Frontend access

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

// ==========================================
// 1. HEALTH CHECK (Mandatory)
// ==========================================
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1'); // Test DB connection
        res.json({ status: "ok", database: "connected" });
    } catch (err) {
        res.status(500).json({ status: "error", database: "disconnected" });
    }
});

// ==========================================
// 2. AUTHENTICATION ROUTES
// ==========================================

// Login (Public)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ success: false, message: "Invalid password" });

        // Generate JWT (Payload: userId, tenantId, role)
        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Register Tenant (Public) - Uses Transaction
app.post('/api/auth/register-tenant', async (req, res) => {
    const { tenantName, subdomain, email, password, fullName } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Start Transaction

        // A. Create Tenant
        const tenantRes = await client.query(
            'INSERT INTO tenants (name, subdomain, status, subscription_plan) VALUES ($1, $2, $3, $4) RETURNING id',
            [tenantName, subdomain, 'active', 'free']
        );
        const tenantId = tenantRes.rows[0].id;

        // B. Create Admin User
        const hashedPassword = await bcrypt.hash(password, 10);
        await client.query(
            'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5)',
            [tenantId, email, hashedPassword, fullName, 'tenant_admin']
        );

        await client.query('COMMIT'); // Commit Transaction
        res.status(201).json({ success: true, message: "Tenant registered successfully" });

    } catch (err) {
        await client.query('ROLLBACK'); // Rollback on error
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
});

// Get Current User (Protected)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    res.json({ success: true, data: req.user });
});

// ==========================================
// 3. PROJECT ROUTES (Tenant Isolated)
// ==========================================

// List Projects
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        // ISOLATION: Filter by tenant_id from Token
        const result = await pool.query(
            'SELECT * FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC',
            [req.user.tenantId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create Project
app.post('/api/projects', authenticateToken, async (req, res) => {
    const { name, description } = req.body;
    try {
        // 1. Check Subscription Limit (Optional but recommended)
        const countRes = await pool.query('SELECT count(*) FROM projects WHERE tenant_id = $1', [req.user.tenantId]);
        if (parseInt(countRes.rows[0].count) >= 15) { // Assuming Pro Plan limit
            return res.status(403).json({ success: false, message: "Project limit reached" });
        }

        // 2. Create Project
        const result = await pool.query(
            'INSERT INTO projects (tenant_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.tenantId, name, description, req.user.userId]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 4. TASK ROUTES (Tenant & Project Isolated)
// ==========================================

// List Tasks for a Project
app.get('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        // SECURITY: Ensure Project belongs to Tenant
        const projectCheck = await pool.query(
            'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
            [projectId, req.user.tenantId]
        );
        if (projectCheck.rows.length === 0) return res.status(404).json({ success: false, message: "Project not found" });

        const result = await pool.query(
            'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
            [projectId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create Task
app.post('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    const { title, status, priority } = req.body;
    const { projectId } = req.params;
    try {
        // SECURITY: Ensure Project belongs to Tenant
        const projectCheck = await pool.query(
            'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
            [projectId, req.user.tenantId]
        );
        if (projectCheck.rows.length === 0) return res.status(403).json({ success: false, message: "Access Denied" });

        const result = await pool.query(
            'INSERT INTO tasks (project_id, tenant_id, title, status, priority) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [projectId, req.user.tenantId, title, status || 'todo', priority || 'medium']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 5. USER MANAGEMENT (Tenant Admin Only)
// ==========================================

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, role, is_active FROM users WHERE tenant_id = $1',
            [req.user.tenantId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'tenant_admin') {
        return res.status(403).json({ success: false, message: "Only Admins can add users" });
    }

    const { email, password, fullName, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
            [req.user.tenantId, email, hashedPassword, fullName, role || 'user']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// START SERVER & INIT DB
// ==========================================
const PORT = process.env.PORT || 5000;

// Initialize Database then Start Server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});
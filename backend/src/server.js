const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./middleware/authMiddleware');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- HEALTH CHECK ---
app.get('/api/health', async (req, res) => {
    res.json({ status: "ok", database: "connected" });
});

// --- AUTH ROUTES ---

// 1. LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Find user by email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ success: false, message: "Invalid password" });

        // Generate JWT with tenantId
        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ success: true, data: { token, user: { email: user.email, role: user.role } } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- PROJECT ROUTES (The Multi-Tenant Logic) ---

// 2. CREATE PROJECT
app.post('/api/projects', authenticateToken, async (req, res) => {
    const { name, description } = req.body;
    try {
        // AUTOMATIC ISOLATION: We use the tenantId from the token, NOT from the user input
        const result = await pool.query(
            'INSERT INTO projects (tenant_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.tenantId, name, description, req.user.userId]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. GET PROJECTS
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        let query;
        let params;

        // Super Admin sees all, Tenant Admin/User sees only their own
        if (req.user.role === 'super_admin') {
            query = 'SELECT * FROM projects';
            params = [];
        } else {
            // CRITICAL: WHERE tenant_id = ?
            query = 'SELECT * FROM projects WHERE tenant_id = $1';
            params = [req.user.tenantId];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- TASK ROUTES ---

// 4. GET TASKS (Filtered by Project AND Tenant)
app.get('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        // SECURITY: Ensure the Project actually belongs to this Tenant
        const projectCheck = await pool.query(
            'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
            [projectId, req.user.tenantId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // Fetch Tasks
        // Note: We don't strictly need tenant_id here if project_id is safe, but it's good practice.
        const result = await pool.query(
            'SELECT * FROM tasks WHERE project_id = $1',
            [projectId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. CREATE TASK
app.post('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    const { title, status } = req.body;
    const { projectId } = req.params;
    try {
        // SECURITY: Ensure the Project belongs to this Tenant
        const projectCheck = await pool.query(
            'SELECT id FROM projects WHERE id = $1 AND tenant_id = $2',
            [projectId, req.user.tenantId]
        );

        if (projectCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Access Denied to Project" });
        }

        // Create Task (Auto-inject tenant_id for easier querying later)
        const result = await pool.query(
            'INSERT INTO tasks (project_id, tenant_id, title, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [projectId, req.user.tenantId, title, status || 'todo']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
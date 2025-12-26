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

// --- AUTH & REGISTRATION ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ success: false, message: "Invalid password" });

        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ success: true, data: { token, user: { email: user.email, role: user.role, tenantId: user.tenant_id } } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/auth/register-tenant', async (req, res) => {
    const { tenantName, subdomain, email, password, fullName } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const tenantRes = await client.query(
            'INSERT INTO tenants (name, subdomain, status, subscription_plan) VALUES ($1, $2, $3, $4) RETURNING id',
            [tenantName, subdomain, 'active', 'free']
        );
        const tenantId = tenantRes.rows[0].id;
        const hashedPassword = await bcrypt.hash(password, 10);
        await client.query(
            'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5)',
            [tenantId, email, hashedPassword, fullName, 'tenant_admin']
        );
        await client.query('COMMIT');
        res.status(201).json({ success: true, message: "Tenant registered" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: err.message });
    } finally { client.release(); }
});

// --- PROJECT ROUTES ---
app.post('/api/projects', authenticateToken, async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO projects (tenant_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.tenantId, name, description, req.user.userId]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const query = req.user.role === 'super_admin' ? 'SELECT * FROM projects' : 'SELECT * FROM projects WHERE tenant_id = $1';
        const params = req.user.role === 'super_admin' ? [] : [req.user.tenantId];
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// --- TASK ROUTES ---
app.get('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        // Security check: Project must belong to tenant
        const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, req.user.tenantId]);
        if (projectCheck.rows.length === 0) return res.status(404).json({ success: false, message: "Project not found" });

        const result = await pool.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    const { title, status } = req.body;
    const { projectId } = req.params;
    try {
        const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [projectId, req.user.tenantId]);
        if (projectCheck.rows.length === 0) return res.status(403).json({ success: false, message: "Access Denied" });

        const result = await pool.query(
            'INSERT INTO tasks (project_id, tenant_id, title, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [projectId, req.user.tenantId, title, status || 'todo']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// --- USER MANAGEMENT ROUTES ---
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        // Only return users for THIS tenant
        const result = await pool.query('SELECT id, email, full_name, role FROM users WHERE tenant_id = $1', [req.user.tenantId]);
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    // Only Tenant Admin can add users
    if (req.user.role !== 'tenant_admin') return res.status(403).json({ success: false, message: "Only Admins can add users" });

    const { email, password, fullName, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name',
            [req.user.tenantId, email, hashedPassword, fullName, role || 'user']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// --- ROBUST DATABASE IMPORT ---
// This safely handles the import whether init-db.js exports a function or an object
const initDBModule = require('../scripts/init-db');
const initDB = typeof initDBModule === 'function' ? initDBModule : initDBModule.initDB;

const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use(cors());

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

// --- HELPER: AUDIT LOGGING ---
const logAudit = async (tenantId, userId, action, entityType, entityId, ip) => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
            [tenantId, userId, action, entityType, entityId, ip]
        );
    } catch (err) {
        console.error("Audit Log Failed:", err.message);
    }
};

// ==========================================
// 1. HEALTH CHECK
// ==========================================
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: "ok", database: "connected" });
    } catch (err) {
        res.status(500).json({ status: "error", database: "disconnected" });
    }
});

// ==========================================
// 2. AUTHENTICATION MODULE
// ==========================================

// API 1: Register Tenant (Transaction)
app.post('/api/auth/register-tenant', async (req, res) => {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check constraints
        const subCheck = await client.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
        if (subCheck.rows.length > 0) throw new Error("Subdomain already exists");

        const tenantRes = await client.query(
            'INSERT INTO tenants (name, subdomain, status, subscription_plan) VALUES ($1, $2, $3, $4) RETURNING id',
            [tenantName, subdomain, 'active', 'free']
        );
        const tenantId = tenantRes.rows[0].id;

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await client.query(
            'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5)',
            [tenantId, adminEmail, hashedPassword, adminFullName, 'tenant_admin']
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: "Tenant registered successfully" });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(409).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
});

// API 2: Login 
app.post('/api/auth/login', async (req, res) => {
    const { email, password, subdomain } = req.body; // Subdomain is now expected

    try {
        let user;

        // SCENARIO 1: Super Admin Login (No subdomain or "system" subdomain)
        if (!subdomain || subdomain === 'system') {
            const saResult = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, 'super_admin']);
            user = saResult.rows[0];
        }
        // SCENARIO 2: Tenant User Login (Must have valid subdomain)
        else {
            // 1. Find Tenant ID from Subdomain
            const tenantRes = await pool.query('SELECT id FROM tenants WHERE subdomain = $1', [subdomain]);
            if (tenantRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: "Tenant/Subdomain not found" });
            }
            const tenantId = tenantRes.rows[0].id;

            // 2. Find User in that specific Tenant
            const userRes = await pool.query('SELECT * FROM users WHERE email = $1 AND tenant_id = $2', [email, tenantId]);
            user = userRes.rows[0];
        }

        // Common Validation
        if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ success: false, message: "Invalid credentials" });

        // Generate Token
        const token = jwt.sign(
            { userId: user.id, tenantId: user.tenant_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logAudit(user.tenant_id, user.id, 'LOGIN', 'auth', user.id, req.ip);

        res.json({
            success: true,
            data: {
                token,
                user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id, fullName: user.full_name }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 3: Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    res.json({ success: true, data: req.user });
});

// API 4: Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    logAudit(req.user.tenantId, req.user.userId, 'LOGOUT', 'auth', req.user.userId, req.ip);
    res.json({ success: true, message: "Logged out successfully" });
});

// ==========================================
// 3. TENANT MANAGEMENT MODULE
// ==========================================

// API 5: Get Tenant Details
app.get('/api/tenants/:tenantId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin' && req.user.tenantId !== req.params.tenantId) {
        return res.status(403).json({ success: false, message: "Access Denied" });
    }
    try {
        const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [req.params.tenantId]);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 6: Update Tenant
app.put('/api/tenants/:tenantId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'tenant_admin') return res.status(403).json({ message: "Forbidden" });
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== req.params.tenantId) return res.status(403).json({ message: "Forbidden" });

    const { name } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tenants SET name = $1 WHERE id = $2 RETURNING *',
            [name, req.params.tenantId]
        );
        logAudit(req.params.tenantId, req.user.userId, 'UPDATE_TENANT', 'tenant', req.params.tenantId, req.ip);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 7: List All Tenants (Super Admin Only)
app.get('/api/tenants', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ success: false, message: "Super Admin Only" });
    try {
        const result = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
        res.json({ success: true, data: { tenants: result.rows } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 4. USER MANAGEMENT MODULE
// ==========================================

// API 8: Add User (With Subscription Check)
app.post('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'tenant_admin') return res.status(403).json({ success: false, message: "Admins Only" });

    const { email, password, fullName, role } = req.body;
    try {
        // 1. Check Subscription Limits
        const tenant = await pool.query('SELECT max_users FROM tenants WHERE id = $1', [req.user.tenantId]);
        const userCount = await pool.query('SELECT count(*) FROM users WHERE tenant_id = $1', [req.user.tenantId]);

        if (parseInt(userCount.rows[0].count) >= tenant.rows[0].max_users) {
            return res.status(403).json({ success: false, message: "Subscription limit reached (Max Users)" });
        }

        // 2. Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role',
            [req.user.tenantId, email, hashedPassword, fullName, role || 'user']
        );

        logAudit(req.user.tenantId, req.user.userId, 'CREATE_USER', 'user', result.rows[0].id, req.ip);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 9: List Users
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, role FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
            [req.user.tenantId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 10: Update User
app.put('/api/users/:userId', authenticateToken, async (req, res) => {
    // Only allow admin or self
    if (req.user.role !== 'tenant_admin' && req.user.userId !== req.params.userId) return res.status(403).json({ message: "Forbidden" });

    const { fullName, role } = req.body;
    try {
        // Only Admin can change role
        const newRole = req.user.role === 'tenant_admin' ? role : undefined;

        const result = await pool.query(
            'UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role) WHERE id = $3 AND tenant_id = $4 RETURNING id, full_name, role',
            [fullName, newRole, req.params.userId, req.user.tenantId]
        );
        logAudit(req.user.tenantId, req.user.userId, 'UPDATE_USER', 'user', req.params.userId, req.ip);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 11: Delete User
app.delete('/api/users/:userId', authenticateToken, async (req, res) => {
    if (req.user.role !== 'tenant_admin') return res.status(403).json({ message: "Admins only" });

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.userId, req.user.tenantId]);
        if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });

        logAudit(req.user.tenantId, req.user.userId, 'DELETE_USER', 'user', req.params.userId, req.ip);
        res.json({ success: true, message: "User deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 5. PROJECT MANAGEMENT MODULE
// ==========================================

// API 12: Create Project (With Subscription Check)
app.post('/api/projects', authenticateToken, async (req, res) => {
    const { name, description } = req.body;
    try {
        // 1. Check Subscription Limits
        const tenant = await pool.query('SELECT max_projects FROM tenants WHERE id = $1', [req.user.tenantId]);
        const projCount = await pool.query('SELECT count(*) FROM projects WHERE tenant_id = $1', [req.user.tenantId]);

        if (parseInt(projCount.rows[0].count) >= tenant.rows[0].max_projects) {
            return res.status(403).json({ success: false, message: "Project limit reached. Upgrade plan." });
        }

        // 2. Create Project
        const result = await pool.query(
            'INSERT INTO projects (tenant_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.tenantId, name, description, req.user.userId]
        );
        logAudit(req.user.tenantId, req.user.userId, 'CREATE_PROJECT', 'project', result.rows[0].id, req.ip);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 13: List Projects
app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC',
            [req.user.tenantId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 14: Update Project
app.put('/api/projects/:projectId', authenticateToken, async (req, res) => {
    const { name, description, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status) WHERE id = $4 AND tenant_id = $5 RETURNING *',
            [name, description, status, req.params.projectId, req.user.tenantId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Project not found" });

        logAudit(req.user.tenantId, req.user.userId, 'UPDATE_PROJECT', 'project', req.params.projectId, req.ip);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 15: Delete Project
app.delete('/api/projects/:projectId', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.projectId, req.user.tenantId]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Project not found" });

        logAudit(req.user.tenantId, req.user.userId, 'DELETE_PROJECT', 'project', req.params.projectId, req.ip);
        res.json({ success: true, message: "Project deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 6. TASK MANAGEMENT MODULE
// ==========================================

// API 16: Create Task (With Assignment)
app.post('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    const { title, status, priority, description, dueDate, assignedTo } = req.body;
    try {
        const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [req.params.projectId, req.user.tenantId]);
        if (projectCheck.rows.length === 0) return res.status(403).json({ success: false, message: "Access Denied" });

        const assignee = (assignedTo && assignedTo !== '') ? assignedTo : null;

        const result = await pool.query(
            'INSERT INTO tasks (project_id, tenant_id, title, status, priority, description, due_date, assigned_to) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [req.params.projectId, req.user.tenantId, title, status || 'todo', priority || 'medium', description, dueDate, assignee]
        );
        logAudit(req.user.tenantId, req.user.userId, 'CREATE_TASK', 'task', result.rows[0].id, req.ip);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 17: List Project Tasks
app.get('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
    try {
        const projectCheck = await pool.query('SELECT id FROM projects WHERE id = $1 AND tenant_id = $2', [req.params.projectId, req.user.tenantId]);
        if (projectCheck.rows.length === 0) return res.status(404).json({ success: false, message: "Project not found" });

        const result = await pool.query(
            'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
            [req.params.projectId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 18: Update Task Status
app.patch('/api/tasks/:taskId/status', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
            [status, req.params.taskId, req.user.tenantId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Task not found" });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 19: Update Task Details
app.put('/api/tasks/:taskId', authenticateToken, async (req, res) => {
    const { title, description, priority, dueDate } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), priority = COALESCE($3, priority), due_date = COALESCE($4, due_date) WHERE id = $5 AND tenant_id = $6 RETURNING *',
            [title, description, priority, dueDate, req.params.taskId, req.user.tenantId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Task not found" });

        logAudit(req.user.tenantId, req.user.userId, 'UPDATE_TASK', 'task', req.params.taskId, req.ip);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 7. PERSONAL TASK BOARD
// ==========================================

// API 20: Get "My Tasks" and "Open Tasks"
app.get('/api/my-tasks', authenticateToken, async (req, res) => {
    try {
        // Fetch tasks assigned to current user OR unassigned (NULL) in their tenant
        const result = await pool.query(
            `SELECT t.*, p.name as project_name 
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.tenant_id = $1 
       AND (t.assigned_to = $2 OR t.assigned_to IS NULL)
       ORDER BY t.priority DESC, t.due_date ASC`,
            [req.user.tenantId, req.user.userId]
        );

        const myTasks = result.rows.filter(t => t.assigned_to === req.user.userId);
        const openTasks = result.rows.filter(t => t.assigned_to === null);

        res.json({ success: true, data: { myTasks, openTasks } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 21: Claim an Open Task
app.patch('/api/tasks/:taskId/claim', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE tasks 
       SET assigned_to = $1 
       WHERE id = $2 AND tenant_id = $3 AND assigned_to IS NULL 
       RETURNING *`,
            [req.user.userId, req.params.taskId, req.user.tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: "Task not found or already assigned" });
        }

        logAudit(req.user.tenantId, req.user.userId, 'CLAIM_TASK', 'task', req.params.taskId, req.ip);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 8. DASHBOARD STATS (DYNAMIC)
// ==========================================

// API 22: Get Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const { tenantId, role, userId } = req.user;

        // 1. Super Admin Stats (System View)
        if (role === 'super_admin') {
            const tenants = await pool.query('SELECT count(*) FROM tenants');
            return res.json({
                success: true,
                data: {
                    totalProjects: 0, totalUsers: 0,
                    tasks: { total: 0, todo: 0, in_progress: 0, completed: 0 },
                    tenants: parseInt(tenants.rows[0].count)
                }
            });
        }

        // 2. Define Query Conditions based on Role
        // Admin = All tasks in tenant. User = Only their assigned tasks.
        let taskQuery = 'SELECT status, COUNT(*) as count FROM tasks WHERE tenant_id = $1';
        let taskParams = [tenantId];

        if (role === 'user') {
            taskQuery += ' AND assigned_to = $2';
            taskParams.push(userId);
        }

        taskQuery += ' GROUP BY status';

        const projectCount = await pool.query('SELECT count(*) FROM projects WHERE tenant_id = $1', [tenantId]);
        const userCount = await pool.query('SELECT count(*) FROM users WHERE tenant_id = $1', [tenantId]);
        const taskStats = await pool.query(taskQuery, taskParams);

        const tasks = { total: 0, todo: 0, in_progress: 0, completed: 0 };
        taskStats.rows.forEach(row => {
            tasks[row.status] = parseInt(row.count);
            tasks.total += parseInt(row.count);
        });

        res.json({
            success: true,
            data: {
                totalProjects: parseInt(projectCount.rows[0].count),
                totalUsers: parseInt(userCount.rows[0].count),
                tasks: tasks
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API 23: Delete Task
app.delete('/api/tasks/:taskId', authenticateToken, async (req, res) => {
    try {
        // Only Admin or the Assignee can delete a task
        const taskCheck = await pool.query('SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2', [req.params.taskId, req.user.tenantId]);
        if (taskCheck.rows.length === 0) return res.status(404).json({ message: "Task not found" });

        const task = taskCheck.rows[0];
        if (req.user.role !== 'tenant_admin' && task.assigned_to !== req.user.userId) {
            return res.status(403).json({ message: "You can only delete your own tasks" });
        }

        await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.taskId]);

        logAudit(req.user.tenantId, req.user.userId, 'DELETE_TASK', 'task', req.params.taskId, req.ip);
        res.json({ success: true, message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// ==========================================
// SERVER START
// ==========================================
const PORT = process.env.PORT || 5000;

if (initDB) {
    initDB().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    });
} else {
    console.error("WARNING: Starting server without DB Init due to module error.");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Create a separate pool for initialization
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

async function initDB() {
    const client = await pool.connect();

    try {
        console.log("🔄 Starting Database Initialization...");

        // =========================================================
        // 1. MIGRATIONS: Create Tables (Schema)
        // =========================================================
        console.log("🛠  Verifying Schema...");

        await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        subscription_plan VARCHAR(50) DEFAULT 'free',
        max_users INTEGER DEFAULT 5,
        max_projects INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
      );

      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo',
        priority VARCHAR(50) DEFAULT 'medium',
        assigned_to UUID REFERENCES users(id),
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(255),
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // =========================================================
        // 2. SEEDING: Insert Data (If DB is empty)
        // =========================================================
        const userCheck = await client.query('SELECT count(*) FROM users');
        if (parseInt(userCheck.rows[0].count) > 0) {
            console.log("✅ Database already has data. Skipping seed.");
            return;
        }

        console.log("🌱 Database empty. Seeding submission data...");

        // --- Hash Passwords ---
        const superAdminPass = await bcrypt.hash('Admin@123', 10);
        const demoAdminPass = await bcrypt.hash('Demo@123', 10);
        const userPass = await bcrypt.hash('User@123', 10);

        // --- A. Create Super Admin (Tenant ID is NULL) ---
        await client.query(`
      INSERT INTO users (email, password_hash, full_name, role, tenant_id)
      VALUES ($1, $2, $3, 'super_admin', NULL)
    `, ['superadmin@system.com', superAdminPass, 'System Owner']);
        console.log("   > Super Admin created");

        // --- B. Create Tenant (Demo Company) ---
        const tenantRes = await client.query(`
      INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
      VALUES ($1, $2, 'active', 'pro', 25, 15)
      RETURNING id
    `, ['Demo Company', 'demo']);
        const tenantId = tenantRes.rows[0].id;
        console.log(`   > Tenant 'Demo Company' created (ID: ${tenantId})`);

        // --- C. Create Tenant Admin ---
        const adminRes = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, 'tenant_admin')
      RETURNING id
    `, [tenantId, 'admin@demo.com', demoAdminPass, 'Demo Admin']);
        const adminId = adminRes.rows[0].id;
        console.log("   > Tenant Admin created");

        // --- D. Create Regular Users ---
        await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES 
      ($1, 'user1@demo.com', $2, 'User One', 'user'),
      ($1, 'user2@demo.com', $2, 'User Two', 'user')
    `, [tenantId, userPass]);
        console.log("   > Regular Users created");

        // --- E. Create Projects ---
        const projRes = await client.query(`
      INSERT INTO projects (tenant_id, name, description, created_by)
      VALUES 
      ($1, 'Project Alpha', 'First demo project', $2),
      ($1, 'Project Beta', 'Second demo project', $2)
      RETURNING id, name
    `, [tenantId, adminId]);
        console.log("   > Projects created");

        // --- F. Create Tasks (Linked to Project Alpha) ---
        const projectAlphaId = projRes.rows.find(p => p.name === 'Project Alpha').id;
        await client.query(`
      INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, due_date)
      VALUES 
      ($1, $2, 'Setup Infrastructure', 'Configure Docker and DB', 'completed', 'high', NOW()),
      ($1, $2, 'Develop API', 'Implement 19 endpoints', 'in_progress', 'high', NOW() + INTERVAL '2 days')
    `, [projectAlphaId, tenantId]);
        console.log("   > Tasks created");

        console.log("✅ Seeding Complete!");

    } catch (err) {
        console.error("❌ Database Initialization Failed:", err);
        process.exit(1);
    } finally {
        client.release();
    }
}

// Check if running directly (node init-db.js) or imported
if (require.main === module) {
    initDB().then(() => process.exit(0));
} else {
    module.exports = initDB;
}
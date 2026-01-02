const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    console.log("🔥 WIPING DATABASE & STARTING FRESH...");

    // 1. DROP EXISTING TABLES
    await client.query(`
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS tenants CASCADE;
    `);

    // 2. CREATE TABLES
    await client.query(`
      CREATE TABLE tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        subscription_plan VARCHAR(50) DEFAULT 'free',
        max_users INTEGER DEFAULT 5,
        max_projects INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'user')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, email)
      );

      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo',
        priority VARCHAR(50) DEFAULT 'medium',
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50),
        entity_id UUID,
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Schema Created.");

    // 3. SEED DATA

    // --- A. Super Admin ---
    const superPass = await bcrypt.hash('superadmin123', 10);
    await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role) 
      VALUES (NULL, 'super@admin.com', $1, 'Super Admin', 'super_admin')
    `, [superPass]);

    // --- B. Tenant 1: Partnr (Pro) ---
    const partnrRes = await client.query(`
      INSERT INTO tenants (name, subdomain, subscription_plan, max_users, max_projects)
      VALUES ('Partnr', 'partnr', 'pro', 25, 15) RETURNING id
    `);
    const partnrId = partnrRes.rows[0].id;

    // Partnr Admin
    const adminPass = await bcrypt.hash('admin123', 10);
    const partnrAdminRes = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, 'admin@gmail.com', $2, 'Partnr Admin', 'tenant_admin') RETURNING id
    `, [partnrId, adminPass]);

    // Partnr User
    const userPass = await bcrypt.hash('user123', 10);
    const partnrUserRes = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, 'user.partnr@gmail.com', $2, 'Partnr User', 'user') RETURNING id
    `, [partnrId, userPass]);

    // Partnr Project & Task
    const partnrProj = await client.query(`
      INSERT INTO projects (tenant_id, name, description, created_by)
      VALUES ($1, 'Partnr Launch', 'Initial setup project', $2) RETURNING id
    `, [partnrId, partnrAdminRes.rows[0].id]);

    await client.query(`
      INSERT INTO tasks (project_id, tenant_id, title, status, priority, assigned_to)
      VALUES ($1, $2, 'Setup Infrastructure', 'in_progress', 'high', $3)
    `, [partnrProj.rows[0].id, partnrId, partnrUserRes.rows[0].id]);


    // --- C. Tenant 2: Stark Industries (Free) ---
    const starkRes = await client.query(`
      INSERT INTO tenants (name, subdomain, subscription_plan, max_users, max_projects)
      VALUES ('Stark Industries', 'stark', 'free', 5, 3) RETURNING id
    `);
    const starkId = starkRes.rows[0].id;

    // Stark Admin
    await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, 'stark@gmail.com', $2, 'Stark Admin', 'tenant_admin')
    `, [starkId, adminPass]);

    // Stark User (ADDED TO MEET REQUIREMENTS)
    await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES ($1, 'pepper@gmail.com', $2, 'Pepper Potts', 'user')
    `, [starkId, userPass]);

    console.log("✅ SEEDING COMPLETE: Database is ready for demo.");
  } catch (err) {
    console.error("❌ DB Init Failed:", err);
  } finally {
    client.release();
  }
};

if (require.main === module) {
  initDB().then(() => process.exit());
}

module.exports = { initDB };
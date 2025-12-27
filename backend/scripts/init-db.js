const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

async function initDB() {
  const client = await pool.connect();
  try {
    console.log("🔥 WIPING DATABASE & STARTING FRESH...");

    await client.query('BEGIN');

    // 1. DROP ALL EXISTING TABLES (Clean Slate)
    await client.query(`
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS tenants CASCADE;
      DROP EXTENSION IF EXISTS "uuid-ossp";
    `);

    // 2. RE-CREATE SCHEMA
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Tenants
    await client.query(`
      CREATE TABLE tenants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        subscription_plan VARCHAR(20) DEFAULT 'free',
        max_users INT DEFAULT 5,
        max_projects INT DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Users
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(20) NOT NULL, -- super_admin, tenant_admin, user
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
      );
    `);

    // Projects
    await client.query(`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tasks (With Assigned_To)
    await client.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Audit Logs
    await client.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID,
        user_id UUID,
        action VARCHAR(50),
        entity_type VARCHAR(50),
        entity_id UUID,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Schema Created.");

    // --- 3. SEED DATA (THE PERFECT DEMO) ---

    const password = await bcrypt.hash('123456', 10); // Simple password for everyone

    // === A. SYSTEM SUPER ADMIN ===
    await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, full_name, role)
      VALUES (NULL, 'super@admin.com', $1, 'System Super Admin', 'super_admin')
    `, [password]);

    // === B. TENANT 1: ACME CORP (The "Active" Company) ===
    const acmeRes = await client.query(`
      INSERT INTO tenants (name, subdomain, subscription_plan)
      VALUES ('Acme Corp', 'acme', 'pro') RETURNING id
    `);
    const acmeId = acmeRes.rows[0].id;

    // Acme Users
    const acmeAdmin = await client.query(`INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, 'admin@acme.com', $2, 'Alice Admin', 'tenant_admin') RETURNING id`, [acmeId, password]);
    const acmeDev = await client.query(`INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, 'dev@acme.com', $2, 'Bob Developer', 'user') RETURNING id`, [acmeId, password]);
    const acmeDesigner = await client.query(`INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, 'design@acme.com', $2, 'Charlie Designer', 'user') RETURNING id`, [acmeId, password]);

    // Acme Projects
    const p1 = await client.query(`INSERT INTO projects (tenant_id, name, description, status, created_by) VALUES ($1, 'Website Redesign', 'Overhaul the corporate website with new branding.', 'active', $2) RETURNING id`, [acmeId, acmeAdmin.rows[0].id]);
    const p2 = await client.query(`INSERT INTO projects (tenant_id, name, description, status, created_by) VALUES ($1, 'Q4 Marketing Campaign', 'Social media assets and ad tracking.', 'active', $2) RETURNING id`, [acmeId, acmeAdmin.rows[0].id]);

    // Acme Tasks (Assigned!)
    await client.query(`INSERT INTO tasks (tenant_id, project_id, title, status, priority, assigned_to, due_date) VALUES ($1, $2, 'Fix Login Bug', 'in_progress', 'high', $3, NOW() + INTERVAL '2 days')`, [acmeId, p1.rows[0].id, acmeDev.rows[0].id]);
    await client.query(`INSERT INTO tasks (tenant_id, project_id, title, status, priority, assigned_to, due_date) VALUES ($1, $2, 'Setup CI/CD Pipeline', 'completed', 'medium', $3, NOW() - INTERVAL '1 day')`, [acmeId, p1.rows[0].id, acmeDev.rows[0].id]);
    await client.query(`INSERT INTO tasks (tenant_id, project_id, title, status, priority, assigned_to, due_date) VALUES ($1, $2, 'Design Hero Banner', 'todo', 'medium', $3, NOW() + INTERVAL '5 days')`, [acmeId, p1.rows[0].id, acmeDesigner.rows[0].id]);
    await client.query(`INSERT INTO tasks (tenant_id, project_id, title, status, priority, assigned_to, due_date) VALUES ($1, $2, 'Create Ad Graphics', 'in_progress', 'high', $3, NOW() + INTERVAL '3 days')`, [acmeId, p2.rows[0].id, acmeDesigner.rows[0].id]);


    // === C. TENANT 2: STARK INDUSTRIES (The "Isolation" Proof) ===
    const starkRes = await client.query(`
      INSERT INTO tenants (name, subdomain, subscription_plan)
      VALUES ('Stark Industries', 'stark', 'enterprise') RETURNING id
    `);
    const starkId = starkRes.rows[0].id;

    // Stark Users
    await client.query(`INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, 'tony@stark.com', $2, 'Tony Stark', 'tenant_admin')`, [starkId, password]);

    // Stark Project
    await client.query(`INSERT INTO projects (tenant_id, name, description, status) VALUES ($1, 'Mark XLII Armor', 'Next gen autonomous suit.', 'active')`, [starkId]);

    await client.query('COMMIT');
    console.log("✅ SEEDING COMPLETE: Database is ready for demo.");

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ INIT FAILED:", err);
  } finally {
    client.release();
  }
}

// CRITICAL EXPORT LINE
module.exports = initDB;
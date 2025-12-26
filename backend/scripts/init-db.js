const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function init() {
    try {
        await client.connect();
        console.log("🔌 Connected to database...");

        // 1. Create Tables
        await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        subscription_plan VARCHAR(50) DEFAULT 'free',
        max_users INTEGER DEFAULT 5,
        max_projects INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, email)
      );

      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by UUID REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("✅ Tables created/verified.");

        // 2. Seed Data
        const check = await client.query('SELECT * FROM users LIMIT 1');
        if (check.rows.length === 0) {
            console.log("🌱 Database is empty. Seeding data...");

            // Super Admin
            const superPass = await bcrypt.hash('Admin@123', 10);
            await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, tenant_id)
        VALUES ($1, $2, $3, 'super_admin', NULL)
      `, ['superadmin@system.com', superPass, 'Super Admin']);
            console.log("   - Super Admin created");

            // Tenant
            const tenantRes = await client.query(`
        INSERT INTO tenants (name, subdomain, status, subscription_plan)
        VALUES ('Demo Company', 'demo', 'active', 'pro') RETURNING id
      `);
            const tenantId = tenantRes.rows[0].id; // <--- defined here
            console.log(`   - Tenant created (ID: ${tenantId})`);

            // Tenant Admin
            const adminPass = await bcrypt.hash('Demo@123', 10);
            await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, tenant_id)
        VALUES ($1, $2, $3, 'tenant_admin', $4)
      `, ['admin@demo.com', adminPass, 'Tenant Admin', tenantId]);
            console.log("   - Tenant Admin created");

            // Project (The missing piece)
            await client.query(`
        INSERT INTO projects (tenant_id, name, description, created_by)
        VALUES ($1, 'Submission Demo Project', 'Auto-generated seed project', (SELECT id FROM users WHERE email = 'admin@demo.com'))
      `, [tenantId]);
            console.log("   - Demo Project created");

            console.log("🎉 Seeding complete.");
        } else {
            console.log("⚡ Data exists. Skipping seed.");
        }

    } catch (err) {
        console.error("❌ ERROR in init-db.js:", err);
    } finally {
        await client.end();
    }
}

init();
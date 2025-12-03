const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for images

// Neon DB Connection String
const connectionString = 'postgresql://neondb_owner:npg_JWCufN8jpt2X@ep-icy-mouse-agz7d0l3-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize Database Tables
const initDb = async () => {
    try {
        console.log("Initializing Database...");
        await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id BIGINT PRIMARY KEY,
        title TEXT,
        messages JSONB,
        timestamp BIGINT
      );
      CREATE TABLE IF NOT EXISTS presentations (
        id BIGINT PRIMARY KEY,
        title TEXT,
        slides JSONB,
        timestamp BIGINT
      );
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT,
        settings JSONB,
        last_active BIGINT,
        subscription_plan TEXT,
        subscription_status TEXT,
        device_info TEXT,
        created_at BIGINT,
        subscription_start BIGINT,
        subscription_end BIGINT
      );
    `);

        // Add columns if they don't exist (Migration for existing table)
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT;`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_info TEXT;`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at BIGINT;`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start BIGINT;`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end BIGINT;`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';`);
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;`);
        } catch (e) { console.log("Migration note: Columns might already exist"); }

        console.log("Database Tables Ready.");

        // Insert Test Record
        const testId = Date.now();
        await pool.query(
            `INSERT INTO chats (id, title, messages, timestamp) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
            [testId, 'System Test Chat', JSON.stringify([{ role: 'system', content: 'Database Connection Verified' }]), testId]
        );
        console.log("Test Record Inserted. Check Neon Console.");

    } catch (err) {
        console.error("Error initializing database:", err);
    }
};

initDb();

// --- API Routes ---

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`, req.body);
    next();
});

// Users API
app.post('/api/user', async (req, res) => {
    const { email, phone, settings, subscription_plan, device_info } = req.body;
    try {
        if (email) {
            const now = Date.now();
            let subEnd = null;
            let subStatus = 'active';

            // Calculate Subscription End Date
            if (subscription_plan === 'trial') {
                subEnd = now + (3 * 24 * 60 * 60 * 1000); // 3 Days
            } else if (subscription_plan === 'pro' || subscription_plan === 'ultra') {
                subEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 Days
            } else {
                subStatus = 'free'; // Basic/Free
            }

            await pool.query(
                `INSERT INTO users (email, phone, settings, last_active, subscription_plan, subscription_status, device_info, created_at, subscription_start, subscription_end) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $4, $9) 
                 ON CONFLICT (email) 
                 DO UPDATE SET 
                    phone = $2, 
                    settings = $3, 
                    last_active = $4,
                    subscription_plan = $5,
                    subscription_status = $6,
                    device_info = $7,
                    subscription_start = CASE WHEN users.subscription_plan != $5 THEN $4 ELSE users.subscription_start END,
                    subscription_end = CASE WHEN users.subscription_plan != $5 THEN $9 ELSE users.subscription_end END`,
                [email, phone, JSON.stringify(settings), now, subscription_plan || 'free', subStatus, device_info, now, subEnd]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: 'neon' });
});

// Chats
app.get('/api/chats', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM chats ORDER BY timestamp DESC');
        // Convert BigInt to String for JSON
        const rows = result.rows.map(row => ({
            ...row,
            id: row.id.toString(),
            timestamp: parseInt(row.timestamp)
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/chats', async (req, res) => {
    const { id, title, messages, timestamp } = req.body;
    try {
        await pool.query(
            `INSERT INTO chats (id, title, messages, timestamp) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (id) 
       DO UPDATE SET title = $2, messages = $3, timestamp = $4`,
            [id, title, JSON.stringify(messages), timestamp]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/chats/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM chats WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Presentations
app.get('/api/presentations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM presentations ORDER BY timestamp DESC');
        const rows = result.rows.map(row => ({
            ...row,
            id: row.id.toString(),
            timestamp: parseInt(row.timestamp)
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/presentations', async (req, res) => {
    const { id, title, slides, timestamp } = req.body;
    try {
        await pool.query(
            `INSERT INTO presentations (id, title, slides, timestamp) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) 
         DO UPDATE SET title = $2, slides = $3, timestamp = $4`,
            [id, title, JSON.stringify(slides), timestamp]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/presentations/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM presentations WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

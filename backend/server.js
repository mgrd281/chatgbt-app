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
        last_active BIGINT
      );
    `);
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
    const { email, phone, settings } = req.body;
    try {
        // Simple upsert based on email for now, or just a single user record if single user app
        // For this demo, we'll assume a single user or upsert by email
        if (email) {
            await pool.query(
                `INSERT INTO users (email, phone, settings, last_active) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (email) 
                 DO UPDATE SET phone = $2, settings = $3, last_active = $4`,
                [email, phone, JSON.stringify(settings), Date.now()]
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

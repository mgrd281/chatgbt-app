import pool from '@/lib/db';

async function getStats() {
    try {
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE last_active > $1', [Date.now() - 7 * 24 * 60 * 60 * 1000]);
        const chatCount = await pool.query('SELECT COUNT(*) FROM chats');

        const proUsers = await pool.query("SELECT COUNT(*) FROM users WHERE subscription_plan = 'pro'");
        const revenue = proUsers.rows[0].count * 20; // Assuming $20/mo

        return {
            users: userCount.rows[0].count,
            active: activeUsers.rows[0].count,
            chats: chatCount.rows[0].count,
            revenue
        };
    } catch (e) {
        console.error(e);
        return { users: 0, active: 0, chats: 0, revenue: 0 };
    }
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>Dashboard Overview</h1>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.users}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.active}</div>
                    <div className="stat-label">Active (7d)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.chats}</div>
                    <div className="stat-label">Total Chats</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">${stats.revenue}</div>
                    <div className="stat-label">Est. Monthly Revenue</div>
                </div>
            </div>
        </div>
    );
}

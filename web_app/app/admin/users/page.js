import pool from '@/lib/db';

export default async function UsersPage() {
    let users = [];
    try {
        const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 50');
        users = res.rows;
    } catch (e) {
        console.error(e);
    }

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>User Management</h1>
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Last Active</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.subscription_plan}</td>
                            <td>{user.subscription_status}</td>
                            <td>{user.last_active ? new Date(parseInt(user.last_active)).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

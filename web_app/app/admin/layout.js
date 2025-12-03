import Link from 'next/link';
import './admin.css';

export default function AdminLayout({ children }) {
    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <h2>Zenith Admin</h2>
                <Link href="/admin">Dashboard</Link>
                <Link href="/admin/users">Users</Link>
                <Link href="/admin/billing">Billing</Link>
                <Link href="/admin/usage">Usage</Link>
                <Link href="/api/auth/signout" style={{ marginTop: 'auto' }}>Sign Out</Link>
            </aside>
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}

import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Zenith AI Web App</h1>
      <p>Welcome to the new Next.js frontend.</p>
      <div style={{ marginTop: '20px' }}>
        <Link href="/api/auth/signin" style={{ marginRight: '20px', color: 'blue' }}>Login</Link>
        <Link href="/admin" style={{ color: 'blue' }}>Admin Dashboard</Link>
      </div>
    </div>
  );
}

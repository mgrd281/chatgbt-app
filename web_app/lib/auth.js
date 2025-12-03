import CredentialsProvider from "next-auth/providers/credentials";
import pool from "./db";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Email Login",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "admin@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const { email, password } = credentials;
                try {
                    const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
                    const user = res.rows[0];

                    if (user && user.password === password) {
                        // For this demo, we allow login if email exists.
                        // Ensure you have an admin user in DB: UPDATE users SET role='admin' WHERE email='...';
                        return { id: user.id.toString(), email: user.email, role: user.role };
                    }
                    return null;
                } catch (error) {
                    console.error("Login error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};

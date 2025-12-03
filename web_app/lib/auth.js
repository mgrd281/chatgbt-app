import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "./db";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: "Admin Login",
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
        async signIn({ user, account, profile }) {
            if (account.provider === 'google') {
                const { email } = user;
                try {
                    const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
                    if (res.rows.length === 0) {
                        await pool.query(
                            "INSERT INTO users (email, role, created_at, last_active, subscription_plan, subscription_status) VALUES ($1, 'user', $2, $2, 'free', 'active')",
                            [email, Date.now()]
                        );
                    } else {
                        // Update last active
                        await pool.query("UPDATE users SET last_active = $1 WHERE email = $2", [Date.now(), email]);
                    }
                    return true;
                } catch (e) {
                    console.error("Error saving google user", e);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                // If user just signed in, fetch role from DB to be sure (for Google users)
                if (!token.role) {
                    try {
                        const res = await pool.query("SELECT role FROM users WHERE email = $1", [user.email]);
                        if (res.rows[0]) token.role = res.rows[0].role;
                    } catch (e) { }
                } else {
                    token.role = user.role;
                }
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

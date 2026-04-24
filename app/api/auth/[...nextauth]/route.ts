declare global {
  var _loginAttempts: Record<string, number[]> | undefined;
}

import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider     from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt             from "bcrypt";
import { prisma }         from "@/lib/prisma";
import { mailLoginAlert } from "@/lib/mailer";

const RATE_WINDOW_MS    = 10 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 5;

// ── Audit log ────────────────────────────────────────────────
async function writeLoginLog(data: {
  userId?:    number;
  email:      string;
  status:     "success" | "failed" | "blocked";
  ip?:        string;
  userAgent?: string;
}) {
  try {
    await prisma.login_logs.create({
      data: {
        user_id:    data.userId ?? null,
        email:      data.email,
        status:     data.status,
        ip_address: data.ip       ?? null,
        user_agent: data.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed:", err);
  }
}

// ── Auth options ─────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        const rawHeaders = (req as any)?.headers ?? {};

        const ip = (
          typeof rawHeaders["x-forwarded-for"] === "string"
            ? rawHeaders["x-forwarded-for"].split(",")[0].trim()
            : null
        ) ?? undefined;

        const userAgent =
          typeof rawHeaders["user-agent"] === "string"
            ? rawHeaders["user-agent"]
            : undefined;

        // ── In-memory rate limit ──────────────────────────
        const ipKey = ip ?? "anonymous";
        const now   = Date.now();

        if (!global._loginAttempts) global._loginAttempts = {};

        const attempts = (global._loginAttempts[ipKey] ?? []).filter(
          (t: number) => t > now - RATE_WINDOW_MS
        );

        if (attempts.length >= RATE_MAX_ATTEMPTS) {
          await writeLoginLog({
            email:  credentials?.email ?? "unknown",
            status: "blocked",
            ip,
            userAgent,
          });
          throw new Error("Too many login attempts. Try again in 10 minutes.");
        }

        attempts.push(now);
        global._loginAttempts[ipKey] = attempts;

        // ── Validate ──────────────────────────────────────
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password_hash) {
          await writeLoginLog({
            email:  credentials.email,
            status: "failed",
            ip,
            userAgent,
          });
          return null;
        }

        if (!user.is_active) {
          await writeLoginLog({
            userId: user.id, email: user.email,
            status: "failed", ip, userAgent,
          });
          throw new Error("Account has been deactivated.");
        }

        if (!user.email_verified) {
          throw new Error("Email not verified.");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isValid) {
          await writeLoginLog({
            userId: user.id, email: user.email,
            status: "failed", ip, userAgent,
          });
          return null;
        }

        await writeLoginLog({
          userId: user.id, email: user.email,
          status: "success", ip, userAgent,
        });

        // Email admin — fire and forget
        mailLoginAlert({
          name:      user.name ?? null,
          email:     user.email,
          method:    "credentials",
          ip,
          userAgent,
        }).catch(() => {});

        return {
          id:    String(user.id),
          email: user.email,
          name:  user.name ?? undefined,
          role:  user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email!;
        const name  =
          typeof profile?.name === "string" ? profile.name : undefined;

        const existing = await prisma.users.findUnique({ where: { email } });

        if (!existing) {
          await prisma.users.create({
            data: {
              email,
              name,
              role:           "user",
              email_verified: true,
              is_active:      true,
            },
          });
        } else {
          if (!existing.is_active) return false;
          if (!existing.name && name) {
            await prisma.users.update({ where: { email }, data: { name } });
          }
        }

        await writeLoginLog({
          userId: existing?.id,
          email,
          status: "success",
        });

        // Email admin — fire and forget
        mailLoginAlert({
          name:   name ?? existing?.name ?? null,
          email,
          method: "google",
        }).catch(() => {});
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id    = user.id;
        token.role  = (user as any).role;
        token.name  = user.name;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id    = token.id    as string;
        session.user.role  = token.role  as string;
        session.user.name  = (token.name as string) || "Guest";
        session.user.email = token.email as string;
      }
      return session;
    },
  },

  session: { strategy: "jwt" },
  pages:   { signIn: "/login" },
  secret:  process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
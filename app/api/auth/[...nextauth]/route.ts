declare global {
  var _loginAttempts: Record<string, number[]> | undefined;
}

import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider     from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt             from "bcrypt";
import { headers }        from "next/headers";
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

async function getRequestMeta(): Promise<{ ip?: string; userAgent?: string }> {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
      headersList.get("x-real-ip") ??
      undefined;
    const userAgent = headersList.get("user-agent") ?? undefined;
    return { ip, userAgent };
  } catch {
    return {};
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

        const { ip, userAgent } = await getRequestMeta();

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
          ip,
          userAgent,
        });

        mailLoginAlert({
          name:      name ?? existing?.name ?? null,
          email,
          method:    "google",
          ip,
          userAgent,
        }).catch(() => {});
      }

      return true;
    },

    async jwt({ token, user }) {
      // Initial sign-in — snapshot token_version from DB into the JWT
      if (user?.email) {
        token.id    = user.id;
        token.role  = (user as any).role;
        token.name  = user.name;
        token.email = user.email;

        try {
          const dbUser = await prisma.users.findUnique({
            where: { email: user.email },
            select: { token_version: true, role: true, is_active: true },
          });
          if (dbUser) {
            token.token_version = dbUser.token_version;
            token.role          = dbUser.role;
            token.is_active     = dbUser.is_active;
          }
        } catch {
          // DB unreachable — keep sign-in values
        }

        return token;
      }

      // Subsequent requests — compare JWT snapshot against DB; never overwrite version
      if (token.email) {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { email: token.email as string },
            select: { token_version: true, role: true, is_active: true },
          });

          if (
            !dbUser ||
            !dbUser.is_active ||
            dbUser.token_version !== token.token_version
          ) {
            token.invalid = true;
          } else {
            token.role      = dbUser.role;
            token.is_active = dbUser.is_active;
          }
        } catch {
          // DB unreachable — keep existing token values
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.invalid || token.is_active === false) {
        return { ...session, user: undefined, expires: new Date(0).toISOString() } as any;
      }

      // Re-validate role, active status, and token_version from DB on every session read
      if (token.email) {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { email: token.email as string },
            select: { token_version: true, role: true, is_active: true },
          });

          if (
            !dbUser ||
            !dbUser.is_active ||
            dbUser.token_version !== token.token_version
          ) {
            return { ...session, user: undefined, expires: new Date(0).toISOString() } as any;
          }

          if (session.user) {
            session.user.role = dbUser.role;
          }
        } catch {
          // DB unreachable — fall back to token values already validated in jwt callback
        }
      }

      if (session.user) {
        session.user.id    = token.id    as string;
        session.user.role  = token.role  as string;
        session.user.name  = (token.name as string) || "Guest";
        session.user.email = token.email as string;
      }
      return session;
    },
  },

  session: { strategy: "jwt", maxAge: 3600 },  // 1 hour — short TTL for security
  pages:   { signIn: "/login" },
  secret:  process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

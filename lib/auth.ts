import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionEpochCached } from "@/lib/system-settings";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    mustChangePassword: boolean;
    sessionEpoch?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
      mustChangePassword: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    mustChangePassword: boolean;
    sessionEpoch?: number;
  }
}

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const useSecureCookies = process.env.NODE_ENV === "production";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const magicSchema = z.object({
  token: z.string().min(16),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        const sessionEpoch = await getSessionEpochCached();

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          sessionEpoch,
        };
      },
    }),
    Credentials({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(raw) {
        const parsed = magicSchema.safeParse(raw);
        if (!parsed.success) return null;

        const magic = await prisma.magicToken.findUnique({
          where: { token: parsed.data.token },
        });
        if (!magic) return null;
        if (magic.expiresAt.getTime() < Date.now()) {
          await prisma.magicToken.delete({ where: { id: magic.id } }).catch(() => null);
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: magic.email.toLowerCase() },
        });

        // Single-use: consume immediately.
        await prisma.magicToken.delete({ where: { id: magic.id } }).catch(() => null);

        if (!user) return null;

        const sessionEpoch = await getSessionEpochCached();

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          sessionEpoch,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
        token.sessionEpoch = user.sessionEpoch ?? (await getSessionEpochCached());
      }

      // Client session.update({ mustChangePassword: false }) after password change
      if (trigger === "update" && session) {
        const patch = session as {
          mustChangePassword?: boolean;
          user?: { mustChangePassword?: boolean };
        };
        const nextFlag =
          typeof patch.mustChangePassword !== "undefined"
            ? patch.mustChangePassword
            : patch.user?.mustChangePassword;
        if (typeof nextFlag !== "undefined") {
          token.mustChangePassword = Boolean(nextFlag);
        }
      }

      // Invalidate JWTs after a security flush (session epoch bump).
      if (token.id) {
        const epoch = await getSessionEpochCached();
        if (
          typeof token.sessionEpoch === "number" &&
          token.sessionEpoch !== epoch
        ) {
          return {} as typeof token;
        }
        if (typeof token.sessionEpoch !== "number") {
          token.sessionEpoch = epoch;
        }
      }

      // Keep role/email fresh from DB on sign-in and when flag is missing
      if (token.id && (user || token.mustChangePassword === undefined)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            mustChangePassword: true,
            name: true,
            email: true,
          },
        });
        if (fresh) {
          token.role = fresh.role;
          if (token.mustChangePassword === undefined) {
            token.mustChangePassword = fresh.mustChangePassword;
          }
          token.name = fresh.name;
          token.email = fresh.email;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token?.id) {
        return session;
      }
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
  trustHost: true,
});

import NextAuth from "next-auth";
import { authConfig } from "./config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { Session as SessionModel } from "@/lib/db/models/session";
import { getAuthCookieDomain } from "@/lib/subdomain";
import { parseUserAgent } from "@/lib/user-agent";

const cookieDomain = getAuthCookieDomain();
const isProduction = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        ...(cookieDomain && { domain: cookieDomain }),
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
        preAuthToken: { label: "Pre-Auth Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        await connectDB();

        const token = credentials.preAuthToken as string | undefined;
        let user;

        if (token) {
          const { verifyPreAuthToken } = await import("@/lib/auth/pre-auth-token");
          const tokenData = await verifyPreAuthToken(token);
          if (!tokenData || tokenData.email !== credentials.email) return null;
          user = await User.findById(tokenData.userId).select(
            "+twoFactorEnabled +twoFactorSecret +twoFactorBackupCodes"
          );
        } else {
          if (!credentials.password) return null;
          user = await User.findOne({ email: credentials.email }).select(
            "+password +twoFactorEnabled +twoFactorSecret +twoFactorBackupCodes"
          );
          if (!user || !user.password) return null;
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!isValid) return null;
        }

        if (!user || !user.isActive) return null;

        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const code = credentials.twoFactorCode as string | undefined;
          if (!code) return null;

          const totp = new OTPAuth.TOTP({
            issuer: "EVOLVE HQ",
            label: user.email,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
          });

          const delta = totp.validate({ token: code.trim(), window: 1 });
          if (delta === null) {
            let backupValid = false;
            if (user.twoFactorBackupCodes?.length) {
              for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
                const isMatch = await bcrypt.compare(code.trim(), user.twoFactorBackupCodes[i]);
                if (isMatch) {
                  const updatedCodes = [...user.twoFactorBackupCodes];
                  updatedCodes.splice(i, 1);
                  await User.findByIdAndUpdate(user._id, { twoFactorBackupCodes: updatedCodes });
                  backupValid = true;
                  break;
                }
              }
            }
            if (!backupValid) return null;
          }
        }

        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: undefined,
          role: user.role,
          positions: [...(user.positions || [])],
          mustChangePassword: user.mustChangePassword ?? false,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // Call base JWT callback first
      if (authConfig.callbacks?.jwt) {
        token = await authConfig.callbacks.jwt({ token, user, trigger, session }) as any;
      }

      if (user) {
        const sessionId = globalThis.crypto.randomUUID();
        token.sessionId = sessionId;
        try {
          const hdrs = await headers();
          const ua = hdrs.get("user-agent") || "";
          const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "";
          const { browser, os, device } = parseUserAgent(ua);
          await connectDB();
          await SessionModel.create({
            userId: user.id,
            sessionId: sessionId,
            device,
            browser,
            os,
            ip,
            lastActive: new Date(),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          });
        } catch (err) {
          console.error("Session creation error:", err);
        }
      }

      // DB-based session validation (Node only)
      if (token.sessionId && !user && process.env.NEXT_RUNTIME !== 'edge') {
        const now = Date.now();
        const lastChecked = (token.sessionCheckedAt as number) || 0;
        if (now - lastChecked > 2 * 60 * 1000) {
          token.sessionCheckedAt = now;
          try {
            await connectDB();
            const exists = await SessionModel.exists({ sessionId: token.sessionId });
            if (!exists) return {} as any;
          } catch (err) {
            console.error("Session validation error:", err);
          }
        }
      }

      // Activity tracking (Node only)
      if (token.sessionId && process.env.NEXT_RUNTIME !== 'edge') {
        const now = Date.now();
        const lastUpdated = (token.lastActiveUpdated as number) || 0;
        if (now - lastUpdated > 5 * 60 * 1000) {
          token.lastActiveUpdated = now;
          SessionModel.updateOne(
            { sessionId: token.sessionId },
            { lastActive: new Date(now) }
          ).catch(() => {});
        }
      }

      return token;
    },
    async session(params: any) {
      let { session, token } = params;
      if (authConfig.callbacks?.session) {
        // @ts-ignore - Handle Auth.js v5 union type complexity for manual callback merging
        session = await authConfig.callbacks.session(params as any);
      }
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.positions = token.positions as string[];
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        session.user.sessionJti = token.sessionId as string;
        if (token.name) session.user.name = token.name as string;
        if (token.picture !== undefined) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sessionId) {
        try {
          await connectDB();
          await SessionModel.deleteOne({ sessionId: message.token.sessionId });
        } catch {}
      }
    },
  },
});


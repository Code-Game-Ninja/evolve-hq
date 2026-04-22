// Auth.js (NextAuth v5) configuration
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import crypto from "crypto";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { Session as SessionModel } from "@/lib/db/models/session";
import { getAuthCookieDomain } from "@/lib/subdomain";
import { parseUserAgent } from "@/lib/user-agent";

// Cookie domain (undefined — each hostname gets its own session)
const cookieDomain = getAuthCookieDomain();
const isProduction = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
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

        // If a preAuthToken is provided, verify it instead of bcrypt
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
          // Fallback: direct password login (non-2FA path with no preAuthToken)
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

        if (!user) return null;
        if (!user.isActive) return null;

        // 2FA check
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const code = credentials.twoFactorCode as string | undefined;
          if (!code) return null;

          // Try TOTP code
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
            // Try backup codes
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

        // Update last login
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.positions = [...(user.positions || [])];
        token.mustChangePassword = user.mustChangePassword ?? false;

        // Generate session ID and record active session
        const sessionId = crypto.randomUUID();
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
        } catch {
          // Don't block login if session recording fails
        }
      }

      // Validate session still exists in DB (handles remote logout)
      if (token.sessionId && !user) {
        const now = Date.now();
        const lastChecked = (token.sessionCheckedAt as number) || 0;
        // Check every 30 seconds to balance responsiveness vs DB load
        if (now - lastChecked > 30 * 1000) {
          token.sessionCheckedAt = now;
          try {
            await connectDB();
            const exists = await SessionModel.exists({ sessionId: token.sessionId });
            if (!exists) {
              // Session was revoked — clear all token data to force sign-out
              return {} as typeof token;
            }
          } catch {
            // Don't block on DB errors — allow the session to continue
          }
        }
      }

      // Throttle lastActive writes — only update if >5 minutes since last write
      if (token.sessionId) {
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

      // Handle client-side session update
      if (trigger === "update" && session) {
        if (typeof session.mustChangePassword === "boolean") {
          token.mustChangePassword = session.mustChangePassword;
        }
        if (typeof session.name === "string") {
          token.name = session.name;
        }
        if (session.image === null) {
          token.picture = undefined;
        } else if (typeof session.image === "string" && session.image.length < 500) {
          // Only store URL-based images in JWT, never base64
          token.picture = session.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // If token was invalidated (session revoked), return empty session
      if (!token.id) {
        return { ...session, user: undefined } as unknown as typeof session;
      }
      if (session.user) {
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
      // Clean up DB session when user signs out
      if ("token" in message && message.token?.sessionId) {
        try {
          await connectDB();
          await SessionModel.deleteOne({ sessionId: message.token.sessionId });
        } catch {
          // Don't block signout if DB cleanup fails
        }
      }
    },
  },
});

// Short-lived pre-auth token issued after password verification
// Allows authorize() to trust the credential check without re-hashing
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
const TOKEN_TYPE = "pre-auth";
const EXPIRY = "5m";

export async function createPreAuthToken(email: string, userId: string): Promise<string> {
  return new SignJWT({ email, type: TOKEN_TYPE })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret);
}

export async function verifyPreAuthToken(
  token: string
): Promise<{ email: string; userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== TOKEN_TYPE || !payload.email || !payload.sub) return null;
    return { email: payload.email as string, userId: payload.sub };
  } catch {
    return null;
  }
}

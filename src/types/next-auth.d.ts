// NextAuth type extensions
import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    positions?: string[];
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: string;
      positions: string[];
      mustChangePassword?: boolean;
      sessionJti?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    positions: string[];
    mustChangePassword?: boolean;
    jti?: string;
    sessionId?: string;
    lastActiveUpdated?: number;
    sessionCheckedAt?: number;
  }
}

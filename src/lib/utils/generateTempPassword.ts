import crypto from "crypto";

// Generate a random temp password (12 chars: letters + digits + special)
export function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const special = "!@#$%&*";
  let password = "";
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 10; i++) {
    password += chars[bytes[i] % chars.length];
  }
  password += special[bytes[10] % special.length];
  password += special[bytes[11] % special.length];
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

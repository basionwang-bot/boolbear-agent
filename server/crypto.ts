/**
 * AES-256-GCM encryption/decryption for API keys.
 * Uses JWT_SECRET as the encryption key source (hashed to 32 bytes).
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { ENV } from "./_core/env";

/** Derive a 32-byte key from the JWT secret */
function getEncryptionKey(): Buffer {
  const secret = ENV.cookieSecret || "default-secret-change-me";
  return createHash("sha256").update(secret).digest();
}

/** Encrypt a plaintext string. Returns { encrypted, iv, tag } all as hex strings. */
export function encryptApiKey(plaintext: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
}

/** Decrypt an encrypted string using iv and tag (all hex). */
export function decryptApiKey(encrypted: string, iv: string, tag: string): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/** Mask an API key for display: show first 4 and last 4 chars. */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

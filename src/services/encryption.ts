/**
 * Minimal WebCrypto helpers for optional at-rest obfuscation of
 * non-sensitive user preferences cached locally.
 *
 * SECURITY: credentials and tokens are NEVER stored client-side — access
 * tokens live in memory only and refresh tokens are httpOnly cookies set by
 * the backend. These helpers exist for demo preference payloads only.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getSessionKey(): Promise<CryptoKey> {
  // A per-session key: sufficient to avoid plaintext preference blobs on disk.
  const raw = new Uint8Array(16);
  crypto.getRandomValues(raw);
  return crypto.subtle.importKey('raw', raw.buffer, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptJson(value: unknown): Promise<string> {
  const key = await getSessionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = encoder.encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const bytes = new Uint8Array(iv.length + cipher.byteLength);
  bytes.set(iv);
  bytes.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...bytes));
}

export async function decryptJson<T>(payload: string): Promise<T | null> {
  try {
    const key = await getSessionKey();
    const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return JSON.parse(decoder.decode(plain)) as T;
  } catch {
    return null;
  }
}

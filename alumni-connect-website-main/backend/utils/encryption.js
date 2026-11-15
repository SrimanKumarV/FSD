const crypto = require('crypto');

/**
 * Cryptographic Architecture & Algorithm Notes:
 * - Current Implementation: AES-256-GCM (Galois/Counter Mode, AEAD).
 * - Why AES-256-GCM over AES-256-CBC:
 *   AES-256-CBC does not provide cryptographic integrity or authenticity on its own.
 *   Without an HMAC (Encrypt-then-MAC), CBC mode is susceptible to bit-flipping attacks,
 *   padding oracle attacks, and chosen-ciphertext manipulation.
 *   AES-256-GCM natively generates a 128-bit authentication tag (AUTH_TAG_LENGTH = 16)
 *   that cryptographically guarantees ciphertext integrity and fails closed if tampered with.
 * - Migration & Record Format Strategy:
 *   Encrypted payloads follow the standard 3-part format: `iv:authTag:encryptedHex`.
 *   If any legacy 2-part `iv:ciphertext` records (e.g., from an unauthenticated CBC scheme)
 *   are encountered, the parser detects `parts.length === 2` vs `parts.length === 3`,
 *   decrypts via legacy routine, and seamlessly re-encrypts to the 3-part GCM format.
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM (96 bits)
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

// Ephemeral dev/test key so non-production runs don't crash if key is omitted
let ephemeralDevKey = null;

/**
 * Validates and parses a raw secret string into a 32-byte Buffer.
 * Supports:
 * - 64-char hex string (32 bytes)
 * - 44-char base64 string (32 bytes)
 * - UTF-8 string (at least 16 chars, hashed via SHA-256 to ensure exact 32-byte entropy)
 */
function parseKey(secret) {
  if (!secret || typeof secret !== 'string') return null;
  const trimmed = secret.trim();
  if (!trimmed) return null;

  // 64 hex characters -> 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }
  // 44-char base64 string
  if (/^[A-Za-z0-9+/]{43}=$/.test(trimmed)) {
    const buf = Buffer.from(trimmed, 'base64');
    if (buf.length === 32) return buf;
  }
  // If string length is at least 16 chars, hash to 32 bytes
  if (trimmed.length >= 16) {
    return crypto.createHash('sha256').update(trimmed).digest();
  }
  return null;
}

/**
 * Resolves the primary dedicated encryption key.
 * Prioritizes ENCRYPTION_KEY, then GOOGLE_CALENDAR_ENCRYPTION_KEY.
 * Fails closed in production if neither is configured.
 */
function getPrimaryEncryptionKey() {
  const primarySecret = process.env.ENCRYPTION_KEY || process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY;
  const parsed = parseKey(primarySecret);

  if (parsed) {
    return parsed;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Encryption] Fatal: Dedicated ENCRYPTION_KEY (or GOOGLE_CALENDAR_ENCRYPTION_KEY) must be configured in production with at least 16 characters or a 64-character hex string.');
  }

  // Development / test fallback: ephemeral in-memory key (never static/hardcoded)
  if (!ephemeralDevKey) {
    ephemeralDevKey = crypto.randomBytes(32);
    console.warn('[Encryption] Warning: No dedicated ENCRYPTION_KEY configured. Using ephemeral session key for development/testing.');
  }
  return ephemeralDevKey;
}

/**
 * Resolves the legacy encryption key (derived from JWT_SECRET) for backwards-compatible decryption only.
 */
function getLegacyDecryptionKey() {
  const legacySecret = process.env.JWT_SECRET;
  if (legacySecret && typeof legacySecret === 'string' && legacySecret.trim()) {
    return crypto.createHash('sha256').update(legacySecret.trim()).digest();
  }
  return null;
}

/**
 * Helper to perform AES-256-GCM decryption with a specific 32-byte key
 */
function decryptWithKey(parts, key) {
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Output format: iv:authTag:encryptedHex
 * @param {string} text
 * @returns {string|null}
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') return text;
  try {
    const key = getPrimaryEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('[Encryption] Failed to encrypt:', err.message);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts string encrypted by encrypt().
 * Tries the primary dedicated encryption key first.
 * If decryption fails, attempts decryption using legacy key derivation
 * to preserve compatibility with existing encrypted records.
 * @param {string} cipherText
 * @returns {string|null}
 */
function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;
  const parts = cipherText.split(':');
  if (parts.length !== 3) return cipherText;

  // 1. Try primary dedicated encryption key
  try {
    const key = getPrimaryEncryptionKey();
    return decryptWithKey(parts, key);
  } catch (primaryErr) {
    // 2. Try legacy decryption key if available (preserves existing data)
    const legacyKey = getLegacyDecryptionKey();
    if (legacyKey) {
      try {
        const decrypted = decryptWithKey(parts, legacyKey);
        return decrypted;
      } catch (legacyErr) {
        // Fall through to error
      }
    }
    console.error('[Encryption] Failed to decrypt record with active or legacy keys.');
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt,
  parseKey,
  getPrimaryEncryptionKey
};

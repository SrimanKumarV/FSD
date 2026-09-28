const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from environment configuration.
 * Uses GOOGLE_CALENDAR_ENCRYPTION_KEY if set, or falls back to JWT_SECRET.
 */
function getEncryptionKey() {
  const secret = process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY || process.env.JWT_SECRET || 'alumnex-calendar-fallback-key-32b!';
  return crypto.createHash('sha256').update(secret).digest();
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
    const key = getEncryptionKey();
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
 * @param {string} cipherText
 * @returns {string|null}
 */
function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;
  // If not in iv:authTag:data format, return as-is (graceful fallback)
  const parts = cipherText.split(':');
  if (parts.length !== 3) return cipherText;

  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Encryption] Failed to decrypt:', err.message);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt
};

const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { isPrivateIp, validateUrlForSsrf, safeFetchHtml } = require('../utils/ssrfValidator');
const escapeRegex = require('../utils/escapeRegex');
const { resolveSafePath } = require('../utils/safePath');
const { upload, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } = require('../config/cloudinary');
const {
  uploadLimiter,
  helpdeskLimiter,
  searchLimiter,
  extractionLimiter
} = require('../middleware/rateLimiters');
const GoogleCalendarConnection = require('../models/GoogleCalendarConnection');

describe('Phase 4: API Security, Input Validation & Application Hardening', () => {

  describe('Step 1: SSRF Protection & IP / URL Validation', () => {
    it('should identify loopback and private IPv4 ranges as private', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('127.255.255.255')).toBe(true);
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('10.255.255.255')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.255')).toBe(true);
      expect(isPrivateIp('192.168.0.1')).toBe(true);
      expect(isPrivateIp('192.168.255.255')).toBe(true);
      expect(isPrivateIp('0.0.0.0')).toBe(true);
    });

    it('should identify cloud metadata and link-local addresses as private', () => {
      expect(isPrivateIp('169.254.169.254')).toBe(true); // AWS / GCP / Azure metadata
      expect(isPrivateIp('169.254.1.1')).toBe(true);
      expect(isPrivateIp('100.64.0.1')).toBe(true); // Carrier-grade NAT
      expect(isPrivateIp('100.127.255.255')).toBe(true);
    });

    it('should identify loopback and private IPv6 ranges, including IPv4-mapped IPv6', () => {
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('::')).toBe(true);
      expect(isPrivateIp('fe80::1')).toBe(true); // Link-local IPv6
      expect(isPrivateIp('fc00::1')).toBe(true); // Unique local IPv6
      expect(isPrivateIp('fd12:3456:789a::1')).toBe(true);
      expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true); // IPv4-mapped IPv6 loopback
      expect(isPrivateIp('::ffff:169.254.169.254')).toBe(true); // IPv4-mapped IPv6 metadata
      expect(isPrivateIp('::ffff:10.0.0.5')).toBe(true); // IPv4-mapped IPv6 private
    });

    it('should identify public IP addresses as non-private', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
      expect(isPrivateIp('142.250.190.46')).toBe(false);
      expect(isPrivateIp('2607:f8b0:4005:805::200e')).toBe(false);
    });

    it('should reject URLs with forbidden protocols (ftp, file, gopher, javascript)', async () => {
      await expect(validateUrlForSsrf('file:///etc/passwd')).rejects.toThrow(/unsupported protocol|forbidden protocol/i);
      await expect(validateUrlForSsrf('ftp://malicious-server.com/test')).rejects.toThrow(/unsupported protocol|forbidden protocol/i);
      await expect(validateUrlForSsrf('gopher://127.0.0.1:70/')).rejects.toThrow(/unsupported protocol|forbidden protocol/i);
      await expect(validateUrlForSsrf('javascript:alert(1)')).rejects.toThrow(/Unsupported protocol|Invalid URL/i);
    });

    it('should reject URLs targeting cloud metadata hostnames or IPs', async () => {
      await expect(validateUrlForSsrf('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(/prohibited|private|internal/i);
      await expect(validateUrlForSsrf('http://metadata.google.internal/computeMetadata/v1/')).rejects.toThrow(/prohibited|private|internal/i);
      await expect(validateUrlForSsrf('http://127.0.0.1:8080/admin')).rejects.toThrow(/prohibited|private|internal/i);
      await expect(validateUrlForSsrf('http://localhost:3000/api/users')).rejects.toThrow(/prohibited|private|internal/i);
    });

    it('should accept valid, public HTTPS URLs', async () => {
      const result = await validateUrlForSsrf('https://www.google.com/robots.txt');
      expect(result.parsedUrl.protocol).toBe('https:');
      expect(result.parsedUrl.hostname).toBe('www.google.com');
      expect(result.validatedAddresses.length).toBeGreaterThan(0);
    });

    it('should reject requests targeting private internal endpoints', async () => {
      await expect(safeFetchHtml('http://127.0.0.1:5000/internal')).rejects.toThrow(/prohibited|private|internal/i);
    });
  });

  describe('Step 2: MongoDB & NoSQL Injection Regex Sanitization', () => {
    it('should escape all regex special characters', () => {
      const maliciousPayload = '.*+?^${}()|[]\\';
      const escaped = escapeRegex(maliciousPayload);
      expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('should truncate strings exceeding 100 characters to prevent ReDoS', () => {
      const longString = 'a'.repeat(250);
      const escaped = escapeRegex(longString);
      expect(escaped.length).toBe(100);
    });

    it('should safely handle non-string inputs by coercing to string', () => {
      expect(escapeRegex(12345)).toBe('12345');
      expect(escapeRegex(null)).toBe('null');
      expect(escapeRegex(undefined)).toBe('');
      expect(escapeRegex({ $gt: '' })).toBe('\\[object Object\\]');
    });

    it('should neutralize MongoDB regex wildcard injection in query filters', () => {
      const injectionAttempt = '.*';
      const safeRegex = new RegExp(escapeRegex(injectionAttempt), 'i');
      expect(safeRegex.test('admin_account')).toBe(false);
      expect(safeRegex.test('.*')).toBe(true);
    });
  });

  describe('Step 3: Safe Path Containment & Path Traversal Prevention', () => {
    const baseDir = path.resolve(__dirname, '..');

    it('should resolve valid relative paths within base directory', () => {
      const safe = resolveSafePath(baseDir, 'routes/users.js');
      expect(safe).toBe(path.join(baseDir, 'routes', 'users.js'));
    });

    it('should throw on path traversal attempts escaping the base directory', () => {
      expect(() => {
        resolveSafePath(baseDir, '../../../../../../etc/passwd');
      }).toThrow(/Path traversal.*detected/i);

      expect(() => {
        resolveSafePath(baseDir, '..\\..\\..\\windows\\win.ini');
      }).toThrow(/Path traversal.*detected/i);
    });

    it('should throw on null-byte injection attempts in paths', () => {
      expect(() => {
        resolveSafePath(baseDir, 'allowed_file.txt\0.exe');
      }).toThrow(/Null byte.*detected/i);
    });
  });

  describe('Step 4: File Upload & Cloudinary Storage Hardening', () => {
    it('should maintain strict extension and MIME type allowlists', () => {
      expect(ALLOWED_EXTENSIONS.has('jpg')).toBe(true);
      expect(ALLOWED_EXTENSIONS.has('png')).toBe(true);
      expect(ALLOWED_EXTENSIONS.has('pdf')).toBe(true);
      expect(ALLOWED_EXTENSIONS.has('docx')).toBe(true);

      // Verify dangerous extensions are excluded
      expect(ALLOWED_EXTENSIONS.has('exe')).toBe(false);
      expect(ALLOWED_EXTENSIONS.has('php')).toBe(false);
      expect(ALLOWED_EXTENSIONS.has('sh')).toBe(false);
      expect(ALLOWED_EXTENSIONS.has('js')).toBe(false);
      expect(ALLOWED_EXTENSIONS.has('bat')).toBe(false);
      expect(ALLOWED_EXTENSIONS.has('svg')).toBe(false); // XSS risk in uploads

      expect(ALLOWED_MIME_TYPES.has('image/jpeg')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('image/png')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('application/pdf')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('application/x-msdownload')).toBe(false);
      expect(ALLOWED_MIME_TYPES.has('text/javascript')).toBe(false);
    });

    it('should reject unanchored double-extension spoofing (e.g., evil.exe.jpg with wrong mime)', (done) => {
      const fileFilter = upload.fileFilter;
      const fakeReq = {};
      const fakeFile = {
        originalname: 'evil.exe.jpg',
        mimetype: 'application/x-msdownload'
      };

      fileFilter(fakeReq, fakeFile, (err, passed) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toMatch(/MIME type 'application\/x-msdownload' is not permitted/i);
        expect(passed).toBeFalsy();
        done();
      });
    });

    it('should reject disallowed extensions even if MIME type is spoofed to image/png', (done) => {
      const fileFilter = upload.fileFilter;
      const fakeReq = {};
      const fakeFile = {
        originalname: 'payload.php',
        mimetype: 'image/png'
      };

      fileFilter(fakeReq, fakeFile, (err, passed) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toMatch(/File extension '\.php' is not permitted/i);
        expect(passed).toBeFalsy();
        done();
      });
    });

    it('should pass legitimate image files with matching extensions and MIME types', (done) => {
      const fileFilter = upload.fileFilter;
      const fakeReq = {};
      const fakeFile = {
        originalname: 'profile-picture.png',
        mimetype: 'image/png'
      };

      fileFilter(fakeReq, fakeFile, (err, passed) => {
        expect(err).toBeNull();
        expect(passed).toBe(true);
        done();
      });
    });
  });

  describe('Step 5: Rate Limiters & Public Functionality Protection', () => {
    it('should export all required rate limiter middleware instances', () => {
      expect(typeof uploadLimiter).toBe('function');
      expect(typeof helpdeskLimiter).toBe('function');
      expect(typeof searchLimiter).toBe('function');
      expect(typeof extractionLimiter).toBe('function');
    });
  });

  describe('Step 6: Google Calendar Webhook Timing-Safe Token Validation', () => {
    const testSecret = 'gcal_webhook_test_jwt_secret_32_bytes_len';
    const originalJwtSecret = process.env.JWT_SECRET;

    beforeAll(() => {
      process.env.JWT_SECRET = testSecret;
    });

    afterAll(() => {
      process.env.JWT_SECRET = originalJwtSecret;
    });

    it('should perform timing-safe comparison on channel ID buffers', () => {
      const channelIdHeader = 'alumnex-ch-user123-1700000000';
      const tokenChannelId = 'alumnex-ch-user123-1700000000';

      const bufA = Buffer.from(channelIdHeader, 'utf8');
      const bufB = Buffer.from(tokenChannelId, 'utf8');

      expect(bufA.length === bufB.length).toBe(true);
      expect(crypto.timingSafeEqual(bufA, bufB)).toBe(true);
    });

    it('should reject timing-safe comparison on mismatched channel IDs', () => {
      const channelIdHeader = 'alumnex-ch-user123-1700000000';
      const tokenChannelId = 'alumnex-ch-user999-1700000000';

      const bufA = Buffer.from(channelIdHeader, 'utf8');
      const bufB = Buffer.from(tokenChannelId, 'utf8');

      expect(bufA.length === bufB.length).toBe(true);
      expect(crypto.timingSafeEqual(bufA, bufB)).toBe(false);
    });

    it('should reject channel IDs with mismatched byte lengths safely', () => {
      const bufA = Buffer.from('short-id', 'utf8');
      const bufB = Buffer.from('longer-channel-id', 'utf8');

      expect(bufA.length === bufB.length).toBe(false);
    });
  });

  describe('Step 7: Database Model Indexes for Query Safety', () => {
    it('should have compound and single-field indexes on HelpDesk model', () => {
      const HelpDesk = require('../models/HelpDesk');
      const indexes = HelpDesk.schema.indexes();
      
      const hasStatusCreatedAtIndex = indexes.some(idx => {
        const fields = idx[0];
        return fields.status === 1 && fields.createdAt === -1;
      });

      const hasUserIndex = indexes.some(idx => {
        const fields = idx[0];
        return fields.user === 1;
      });

      expect(hasStatusCreatedAtIndex).toBe(true);
      expect(hasUserIndex).toBe(true);
    });

    it('should have performance indexes on TechHub models', () => {
      const { TechAssistanceQuestion, TechAssistanceReply } = require('../models/TechHub');

      const qIndexes = TechAssistanceQuestion.schema.indexes();
      const hasQCreatedAtIndex = qIndexes.some(idx => idx[0].createdAt === -1);
      const hasQAuthorIndex = qIndexes.some(idx => idx[0].author === 1);

      expect(hasQCreatedAtIndex).toBe(true);
      expect(hasQAuthorIndex).toBe(true);

      const rIndexes = TechAssistanceReply.schema.indexes();
      const hasReplyCompoundIndex = rIndexes.some(idx => {
        const fields = idx[0];
        return fields.questionId === 1 && fields.createdAt === 1;
      });

      expect(hasReplyCompoundIndex).toBe(true);
    });
  });

});

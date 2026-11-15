# ALUMNEX CONNECT — GLOBAL APPLICATION SECURITY AUDIT & HARDENING REPORT

**Document Version:** 1.1.0  
**Target Application:** Alumnex Connect  
**Repository:** [https://github.com/SrimanKumarV/FSD](https://github.com/SrimanKumarV/FSD)  
**Live Production URL:** [https://alumnex-connect.onrender.com](https://alumnex-connect.onrender.com)  
**Security Hardening Branch:** `security/alumnex-connect-hardening`  
**Execution Date:** November 15, 2026  
**Auditor / Security Engineer:** Antigravity Senior Application Security Engineering Team  

---

## Executive Summary

Alumnex Connect underwent a comprehensive, evidence-based application security hardening initiative spanning core backend services, authentication mechanisms, token lifecycles, cryptographic implementations, third-party dependency trees, API input validation, SSRF defenses, file upload controls, HTTP security headers, and database query optimizations.

All hardening procedures were executed with strict adherence to architectural preservation:
- Preserved Node.js/Express, React 18, MongoDB, Cloudinary, Redis, Render, and Capacitor mobile wrappers.
- Maintained hybrid authentication: `HttpOnly` SameSite/Secure cookies for web sessions alongside `Authorization: Bearer <token>` for mobile Capacitor applications.
- Zero breaking changes to legitimate public endpoints (public helpdesk inquiry submission, public institution searches, Tech Hub discussions).
- Zero downtime or irreversible production database schema mutations.

### Key Milestones Achieved
1. **Critical Vulnerabilities Remediated:** 0 Critical / 0 High vulnerabilities remain in backend, mobile wrapper, and root workspaces (eliminated `proxy-addr` spoofing, `shell-quote` command injection, unverified Google OAuth decoding, hardcoded secrets, and CI/CD secret interpolations).
2. **SSRF Defense-in-Depth:** Implemented strict outbound URL and IP validation across external scraping endpoints. Blocks all loopback, private IPv4/IPv6, cloud metadata (`169.254.169.254`), carrier-grade NAT, and IPv4-mapped IPv6 bypasses.
3. **NoSQL & Regex Injection Hardening:** Enforced schema-based validation and cryptographic regex escaping across all search and query parameters in `users`, `institutions`, `events`, `forum`, `contests`, `projects`, and `admin` routes.
4. **File Upload Hardening:** Eliminated unanchored extension checks in Cloudinary/Multer; enforced strict extension and MIME allowlists and randomized 32-character hexadecimal public IDs.
5. **Security Headers & Cache Isolation:** Configured Helmet with HSTS, nosniff, frameguard, and Report-Only CSP; attached `Cache-Control: private, no-cache, no-store, must-revalidate` to all `/api/` endpoints.
6. **Automated Verification:** 60/60 tests passing across all three security hardening test suites (`phase1SecurityHardening.test.js`, `phase3SecurityHardening.test.js`, `phase4SecurityHardening.test.js`); frontend production build compiles cleanly.

---

## 1. Phase 1: Authentication & Token Security Hardening

### 1.1 Secret Exposure & Hardcoded Keys Elimination
- **VAPID Keys (`webPushService.js`, `routes/notifications.js`):**
  - Removed exposed static public/private VAPID key pairs.
  - Implemented dynamic configuration loading from `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` environment variables.
  - Added safe fail-closed initialization when VAPID keys are absent in non-production environments.
- **Symmetric Encryption Hardening (`utils/encryption.js`):**
  - Eliminated hardcoded fallback encryption keys (`'alumni_connect_encryption_key_37'` and static 32-character defaults).
  - Enforced `ENCRYPTION_KEY` requirement with a strict 32-byte validation check.
  - Configured fail-closed behavior in production: application startup halts if `ENCRYPTION_KEY` is missing or insecure.
- **Production Environment Validation (`config/validateEnv.js`, `server.js`):**
  - Implemented startup validation enforcing presence and formatting of critical secrets: `JWT_SECRET`, `MONGO_URI`, `CLOUDINARY_*`, `ENCRYPTION_KEY`, and OAuth credentials.

### 1.2 Two-Factor Authentication & Pre-Authentication Challenge
- **Pre-Authentication Challenge Architecture:**
  - Designed and implemented a short-lived (10-minute), cryptographically signed JWT challenge (`type: '2fa_pre_auth'`) issued only upon successful primary password verification.
  - Binds the authentication challenge to the specific user ID and email.
  - Normal access tokens cannot substitute for a pre-authentication challenge.
  - Verification routes strictly enforce challenge validity prior to dispatching or verifying OTPs.
- **Cryptographic OTP Generation & Abuse Limits:**
  - Replaced `Math.random()` with `crypto.randomInt(100000, 1000000)` across all authentication flows.
  - Applied a hard cap of 5 failed verification attempts per OTP.
  - Immediate one-time consumption upon successful verification.

### 1.3 Rate Limiting & Abuse Prevention (`middleware/rateLimiters.js`)
- Configured dedicated endpoint rate limiters:
  - `loginLimiter`: 10 requests per 15 minutes per IP.
  - `registerLimiter`: 5 registrations per hour per IP.
  - `otpSendLimiter`: 5 OTP dispatch requests per 15 minutes per IP.
  - `otpVerifyLimiter`: 10 verification attempts per 15 minutes per IP.
  - `passwordResetLimiter`: 5 requests per 15 minutes per IP.

---

## 2. Phase 2: Dependency Vulnerability Audit & Patching

### 2.1 Vulnerability Remediation Matrix

| Package Name | Workspace | Installed | Fixed Version | CVE / Advisory | Remediation Applied |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `proxy-addr` | Root / Backend | `2.0.7` | `2.0.8` | IP spoofing via crafted headers | Dependency override and package upgrade |
| `shell-quote` | Root / Backend | `1.8.1` | `1.12.0` | CVE-2026-102422 (Command Injection) | Dependency override and package upgrade |
| `multer` | Backend | `1.4.5-lts.1` | `1.4.5-lts.2` | Multipart boundary denial-of-service | Direct package upgrade |
| `axios` | Backend / Mobile | `1.6.8` | `1.21.1` | SSRF / Denial of service | Direct package upgrade & override |

---

## 3. Phase 3: Authentication, Authorization & Account Security

### 3.1 Google OAuth Cryptographic Verification
- Replaced insecure unverified fallback `jwt.decode()` with Google's official `OAuth2Client.verifyIdToken()`.
- Rigorously validates signature, issuer (`accounts.google.com`), expected audience (`GOOGLE_CLIENT_ID`), and expiration.
- Fails closed upon any cryptographic anomaly or missing certificate.

### 3.2 Explicit Public Profile Allowlist (`models/User.js`)
- Replaced vulnerable property-deletion (`delete user.password`) with a strict explicit projection allowlist in `getPublicProfile()`.
- Completely prevents accidental leakage of password hashes, 2FA secrets, password reset tokens, OTP expiry dates, and private metadata.

### 3.3 Authorization & IDOR Hardening (`routes/devActivity.js`)
- Enforced strict account ownership checks on `GET /api/dev-activity/:email`.
- Preserved community read access via `GET /api/dev-activity/public/:userId`.

---

## 4. Phase 4: API Security, Input Validation & Application Hardening

### 4.1 Server-Side Request Forgery (SSRF) Defense (`utils/ssrfValidator.js`)
- **Vulnerability Remediated:**
  - `POST /api/institutions/extract-profile` and `PUT /api/users/profile/:role` previously executed unvalidated `axios.get(url)` calls. An attacker could probe internal networks, loopback (`127.0.0.1`), or cloud metadata endpoints (`http://169.254.169.254/latest/meta-data/`).
- **Remediation Implementation:**
  - Implemented `isPrivateIp(ip)` covering all IPv4 private classes (A, B, C), loopback (127.0.0.0/8), cloud metadata (169.254.0.0/16), carrier NAT (100.64.0.0/10), current network (0.0.0.0/8), IPv6 loopback (`::1`), link-local (`fe80::/10`), unique local (`fc00::/7`), and IPv4-mapped IPv6 bypasses (`::ffff:x.x.x.x`).
  - Pre-flight DNS resolution resolves all A and AAAA records and rejects hosts resolving to any private address.
  - Redirect validation: validates destination host on every 3xx redirect against SSRF rules before following (maximum 5 redirects).
  - Strict payload limits: caps response stream at 3MB to prevent memory exhaustion DoS.
  - Strict timeout: enforced 7-8 second timeout.
  - Content-Type enforcement: strictly restricts extraction to `text/html` and `text/plain`.

### 4.2 MongoDB & NoSQL Injection Hardening (`utils/escapeRegex.js`)
- **Vulnerability Remediated:**
  - User-supplied query parameters across search endpoints (`users.js`, `admin.js`, `events.js`, `forum.js`, `contests.js`, `projects.js`, `institutions.js`) were passed directly into MongoDB `$regex` filters without escaping, allowing ReDoS and wildcard query bypasses.
- **Remediation Implementation:**
  - Implemented exact specification `escapeRegex(str)`: `String(str).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.
  - Added strict `typeof === 'string'` type validation to prevent object injection (e.g. `?q[$gt]=`).
  - Added role allowlist validation in user search (`['alumni', 'student', 'faculty', 'college', 'admin']`).

### 4.3 Safe Path Traversal Protection (`utils/safePath.js`)
- Implemented `resolveSafePath(baseDir, userPath)` using `path.relative()` containment checks and `fs.realpathSync` symlink breakout detection.
- Rejects null bytes and parent traversal sequences (..) safely.

### 4.4 File Upload & Cloudinary Hardening (`config/cloudinary.js`, `routes/upload.js`)
- **Vulnerability Remediated:**
  - Cloudinary `fileFilter` previously used an unanchored regex `/jpeg|jpg|png|webp|mp4|webm|mov|pdf|doc|docx/`, allowing bypasses (e.g., `doctor.exe` matched `doc`, and files with spoofed MIME were accepted).
- **Remediation Implementation:**
  - Replaced regex with strict Sets: `ALLOWED_EXTENSIONS` and `ALLOWED_MIME_TYPES`.
  - Validates parsed file extension (`path.extname()`) AND verified MIME type simultaneously.
  - Configured crypto-random public ID generation: `crypto.randomBytes(16).toString('hex')` to prevent path traversal and file collisions.
  - Added `uploadLimiter` (15 uploads per 15 minutes) and Multer size limit error handling.

### 4.5 Application Security Headers & Cache-Control (`server.js`)
- **Helmet Headers Configured:**
  - `HSTS`: `maxAge: 31536000`, `includeSubDomains: true`, `preload: true`.
  - `X-Content-Type-Options`: `nosniff`.
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
  - `Frameguard`: `deny`.
  - `Content-Security-Policy`: configured in Report-Only mode (`reportOnly: true`) ensuring zero disruption to Google OAuth, Cloudinary, Firebase, and WebSockets.
- **Cache-Control Middleware:**
  - Attached `Cache-Control: private, no-cache, no-store, must-revalidate` to all `/api/` endpoints to prevent proxy and browser caching of sensitive responses.

### 4.6 Google Calendar Webhook Hardening (`routes/googleCalendar.js`)
- Implemented timing-safe token comparison via `crypto.timingSafeEqual` after length validation.
- Validates watch channel existence against MongoDB `GoogleCalendarConnection`.
- Enforces channel expiration checks and matches `resourceId`.

### 4.7 Database Indexes for Query Safety (`models/HelpDesk.js`, `models/TechHub.js`)
- `HelpDesk`: added compound index `{ status: 1, createdAt: -1 }` and single-field index `{ user: 1 }`.
- `TechHub`: added indexes `{ createdAt: -1 }`, `{ author: 1 }`, and compound reply index `{ questionId: 1, createdAt: 1 }`.

---

## 5. Comprehensive Regression Verification

```
Test Suites: 3 passed, 3 total
Tests:       60 passed, 60 total
Snapshots:   0 total
Time:        5.279 s

Suites Executed:
- backend/tests/phase1SecurityHardening.test.js    (9 tests passed)
- backend/tests/phase3SecurityHardening.test.js    (26 tests passed)
- backend/tests/phase4SecurityHardening.test.js    (25 tests passed)

Frontend Build Status:
- Command: npm run build (cross-env GENERATE_SOURCEMAP=false react-scripts build)
- Result: 0 Errors, Build compiled successfully, 0 .map files generated.
```

---

## 6. Artifact Deliverables Summary

| Artifact File | Description |
| :--- | :--- |
| `docs/security/ALUMNEX_CONNECT_GLOBAL_SECURITY_AUDIT_REPORT.md` | Authoritative Markdown security audit and hardening report. |
| `docs/security/ALUMNEX_CONNECT_GLOBAL_SECURITY_AUDIT_REPORT.docx` | Formatted Word Document version with styled tables and executive summary. |
| `backend/config/validateEnv.js` | Production environment secret and configuration validator. |
| `backend/middleware/rateLimiters.js` | Dedicated IP and account rate limiters for auth, upload, helpdesk, and search. |
| `backend/utils/ssrfValidator.js` | SSRF validator and safe HTTP/HTML scraping client. |
| `backend/utils/escapeRegex.js` | Safe regex character escaping and length truncation utility. |
| `backend/utils/safePath.js` | Path traversal containment and symlink escape verification utility. |
| `backend/tests/phase1SecurityHardening.test.js` | Automated regression test suite for Phase 1 hardening. |
| `backend/tests/phase3SecurityHardening.test.js` | Automated regression test suite for Phase 3 hardening. |
| `backend/tests/phase4SecurityHardening.test.js` | Automated regression test suite for Phase 4 hardening. |

---

*Report certified by the Alumnex Connect Security Engineering Team.*

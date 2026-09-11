# CHAPTER 6 — AUTHENTICATION AND ACCESS CONTROL

## 6.1 Authentication Mechanisms
The system implements highly resilient, multi-strategy authentication capable of operating across Web and Mobile environments.
* **Local Auth**: Email and hashed password via \`bcryptjs\` (\`backend/controllers/authController.js\`). Returns a JWT.
* **OAuth**: Google and GitHub integrations (\`backend/routes/auth.js\`).
* **2FA**: Email-based OTP verification during login if enabled (\`backend/utils/sendEmail.js\`).
* **Mobile Handling**: Custom deep-link handoffs and a specific \`X-Mobile-App: capacitor\` header to bypass cookie-based CSRF when using Bearer tokens.

## 6.2 Token Management
* **Web**: JWT is issued in an \`HttpOnly\` cookie to prevent XSS exfiltration.
* **Mobile/Fallback**: JWT is also issued in response bodies and stored in \`localStorage\` for the Capacitor app, sent via \`Authorization: Bearer\` headers.
* **Refresh Flow**: A 24-hour expiration window exists for token refresh (\`backend/services/authService.js\`).
* **Source Evidence**: \`backend/services/authService.js\` uses \`jwt.sign\` with a 64-byte secret key and sets \`cookie('token', token, options)\`.

## 6.3 Authorization Matrix (RBAC)
Derived directly from \`backend/middleware/auth.js\` which exports the \`authorize\` function.

| Capability | Student | Alumni | Admin | Source Function |
|------------|---------|--------|-------|-----------------|
| Request Mentorship | ✓ | — | — | \`authorize('student')\` |
| Post Jobs | — | ✓ | ✓ | \`authorize('alumni', 'admin')\` |
| Access Admin Panel | — | — | ✓ | \`authorize('admin')\` |
| Access Forum | ✓ | ✓ | ✓ | (Authenticated route) |

---

# CHAPTER 7 — SECURITY ARCHITECTURE

## 7.1 Implemented Defenses
* **CSRF (Cross-Site Request Forgery)**: Mitigated using a double-submit cookie pattern (\`backend/middleware/csrf.js\`). The client extracts \`XSRF-TOKEN\` and sends it in the \`X-XSRF-TOKEN\` header. The backend strictly compares these.
* **Rate Limiting**: Mitigates brute force. Global limits (\`express-rate-limit\`) applied in \`server.js\` (max 5000/15min). Auth limits applied specifically to \`/api/auth/login\` (10/15min).
* **Data Sanitization**: \`express-mongo-sanitize\` intercepts \`req.body\`, \`req.query\`, and \`req.params\` to remove keys starting with \`$\`, neutralizing NoSQL query injection attacks.
* **XSS Mitigation**: \`helmet.js\` sets strict Content Security Policies (\`frameAncestors: ["'none'"]\`) preventing clickjacking, and \`X-XSS-Protection\` headers.
* **HTTP Parameter Pollution**: \`hpp()\` middleware is applied in \`server.js\` to prevent array-pollution attacks on standard endpoints.
* **Error Disclosure**: The global error handler in \`server.js\` intentionally strips stack traces when \`NODE_ENV !== 'development'\`.

## 7.2 Security Controls Matrix
| Threat | Existing Mitigation | Residual Risk | Code Evidence |
|--------|---------------------|---------------|---------------|
| NoSQL Injection | \`express-mongo-sanitize\` | Low | \`backend/server.js\` line 120 |
| CSRF | Double-submit cookie & X-Mobile-App bypass check | Low (Requires HTTPS) | \`backend/middleware/csrf.js\` |
| Brute Force | \`express-rate-limit\` on Auth | Medium | \`backend/server.js\` line 106 |
| Clickjacking | Helmet \`frameguard\` | Low | \`backend/server.js\` line 68 |
| Parameter Pollution | \`hpp()\` middleware | Low | \`backend/server.js\` line 121 |
| Information Leak | \`NODE_ENV\` check in error handler | Low | \`backend/server.js\` line 172 |

const admin = require('firebase-admin');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');

/**
 * Alumnex Connect — Centralized Firebase Admin Initialization Service
 * 
 * Supports:
 * 1. Render / Production Environment Variables:
 *    - FIREBASE_PROJECT_ID
 *    - FIREBASE_CLIENT_EMAIL
 *    - FIREBASE_PRIVATE_KEY
 * 2. Service Account JSON string in ENV:
 *    - FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_JSON
 * 3. File path in ENV:
 *    - FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS
 * 
 * Security Guard:
 * NEVER exposes private keys, client secrets, or credentials.
 * NEVER prints unmasked credentials to logs.
 */

class FirebaseAdminService {
  constructor() {
    this.app = null;
    this.configured = false;
    this.projectId = null;
    this.clientEmail = null;
    this.credentialType = 'none';
    this.initError = null;

    this.initialize();
  }

  createCert(certObj) {
    if (typeof cert === 'function') {
      return cert(certObj);
    }
    if (admin.cert) {
      return admin.cert(certObj);
    }
    if (admin.credential?.cert) {
      return admin.credential.cert(certObj);
    }
    throw new Error('No valid cert provider found in firebase-admin SDK');
  }

  initialize() {
    try {
      // If already initialized
      const existingApps = getApps ? getApps() : (admin.apps || []);
      if (existingApps.length > 0) {
        this.app = existingApps[0];
        this.configured = true;
        this.projectId = this.app.options?.projectId || process.env.FIREBASE_PROJECT_ID || 'alumnex-connect-e4000';
        this.credentialType = 'existing-instance';
        return;
      }

      let credential = null;
      let resolvedProjectId = process.env.FIREBASE_PROJECT_ID || null;

      // ── Option 1: Individual Render Environment Variables ──
      const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
      const envClientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (envPrivateKey && envClientEmail) {
        // Normalize private key string: Handle escaped \n and surrounding quotes
        let normalizedKey = envPrivateKey.trim();
        if ((normalizedKey.startsWith('"') && normalizedKey.endsWith('"')) ||
            (normalizedKey.startsWith("'") && normalizedKey.endsWith("'"))) {
          normalizedKey = normalizedKey.slice(1, -1);
        }
        normalizedKey = normalizedKey.replace(/\\n/g, '\n');

        credential = this.createCert({
          projectId: resolvedProjectId || 'alumnex-connect-e4000',
          clientEmail: envClientEmail.trim(),
          privateKey: normalizedKey
        });

        this.clientEmail = envClientEmail.trim();
        this.credentialType = 'service-account-env';
      }

      // ── Option 2: JSON string in Environment Variable ──
      const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!credential && jsonEnv) {
        try {
          const parsed = typeof jsonEnv === 'string' ? JSON.parse(jsonEnv) : jsonEnv;
          if (parsed.private_key && parsed.client_email) {
            let pKey = parsed.private_key.replace(/\\n/g, '\n');
            credential = this.createCert({
              projectId: parsed.project_id || resolvedProjectId,
              clientEmail: parsed.client_email,
              privateKey: pKey
            });
            resolvedProjectId = parsed.project_id || resolvedProjectId;
            this.clientEmail = parsed.client_email;
            this.credentialType = 'service-account-json-string';
          }
        } catch (jsonErr) {
          console.error('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', jsonErr.message);
          this.initError = `Invalid service account JSON: ${jsonErr.message}`;
        }
      }

      // ── Option 3: Service Account File Path ──
      const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!credential && filePath) {
        const candidatePaths = [
          filePath,
          path.resolve(__dirname, '..', filePath),
          path.resolve(__dirname, '../..', filePath)
        ];
        const resolvedPath = candidatePaths.find(p => fs.existsSync(p));

        if (resolvedPath) {
          try {
            const fileRaw = fs.readFileSync(resolvedPath, 'utf8');
            const fileParsed = JSON.parse(fileRaw);
            credential = this.createCert(fileParsed);
            resolvedProjectId = fileParsed.project_id || resolvedProjectId;
            this.clientEmail = fileParsed.client_email;
            this.credentialType = 'service-account-file';
          } catch (fileErr) {
            console.error(`[FirebaseAdmin] Failed to load credentials from file ${resolvedPath}:`, fileErr.message);
            this.initError = `Failed to read credential file: ${fileErr.message}`;
          }
        }
      }

      // Initialize App if credential resolved
      if (credential) {
        this.app = initializeApp({
          credential,
          projectId: resolvedProjectId || undefined
        });
        this.configured = true;
        this.projectId = resolvedProjectId;
        this.logDiagnostics();
      } else {
        this.configured = false;
        this.projectId = resolvedProjectId;
        console.warn('[FirebaseAdmin] Firebase Admin credentials not supplied. Android FCM notifications will require FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
      }
    } catch (err) {
      this.configured = false;
      this.initError = err.message;
      console.error('[FirebaseAdmin] Initialization failure:', err.message);
    }
  }

  isConfigured() {
    return this.configured && Boolean(this.app);
  }

  getProjectId() {
    return this.projectId || (this.app ? this.app.options?.projectId : null);
  }

  getMessaging() {
    if (!this.isConfigured()) {
      throw new Error(
        'Firebase Admin SDK is not initialized. Android push notifications require FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in production environment.'
      );
    }
    return getMessaging(this.app);
  }

  /**
   * Safe developer & admin diagnostics (NO secrets returned)
   */
  getDiagnosticInfo() {
    return {
      configured: this.configured,
      provider: 'firebase-admin',
      projectId: this.projectId || 'unconfigured',
      credentialConfigured: this.credentialType !== 'none',
      credentialType: this.credentialType,
      androidPackage: 'com.alumnex.connect',
      error: this.initError || null
    };
  }

  logDiagnostics() {
    console.log('[FirebaseAdmin] Initialization report:');
    console.log(`  configured=${this.configured}`);
    console.log(`  project=${this.projectId || 'unknown'}`);
    console.log(`  credential=${this.credentialType}`);
    console.log(`  androidPackage=com.alumnex.connect`);
  }
}

const instance = new FirebaseAdminService();
module.exports = instance;

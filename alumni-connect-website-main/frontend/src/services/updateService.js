import { registerPlugin, Capacitor } from '@capacitor/core';
import localVersionData from '../version.json';

/**
 * Platform Detection:
 * Returns true ONLY when running inside the native Android APK.
 * Returns false in all regular web browsers (Chrome, Edge, Safari, Firefox, etc.).
 */
export const isAndroidApp = () => {
  if (typeof window === 'undefined') return false;
  try {
    const isNative = Capacitor.isNativePlatform() || Boolean(window.Capacitor?.isNativePlatform?.());
    const platform = Capacitor.getPlatform?.() || window.Capacitor?.getPlatform?.();
    return Boolean(isNative && (platform === 'android' || Boolean(window.androidBridge)));
  } catch {
    return false;
  }
};

let nativeAppUpdateInstance = null;

/**
 * Returns the native Android AppUpdate plugin instance ONLY when running on Android.
 * Returns null on web, completely avoiding any native calls or registration issues.
 */
export const getNativeAppUpdate = () => {
  if (!isAndroidApp()) {
    return null;
  }
  if (!nativeAppUpdateInstance) {
    nativeAppUpdateInstance = registerPlugin('AppUpdate');
  }
  return nativeAppUpdateInstance;
};

/**
 * Safe fallback proxy for AppUpdate.
 * On Android: delegates to the registered native plugin.
 * On Web: safe no-op with dummy listener handle that NEVER throws "not implemented on web".
 */
export const AppUpdate = new Proxy({}, {
  get(target, prop) {
    const native = getNativeAppUpdate();
    if (native && typeof native[prop] === 'function') {
      return native[prop].bind(native);
    }

    if (prop === 'addListener') {
      return async () => ({
        remove: async () => {},
      });
    }

    return async () => ({ isWeb: true, notSupported: true });
  }
});

const GITHUB_REPO_OWNER = 'SrimanKumarV';
const GITHUB_REPO_NAME = 'FSD';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;
const LAST_CHECK_KEY = 'alumnex_last_update_check_timestamp';
const LAST_RELEASE_KEY = 'alumnex_cached_latest_release';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Robust semantic version comparator.
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export const compareVersions = (v1, v2) => {
  if (!v1 || !v2) return 0;
  const clean1 = String(v1).replace(/^v/i, '').trim();
  const clean2 = String(v2).replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

/**
 * Extracts and sanitizes release notes from the GitHub Release body.
 */
export const sanitizeReleaseNotes = (rawBody) => {
  if (!rawBody || typeof rawBody !== 'string') {
    return ['General performance improvements and bug fixes.'];
  }

  // Remove comment tags, minVersionCode metadata, and SHA-256 blocks
  let text = rawBody
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/###?\s*🔒\s*Security[\s\S]*?(?=###|$)/gi, '')
    .replace(/SHA-256:\s*`?[a-fA-F0-9]{64}`?/gi, '')
    .replace(/\[minVersionCode:\s*\d+\]/gi, '')
    .replace(/\[versionCode:\s*\d+\]/gi, '')
    .replace(/\[mandatory\]/gi, '')
    .trim();

  // Split into lines and extract bullet points or sentences
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('>'));

  const notes = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[-*•]\s*/, '').trim();
    const lower = cleaned.toLowerCase();
    if (
      cleaned.length > 2 && 
      !lower.startsWith('download') && 
      !lower.includes('download below') &&
      !lower.includes('application id') &&
      !lower.includes('version code') &&
      !lower.includes('version name')
    ) {
      notes.push(cleaned);
    }
  }

  return notes.length > 0 ? notes.slice(0, 8) : ['Performance improvements and latest feature updates.'];
};

/**
 * Retrieves current installed app info (version, code, platform).
 * On Web: returns clean web version metadata without touching native plugins.
 * On Android: queries native PackageManager via AppUpdate plugin.
 */
export const getCurrentAppInfo = async () => {
  const isAndroid = isAndroidApp();

  if (!isAndroid) {
    return {
      versionName: localVersionData.versionName || '1.0.1',
      versionCode: Number(localVersionData.versionCode) || 2,
      packageName: 'com.alumnex.connect',
      isNative: false,
      canInstall: false,
      platform: 'Web Version',
    };
  }

  try {
    const plugin = getNativeAppUpdate();
    if (plugin) {
      const nativeInfo = await plugin.getAppInfo();
      return {
        versionName: nativeInfo.versionName || localVersionData.versionName || '1.0.1',
        versionCode: Number(nativeInfo.versionCode) || Number(localVersionData.versionCode) || 2,
        packageName: nativeInfo.packageName || 'com.alumnex.connect',
        isNative: true,
        canInstall: nativeInfo.canInstall !== false,
        platform: 'Android App',
      };
    }
  } catch (err) {
    console.warn('Could not read native Android app info:', err);
  }

  return {
    versionName: localVersionData.versionName || '1.0.1',
    versionCode: Number(localVersionData.versionCode) || 2,
    packageName: 'com.alumnex.connect',
    isNative: true,
    canInstall: false,
    platform: 'Android App',
  };
};

/**
 * Checks GitHub for the latest APK release.
 * NOTE: On the web, this function IMMEDIATELY returns hasUpdate: false.
 * APK update checks are ONLY executed on native Android.
 *
 * @param {boolean} forceCheck - If true, bypasses 24h throttling cache.
 */
export const checkForUpdate = async (forceCheck = false) => {
  // If running in a web browser, DO NOT perform APK update checks.
  if (!isAndroidApp()) {
    return {
      hasUpdate: false,
      isWeb: true,
      currentApp: {
        versionName: localVersionData.versionName || '1.0.1',
        versionCode: Number(localVersionData.versionCode) || 2,
        platform: 'Web Version',
        isNative: false,
      },
    };
  }

  const currentApp = await getCurrentAppInfo();
  const now = Date.now();
  const lastCheckStr = localStorage.getItem(LAST_CHECK_KEY);
  const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : 0;

  // Throttling for automatic background checks (24h)
  if (!forceCheck && lastCheck && now - lastCheck < CHECK_INTERVAL_MS) {
    const cached = localStorage.getItem(LAST_RELEASE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.hasUpdate) {
          return { ...parsed, isCached: true };
        }
      } catch {
        // Fall through to query if cache is corrupted
      }
    }
    return { hasUpdate: false, isThrottled: true, currentApp };
  }

  // Update check timestamp
  localStorage.setItem(LAST_CHECK_KEY, String(now));

  if (!navigator.onLine) {
    return {
      hasUpdate: false,
      error: 'Offline. Please check your internet connection.',
      currentApp,
    };
  }

  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'AlumnexConnect-UpdateChecker',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { hasUpdate: false, error: 'No releases published yet.', currentApp };
      }
      if (response.status === 403) {
        return { hasUpdate: false, error: 'GitHub rate limit exceeded. Please try again later.', currentApp };
      }
      return { hasUpdate: false, error: `GitHub API error: ${response.status}`, currentApp };
    }

    const release = await response.json();

    // Ignore drafts and pre-releases
    if (release.draft || release.prerelease) {
      return { hasUpdate: false, currentApp };
    }

    const releaseTag = release.tag_name || '';
    const latestVersionName = releaseTag.replace(/^v/i, '').trim();

    // Find APK asset
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const apkAsset = assets.find(a => a.name && a.name.toLowerCase().endsWith('.apk'));

    if (!apkAsset) {
      return {
        hasUpdate: false,
        error: 'Latest release does not contain an APK asset yet.',
        currentApp,
      };
    }

    // Parse SHA-256 if available in assets or release body
    let sha256 = null;
    const sha256Asset = assets.find(a => a.name && a.name.toLowerCase().endsWith('.sha256'));
    if (sha256Asset && sha256Asset.browser_download_url) {
      try {
        const shaRes = await fetch(sha256Asset.browser_download_url, { cache: 'no-cache' });
        if (shaRes.ok) {
          const shaText = await shaRes.text();
          const match = shaText.match(/([a-fA-F0-9]{64})/);
          if (match) sha256 = match[1].toLowerCase();
        }
      } catch (err) {
        console.warn('Could not fetch external .sha256 asset:', err);
      }
    }

    // Fallback: check release body for SHA-256
    if (!sha256 && release.body) {
      const bodyMatch = release.body.match(/SHA-256:\s*`?([a-fA-F0-9]{64})`?/i);
      if (bodyMatch) {
        sha256 = bodyMatch[1].toLowerCase();
      }
    }

    // Parse versionCode and minVersionCode from release body or tags
    let releaseVersionCode = null;
    let minVersionCode = null;
    let isMandatory = false;

    if (release.body) {
      const vcMatch = release.body.match(/\[versionCode:\s*(\d+)\]/i);
      if (vcMatch) releaseVersionCode = parseInt(vcMatch[1], 10);

      const minMatch = release.body.match(/\[minVersionCode:\s*(\d+)\]/i);
      if (minMatch) minVersionCode = parseInt(minMatch[1], 10);

      if (/\[mandatory\]/i.test(release.body)) {
        isMandatory = true;
      }
    }

    // Determine if update is available:
    // Prefer precise versionCode check to prevent downgrades
    let hasUpdate = false;
    if (releaseVersionCode !== null && currentApp.versionCode > 0) {
      hasUpdate = releaseVersionCode > currentApp.versionCode;
    } else {
      hasUpdate = compareVersions(latestVersionName, currentApp.versionName) > 0;
    }

    // Check mandatory constraint
    if (minVersionCode !== null && currentApp.versionCode < minVersionCode) {
      isMandatory = true;
    }

    const result = {
      hasUpdate,
      isMandatory,
      currentApp,
      latestRelease: {
        id: release.id,
        tagName: releaseTag,
        versionName: latestVersionName,
        versionCode: releaseVersionCode,
        minVersionCode,
        title: release.name || `Alumnex Connect v${latestVersionName}`,
        body: release.body || '',
        publishedAt: release.published_at,
        notes: sanitizeReleaseNotes(release.body),
        apkAsset: {
          id: apkAsset.id,
          name: apkAsset.name,
          sizeBytes: apkAsset.size,
          sizeMb: (apkAsset.size / (1024 * 1024)).toFixed(1),
          downloadUrl: apkAsset.browser_download_url,
        },
        sha256,
      },
    };

    // Cache the result on Android
    localStorage.setItem(LAST_RELEASE_KEY, JSON.stringify(result));
    return result;

  } catch (error) {
    return {
      hasUpdate: false,
      error: error.message || 'Unable to check for updates. Please try again later.',
      currentApp,
    };
  }
};

/**
 * Downloads and installs the APK using the native Android plugin.
 * On web: immediately throws an error without calling native methods.
 *
 * @param {object} apkAsset - The asset object with downloadUrl and name.
 * @param {string} sha256 - Expected SHA-256 checksum.
 * @param {function} onProgress - Callback receiving { percent, bytesDownloaded, totalBytes }.
 */
export const downloadAndInstallUpdate = async (apkAsset, sha256, onProgress) => {
  if (!isAndroidApp()) {
    throw new Error('APK updates can only be downloaded and installed on Android devices.');
  }

  const plugin = getNativeAppUpdate();
  if (!plugin) {
    throw new Error('Native update plugin is unavailable.');
  }

  if (!apkAsset || !apkAsset.downloadUrl) {
    throw new Error('Invalid APK download asset.');
  }

  // Set up progress listener safely on native Android
  let removeListener = null;
  if (onProgress && typeof onProgress === 'function') {
    try {
      const handle = await plugin.addListener('downloadProgress', (data) => {
        onProgress(data);
      });
      removeListener = () => {
        if (handle && typeof handle.remove === 'function') {
          handle.remove();
        }
      };
    } catch (listenerErr) {
      console.warn('Could not attach native progress listener:', listenerErr);
    }
  }

  try {
    const result = await plugin.downloadAndInstall({
      url: apkAsset.downloadUrl,
      sha256: sha256 || undefined,
      fileName: apkAsset.name || 'AlumnexConnect-update.apk',
    });
    return result;
  } finally {
    if (removeListener) removeListener();
  }
};

/**
 * Opens Unknown App Sources settings on Android.
 */
export const openInstallPermissionSettings = async () => {
  if (!isAndroidApp()) return { opened: false };
  const plugin = getNativeAppUpdate();
  return plugin ? await plugin.openInstallPermissionSettings() : { opened: false };
};

/**
 * Launches installation for an already downloaded APK on Android.
 */
export const installExistingApk = async (filePath) => {
  if (!isAndroidApp()) return { success: false, status: 'not_android' };
  const plugin = getNativeAppUpdate();
  return plugin ? await plugin.installExistingApk({ filePath }) : { success: false };
};

/**
 * Shows an Android system notification for the available update.
 */
export const showUpdateNotification = async (versionName) => {
  if (!isAndroidApp()) return;
  const plugin = getNativeAppUpdate();
  if (!plugin) return;
  try {
    await plugin.showUpdateNotification({
      title: '🚀 Alumnex Connect Update Available',
      body: `Version ${versionName} is ready to install. Tap to update now!`,
    });
  } catch (err) {
    console.warn('Could not post local notification:', err);
  }
};

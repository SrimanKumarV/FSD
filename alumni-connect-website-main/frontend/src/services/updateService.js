import { registerPlugin, Capacitor } from '@capacitor/core';
import localVersionData from '../version.json';

// Register native AppUpdate plugin with a web fallback proxy
export const AppUpdate = registerPlugin('AppUpdate', {
  web: {
    getAppInfo: async () => ({
      versionName: localVersionData.versionName || '1.0.0',
      versionCode: localVersionData.versionCode || 1,
      packageName: 'com.alumnex.connect',
      canInstall: false,
      isNative: false,
    }),
    canRequestPackageInstalls: async () => ({ canInstall: false }),
    openInstallPermissionSettings: async () => ({ opened: false }),
    downloadAndInstall: async (options) => {
      if (options?.url) {
        window.open(options.url, '_blank', 'noopener,noreferrer');
      }
      return { success: true, status: 'web_download_opened' };
    },
    installExistingApk: async () => ({ success: false, status: 'unsupported_platform' }),
    showUpdateNotification: async () => ({ success: true }),
  },
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
 */
export const getCurrentAppInfo = async () => {
  try {
    const isNative = Capacitor.isNativePlatform();
    const nativeInfo = await AppUpdate.getAppInfo();
    return {
      versionName: nativeInfo.versionName || localVersionData.versionName || '1.0.0',
      versionCode: Number(nativeInfo.versionCode) || Number(localVersionData.versionCode) || 1,
      packageName: nativeInfo.packageName || 'com.alumnex.connect',
      isNative,
      canInstall: nativeInfo.canInstall !== false,
      platform: isNative ? 'Android App' : 'Web',
    };
  } catch {
    return {
      versionName: localVersionData.versionName || '1.0.0',
      versionCode: Number(localVersionData.versionCode) || 1,
      packageName: 'com.alumnex.connect',
      isNative: false,
      canInstall: false,
      platform: 'Web',
    };
  }
};

/**
 * Checks GitHub for the latest APK release.
 *
 * @param {boolean} forceCheck - If true, bypasses 24h throttling cache.
 */
export const checkForUpdate = async (forceCheck = false) => {
  const currentApp = await getCurrentAppInfo();
  const now = Date.now();
  const lastCheckStr = localStorage.getItem(LAST_CHECK_KEY);
  const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : 0;

  // Throttling for automatic background checks
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

    // Ignore drafts
    if (release.draft) {
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

    // Determine if update is available
    let hasUpdate = false;
    if (releaseVersionCode !== null && currentApp.versionCode > 0) {
      // Precise versionCode comparison
      hasUpdate = releaseVersionCode > currentApp.versionCode;
    } else {
      // Semantic versionName comparison
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

    // Cache the result
    localStorage.setItem(LAST_RELEASE_KEY, JSON.stringify(result));
    return result;

  } catch (error) {
    return {
      hasUpdate: false,
      error: error.message || 'Unable to connect to update server.',
      currentApp,
    };
  }
};

/**
 * Downloads and installs the APK using the native Android plugin.
 *
 * @param {object} apkAsset - The asset object with downloadUrl and name.
 * @param {string} sha256 - Expected SHA-256 checksum.
 * @param {function} onProgress - Callback receiving { percent, bytesDownloaded, totalBytes }.
 */
export const downloadAndInstallUpdate = async (apkAsset, sha256, onProgress) => {
  if (!apkAsset || !apkAsset.downloadUrl) {
    throw new Error('Invalid APK download asset.');
  }

  // Set up progress listener
  let removeListener = null;
  if (onProgress && typeof onProgress === 'function') {
    const handle = await AppUpdate.addListener('downloadProgress', (data) => {
      onProgress(data);
    });
    removeListener = () => handle.remove();
  }

  try {
    const result = await AppUpdate.downloadAndInstall({
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
  return await AppUpdate.openInstallPermissionSettings();
};

/**
 * Launches installation for an already downloaded APK.
 */
export const installExistingApk = async (filePath) => {
  return await AppUpdate.installExistingApk({ filePath });
};

/**
 * Shows an Android system notification for the available update.
 */
export const showUpdateNotification = async (versionName) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AppUpdate.showUpdateNotification({
      title: '🚀 Alumnex Connect Update Available',
      body: `Version ${versionName} is ready to install. Tap to update now!`,
    });
  } catch (err) {
    console.warn('Could not post local notification:', err);
  }
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';
import { isAndroidApp } from '../../services/updateService';

const DISMISS_KEY = 'alumnex_apk_banner_dismissed_until';
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days dismissal memory
const OFFICIAL_RELEASES_URL = 'https://github.com/SrimanKumarV/FSD/releases/latest';

/**
 * MobileAppInstallBanner:
 * Smart, subtle installation suggestion shown exclusively to users accessing
 * Alumnex Connect from a mobile browser (Chrome/Edge/Safari/Firefox on Android or mobile).
 *
 * Rules:
 * 1. NEVER shown inside native Capacitor Android APK (isAndroidApp() check).
 * 2. ONLY shown on mobile screens (< 768px).
 * 3. Coexists harmoniously above bottom navigation and alongside the AI assistant.
 * 4. Dismissible with persistent timestamp (won't nag on every route/page load).
 */
const MobileAppInstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(OFFICIAL_RELEASES_URL);

  useEffect(() => {
    // 1. Strictly never display if inside native Capacitor app
    if (isAndroidApp()) {
      return;
    }

    // 2. Check if running on mobile device or viewport
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
    const isMobileUA = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    
    if (!isMobileViewport && !isMobileUA) {
      return;
    }

    // 3. Check dismissal memory
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        return;
      }
    } catch (e) {}

    // 4. Optionally fetch direct APK asset download URL from latest GitHub release in background
    let isMounted = true;
    fetch('https://api.github.com/repos/SrimanKumarV/FSD/releases/latest')
      .then(res => res.ok ? res.json() : null)
      .then(release => {
        if (!isMounted || !release) return;
        const apk = release.assets?.find(a => a.name?.toLowerCase().endsWith('.apk'));
        if (apk?.browser_download_url) {
          setDownloadUrl(apk.browser_download_url);
        }
      })
      .catch(() => {});

    // Delay appearance slightly so the user's initial page load is uninterrupted
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS));
    } catch (e) {}
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed z-50 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-indigo-100 dark:border-indigo-900/40 p-3.5 shadow-[0_12px_36px_rgba(79,70,229,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
        style={{
          bottom: 'calc(var(--alumnex-mobile-nav-height, 5.25rem) + var(--alumnex-safe-bottom, 0px) + 0.75rem)'
        }}
        role="region"
        aria-label="Android App Suggestion"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                Alumnex Connect App
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                APK
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
              Get the native Android experience with fast updates & push notifications.
            </p>

            <div className="flex items-center gap-2 mt-2.5">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                aria-label="Get the Android App"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get Android App</span>
              </a>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs font-medium transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Android app suggestion"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileAppInstallBanner;

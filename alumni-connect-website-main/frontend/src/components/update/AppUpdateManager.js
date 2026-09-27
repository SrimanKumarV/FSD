import React, { useState, useEffect } from 'react';
import { 
  isAndroidApp,
  checkForUpdate, 
  showUpdateNotification 
} from '../../services/updateService';
import UpdateModal from './UpdateModal';

const NOTIFIED_VERSION_KEY = 'alumnex_notified_update_version';

const AppUpdateManager = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Strictly disable on web: NO timers, NO checks, NO event listeners
    if (!isAndroidApp()) {
      return;
    }

    let isMounted = true;

    const performBackgroundCheck = async () => {
      try {
        const info = await checkForUpdate(false);
        if (!isMounted) return;

        if (info?.hasUpdate && info.latestRelease) {
          setUpdateInfo(info);
          setIsModalOpen(true);

          // Post a local notification on Android if haven't notified for this version yet
          const lastNotified = localStorage.getItem(NOTIFIED_VERSION_KEY);
          if (lastNotified !== info.latestRelease.versionName) {
            showUpdateNotification(info.latestRelease.versionName);
            localStorage.setItem(NOTIFIED_VERSION_KEY, info.latestRelease.versionName);
          }
        }
      } catch (err) {
        // Silent failure in background
        console.debug('Background update check:', err.message);
      }
    };

    // Delay slightly to prioritize critical page loading
    const timer = setTimeout(() => {
      performBackgroundCheck();
    }, 3000);

    // Listen for manual trigger events from Settings (Android only)
    const handleManualTrigger = (event) => {
      if (isAndroidApp() && event.detail) {
        setUpdateInfo(event.detail);
        setIsModalOpen(true);
      }
    };

    window.addEventListener('alumnex_open_update_modal', handleManualTrigger);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('alumnex_open_update_modal', handleManualTrigger);
    };
  }, []);

  // NEVER render on web
  if (!isAndroidApp() || !updateInfo || !updateInfo.hasUpdate) {
    return null;
  }

  return (
    <UpdateModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      updateInfo={updateInfo}
      onUpdateCompleted={() => setIsModalOpen(false)}
    />
  );
};

export default AppUpdateManager;

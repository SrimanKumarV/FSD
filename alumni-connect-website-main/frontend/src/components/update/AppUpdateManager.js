import React, { useState, useEffect } from 'react';
import { 
  checkForUpdate, 
  showUpdateNotification 
} from '../../services/updateService';
import UpdateModal from './UpdateModal';

const NOTIFIED_VERSION_KEY = 'alumnex_notified_update_version';

const AppUpdateManager = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const performBackgroundCheck = async () => {
      try {
        const info = await checkForUpdate(false);
        if (!isMounted) return;

        if (info?.hasUpdate && info.latestRelease) {
          setUpdateInfo(info);
          setIsModalOpen(true);

          // Post a local notification if on Android and haven't notified for this version yet
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
    }, 2500);

    // Listen for manual trigger events from Settings or elsewhere
    const handleManualTrigger = (event) => {
      if (event.detail) {
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

  if (!updateInfo || !updateInfo.hasUpdate) return null;

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

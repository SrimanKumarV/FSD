import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  X, 
  RefreshCw,
  ExternalLink,
  Settings as SettingsIcon,
  Check
} from 'lucide-react';
import { 
  downloadAndInstallUpdate, 
  openInstallPermissionSettings, 
  installExistingApk 
} from '../../services/updateService';
import toast from 'react-hot-toast';

const UpdateModal = ({ 
  isOpen, 
  onClose, 
  updateInfo,
  onUpdateCompleted 
}) => {
  const [downloadState, setDownloadState] = useState('idle'); // idle | downloading | verifying | ready | permission_needed | error
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadedFilePath, setDownloadedFilePath] = useState('');

  const release = updateInfo?.latestRelease;
  const currentApp = updateInfo?.currentApp;
  const isMandatory = updateInfo?.isMandatory;

  useEffect(() => {
    if (isOpen) {
      setDownloadState('idle');
      setProgress(0);
      setDownloadedBytes(0);
      setTotalBytes(0);
      setErrorMessage('');
      setDownloadedFilePath('');
    }
  }, [isOpen]);

  if (!isOpen || !release) return null;

  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleStartUpdate = async () => {
    if (!release.apkAsset) {
      toast.error('APK file is not available for this release.');
      return;
    }

    try {
      setDownloadState('downloading');
      setProgress(0);
      setErrorMessage('');

      const result = await downloadAndInstallUpdate(
        release.apkAsset,
        release.sha256,
        (prog) => {
          setProgress(prog.percent || 0);
          setDownloadedBytes(prog.bytesDownloaded || 0);
          setTotalBytes(prog.totalBytes || 0);
        }
      );

      if (result?.status === 'permission_required') {
        setDownloadedFilePath(result.filePath || '');
        setDownloadState('permission_needed');
        toast('Please grant install permission to continue.', { icon: '⚙️' });
      } else if (result?.status === 'installer_launched') {
        setDownloadState('ready');
        toast.success('Android installer opened! Follow the prompt to complete update.');
        if (onUpdateCompleted) onUpdateCompleted();
      } else if (result?.status === 'web_download_opened') {
        setDownloadState('ready');
        toast.success('APK download opened in browser!');
      }
    } catch (err) {
      console.error('Update download error:', err);
      setDownloadState('error');
      const msg = err.message || 'Download failed. Please check your internet connection.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await openInstallPermissionSettings();
      toast('After allowing, tap "Resume Install" below.', { icon: '💡', duration: 5000 });
    } catch (err) {
      toast.error('Could not open Android settings automatically.');
    }
  };

  const handleResumeInstall = async () => {
    if (!downloadedFilePath) {
      handleStartUpdate();
      return;
    }
    try {
      const res = await installExistingApk(downloadedFilePath);
      if (res?.status === 'installer_launched') {
        setDownloadState('ready');
        toast.success('Installer opened! Confirm to complete.');
      } else {
        toast.error('Permission is still needed. Please enable unknown apps permission.');
      }
    } catch (err) {
      toast.error('Could not launch installer. Retrying download...');
      handleStartUpdate();
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={() => {
          if (!isMandatory && downloadState !== 'downloading') {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Glow */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-600/20 via-indigo-600/20 to-purple-600/20 blur-2xl pointer-events-none" />

          {/* Close button (only if not mandatory) */}
          {!isMandatory && downloadState !== 'downloading' && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="p-6 md:p-8">
            {/* Header Icon & Tag */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isMandatory 
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30' 
                      : 'bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30'
                  }`}>
                    {isMandatory ? 'Mandatory Update' : 'New Update Available'}
                  </span>
                  {release.apkAsset?.sizeMb && (
                    <span className="text-xs text-gray-400 font-medium">
                      {release.apkAsset.sizeMb} MB
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  Alumnex Connect v{release.versionName}
                </h2>
              </div>
            </div>

            {/* Version Diff Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/60 dark:border-slate-700/60 mb-5">
              <div className="text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  v{currentApp?.versionName || '1.0.0'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="text-right">
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Latest</p>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  v{release.versionName}
                </p>
              </div>
            </div>

            {/* Mandatory Banner */}
            {isMandatory && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                <p className="text-xs leading-relaxed">
                  This update contains critical updates and is required to continue using Alumnex Connect.
                </p>
              </div>
            )}

            {/* Release Notes */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                What's New in this Version
              </h3>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                {release.notes && release.notes.length > 0 ? (
                  release.notes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                      <span className="leading-snug">{note}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Includes performance improvements and bug fixes.</p>
                )}
              </div>
            </div>

            {/* Security Badge */}
            {release.sha256 && (
              <div className="flex items-center gap-2 mb-6 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  Verified GitHub Release • SHA-256 protected
                </span>
              </div>
            )}

            {/* Download Progress View */}
            {downloadState === 'downloading' && (
              <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-500" />
                    Downloading APK update...
                  </span>
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-200 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{formatBytes(downloadedBytes)} / {formatBytes(totalBytes || release.apkAsset?.sizeBytes)}</span>
                  <span>Keep app open</span>
                </div>
              </div>
            )}

            {/* Permission Needed View */}
            {downloadState === 'permission_needed' && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1.5">
                  <SettingsIcon className="w-4 h-4 text-amber-500" />
                  Installation Permission Required
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-3">
                  Android requires permission to install apps from Alumnex Connect. Please enable "Allow from this source", then return and tap Resume.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenSettings}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    Open Android Settings
                  </button>
                  <button
                    onClick={handleResumeInstall}
                    className="flex-1 py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Resume Install
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {downloadState === 'error' && (
              <div className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Update failed</p>
                  <p>{errorMessage || 'Could not complete update.'}</p>
                </div>
              </div>
            )}

            {/* Ready State */}
            {downloadState === 'ready' && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Installer Ready</p>
                  <p>Confirm the installation prompt on your screen to complete the update.</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {!isMandatory && downloadState !== 'downloading' && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Later
                </button>
              )}

              {downloadState !== 'permission_needed' && (
                <button
                  onClick={handleStartUpdate}
                  disabled={downloadState === 'downloading'}
                  className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm text-white shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 ${
                    downloadState === 'downloading'
                      ? 'bg-gray-400 cursor-not-allowed opacity-75'
                      : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 active:scale-[0.98]'
                  }`}
                >
                  {downloadState === 'downloading' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Downloading ({progress}%)
                    </>
                  ) : downloadState === 'error' ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Retry Update
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {currentApp?.isNative ? 'Download & Install' : 'Download APK'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpdateModal;

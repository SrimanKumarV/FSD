import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Trash2, ShieldAlert, Globe, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DevProfileSettings from '../components/profile/DevProfileSettings';
import AnimatedOTP from '../components/AnimatedOTP';

const Settings = () => {
  const { user, logout } = useAuth();
  const { updateProfile: updateUser } = useProfile();
  const { theme, changeTheme } = useTheme();
  const navigate = useNavigate();

  // Stitch under-development modal
  const [stitchModalOpen, setStitchModalOpen] = useState(false);

  // Phone settings
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpStatus, setPhoneOtpStatus] = useState('idle');
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

  // Initialize phone number if it exists
  React.useEffect(() => {
    if (user?.phoneNumber) {
      if (user.phoneNumber.startsWith('+')) {
        const spaceIdx = user.phoneNumber.indexOf(' ');
        if (spaceIdx > -1) {
          setCountryCode(user.phoneNumber.substring(0, spaceIdx));
          setPhoneNumber(user.phoneNumber.substring(spaceIdx + 1));
        } else {
          // Fallback if no space
          setPhoneNumber(user.phoneNumber);
        }
      } else {
        setPhoneNumber(user.phoneNumber);
      }
    }
  }, [user]);

  const handleUpdatePhone = async () => {
    // Strict validation
    if (!phoneNumber || phoneNumber.length < 7 || phoneNumber.length > 15) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    const fullPhone = `${countryCode} ${phoneNumber}`;
    try {
      setIsUpdatingPhone(true);
      await updateUser({ phoneNumber: fullPhone });
      // After updating, if it changed, it will be unverified. Ask to send OTP
      const res = await api.post('/users/profile/phone/send-otp');
      toast.success(res.data.message || 'OTP sent successfully');
      setShowPhoneModal(true);
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to update phone');
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleVerifyPhone = async () => {
    try {
      setIsVerifyingPhone(true);
      setPhoneOtpStatus('loading');
      const res = await api.post('/users/profile/phone/verify-otp', { otp: phoneOtp });
      toast.success(res.data.message || 'Phone verified');
      setPhoneOtpStatus('success');
      setTimeout(() => {
        setShowPhoneModal(false);
        setPhoneOtp('');
        // Force update user context
        updateUser({ smsNotifications: true }); // trigger a silent sync with what backend returned
        setPhoneOtpStatus('idle');
      }, 1500);
    } catch(err) {
      setPhoneOtpStatus('error');
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleToggleSms = async () => {
    if (!user?.phoneVerified) {
      toast.error('Please verify your phone number first');
      return;
    }
    try {
      await updateUser({ smsNotifications: !user?.smsNotifications });
      toast.success('SMS Preferences Updated');
    } catch(err) {
      toast.error('Failed to update SMS preferences');
    }
  };

  const getCookieLanguage = () => {
    const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
    return match ? match[1] : 'en';
  };
  const [currentLang, setCurrentLang] = useState(getCookieLanguage());
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);

  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    setCurrentLang(langCode);
    setIsSwitchingLanguage(true);
    
    // Clear existing cookies to prevent conflicts across different domain scopes
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;

    if (langCode !== 'en') {
      // Set new cookie explicitly for stateful behavior
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname};`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${window.location.hostname};`;
    }

    // The most robust way to ensure Google Translate picks up the new language
    // and translates the entire DOM instantly is to reload the page.
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  // State for Account Deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteOtpStatus, setDeleteOtpStatus] = useState('idle');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // State for Password Change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [passwordOtpStatus, setPasswordOtpStatus] = useState('idle');
  const [newPassword, setNewPassword] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const requestPasswordOtp = async () => {
    try {
      setIsRequestingOtp(true);
      await api.post('/auth/forgot-password', { email: user.email });
      setShowPasswordModal(true);
      toast.success('Security code sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send security code');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const confirmPasswordChange = async () => {
    if (!passwordOtp || passwordOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit security code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      setPasswordOtpStatus('loading');
      await api.post('/auth/reset-password', { 
        email: user.email, 
        otp: passwordOtp, 
        newPassword: newPassword 
      });
      toast.success('Password changed successfully');
      setPasswordOtpStatus('success');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordOtp('');
        setNewPassword('');
        setPasswordOtpStatus('idle');
      }, 1500);
    } catch (error) {
      setPasswordOtpStatus('error');
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };



  const requestDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await api.post('/users/delete-request');
      setShowDeleteModal(true);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setDeletingAccount(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deleteOtp || deleteOtp.length !== 6) {
      toast.error('Please enter the OTP');
      return;
    }
    try {
      setDeletingAccount(true);
      setDeleteOtpStatus('loading');
      await api.delete('/users/me', { data: { otp: deleteOtp } });
      toast.success('Account deleted successfully');
      setDeleteOtpStatus('success');
      setTimeout(() => {
        setShowDeleteModal(false);
        logout();
        navigate('/');
      }, 1500);
    } catch (error) {
      setDeleteOtpStatus('error');
      toast.error(error.response?.data?.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  return (
    <>
      {isSwitchingLanguage && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Applying Language Preferences...</h2>
          <p className="text-slate-500 mt-2 font-medium">Please wait while we seamlessly translate the interface.</p>
        </div>
      )}
      <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            Settings & Preferences
          </h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="mb-4">
                <p className="font-medium text-gray-900 dark:text-white">Theme Preference</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose a style that suits you best.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 w-full">
                <button
                  onClick={() => changeTheme('light')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <Sun className="w-6 h-6 text-yellow-500" />
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">Default Light</span>
                </button>
                <button
                  onClick={() => changeTheme('dark')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <Moon className="w-6 h-6 text-blue-400" />
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">Default Dark</span>
                </button>
                <button
                  onClick={() => changeTheme('minimalist-light')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${theme === 'minimalist-light' ? 'border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <div className="w-6 h-6 border-2 border-black bg-white rounded-full"></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">Minimal Light</span>
                </button>
                <button
                  onClick={() => changeTheme('minimalist-dark')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${theme === 'minimalist-dark' ? 'border-primary-500 bg-gray-800' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                   <div className="w-6 h-6 border-2 border-white bg-black rounded-full"></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">Minimal Dark</span>
                </button>
                <button
                  onClick={() => changeTheme('cyber-neon')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${theme === 'cyber-neon' ? 'border-fuchsia-500 bg-fuchsia-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                   <div className="w-6 h-6 border-2 border-cyan-400 bg-fuchsia-600 rounded-full shadow-[0_0_10px_rgba(217,70,239,0.8)]"></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">Cyber Neon</span>
                </button>
                <button
                  onClick={() => changeTheme('heroui-light')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${theme === 'heroui-light' ? 'border-[#006FEE] bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                   <div className="w-6 h-6 border-[3px] border-white bg-[#006FEE] rounded-2xl shadow-sm"></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">HeroUI Light</span>
                </button>
                <button
                  onClick={() => changeTheme('heroui-dark')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${theme === 'heroui-dark' ? 'border-[#006FEE] bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                   <div className="w-6 h-6 border-[3px] border-gray-900 bg-[#006FEE] rounded-2xl shadow-sm"></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">HeroUI Dark</span>
                </button>
                <button
                  onClick={() => changeTheme('designcode-light')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${theme === 'designcode-light' ? 'border-[#7B61FF] bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                   <div className="w-6 h-6 rounded-full shadow-sm" style={{background: 'linear-gradient(135deg, #7B61FF, #C9E4FF)'}}></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">DC Light</span>
                </button>
                <button
                  onClick={() => changeTheme('designcode-dark')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all ${theme === 'designcode-dark' ? 'border-[#7B61FF] bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                   <div className="w-6 h-6 rounded-full shadow-sm" style={{background: 'linear-gradient(135deg, #2D1B69, #7B61FF)'}}></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">DC Dark</span>
                </button>
                <button
                   onClick={() => setStitchModalOpen(true)}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col items-center justify-center space-y-2 transition-all relative group"
                >
                   <div className="w-6 h-6 rounded-full shadow-sm flex items-center justify-center" style={{background: 'linear-gradient(135deg, #F59E0B, #EC4899, #8B5CF6)'}}>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                   </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">Stitch</span>
                  <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:'linear-gradient(135deg,#f59e0b,#ec4899)'}}>SOON</span>
                </button>
              </div>

              </div>
            </div>

            {/* Language Switcher */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="mb-4 md:mb-0">
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary-500" />
                  Language
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instantly translate the entire platform.</p>
              </div>
              <select
                value={currentLang}
                onChange={handleLanguageChange}
                className="px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white font-medium outline-none transition-all shadow-sm cursor-pointer min-w-[200px]"
              >
                <optgroup label="Global Languages">
                  <option value="en">English (Default)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="de">Deutsch (German)</option>
                  <option value="zh-CN">中文 (Chinese Simplified)</option>
                  <option value="ja">日本語 (Japanese)</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="ru">Русский (Russian)</option>
                  <option value="pt">Português (Portuguese)</option>
                  <option value="it">Italiano (Italian)</option>
                  <option value="ko">한국어 (Korean)</option>
                </optgroup>
                <optgroup label="Indian Regional Languages">
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="ur">اردو (Urdu)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="or">ଓଡ଼ିଆ (Odia)</option>
                  <option value="ml">മലയാളം (Malayalam)</option>
                  <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="as">অসমীয়া (Assamese)</option>
                  <option value="mai">मैथिली (Maithili)</option>
                  <option value="sd">सिन्धी (Sindhi)</option>
                  <option value="ne">नेपाली (Nepali)</option>
                  <option value="sa">संस्कृतम् (Sanskrit)</option>
                  <option value="gom">कोंकणी (Konkani)</option>
                  <option value="doi">डोगरी (Dogri)</option>
                  <option value="brx">बड़ो (Bodo)</option>
                  <option value="ks">کأشُر (Kashmiri)</option>
                  <option value="sat">ᱥᱟᱱᱛᱟᱲᱤ (Santali)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* DevPulse Integrations */}
          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <DevProfileSettings />
          </div>

          {/* Security & Authentication */}
          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-primary-500" />
              Security & Communications
            </h3>
            
            <div className="space-y-4">
              {/* Phone and SMS Notifications */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Mobile Number</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">
                      Add a mobile number to receive important notifications via SMS.
                    </p>
                    <div className="flex max-w-md gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <input 
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="10-digit number"
                        maxLength="15"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                      <button 
                        onClick={handleUpdatePhone}
                        disabled={isUpdatingPhone || !phoneNumber || (user?.phoneNumber === `${countryCode} ${phoneNumber}` && user?.phoneVerified)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {user?.phoneVerified && user?.phoneNumber === `${countryCode} ${phoneNumber}` ? 'Verified' : 'Verify'}
                      </button>
                    </div>
                  </div>
                  
                  {user?.phoneVerified && (
                    <div className="flex items-center space-x-3 mt-4 md:mt-0 bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Forward emails to SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={user?.smsNotifications || false} onChange={handleToggleSms} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Change */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Securely update your password. We will send a confirmation code to <strong>{user?.email}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestPasswordOtp}
                  disabled={isRequestingOtp}
                  className="mt-4 md:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
                >
                  {isRequestingOtp && !showPasswordModal ? 'Sending Code...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
              <Trash2 className="w-5 h-5 mr-2" />
              Danger Zone
            </h3>
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                Once you delete your account, there is no going back. All your posts, messages, connections, and personal data will be permanently erased.
              </p>
              <button
                type="button"
                onClick={requestDeleteAccount}
                disabled={deletingAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center shadow-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletingAccount && !showDeleteModal ? 'Sending OTP...' : 'Delete Account'}
              </button>
            </div>
          </div>

      </motion.div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Account Deletion</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              We've sent an OTP to your email. Please enter it below to permanently delete your account. This action cannot be undone.
            </p>
            <div className="mb-6">
              <AnimatedOTP 
                status={deleteOtpStatus} 
                onChange={(val) => {
                  setDeleteOtp(val);
                  if (deleteOtpStatus === 'error') setDeleteOtpStatus('idle');
                }}
                onClear={() => setDeleteOtp('')}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteOtp('');
                }}
                disabled={deletingAccount}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                disabled={deletingAccount || !deleteOtp || deleteOtp.length !== 6}
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center shadow-sm"
              >
                {deletingAccount ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verify Identity</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              We've sent a 6-digit security code to <strong>{user?.email}</strong>. Please enter it below along with your new password.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">Security Code (OTP)</label>
                <AnimatedOTP 
                  status={passwordOtpStatus} 
                  onChange={(val) => {
                    setPasswordOtp(val);
                    if (passwordOtpStatus === 'error') setPasswordOtpStatus('idle');
                  }}
                  onClear={() => setPasswordOtp('')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordOtp('');
                  setNewPassword('');
                }}
                disabled={isChangingPassword}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPasswordChange}
                disabled={isChangingPassword || passwordOtp.length !== 6 || newPassword.length < 6}
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center shadow-sm"
              >
                {isChangingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Phone Verification Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verify Phone Number</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              We've sent a 6-digit OTP via SMS to <strong>{phoneNumber}</strong>. Please enter it below.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <AnimatedOTP 
                  status={phoneOtpStatus} 
                  onChange={(val) => {
                    setPhoneOtp(val);
                    if (phoneOtpStatus === 'error') setPhoneOtpStatus('idle');
                  }}
                  onClear={() => setPhoneOtp('')}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowPhoneModal(false);
                  setPhoneOtp('');
                }}
                disabled={isVerifyingPhone}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyPhone}
                disabled={isVerifyingPhone || phoneOtp.length !== 6}
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center shadow-sm"
              >
                {isVerifyingPhone ? 'Verifying...' : 'Verify Phone'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>

      {/* ── Stitch "Under Development" Modal ─────────────────────────────── */}
      {stitchModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setStitchModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-8 text-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1035 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Glow blobs */}
            <div className="absolute top-0 left-0 w-48 h-48 rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, #2563eb, transparent)', transform: 'translate(-40%, -40%)' }} />
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', transform: 'translate(40%, 40%)' }} />

            {/* Icon */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 mx-auto" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)', boxShadow: '0 8px 30px rgba(245,158,11,0.4)' }}>
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
              Stitch Theme
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>Under Development</span>
            </div>

            {/* Message */}
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(241,245,249,0.65)' }}>
              We're crafting something special ✨<br />
              The <strong style={{ color: '#f1f5f9' }}>Stitch</strong> theme is currently being built with a premium dark-glass experience. It'll be ready soon!
            </p>

            {/* Feature bullets */}
            <div className="text-left mb-6 space-y-2">
              {[
                { icon: '🌑', label: 'Dark navy glassmorphism UI' },
                { icon: '⚡', label: 'Blue-to-purple gradient accents' },
                { icon: '📊', label: 'Live data across all pages' },
                { icon: '🎨', label: 'Premium animations & transitions' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-base">{icon}</span>
                  <span className="text-sm" style={{ color: 'rgba(241,245,249,0.75)' }}>{label}</span>
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>Coming</span>
                </div>
              ))}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setStitchModalOpen(false)}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 4px 20px rgba(37,99,235,0.40)' }}
            >
              Got it, I'll wait! 🚀
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;

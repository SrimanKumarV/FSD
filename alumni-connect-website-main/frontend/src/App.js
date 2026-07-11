import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CallProvider } from './contexts/CallContext';
import GlobalCallOverlay from './components/chat/VideoCallOverlay';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Mentorship from './pages/Mentorship';
import Jobs from './pages/Jobs';
import Events from './pages/Events';
import Forum from './pages/Forum';
import Contests from './pages/Contests';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import Network from './pages/Network';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import DevPulse from './pages/DevPulse';
import Leaderboard from './pages/Leaderboard';
import UserProfile from './pages/UserProfile';
import Feedback from './pages/Feedback';
import HelpCentrePage from './pages/HelpCentrePage';

// Legal and Support Pages
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsConditions from './pages/legal/TermsConditions';
import CookiePolicy from './pages/legal/CookiePolicy';
import HelpCentre from './pages/support/HelpCentre';
import ContactUs from './pages/support/ContactUs';
import FAQ from './pages/support/FAQ';


import { WifiOff } from 'lucide-react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry auth errors — they won't resolve without a fresh login
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2; // retry other errors up to 2 times
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // exponential backoff
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false, // never auto-retry mutations
    },
  },
});

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] bg-red-500 text-white text-center py-2 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span className="text-sm font-medium">You are currently offline. Some features may not work.</span>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <Router>
                <CallProvider>
                  <div className="App min-h-screen relative">
                    <OfflineBanner />
                    <GlobalCallOverlay />
                    <div className="animated-bg"></div>

                  <ErrorBoundary>
                    <Routes>
                    {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  
                  {/* Legal and Support Routes */}
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsConditions />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  <Route path="/help" element={<HelpCentre />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/faq" element={<FAQ />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/users/:id" element={
                    <ProtectedRoute>
                      <Layout>
                        <UserProfile />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/feedback" element={
                    <ProtectedRoute>
                      <Layout>
                        <Feedback />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/help-centre" element={
                    <ProtectedRoute>
                      <Layout>
                        <HelpCentrePage />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/network" element={
                    <ProtectedRoute>
                      <Layout>
                        <Network />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/devpulse" element={
                    <ProtectedRoute>
                      <Layout>
                        <DevPulse />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/leaderboard" element={
                    <ProtectedRoute>
                      <Layout>
                        <Leaderboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Layout>
                        <Notifications />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/mentorship" element={
                    <ProtectedRoute>
                      <Layout>
                        <Mentorship />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/jobs" element={
                    <ProtectedRoute>
                      <Layout>
                        <Jobs />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/events" element={
                    <ProtectedRoute>
                      <Layout>
                        <Events />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/forum" element={
                    <ProtectedRoute>
                      <Layout>
                        <Forum />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/contests" element={
                    <ProtectedRoute>
                      <Layout>
                        <Contests />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <Layout>
                        <Chat />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly>
                      <Layout>
                        <Admin />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </ErrorBoundary>
                
                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#22c55e',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
                  </div>
                </CallProvider>
              </Router>

            </NotificationProvider>
          </SocketProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

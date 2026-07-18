import React, { useState, useEffect, Suspense, lazy } from 'react';
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
import FloatingAIAssistant from './components/chat/FloatingAIAssistant';
import { WifiOff } from 'lucide-react';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages - Lazy Loaded for Performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Mentorship = lazy(() => import('./pages/Mentorship'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Events = lazy(() => import('./pages/Events'));
const Forum = lazy(() => import('./pages/Forum'));
const Contests = lazy(() => import('./pages/Contests'));
const Chat = lazy(() => import('./pages/Chat'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Network = lazy(() => import('./pages/Network'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const DevPulse = lazy(() => import('./pages/DevPulse'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Feedback = lazy(() => import('./pages/Feedback'));
const HelpCentrePage = lazy(() => import('./pages/HelpCentrePage'));
const ProjectShowcase = lazy(() => import('./pages/ProjectShowcase'));
const AlumniMap = lazy(() => import('./pages/AlumniMap'));
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'));
const BusinessDirectory = lazy(() => import('./pages/BusinessDirectory'));

// Legal and Support Pages - Lazy Loaded
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/legal/TermsConditions'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const HelpCentre = lazy(() => import('./pages/support/HelpCentre'));
const ContactUs = lazy(() => import('./pages/support/ContactUs'));
const FAQ = lazy(() => import('./pages/support/FAQ'));

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
                    <FloatingAIAssistant />
                    <div className="animated-bg"></div>

                  <ErrorBoundary>
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-screen">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                      </div>
                    }>
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
                  
                  <Route path="/map" element={
                    <ProtectedRoute>
                      <Layout>
                        <AlumniMap />
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
                  
                  <Route path="/devpulse/:userId" element={
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
                  
                  <Route path="/projects" element={
                    <ProtectedRoute>
                      <Layout>
                        <ProjectShowcase />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/resume" element={
                    <ProtectedRoute>
                      <Layout>
                        <ResumeAnalyzer />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/businesses" element={
                    <ProtectedRoute>
                      <Layout>
                        <BusinessDirectory />
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
                </Suspense>
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

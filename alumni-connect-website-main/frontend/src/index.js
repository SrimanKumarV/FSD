import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';
import { registerServiceWorker } from './utils/streakPushNotification';

// Simple-Peer Polyfills for CRA v5 (Webpack 5)
import process from 'process';
import { Buffer } from 'buffer';
window.process = process;
window.Buffer = Buffer;
window.global = window;

const googleClientId =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  '253683997850-ec2t9ae74tnrsadu6enid73lnpeoho7d.apps.googleusercontent.com';

// Initialize Web Push & Streak Service Worker
registerServiceWorker();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

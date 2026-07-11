import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';

// Simple-Peer Polyfills for CRA v5 (Webpack 5)
import process from 'process';
import { Buffer } from 'buffer';
window.process = process;
window.Buffer = Buffer;
window.global = window;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

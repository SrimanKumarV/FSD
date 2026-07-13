import React from 'react';
import { Globe, Code, Terminal, Monitor, Cpu } from 'lucide-react';

const PlatformIcon = ({ platform, className = "w-5 h-5" }) => {
  const p = platform?.toLowerCase() || '';

  if (p.includes('leetcode')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.536-.536.553-1.387.039-1.901l-2.606-2.698c-1.112-1.112-2.756-1.558-4.352-1.558s-3.256.463-4.368 1.558l-4.333 4.38c-1.112 1.113-1.54 2.74-1.54 4.337s.445 3.256 1.557 4.368l4.319 4.363c1.112 1.112 2.74 1.557 4.351 1.557s3.24-.463 4.352-1.557l2.697-2.607c.514-.515.497-1.366-.039-1.901-.535-.536-1.386-.554-1.9-.039z" fill="#FFA116"/>
        <path d="M20.711 11.206l-8.113-8.113c-.535-.536-1.386-.553-1.901-.039-.514.514-.497 1.366.039 1.9l8.113 8.114c.535.535 1.386.553 1.901.038.514-.514.497-1.365-.039-1.9z" fill="#000000" className="dark:fill-white"/>
      </svg>
    );
  }
  
  if (p.includes('codeforces')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="15" y="4" width="4" height="16" fill="#F44336"/>
        <rect x="10" y="9" width="4" height="11" fill="#2196F3"/>
        <rect x="5" y="14" width="4" height="6" fill="#FFC107"/>
      </svg>
    );
  }

  if (p.includes('codechef')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2C8 2 5 5 5 9C5 11 6.5 12.5 6.5 14C5 15 4 17 4 19C4 20.65 5.35 22 7 22H17C18.65 22 20 20.65 20 19C20 17 19 15 17.5 14C17.5 12.5 19 11 19 9C19 5 16 2 12 2Z" fill="#5D4037"/>
        <path d="M8 12C9.5 12 10.5 10 12 10C13.5 10 14.5 12 16 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }

  if (p.includes('hackerrank')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#2EC866"/>
        <path d="M8 9v6M16 9v6M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="square"/>
      </svg>
    );
  }

  if (p.includes('geeksforgeeks') || p.includes('gfg')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4H9v4H7V8h2v4h2V8h2v8z" fill="#2F8D46"/>
      </svg>
    );
  }
  
  if (p.includes('atcoder')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="12" cy="12" r="10" fill="#222"/>
        <path d="M8 16L12 8l4 8M10 13h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }

  // Event platforms
  if (p.includes('meetup')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z" fill="#F64060"/>
        <path d="M7 15l2-6h2l1.5 4 1.5-4h2l2 6H16l-1-3-1.5 3H12l-1.5-3-1 3H7z" fill="white"/>
      </svg>
    );
  }

  if (p.includes('zoom')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#2D8CFF"/>
        <path d="M16 10v4l4 3V7l-4 3v-3H5v10h11v-3z" fill="white"/>
      </svg>
    );
  }

  if (p.includes('google') || p.includes('meet')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M20 6H16L12 10L8 6H4C2.9 6 2 6.9 2 8V16C2 17.1 2.9 18 4 18H8L12 14L16 18H20C21.1 18 22 17.1 22 16V8C22 6.9 21.1 6 20 6Z" fill="#00832D"/>
        <path d="M16 6V18H20C21.1 18 22 17.1 22 16V8C22 6.9 21.1 6 20 6H16Z" fill="#0066DA"/>
        <path d="M4 6H8V18H4C2.9 18 2 17.1 2 16V8C2 6.9 2.9 6 4 6Z" fill="#FFB300"/>
      </svg>
    );
  }

  // Fallbacks
  if (p.includes('coding') || p.includes('hack')) return <Terminal className={className} />;
  
  return <Globe className={className} />;
};

export default PlatformIcon;

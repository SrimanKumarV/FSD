import React, { useState } from 'react';
import { 
  Activity, Code, GitCommit, Trophy, TrendingUp, Settings, 
  ExternalLink, ArrowLeft, Mail, Linkedin, Globe, FileText, CheckCircle2, 
  ChevronDown, ChevronUp, Plus, Play, Info, MoreHorizontal, Award, Box
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import UserAvatar from '../components/UserAvatar';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

// --- STYLES FOR HEATMAP ---
const heatmapStyles = `
  .react-calendar-heatmap .color-empty { fill: #1e1e1e; }
  .react-calendar-heatmap .color-scale-1 { fill: #0e4429; }
  .react-calendar-heatmap .color-scale-2 { fill: #006d32; }
  .react-calendar-heatmap .color-scale-3 { fill: #26a641; }
  .react-calendar-heatmap .color-scale-4 { fill: #39d353; }
  .react-calendar-heatmap text { font-size: 10px; fill: #666; font-weight: 500; }
  .react-calendar-heatmap rect { rx: 2px; ry: 2px; stroke: #151515; stroke-width: 2px; }
  .react-calendar-heatmap rect:hover { stroke: #555; stroke-width: 1px; }
`;

// --- ICONS ---
const LeetCodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.939 5.939 0 0 0 1.271 1.541l5.967 5.68c.231.22.544.326.882.332.334.01.65-.104.89-.319l.505-.46a1.309 1.309 0 0 0 .435-.902 1.328 1.328 0 0 0-.31-.925l-5.625-5.355a2.46 2.46 0 0 1-.314-.35 2.5 2.5 0 0 1-.35-.553 2.81 2.81 0 0 1-.223-.741 2.89 2.89 0 0 1 .046-1.127 2.69 2.69 0 0 1 .28-.797 2.76 2.76 0 0 1 .52-.703l3.8-4.066 5.144-5.504c.224-.24.323-.553.308-.88-.016-.328-.146-.628-.363-.84l-.536-.531a1.353 1.353 0 0 0-.903-.393zm1.666 9.69a1.31 1.31 0 0 0-.916.425l-4.032 4.316a1.314 1.314 0 0 0-.353.916 1.322 1.322 0 0 0 .433.912l5.633 5.36c.23.218.544.326.88.33.334.01.65-.106.889-.32l.504-.461a1.31 1.31 0 0 0 .435-.903 1.327 1.327 0 0 0-.311-.924L12.98 13.98l4.032-4.315a1.314 1.314 0 0 0 .354-.917 1.322 1.322 0 0 0-.434-.911l-5.632-5.36c-.23-.218-.544-.326-.88-.33-.334-.01-.65.105-.889.319l-.504.461a1.309 1.309 0 0 0-.435.903 1.327 1.327 0 0 0 .31.924l5.631 5.365z"/>
  </svg>
);

const HackerRankIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.12 18h-2.24v-6h-5.76v6H6.88V6h2.24v6h5.76V6h2.24v12z"/>
  </svg>
);

const GFGIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500">
    <path d="M12.012 1.996C6.49 1.996 2.011 6.474 2.011 11.997c0 5.522 4.479 10 10.001 10 5.523 0 10.001-4.478 10.001-10 0-5.523-4.478-10-10.001-10zm5.412 14.18c-1.396 1.4-3.342 2.115-5.399 2.115-3.86 0-7.073-2.617-7.85-6.19h2.383c.691 2.378 2.923 4.12 5.467 4.12 1.47 0 2.825-.568 3.86-1.554.912-.87 1.428-1.997 1.55-3.238h-4.321v-2.07h6.666c.036 1.834-.693 3.497-1.856 4.708l-.5.485zm1.905-5.91h-2.383c-.69-2.378-2.923-4.12-5.467-4.12-1.47 0-2.825.568-3.86 1.554-.91.87-1.428 1.997-1.55 3.238h4.321v2.071H3.725C3.689 7.085 4.417 5.422 5.581 4.21L6.08 3.725c1.396-1.4 3.342-2.114 5.399-2.114 3.86 0 7.073 2.617 7.85 6.19h-2.04v-2.193h2.04z"/>
  </svg>
);

// --- MOCK DATA FOR THE 5 TABS ---
const mockData = {
  overview: {
    metrics: { title1: 'Questions Solved', val1: 234, title2: 'Active Days', val2: 41 },
    heatmap: { subs: 129, maxStreak: 16, currentStreak: 0 },
    awards: [{ name: 'C++', stars: 5, color: '#facc15' }],
    distribution: {
      type: 'overview',
      fundamentals: { total: 42, GFG: 7, HR: 35 },
      dsa: { total: 192, Easy: 97, Med: 81, Hard: 14 }
    },
    topics: [
      { topic: 'Arrays', count: 84 }, { topic: 'Math', count: 39 }, { topic: 'String', count: 38 },
      { topic: 'Two Pointers', count: 29 }, { topic: 'HashMap and Set', count: 20 },
      { topic: 'Simulation', count: 20 }, { topic: 'Matrix', count: 19 },
      { topic: 'Dynamic Programming', count: 19 }, { topic: 'DFS', count: 18 }, { topic: 'Trees', count: 18 }
    ]
  },
  leetcode: {
    metrics: { title1: 'Questions Solved', val1: 177, title2: 'Active Days', val2: 41 },
    heatmap: { subs: 106, maxStreak: 16, currentStreak: 0 },
    awards: [],
    distribution: {
      type: 'leetcode',
      dsa: { total: 177, Easy: 90, Med: 73, Hard: 14 }
    },
    topics: [
      { topic: 'Arrays', count: 83 }, { topic: 'Math', count: 35 }, { topic: 'String', count: 38 },
      { topic: 'Two Pointers', count: 29 }, { topic: 'HashMap and Set', count: 20 },
      { topic: 'Simulation', count: 20 }, { topic: 'Dynamic Programming', count: 15 }, 
      { topic: 'Matrix', count: 13 }, { topic: 'DFS', count: 17 }, { topic: 'Bit Manipulation', count: 17 },
      { topic: 'Trees', count: 16 }, { topic: 'Binary Tree', count: 16 }, { topic: 'BFS', count: 14 },
      { topic: 'Binary Search', count: 13 }, { topic: 'Recursion', count: 13 }, { topic: 'Sorting', count: 13 },
      { topic: 'Linked Lists', count: 13 }, { topic: 'Backtracking', count: 11 }, { topic: 'Greedy Algorithms', count: 7 },
      { topic: 'Divide and Conquer', count: 5 }, { topic: 'Sliding Window', count: 4 }, { topic: 'Queue and Stacks', count: 3 },
      { topic: 'Union-Find', count: 3 }, { topic: 'Design', count: 2 }, { topic: 'Graph Theory', count: 2 },
      { topic: 'Topological Sort', count: 2 }, { topic: 'Enumeration', count: 2 }, { topic: 'Monotonic Stack', count: 2 },
      { topic: 'Game Theory', count: 1 }, { topic: 'Trie', count: 1 }
    ]
  },
  hackerrank: {
    metrics: { title1: 'Questions Solved', val1: 35, title2: 'Active Days', val2: 0 },
    heatmap: { subs: 0, maxStreak: 0, currentStreak: 0 },
    awards: [{ name: 'C++', stars: 5, color: '#facc15' }],
    distribution: {
      type: 'hackerrank',
      problems: { total: 35, 'C++': 35 },
      certs: 0
    },
    topics: []
  },
  gfg: {
    metrics: { title1: 'Questions Solved', val1: 22, title2: 'Active Days', val2: 7 },
    heatmap: { subs: 23, maxStreak: 2, currentStreak: 0 },
    awards: [],
    distribution: {
      type: 'gfg',
      fundamentals: { total: 7, Basic: 7, School: 0 },
      dsa: { total: 15, Easy: 7, Med: 8, Hard: 0 }
    },
    topics: [
      { topic: 'Algorithms', count: 12 }, { topic: 'Mathematical', count: 7 }, { topic: 'Binary Search Tree', count: 3 },
      { topic: 'Graphs', count: 3 }, { topic: 'Trees', count: 2 }, { topic: 'BFS', count: 2 }, { topic: 'Searching', count: 2 },
      { topic: 'Bit Magic', count: 1 }, { topic: 'Queue and Stacks', count: 1 }, { topic: 'Binary Search', count: 1 },
      { topic: 'DFS', count: 1 }, { topic: 'palindrome', count: 1 }, { topic: 'Backtracking', count: 1 }, 
      { topic: 'Matrix', count: 1 }, { topic: 'Union & Find', count: 1 }, { topic: 'Arrays', count: 1 }
    ]
  },
  github: {
    metrics: { title1: 'Total Contributions', val1: 25, title2: 'Total Active Days', val2: 13 },
    heatmap: { subs: 17, maxStreak: 2, currentStreak: 0 },
    awards: [],
    distribution: { type: 'github' },
    topics: [],
    languages: [
      { name: 'JavaScript', pct: 79, color: '#3b82f6' }, { name: 'HTML', pct: 9, color: '#ef4444' },
      { name: 'CSS', pct: 3, color: '#22c55e' }, { name: 'TypeScript', pct: 4, color: '#0ea5e9' },
      { name: 'Python', pct: 3, color: '#eab308' }, { name: 'Others', pct: 2, color: '#f97316' }
    ],
    stats: { Stars: 0, Commits: 5, PRs: 0, Issues: 0 },
    projects: [
      { name: 'Air Pollution Prediction', repo: 'SrimanKumarV/Air_Pollution_Prediction', lang: 'Python', desc: '"Deep learning for cleaner air: Transforming environmental data into actionable pollution insights."', img: 'https://images.unsplash.com/photo-1611273426858-450d8e814323?w=800&auto=format&fit=crop&q=60' },
      { name: 'Decoding Palindrome Verification', repo: 'SrimanKumarV/Decoding-Palindrome-Verification', lang: 'HTML', desc: 'Iterative vs. Recursive Algorithms, Bridging the gap between theoretical math and real-world CPU performance. An empirical deep-dive into iterative versus recursive algorithms. Unmasking the hidden overhead behind classic algorithm designs.', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=60' },
      { name: 'Railway Track Allocation System', repo: 'SrimanKumarV/OS-micro-project', lang: 'JavaScript', desc: 'The system is a real-world translation of the Banker\'s Algorithm, a classic operating system mechanism designed for deadlock avoidance. Instead of a computer cautiously allocating memory to different software programs, this simulation acts as a hyper-vigilant railway dispatcher.', img: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=60', tags: ['HTML'] },
      { name: 'Student Feedback Form', repo: 'SrimanKumarV/FSD-Tutorial-1', lang: 'CSS', desc: '"Empowering education through actionable insights: A seamless, dynamic student feedback portal."', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60', tags: ['JavaScript', 'HTML'] },
      { name: 'Sentiment Analysis App', repo: 'SrimanKumarV/SentimentAnalysis', lang: 'Python', desc: 'Analyzing sentiments in text.', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60' }
    ]
  }
};


// ── Helper Components ─────────────────────────────────────────────────────────

const BadgeHex = ({ badge }) => (
  <div className="w-20 h-24 relative flex items-center justify-center filter drop-shadow-xl transition-transform hover:scale-105">
    <svg viewBox="0 0 100 115" className="absolute inset-0 w-full h-full" style={{ color: badge.color || '#eab308' }}>
      <polygon points="50 0 100 28 100 86 50 115 0 86 0 28" fill="currentColor" opacity="0.9" />
      <polygon points="50 3 97 30 97 84 50 112 3 84 3 30" fill="#111" />
      <polygon points="50 6 94 32 94 82 50 109 6 82 6 32" fill="currentColor" />
    </svg>
    <div className="relative z-10 flex flex-col items-center justify-center text-center px-2 text-black">
      <div className="text-[13px] font-black">{badge.name}</div>
      <div className="text-[10px] font-black mt-0.5">{badge.name}</div>
      {badge.stars > 0 && (
        <div className="text-[10px] font-black tracking-tighter leading-none mt-1">
          {'★'.repeat(Math.min(badge.stars, 5))}
        </div>
      )}
    </div>
  </div>
);

const PlatformAccordionItem = ({ platform, icon: Icon, isSelected, onClick }) => (
  <div onClick={onClick} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors group ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}`}>
    <div className="flex items-center gap-3">
      <Icon />
      <span className={`text-[13px] font-semibold transition-colors ${isSelected ? 'text-white' : 'text-[#e0e0e0] group-hover:text-white'}`}>{platform}</span>
    </div>
    <div className="flex items-center gap-3">
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      <div className="text-gray-500 hover:text-gray-300">
        <ExternalLink className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const SectionAccordion = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-[13px] font-bold text-[#888] bg-[#1a1a1a] px-3 rounded-md mb-2 hover:bg-[#222]"
      >
        {title}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ── Main Component ────────────────────────────────────────────────────────────
const DevPulse = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const d = mockData[selectedTab];

  // Dummy calendar points for UI (to make heatmaps look active)
  const heatmapPoints = Array.from({ length: d.heatmap.subs }, (_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - (i % 180));
    return { date: dt.toISOString().split('T')[0], count: Math.floor(Math.random() * 4) + 1 };
  });

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#ff8c00]/30 selection:text-white pb-20">
      <style>{heatmapStyles}</style>

      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-[280px] bg-[#111111] border-r border-[#222] hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
        {/* Top Toggles */}
        <div className="p-4 flex items-center justify-between text-xs text-[#888] font-semibold border-b border-[#222]">
          <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5"/> Public Profile</div>
          <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-pointer"><div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"/></div>
        </div>
        <div className="p-4 flex items-center justify-between text-xs text-[#888] font-semibold border-b border-[#222] cursor-pointer hover:text-white transition-colors">
          <div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5"/> Refresh Now</div>
          <Settings className="w-3.5 h-3.5"/>
        </div>

        {/* Profile Info */}
        <div className="p-6 flex flex-col items-center text-center border-b border-[#222]">
          <div className="relative group mb-3 cursor-pointer">
            <div className="w-24 h-24 rounded-full border-[3px] border-[#333] shadow-lg bg-[#3e2723] flex items-center justify-center text-4xl font-normal text-[#d7ccc8]">
              S
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#222] border border-[#444] rounded-md flex items-center justify-center text-[#888] group-hover:text-white transition-colors">
              <span className="text-[10px]">✏️</span>
            </div>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">SRIMAN KUMAR</h2>
          <div className="flex items-center gap-1 mt-1 text-[13px] text-[#3b82f6] font-semibold cursor-pointer" onClick={() => setSelectedTab('overview')}>
            @Sriman_Kumar_V <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
          </div>
          <button className="mt-4 w-full py-2 bg-transparent border border-[#ff8c00] text-[#ff8c00] text-sm font-bold rounded-lg hover:bg-[#ff8c00] hover:text-black transition-all">
            Get your Codolio Card
          </button>
          
          <div className="flex items-center gap-5 mt-6 text-[#777]">
            <Mail className="w-4 h-4 hover:text-white cursor-pointer transition-colors"/>
            <Linkedin className="w-4 h-4 hover:text-white cursor-pointer transition-colors"/>
            <span className="text-xl leading-none hover:text-white cursor-pointer transition-colors font-serif italic">X</span>
            <Globe className="w-4 h-4 hover:text-white cursor-pointer transition-colors"/>
            <FileText className="w-4 h-4 hover:text-white cursor-pointer transition-colors"/>
          </div>
        </div>

        <div className="p-4 space-y-3 border-b border-[#222] text-xs font-semibold text-[#888]">
          <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5"/> India</div>
          <div className="flex items-center gap-2"><Award className="w-3.5 h-3.5"/> Kongu Engineering College</div>
        </div>

        {/* Accordions */}
        <div className="p-4 flex-1">
          <h3 className="text-xs font-bold text-[#666] mb-4">About</h3>
          
          <div className="mb-2" onClick={() => setSelectedTab('overview')} />
          <SectionAccordion title={<span className={selectedTab === 'overview' ? 'text-white' : ''}>Problem Solving Stats</span>}>
            <div className="space-y-1 mb-3">
              <PlatformAccordionItem platform="LeetCode" icon={LeetCodeIcon} isSelected={selectedTab === 'leetcode'} onClick={() => setSelectedTab('leetcode')} />
              <PlatformAccordionItem platform="HackerRank" icon={HackerRankIcon} isSelected={selectedTab === 'hackerrank'} onClick={() => setSelectedTab('hackerrank')} />
              <PlatformAccordionItem platform="GeeksForGeeks" icon={GFGIcon} isSelected={selectedTab === 'gfg'} onClick={() => setSelectedTab('gfg')} />
            </div>
            <div className="flex items-center justify-center gap-1 w-full py-2 text-[#ff8c00] bg-[#ff8c00]/10 border border-[#ff8c00]/20 rounded-md text-[13px] font-bold hover:bg-[#ff8c00]/20 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /> Add Platform
            </div>
          </SectionAccordion>
          
          <SectionAccordion title={<span className={selectedTab === 'github' ? 'text-white' : ''}>Development Stats</span>}>
            <PlatformAccordionItem platform="GitHub" icon={() => <GitCommit className="w-5 h-5 text-white" />} isSelected={selectedTab === 'github'} onClick={() => setSelectedTab('github')} />
          </SectionAccordion>

          <div className="mt-6 mb-2 flex items-center justify-between text-xs">
            <span className="font-bold text-[#a0a0a0]">Leaderboard</span>
            <span className="text-[#3b82f6] font-semibold cursor-pointer underline underline-offset-2">How it works ?</span>
          </div>
          
          {/* Leaderboard Widget */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-4 flex flex-col items-center mt-2 relative overflow-hidden">
             <div className="w-full flex justify-between items-center mb-1">
                <div className="text-[11px] font-bold text-white">Global Rank<br/><span className="text-[#777] font-medium">Based on C Score</span></div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center"><ChevronDown className="w-3 h-3 text-[#777] rotate-90"/></div>
                  <div className="w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center"><ChevronDown className="w-3 h-3 text-[#777] -rotate-90"/></div>
                </div>
             </div>
             <div className="w-full text-2xl font-black text-white mt-1 flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#ccc]"/> 30945
             </div>
             <button className="w-full py-2 bg-[#ff8c00] text-black font-black text-sm rounded-lg hover:bg-orange-500 transition-colors">
               View Leaderboard
             </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#222] space-y-2 text-xs font-semibold text-[#666]">
          <div className="flex justify-between"><span>Profile Views:</span> <span className="text-[#ff8c00]">11</span></div>
          <div className="flex justify-between"><span>Last Refresh:</span> <span>1 second ago</span></div>
          <div className="flex justify-between"><span>Profile Visibility:</span> <span>Public</span></div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 p-4 md:p-6 space-y-4 max-w-[1200px] overflow-hidden">
        
        {/* Rewind Banner */}
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between shadow-xl">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-[#333] font-black text-white">
               Jul
             </div>
             <div>
               <h3 className="text-white font-bold text-[17px] leading-tight">Monthly Rewind Ready!</h3>
               <p className="text-[#888] text-xs font-semibold">See your coding highlights for July 2026</p>
             </div>
           </div>
           <div className="flex items-center gap-4">
             <button className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] font-bold text-sm rounded-lg flex items-center gap-2 transition-colors">
               <Play className="w-3.5 h-3.5 fill-current"/> Watch Rewind
             </button>
             <div className="text-[#555] cursor-pointer hover:text-white px-2">✕</div>
           </div>
        </div>

        {/* Top Grid (Stats + Heatmap) */}
        <div className="flex flex-col xl:flex-row gap-4 h-auto xl:h-[135px]">
           <div className="flex gap-4 w-full xl:w-[400px]">
             <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] p-5 flex flex-col justify-center flex-1 relative">
                <div className="flex justify-between items-start mb-2"><span className="text-[#a0a0a0] text-xs font-bold">{d.metrics.title1}</span><Info className="w-3.5 h-3.5 text-[#555]" /></div>
                <div className="text-4xl font-black text-white">{d.metrics.val1}</div>
             </div>
             <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] p-5 flex flex-col justify-center flex-1 relative">
                <div className="flex justify-between items-start mb-2"><span className="text-[#a0a0a0] text-xs font-bold">{d.metrics.title2}</span><Info className="w-3.5 h-3.5 text-[#555]" /></div>
                <div className="text-4xl font-black text-white">{d.metrics.val2}</div>
             </div>
           </div>
           
           <div className="flex-1 bg-[#181818] border border-[#2a2a2a] rounded-[16px] p-4 flex flex-col shadow-xl overflow-hidden relative">
             <div className="flex justify-between items-center mb-3 z-10">
                <div className="flex items-center gap-4 text-[9px] uppercase font-bold text-[#888] tracking-wider">
                  <span>{selectedTab === 'github' ? 'Contributions' : 'Submissions'} <strong className="text-white ml-1">{d.heatmap.subs}</strong></span>
                  <span>Max.Streak <strong className="text-white ml-1">{d.heatmap.maxStreak}</strong></span>
                  <span>Current.Streak <strong className="text-white ml-1">{d.heatmap.currentStreak}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <div className="px-2 py-1 bg-[#222] rounded text-white flex items-center gap-2 cursor-pointer border border-[#333]">
                    Current <ChevronDown className="w-3 h-3"/>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-[#777] cursor-pointer hover:text-white"/>
                </div>
             </div>
             
             {/* Mini Heatmap */}
             <div className="flex-1 w-full overflow-hidden relative -mt-1 opacity-90 z-0 scale-y-125 transform-gpu">
               <CalendarHeatmap
                  startDate={new Date(new Date().setMonth(new Date().getMonth() - 6))}
                  endDate={new Date()}
                  values={heatmapPoints}
                  classForValue={(v) => !v ? 'color-empty' : `color-scale-${Math.min(v.count, 4)}`}
                  showMonthLabels={true}
                  showWeekdayLabels={false}
                  gutterSize={2}
                />
             </div>
           </div>
        </div>

        {/* MIDDLE SECTION LOGIC (Varies by Tab) */}
        
        {/* Overview & HR Awards Row */}
        {(selectedTab === 'overview' || selectedTab === 'hackerrank') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Awards */}
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] p-5 flex flex-col shadow-xl min-h-[220px] relative">
              <div className="flex justify-between items-center mb-4">
                 <div>
                   <h3 className="text-white font-bold text-[14px]">Awards</h3>
                   <p className="text-xs text-[#a0a0a0] font-semibold">{d.awards.length}</p>
                 </div>
                 <div className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#2a2a2a] cursor-pointer text-[#666]">
                   <span className="text-[14px]">⤢</span>
                 </div>
              </div>
              <div className="flex-1 flex items-center justify-center relative">
                 {d.awards.map((badge, i) => <BadgeHex key={i} badge={badge} />)}
              </div>
            </div>

            {selectedTab === 'overview' && (
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] shadow-xl p-5 relative overflow-hidden flex flex-col">
                <h3 className="text-white font-bold text-[14px] text-center mb-4">Question Distribution</h3>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 relative divide-y md:divide-y-0 md:divide-x divide-[#2a2a2a]">
                   <div className="flex items-center justify-center gap-6 px-4">
                      <div className="relative w-24 h-24 shrink-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={[{name: 'GFG Basic', value: d.distribution.fundamentals.GFG, color: '#a855f7'}, {name: 'HackerRank', value: d.distribution.fundamentals.HR, color: '#3b82f6'}]} cx="50%" cy="50%" innerRadius={34} outerRadius={44} paddingAngle={2} dataKey="value" stroke="none">
                                {[{color: '#a855f7'}, {color: '#3b82f6'}].map((e, index) => <Cell key={`cell-${index}`} fill={e.color} />)}
                              </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-black text-white">{d.distribution.fundamentals.total}</span></div>
                      </div>
                      <div className="flex-1 space-y-3">
                         <div className="text-center md:text-left mb-2">
                           <h4 className="text-[13px] font-bold text-[#ccc] flex items-center gap-1 justify-center md:justify-start">Fundamentals <Info className="w-3 h-3 text-[#666]"/></h4>
                           <p className="text-[9px] text-[#666] uppercase tracking-wider font-semibold">Based on Platform</p>
                         </div>
                         <div className="flex items-center justify-between text-[11px] font-bold bg-[#111] px-3 py-1.5 rounded-lg border border-[#222]"><span className="text-[#a855f7]">GFG Basic</span><span className="text-white">{d.distribution.fundamentals.GFG}</span></div>
                         <div className="flex items-center justify-between text-[11px] font-bold bg-[#111] px-3 py-1.5 rounded-lg border border-[#222]"><span className="text-[#3b82f6]">HackerRank</span><span className="text-white">{d.distribution.fundamentals.HR}</span></div>
                      </div>
                   </div>
                   <div className="flex items-center justify-center gap-6 px-4 pt-4 md:pt-0">
                      <div className="relative w-24 h-24 shrink-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={[{name: 'Easy', value: d.distribution.dsa.Easy, color: '#10b981'}, {name: 'Med', value: d.distribution.dsa.Med, color: '#eab308'}, {name: 'Hard', value: d.distribution.dsa.Hard, color: '#ef4444'}]} cx="50%" cy="50%" innerRadius={34} outerRadius={44} paddingAngle={2} dataKey="value" stroke="none">
                                {[{color: '#10b981'}, {color: '#eab308'}, {color: '#ef4444'}].map((e, index) => <Cell key={`cell-${index}`} fill={e.color} />)}
                              </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-black text-white">{d.distribution.dsa.total}</span></div>
                      </div>
                      <div className="flex-1 space-y-3">
                         <div className="text-center md:text-left mb-2">
                           <h4 className="text-[13px] font-bold text-[#ccc]">DSA</h4>
                           <p className="text-[9px] text-[#666] uppercase tracking-wider font-semibold">Based on Difficulty</p>
                         </div>
                         <div className="flex items-center justify-between text-[11px] font-bold bg-[#111] px-3 py-1.5 rounded-lg border border-[#222]"><span className="text-[#10b981]">Easy</span><span className="text-white">{d.distribution.dsa.Easy}</span></div>
                         <div className="flex items-center justify-between text-[11px] font-bold bg-[#111] px-3 py-1.5 rounded-lg border border-[#222]"><span className="text-[#eab308]">Medium</span><span className="text-white">{d.distribution.dsa.Med}</span></div>
                         <div className="flex items-center justify-between text-[11px] font-bold bg-[#111] px-3 py-1.5 rounded-lg border border-[#222]"><span className="text-[#ef4444]">Hard</span><span className="text-white">{d.distribution.dsa.Hard}</span></div>
                      </div>
                   </div>
                </div>
              </div>
            )}
            
            {selectedTab === 'hackerrank' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] shadow-xl p-5 flex flex-col justify-center items-center">
                  <h3 className="text-white font-bold text-[14px] mb-4">Problems Solved</h3>
                  <div className="flex items-center justify-center gap-6 w-full">
                      <div className="relative w-[88px] h-[88px] shrink-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={[{value: d.distribution.problems['C++'], color: '#22c55e'}]} cx="50%" cy="50%" innerRadius={34} outerRadius={44} paddingAngle={0} dataKey="value" stroke="none">
                                <Cell fill="#22c55e" />
                              </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-0 flex items-center justify-center"><span className="text-[17px] font-black text-white">{d.distribution.problems.total}</span></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px] font-bold bg-[#222] px-3 py-2 rounded border border-[#333]"><span className="text-[#22c55e]">C++</span><span className="text-white">{d.distribution.problems['C++']}</span></div>
                      </div>
                  </div>
                </div>
                <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] shadow-xl p-5 flex flex-col relative overflow-hidden">
                  <div className="absolute -bottom-8 -right-8 opacity-20"><Award className="w-32 h-32 text-emerald-500" strokeWidth={1} /></div>
                  <h3 className="text-white font-bold text-[14px] mb-1">Certifications</h3>
                  <p className="text-[#a0a0a0] text-xs font-bold">{d.distribution.certs}</p>
                  <div className="flex-1 flex flex-col items-center justify-end z-10">
                     <div className="text-[11px] font-bold text-[#666]">No Awards found</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LeetCode Row */}
        {selectedTab === 'leetcode' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] p-5 flex flex-col shadow-xl min-h-[220px] relative">
              <div className="flex justify-between items-center mb-4">
                 <div><h3 className="text-white font-bold text-[14px]">Awards</h3><p className="text-xs text-[#a0a0a0] font-semibold">{d.awards.length}</p></div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center z-10 text-[11px] font-bold text-[#666]">
                 <div className="mb-2"><Award className="w-16 h-16 text-[#333]" strokeWidth={1} /></div>
                 No Badge found
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-[#181818] border border-[#2a2a2a] rounded-[16px] shadow-xl p-5 flex flex-col relative overflow-hidden">
              <h3 className="text-white font-bold text-[14px] text-center mb-6">DSA Problems Solved</h3>
              <div className="flex items-center justify-center gap-10 flex-1">
                 <div className="relative w-32 h-32 shrink-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{value: d.distribution.dsa.Easy, color: '#10b981'}, {value: d.distribution.dsa.Med, color: '#eab308'}, {value: d.distribution.dsa.Hard, color: '#ef4444'}]} cx="50%" cy="50%" innerRadius={48} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                            {[{color: '#10b981'}, {color: '#eab308'}, {color: '#ef4444'}].map((e, index) => <Cell key={`cell-${index}`} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-black text-white">{d.distribution.dsa.total}</span></div>
                 </div>
                 <div className="w-[180px] space-y-2">
                     <div className="flex items-center justify-between text-[11px] font-bold bg-[#111] px-4 py-2 rounded-lg border border-[#222]"><span className="text-[#10b981]">Easy</span><span className="text-white">{d.distribution.dsa.Easy}</span></div>
                     <div className="flex items-center justify-between text-[11px] font-bold bg-[#111] px-4 py-2 rounded-lg border border-[#222]"><span className="text-[#eab308]">Medium</span><span className="text-white">{d.distribution.dsa.Med}</span></div>
                     <div className="flex items-center justify-between text-[11px] font-bold bg-[#111] px-4 py-2 rounded-lg border border-[#222]"><span className="text-[#ef4444]">Hard</span><span className="text-white">{d.distribution.dsa.Hard}</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* GFG Row */}
        {selectedTab === 'gfg' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] shadow-xl p-5 flex flex-col relative overflow-hidden">
                <h3 className="text-white font-bold text-[14px] text-center mb-6">Fundamentals</h3>
                <div className="flex items-center justify-center gap-6 flex-1">
                  <div className="relative w-[100px] h-[100px] shrink-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{value: d.distribution.fundamentals.Basic, color: '#22c55e'}, {value: 0.1, color: '#555'}]} cx="50%" cy="50%" innerRadius={38} outerRadius={48} paddingAngle={0} dataKey="value" stroke="none">
                            <Cell fill="#22c55e" />
                            <Cell fill="#333" />
                          </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-black text-white">{d.distribution.fundamentals.total}</span></div>
                  </div>
                  <div className="w-[160px] space-y-2">
                     <div className="flex items-center justify-between text-[11px] font-bold bg-[#222] px-4 py-2 rounded-lg"><span className="text-[#22c55e]">Basic</span><span className="text-[#ccc]">{d.distribution.fundamentals.Basic}</span></div>
                     <div className="flex items-center justify-between text-[11px] font-bold bg-[#222] px-4 py-2 rounded-lg"><span className="text-[#eab308]">School</span><span className="text-[#ccc]">{d.distribution.fundamentals.School}</span></div>
                  </div>
                </div>
             </div>
             
             <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] shadow-xl p-5 flex flex-col relative overflow-hidden">
                <h3 className="text-white font-bold text-[14px] text-center mb-6">DSA Problems Solved</h3>
                <div className="flex items-center justify-center gap-6 flex-1">
                  <div className="relative w-[100px] h-[100px] shrink-0">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{value: d.distribution.dsa.Easy, color: '#10b981'}, {value: d.distribution.dsa.Med, color: '#eab308'}, {value: 0.1, color: '#ef4444'}]} cx="50%" cy="50%" innerRadius={38} outerRadius={48} paddingAngle={2} dataKey="value" stroke="none">
                            {[{color: '#10b981'}, {color: '#eab308'}, {color: '#ef4444'}].map((e, index) => <Cell key={`cell-${index}`} fill={e.color} />)}
                          </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-black text-white">{d.distribution.dsa.total}</span></div>
                  </div>
                  <div className="w-[160px] space-y-2">
                     <div className="flex items-center justify-between text-[11px] font-bold bg-[#222] px-4 py-1.5 rounded-lg"><span className="text-[#10b981]">Easy</span><span className="text-[#ccc]">{d.distribution.dsa.Easy}</span></div>
                     <div className="flex items-center justify-between text-[11px] font-bold bg-[#222] px-4 py-1.5 rounded-lg"><span className="text-[#eab308]">Medium</span><span className="text-[#ccc]">{d.distribution.dsa.Med}</span></div>
                     <div className="flex items-center justify-between text-[11px] font-bold bg-[#222] px-4 py-1.5 rounded-lg"><span className="text-[#ef4444]">Hard</span><span className="text-[#ccc]">{d.distribution.dsa.Hard}</span></div>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* GitHub Specific Row */}
        {selectedTab === 'github' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] shadow-xl p-5 flex flex-col relative overflow-hidden">
               <h3 className="text-white font-bold text-[13px] mb-6">Languages</h3>
               <div className="w-full h-2 rounded-full overflow-hidden flex mb-6">
                 {d.languages.map(l => (
                   <div key={l.name} style={{ width: `${l.pct}%`, backgroundColor: l.color }} className="h-full" />
                 ))}
               </div>
               <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                 {d.languages.map(l => (
                   <div key={l.name} className="flex items-center gap-2 text-[11px] font-bold text-[#aaa]">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }}/>
                     <span className="w-16">{l.name}</span> <span className="text-[#666]">{l.pct}%</span>
                   </div>
                 ))}
               </div>
            </div>
            
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] shadow-xl p-5 flex flex-col relative overflow-hidden">
               <h3 className="text-white font-bold text-[13px] mb-4">Stats</h3>
               <div className="flex flex-col gap-2 justify-center flex-1">
                 {Object.entries(d.stats).map(([k, v]) => (
                   <div key={k} className="flex justify-between items-center text-[12px] font-bold">
                     <span className="flex items-center gap-2 text-[#ccc]">
                       {k === 'Stars' && <span className="text-amber-400 text-sm">⭐</span>}
                       {k === 'Commits' && <span className="text-orange-500 text-sm">--O-</span>}
                       {k === 'PRs' && <span className="text-green-500 text-sm">ᛘ</span>}
                       {k === 'Issues' && <span className="text-red-500 text-sm">⚠</span>}
                       {k}
                     </span>
                     <span className="text-white">{v}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* TOPICS SECTION (Only if topics exist) */}
        {d.topics?.length > 0 && (
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] p-6 shadow-xl relative min-h-[350px]">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold text-[14px]">DSA Topic Analysis</h3>
                <Info className="w-4 h-4 text-[#555]"/>
             </div>
             <div className="flex flex-col gap-1.5">
               {d.topics.slice(0, selectedTab === 'leetcode' ? 30 : 16).map((item, i) => {
                 const maxCount = d.topics[0].count;
                 const widthPct = (item.count / maxCount) * 100;
                 return (
                   <div key={item.topic} className="flex items-center text-[11px] font-semibold">
                     <div className="w-[140px] text-right pr-4 text-[#bbb] truncate">{item.topic}</div>
                     <div className="flex-1 h-[18px] flex items-center group cursor-default">
                       <div className="h-full bg-[#2563eb] flex items-center group-hover:bg-[#3b82f6] transition-colors relative min-w-[20px]" style={{ width: `${widthPct}%` }}>
                         <span className={`text-white text-[9px] font-bold absolute ${widthPct < 5 ? 'left-full ml-1 text-[#aaa]' : 'right-2'}`}>{item.count}</span>
                       </div>
                     </div>
                   </div>
                 )
               })}
             </div>
             {selectedTab !== 'gfg' && (
               <div className="mt-6 flex justify-center text-[#555] cursor-pointer hover:text-white">
                 <ChevronDown className="w-5 h-5"/>
               </div>
             )}
          </div>
        )}

        {/* PROJECTS SECTION (GitHub Tab) */}
        {selectedTab === 'github' && (
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-[16px] p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-[14px]">Projects</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-[#ff8c00]/10 border border-[#ff8c00]/30 text-[#ff8c00] rounded text-[10px] font-bold flex items-center gap-1 hover:bg-[#ff8c00]/20 transition-colors">
                  <Plus className="w-3 h-3"/> ADD PROJECT
                </button>
                <div className="p-1 border border-[#333] rounded text-[#666]"><MoreHorizontal className="w-3.5 h-3.5"/></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {d.projects.map((proj, i) => (
                 <div key={i} className="bg-[#111] border border-[#222] rounded-[14px] overflow-hidden group cursor-pointer flex flex-col">
                   <div className="h-36 w-full overflow-hidden relative">
                     <img src={proj.img} alt={proj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"/>
                     <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-100"/>
                   </div>
                   <div className="p-4 pt-1 flex-1 flex flex-col">
                     <div className="flex items-center justify-between mb-1">
                       <h4 className="text-white font-bold text-[13px] truncate pr-2">{proj.name}</h4>
                       <ExternalLink className="w-3.5 h-3.5 text-[#666] hover:text-white shrink-0"/>
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] text-[#888] font-semibold mb-2 bg-[#1a1a1a] w-fit px-2 py-0.5 rounded border border-[#2a2a2a]">
                       <GitCommit className="w-3 h-3"/> {proj.repo}
                     </div>
                     <p className="text-[11px] text-[#888] leading-snug line-clamp-3 mb-4 flex-1">
                       {proj.desc}
                     </p>
                     <div className="flex items-center gap-2 mt-auto">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#999]">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.languages.find(l => l.name === proj.lang)?.color || '#666' }}/>
                          {proj.lang}
                        </div>
                        {proj.tags && proj.tags.map(t => (
                          <div key={t} className="flex items-center gap-1.5 text-[9px] font-bold text-[#999]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.languages.find(l => l.name === t)?.color || '#666' }}/>
                            {t}
                          </div>
                        ))}
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default DevPulse;

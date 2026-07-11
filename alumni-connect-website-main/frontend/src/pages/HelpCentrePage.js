import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy, Search, ChevronDown, ChevronUp,
  BookOpen, Users, Briefcase, Calendar, MessageSquare,
  Code, Activity, Trophy, Shield, Zap, Mail, ExternalLink
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
const GUIDES = [
  { icon: Users,       color: '#6366f1', label: 'Network & Follow',   desc: 'How to follow alumni, accept requests, and build your network.' },
  { icon: Activity,    color: '#06b6d4', label: 'DevPulse Setup',     desc: 'Link GitHub, LeetCode, HackerRank and GFG to track your score.' },
  { icon: Briefcase,   color: '#f59e0b', label: 'Applying to Jobs',   desc: 'Browse job listings and send applications to alumni postings.' },
  { icon: Users,       color: '#8b5cf6', label: 'Mentorship',         desc: 'Request a mentor, accept sessions, and track your progress.' },
  { icon: Calendar,    color: '#10b981', label: 'Events',             desc: 'Register for events, get reminders, and explore archives.' },
  { icon: MessageSquare,color:'#ec4899', label: 'Forum & Posts',      desc: 'Create posts, reply to threads, and earn reputation.' },
  { icon: Code,        color: '#f97316', label: 'Contests',           desc: 'Join contests, submit entries, and view leaderboards.' },
  { icon: Trophy,      color: '#eab308', label: 'Leaderboard',        desc: 'Understand how the Alumnex Score is calculated and ranked.' },
  { icon: Shield,      color: '#64748b', label: 'Privacy & Safety',   desc: 'Control your profile visibility and report concerns.' },
];

const FAQ_ITEMS = [
  {
    category: 'Account',
    items: [
      {
        q: 'How do I verify my email?',
        a: 'After registering, you\'ll receive a verification email. Click the link inside to activate your account. If you didn\'t receive it, check your spam folder or use the "Resend" option on the login page.'
      },
      {
        q: 'How do I change my password?',
        a: 'Go to Settings → Security. Enter your current password, then your new password twice to confirm. Changes take effect immediately.'
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes. Go to Settings → Danger Zone → Delete Account. You\'ll receive an OTP on your email to confirm. This action is permanent and cannot be undone.'
      },
    ]
  },
  {
    category: 'DevPulse',
    items: [
      {
        q: 'How is the Alumnex Score calculated?',
        a: 'GitHub: 1pt/repo + 2pts/follower. LeetCode: Easy=2pts, Medium=5pts, Hard=10pts. HackerRank: 10pts/badge. GFG: coding score ÷ 10. The total is capped at 1000.'
      },
      {
        q: 'My HackerRank / GFG stats are showing "—". Why?',
        a: 'Stats are cached for 2 hours. If you just linked your account, wait a moment and refresh. If the problem persists, ensure your profile is public on those platforms.'
      },
      {
        q: 'How do I verify my profiles?',
        a: 'Go to Settings → DevPulse Integrations → Generate Code. Paste that code in your public bio on the platform (e.g. GitHub bio, LeetCode "About Me"), then click Verify.'
      },
    ]
  },
  {
    category: 'Network',
    items: [
      {
        q: 'How do I follow someone?',
        a: 'Go to the Network page, search for a user, and click Follow. They\'ll receive a follow request notification and must accept before you can see their content.'
      },
      {
        q: 'Can I see who views my profile?',
        a: 'Currently this feature is not available, but it\'s on our roadmap. Stay tuned for updates!'
      },
    ]
  },
  {
    category: 'Chat & Calls',
    items: [
      {
        q: 'Why is my video call connecting but has no audio?',
        a: 'Make sure your browser has permission to access your microphone. In Chrome, click the camera icon in the address bar and allow microphone access, then retry the call.'
      },
      {
        q: 'Who can I message?',
        a: 'You can start a chat with any verified user. Go to Chat → New Conversation and search by name or email.'
      },
    ]
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const GuideCard = ({ icon: Icon, color, label, desc }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="p-5 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-colors cursor-default"
    style={{ background: '#0f172a' }}
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <p className="text-sm font-semibold text-white mb-1">{label}</p>
    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
  </motion.div>
);

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-700/50 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between py-4 text-left hover:text-indigo-400 transition-colors gap-4"
      >
        <span className={`text-sm font-medium transition-colors ${open ? 'text-indigo-400' : 'text-white'}`}>{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
               : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-slate-400 leading-relaxed pb-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const HelpCentrePage = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => ['All', ...FAQ_ITEMS.map(f => f.category)], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQ_ITEMS.map(section => ({
      ...section,
      items: section.items.filter(
        item =>
          (activeCategory === 'All' || activeCategory === section.category) &&
          (!q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q))
      )
    })).filter(s => s.items.length > 0);
  }, [search, activeCategory]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-10 relative overflow-hidden text-center"
        style={{ background: 'linear-gradient(135deg,#0f0c29,#1e1b4b,#0f172a)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-indigo-600/15 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-5">
            <LifeBuoy className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Help Centre</h1>
          <p className="text-slate-400 mb-7 max-w-lg mx-auto">
            Search our knowledge base, browse guides, or reach out to our support team.
          </p>
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search questions, topics, features…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Guides */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" /> Quick Guides
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GUIDES.map(g => <GuideCard key={g.label} {...g} />)}
        </div>
      </motion.div>

      {/* FAQs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-cyan-400" /> Frequently Asked Questions
        </h2>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : 'border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              }`}
            >{cat}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-10 h-10 mx-auto mb-3 text-slate-700" />
            <p className="font-medium">No results for "{search}"</p>
            <p className="text-sm mt-1">Try a different keyword or browse categories above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(section => (
              <div key={section.category} className="rounded-2xl border border-slate-700/50 px-5" style={{ background: '#0f172a' }}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-4 pb-2">{section.category}</p>
                {section.items.map(item => <FaqItem key={item.q} {...item} />)}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Still need help */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-3xl p-8 border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{ background: '#0f172a' }}
      >
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Still need help?</h3>
          <p className="text-sm text-slate-400">Can't find what you're looking for? Submit feedback or send us an email.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Link
            to="/feedback"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" /> Submit Feedback
          </Link>
          <a
            href="mailto:support@alumnex.com"
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            <Mail className="w-4 h-4" /> Email Us
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </motion.div>

    </div>
  );
};

export default HelpCentrePage;

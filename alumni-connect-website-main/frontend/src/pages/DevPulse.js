import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Activity, Code, GitCommit, Trophy, TrendingUp, AlertCircle, Settings, ExternalLink, Star, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const heatmapStyles = `
  .react-calendar-heatmap .color-empty { fill: #1e293b; }
  .react-calendar-heatmap .color-scale-1 { fill: #064e3b; }
  .react-calendar-heatmap .color-scale-2 { fill: #059669; }
  .react-calendar-heatmap .color-scale-3 { fill: #10b981; }
  .react-calendar-heatmap .color-scale-4 { fill: #34d399; }
  .react-calendar-heatmap text { font-size: 9px; fill: #64748b; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const getPlatformUrl = (stats, usernames, platform) => {
  // Use the url stored in stats first; fall back to constructing one from username
  if (stats?.[platform]?.url) return stats[platform].url;
  const u = usernames?.[platform]?.username;
  if (!u) return null;
  const bases = {
    github: `https://github.com/${u}`,
    leetcode: `https://leetcode.com/${u}`,
    hackerrank: `https://www.hackerrank.com/profile/${u}`,
    gfg: `https://www.geeksforgeeks.org/user/${u}/`,
  };
  return bases[platform] || null;
};

// ── Sub-components ────────────────────────────────────────────────────────────
const ScoreRing = ({ score, max = 1000 }) => {
  const pct = Math.min(score / max, 1);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-3xl font-black text-white"
        >{score}</motion.div>
        <div className="text-xs text-slate-400 font-medium">/ {max}</div>
      </div>
    </div>
  );
};

const PlatformCard = ({ platform, icon: Icon, label, color, bgGradient, stats, username, isVerified, url }) => {
  const content = (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="relative rounded-2xl p-5 border border-white/5 overflow-hidden cursor-pointer h-full"
      style={{ background: bgGradient }}
    >
      {/* glow blob */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl" style={{ background: color }} />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">{label}</p>
            {username && <p className="text-sm font-semibold text-slate-200">@{username}</p>}
          </div>
        </div>
        {isVerified && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Verified</span>
        )}
      </div>

      {stats ? (
        <div className="relative z-10 space-y-1">
          {platform === 'github' && (
            <>
              <p className="text-3xl font-black text-white">{stats.publicRepos ?? '—'}</p>
              <p className="text-xs text-slate-400">{stats.followers ?? 0} followers · {stats.following ?? 0} following</p>
            </>
          )}
          {platform === 'leetcode' && (
            <>
              <p className="text-3xl font-black text-white">{stats.totalSolved ?? '—'}</p>
              <p className="text-xs text-slate-400">problems solved · rank #{(stats.ranking ?? '').toLocaleString()}</p>
              <div className="flex gap-2 mt-2">
                {[['Easy', stats.easySolved, '#10b981'], ['Med', stats.mediumSolved, '#f59e0b'], ['Hard', stats.hardSolved, '#ef4444']].map(([d, v, c]) => (
                  <span key={d} className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${c}22`, color: c }}>
                    {d}: {v ?? 0}
                  </span>
                ))}
              </div>
            </>
          )}
          {platform === 'hackerrank' && (
            <>
              <p className="text-3xl font-black text-white">{stats.badgesCount ?? '—'}</p>
              <p className="text-xs text-slate-400">badges earned · level {stats.level ?? 1}</p>
            </>
          )}
          {platform === 'gfg' && (
            <>
              <p className="text-3xl font-black text-white">{stats.codingScore ?? '—'}</p>
              <p className="text-xs text-slate-400">{stats.problemsSolved ?? 0} problems solved</p>
            </>
          )}
        </div>
      ) : (
        <div className="relative z-10">
          <p className="text-slate-500 text-sm">Not linked yet</p>
        </div>
      )}

      {url && (
        <div className="absolute bottom-4 right-4 z-10">
          <ExternalLink className="w-4 h-4 text-slate-500" />
        </div>
      )}
    </motion.div>
  );

  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full">{content}</a>
  ) : (
    <Link to="/settings" className="block h-full">{content}</Link>
  );
};

const StatPill = ({ label, value, color }) => (
  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
    <span className="text-sm text-slate-400">{label}</span>
    <span className="text-sm font-bold" style={{ color }}>{value}</span>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const DevPulse = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery(
    ['dev-activity', user?.email],
    () => api.get(`/dev-activity/${user?.email}`),
    { enabled: !!user?.email, retry: false }
  );

  const stats = data?.data?.stats;
  const usernames = data?.data?.usernames;
  const alumnexScore = data?.data?.alumnexScore || 0;

  const heatmapData = useMemo(() => {
    const today = new Date();
    const points = [];
    const intensity = Math.max(1, Math.floor(alumnexScore / 100));
    for (let i = 0; i < 180; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (Math.random() < (alumnexScore / 900)) {
        points.push({ date: d.toISOString().split('T')[0], count: Math.floor(Math.random() * intensity) + 1 });
      }
    }
    return points;
  }, [alumnexScore]);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  const leetcodeBar = stats?.leetcode ? [
    { name: 'Easy', value: stats.leetcode.easySolved || 0, fill: '#10b981' },
    { name: 'Medium', value: stats.leetcode.mediumSolved || 0, fill: '#f59e0b' },
    { name: 'Hard', value: stats.leetcode.hardSolved || 0, fill: '#ef4444' },
  ] : [];

  const radarData = [
    { subject: 'Algorithms', A: Math.min((stats?.leetcode?.totalSolved || 0) / 5, 100) },
    { subject: 'Consistency', A: Math.min((alumnexScore / 10), 100) },
    { subject: 'Open Source', A: Math.min(((stats?.github?.followers || 0) * 5) + ((stats?.github?.publicRepos || 0) * 2), 100) },
    { subject: 'Competitions', A: Math.min((stats?.hackerrank?.badgesCount || 0) * 15, 100) },
    { subject: 'Core CS', A: Math.min((stats?.gfg?.codingScore || 0) / 5, 100) },
  ];

  const scoreBreakdown = [
    { label: 'GitHub', value: ((stats?.github?.publicRepos || 0) * 1 + (stats?.github?.followers || 0) * 2), color: '#94a3b8' },
    { label: 'LeetCode', value: ((stats?.leetcode?.easySolved || 0) * 2 + (stats?.leetcode?.mediumSolved || 0) * 5 + (stats?.leetcode?.hardSolved || 0) * 10), color: '#f59e0b' },
    { label: 'HackerRank', value: (stats?.hackerrank?.badgesCount || 0) * 10, color: '#22c55e' },
    { label: 'GFG', value: Math.floor((stats?.gfg?.codingScore || 0) / 10), color: '#10b981' },
  ];

  const platforms = [
    {
      platform: 'github',
      label: 'GitHub',
      icon: GitCommit,
      color: '#94a3b8',
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      stats: stats?.github,
      username: usernames?.github?.username,
      isVerified: usernames?.github?.isVerified,
      url: getPlatformUrl(stats, usernames, 'github'),
    },
    {
      platform: 'leetcode',
      label: 'LeetCode',
      icon: Code,
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #1a1205 0%, #1e1a0a 100%)',
      stats: stats?.leetcode,
      username: usernames?.leetcode?.username,
      isVerified: usernames?.leetcode?.isVerified,
      url: getPlatformUrl(stats, usernames, 'leetcode'),
    },
    {
      platform: 'hackerrank',
      label: 'HackerRank',
      icon: Trophy,
      color: '#22c55e',
      bgGradient: 'linear-gradient(135deg, #021a0a 0%, #0a1f0f 100%)',
      stats: stats?.hackerrank,
      username: usernames?.hackerrank?.username,
      isVerified: usernames?.hackerrank?.isVerified,
      url: getPlatformUrl(stats, usernames, 'hackerrank'),
    },
    {
      platform: 'gfg',
      label: 'GeeksforGeeks',
      icon: TrendingUp,
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #011810 0%, #072117 100%)',
      stats: stats?.gfg,
      username: usernames?.gfg?.username,
      isVerified: usernames?.gfg?.isVerified,
      url: getPlatformUrl(stats, usernames, 'gfg'),
    },
  ];

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-56 rounded-3xl bg-slate-800/60" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-44 rounded-2xl bg-slate-800/60" />)}
        </div>
        <div className="h-48 rounded-3xl bg-slate-800/60" />
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  const hasNoProfiles = error?.response?.status === 404 ||
    (!usernames?.github?.username && !usernames?.leetcode?.username &&
     !usernames?.hackerrank?.username && !usernames?.gfg?.username);

  if (hasNoProfiles) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center mb-8"
        >
          <Activity className="w-14 h-14 text-indigo-400" />
        </motion.div>
        <h2 className="text-4xl font-black text-white mb-3">Welcome to DevPulse</h2>
        <p className="text-slate-400 max-w-lg mb-8 text-lg leading-relaxed">
          Connect your coding profiles across GitHub, LeetCode, HackerRank, and GeeksforGeeks to build your Alumnex Score and showcase your developer journey.
        </p>
        <Link
          to="/settings"
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/25 flex items-center gap-2 text-lg"
        >
          <Settings className="w-5 h-5" /> Connect Accounts
        </Link>
      </div>
    );
  }

  // ── Main dashboard ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <style>{heatmapStyles}</style>

      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}
      >
        {/* decorative blobs */}
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: title */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">DevPulse Dashboard</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2 leading-tight">
              Your Coding <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Portfolio</span>
            </h1>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Aggregated stats from all your coding platforms in one place. Boost your score by solving more problems!
            </p>
            {data?.data?.lastUpdated && (
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Last synced {new Date(data.data.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>

          {/* Right: Score ring + breakdown */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-2xl px-8 py-6 backdrop-blur-sm">
              <ScoreRing score={alumnexScore} />
              <div className="space-y-2 min-w-[140px]">
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">Score Breakdown</p>
                {scoreBreakdown.map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between gap-6">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-xs font-bold" style={{ color }}>+{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1"><Target className="w-3 h-3" /> Alumnex Score (max 1000)</p>
          </div>
        </div>
      </motion.div>

      {/* ── Platform Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {platforms.map((p) => (
          <PlatformCard key={p.platform} {...p} />
        ))}
      </motion.div>

      {/* ── Heatmap ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-3xl border border-slate-700/50 p-7"
        style={{ background: '#0f172a' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Activity Heatmap</h3>
            <p className="text-sm text-slate-500 mt-0.5">Last 6 months of coding activity</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Less</span>
            {['#1e293b', '#064e3b', '#059669', '#10b981', '#34d399'].map(c => (
              <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <CalendarHeatmap
              startDate={startDate}
              endDate={new Date()}
              values={heatmapData}
              classForValue={(v) => !v ? 'color-empty' : `color-scale-${Math.min(v.count, 4)}`}
              showWeekdayLabels
            />
          </div>
        </div>
      </motion.div>

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Skill Radar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-3xl border border-slate-700/50 p-6 flex flex-col"
          style={{ background: '#0f172a' }}
        >
          <h3 className="text-base font-bold text-white mb-1">Skill Radar</h3>
          <p className="text-xs text-slate-500 mb-4">Performance across all categories</p>
          <div className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Skills" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* LeetCode Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-3xl border border-slate-700/50 p-6 flex flex-col"
          style={{ background: '#0f172a' }}
        >
          <h3 className="text-base font-bold text-white mb-1">LeetCode Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Problems solved by difficulty</p>
          <div className="flex-1 min-h-[260px]">
            {leetcodeBar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leetcodeBar} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                    cursor={{ fill: '#1e293b' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {leetcodeBar.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <Code className="w-10 h-10 mb-3" />
                <p className="text-sm">Link LeetCode to see breakdown</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-3xl border border-slate-700/50 p-6 flex flex-col gap-3"
          style={{ background: '#0f172a' }}
        >
          <h3 className="text-base font-bold text-white mb-1">Quick Stats</h3>
          <p className="text-xs text-slate-500 mb-2">At-a-glance numbers</p>
          <StatPill label="GitHub Repos" value={stats?.github?.publicRepos ?? '—'} color="#94a3b8" />
          <StatPill label="GitHub Followers" value={stats?.github?.followers ?? '—'} color="#94a3b8" />
          <StatPill label="LC Total Solved" value={stats?.leetcode?.totalSolved ?? '—'} color="#f59e0b" />
          <StatPill label="LC Ranking" value={stats?.leetcode?.ranking ? `#${stats.leetcode.ranking.toLocaleString()}` : '—'} color="#f59e0b" />
          <StatPill label="HR Badges" value={stats?.hackerrank?.badgesCount ?? '—'} color="#22c55e" />
          <StatPill label="GFG Coding Score" value={stats?.gfg?.codingScore ?? '—'} color="#10b981" />
          <StatPill label="GFG Problems" value={stats?.gfg?.problemsSolved ?? '—'} color="#10b981" />
          <div className="mt-auto pt-2">
            <Link
              to="/settings"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
            >
              <Settings className="w-4 h-4" /> Manage Accounts
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DevPulse;

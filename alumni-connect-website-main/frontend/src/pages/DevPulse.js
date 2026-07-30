import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import {
  Activity, Code, GitCommit, Trophy, TrendingUp, AlertCircle, Settings,
  ExternalLink, Star, Zap, Target, ArrowLeft, CheckCircle2, XCircle,
  Loader2, RefreshCw, GitFork, Users, BookOpen
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/UserAvatar';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// ── Heatmap styles ─────────────────────────────────────────────────────────
const heatmapStyles = `
  .react-calendar-heatmap .color-empty { fill: #1e293b; }
  .react-calendar-heatmap .color-scale-1 { fill: #0e4429; }
  .react-calendar-heatmap .color-scale-2 { fill: #006d32; }
  .react-calendar-heatmap .color-scale-3 { fill: #26a641; }
  .react-calendar-heatmap .color-scale-4 { fill: #39d353; }
  .react-calendar-heatmap text { font-size: 10px; fill: #64748b; font-weight: 500; }
  .react-calendar-heatmap rect { rx: 3px; ry: 3px; stroke: #0f172a; stroke-width: 2px; }
  .react-calendar-heatmap rect:hover { stroke: #94a3b8; stroke-width: 1px; }
`;

// ── Platform config ────────────────────────────────────────────────────────
const PLATFORMS = [
  { key: 'overview',   label: 'Overview',     icon: Activity,   color: '#6366f1' },
  { key: 'github',     label: 'GitHub',       icon: GitCommit,  color: '#e2e8f0' },
  { key: 'leetcode',   label: 'LeetCode',     icon: Code,       color: '#f59e0b' },
  { key: 'hackerrank', label: 'HackerRank',   icon: Trophy,     color: '#22c55e' },
  { key: 'gfg',        label: 'GeeksforGeeks',icon: TrendingUp, color: '#10b981' },
  { key: 'codechef',   label: 'CodeChef',     icon: Target,     color: '#8b5cf6' },
  { key: 'codeforces', label: 'Codeforces',   icon: Zap,        color: '#ef4444' },
];

const platformUrl = (stats, usernames, key) => {
  if (stats?.[key]?.url) return stats[key].url;
  const u = usernames?.[key]?.username;
  if (!u) return null;
  const bases = {
    github: `https://github.com/${u}`,
    leetcode: `https://leetcode.com/${u}`,
    hackerrank: `https://www.hackerrank.com/profile/${u}`,
    gfg: `https://www.geeksforgeeks.org/user/${u}/`,
    codechef: `https://www.codechef.com/users/${u}`,
    codeforces: `https://codeforces.com/profile/${u}`,
  };
  return bases[key] || null;
};

// ── Sub-components ─────────────────────────────────────────────────────────

/** Animated score ring */
const ScoreRing = ({ score, max = 1000 }) => {
  const pct = Math.min(score / max, 1);
  const r = 48;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <motion.circle
          cx="56" cy="56" r={r} fill="none"
          stroke="url(#sg)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - pct * circ }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="text-3xl font-black text-white"
        >{score}</motion.div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Score</div>
      </div>
    </div>
  );
};

/** Platform connection status card */
const ConnectionStatus = ({ platformKey, stats, username, url, isPublicView }) => {
  if (!username) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4 border border-slate-700/50">
          <XCircle className="w-8 h-8 text-slate-500" />
        </div>
        <p className="text-slate-300 font-semibold text-lg mb-1">Not Connected</p>
        <p className="text-slate-500 text-sm max-w-xs">
          {isPublicView ? 'This user hasn\'t connected this platform.' : 'Link your account in Settings to see your stats here.'}
        </p>
        {!isPublicView && (
          <Link to="/settings" className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-500/20 transition-colors">
            <Settings className="w-4 h-4" /> Go to Settings
          </Link>
        )}
      </div>
    );
  }
  if (stats?.fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-400 font-semibold text-lg mb-1">Sync Failed</p>
        <p className="text-slate-500 text-sm max-w-xs mb-4">
          Could not fetch data from {platformKey}. The profile may be private, the username may be incorrect, or the platform is temporarily unavailable.
        </p>
        {!isPublicView && (
          <Link to="/settings" className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Re-save Username to Retry
          </Link>
        )}
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
        <p className="text-slate-300 font-semibold">Syncing @{username}...</p>
        <p className="text-slate-500 text-sm mt-1">This may take a moment on first sync.</p>
      </div>
    );
  }
  return null; // stats are good, let parent render them
};

/** Badge card — shows real image when available */
const BadgeCard = ({ badge }) => {
  const [imgError, setImgError] = useState(false);
  const showImg = badge.imageUrl && !imgError;
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.05 }}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl border text-center cursor-default group"
      style={{ background: `${badge.color}12`, borderColor: `${badge.color}30` }}
      title={badge.name + (badge.earnedAt ? ` · Earned ${new Date(badge.earnedAt * 1000).toLocaleDateString()}` : '')}
    >
      <div className="w-12 h-12 flex items-center justify-center relative">
        {showImg ? (
          <img src={badge.imageUrl} alt={badge.name} onError={() => setImgError(true)} className="w-12 h-12 object-contain" loading="lazy" />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${badge.color}22` }}>
            {badge.icon || '🏅'}
          </div>
        )}
      </div>
      {badge.stars > 0 && (
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(badge.stars, 5) }).map((_, i) => (
            <span key={i} className="text-[10px]" style={{ color: badge.color }}>★</span>
          ))}
        </div>
      )}
      <p className="text-[11px] font-bold leading-tight line-clamp-2" style={{ color: badge.color }}>{badge.name}</p>
    </motion.div>
  );
};

/** Difficulty pill */
const DiffPill = ({ label, count, color }) => (
  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
    <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    <span className="text-sm font-black text-white">{count ?? '—'}</span>
  </div>
);

/** Stat pill */
const StatPill = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
    {Icon && <Icon className="w-4 h-4 shrink-0" style={{ color }} />}
    <span className="text-sm text-slate-400 flex-1">{label}</span>
    <span className="text-sm font-black text-white">{value ?? '—'}</span>
  </div>
);

/** Platform header row */
const PlatformHeader = ({ label, username, icon: Icon, color, url, isLinked }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <h2 className="text-lg font-black text-white">{label}</h2>
        {username && <p className="text-xs text-slate-400">@{username}</p>}
      </div>
    </div>
    {url && (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors">
        <ExternalLink className="w-3.5 h-3.5" /> Visit Profile
      </a>
    )}
  </div>
);

/** Clickable platform summary card for Overview tab */
const PlatformSummaryCard = ({ platformKey, label, icon: Icon, color, value, subtitle, onClick, hasError, isLinked }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className="cursor-pointer bg-slate-800/40 rounded-3xl p-5 border border-slate-700/50 hover:border-slate-500/50 transition-all relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: color }}></div>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${color}15`, borderColor: `${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="relative z-10 flex items-center">
          {hasError && <AlertCircle className="w-4 h-4 text-red-400" title="Sync Failed" />}
          {!isLinked && !hasError && <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Not Linked</span>}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-2xl font-black text-white mb-0.5">{value ?? '—'}</h3>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{subtitle || label}</p>
      </div>
    </motion.div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const DevPulse = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const isPublicView = !!userId;
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading, error } = useQuery(
    ['dev-activity', isPublicView ? userId : user?.email],
    () => isPublicView
      ? api.get(`/dev-activity/public/${userId}`)
      : api.get(`/dev-activity/${user?.email}`),
    { enabled: isPublicView ? !!userId : !!user?.email, retry: false }
  );

  const stats = data?.data?.stats;
  const usernames = data?.data?.usernames;
  const alumnexScore = data?.data?.alumnexScore || 0;
  const profileName = isPublicView ? data?.data?.name : user?.name;
  const profilePhoto = isPublicView ? data?.data?.photo : user?.photo;

  // ── Heatmap data ──
  const heatmapData = useMemo(() => {
    let points = [];
    let totalContributions = 0;
    let isReal = false;

    if (stats?.leetcode?.calendar && !stats.leetcode.fetchError) {
      isReal = true;
      for (const [ts, count] of Object.entries(stats.leetcode.calendar)) {
        const d = new Date(parseInt(ts) * 1000);
        points.push({ date: d.toISOString().split('T')[0], count });
        totalContributions += count;
      }
    }

    points.sort((a, b) => new Date(a.date) - new Date(b.date));

    let maxStreak = 0, currentStreak = 0;
    if (points.length > 0) {
      let temp = 1, prev = new Date(points[0].date);
      maxStreak = 1;
      for (let i = 1; i < points.length; i++) {
        const diff = Math.round((new Date(points[i].date) - prev) / 86400000);
        if (diff === 1) { temp++; } else if (diff > 1) { temp = 1; }
        maxStreak = Math.max(maxStreak, temp);
        prev = new Date(points[i].date);
      }
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      const start = points.some(p => p.date === todayStr) ? new Date() : (points.some(p => p.date === yStr) ? yesterday : null);
      if (start) {
        let d = new Date(start), cur = 0;
        while (true) {
          if (points.some(p => p.date === d.toISOString().split('T')[0])) { cur++; d.setDate(d.getDate() - 1); } else break;
        }
        currentStreak = cur;
      }
    }
    return { points, totalContributions, maxStreak, currentStreak, activeDays: points.length, isReal };
  }, [stats?.leetcode]);

  // ── Aggregate badges ──
  const allBadges = useMemo(() => {
    return ['github', 'leetcode', 'hackerrank', 'codechef', 'codeforces'].flatMap(key =>
      (stats?.[key]?.badges || []).map(b => ({ ...b, platform: key }))
    );
  }, [stats]);

  // ── Loading & Error states ──
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6 animate-pulse">
        <div className="h-48 rounded-3xl bg-slate-800/60" />
        <div className="h-12 rounded-2xl bg-slate-800/60 w-2/3" />
        <div className="h-64 rounded-3xl bg-slate-800/60" />
      </div>
    );
  }

  const notFound = error?.response?.status === 404 ||
    (!usernames?.github?.username && !usernames?.leetcode?.username &&
     !usernames?.hackerrank?.username && !usernames?.gfg?.username);

  if (notFound) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        {isPublicView && (
          <button onClick={() => navigate(-1)} className="mb-8 flex items-center text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
        )}
        <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
          <Activity className="w-12 h-12 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3">
          {isPublicView ? 'No DevPulse Found' : 'Welcome to DevPulse'}
        </h2>
        <p className="text-slate-400 max-w-md mb-8 text-base leading-relaxed">
          {isPublicView
            ? 'This user hasn\'t connected any coding platforms yet.'
            : 'Connect your coding profiles to track your progress, earn badges, and climb the leaderboard.'}
        </p>
        {!isPublicView && (
          <Link to="/settings" className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-all shadow-lg hover:-translate-y-0.5">
            <Settings className="w-5 h-5" /> Connect Accounts
          </Link>
        )}
      </div>
    );
  }

  // ── Tab content renderer ──
  const renderTab = () => {
    switch (activeTab) {
      // ────────────────────────────────────── OVERVIEW
      case 'overview': {
        const totalSolved = (stats?.leetcode?.totalSolved || 0) + (stats?.gfg?.problemsSolved || 0);
        const radarData = [
          { subject: 'Algorithms', A: Math.min((stats?.leetcode?.totalSolved || 0) / 3, 100) },
          { subject: 'Open Source', A: Math.min(((stats?.github?.publicRepos || 0) * 3) + ((stats?.github?.followers || 0) * 2), 100) },
          { subject: 'Competitive', A: Math.min((stats?.codeforces?.rating || stats?.codechef?.rating || 0) / 20, 100) },
          { subject: 'Consistency', A: Math.min(heatmapData.activeDays * 0.5, 100) },
          { subject: 'GFG', A: Math.min((stats?.gfg?.codingScore || 0) / 5, 100) },
        ];

        return (
          <div className="space-y-6">
            {/* Platform Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <PlatformSummaryCard 
                platformKey="github" label="GitHub" icon={GitCommit} color="#e2e8f0" 
                value={stats?.github?.publicRepos ?? '—'} subtitle="Public Repos"
                isLinked={!!usernames?.github?.username} hasError={stats?.github?.fetchError}
                onClick={() => setActiveTab('github')}
              />
              <PlatformSummaryCard 
                platformKey="leetcode" label="LeetCode" icon={Code} color="#f59e0b" 
                value={stats?.leetcode?.totalSolved ?? '—'} subtitle="Problems Solved"
                isLinked={!!usernames?.leetcode?.username} hasError={stats?.leetcode?.fetchError}
                onClick={() => setActiveTab('leetcode')}
              />
              <PlatformSummaryCard 
                platformKey="hackerrank" label="HackerRank" icon={Trophy} color="#22c55e" 
                value={stats?.hackerrank?.badgesCount ?? '—'} subtitle="Badges Earned"
                isLinked={!!usernames?.hackerrank?.username} hasError={stats?.hackerrank?.fetchError}
                onClick={() => setActiveTab('hackerrank')}
              />
              <PlatformSummaryCard 
                platformKey="gfg" label="GeeksforGeeks" icon={TrendingUp} color="#10b981" 
                value={stats?.gfg?.codingScore ?? '—'} subtitle="Coding Score"
                isLinked={!!usernames?.gfg?.username} hasError={stats?.gfg?.fetchError}
                onClick={() => setActiveTab('gfg')}
              />
              <PlatformSummaryCard 
                platformKey="codechef" label="CodeChef" icon={Target} color="#8b5cf6" 
                value={stats?.codechef?.rating ?? '—'} subtitle="Rating"
                isLinked={!!usernames?.codechef?.username} hasError={stats?.codechef?.fetchError}
                onClick={() => setActiveTab('codechef')}
              />
              <PlatformSummaryCard 
                platformKey="codeforces" label="Codeforces" icon={Zap} color="#ef4444" 
                value={stats?.codeforces?.rating || (usernames?.codeforces?.username && !stats?.codeforces?.fetchError ? 'Unrated' : '—')} subtitle="Rating"
                isLinked={!!usernames?.codeforces?.username} hasError={stats?.codeforces?.fetchError}
                onClick={() => setActiveTab('codeforces')}
              />
            </div>

            {/* Heatmap */}
            <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-emerald-400" />
                  Activity Calendar
                  <span className="text-xs font-normal text-slate-500 ml-1">{heatmapData.isReal ? '(LeetCode — Real)' : '(No data yet)'}</span>
                </h3>
                <div className="flex gap-3 text-xs font-semibold text-slate-400">
                  <span>Max Streak: <strong className="text-emerald-400">{heatmapData.maxStreak}d</strong></span>
                  <span>Current: <strong className="text-amber-400">{heatmapData.currentStreak}d</strong></span>
                  <span>Submissions: <strong className="text-white">{heatmapData.totalContributions.toLocaleString()}</strong></span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <CalendarHeatmap
                    startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
                    endDate={new Date()}
                    values={heatmapData.points}
                    classForValue={v => !v ? 'color-empty' : `color-scale-${Math.min(v.count, 4)}`}
                    titleForValue={v => v ? `${v.count} on ${v.date}` : 'No activity'}
                    showWeekdayLabels
                    gutterSize={2}
                  />
                </div>
              </div>
            </div>

            {/* Skill Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-black text-white mb-4">Skill Radar</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-black text-white mb-4">Connected Platforms</h3>
                <div className="space-y-2">
                  {PLATFORMS.filter(p => p.key !== 'overview').map(({ key, label, icon: Icon, color }) => {
                    const uname = usernames?.[key]?.username;
                    const url = platformUrl(stats, usernames, key);
                    const hasError = stats?.[key]?.fetchError;
                    const hasStat = stats?.[key] && !hasError;
                    return (
                      <div key={key} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" style={{ color }} />
                          <span className="text-sm font-semibold text-slate-300">{label}</span>
                          {uname && <span className="text-xs text-slate-500">@{uname}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {hasStat && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {hasError && <AlertCircle className="w-4 h-4 text-red-400" />}
                          {!uname && <span className="text-xs text-slate-600 italic">not linked</span>}
                          {url && <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 text-slate-500 hover:text-white" /></a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* All Badges */}
            {allBadges.length > 0 && (
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-black text-white mb-2 flex items-center gap-2">
                  <span className="text-2xl">🏅</span> Badges &amp; Achievements
                  <span className="ml-auto text-sm font-semibold text-slate-400">{allBadges.length} total</span>
                </h3>
                <p className="text-slate-500 text-sm mb-5">Real badges earned from your connected platforms</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
                  {allBadges.map((b, i) => <BadgeCard key={b.id || i} badge={b} />)}
                </div>
              </div>
            )}
          </div>
        );
      }

      // ────────────────────────────────────── GITHUB
      case 'github': {
        const g = stats?.github;
        const uname = usernames?.github?.username;
        const url = platformUrl(stats, usernames, 'github');
        const status = <ConnectionStatus platformKey="GitHub" stats={g} username={uname} url={url} isPublicView={isPublicView} />;
        if (status) return <div>{status}</div>;

        return (
          <div className="space-y-6">
            <PlatformHeader label="GitHub" username={uname} icon={GitCommit} color="#e2e8f0" url={url} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-700/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <BookOpen className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-4xl font-black text-white mb-1">{g.publicRepos ?? '—'}</h3>
                <p className="text-sm font-semibold text-slate-400">Public Repositories</p>
              </div>
              
              <div className="md:col-span-2 grid grid-cols-2 gap-6">
                <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-1">{g.followers ?? '—'}</h3>
                  <p className="text-sm font-semibold text-slate-400">Followers</p>
                </div>
                <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 flex flex-col justify-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                    <GitFork className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-1">{g.following ?? '—'}</h3>
                  <p className="text-sm font-semibold text-slate-400">Following</p>
                </div>
              </div>
            </div>
            {/* Real GitHub Achievement Badges */}
            {g.badges?.length > 0 && (
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <span>🏆</span> GitHub Achievements
                  <span className="ml-auto text-sm font-semibold text-slate-400">{g.badges.length}</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-3">
                  {g.badges.map((b, i) => <BadgeCard key={b.id || i} badge={b} />)}
                </div>
              </div>
            )}
            {g.badges?.length === 0 && (
              <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 text-center text-slate-500 text-sm">
                No GitHub achievements yet. Contribute to open source to earn badges!
              </div>
            )}
          </div>
        );
      }

      // ────────────────────────────────────── LEETCODE
      case 'leetcode': {
        const lc = stats?.leetcode;
        const uname = usernames?.leetcode?.username;
        const url = platformUrl(stats, usernames, 'leetcode');
        const status = <ConnectionStatus platformKey="LeetCode" stats={lc} username={uname} url={url} isPublicView={isPublicView} />;
        if (status) return <div>{status}</div>;

        const totalDsa = (lc.easySolved || 0) + (lc.mediumSolved || 0) + (lc.hardSolved || 0);
        const dsaData = [
          { name: 'Easy', value: lc.easySolved || 0, color: '#10b981' },
          { name: 'Medium', value: lc.mediumSolved || 0, color: '#f59e0b' },
          { name: 'Hard', value: lc.hardSolved || 0, color: '#ef4444' },
        ];

        return (
          <div className="space-y-6">
            <PlatformHeader label="LeetCode" username={uname} icon={Code} color="#f59e0b" url={url} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Doughnut */}
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-black text-white mb-5">Problems Solved by Difficulty</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-36 h-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dsaData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={48} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
                          {dsaData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-black text-white">{totalDsa}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Total</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {dsaData.map(d => (
                      <DiffPill key={d.name} label={d.name} count={d.value} color={d.color} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 space-y-3">
                <h3 className="font-black text-white mb-5">Profile Stats</h3>
                <StatPill icon={Star} label="Global Ranking" value={lc.ranking ? `#${lc.ranking.toLocaleString()}` : '—'} color="#f59e0b" />
                <StatPill icon={Activity} label="Reputation" value={lc.reputation ?? '—'} color="#f59e0b" />
                <StatPill icon={Trophy} label="Contest Rating" value={lc.contestRating ? Math.round(lc.contestRating) : 'Unrated'} color="#f59e0b" />
              </div>
            </div>

            {/* LeetCode Activity Heatmap */}
            {heatmapData.isReal && (
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-black text-white">Submission Activity</h3>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Real Data</span>
                </div>
                <div className="flex gap-4 text-xs font-semibold text-slate-400 mb-4">
                  <span>Max Streak: <strong className="text-emerald-400">{heatmapData.maxStreak} days</strong></span>
                  <span>Current: <strong className="text-amber-400">{heatmapData.currentStreak} days</strong></span>
                  <span>Total: <strong className="text-white">{heatmapData.totalContributions.toLocaleString()}</strong></span>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">
                    <CalendarHeatmap
                      startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
                      endDate={new Date()}
                      values={heatmapData.points}
                      classForValue={v => !v ? 'color-empty' : `color-scale-${Math.min(v.count, 4)}`}
                      titleForValue={v => v ? `${v.count} submissions on ${v.date}` : 'No activity'}
                      showWeekdayLabels
                      gutterSize={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* LeetCode real badges */}
            {lc.badges?.length > 0 && (
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <span>🏅</span> LeetCode Medals &amp; Badges
                  <span className="ml-auto text-sm font-semibold text-slate-400">{lc.badges.length}</span>
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-3">
                  {lc.badges.map((b, i) => <BadgeCard key={b.id || i} badge={b} />)}
                </div>
              </div>
            )}
            
            {/* LeetCode Topics */}
            {lc.topics?.length > 0 && (
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-black text-white mb-5 flex items-center gap-2">
                  <Code className="w-5 h-5 text-amber-500" /> Topics Mastered
                  <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">{lc.topics.length} topics</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lc.topics.map(t => (
                    <div key={t.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                      <span className="text-xs font-semibold text-amber-200/80">{t.name}</span>
                      <span className="text-xs font-black text-white bg-amber-500/20 px-1.5 rounded">{t.solved}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      // ────────────────────────────────────── HACKERRANK
      case 'hackerrank': {
        const hr = stats?.hackerrank;
        const uname = usernames?.hackerrank?.username;
        const url = platformUrl(stats, usernames, 'hackerrank');
        const status = <ConnectionStatus platformKey="HackerRank" stats={hr} username={uname} url={url} isPublicView={isPublicView} />;
        if (status) return <div>{status}</div>;

        // Separate domain badges from level badge
        const domainBadges = (hr.badges || []).filter(b => b.id !== 'hr-lvl');
        const levelBadge = (hr.badges || []).find(b => b.id === 'hr-lvl');

        return (
          <div className="space-y-6">
            <PlatformHeader label="HackerRank" username={uname} icon={Trophy} color="#22c55e" url={url} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 rounded-3xl p-6 border border-emerald-700/30 flex items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="relative z-10 shrink-0">
                  <ScoreRing score={hr.level || 0} max={6} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">Hacker Level</h3>
                  <div className="text-4xl font-black text-white">{levelBadge ? `Level ${hr.level}` : hr.level ?? '—'}</div>
                  {levelBadge && <p className="text-xs text-slate-400 mt-2">Ranked based on domain mastery</p>}
                </div>
              </div>

              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
                  <Trophy className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-4xl font-black text-white mb-1">{hr.badgesCount ?? '—'}</h3>
                <p className="text-sm font-semibold text-slate-400">Total Badges Earned</p>
              </div>
            </div>

            {/* Domain Badges — real from API */}
            {domainBadges.length > 0 ? (
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  <span>⭐</span> Domain Badges
                  <span className="ml-auto text-sm font-semibold text-slate-400">{domainBadges.length}</span>
                </h3>
                <p className="text-slate-500 text-xs mb-5">Star ratings reflect mastery within each domain (1–5 stars)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {domainBadges.map((b, i) => <BadgeCard key={b.id || i} badge={b} />)}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/40 rounded-2xl p-8 border border-slate-700/50 text-center text-slate-500 text-sm">
                No domain badges yet. Solve problems in specific domains to earn them!
              </div>
            )}
          </div>
        );
      }

      // ────────────────────────────────────── GFG
      case 'gfg': {
        const gfg = stats?.gfg;
        const uname = usernames?.gfg?.username;
        const url = platformUrl(stats, usernames, 'gfg');
        const status = <ConnectionStatus platformKey="GeeksforGeeks" stats={gfg} username={uname} url={url} isPublicView={isPublicView} />;
        if (status) return <div>{status}</div>;

        return (
          <div className="space-y-6">
            <PlatformHeader label="GeeksforGeeks" username={uname} icon={TrendingUp} color="#10b981" url={url} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-teal-900/40 to-slate-900 rounded-3xl p-8 border border-teal-700/30 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-2">Overall Coding Score</h3>
                  <div className="text-6xl md:text-7xl font-black text-white">{gfg.codingScore ?? '—'}</div>
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-teal-500/30 flex items-center justify-center bg-teal-500/10 backdrop-blur-sm relative z-10">
                  <TrendingUp className="w-10 h-10 text-teal-400" />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex-1 bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 flex flex-col justify-center">
                  <h3 className="text-4xl font-black text-white mb-1">{gfg.problemsSolved ?? '—'}</h3>
                  <p className="text-sm font-semibold text-slate-400">Problems Solved</p>
                </div>
                {gfg.instituteRank ? (
                  <div className="flex-1 bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 flex flex-col justify-center">
                    <h3 className="text-3xl font-black text-white mb-1">#{gfg.instituteRank}</h3>
                    <p className="text-sm font-semibold text-slate-400">Institute Rank</p>
                  </div>
                ) : (
                   <div className="flex-1 bg-slate-800/40 rounded-3xl p-6 border border-emerald-500/20 border-dashed flex flex-col justify-center items-center text-center">
                      <p className="text-xs text-slate-500">Institute rank not available publicly.</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // ────────────────────────────────────── CODECHEF
      case 'codechef': {
        const cc = stats?.codechef;
        const uname = usernames?.codechef?.username;
        const url = platformUrl(stats, usernames, 'codechef');
        const status = <ConnectionStatus platformKey="CodeChef" stats={cc} username={uname} url={url} isPublicView={isPublicView} />;
        if (status) return <div>{status}</div>;

        return (
          <div className="space-y-6">
            <PlatformHeader label="CodeChef" username={uname} icon={Target} color="#8b5cf6" url={url} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-violet-900/40 to-slate-900 rounded-3xl p-6 border border-violet-700/30 text-center flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent opacity-50"></div>
                <Target className="w-10 h-10 text-violet-400 mb-4 relative z-10" />
                <h3 className="text-5xl font-black text-white mb-2 relative z-10">{cc.rating ?? '—'}</h3>
                <p className="text-sm font-semibold text-violet-300 relative z-10">Contest Rating</p>
              </div>

              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                <div className="text-amber-400 text-4xl mb-3 tracking-widest drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                  {cc.stars ? '★'.repeat(cc.stars) : '—'}
                </div>
                <h3 className="text-2xl font-black text-white mb-1">{cc.stars ? `${cc.stars} Star` : 'Unrated'}</h3>
                <p className="text-sm font-semibold text-slate-400">CodeChef Stars</p>
              </div>

              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-3">
                  <span className="text-3xl font-black text-fuchsia-400">{cc.division ?? '-'}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Division {cc.division ?? '—'}</h3>
                <p className="text-sm font-semibold text-slate-400">Current Division</p>
              </div>
            </div>
            {cc.badges?.length > 0 && (
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-bold text-white mb-4">CodeChef Badges</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {cc.badges.map((b, i) => <BadgeCard key={b.id || i} badge={b} />)}
                </div>
              </div>
            )}
          </div>
        );
      }

      // ────────────────────────────────────── CODEFORCES
      case 'codeforces': {
        const cf = stats?.codeforces;
        const uname = usernames?.codeforces?.username;
        const url = platformUrl(stats, usernames, 'codeforces');
        const status = <ConnectionStatus platformKey="Codeforces" stats={cf} username={uname} url={url} isPublicView={isPublicView} />;
        if (status) return <div>{status}</div>;

        return (
          <div className="space-y-6">
            <PlatformHeader label="Codeforces" username={uname} icon={Zap} color="#ef4444" url={url} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-900/40 to-slate-900 rounded-3xl p-6 border border-red-700/30 relative overflow-hidden flex flex-col justify-center items-center text-center">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                 <Zap className="w-10 h-10 text-red-400 mb-3" />
                 <h3 className="text-5xl font-black text-white mb-2">{cf.rating || 'Unrated'}</h3>
                 <p className="text-sm font-semibold text-red-300">Current Rating</p>
              </div>

              <div className="grid grid-rows-2 gap-6">
                <div className="bg-slate-800/40 rounded-3xl p-5 border border-slate-700/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Max Rating</p>
                    <p className="text-3xl font-black text-orange-400">{cf.maxRating || '—'}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500/30" />
                </div>
                <div className="bg-slate-800/40 rounded-3xl p-5 border border-slate-700/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">Contests Participated</p>
                    <p className="text-3xl font-black text-amber-400">{cf.contestCount ?? '—'}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-amber-500/30" />
                </div>
              </div>

              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 flex flex-col justify-center space-y-4">
                 <StatPill icon={Star} label="Current Rank" value={cf.rank || 'Newbie'} color="#ef4444" />
                 <StatPill icon={TrendingUp} label="Peak Rank" value={cf.maxRank || '—'} color="#f97316" />
              </div>
            </div>
            {cf.badges?.length > 0 && (
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50">
                <h3 className="font-bold text-white mb-4">Codeforces Rank Badges</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {cf.badges.map((b, i) => <BadgeCard key={b.id || i} badge={b} />)}
                </div>
              </div>
            )}
          </div>
        );
      }

      default: return null;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 px-4 sm:px-6 lg:px-8 py-6 selection:bg-indigo-500/20">
      <style>{heatmapStyles}</style>

      {/* Back button for public view */}
      {isPublicView && (
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-white transition-colors font-medium text-sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Leaderboard
        </button>
      )}

      {/* ── Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-cyan-900/10 pointer-events-none" />
        <div className="relative z-10 p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl blur-xl opacity-30" />
            <div className="w-24 h-24 rounded-2xl overflow-hidden relative z-10 border-2 border-white/20 bg-slate-800">
              <UserAvatar src={profilePhoto} name={profileName} className="w-full h-full" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">DevPulse</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1">{profileName}'s Coding Profile</h1>
            {data?.data?.lastUpdated && (
              <p className="text-xs text-slate-500 flex items-center gap-1 justify-center sm:justify-start mt-2">
                <RefreshCw className="w-3 h-3" />
                Last synced: {new Date(data.data.lastUpdated).toLocaleString()}
              </p>
            )}
            {!isPublicView && (
              <Link to="/settings" className="inline-flex items-center gap-1.5 mt-3 text-xs text-slate-400 hover:text-white transition-colors">
                <Settings className="w-3.5 h-3.5" /> Manage connected accounts
              </Link>
            )}
          </div>

          <div className="shrink-0 flex flex-col items-center">
            <ScoreRing score={alumnexScore} />
            <p className="text-xs text-slate-500 mt-1 font-semibold">Alumnex Score</p>
          </div>
        </div>
      </motion.div>

      {/* ── Platform Tab Bar */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2 min-w-max">
          {PLATFORMS.map(({ key, label, icon: Icon, color }) => {
            const isActive = activeTab === key;
            const hasError = key !== 'overview' && stats?.[key]?.fetchError;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border whitespace-nowrap
                  ${isActive
                    ? 'text-white border-transparent shadow-lg'
                    : 'text-slate-400 border-slate-700/50 bg-slate-800/40 hover:text-white hover:border-slate-600'
                  }`}
                style={isActive ? { background: `${color}25`, borderColor: `${color}50`, color } : {}}
              >
                <Icon className="w-4 h-4" style={isActive ? { color } : {}} />
                {label}
                {hasError && <AlertCircle className="w-3 h-3 text-red-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DevPulse;

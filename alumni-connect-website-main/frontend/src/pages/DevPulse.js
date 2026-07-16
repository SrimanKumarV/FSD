import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Activity, Code, GitCommit, Trophy, TrendingUp, AlertCircle, Settings, ExternalLink, Star, Zap, Target, ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  .react-calendar-heatmap .color-scale-1 { fill: #0e4429; }
  .react-calendar-heatmap .color-scale-2 { fill: #006d32; }
  .react-calendar-heatmap .color-scale-3 { fill: #26a641; }
  .react-calendar-heatmap .color-scale-4 { fill: #39d353; }
  .react-calendar-heatmap text { font-size: 10px; fill: #64748b; font-weight: 500; }
  .react-calendar-heatmap rect { rx: 3px; ry: 3px; stroke: #0f172a; stroke-width: 2px; }
  .react-calendar-heatmap rect:hover { stroke: #cbd5e1; stroke-width: 1px; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const getPlatformUrl = (stats, usernames, platform) => {
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
      <svg className="absolute inset-0 -rotate-90 drop-shadow-2xl" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e293b" strokeWidth="12" className="opacity-50" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
          className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 drop-shadow-md"
        >
          {score}
        </motion.div>
        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Score</div>
      </div>
    </div>
  );
};

const PlatformCard = ({ platform, icon: Icon, label, color, bgGradient, stats, username, isVerified, url }) => {
  const content = (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="relative rounded-3xl p-6 border border-white/10 overflow-hidden cursor-pointer h-full backdrop-blur-xl shadow-2xl"
      style={{ background: bgGradient }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-30 blur-[40px] pointer-events-none" style={{ background: color, transform: 'translate(30%, -30%)' }} />
      
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div>
            <p className="text-sm text-slate-300 font-semibold tracking-wide">{label}</p>
            {username && <p className="text-xs font-medium text-slate-400">@{username}</p>}
          </div>
        </div>
        {isVerified && (
          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Verified
          </span>
        )}
      </div>

      {stats ? (
        <div className="relative z-10 space-y-2">
          {platform === 'github' && (
            <>
              <p className="text-4xl font-black text-white drop-shadow-md">{stats.publicRepos ?? '—'}</p>
              <p className="text-sm font-medium text-slate-400">{stats.followers ?? 0} followers <span className="mx-1 opacity-50">•</span> {stats.following ?? 0} following</p>
            </>
          )}
          {platform === 'leetcode' && (
            <>
              <p className="text-4xl font-black text-white drop-shadow-md">{stats.totalSolved ?? '—'}</p>
              <p className="text-sm font-medium text-slate-400">problems <span className="mx-1 opacity-50">•</span> Rank #{(stats.ranking ?? '').toLocaleString()}</p>
              <div className="flex gap-2 mt-3">
                {[['Easy', stats.easySolved, '#10b981'], ['Med', stats.mediumSolved, '#f59e0b'], ['Hard', stats.hardSolved, '#ef4444']].map(([d, v, c]) => (
                  <span key={d} className="text-[11px] font-bold px-2.5 py-1 rounded-lg border" style={{ background: `${c}15`, color: c, borderColor: `${c}30` }}>
                    {d}: {v ?? 0}
                  </span>
                ))}
              </div>
            </>
          )}
          {platform === 'hackerrank' && (
            <>
              <p className="text-4xl font-black text-white drop-shadow-md">{stats.badgesCount ?? '—'}</p>
              <p className="text-sm font-medium text-slate-400">badges earned <span className="mx-1 opacity-50">•</span> Lvl {stats.level ?? 1}</p>
            </>
          )}
          {platform === 'gfg' && (
            <>
              <p className="text-4xl font-black text-white drop-shadow-md">{stats.codingScore ?? '—'}</p>
              <p className="text-sm font-medium text-slate-400">{stats.problemsSolved ?? 0} problems solved</p>
            </>
          )}
        </div>
      ) : (
        <div className="relative z-10 mt-6">
          {username ? (
            <div className="space-y-1 bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-slate-300 text-sm font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Linked: @{username}</p>
              <p className="text-slate-500 text-xs">Waiting for stats sync...</p>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-slate-500 text-sm font-medium px-4 py-2 rounded-xl bg-white/5 border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Not linked
            </div>
          )}
        </div>
      )}

      {url && (
        <div className="absolute bottom-5 right-5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  );

  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full group">{content}</a>
  ) : (
    <Link to="/settings" className="block h-full group">{content}</Link>
  );
};

const StatPill = ({ label, value, color }) => (
  <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
    <span className="text-sm font-medium text-slate-300">{label}</span>
    <span className="text-base font-black tracking-wide drop-shadow-sm" style={{ color }}>{value}</span>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const DevPulse = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const isPublicView = !!userId;

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

  const heatmapData = useMemo(() => {
    const today = new Date();
    const points = [];
    const intensity = Math.max(1, Math.floor(alumnexScore / 100));
    let totalMock = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (Math.random() < (alumnexScore / 800)) {
        const count = Math.floor(Math.random() * intensity * 2) + 1;
        totalMock += count;
        points.push({ date: d.toISOString().split('T')[0], count });
      }
    }
    return { points, totalMock };
  }, [alumnexScore]);

  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1); // 1 year exactly like github

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

  const platforms = [
    {
      platform: 'github',
      label: 'GitHub',
      icon: GitCommit,
      color: '#cbd5e1',
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
      bgGradient: 'linear-gradient(135deg, #1f1406 0%, #291c0a 100%)',
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
      bgGradient: 'linear-gradient(135deg, #062111 0%, #0a2e18 100%)',
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
      bgGradient: 'linear-gradient(135deg, #021c13 0%, #052e1f 100%)',
      stats: stats?.gfg,
      username: usernames?.gfg?.username,
      isVerified: usernames?.gfg?.isVerified,
      url: getPlatformUrl(stats, usernames, 'gfg'),
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-64 rounded-[2.5rem] bg-slate-800/60" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-52 rounded-[2rem] bg-slate-800/60" />)}
        </div>
        <div className="h-64 rounded-[2.5rem] bg-slate-800/60" />
      </div>
    );
  }

  const hasNoProfiles = error?.response?.status === 404 ||
    (!usernames?.github?.username && !usernames?.leetcode?.username &&
     !usernames?.hackerrank?.username && !usernames?.gfg?.username);

  if (hasNoProfiles) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        {isPublicView && (
          <button onClick={() => navigate(-1)} className="mb-8 flex items-center text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
        )}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
          className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 flex items-center justify-center mb-8 backdrop-blur-xl shadow-2xl"
        >
          <Activity className="w-16 h-16 text-indigo-400" />
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          {isPublicView ? "No Activity Found" : "Welcome to DevPulse"}
        </h2>
        <p className="text-slate-400 max-w-lg mb-10 text-lg leading-relaxed">
          {isPublicView 
            ? "This developer hasn't connected their coding profiles to DevPulse yet."
            : "Connect your coding profiles across GitHub, LeetCode, HackerRank, and GeeksforGeeks to build your Alumnex Score and showcase your developer journey."}
        </p>
        {!isPublicView && (
          <Link
            to="/settings"
            className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center gap-3 text-lg hover:-translate-y-1"
          >
            <Settings className="w-6 h-6" /> Connect Accounts
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6 lg:px-8 py-8 selection:bg-indigo-500/30">
      <style>{heatmapStyles}</style>

      {isPublicView && (
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-white transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leaderboard
        </button>
      )}

      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-white/10"
        style={{ background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)' }}
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6 md:gap-8 flex-1 w-full">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] overflow-hidden relative z-10 border-2 border-white/20 bg-slate-800 shadow-2xl flex items-center justify-center">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-white">{profileName?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">DevPulse Profile</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">
                {profileName}'s <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Coding Journey</span>
              </h1>
              {data?.data?.lastUpdated && (
                <p className="text-xs text-slate-500 mt-4 flex items-center gap-1.5 bg-white/5 inline-flex px-3 py-1.5 rounded-full border border-white/10">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Last synced: {new Date(data.data.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-inner md:min-w-[280px]">
            <ScoreRing score={alumnexScore} />
          </div>
        </div>
      </motion.div>

      {/* ── Platform Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {platforms.map((p) => (
          <PlatformCard key={p.platform} {...p} />
        ))}
      </motion.div>

      {/* ── Heatmap exactly like Codolio ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-[2.5rem] border border-slate-700/50 p-8 shadow-2xl relative overflow-hidden"
        style={{ background: '#0f172a' }}
      >
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 relative z-10 gap-4">
          <div>
            <h3 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
              <GitCommit className="w-6 h-6 text-emerald-400" /> Total Contributions
            </h3>
            <p className="text-sm text-slate-400 font-medium">{heatmapData.totalMock.toLocaleString()} submissions in the last year across all platforms</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
            <span>Less</span>
            <div className="flex gap-1.5">
              {['#1e293b', '#0e4429', '#006d32', '#26a641', '#39d353'].map(c => (
                <div key={c} className="w-3.5 h-3.5 rounded-sm" style={{ background: c }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-4 relative z-10 custom-scrollbar">
          <div className="min-w-[800px] pr-4">
            <CalendarHeatmap
              startDate={startDate}
              endDate={new Date()}
              values={heatmapData.points}
              classForValue={(v) => !v ? 'color-empty' : `color-scale-${Math.min(v.count, 4)}`}
              titleForValue={(value) => {
                if (!value || !value.date) return 'No contributions';
                return `${value.count} contributions on ${new Date(value.date).toDateString()}`;
              }}
              showWeekdayLabels
              gutterSize={2}
            />

          </div>
        </div>
      </motion.div>

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Skill Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-[2.5rem] border border-slate-700/50 p-8 flex flex-col shadow-2xl bg-[#0f172a] relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xl font-black text-white mb-1 relative z-10">Skill Radar</h3>
          <p className="text-sm text-slate-400 mb-6 font-medium relative z-10">Performance across categories</p>
          <div className="flex-1 min-h-[300px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Skills" dataKey="A" stroke="#6366f1" fill="url(#radarGradient)" fillOpacity={1} strokeWidth={3} />
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* LeetCode Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
          className="rounded-[2.5rem] border border-slate-700/50 p-8 flex flex-col shadow-2xl bg-[#0f172a] relative overflow-hidden"
        >
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xl font-black text-white mb-1 relative z-10">LeetCode Profile</h3>
          <p className="text-sm text-slate-400 mb-6 font-medium relative z-10">Problems solved by difficulty</p>
          <div className="flex-1 min-h-[300px] relative z-10">
            {leetcodeBar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leetcodeBar} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                  <RechartsTooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', color: '#fff', fontWeight: 600, padding: '12px 16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                    {leetcodeBar.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
                <Code className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm font-semibold">Link LeetCode to see breakdown</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-[2.5rem] border border-slate-700/50 p-8 flex flex-col gap-4 shadow-2xl bg-[#0f172a] relative overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          
          <div className="mb-2 relative z-10">
            <h3 className="text-xl font-black text-white mb-1">Quick Stats</h3>
            <p className="text-sm text-slate-400 font-medium">At-a-glance numbers</p>
          </div>
          
          <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-center">
            <StatPill label="GitHub Repos" value={stats?.github?.publicRepos ?? '—'} color="#cbd5e1" />
            <StatPill label="GitHub Followers" value={stats?.github?.followers ?? '—'} color="#cbd5e1" />
            <StatPill label="LC Total Solved" value={stats?.leetcode?.totalSolved ?? '—'} color="#f59e0b" />
            <StatPill label="LC Ranking" value={stats?.leetcode?.ranking ? `#${stats.leetcode.ranking.toLocaleString()}` : '—'} color="#f59e0b" />
            <StatPill label="HR Badges" value={stats?.hackerrank?.badgesCount ?? '—'} color="#22c55e" />
            <StatPill label="GFG Score" value={stats?.gfg?.codingScore ?? '—'} color="#10b981" />
          </div>
          
          {!isPublicView && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 relative z-10">
              <Link
                to="/settings"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
              >
                <Settings className="w-5 h-5" /> Manage Accounts
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DevPulse;

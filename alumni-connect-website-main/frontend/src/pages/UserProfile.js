import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  MapPin, Briefcase, MessageSquare, Users,
  Activity, Code, GitCommit, Trophy, TrendingUp,
  ExternalLink, Zap, Target, FolderGit2, Globe, Building2
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from '../components/DefaultAvatar';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Cell
} from 'recharts';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Mini Platform Card ────────────────────────────────────────────────────────
const PlatformChip = ({ icon: Icon, label, value, sub, color, url }) => {
  const inner = (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
      style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-black text-white leading-tight">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}
      </div>
      {url && <ExternalLink className="w-3 h-3 text-slate-600 flex-shrink-0" />}
    </div>
  );
  return url ? <a href={url} target="_blank" rel="noopener noreferrer">{inner}</a> : <div>{inner}</div>;
};

// ── Score Ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score, max = 1000 }) => {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(score / max, 1)) * circ;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <motion.circle
          cx="48" cy="48" r={r} fill="none"
          stroke="url(#g2)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <div className="text-2xl font-black text-white">{score}</div>
        <div className="text-xs text-slate-500">/ {max}</div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const UserProfile = () => {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('about');

  // Fetch the target user's profile
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery(
    ['user-profile', id],
    () => api.get(`/users/${id}`),
    { enabled: !!id, retry: false }
  );

  // Fetch their dev stats
  const { data: devData } = useQuery(
    ['dev-activity-public', id],
    () => api.get(`/dev-activity/public/${id}`),
    { enabled: !!id, retry: false }
  );

  // Fetch connections count
  const { data: connData } = useQuery(
    ['user-connections', id],
    () => api.get(`/users/${id}/connections`),
    { enabled: !!id }
  );

  // Fetch user projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery(
    ['user-projects', id],
    () => api.get(`/projects/user/${id}`).then(res => res.data),
    { enabled: !!id }
  );

  const targetUser = profileData?.data?.user;
  const stats = devData?.data?.stats;
  const usernames = devData?.data?.usernames;
  const alumnexScore = devData?.data?.alumnexScore || 0;
  const hasDevProfile = !!devData?.data;

  const radarData = [
    { subject: 'Algorithms', A: Math.min((stats?.leetcode?.totalSolved || 0) / 5, 100) },
    { subject: 'Consistency', A: Math.min(alumnexScore / 10, 100) },
    { subject: 'Open Source', A: Math.min(((stats?.github?.followers || 0) * 5) + ((stats?.github?.publicRepos || 0) * 2), 100) },
    { subject: 'Competitions', A: Math.min((stats?.hackerrank?.badgesCount || 0) * 15, 100) },
    { subject: 'Core CS', A: Math.min((stats?.gfg?.codingScore || 0) / 5, 100) },
  ];

  const lcBar = stats?.leetcode ? [
    { name: 'Easy', value: stats.leetcode.easySolved || 0, fill: '#10b981' },
    { name: 'Medium', value: stats.leetcode.mediumSolved || 0, fill: '#f59e0b' },
    { name: 'Hard', value: stats.leetcode.hardSolved || 0, fill: '#ef4444' },
  ] : [];

  const isOwnProfile = me?._id === id;

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-48 rounded-3xl bg-slate-800/60" />
        <div className="h-64 rounded-3xl bg-slate-800/60" />
      </div>
    );
  }

  if (profileError) {
    if (profileError.response?.status === 404) {
      const NotFound = require('./NotFound').default;
      return <NotFound />;
    }
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-2xl font-bold text-red-400 mb-2">Failed to load profile</p>
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white mt-2 transition-colors">Go back</button>
      </div>
    );
  }

  if (!targetUser) {
    const NotFound = require('./NotFound').default;
    return <NotFound />;
  }

  const tabs = [
    { key: 'about', label: 'About' },
    { key: 'devpulse', label: '⚡ DevPulse' },
    { key: 'projects', label: 'Projects' },
    { key: 'network', label: 'Network' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      {/* ── Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f0c29,#1e1b4b,#0f172a)' }}
      >
        <div className="p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
                {targetUser.photo && targetUser.photo !== 'default-avatar.png' ? (
                  <img loading="lazy" src={targetUser.photo} alt={targetUser.name} className="w-full h-full object-cover" />
                ) : (
                  <DefaultAvatar className="w-full h-full" />
                )}
              </div>
              {hasDevProfile && (
                <div className="absolute -bottom-2 -right-2 bg-indigo-500 rounded-lg px-2 py-0.5 text-xs font-bold text-white shadow">
                  {alumnexScore}pts
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-black text-white mb-1">{targetUser.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-slate-400 mb-3">
                <span className="capitalize bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">{targetUser.role}</span>
                {targetUser.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{targetUser.location}</span>
                )}
                {targetUser.country && (
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{targetUser.country}</span>
                )}
                {targetUser.college && (
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{targetUser.college}</span>
                )}
                {targetUser.role === 'alumni' && targetUser.alumniInfo?.company && (
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{targetUser.alumniInfo.company}</span>
                )}
              </div>
              {targetUser.bio && <p className="text-slate-400 text-sm leading-relaxed max-w-lg">{targetUser.bio}</p>}
            </div>

            {/* Actions */}
            {!isOwnProfile && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate('/chat', { state: { startChatWith: targetUser.email } })}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
              </div>
            )}
          </div>

          {/* Follower stats */}
          <div className="flex gap-6 mt-6 pt-6 border-t border-white/5">
            <div className="text-center">
              <p className="text-xl font-black text-white">{connData?.data?.followers?.length ?? 0}</p>
              <p className="text-xs text-slate-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-white">{connData?.data?.following?.length ?? 0}</p>
              <p className="text-xs text-slate-500">Following</p>
            </div>
            {hasDevProfile && (
              <div className="text-center">
                <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{alumnexScore}</p>
                <p className="text-xs text-slate-500">Alumnex Score</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-slate-700/50 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.key ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div layoutId="upTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500" />
            )}
          </button>
        ))}
      </div>

      {/* ── About Tab ── */}
      {activeTab === 'about' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {targetUser.skills?.length > 0 && (
            <div className="rounded-2xl p-6 border border-slate-700/50" style={{ background: '#0f172a' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {targetUser.skills.map(s => (
                  <span key={s} className="px-3 py-1 rounded-full text-sm bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">{s}</span>
                ))}
              </div>
            </div>
          )}
          {targetUser.role === 'alumni' && (targetUser.alumniInfo?.company || targetUser.alumniInfo?.position) && (
            <div className="rounded-2xl p-6 border border-slate-700/50" style={{ background: '#0f172a' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Work</h3>
              <p className="text-white font-semibold">{targetUser.alumniInfo?.position}</p>
              <p className="text-slate-400 text-sm">{targetUser.alumniInfo?.company} · {targetUser.alumniInfo?.industry}</p>
            </div>
          )}
          {targetUser.role === 'college' && targetUser.collegeInfo && (
            <div className="rounded-2xl p-6 border border-slate-700/50" style={{ background: '#0f172a' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Institution Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {targetUser.collegeInfo.establishedYear && (
                  <div>
                    <p className="text-slate-500 text-xs">Established</p>
                    <p className="text-white font-semibold">{targetUser.collegeInfo.establishedYear}</p>
                  </div>
                )}
                {targetUser.collegeInfo.accreditation && (
                  <div>
                    <p className="text-slate-500 text-xs">Accreditation</p>
                    <p className="text-white font-semibold">{targetUser.collegeInfo.accreditation}</p>
                  </div>
                )}
              </div>
              {targetUser.collegeInfo.websiteMetadata?.title && (
                <a 
                  href={targetUser.collegeInfo.officialUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block mt-4 rounded-xl border border-slate-700 overflow-hidden hover:border-indigo-500 transition-colors"
                >
                  {targetUser.collegeInfo.websiteMetadata.image && (
                    <img loading="lazy" src={targetUser.collegeInfo.websiteMetadata.image} alt="Website Preview" className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4 bg-slate-800/50">
                    <p className="text-white font-bold text-sm line-clamp-1">{targetUser.collegeInfo.websiteMetadata.title}</p>
                    {targetUser.collegeInfo.websiteMetadata.description && (
                      <p className="text-slate-400 text-xs line-clamp-2 mt-1">{targetUser.collegeInfo.websiteMetadata.description}</p>
                    )}
                    <p className="text-indigo-400 text-xs mt-2 truncate flex items-center gap-1"><ExternalLink className="w-3 h-3"/> {targetUser.collegeInfo.officialUrl}</p>
                  </div>
                </a>
              )}
            </div>
          )}
          {targetUser.socialLinks && Object.values(targetUser.socialLinks).some(Boolean) && (
            <div className="rounded-2xl p-6 border border-slate-700/50" style={{ background: '#0f172a' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Links</h3>
              <div className="flex flex-wrap gap-3">
                {targetUser.socialLinks.github && <a href={targetUser.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/>GitHub</a>}
                {targetUser.socialLinks.linkedin && <a href={targetUser.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/>LinkedIn</a>}
                {targetUser.socialLinks.website && <a href={targetUser.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/>Website</a>}
                {targetUser.socialLinks.portfolio && <a href={targetUser.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3"/>Portfolio</a>}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── DevPulse Tab ── */}
      {activeTab === 'devpulse' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {!hasDevProfile ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg font-semibold">No DevPulse data yet</p>
              <p className="text-slate-500 text-sm mt-1">{targetUser.name} hasn't linked any coding profiles.</p>
            </div>
          ) : (
            <>
              {/* Score Banner */}
              <div
                className="rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 border border-white/5"
                style={{ background: 'linear-gradient(135deg,#0f0c29,#1a1645)' }}
              >
                <ScoreRing score={alumnexScore} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">Alumnex Score</span>
                  </div>
                  <p className="text-3xl font-black text-white">{alumnexScore} <span className="text-base text-slate-500 font-medium">/ 1000</span></p>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-1"><Target className="w-3 h-3" /> Based on problems solved, repos & badges</p>
                </div>
              </div>

              {/* Platform chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PlatformChip icon={GitCommit} label="GitHub Repos" value={stats?.github?.publicRepos} sub={`${stats?.github?.followers ?? 0} followers`} color="#94a3b8" url={getPlatformUrl(stats, usernames, 'github')} />
                <PlatformChip icon={Code} label="LeetCode Solved" value={stats?.leetcode?.totalSolved} sub={`Rank #${stats?.leetcode?.ranking?.toLocaleString() ?? '—'}`} color="#f59e0b" url={getPlatformUrl(stats, usernames, 'leetcode')} />
                <PlatformChip icon={Trophy} label="HackerRank Badges" value={stats?.hackerrank?.badgesCount} sub={`Level ${stats?.hackerrank?.level ?? 1}`} color="#22c55e" url={getPlatformUrl(stats, usernames, 'hackerrank')} />
                <PlatformChip icon={TrendingUp} label="GFG Coding Score" value={stats?.gfg?.codingScore} sub={`${stats?.gfg?.problemsSolved ?? 0} problems`} color="#10b981" url={getPlatformUrl(stats, usernames, 'gfg')} />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-2xl p-5 border border-slate-700/50" style={{ background: '#0f172a' }}>
                  <h3 className="text-sm font-bold text-white mb-1">Skill Radar</h3>
                  <p className="text-xs text-slate-500 mb-3">Normalized performance</p>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Skills" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-2xl p-5 border border-slate-700/50" style={{ background: '#0f172a' }}>
                  <h3 className="text-sm font-bold text-white mb-1">LeetCode Difficulty</h3>
                  <p className="text-xs text-slate-500 mb-3">Problems by difficulty</p>
                  <div style={{ height: 220 }}>
                    {lcBar.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lcBar} barCategoryGap="35%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#fff' }} cursor={{ fill: '#1e293b' }} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {lcBar.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-600">
                        <Code className="w-8 h-8 mb-2" />
                        <p className="text-sm">No LeetCode data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ── Projects Tab ── */}
      {activeTab === 'projects' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {projectsLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
          ) : projectsData?.projects?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projectsData.projects.map(project => (
                <div key={project._id} className="rounded-2xl p-5 border border-slate-700/50 flex flex-col h-full" style={{ background: '#0f172a' }}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-white line-clamp-1">{project.title}</h3>
                    <div className="flex space-x-2">
                      {project.githubLink && <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors"><Code className="w-4 h-4"/></a>}
                      {project.liveLink && <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors"><ExternalLink className="w-4 h-4"/></a>}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-1">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags?.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded-lg border border-indigo-500/20">{tag}</span>
                    ))}
                    {project.tags?.length > 3 && <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded-lg">+{project.tags.length - 3}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderGit2 className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg font-semibold">No Projects</p>
              <p className="text-slate-500 text-sm mt-1">{targetUser.name} hasn't added any projects yet.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Network Tab ── */}
      {activeTab === 'network' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Followers', data: connData?.data?.followers },
            { label: 'Following', data: connData?.data?.following },
          ].map(({ label, data }) => (
            <div key={label} className="rounded-2xl p-5 border border-slate-700/50" style={{ background: '#0f172a' }}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />{label} ({data?.length ?? 0})
              </h3>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {(!data || data.length === 0) ? (
                  <p className="text-slate-600 text-sm italic">None yet</p>
                ) : data.map(u => (
                  <div
                    key={u._id}
                    onClick={() => navigate(`/users/${u._id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    {u.photo && u.photo !== 'default-avatar.png' ? (
                      <img loading="lazy" src={u.photo} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <DefaultAvatar className="w-9 h-9 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 capitalize truncate">{u.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

    </div>
  );
};

export default UserProfile;

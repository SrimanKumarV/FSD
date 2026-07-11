import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquarePlus, Star, Send, CheckCircle, Clock,
  Bug, Lightbulb, Layout, Zap, HelpCircle, MessageCircle,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// ── Data ──────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'bug',         label: 'Bug Report',       icon: Bug,          color: '#ef4444', bg: '#fef2f2' },
  { value: 'feature',     label: 'Feature Request',  icon: Lightbulb,    color: '#f59e0b', bg: '#fffbeb' },
  { value: 'ui',          label: 'UI / Design',       icon: Layout,       color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'performance', label: 'Performance',       icon: Zap,          color: '#06b6d4', bg: '#ecfeff' },
  { value: 'general',     label: 'General',           icon: MessageCircle,color: '#6366f1', bg: '#eef2ff' },
  { value: 'other',       label: 'Other',             icon: HelpCircle,   color: '#64748b', bg: '#f8fafc' },
];

const STATUS_STYLES = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'in-review':{ label: 'In Review', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  resolved:  { label: 'Resolved',  color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
  closed:    { label: 'Closed',    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

// ── Star Rating ───────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange }) => (
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n} type="button" onClick={() => onChange(n)}
        className="transition-transform hover:scale-110 focus:outline-none"
      >
        <Star
          className="w-8 h-8 transition-colors"
          fill={n <= value ? '#f59e0b' : 'none'}
          stroke={n <= value ? '#f59e0b' : '#94a3b8'}
          strokeWidth={1.5}
        />
      </button>
    ))}
  </div>
);

// ── Past Feedback Card ────────────────────────────────────────────────────────
const FeedbackCard = ({ item }) => {
  const [open, setOpen] = useState(false);
  const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[4];
  const CatIcon = cat.icon;
  const status = STATUS_STYLES[item.status] || STATUS_STYLES.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-700/50 overflow-hidden"
      style={{ background: '#0f172a' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
               style={{ background: `${cat.color}20` }}>
            <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{item.subject}</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className="w-3 h-3" fill={n <= item.rating ? '#f59e0b' : 'none'}
                        stroke={n <= item.rating ? '#f59e0b' : '#475569'} strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={{ color: status.color, background: status.bg + '33', borderColor: status.border + '66' }}>
                {status.label}
              </span>
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
               : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-slate-700/50 pt-4">
              <p className="text-sm text-slate-400 leading-relaxed">{item.message}</p>
              {item.adminReply && (
                <div className="flex gap-3 mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <CheckCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-indigo-400 mb-1">Admin Reply</p>
                    <p className="text-sm text-slate-300">{item.adminReply}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Feedback = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('submit');
  const [form, setForm] = useState({ category: '', rating: 0, subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const { data: historyData, isLoading: histLoading } = useQuery(
    'my-feedback',
    () => api.get('/feedback/mine'),
    { enabled: activeTab === 'history' }
  );

  const submitMutation = useMutation(
    (payload) => api.post('/feedback', payload),
    {
      onSuccess: () => {
        toast.success('Feedback submitted! Thank you 🙌');
        qc.invalidateQueries('my-feedback');
        setSubmitted(true);
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Submission failed'),
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Please select a category');
    if (!form.rating) return toast.error('Please give a rating');
    if (!form.subject.trim()) return toast.error('Please add a subject');
    if (!form.message.trim()) return toast.error('Please write your feedback');
    submitMutation.mutate(form);
  };

  const resetForm = () => {
    setForm({ category: '', rating: 0, subject: '', message: '' });
    setSubmitted(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f0c29,#1e1b4b,#0f172a)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <MessageSquarePlus className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-1">Share Your Feedback</h1>
            <p className="text-slate-400 leading-relaxed">
              Help us improve Alumnex Connect. Every piece of feedback is reviewed by our team and shapes what we build next.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50 gap-1">
        {[{ key: 'submit', label: 'Submit Feedback' }, { key: 'history', label: 'My Submissions' }].map(tab => (
          <button
            key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-semibold transition-colors relative ${activeTab === tab.key ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div layoutId="fbTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500" />
            )}
          </button>
        ))}
      </div>

      {/* Submit Tab */}
      {activeTab === 'submit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-2">Feedback Received!</h2>
              <p className="text-slate-400 mb-8 max-w-md">Our team reviews every submission. You can track the status in "My Submissions".</p>
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
              >
                Submit Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div className="rounded-2xl border border-slate-700/50 p-6" style={{ background: '#0f172a' }}>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Category</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const selected = form.category === cat.value;
                    return (
                      <button
                        key={cat.value} type="button"
                        onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          selected
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: selected ? cat.color : undefined }} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating */}
              <div className="rounded-2xl border border-slate-700/50 p-6" style={{ background: '#0f172a' }}>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Overall Experience
                </h3>
                <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                {form.rating > 0 && (
                  <p className="text-sm text-slate-500 mt-2">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][form.rating]}
                  </p>
                )}
              </div>

              {/* Subject + Message */}
              <div className="rounded-2xl border border-slate-700/50 p-6 space-y-4" style={{ background: '#0f172a' }}>
                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    maxLength={150}
                    placeholder="Brief summary of your feedback…"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                  <p className="text-xs text-slate-600 mt-1 text-right">{form.subject.length}/150</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">Details</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={5}
                    maxLength={2000}
                    placeholder="Describe your experience in detail. The more context you provide, the better we can address it…"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm resize-none"
                  />
                  <p className="text-xs text-slate-600 mt-1 text-right">{form.message.length}/2000</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitMutation.isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-90 text-white font-semibold rounded-2xl transition-opacity disabled:opacity-50 shadow-lg shadow-indigo-500/20 text-sm"
              >
                <Send className="w-4 h-4" />
                {submitMutation.isLoading ? 'Submitting…' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {histLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-800/60" />)}
            </div>
          ) : historyData?.data?.feedbacks?.length > 0 ? (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 px-1">
                <Clock className="w-3 h-3" />
                {historyData.data.feedbacks.length} submission(s) — most recent first
              </div>
              {historyData.data.feedbacks.map(item => (
                <FeedbackCard key={item._id} item={item} />
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 font-semibold">No submissions yet</p>
              <p className="text-slate-500 text-sm mt-1">Your feedback history will appear here.</p>
              <button
                onClick={() => setActiveTab('submit')}
                className="mt-6 px-5 py-2.5 text-sm font-medium text-indigo-400 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/10 transition-colors"
              >
                Submit your first feedback
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Feedback;

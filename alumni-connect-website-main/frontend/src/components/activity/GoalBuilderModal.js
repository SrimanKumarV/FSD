import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, ChevronRight, ChevronLeft, Target, Code, BookOpen,
  Globe, TrendingUp, Zap, Clock, Bell, Sparkles, Layers
} from 'lucide-react';
import PlatformIcon from '../PlatformIcon';

const categories = [
  { id: 'coding', name: 'Coding & Algorithms', icon: Code, desc: 'LeetCode, GitHub, HackerRank, Codeforces' },
  { id: 'learning', name: 'Language & Courses', icon: BookOpen, desc: 'Duolingo, CS Theory, Tech Articles' },
  { id: 'project', name: 'Building & Open Source', icon: Globe, desc: 'GitHub commits, PRs, Portfolio' },
  { id: 'career', name: 'Career & Opportunities', icon: TrendingUp, desc: 'Job applications, Resume reviews, Mentorship' },
  { id: 'custom', name: 'Custom Goal', icon: Target, desc: 'Personal habit or custom metric' }
];

const trackingModes = [
  { id: 'automatic', name: 'Automatic Verification', icon: Zap, desc: 'Platform activity automatically verifies your progress.' },
  { id: 'hybrid', name: 'Hybrid (Auto + Manual)', icon: Layers, desc: 'Auto-detects when possible, with manual check-in fallback.' },
  { id: 'manual', name: 'Manual Check-in', icon: Check, desc: 'Check off your goal daily with a single tap.' }
];

const platformOptions = [
  { id: 'custom', name: 'None / General', icon: Target },
  { id: 'github', name: 'GitHub', icon: () => <PlatformIcon platform="github" className="w-4 h-4" /> },
  { id: 'leetcode', name: 'LeetCode', icon: () => <PlatformIcon platform="leetcode" className="w-4 h-4" /> },
  { id: 'duolingo', name: 'Duolingo', icon: () => <PlatformIcon platform="duolingo" className="w-4 h-4" /> },
  { id: 'hackerrank', name: 'HackerRank', icon: () => <PlatformIcon platform="hackerrank" className="w-4 h-4" /> },
  { id: 'codeforces', name: 'Codeforces', icon: () => <PlatformIcon platform="codeforces" className="w-4 h-4" /> },
  { id: 'gfg', name: 'GeeksforGeeks', icon: () => <PlatformIcon platform="gfg" className="w-4 h-4" /> }
];

const GoalBuilderModal = ({ isOpen, onClose, onSave, initialGoal = null }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    category: 'coding',
    platform: 'custom',
    trackingMode: 'automatic',
    priority: 'medium',
    target: '',
    targetValue: 1,
    targetMetric: 'problems',
    estimatedMinutes: 20,
    frequency: 'daily',
    customDays: [1, 2, 3, 4, 5],
    reminderTime: '20:00',
    emailEnabled: true,
    inAppEnabled: true
  });

  useEffect(() => {
    if (initialGoal) {
      setFormData({
        title: initialGoal.title || '',
        category: initialGoal.category || 'coding',
        platform: initialGoal.platform || 'custom',
        trackingMode: initialGoal.trackingMode || 'manual',
        priority: initialGoal.priority || 'medium',
        target: initialGoal.target || '',
        targetValue: initialGoal.targetValue || 1,
        targetMetric: initialGoal.targetMetric || 'problems',
        estimatedMinutes: initialGoal.estimatedMinutes || 20,
        frequency: initialGoal.frequency || 'daily',
        customDays: initialGoal.customDays || [1, 2, 3, 4, 5],
        reminderTime: initialGoal.reminderTime || '20:00',
        emailEnabled: initialGoal.emailEnabled !== false,
        inAppEnabled: initialGoal.inAppEnabled !== false
      });
      setStep(1);
    } else {
      setStep(1);
    }
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {initialGoal ? 'Edit Goal' : 'Goal Builder'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Step {step} of 4 — {step === 1 ? 'Focus Area' : step === 2 ? 'Tracking & Platform' : step === 3 ? 'Target & Schedule' : 'Review & Confirm'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: CATEGORY */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                What area of your career momentum do you want to build?
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = formData.category === cat.id;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                          : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{cat.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.desc}</p>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: TRACKING MODE & PLATFORM */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  How should Alumnex track this goal?
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {trackingModes.map(mode => {
                    const Icon = mode.icon;
                    const isSelected = formData.trackingMode === mode.id;

                    return (
                      <div
                        key={mode.id}
                        onClick={() => setFormData(prev => ({ ...prev, trackingMode: mode.id }))}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                            : 'border-gray-200 dark:border-gray-800 hover:border-indigo-300'
                        }`}
                      >
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{mode.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{mode.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Connect to a specific platform (optional)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {platformOptions.map(p => {
                    const isSelected = formData.platform === p.id;
                    const Icon = p.icon;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setFormData(prev => ({ ...prev, platform: p.id }))}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold'
                            : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs">{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TARGET & SCHEDULE */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Solve 1 LeetCode problem, Push GitHub commits"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Target Metric
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 1 problem, 30 mins"
                    value={formData.target}
                    onChange={e => setFormData(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Estimated Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={formData.estimatedMinutes}
                    onChange={e => setFormData(prev => ({ ...prev, estimatedMinutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'daily', label: 'Every Day' },
                    { id: 'weekdays', label: 'Mon – Fri' },
                    { id: 'custom', label: 'Custom' }
                  ].map(f => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => setFormData(prev => ({ ...prev, frequency: f.id }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.frequency === f.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {formData.frequency === 'custom' && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                      Select Days (Week Starting on Sunday)
                    </label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {[
                        { day: 0, label: 'Sun' },
                        { day: 1, label: 'Mon' },
                        { day: 2, label: 'Tue' },
                        { day: 3, label: 'Wed' },
                        { day: 4, label: 'Thu' },
                        { day: 5, label: 'Fri' },
                        { day: 6, label: 'Sat' }
                      ].map(d => {
                        const selected = (formData.customDays || [1, 2, 3, 4, 5]).includes(d.day);
                        return (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => {
                              const cur = formData.customDays || [1, 2, 3, 4, 5];
                              const next = cur.includes(d.day) ? cur.filter(x => x !== d.day) : [...cur, d.day].sort();
                              if (next.length > 0) setFormData(prev => ({ ...prev, customDays: next }));
                            }}
                            className={`py-2 rounded-xl text-xs font-bold transition-all ${
                              selected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['high', 'medium', 'low'].map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                        formData.priority === p
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Goal Summary</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 capitalize">
                    {formData.trackingMode}
                  </span>
                </div>
                <h4 className="text-lg font-black text-gray-900 dark:text-white">{formData.title || 'Untitled Goal'}</h4>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span className="px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 capitalize">
                    Category: {formData.category}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 capitalize">
                    Platform: {formData.platform}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 capitalize">
                    Frequency: {formData.frequency}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    Est. {formData.estimatedMinutes} mins
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Daily Reminder Time
                </label>
                <input
                  type="time"
                  value={formData.reminderTime}
                  onChange={e => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 3 && !formData.title.trim()) {
                  alert('Please enter a goal title.');
                  return;
                }
                setStep(prev => prev + 1);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{initialGoal ? 'Update Goal' : 'Save Goal'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GoalBuilderModal;

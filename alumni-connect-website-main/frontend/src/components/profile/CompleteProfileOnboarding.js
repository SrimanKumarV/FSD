import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, Save } from 'lucide-react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const COLLEGES = [
  'Kongu Engineering College',
  'IIT Bombay',
  'IIT Delhi',
  'IIT Madras',
  'NIT Trichy',
  'VIT Vellore',
  'BITS Pilani',
  'PSG College of Technology',
  'Anna University',
  'Other'
];

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'Germany',
  'Other'
];

const CompleteProfileOnboarding = ({ user, onComplete }) => {
  const [country, setCountry] = useState(user?.country || '');
  const [college, setCollege] = useState(user?.college || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!country || !college) {
      toast.error('Both Country and College are mandatory to proceed.');
      return;
    }

    try {
      setLoading(true);
      await onComplete({ country, college });
      // The ProtectedRoute will automatically unmount this component since user.country & user.college will now exist.
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/30 shadow-lg">
            <Building2 className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Welcome Aboard!</h2>
          <p className="text-slate-400">
            To use the platform seamlessly and join our Codolio-style Global Leaderboards, we need two quick details from you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-indigo-400" />
                Select Your Country <span className="text-red-400 ml-1">*</span>
              </label>
              <select 
                value={country} 
                onChange={e => setCountry(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="" disabled>Choose Country...</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center">
                <Building2 className="w-4 h-4 mr-1 text-indigo-400" />
                Select Your College <span className="text-red-400 ml-1">*</span>
              </label>
              <select 
                value={college} 
                onChange={e => setCollege(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="" disabled>Choose College...</option>
                {COLLEGES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !country || !college}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-indigo-500/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save & Continue
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CompleteProfileOnboarding;

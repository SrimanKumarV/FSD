import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Video, Users, Plus } from 'lucide-react';
import { format } from 'date-fns';

export const CreateCalendarEventModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  defaultDate = new Date()
}) => {
  const getDefaultStartDate = () => {
    const d = new Date(defaultDate);
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const getDefaultEndDate = () => {
    const d = new Date(defaultDate);
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 2);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    location: '',
    start: getDefaultStartDate(),
    end: getDefaultEndDate(),
    allDay: false,
    createMeet: false,
    attendeeEmails: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.summary.trim()) return;

    const attendees = formData.attendeeEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0)
      .map(email => ({ email }));

    onSubmit({
      summary: formData.summary.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      start: new Date(formData.start).toISOString(),
      end: new Date(formData.end).toISOString(),
      allDay: formData.allDay,
      createMeet: formData.createMeet,
      attendees
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Create Google Calendar Event
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="e.g. Project Sprint Sync or Mentor Discussion"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Date-time range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Starts *
                </label>
                <input
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  required
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Ends *
                </label>
                <input
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  required
                  value={formData.end}
                  onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Checkboxes: All Day & Google Meet */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.allDay}
                  onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>All-day event</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <input
                  type="checkbox"
                  checked={formData.createMeet}
                  onChange={(e) => setFormData({ ...formData, createMeet: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" />
                  <span>Add Google Meet video link</span>
                </span>
              </label>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Location (optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Room 402, Main Library or Virtual"
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Guests (comma separated emails)
              </label>
              <input
                type="text"
                value={formData.attendeeEmails}
                onChange={(e) => setFormData({ ...formData, attendeeEmails: e.target.value })}
                placeholder="mentor@example.com, peer@college.edu"
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Description / Agenda
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Topics to discuss, project deliverables, or prep notes..."
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.summary.trim()}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Event...' : 'Create Event'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateCalendarEventModal;

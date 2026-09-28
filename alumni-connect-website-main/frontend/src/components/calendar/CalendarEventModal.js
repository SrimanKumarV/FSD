import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  MapPin, 
  Video, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Calendar as CalendarIcon, 
  Users, 
  UserCheck 
} from 'lucide-react';
import { format } from 'date-fns';
import GoogleCalendarBadge from './GoogleCalendarBadge';

export const CalendarEventModal = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isDeleting
}) => {
  if (!isOpen || !event) return null;

  const meetUrl = event.conferenceData?.meetUrl || event.meetUrl;
  const isGoogle = event.source === 'google' || event.eventType === 'google';

  const formatDateTime = (dateVal) => {
    try {
      return format(new Date(dateVal), 'EEEE, MMMM d, yyyy • h:mm a');
    } catch (e) {
      return '';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <GoogleCalendarBadge source={event.source} eventType={event.eventType} size="xs" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-snug break-words">
                {event.summary || '(No title)'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-gray-700 dark:text-gray-300">
            {/* Time / Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Date & Time</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {event.allDay ? 'All Day Event' : `${formatDateTime(event.start)} – ${format(new Date(event.end), 'h:mm a')}`}
                </p>
              </div>
            </div>

            {/* Google Meet Callout */}
            {meetUrl && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white flex-shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
                      Google Meet Video Conference
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                      {meetUrl}
                    </p>
                  </div>
                </div>
                <a
                  href={meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm whitespace-nowrap flex items-center gap-1.5 transition-all"
                >
                  <span>Join Meeting</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Location</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{event.location}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-900 dark:text-white">Description</p>
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            )}

            {/* Attendees */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>Attendees ({event.attendees.length})</span>
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {event.attendees.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                      <span className="text-gray-800 dark:text-gray-200 font-medium">
                        {a.displayName || a.email}
                      </span>
                      {a.responseStatus && (
                        <span className="text-[10px] text-gray-400 capitalize">
                          {a.responseStatus}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Web Link */}
            {event.htmlLink && (
              <div className="pt-2">
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <span>Open in Google Calendar web</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between gap-3">
            {isGoogle ? (
              <button
                type="button"
                onClick={() => onDelete(event._id || event.googleEventId)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CalendarEventModal;

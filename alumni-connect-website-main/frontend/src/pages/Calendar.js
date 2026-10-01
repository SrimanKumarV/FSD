import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  useGoogleCalendarStatus, 
  useGoogleCalendarEvents, 
  useGoogleCalendarSync, 
  useCreateGoogleCalendarEvent, 
  useDeleteGoogleCalendarEvent 
} from '../hooks/useGoogleCalendar';
import { useSocket } from '../contexts/SocketContext';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarToolbar from '../components/calendar/CalendarToolbar';
import CalendarView from '../components/calendar/CalendarView';
import CalendarConnectCard from '../components/calendar/CalendarConnectCard';
import CalendarEventModal from '../components/calendar/CalendarEventModal';
import CreateCalendarEventModal from '../components/calendar/CreateCalendarEventModal';
import CalendarSettings from '../components/calendar/CalendarSettings';
import UpcomingEvents from '../components/calendar/UpcomingEvents';
import toast from 'react-hot-toast';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

const Calendar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket } = useSocket();
  const [oauthNotice, setOauthNotice] = useState(null);

  // URL query param notifications
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      toast.success('Google Calendar connected successfully!', { icon: '📅' });
      searchParams.delete('connected');
      setSearchParams(searchParams, { replace: true });
    }
    const err = searchParams.get('error');
    const category = searchParams.get('error_category');
    if (err) {
      const decodedErr = decodeURIComponent(err);
      if (category === 'tester_restriction' || decodedErr.includes('403') || decodedErr.includes('Testing mode') || decodedErr.includes('access_denied')) {
        setOauthNotice({
          type: 'warning',
          title: 'Google OAuth Access Restriction (403: access_denied)',
          message: decodedErr.includes('Testing mode')
            ? decodedErr
            : 'Google Cloud OAuth consent screen is currently in Testing status. Only developer-approved test users configured under Google Cloud Console > Audience / Test users can connect until the application publishing status is set to In Production.',
          actionText: 'Open Google Cloud Console',
          actionUrl: 'https://console.cloud.google.com/apis/credentials/consent'
        });
        toast.error('Google Calendar authorization restricted by Google Cloud test user policy.', { duration: 6000 });
      } else if (category === 'user_denied' || decodedErr.includes('cancelled') || decodedErr.includes('declined')) {
        toast('Google Calendar connection was cancelled or permission denied.', { icon: 'ℹ️' });
      } else if (decodedErr.includes('redirect_uri_mismatch') || decodedErr.includes('400')) {
        toast.error('Google OAuth Error (400): Redirect URI mismatch. Please verify Authorized Redirect URIs in Google Cloud Console.', { duration: 6000 });
      } else {
        toast.error(decodedErr, { duration: 5000 });
      }
      searchParams.delete('error');
      searchParams.delete('error_category');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // View state: 'month' | 'week' | 'day' | 'agenda'
  const isMobileInitial = typeof window !== 'undefined' && window.innerWidth < 768;
  const [view, setView] = useState(isMobileInitial ? 'agenda' : 'month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter & Search state
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Queries & Mutations
  const { data: statusData, isLoading: loadingStatus, refetch: refetchStatus } = useGoogleCalendarStatus();
  const { data: rawEvents = [], isLoading: loadingEvents, refetch: refetchEvents } = useGoogleCalendarEvents();
  const syncMutation = useGoogleCalendarSync();
  const createEventMutation = useCreateGoogleCalendarEvent();
  const deleteEventMutation = useDeleteGoogleCalendarEvent();

  const isConnected = Boolean(statusData?.connected);
  const isReauthRequired = statusData?.status === 'reauthorization_required';

  // Listen for realtime Socket.IO calendar updates
  useEffect(() => {
    if (socket) {
      const handleSync = () => {
        refetchEvents();
        refetchStatus();
      };
      socket.on('calendar:sync_completed', handleSync);
      return () => {
        socket.off('calendar:sync_completed', handleSync);
      };
    }
  }, [socket, refetchEvents, refetchStatus]);

  // Date navigation handlers
  const handlePrevious = () => {
    if (view === 'month') setCurrentDate(prev => subMonths(prev, 1));
    else if (view === 'week') setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => subDays(prev, 1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(prev => addMonths(prev, 1));
    else if (view === 'week') setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSelectDay = (day) => {
    setCurrentDate(day);
    if (window.innerWidth < 768) {
      setView('agenda');
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleCreateEventSubmit = async (eventData) => {
    await createEventMutation.mutateAsync(eventData);
    setIsCreateModalOpen(false);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEventMutation.mutateAsync(eventId);
      setIsDetailsModalOpen(false);
    }
  };

  // Filter, deduplicate, and search events
  const filteredEvents = useMemo(() => {
    const seenEventKeys = new Set();

    return rawEvents.filter(evt => {
      // 1. Source / Type filter
      if (activeFilter === 'google' && evt.source !== 'google' && evt.eventType !== 'google') return false;
      if (activeFilter === 'alumnex_event' && evt.eventType !== 'alumnex_event') return false;
      if (activeFilter === 'mentorship' && evt.eventType !== 'mentorship') return false;
      if (activeFilter === 'career' && evt.eventType !== 'career') return false;

      // 2. Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const titleMatch = evt.summary?.toLowerCase().includes(query);
        const descMatch = evt.description?.toLowerCase().includes(query);
        const locMatch = evt.location?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !locMatch) return false;
      }

      // 3. Deduplicate identical events occurring on the same date (e.g. from multiple holiday subscriptions)
      const startDateStr = evt.start ? new Date(evt.start).toISOString().split('T')[0] : '';
      const dedupeKey = `${(evt.summary || '').trim().toLowerCase()}_${startDateStr}`;
      if (seenEventKeys.has(dedupeKey)) {
        return false;
      }
      seenEventKeys.add(dedupeKey);

      return true;
    });
  }, [rawEvents, activeFilter, search]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 0. OAuth Status / Restriction Notice Banner */}
      {oauthNotice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                {oauthNotice.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed max-w-2xl">
                {oauthNotice.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {oauthNotice.actionUrl && (
              <a
                href={oauthNotice.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95"
              >
                <span>{oauthNotice.actionText || 'Open Console'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setOauthNotice(null)}
              className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* 1. Connection / Reauthorization Banner */}
      {(!isConnected || isReauthRequired) && (
        <CalendarConnectCard
          isReauth={isReauthRequired}
          onConnectSuccess={() => {
            refetchStatus();
            refetchEvents();
          }}
        />
      )}

      {/* 1b. Google Calendar API Not Enabled Warning Banner */}
      {isConnected && (statusData?.lastError?.message?.includes('disabled') || statusData?.lastError?.message?.includes('not been used')) && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                Google Calendar API Activation Required
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed max-w-2xl">
                Your account is connected, but the <strong>Google Calendar API</strong> is currently disabled in Google Cloud project <code>253683997850</code>. Enable it once in Google Cloud Console, then click "Sync Now" below to pull your events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <a
              href="https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=253683997850"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>Enable in Google Cloud</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isLoading ? 'animate-spin text-primary-500' : ''}`} />
              <span>{syncMutation.isLoading ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. Calendar Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onCreateEvent={() => setIsCreateModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isLoading}
        isConnected={isConnected}
        status={statusData?.status}
      />

      {/* 3. Toolbar & Filters */}
      <CalendarToolbar
        search={search}
        onSearchChange={setSearch}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        eventCount={filteredEvents.length}
      />

      {/* 4. Main Calendar Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Calendar Core View (Takes 3 columns on desktop, full width on mobile) */}
        <div className="lg:col-span-3 min-w-0 w-full">
          <CalendarView
            view={view}
            currentDate={currentDate}
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            onSelectDay={handleSelectDay}
          />
        </div>

        {/* Sidebar: Upcoming Schedule & Schedule Info */}
        <div className="lg:col-span-1 space-y-5 w-full">
          <UpcomingEvents
            events={filteredEvents}
            onSelectEvent={handleSelectEvent}
            maxItems={6}
          />
        </div>
      </div>

      {/* 5. Modals */}
      <CalendarEventModal
        event={selectedEvent}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onDelete={handleDeleteEvent}
        isDeleting={deleteEventMutation.isLoading}
      />

      <CreateCalendarEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEventSubmit}
        isSubmitting={createEventMutation.isLoading}
        defaultDate={currentDate}
      />

      <CalendarSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        status={statusData}
      />
    </div>
  );
};

export default Calendar;

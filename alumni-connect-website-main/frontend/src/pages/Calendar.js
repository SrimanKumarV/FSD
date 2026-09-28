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

const Calendar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket } = useSocket();

  // URL query param notifications
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      toast.success('Google Calendar connected successfully!', { icon: '📅' });
      searchParams.delete('connected');
      setSearchParams(searchParams, { replace: true });
    }
    const err = searchParams.get('error');
    if (err) {
      toast.error(decodeURIComponent(err));
      searchParams.delete('error');
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

  // Filter and search events
  const filteredEvents = useMemo(() => {
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

      return true;
    });
  }, [rawEvents, activeFilter, search]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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

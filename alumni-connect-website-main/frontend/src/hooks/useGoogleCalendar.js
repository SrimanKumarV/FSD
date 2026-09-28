import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const CALENDAR_KEYS = {
  status: ['googleCalendarStatus'],
  calendars: ['googleCalendars'],
  events: (filters) => ['googleCalendarEvents', filters],
  scheduleContext: (params) => ['scheduleContext', params]
};

/**
 * Hook to retrieve Google Calendar connection status
 */
export const useGoogleCalendarStatus = () => {
  return useQuery(
    CALENDAR_KEYS.status,
    async () => {
      const response = await api.get('/google-calendar/status');
      return response.data || response;
    },
    {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: true
    }
  );
};

/**
 * Hook to retrieve user's list of Google calendars
 */
export const useGoogleCalendars = (enabled = true) => {
  return useQuery(
    CALENDAR_KEYS.calendars,
    async () => {
      const response = await api.get('/google-calendar/calendars');
      return response.data?.calendars || response.calendars || [];
    },
    {
      enabled,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );
};

/**
 * Hook to retrieve synchronized calendar events with date range / calendar filters
 */
export const useGoogleCalendarEvents = (filters = {}) => {
  return useQuery(
    CALENDAR_KEYS.events(filters),
    async () => {
      const response = await api.get('/google-calendar/events', { params: filters });
      return response.data?.events || response.events || [];
    },
    {
      staleTime: 2 * 60 * 1000,
      keepPreviousData: true
    }
  );
};

/**
 * Hook to retrieve today's schedule context and free time windows for Activity Hub & Dashboard
 */
export const useGoogleScheduleContext = (params = {}) => {
  return useQuery(
    CALENDAR_KEYS.scheduleContext(params),
    async () => {
      const response = await api.get('/google-calendar/schedule-context', { params });
      return response.data || response;
    },
    {
      staleTime: 60 * 1000,
      refetchInterval: 5 * 60 * 1000 // periodic background refresh
    }
  );
};

/**
 * Mutation hook for manual incremental synchronization
 */
export const useGoogleCalendarSync = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async () => {
      const response = await api.post('/google-calendar/sync');
      return response.data || response;
    },
    {
      onSuccess: (data) => {
        toast.success(`Calendar synchronized! (${data.syncedCount || 0} events updated)`);
        queryClient.invalidateQueries(['googleCalendarEvents']);
        queryClient.invalidateQueries(CALENDAR_KEYS.status);
        queryClient.invalidateQueries(['scheduleContext']);
        queryClient.invalidateQueries(['activity-dashboard']);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || err.message || 'Sync failed');
      }
    }
  );
};

/**
 * Mutation hook to update calendar settings (selected calendars, syncEnabled, timezone)
 */
export const useUpdateGoogleCalendarSettings = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (settings) => {
      const response = await api.put('/google-calendar/settings', settings);
      return response.data || response;
    },
    {
      onSuccess: () => {
        toast.success('Calendar settings saved');
        queryClient.invalidateQueries(CALENDAR_KEYS.status);
        queryClient.invalidateQueries(['googleCalendarEvents']);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to update settings');
      }
    }
  );
};

/**
 * Mutation hook to create a new event
 */
export const useCreateGoogleCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (eventData) => {
      const response = await api.post('/google-calendar/events', eventData);
      return response.data || response;
    },
    {
      onSuccess: () => {
        toast.success('Event added to Google Calendar!');
        queryClient.invalidateQueries(['googleCalendarEvents']);
        queryClient.invalidateQueries(['scheduleContext']);
        queryClient.invalidateQueries(CALENDAR_KEYS.status);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to create event');
      }
    }
  );
};

/**
 * Mutation hook to update an existing event
 */
export const useUpdateGoogleCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ eventId, eventData }) => {
      const response = await api.put(`/google-calendar/events/${eventId}`, eventData);
      return response.data || response;
    },
    {
      onSuccess: () => {
        toast.success('Event updated!');
        queryClient.invalidateQueries(['googleCalendarEvents']);
        queryClient.invalidateQueries(['scheduleContext']);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to update event');
      }
    }
  );
};

/**
 * Mutation hook to delete an event
 */
export const useDeleteGoogleCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (eventId) => {
      const response = await api.delete(`/google-calendar/events/${eventId}`);
      return response.data || response;
    },
    {
      onSuccess: () => {
        toast.success('Event removed from Calendar');
        queryClient.invalidateQueries(['googleCalendarEvents']);
        queryClient.invalidateQueries(['scheduleContext']);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to delete event');
      }
    }
  );
};

/**
 * Mutation hook to disconnect Google Calendar
 */
export const useDisconnectGoogleCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async () => {
      const response = await api.post('/google-calendar/disconnect');
      return response.data || response;
    },
    {
      onSuccess: () => {
        toast.success('Google Calendar disconnected');
        queryClient.invalidateQueries(CALENDAR_KEYS.status);
        queryClient.invalidateQueries(CALENDAR_KEYS.calendars);
        queryClient.invalidateQueries(['googleCalendarEvents']);
        queryClient.invalidateQueries(['scheduleContext']);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to disconnect');
      }
    }
  );
};

/**
 * Mutation hook to export an Alumnex Event into Google Calendar
 */
export const useExportAlumnexEvent = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ eventId, createMeet = false }) => {
      const response = await api.post('/google-calendar/events/from-alumnex', { eventId, createMeet });
      return response.data || response;
    },
    {
      onSuccess: (data) => {
        toast.success('Alumnex Event added to your Google Calendar!', { icon: '📅' });
        queryClient.invalidateQueries(['googleCalendarEvents']);
        queryClient.invalidateQueries(['scheduleContext']);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to add event to Google Calendar');
      }
    }
  );
};

/**
 * Mutation hook to export an Alumnex Mentorship Session into Google Calendar
 */
export const useExportMentorshipSession = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({ sessionId, createMeet = true }) => {
      const response = await api.post('/google-calendar/events/from-mentorship', { sessionId, createMeet });
      return response.data || response;
    },
    {
      onSuccess: (data) => {
        toast.success(
          data.meetUrl
            ? 'Mentorship session scheduled with Google Meet link!'
            : 'Mentorship session added to your Google Calendar!',
          { icon: '🤝' }
        );
        queryClient.invalidateQueries(['googleCalendarEvents']);
        queryClient.invalidateQueries(['scheduleContext']);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to add session to Google Calendar');
      }
    }
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  Bell, 
  Database, 
  Zap, 
  Cpu, 
  Mail, 
  RefreshCw, 
  Eye, 
  Search, 
  Filter, 
  Clock, 
  ChevronRight, 
  X, 
  Copy, 
  Check, 
  FileText, 
  Send,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDistanceToNow, format } from 'date-fns';

export const SystemHealthAdminTab = () => {
  const queryClient = useQueryClient();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [adminNote, setAdminNote] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // 1. Fetch System Health summary
  const { data: healthData, isLoading: loadingHealth, refetch: refetchHealth } = useQuery(
    ['admin-system-health'],
    () => api.get('/admin/system-health').then(res => res.data),
    { refetchInterval: 30000 }
  );

  // 2. Fetch Incidents with filters
  const { data: incidentsData, isLoading: loadingIncidents, refetch: refetchIncidents } = useQuery(
    ['admin-incidents', statusFilter, severityFilter, providerFilter, page],
    () => api.get('/admin/incidents', {
      params: {
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        provider: providerFilter || undefined,
        page,
        limit: 15
      }
    }).then(res => res.data),
    { keepPreviousData: true }
  );

  // Status update mutation
  const updateStatusMutation = useMutation(
    ({ id, status, note }) => api.patch(`/admin/incidents/${id}/status`, { status, note }),
    {
      onSuccess: () => {
        toast.success('Incident status updated');
        queryClient.invalidateQueries(['admin-incidents']);
        queryClient.invalidateQueries(['admin-system-health']);
        setAdminNote('');
        if (selectedIncident) {
          api.get(`/admin/incidents/${selectedIncident._id}`).then(res => {
            if (res.data?.incident) setSelectedIncident(res.data.incident);
          });
        }
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Failed to update incident');
      }
    }
  );

  // Live test integration mutation
  const testIntegrationMutation = useMutation(
    (provider) => api.post('/admin/system-health/test-integration', { provider }),
    {
      onSuccess: (res) => {
        toast.success(res.data?.testResult?.message || 'Connection test completed');
        refetchHealth();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Connection test failed');
      }
    }
  );

  const handleCopy = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'healthy':
        return { label: 'Healthy', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2 };
      case 'degraded':
        return { label: 'Degraded', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: AlertTriangle };
      case 'failing':
        return { label: 'Failing', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: XCircle };
      case 'configuration_error':
        return { label: 'Configuration Error', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: AlertCircle };
      default:
        return { label: 'Unknown', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Activity };
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white font-bold';
      case 'high':
        return 'bg-rose-500 text-white font-bold';
      case 'medium':
        return 'bg-amber-500 text-white font-semibold';
      case 'low':
        return 'bg-blue-500 text-white font-medium';
      case 'info':
      default:
        return 'bg-gray-400 text-white font-medium';
    }
  };

  const integrations = healthData?.integrations || {};

  return (
    <div className="space-y-8">
      {/* ─── SECTION 1: HEADER & HIGH-LEVEL SYSTEM PULSE ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-primary-500" />
            <span>System Health & Technical Diagnostics</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administrator-only integration telemetry, deduplicated incident tracking, and root-cause guidance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { refetchHealth(); refetchIncidents(); }}
            disabled={loadingHealth}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin text-primary-500' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 2: INTEGRATION HEALTH CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Google Calendar Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-gray-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            {(() => {
              const badge = getStatusBadge(integrations.googleCalendar?.status);
              const BadgeIcon = badge.icon;
              return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}>
                  <BadgeIcon className="w-3.5 h-3.5" />
                  <span>{badge.label}</span>
                </span>
              );
            })()}
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Google Calendar</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              OAuth: {integrations.googleCalendar?.configured ? 'Configured' : 'Missing Credentials'}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
            <span>Issues: {integrations.googleCalendar?.issues?.length || 0}</span>
            <button
              onClick={() => testIntegrationMutation.mutate('google-calendar')}
              disabled={testIntegrationMutation.isLoading}
              className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
            >
              Test Auth
            </button>
          </div>
        </div>

        {/* Firebase FCM Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-gray-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            {(() => {
              const badge = getStatusBadge(integrations.firebaseFcm?.status);
              const BadgeIcon = badge.icon;
              return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}>
                  <BadgeIcon className="w-3.5 h-3.5" />
                  <span>{badge.label}</span>
                </span>
              );
            })()}
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Firebase FCM</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              SDK: {integrations.firebaseFcm?.configured ? 'Service Account Active' : 'Unconfigured'}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
            <span>Issues: {integrations.firebaseFcm?.issues?.length || 0}</span>
            <button
              onClick={() => testIntegrationMutation.mutate('firebase-fcm')}
              className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
            >
              Verify Project
            </button>
          </div>
        </div>

        {/* MongoDB Database Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-gray-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            {(() => {
              const badge = getStatusBadge(integrations.mongoDb?.status);
              const BadgeIcon = badge.icon;
              return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}>
                  <BadgeIcon className="w-3.5 h-3.5" />
                  <span>{badge.label}</span>
                </span>
              );
            })()}
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">MongoDB Cluster</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              State: Connected & Synchronized
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
            <span>Issues: {integrations.mongoDb?.issues?.length || 0}</span>
            <button
              onClick={() => testIntegrationMutation.mutate('mongodb')}
              className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
            >
              Ping DB
            </button>
          </div>
        </div>

        {/* AI & Activity Hub Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-gray-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            {(() => {
              const badge = getStatusBadge(integrations.aiProviders?.status);
              const BadgeIcon = badge.icon;
              return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}>
                  <BadgeIcon className="w-3.5 h-3.5" />
                  <span>{badge.label}</span>
                </span>
              );
            })()}
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">AI Inference & Hub</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Providers: Groq, Gemini, OpenRouter
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
            <span>Issues: {integrations.aiProviders?.issues?.length || 0}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Fallback Enabled</span>
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: INCIDENTS FILTERS & SEARCH ─── */}
      <div className="glass-card rounded-2xl p-5 border border-white/20 dark:border-gray-700/50 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 outline-none"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="investigating">Investigating</option>
              <option value="mitigated">Mitigated</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
              className="text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 outline-none"
            >
              <option value="">All Providers</option>
              <option value="google-calendar">Google Calendar</option>
              <option value="firebase-fcm">Firebase FCM</option>
              <option value="activity-hub">Activity Hub</option>
              <option value="mongodb">MongoDB</option>
              <option value="redis">Redis</option>
              <option value="ai-service">AI Providers</option>
            </select>
          </div>

          <span className="text-xs font-medium text-gray-500">
            Total incidents recorded: {incidentsData?.total || 0}
          </span>
        </div>
      </div>

      {/* ─── SECTION 4: INCIDENTS TABLE (DEDUPLICATED TELEMETRY) ─── */}
      <div className="glass-card rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-800/40 flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Active & Historical Incidents</h3>
          <span className="text-xs text-gray-400">Aggregated & Deduplicated</span>
        </div>

        {loadingIncidents ? (
          <div className="py-16 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : (incidentsData?.incidents || []).length === 0 ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">No active incidents matching filters</p>
            <p className="text-xs">All external service integrations are operating normally.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50 text-xs">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 text-left">Severity</th>
                  <th className="px-6 py-3.5 text-left">Incident / Code</th>
                  <th className="px-6 py-3.5 text-left">Provider & Operation</th>
                  <th className="px-6 py-3.5 text-center">Occurrences</th>
                  <th className="px-6 py-3.5 text-center">Affected Users</th>
                  <th className="px-6 py-3.5 text-left">Last Seen</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {incidentsData.incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{inc.title}</div>
                      <div className="font-mono text-[10px] text-gray-400 mt-0.5">{inc.incidentCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{inc.provider}</span>
                      <span className="text-gray-400 block text-[11px]">{inc.operation}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">
                      {inc.occurrences}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                      {inc.affectedUserCount || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(inc.lastSeen), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                        inc.status === 'open' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                        inc.status === 'investigating' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        inc.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedIncident(inc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Diagnostics</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── SECTION 5: EXPANDABLE INCIDENT DIAGNOSTIC DRAWER / MODAL ─── */}
      <AnimatePresence>
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${getSeverityBadge(selectedIncident.severity)}`}>
                      {selectedIncident.severity}
                    </span>
                    <span className="font-mono text-xs text-gray-400">{selectedIncident.incidentCode}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {selectedIncident.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Recommended Action Notice (Actionable Guidance) */}
                {selectedIncident.recommendedAction && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                      <Zap className="w-4 h-4" />
                      <span>Recommended Administrator Action</span>
                    </div>
                    <p className="leading-relaxed pl-6">
                      {selectedIncident.recommendedAction}
                    </p>
                  </div>
                )}

                {/* Structured Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 text-[10px] font-bold uppercase">Provider</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5 capitalize">{selectedIncident.provider}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 text-[10px] font-bold uppercase">Operation</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5 font-mono text-[11px]">{selectedIncident.operation}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 text-[10px] font-bold uppercase">HTTP Status</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedIncident.httpStatus || 500}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 text-[10px] font-bold uppercase">Occurrences</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedIncident.occurrences}</p>
                  </div>
                </div>

                {/* Technical Diagnostic Message */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Technical Description</h4>
                  <div className="p-4 bg-gray-900 text-gray-100 font-mono text-xs rounded-xl overflow-x-auto">
                    {selectedIncident.adminMessage}
                  </div>
                </div>

                {/* Correlation IDs */}
                {selectedIncident.correlationIds?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Sample Correlation IDs</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.correlationIds.slice(0, 6).map((cid) => (
                        <span key={cid} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-[11px] text-gray-700 dark:text-gray-300">
                          {cid}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Redacted Stack Trace */}
                {selectedIncident.technicalDetails?.stack && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Sanitized Stack Trace (Redacted)</h4>
                      <button
                        onClick={() => handleCopy(selectedIncident.technicalDetails.stack, 'stack')}
                        className="inline-flex items-center gap-1 text-[11px] text-primary-500 font-semibold"
                      >
                        {copiedKey === 'stack' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'stack' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-4 bg-black/60 border border-gray-800 rounded-xl text-[11px] font-mono text-gray-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {selectedIncident.technicalDetails.stack}
                    </pre>
                  </div>
                )}

                {/* Status Update Form */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Incident Lifecycle & Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['open', 'acknowledged', 'investigating', 'mitigated', 'resolved'].map((st) => (
                      <button
                        key={st}
                        onClick={() => updateStatusMutation.mutate({ id: selectedIncident._id, status: st, note: adminNote })}
                        disabled={updateStatusMutation.isLoading || selectedIncident.status === st}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all disabled:opacity-50 ${
                          selectedIncident.status === st
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add an administrator investigative note..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate({ id: selectedIncident._id, status: selectedIncident.status, note: adminNote })}
                      disabled={!adminNote.trim() || updateStatusMutation.isLoading}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Note</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemHealthAdminTab;

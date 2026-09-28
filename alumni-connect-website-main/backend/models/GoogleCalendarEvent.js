const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({
  email: { type: String, trim: true, lowercase: true },
  displayName: { type: String, trim: true },
  responseStatus: { type: String, enum: ['needsAction', 'declined', 'tentative', 'accepted', 'unknown'], default: 'unknown' },
  self: { type: Boolean, default: false }
}, { _id: false });

const reminderSchema = new mongoose.Schema({
  method: { type: String, enum: ['email', 'popup'], default: 'popup' },
  minutes: { type: Number, default: 10 }
}, { _id: false });

const conferenceEntryPointSchema = new mongoose.Schema({
  entryPointType: { type: String },
  uri: { type: String },
  label: { type: String }
}, { _id: false });

const conferenceDataSchema = new mongoose.Schema({
  conferenceId: { type: String },
  entryPoints: [conferenceEntryPointSchema],
  meetUrl: { type: String }
}, { _id: false });

const googleCalendarEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  googleEventId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  googleCalendarId: {
    type: String,
    default: 'primary',
    trim: true,
    index: true
  },
  summary: {
    type: String,
    trim: true,
    default: '(No title)'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  start: {
    type: Date,
    required: true,
    index: true
  },
  end: {
    type: Date,
    required: true,
    index: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['confirmed', 'tentative', 'cancelled'],
    default: 'confirmed',
    index: true
  },
  eventType: {
    type: String,
    enum: ['google', 'alumnex_event', 'mentorship', 'career', 'activity'],
    default: 'google',
    index: true
  },
  recurrence: [{
    type: String
  }],
  recurringEventId: {
    type: String
  },
  attendees: [attendeeSchema],
  reminders: [reminderSchema],
  conferenceData: conferenceDataSchema,
  htmlLink: {
    type: String
  },
  etag: {
    type: String
  },
  source: {
    type: String,
    enum: ['google', 'alumnex'],
    default: 'google'
  },
  alumnexEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    index: true
  },
  alumnexMentorshipSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorshipSession',
    index: true
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index to guarantee idempotency and avoid duplicates
googleCalendarEventSchema.index(
  { userId: 1, googleCalendarId: 1, googleEventId: 1 },
  { unique: true }
);

// Fast range and query lookup indexes
googleCalendarEventSchema.index({ userId: 1, start: 1, end: 1, status: 1 });
googleCalendarEventSchema.index({ userId: 1, eventType: 1 });

module.exports = mongoose.model('GoogleCalendarEvent', googleCalendarEventSchema);

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    trim: true,
    maxLength: 2000
  },
  location: {
    type: String,
    trim: true,
    maxLength: 500
  },
  start: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end: {
    type: Date,
    required: [true, 'End date is required']
  },
  allDay: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#3B82F6' // Blue
  },
  calendar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recurrence: {
    enabled: { type: Boolean, default: false },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
      default: 'weekly'
    },
    interval: { type: Number, default: 1 },
    daysOfWeek: [{ type: Number }], // 0-6 for Sunday-Saturday
    endDate: { type: Date },
    count: { type: Number },
    exceptions: [{ type: Date }] // Dates to skip
  },
  recurrenceParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  reminders: [{
    type: {
      type: String,
      enum: ['notification', 'email'],
      default: 'notification'
    },
    time: { type: Number, default: 15 }, // minutes before
    sent: { type: Boolean, default: false }
  }],
  attendees: [{
    email: String,
    name: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['confirmed', 'tentative', 'cancelled'],
    default: 'confirmed'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  notes: {
    type: String,
    maxLength: 5000
  },
  isFocusTime: {
    type: Boolean,
    default: false
  },
  focusCategory: {
    type: String,
    enum: ['deep-work', 'meetings', 'admin', 'creative', 'learning', 'personal'],
    default: 'deep-work'
  }
}, {
  timestamps: true
});

// Index for efficient querying
eventSchema.index({ user: 1, start: 1, end: 1 });
eventSchema.index({ calendar: 1, start: 1 });
eventSchema.index({ 'reminders.sent': 1, start: 1 });

// Virtual for duration in minutes
eventSchema.virtual('duration').get(function() {
  return Math.round((this.end - this.start) / (1000 * 60));
});

// Validate end date is after start date
eventSchema.pre('save', function(next) {
  if (this.end <= this.start) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);

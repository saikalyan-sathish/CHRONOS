const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['event_reminder', 'todo_reminder', 'event_update', 'todo_due', 'focus_complete', 'achievement', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String
  },
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  relatedTodo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Todo'
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Auto-delete old notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);

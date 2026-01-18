const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Todo title is required'],
    trim: true,
    maxLength: 300
  },
  description: {
    type: String,
    trim: true,
    maxLength: 2000
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  dueTime: {
    type: String // HH:mm format
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  color: {
    type: String,
    default: '#6B7280' // Gray
  },
  list: {
    type: String,
    default: 'inbox',
    trim: true
  },
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  reminder: {
    enabled: { type: Boolean, default: false },
    time: { type: Date },
    sent: { type: Boolean, default: false }
  },
  recurring: {
    enabled: { type: Boolean, default: false },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    interval: { type: Number, default: 1 }
  },
  linkedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 30
  },
  actualTime: {
    type: Number // in minutes
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
todoSchema.index({ user: 1, status: 1 });
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ user: 1, list: 1 });

// Virtual for checking if overdue
todoSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > new Date(this.dueDate);
});

// Calculate subtask progress
todoSchema.virtual('progress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) {
    return this.status === 'completed' ? 100 : 0;
  }
  const completed = this.subtasks.filter(st => st.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// Mark as completed
todoSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Todo', todoSchema);

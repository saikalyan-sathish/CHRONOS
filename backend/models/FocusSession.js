const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  plannedDuration: {
    type: Number, // in minutes
    required: true,
    default: 25
  },
  actualDuration: {
    type: Number // in minutes
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'interrupted', 'cancelled'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['deep-work', 'meetings', 'admin', 'creative', 'learning', 'personal'],
    default: 'deep-work'
  },
  linkedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  linkedTodo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Todo'
  },
  notes: {
    type: String,
    maxLength: 1000
  },
  distractions: [{
    timestamp: Date,
    note: String
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient querying
focusSessionSchema.index({ user: 1, startTime: -1 });
focusSessionSchema.index({ user: 1, status: 1 });
focusSessionSchema.index({ user: 1, category: 1 });

// Calculate actual duration on completion
focusSessionSchema.methods.complete = function() {
  this.endTime = new Date();
  this.actualDuration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  this.status = 'completed';
  return this.save();
};

module.exports = mongoose.model('FocusSession', focusSessionSchema);

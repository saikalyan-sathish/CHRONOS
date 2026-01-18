const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Calendar name is required'],
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500
  },
  color: {
    type: String,
    default: '#3B82F6' // Blue
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ['personal', 'work', 'family', 'holiday', 'birthday', 'other'],
    default: 'personal'
  },
  shared: {
    isShared: { type: Boolean, default: false },
    sharedWith: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      permission: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
      }
    }]
  }
}, {
  timestamps: true
});

// Index for efficient querying
calendarSchema.index({ user: 1 });

module.exports = mongoose.model('Calendar', calendarSchema);

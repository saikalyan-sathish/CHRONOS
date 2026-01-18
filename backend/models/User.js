const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    weekStartsOn: {
      type: Number,
      default: 0 // 0 = Sunday, 1 = Monday
    },
    defaultView: {
      type: String,
      enum: ['day', 'week', 'month', 'agenda'],
      default: 'month'
    },
    defaultEventDuration: {
      type: Number,
      default: 60 // minutes
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      reminderTime: { type: Number, default: 15 } // minutes before event
    }
  },
  pushSubscription: {
    type: Object,
    default: null
  },
  focusStats: {
    totalFocusTime: { type: Number, default: 0 }, // in minutes
    sessionsCompleted: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastFocusDate: { type: Date }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);

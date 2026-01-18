const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FocusSession = require('../models/FocusSession');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// @route   GET /api/focus/sessions
// @desc    Get focus sessions
// @access  Private
router.get('/sessions', auth, async (req, res) => {
  try {
    const { status, startDate, endDate, limit = 50 } = req.query;

    const filter = { user: req.userId };

    if (status) {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sessions = await FocusSession.find(filter)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .populate('linkedEvent', 'title')
      .populate('linkedTodo', 'title');

    res.json({ sessions });
  } catch (error) {
    console.error('Get focus sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/focus/stats
// @desc    Get focus statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const monthStart = new Date(today);
    monthStart.setMonth(today.getMonth() - 1);

    const [todaySessions, weekSessions, monthSessions] = await Promise.all([
      FocusSession.find({
        user: req.userId,
        startTime: { $gte: today },
        status: 'completed'
      }),
      FocusSession.find({
        user: req.userId,
        startTime: { $gte: weekStart },
        status: 'completed'
      }),
      FocusSession.find({
        user: req.userId,
        startTime: { $gte: monthStart },
        status: 'completed'
      })
    ]);

    const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
    const weekMinutes = weekSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
    const monthMinutes = monthSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);

    // Calculate streak
    let currentStreak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const daySession = await FocusSession.findOne({
        user: req.userId,
        startTime: { $gte: dayStart, $lte: dayEnd },
        status: 'completed'
      });

      if (daySession) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }

      if (currentStreak > 365) break; // Safety limit
    }

    // Update user streak if needed
    if (currentStreak !== user.focusStats?.currentStreak) {
      await User.findByIdAndUpdate(req.userId, {
        'focusStats.currentStreak': currentStreak,
        'focusStats.longestStreak': Math.max(currentStreak, user.focusStats?.longestStreak || 0)
      });
    }

    res.json({
      today: {
        sessions: todaySessions.length,
        minutes: todayMinutes
      },
      week: {
        sessions: weekSessions.length,
        minutes: weekMinutes
      },
      month: {
        sessions: monthSessions.length,
        minutes: monthMinutes
      },
      streak: {
        current: currentStreak,
        longest: Math.max(currentStreak, user.focusStats?.longestStreak || 0)
      },
      totalTime: user.focusStats?.totalFocusTime || 0,
      totalSessions: user.focusStats?.sessionsCompleted || 0
    });
  } catch (error) {
    console.error('Get focus stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/focus/sessions
// @desc    Start a new focus session
// @access  Private
router.post('/sessions', auth, [
  body('plannedDuration').isInt({ min: 1, max: 480 }).withMessage('Duration must be between 1 and 480 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check for active session
    const activeSession = await FocusSession.findOne({
      user: req.userId,
      status: 'active'
    });

    if (activeSession) {
      return res.status(400).json({
        message: 'You already have an active focus session',
        session: activeSession
      });
    }

    const { plannedDuration, category, linkedEvent, linkedTodo, notes, tags } = req.body;

    const session = new FocusSession({
      user: req.userId,
      startTime: new Date(),
      plannedDuration,
      category: category || 'deep-work',
      linkedEvent,
      linkedTodo,
      notes,
      tags,
      status: 'active'
    });

    await session.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('focus:started', session);
    }

    res.status(201).json({
      message: 'Focus session started',
      session
    });
  } catch (error) {
    console.error('Start focus session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/focus/sessions/:id/complete
// @desc    Complete a focus session
// @access  Private
router.put('/sessions/:id/complete', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.userId,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const { rating, notes } = req.body;

    session.endTime = new Date();
    session.actualDuration = Math.round((session.endTime - session.startTime) / (1000 * 60));
    session.status = 'completed';
    if (rating) session.rating = rating;
    if (notes) session.notes = notes;

    await session.save();

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: {
        'focusStats.totalFocusTime': session.actualDuration,
        'focusStats.sessionsCompleted': 1
      },
      'focusStats.lastFocusDate': new Date()
    });

    // Create achievement notification if milestone reached
    const user = await User.findById(req.userId);
    const totalSessions = user.focusStats?.sessionsCompleted || 0;

    if ([10, 25, 50, 100, 250, 500].includes(totalSessions)) {
      await Notification.create({
        user: req.userId,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `Congratulations! You've completed ${totalSessions} focus sessions!`,
        metadata: { achievement: 'focus_milestone', count: totalSessions }
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('focus:completed', session);
    }

    res.json({
      message: 'Focus session completed',
      session
    });
  } catch (error) {
    console.error('Complete focus session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/focus/sessions/:id/interrupt
// @desc    Interrupt/pause a focus session
// @access  Private
router.put('/sessions/:id/interrupt', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.userId,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const { note } = req.body;

    session.distractions.push({
      timestamp: new Date(),
      note: note || 'Session interrupted'
    });

    session.endTime = new Date();
    session.actualDuration = Math.round((session.endTime - session.startTime) / (1000 * 60));
    session.status = 'interrupted';

    await session.save();

    // Update user stats (partial time)
    await User.findByIdAndUpdate(req.userId, {
      $inc: {
        'focusStats.totalFocusTime': session.actualDuration
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('focus:interrupted', session);
    }

    res.json({
      message: 'Focus session interrupted',
      session
    });
  } catch (error) {
    console.error('Interrupt focus session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/focus/sessions/:id/cancel
// @desc    Cancel a focus session
// @access  Private
router.put('/sessions/:id/cancel', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.userId,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    session.status = 'cancelled';
    session.endTime = new Date();

    await session.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('focus:cancelled', session);
    }

    res.json({
      message: 'Focus session cancelled',
      session
    });
  } catch (error) {
    console.error('Cancel focus session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/focus/sessions/:id/distraction
// @desc    Log a distraction during focus session
// @access  Private
router.post('/sessions/:id/distraction', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.userId,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    const { note } = req.body;

    session.distractions.push({
      timestamp: new Date(),
      note: note || 'Distraction logged'
    });

    await session.save();

    res.json({
      message: 'Distraction logged',
      session
    });
  } catch (error) {
    console.error('Log distraction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/focus/active
// @desc    Get active focus session
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      user: req.userId,
      status: 'active'
    })
      .populate('linkedEvent', 'title')
      .populate('linkedTodo', 'title');

    res.json({ session });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

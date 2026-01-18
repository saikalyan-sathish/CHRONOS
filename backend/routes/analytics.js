const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Todo = require('../models/Todo');
const FocusSession = require('../models/FocusSession');
const { auth } = require('../middleware/auth');

// @route   GET /api/analytics/overview
// @desc    Get overall analytics overview
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Event statistics
    const events = await Event.find({
      user: req.userId,
      start: { $gte: start, $lte: end }
    });

    const eventStats = {
      total: events.length,
      byCategory: {},
      byPriority: { low: 0, medium: 0, high: 0 },
      totalHours: 0
    };

    events.forEach(event => {
      // By category
      const category = event.focusCategory || 'other';
      eventStats.byCategory[category] = (eventStats.byCategory[category] || 0) + 1;

      // By priority
      if (event.priority) {
        eventStats.byPriority[event.priority]++;
      }

      // Total hours
      const duration = (event.end - event.start) / (1000 * 60 * 60);
      eventStats.totalHours += duration;
    });

    eventStats.totalHours = Math.round(eventStats.totalHours * 10) / 10;

    // Todo statistics
    const todos = await Todo.find({
      user: req.userId,
      createdAt: { $gte: start, $lte: end }
    });

    const completedTodos = todos.filter(t => t.status === 'completed');

    const todoStats = {
      total: todos.length,
      completed: completedTodos.length,
      completionRate: todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0,
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      avgCompletionTime: 0
    };

    let totalCompletionTime = 0;
    let completionTimeCount = 0;

    todos.forEach(todo => {
      if (todo.priority) {
        todoStats.byPriority[todo.priority]++;
      }
      if (todo.completedAt && todo.createdAt) {
        totalCompletionTime += (new Date(todo.completedAt) - new Date(todo.createdAt)) / (1000 * 60 * 60);
        completionTimeCount++;
      }
    });

    todoStats.avgCompletionTime = completionTimeCount > 0
      ? Math.round((totalCompletionTime / completionTimeCount) * 10) / 10
      : 0;

    // Focus session statistics
    const focusSessions = await FocusSession.find({
      user: req.userId,
      startTime: { $gte: start, $lte: end },
      status: 'completed'
    });

    const focusStats = {
      totalSessions: focusSessions.length,
      totalMinutes: 0,
      avgSessionLength: 0,
      byCategory: {}
    };

    focusSessions.forEach(session => {
      focusStats.totalMinutes += session.actualDuration || 0;
      const category = session.category || 'deep-work';
      focusStats.byCategory[category] = (focusStats.byCategory[category] || 0) + (session.actualDuration || 0);
    });

    focusStats.avgSessionLength = focusSessions.length > 0
      ? Math.round(focusStats.totalMinutes / focusSessions.length)
      : 0;

    res.json({
      dateRange: { start, end },
      events: eventStats,
      todos: todoStats,
      focus: focusStats
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/productivity-score
// @desc    Calculate productivity score
// @access  Private
router.get('/productivity-score', auth, async (req, res) => {
  try {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    // Get data for the past week
    const [todos, focusSessions, events] = await Promise.all([
      Todo.find({
        user: req.userId,
        createdAt: { $gte: weekStart }
      }),
      FocusSession.find({
        user: req.userId,
        startTime: { $gte: weekStart },
        status: 'completed'
      }),
      Event.find({
        user: req.userId,
        start: { $gte: weekStart, $lte: today }
      })
    ]);

    // Calculate scores (0-100 each)
    const completedTodos = todos.filter(t => t.status === 'completed').length;
    const todoScore = todos.length > 0 ? (completedTodos / todos.length) * 100 : 50;

    const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
    const targetFocusMinutes = 7 * 120; // 2 hours per day target
    const focusScore = Math.min((totalFocusMinutes / targetFocusMinutes) * 100, 100);

    const attendedEvents = events.filter(e => e.status !== 'cancelled').length;
    const eventScore = events.length > 0 ? (attendedEvents / events.length) * 100 : 50;

    // Weighted average
    const overallScore = Math.round(
      (todoScore * 0.4) + (focusScore * 0.35) + (eventScore * 0.25)
    );

    // Determine trend
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const previousTodos = await Todo.find({
      user: req.userId,
      createdAt: { $gte: previousWeekStart, $lt: weekStart }
    });

    const prevCompletedTodos = previousTodos.filter(t => t.status === 'completed').length;
    const prevTodoScore = previousTodos.length > 0 ? (prevCompletedTodos / previousTodos.length) * 100 : 50;

    const trend = overallScore > prevTodoScore ? 'up' : overallScore < prevTodoScore ? 'down' : 'stable';

    res.json({
      score: overallScore,
      breakdown: {
        todos: Math.round(todoScore),
        focus: Math.round(focusScore),
        events: Math.round(eventScore)
      },
      trend,
      details: {
        todosCompleted: completedTodos,
        todosTotal: todos.length,
        focusMinutes: totalFocusMinutes,
        eventsAttended: attendedEvents,
        eventsTotal: events.length
      }
    });
  } catch (error) {
    console.error('Get productivity score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/time-distribution
// @desc    Get time distribution by category
// @access  Private
router.get('/time-distribution', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const events = await Event.find({
      user: req.userId,
      start: { $gte: start, $lte: end }
    });

    const distribution = {
      'deep-work': 0,
      'meetings': 0,
      'admin': 0,
      'creative': 0,
      'learning': 0,
      'personal': 0,
      'other': 0
    };

    let totalMinutes = 0;

    events.forEach(event => {
      const duration = (event.end - event.start) / (1000 * 60);
      const category = event.focusCategory || 'other';
      distribution[category] = (distribution[category] || 0) + duration;
      totalMinutes += duration;
    });

    // Convert to percentages and hours
    const result = Object.entries(distribution).map(([category, minutes]) => ({
      category,
      minutes: Math.round(minutes),
      hours: Math.round(minutes / 60 * 10) / 10,
      percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0
    })).filter(d => d.minutes > 0);

    res.json({
      distribution: result,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10
    });
  } catch (error) {
    console.error('Get time distribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/daily-activity
// @desc    Get daily activity heatmap data
// @access  Private
router.get('/daily-activity', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));

    const [events, todos, focusSessions] = await Promise.all([
      Event.find({
        user: req.userId,
        start: { $gte: start }
      }),
      Todo.find({
        user: req.userId,
        completedAt: { $gte: start }
      }),
      FocusSession.find({
        user: req.userId,
        startTime: { $gte: start },
        status: 'completed'
      })
    ]);

    const activity = {};

    // Initialize days
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      activity[dateKey] = {
        events: 0,
        todosCompleted: 0,
        focusMinutes: 0,
        score: 0
      };
    }

    // Aggregate events
    events.forEach(event => {
      const dateKey = new Date(event.start).toISOString().split('T')[0];
      if (activity[dateKey]) {
        activity[dateKey].events++;
      }
    });

    // Aggregate todos
    todos.forEach(todo => {
      if (todo.completedAt) {
        const dateKey = new Date(todo.completedAt).toISOString().split('T')[0];
        if (activity[dateKey]) {
          activity[dateKey].todosCompleted++;
        }
      }
    });

    // Aggregate focus sessions
    focusSessions.forEach(session => {
      const dateKey = new Date(session.startTime).toISOString().split('T')[0];
      if (activity[dateKey]) {
        activity[dateKey].focusMinutes += session.actualDuration || 0;
      }
    });

    // Calculate daily scores
    Object.keys(activity).forEach(dateKey => {
      const day = activity[dateKey];
      day.score = Math.min(100, (day.events * 10) + (day.todosCompleted * 15) + (day.focusMinutes / 2));
    });

    // Convert to array format
    const result = Object.entries(activity).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ activity: result });
  } catch (error) {
    console.error('Get daily activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/peak-hours
// @desc    Get peak productivity hours
// @access  Private
router.get('/peak-hours', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const focusSessions = await FocusSession.find({
      user: req.userId,
      startTime: { $gte: thirtyDaysAgo },
      status: 'completed'
    });

    const hourlyData = Array(24).fill(0).map((_, i) => ({
      hour: i,
      sessions: 0,
      totalMinutes: 0,
      avgRating: 0,
      ratings: []
    }));

    focusSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourlyData[hour].sessions++;
      hourlyData[hour].totalMinutes += session.actualDuration || 0;
      if (session.rating) {
        hourlyData[hour].ratings.push(session.rating);
      }
    });

    // Calculate averages
    hourlyData.forEach(data => {
      if (data.ratings.length > 0) {
        data.avgRating = Math.round(
          data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length * 10
        ) / 10;
      }
      delete data.ratings;
    });

    // Find peak hours
    const peakHours = [...hourlyData]
      .sort((a, b) => b.totalMinutes - a.totalMinutes)
      .slice(0, 3)
      .map(h => h.hour);

    res.json({
      hourlyData,
      peakHours,
      recommendation: peakHours.length > 0
        ? `Your most productive hours are ${peakHours.map(h => `${h}:00`).join(', ')}. Schedule important tasks during these times.`
        : 'Complete more focus sessions to discover your peak productivity hours.'
    });
  } catch (error) {
    console.error('Get peak hours error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

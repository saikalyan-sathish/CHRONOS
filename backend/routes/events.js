const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Event = require('../models/Event');
const Calendar = require('../models/Calendar');
const { auth } = require('../middleware/auth');

// @route   GET /api/events
// @desc    Get events for date range
// @access  Private
router.get('/', auth, [
  query('start').optional().isISO8601().withMessage('Invalid start date'),
  query('end').optional().isISO8601().withMessage('Invalid end date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { start, end, calendar, search } = req.query;

    const filter = { user: req.userId };

    // Date range filter
    if (start && end) {
      filter.$or = [
        { start: { $gte: new Date(start), $lte: new Date(end) } },
        { end: { $gte: new Date(start), $lte: new Date(end) } },
        { start: { $lte: new Date(start) }, end: { $gte: new Date(end) } }
      ];
    }

    // Calendar filter
    if (calendar) {
      filter.calendar = calendar;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(filter)
      .populate('calendar', 'name color')
      .sort({ start: 1 });

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('calendar', 'name color');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('start').isISO8601().withMessage('Valid start date is required'),
  body('end').isISO8601().withMessage('Valid end date is required'),
  body('calendar').notEmpty().withMessage('Calendar is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      location,
      start,
      end,
      allDay,
      color,
      calendar,
      recurrence,
      reminders,
      attendees,
      priority,
      tags,
      notes,
      isFocusTime,
      focusCategory
    } = req.body;

    // Verify calendar belongs to user
    const calendarDoc = await Calendar.findOne({
      _id: calendar,
      $or: [
        { user: req.userId },
        { 'shared.sharedWith.user': req.userId }
      ]
    });

    if (!calendarDoc) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    const event = new Event({
      title,
      description,
      location,
      start: new Date(start),
      end: new Date(end),
      allDay: allDay || false,
      color: color || calendarDoc.color,
      calendar,
      user: req.userId,
      recurrence,
      reminders: reminders || [{ type: 'notification', time: 15 }],
      attendees,
      priority,
      tags,
      notes,
      isFocusTime,
      focusCategory
    });

    await event.save();

    // Populate calendar info
    await event.populate('calendar', 'name color');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('event:created', event);
    }

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updates = {};
    const allowedUpdates = [
      'title', 'description', 'location', 'start', 'end', 'allDay',
      'color', 'calendar', 'recurrence', 'reminders', 'attendees',
      'status', 'priority', 'tags', 'notes', 'isFocusTime', 'focusCategory'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'start' || field === 'end') {
          updates[field] = new Date(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Reset reminder sent status if time changed
    if (updates.start || updates.reminders) {
      if (event.reminders) {
        updates.reminders = (updates.reminders || event.reminders).map(r => ({
          ...r,
          sent: false
        }));
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('calendar', 'name color');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('event:updated', updatedEvent);
    }

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('event:deleted', { id: req.params.id });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/duplicate
// @desc    Duplicate an event
// @access  Private
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { newStart } = req.body;
    const duration = event.end - event.start;

    const duplicatedEvent = new Event({
      title: `${event.title} (Copy)`,
      description: event.description,
      location: event.location,
      start: newStart ? new Date(newStart) : new Date(event.start.getTime() + 24 * 60 * 60 * 1000),
      end: newStart
        ? new Date(new Date(newStart).getTime() + duration)
        : new Date(event.end.getTime() + 24 * 60 * 60 * 1000),
      allDay: event.allDay,
      color: event.color,
      calendar: event.calendar,
      user: req.userId,
      reminders: event.reminders.map(r => ({ ...r.toObject(), sent: false })),
      priority: event.priority,
      tags: event.tags,
      notes: event.notes,
      isFocusTime: event.isFocusTime,
      focusCategory: event.focusCategory
    });

    await duplicatedEvent.save();
    await duplicatedEvent.populate('calendar', 'name color');

    res.status(201).json({
      message: 'Event duplicated successfully',
      event: duplicatedEvent
    });
  } catch (error) {
    console.error('Duplicate event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/suggestions/free-slots
// @desc    Get free time slots for smart scheduling
// @access  Private
router.get('/suggestions/free-slots', auth, async (req, res) => {
  try {
    const { date, duration = 60 } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Get user preferences
    const user = req.user;
    const workingHours = user.preferences?.workingHours || { start: '09:00', end: '17:00' };

    // Set date range for the target day
    const dayStart = new Date(targetDate);
    dayStart.setHours(parseInt(workingHours.start.split(':')[0]), parseInt(workingHours.start.split(':')[1]), 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(parseInt(workingHours.end.split(':')[0]), parseInt(workingHours.end.split(':')[1]), 0, 0);

    // Get all events for the day
    const events = await Event.find({
      user: req.userId,
      start: { $lt: dayEnd },
      end: { $gt: dayStart }
    }).sort({ start: 1 });

    // Find free slots
    const freeSlots = [];
    let currentTime = dayStart;

    for (const event of events) {
      const eventStart = new Date(Math.max(event.start, dayStart));
      const eventEnd = new Date(Math.min(event.end, dayEnd));

      if (currentTime < eventStart) {
        const slotDuration = (eventStart - currentTime) / (1000 * 60);
        if (slotDuration >= duration) {
          freeSlots.push({
            start: new Date(currentTime),
            end: eventStart,
            duration: slotDuration
          });
        }
      }
      currentTime = new Date(Math.max(currentTime, eventEnd));
    }

    // Check for free time after last event
    if (currentTime < dayEnd) {
      const slotDuration = (dayEnd - currentTime) / (1000 * 60);
      if (slotDuration >= duration) {
        freeSlots.push({
          start: new Date(currentTime),
          end: dayEnd,
          duration: slotDuration
        });
      }
    }

    res.json({ freeSlots });
  } catch (error) {
    console.error('Get free slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

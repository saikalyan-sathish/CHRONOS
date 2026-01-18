const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Todo = require('../models/Todo');
const Event = require('../models/Event');
const Calendar = require('../models/Calendar');
const { auth } = require('../middleware/auth');

// @route   GET /api/todos
// @desc    Get all todos for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, list, dueDate, search } = req.query;

    const filter = { user: req.userId };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (list) {
      filter.list = list;
    }

    if (dueDate) {
      const date = new Date(dueDate);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      filter.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const todos = await Todo.find(filter)
      .populate('linkedEvent', 'title start end')
      .sort({ order: 1, createdAt: -1 });

    res.json({ todos });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/todos/lists
// @desc    Get all unique lists for user
// @access  Private
router.get('/lists', auth, async (req, res) => {
  try {
    const lists = await Todo.distinct('list', { user: req.userId });
    res.json({ lists });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/todos/stats
// @desc    Get todo statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [total, completed, pending, overdue, dueToday, dueThisWeek] = await Promise.all([
      Todo.countDocuments({ user: req.userId }),
      Todo.countDocuments({ user: req.userId, status: 'completed' }),
      Todo.countDocuments({ user: req.userId, status: { $in: ['pending', 'in_progress'] } }),
      Todo.countDocuments({
        user: req.userId,
        status: { $ne: 'completed' },
        dueDate: { $lt: today }
      }),
      Todo.countDocuments({
        user: req.userId,
        status: { $ne: 'completed' },
        dueDate: { $gte: today, $lt: tomorrow }
      }),
      Todo.countDocuments({
        user: req.userId,
        status: { $ne: 'completed' },
        dueDate: { $gte: today, $lt: weekEnd }
      })
    ]);

    res.json({
      stats: {
        total,
        completed,
        pending,
        overdue,
        dueToday,
        dueThisWeek,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/todos/:id
// @desc    Get single todo
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('linkedEvent', 'title start end');

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    res.json({ todo });
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/todos
// @desc    Create new todo
// @access  Private
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      priority,
      dueDate,
      dueTime,
      tags,
      color,
      list,
      subtasks,
      reminder,
      recurring,
      estimatedTime
    } = req.body;

    // Get max order for the list
    const maxOrder = await Todo.findOne({ user: req.userId, list: list || 'inbox' })
      .sort({ order: -1 })
      .select('order');

    const todo = new Todo({
      title,
      description,
      user: req.userId,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      dueTime,
      tags,
      color,
      list: list || 'inbox',
      subtasks: subtasks || [],
      reminder,
      recurring,
      estimatedTime,
      order: (maxOrder?.order || 0) + 1
    });

    await todo.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('todo:created', todo);
    }

    res.status(201).json({
      message: 'Todo created successfully',
      todo
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/todos/:id
// @desc    Update todo
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const updates = {};
    const allowedUpdates = [
      'title', 'description', 'status', 'priority', 'dueDate', 'dueTime',
      'tags', 'color', 'list', 'subtasks', 'reminder', 'recurring',
      'estimatedTime', 'actualTime', 'order'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'dueDate') {
          updates[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // Handle completion
    if (updates.status === 'completed' && todo.status !== 'completed') {
      updates.completedAt = new Date();
    } else if (updates.status && updates.status !== 'completed') {
      updates.completedAt = null;
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('linkedEvent', 'title start end');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('todo:updated', updatedTodo);
    }

    res.json({
      message: 'Todo updated successfully',
      todo: updatedTodo
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/todos/:id/subtask/:subtaskIndex
// @desc    Toggle subtask completion
// @access  Private
router.put('/:id/subtask/:subtaskIndex', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const subtaskIndex = parseInt(req.params.subtaskIndex);
    if (subtaskIndex < 0 || subtaskIndex >= todo.subtasks.length) {
      return res.status(400).json({ message: 'Invalid subtask index' });
    }

    todo.subtasks[subtaskIndex].completed = !todo.subtasks[subtaskIndex].completed;
    todo.subtasks[subtaskIndex].completedAt = todo.subtasks[subtaskIndex].completed ? new Date() : null;

    await todo.save();

    res.json({
      message: 'Subtask updated successfully',
      todo
    });
  } catch (error) {
    console.error('Toggle subtask error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/todos/:id
// @desc    Delete todo
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(req.userId.toString()).emit('todo:deleted', { id: req.params.id });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/todos/:id/convert-to-event
// @desc    Convert todo to calendar event
// @access  Private
router.post('/:id/convert-to-event', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const { start, end, calendarId } = req.body;

    // Get default calendar if not specified
    let calendar;
    if (calendarId) {
      calendar = await Calendar.findOne({ _id: calendarId, user: req.userId });
    } else {
      calendar = await Calendar.findOne({ user: req.userId, isDefault: true });
    }

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    // Create event from todo
    const event = new Event({
      title: todo.title,
      description: todo.description,
      start: new Date(start),
      end: new Date(end),
      calendar: calendar._id,
      user: req.userId,
      color: todo.color || calendar.color,
      priority: todo.priority,
      tags: todo.tags
    });

    await event.save();

    // Link todo to event
    todo.linkedEvent = event._id;
    await todo.save();

    await event.populate('calendar', 'name color');

    res.status(201).json({
      message: 'Todo converted to event successfully',
      event,
      todo
    });
  } catch (error) {
    console.error('Convert to event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/todos/reorder
// @desc    Reorder todos
// @access  Private
router.put('/reorder', auth, async (req, res) => {
  try {
    const { todos } = req.body;

    const bulkOps = todos.map((todo, index) => ({
      updateOne: {
        filter: { _id: todo.id, user: req.userId },
        update: { $set: { order: index, list: todo.list } }
      }
    }));

    await Todo.bulkWrite(bulkOps);

    res.json({ message: 'Todos reordered successfully' });
  } catch (error) {
    console.error('Reorder todos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

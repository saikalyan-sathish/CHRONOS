const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Calendar = require('../models/Calendar');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

// @route   GET /api/calendars
// @desc    Get all calendars for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const calendars = await Calendar.find({
      $or: [
        { user: req.userId },
        { 'shared.sharedWith.user': req.userId }
      ]
    }).populate('user', 'name email');

    res.json({ calendars });
  } catch (error) {
    console.error('Get calendars error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/calendars/:id
// @desc    Get single calendar
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const calendar = await Calendar.findOne({
      _id: req.params.id,
      $or: [
        { user: req.userId },
        { 'shared.sharedWith.user': req.userId }
      ]
    }).populate('user', 'name email');

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    res.json({ calendar });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/calendars
// @desc    Create new calendar
// @access  Private
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Calendar name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, color, type } = req.body;

    const calendar = new Calendar({
      name,
      description,
      color: color || '#3B82F6',
      user: req.userId,
      type: type || 'personal'
    });

    await calendar.save();

    res.status(201).json({
      message: 'Calendar created successfully',
      calendar
    });
  } catch (error) {
    console.error('Create calendar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/calendars/:id
// @desc    Update calendar
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const calendar = await Calendar.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    const updates = {};
    const allowedUpdates = ['name', 'description', 'color', 'isVisible', 'type'];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedCalendar = await Calendar.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Calendar updated successfully',
      calendar: updatedCalendar
    });
  } catch (error) {
    console.error('Update calendar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/calendars/:id
// @desc    Delete calendar
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const calendar = await Calendar.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    if (calendar.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default calendar' });
    }

    // Delete all events in this calendar
    await Event.deleteMany({ calendar: req.params.id });

    await Calendar.findByIdAndDelete(req.params.id);

    res.json({ message: 'Calendar deleted successfully' });
  } catch (error) {
    console.error('Delete calendar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/calendars/:id/visibility
// @desc    Toggle calendar visibility
// @access  Private
router.put('/:id/visibility', auth, async (req, res) => {
  try {
    const calendar = await Calendar.findOne({
      _id: req.params.id,
      $or: [
        { user: req.userId },
        { 'shared.sharedWith.user': req.userId }
      ]
    });

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    calendar.isVisible = !calendar.isVisible;
    await calendar.save();

    res.json({
      message: 'Calendar visibility updated',
      calendar
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/calendars/:id/share
// @desc    Share calendar with another user
// @access  Private
router.post('/:id/share', auth, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('permission').isIn(['view', 'edit']).withMessage('Permission must be view or edit')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const calendar = await Calendar.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    const { email, permission } = req.body;
    const User = require('../models/User');
    const userToShare = await User.findOne({ email });

    if (!userToShare) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToShare._id.equals(req.userId)) {
      return res.status(400).json({ message: 'Cannot share calendar with yourself' });
    }

    // Check if already shared
    const alreadyShared = calendar.shared.sharedWith.find(
      s => s.user.equals(userToShare._id)
    );

    if (alreadyShared) {
      alreadyShared.permission = permission;
    } else {
      calendar.shared.sharedWith.push({
        user: userToShare._id,
        permission
      });
    }

    calendar.shared.isShared = true;
    await calendar.save();

    res.json({
      message: 'Calendar shared successfully',
      calendar
    });
  } catch (error) {
    console.error('Share calendar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/calendars/:id/share/:userId
// @desc    Remove user from shared calendar
// @access  Private
router.delete('/:id/share/:userId', auth, async (req, res) => {
  try {
    const calendar = await Calendar.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!calendar) {
      return res.status(404).json({ message: 'Calendar not found' });
    }

    calendar.shared.sharedWith = calendar.shared.sharedWith.filter(
      s => !s.user.equals(req.params.userId)
    );

    if (calendar.shared.sharedWith.length === 0) {
      calendar.shared.isShared = false;
    }

    await calendar.save();

    res.json({
      message: 'User removed from shared calendar',
      calendar
    });
  } catch (error) {
    console.error('Remove share error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

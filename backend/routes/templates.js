const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EventTemplate = require('../models/EventTemplate');
const { body, validationResult } = require('express-validator');

// @route   GET /api/templates
// @desc    Get all templates for current user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { sort = 'name', order = 'asc', limit } = req.query;

        let query = EventTemplate.find({ user: req.user.id });

        // Sort options
        if (sort === 'usage') {
            query = query.sort({ usageCount: order === 'asc' ? 1 : -1 });
        } else if (sort === 'recent') {
            query = query.sort({ updatedAt: -1 });
        } else {
            query = query.sort({ name: order === 'asc' ? 1 : -1 });
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const templates = await query;
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/templates/most-used
// @desc    Get most frequently used templates
// @access  Private
router.get('/most-used', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const templates = await EventTemplate.getMostUsed(req.user.id, limit);
        res.json(templates);
    } catch (error) {
        console.error('Error fetching most used templates:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/templates/:id
// @desc    Get single template by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const template = await EventTemplate.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/templates
// @desc    Create a new template
// @access  Private
router.post(
    '/',
    auth,
    [
        body('name').trim().notEmpty().withMessage('Template name is required'),
        body('title').trim().notEmpty().withMessage('Event title is required'),
        body('duration').optional().isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
        body('color').optional().isHexColor().withMessage('Invalid color format'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const {
                name,
                title,
                description,
                location,
                duration,
                color,
                category,
                priority,
                recurrence,
                reminders,
                isDefault,
            } = req.body;

            // Check for duplicate template name
            const existingTemplate = await EventTemplate.findOne({
                user: req.user.id,
                name: name.trim(),
            });

            if (existingTemplate) {
                return res.status(400).json({ message: 'Template with this name already exists' });
            }

            const template = new EventTemplate({
                user: req.user.id,
                name,
                title,
                description,
                location,
                duration,
                color,
                category,
                priority,
                recurrence,
                reminders,
                isDefault,
            });

            await template.save();
            res.status(201).json(template);
        } catch (error) {
            console.error('Error creating template:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   POST /api/templates/:id/use
// @desc    Use a template (increments usage count)
// @access  Private
router.post('/:id/use', auth, async (req, res) => {
    try {
        const template = await EventTemplate.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        await template.incrementUsage();
        res.json(template);
    } catch (error) {
        console.error('Error using template:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/templates/:id
// @desc    Update a template
// @access  Private
router.put(
    '/:id',
    auth,
    [
        body('name').optional().trim().notEmpty().withMessage('Template name cannot be empty'),
        body('title').optional().trim().notEmpty().withMessage('Event title cannot be empty'),
        body('duration').optional().isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
        body('color').optional().isHexColor().withMessage('Invalid color format'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const template = await EventTemplate.findOne({
                _id: req.params.id,
                user: req.user.id,
            });

            if (!template) {
                return res.status(404).json({ message: 'Template not found' });
            }

            // Check for duplicate name if name is being changed
            if (req.body.name && req.body.name !== template.name) {
                const existingTemplate = await EventTemplate.findOne({
                    user: req.user.id,
                    name: req.body.name.trim(),
                    _id: { $ne: template._id },
                });

                if (existingTemplate) {
                    return res.status(400).json({ message: 'Template with this name already exists' });
                }
            }

            // Update fields
            const updateFields = [
                'name', 'title', 'description', 'location', 'duration',
                'color', 'category', 'priority', 'recurrence', 'reminders', 'isDefault'
            ];

            updateFields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    template[field] = req.body[field];
                }
            });

            await template.save();
            res.json(template);
        } catch (error) {
            console.error('Error updating template:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route   DELETE /api/templates/:id
// @desc    Delete a template
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const template = await EventTemplate.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        await EventTemplate.deleteOne({ _id: template._id });
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/templates/from-event
// @desc    Create a template from an existing event
// @access  Private
router.post(
    '/from-event',
    auth,
    [
        body('name').trim().notEmpty().withMessage('Template name is required'),
        body('eventId').notEmpty().withMessage('Event ID is required'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const Event = require('../models/Event');
            const event = await Event.findOne({
                _id: req.body.eventId,
                user: req.user.id,
            });

            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            // Check for duplicate template name
            const existingTemplate = await EventTemplate.findOne({
                user: req.user.id,
                name: req.body.name.trim(),
            });

            if (existingTemplate) {
                return res.status(400).json({ message: 'Template with this name already exists' });
            }

            // Calculate duration from event
            const duration = Math.round(
                (new Date(event.end) - new Date(event.start)) / (1000 * 60)
            );

            const template = new EventTemplate({
                user: req.user.id,
                name: req.body.name,
                title: event.title,
                description: event.description,
                location: event.location,
                duration: duration || 60,
                color: event.color,
                category: event.category,
                priority: event.priority,
                recurrence: event.recurrence,
                reminders: event.reminders,
            });

            await template.save();
            res.status(201).json(template);
        } catch (error) {
            console.error('Error creating template from event:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

module.exports = router;

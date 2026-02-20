const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find({ user: req.userId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Server error fetching notes' });
    }
});

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { title, content, color, coordinates, pinnedDate } = req.body;

        const note = await Note.create({
            user: req.userId,
            title,
            content,
            color,
            coordinates,
            pinnedDate
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Server error creating note' });
    }
});

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { title, content, color, coordinates, pinnedDate } = req.body;

        // Verify ownership
        const noteToUpdate = await Note.findById(req.params.id);
        if (!noteToUpdate) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (noteToUpdate.user.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this note' });
        }

        const note = await Note.findByIdAndUpdate(
            req.params.id,
            { title, content, color, coordinates, pinnedDate },
            { new: true, runValidators: true }
        );

        res.json(note);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Server error updating note' });
    }
});

// @desc    Update note coordinates only (drag & drop optimization)
// @route   PATCH /api/notes/:id/coordinates
// @access  Private
router.patch('/:id/coordinates', async (req, res) => {
    try {
        const { coordinates } = req.body;

        // Verify ownership
        const noteToUpdate = await Note.findById(req.params.id);
        if (!noteToUpdate) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (noteToUpdate.user.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this note' });
        }

        const note = await Note.findByIdAndUpdate(
            req.params.id,
            { coordinates },
            { new: true }
        );

        res.json(note);
    } catch (error) {
        console.error('Error updating note coordinates:', error);
        res.status(500).json({ message: 'Server error updating note coordinates' });
    }
});

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Verify ownership
        if (note.user.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this note' });
        }

        await note.deleteOne();
        res.json({ message: 'Note removed' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Server error deleting note' });
    }
});

module.exports = router;

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        trim: true,
        default: 'Untitled Note'
    },
    content: {
        type: String,
        trim: true,
        default: ''
    },
    color: {
        type: String,
        default: 'bg-yellow-100', // Default tailwind color class
    },
    coordinates: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
    },
    pinnedDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Note', noteSchema);

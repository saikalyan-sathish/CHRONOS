const mongoose = require('mongoose');

const eventTemplateSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Template name is required'],
            trim: true,
            maxlength: [100, 'Template name cannot exceed 100 characters'],
        },
        // Event fields to save as template
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        location: {
            type: String,
            trim: true,
            default: '',
        },
        duration: {
            type: Number,
            default: 60, // Duration in minutes
        },
        color: {
            type: String,
            default: '#3B82F6',
        },
        category: {
            type: String,
            enum: ['work', 'personal', 'health', 'social', 'other'],
            default: 'other',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        // Recurrence pattern (optional)
        recurrence: {
            pattern: {
                type: String,
                enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
                default: 'none',
            },
            interval: {
                type: Number,
                default: 1,
            },
            daysOfWeek: [{
                type: Number,
                min: 0,
                max: 6,
            }],
        },
        // Reminders
        reminders: [{
            type: Number, // Minutes before event
        }],
        isDefault: {
            type: Boolean,
            default: false,
        },
        usageCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
eventTemplateSchema.index({ user: 1, name: 1 });
eventTemplateSchema.index({ user: 1, usageCount: -1 });

// Pre-save middleware to ensure only one default template per user
eventTemplateSchema.pre('save', async function (next) {
    if (this.isDefault && this.isModified('isDefault')) {
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

// Static method to get templates sorted by usage
eventTemplateSchema.statics.getMostUsed = function (userId, limit = 5) {
    return this.find({ user: userId })
        .sort({ usageCount: -1 })
        .limit(limit);
};

// Method to increment usage count
eventTemplateSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    return this.save();
};

module.exports = mongoose.model('EventTemplate', eventTemplateSchema);

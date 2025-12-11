const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for default categories
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['expense', 'income'],
        default: 'expense'
    }
}, { timestamps: true });

// Ensure unique category names per user and type
categorySchema.index({ name: 1, user: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);

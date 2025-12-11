const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['metal', 'stock', 'mutual_fund']
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    investedAmount: {
        type: Number,
        required: true,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique holding per user per symbol
investmentSchema.index({ user: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Investment', investmentSchema);

const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: String,
    limit: Number,
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);

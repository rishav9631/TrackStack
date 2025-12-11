const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        // Password is not required if using Google Login
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: String,
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local',
    },
    customCategories: {
        type: [String],
        default: ['Rent', 'Electricity', 'Maid', 'Groceries', 'Food', 'Entertainment', 'Loan Repayment', 'Miscellaneous'],
    },
    areCategoriesSeeded: {
        type: Boolean,
        default: false
    },
    splitwiseConsumerKey: {
        type: String,
    },
    splitwiseConsumerSecret: {
        type: String,
    },
    splitwiseAccessToken: {
        type: String,
    },
    splitwiseRefreshToken: {
        type: String,
    },
    splitwiseTokenExpiry: {
        type: Date,
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

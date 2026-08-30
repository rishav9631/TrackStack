const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema(
    {
        mongoUri: {
            type: String,
            default: '',
        },
        mailHost: {
            type: String,
            default: 'smtp.gmail.com',
        },
        mailUser: {
            type: String,
            default: '',
        },
        mailPass: {
            type: String,
            default: '',
        },
        googleClientId: {
            type: String,
            default: '',
        },
        reactAppBaseUrl: {
            type: String,
            default: 'http://localhost:3000',
        },
        splitwiseRedirectUri: {
            type: String,
            default: 'http://localhost:3000/callback',
        },
        port: {
            type: Number,
            default: 5000,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AppConfig', appConfigSchema);

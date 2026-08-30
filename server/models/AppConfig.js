const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema(
    {
        // Gemini API Configuration
        geminiApiKey: {
            type: String,
            default: '',
        },
        geminiApiUrl: {
            type: String,
            default: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        },

        // Gmail REST API Configuration
        gmailClientId: {
            type: String,
            default: '',
        },
        gmailClientSecret: {
            type: String,
            default: '',
        },
        gmailRefreshToken: {
            type: String,
            default: '',
        },
        resendApiKey: {
            type: String,
            default: '',
        },

        // Database Configuration
        mongoUri: {
            type: String,
            default: '',
        },

        // Email / SMTP Configuration
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

        // Endpoints & Ports
        googleClientId: {
            type: String,
            default: '',
        },
        reactAppBaseUrl: {
            type: String,
            default: 'https://track-stack-git-main-rishavs-projects-ae4e8857.vercel.app',
        },
        splitwiseRedirectUri: {
            type: String,
            default: 'https://track-stack-git-main-rishavs-projects-ae4e8857.vercel.app/callback',
        },
        port: {
            type: Number,
            default: 5000,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AppConfig', appConfigSchema);

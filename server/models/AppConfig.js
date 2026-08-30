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

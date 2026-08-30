const AppConfig = require('../models/AppConfig');
const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let cachedConfig = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60s cache

/**
 * Returns the current AppConfig from MongoDB (with in-memory cache), seeded from env.
 */
const getConfigInternal = async () => {
    const now = Date.now();
    if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedConfig;
    }

    let config = await AppConfig.findOne();
    if (!config) {
        config = await AppConfig.create({
            geminiApiKey: process.env.GEMINI_API_KEY || '',
            geminiApiUrl: process.env.GEMINI_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            gmailClientId: process.env.GMAIL_CLIENT_ID || '',
            gmailClientSecret: process.env.GMAIL_CLIENT_SECRET || '',
            gmailRefreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
            mongoUri: process.env.MONGO_URI || '',
            mailHost: process.env.MAIL_HOST || 'smtp.gmail.com',
            mailUser: process.env.MAIL_USER || '',
            mailPass: process.env.MAIL_PASS || '',
            googleClientId: process.env.GOOGLE_CLIENT_ID || '',
            reactAppBaseUrl: process.env.REACT_APP_BASE_URL || 'https://track-stack-git-main-rishavs-projects-ae4e8857.vercel.app',
            splitwiseRedirectUri: process.env.SPLITWISE_REDIRECT_URI || 'https://track-stack-git-main-rishavs-projects-ae4e8857.vercel.app/callback',
            port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
        });
        console.log('[AppConfig] Seeded default configuration from environment variables.');
    }

    cachedConfig = config.toObject();
    cacheTimestamp = now;
    return cachedConfig;
};

const clearConfigCache = () => {
    cachedConfig = null;
    cacheTimestamp = 0;
};

// Mask secret helper
const maskSecret = (val) => {
    if (!val || val.length < 8) return val ? '••••••••' : '';
    return val.substring(0, 4) + '••••••••' + val.substring(val.length - 4);
};

/**
 * GET /api/config
 */
const getConfig = async (req, res) => {
    try {
        const config = await getConfigInternal();
        const safeConfig = {
            ...config,
            _id: undefined,
            __v: undefined,
            geminiApiKey: maskSecret(config.geminiApiKey),
            gmailClientSecret: maskSecret(config.gmailClientSecret),
            gmailRefreshToken: maskSecret(config.gmailRefreshToken),
            mailPass: maskSecret(config.mailPass),
        };
        res.json({ success: true, config: safeConfig });
    } catch (error) {
        console.error('[AppConfig] Error fetching config:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch configuration.' });
    }
};

/**
 * GET /api/config/raw
 */
const getConfigRaw = async (req, res) => {
    try {
        const config = await getConfigInternal();
        const rawConfig = { ...config, _id: undefined, __v: undefined };
        res.json({ success: true, config: rawConfig });
    } catch (error) {
        console.error('[AppConfig] Error fetching raw config:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch configuration.' });
    }
};

/**
 * PUT /api/config
 */
const updateConfig = async (req, res) => {
    try {
        const updates = { ...req.body };

        delete updates._id;
        delete updates.__v;
        delete updates.createdAt;
        delete updates.updatedAt;

        // Skip masked secret values
        if (updates.geminiApiKey && updates.geminiApiKey.includes('••••')) delete updates.geminiApiKey;
        if (updates.gmailClientSecret && updates.gmailClientSecret.includes('••••')) delete updates.gmailClientSecret;
        if (updates.gmailRefreshToken && updates.gmailRefreshToken.includes('••••')) delete updates.gmailRefreshToken;
        if (updates.mailPass && updates.mailPass.includes('••••')) delete updates.mailPass;

        const config = await AppConfig.findOneAndUpdate(
            {},
            { $set: updates },
            { new: true, upsert: true, runValidators: true }
        );

        clearConfigCache();

        res.json({
            success: true,
            message: 'Configuration updated successfully.',
            config,
        });
    } catch (error) {
        console.error('[AppConfig] Error updating config:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update configuration.' });
    }
};

/**
 * POST /api/config/test-mongo
 */
const testMongoConnection = async (req, res) => {
    const { mongoUri } = req.body;
    if (!mongoUri) {
        return res.status(400).json({ success: false, message: 'MongoDB URI is required' });
    }

    let testConn = null;
    try {
        testConn = await mongoose.createConnection(mongoUri, {
            serverSelectionTimeoutMS: 6000,
        }).asPromise();

        const host = testConn.host || 'Connected successfully';
        await testConn.close();

        return res.json({
            success: true,
            message: `Connection successful! Host: ${host}`,
        });
    } catch (error) {
        if (testConn) {
            try { await testConn.close(); } catch (_) {}
        }
        return res.status(400).json({
            success: false,
            message: `Connection test failed: ${error.message}`,
        });
    }
};

/**
 * POST /api/config/seed-master
 * Seed or update a master user in MongoDB with isSeeded: true flag
 */
const seedMasterUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and Password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            user.name = name || user.name || 'Master Admin';
            user.password = hashedPassword;
            user.isVerified = true;
            user.isSeeded = true;
            user.role = 'Admin';
            await user.save();
        } else {
            user = await User.create({
                name: name || 'Master Admin',
                email: normalizedEmail,
                password: hashedPassword,
                isVerified: true,
                isSeeded: true,
                role: 'Admin',
                customCategories: ['Rent', 'Electricity', 'Maid', 'Groceries', 'Food', 'Entertainment', 'Loan Repayment', 'Miscellaneous'],
            });
        }

        res.json({
            success: true,
            message: `Master user ${normalizedEmail} successfully seeded in database.`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isSeeded: user.isSeeded,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('[SeedMaster] Error:', error.message);
        res.status(500).json({ success: false, message: `Failed to seed master user: ${error.message}` });
    }
};

/**
 * POST /api/config/remove-seeded
 * Deletes all users flagged with isSeeded: true from MongoDB
 */
const removeSeededUsers = async (req, res) => {
    try {
        const result = await User.deleteMany({ isSeeded: true });
        res.json({
            success: true,
            message: `Successfully removed ${result.deletedCount} seeded user(s) from database.`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('[RemoveSeeded] Error:', error.message);
        res.status(500).json({ success: false, message: `Failed to remove seeded users: ${error.message}` });
    }
};

/**
 * GET /api/config/seeded-users
 * Returns list of currently active seeded users in MongoDB
 */
const getSeededUsers = async (req, res) => {
    try {
        const users = await User.find({ isSeeded: true }).select('name email isSeeded role createdAt');
        res.json({
            success: true,
            users,
        });
    } catch (error) {
        console.error('[GetSeededUsers] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch seeded users.' });
    }
};

module.exports = {
    getConfig,
    getConfigRaw,
    updateConfig,
    getConfigInternal,
    clearConfigCache,
    testMongoConnection,
    seedMasterUser,
    removeSeededUsers,
    getSeededUsers,
};

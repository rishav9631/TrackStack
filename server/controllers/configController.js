const AppConfig = require('../models/AppConfig');
const mongoose = require('mongoose');
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
            mongoUri: process.env.MONGO_URI || '',
            mailHost: process.env.MAIL_HOST || 'smtp.gmail.com',
            mailUser: process.env.MAIL_USER || '',
            mailPass: process.env.MAIL_PASS || '',
            googleClientId: process.env.GOOGLE_CLIENT_ID || '',
            reactAppBaseUrl: process.env.REACT_APP_BASE_URL || 'http://localhost:3000',
            splitwiseRedirectUri: process.env.SPLITWISE_REDIRECT_URI || 'http://localhost:3000/callback',
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

// Mask helper
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

        if (updates.mailPass && updates.mailPass.includes('••••')) {
            delete updates.mailPass;
        }

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
 * Test connection to a MongoDB URI
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

module.exports = {
    getConfig,
    getConfigRaw,
    updateConfig,
    getConfigInternal,
    clearConfigCache,
    testMongoConnection,
};

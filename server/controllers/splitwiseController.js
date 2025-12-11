const axios = require('axios');
const User = require('../models/User');

const SPLITWISE_AUTH_URL = 'https://secure.splitwise.com/oauth/authorize';
const SPLITWISE_TOKEN_URL = 'https://secure.splitwise.com/oauth/token';
const SPLITWISE_API_BASE = 'https://secure.splitwise.com/api/v3.0';

exports.saveCredentials = async (req, res) => {
    const { consumerKey, consumerSecret } = req.body;

    if (!consumerKey || !consumerSecret) {
        return res.status(400).json({ error: 'Consumer Key and Secret are required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.splitwiseConsumerKey = consumerKey;
        user.splitwiseConsumerSecret = consumerSecret;
        await user.save();

        res.json({ success: true, message: 'Credentials saved successfully' });
    } catch (error) {
        console.error('Save Credentials Error:', error);
        res.status(500).json({ error: 'Failed to save credentials' });
    }
};

exports.getAuthUrl = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const consumerKey = user.splitwiseConsumerKey;
        if (!consumerKey) {
            return res.status(400).json({ error: 'Splitwise credentials not found. Please provide them first.', missingCredentials: true });
        }

        const redirectUri = process.env.SPLITWISE_REDIRECT_URI || `${process.env.REACT_APP_BASE_URL}/callback`;
        const url = `${SPLITWISE_AUTH_URL}?response_type=code&client_id=${consumerKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        res.json({ url });
    } catch (error) {
        console.error('Get Auth URL Error:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
};

exports.oauthCallback = async (req, res) => {
    const { code } = req.body;
    const redirectUri = process.env.SPLITWISE_REDIRECT_URI || `${process.env.REACT_APP_BASE_URL}/callback`;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const consumerKey = user.splitwiseConsumerKey;
        const consumerSecret = user.splitwiseConsumerSecret;

        if (!consumerKey || !consumerSecret) {
            return res.status(400).json({ error: 'Splitwise credentials not found' });
        }

        const response = await axios.post(SPLITWISE_TOKEN_URL, null, {
            params: {
                grant_type: 'authorization_code',
                code,
                client_id: consumerKey,
                client_secret: consumerSecret,
                redirect_uri: redirectUri,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // Update user with tokens
        // const user = await User.findById(req.user.id); // This line is now redundant as user is fetched above
        // if (!user) { // This check is also redundant
        //     return res.status(404).json({ error: 'User not found' });
        // }

        user.splitwiseAccessToken = access_token;
        // Splitwise OAuth 2.0 might not return refresh token or expiry in all cases, check docs/response
        // But assuming standard OAuth 2.0
        if (refresh_token) user.splitwiseRefreshToken = refresh_token;
        if (expires_in) {
            user.splitwiseTokenExpiry = new Date(Date.now() + expires_in * 1000);
        }

        await user.save();

        res.json({ success: true, message: 'Splitwise connected successfully' });

    } catch (error) {
        console.error('Splitwise OAuth Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to authenticate with Splitwise' });
    }
};

exports.getExpenses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.splitwiseAccessToken) {
            return res.status(401).json({ error: 'Splitwise not connected' });
        }

        const { group_id } = req.query;
        const params = {
            limit: 999 // Fetch more for better stats
        };
        if (group_id) {
            params.group_id = group_id;
        }

        const response = await axios.get(`${SPLITWISE_API_BASE}/get_expenses`, {
            headers: {
                Authorization: `Bearer ${user.splitwiseAccessToken}`
            },
            params
        });

        const expenses = response.data.expenses.filter(expense => !expense.deleted_at);
        res.json({ ...response.data, expenses });
    } catch (error) {
        console.error('Splitwise Get Expenses Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch expenses from Splitwise' });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.splitwiseAccessToken) {
            return res.status(401).json({ error: 'Splitwise not connected' });
        }

        const response = await axios.get(`${SPLITWISE_API_BASE}/get_groups`, {
            headers: {
                Authorization: `Bearer ${user.splitwiseAccessToken}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Splitwise Get Groups Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch groups from Splitwise' });
    }
};

exports.getGroup = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.splitwiseAccessToken) {
            return res.status(401).json({ error: 'Splitwise not connected' });
        }

        const { id } = req.params;

        const response = await axios.get(`${SPLITWISE_API_BASE}/get_group/${id}`, {
            headers: {
                Authorization: `Bearer ${user.splitwiseAccessToken}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Splitwise Get Group Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch group from Splitwise' });
    }
};

exports.getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.splitwiseAccessToken) {
            return res.status(401).json({ error: 'Splitwise not connected' });
        }

        const response = await axios.get(`${SPLITWISE_API_BASE}/get_friends`, {
            headers: {
                Authorization: `Bearer ${user.splitwiseAccessToken}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Splitwise Get Friends Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch friends from Splitwise' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return connection status along with user info if connected
        const isConnected = !!user.splitwiseAccessToken;
        const hasCredentials = !!user.splitwiseConsumerKey && !!user.splitwiseConsumerSecret;

        if (!isConnected) {
            return res.json({ isConnected: false, hasCredentials });
        }

        const response = await axios.get(`${SPLITWISE_API_BASE}/get_current_user`, {
            headers: {
                Authorization: `Bearer ${user.splitwiseAccessToken}`
            }
        });

        res.json({ ...response.data, isConnected: true, hasCredentials });
    } catch (error) {
        console.error('Splitwise Get Current User Error:', error.response?.data || error.message);
        // If token is invalid, we might get 401 from Splitwise. 
        // We should return that state to frontend so it can prompt re-auth.
        if (error.response && error.response.status === 401) {
            return res.json({ isConnected: false, hasCredentials: true, error: 'Token expired or invalid' });
        }
        res.status(500).json({ error: 'Failed to fetch current user from Splitwise' });
    }
};

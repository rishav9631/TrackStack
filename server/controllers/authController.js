const User = require('../models/User');
const OTP = require('../models/OTP');
const Expense = require('../models/Expense');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const mailSender = require('../utils/mailSender');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { loginTemplate, signupTemplate } = require('../utils/emailTemplates');
const { forceRefresh } = require('../utils/googleOAuthService');
const { getPasswordRecoveryEmail } = require('../utils/resetPasswordTemplate');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const CLIENT_URL = process.env.REACT_APP_BASE_URL || 'https://track-stack-git-main-rishavs-projects-ae4e8857.vercel.app';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Google Login
exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const { name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            // Create new user
            user = await User.create({
                name,
                email,
                isVerified: true, // Google verified emails are trusted
                authProvider: 'google',
                // No password for google users
            });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

        // Send Login Email
        try {
            mailSender(user.email, "Login Notification", loginTemplate(user.name));
        } catch (mailError) {
            console.log("Failed to send login email", mailError);
        }

        res.status(200).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, customCategories: user.customCategories },
            message: 'Google login successful',
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Google login failed' });
    }
};

// Register with Email Verification Link
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(403).json({ success: false, message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            verificationToken,
            isVerified: false,
            authProvider: 'local'
        });

        const verificationLink = `${CLIENT_URL}/verify-email/${verificationToken}`;
        console.log('Verification Link:', verificationLink);

        await mailSender(
            email,
            "Verify your Email",
            signupTemplate(name, verificationLink)
        );

        res.status(200).json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email and password' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // .lean() returns a plain JS object — faster for auth flows where we don't need .save()
        const user = await User.findOne({
            $or: [{ email: normalizedEmail }, { name: email.trim() }]
        }).lean();
        if (!user) {
            return res.status(401).json({ success: false, message: 'User is not registered' });
        }

        if (user.authProvider === 'google') {
            return res.status(400).json({ success: false, message: 'Please use Google Login for this account' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ success: false, message: 'Please verify your email first' });
        }

        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });
            // Delete password from the plain object (lean docs can't use .save())
            delete user.password;

            // Send Login Email safely
            try {
                mailSender(user.email, "Login Notification", loginTemplate(user.name));
            } catch (mailError) {
                console.log("Failed to send login email", mailError.message);
            }

            return res.status(200).json({
                success: true,
                token,
                user,
                message: 'User logged in successfully',
            });
        } else {
            return res.status(401).json({ success: false, message: 'Password is incorrect' });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: `Login error: ${error.message}` });
    }
};

/**
 * POST /api/auth/forgot-password
 * Single-user password recovery (rishavjha771@gmail.com only).
 * Flow:
 *   1. Force-refresh Gmail OAuth token so email can be sent
 *   2. Look up user by email rishavjha771@gmail.com
 *   3. Generate a random 8-char temp password, hash + save to MongoDB
 *   4. Email the temp password to rishavjha771@gmail.com
 *
 * No OTP needed — this app is single-user.
 */
exports.forgotPassword = async (req, res) => {
    try {
        const RECOVERY_EMAIL = 'rishavjha771@gmail.com';

        console.log('[ForgotPassword] Step 1/4: Force-refreshing Gmail OAuth token...');
        await forceRefresh();
        console.log('[ForgotPassword] Step 1/4: OAuth token refreshed successfully.');

        console.log('[ForgotPassword] Step 2/4: Looking up user in MongoDB...');
        const user = await User.findOne({ email: RECOVERY_EMAIL });
        if (!user) {
            console.error('[ForgotPassword] User not found in database.');
            return res.status(404).json({ success: false, message: 'Recovery user not found.' });
        }
        console.log(`[ForgotPassword] Step 2/4: Found user "${user.name}".`);

        console.log('[ForgotPassword] Step 3/4: Resetting password...');
        const tempPassword = crypto.randomBytes(4).toString('hex'); // 8-char hex
        user.password = await bcrypt.hash(tempPassword, 10);
        await user.save();
        console.log('[ForgotPassword] Step 3/4: Password updated in MongoDB.');

        console.log(`[ForgotPassword] Step 4/4: Sending recovery email to ${RECOVERY_EMAIL}...`);
        const emailBody = getPasswordRecoveryEmail(user.name, tempPassword);
        await mailSender(
            RECOVERY_EMAIL,
            'StackTrack — Password Recovery',
            emailBody
        );
        console.log('[ForgotPassword] Step 4/4: Recovery email sent successfully.');

        res.status(200).json({
            success: true,
            message: `Password recovery email sent! Check your inbox at ${RECOVERY_EMAIL}.`,
        });
    } catch (error) {
        console.error('[ForgotPassword] Error:', error.message);
        res.status(500).json({
            success: false,
            message: `Password recovery failed: ${error.message}`,
        });
    }
};

// Legacy OTP-based reset kept for reference but no longer wired to any route.
// exports.sendForgotPasswordOTP = ...
// exports.resetPassword = ...

const Category = require('../models/Category');

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        // Seed default categories if not already done
        if (!user.areCategoriesSeeded) {
            const defaultExpenseCategories = ['Food', 'Miscellaneous', 'Groceries', 'Maid', 'Entertainment', 'Electricity', 'Rent', 'Loan Repayment'];
            const defaultIncomeCategories = ['Salary', 'Freelance', 'Investments']; // Adding some defaults for income too

            const categoryPromises = [];

            // Seed Expenses
            for (const catName of defaultExpenseCategories) {
                categoryPromises.push(
                    Category.findOneAndUpdate(
                        { name: catName, user: user._id, type: 'expense' },
                        { name: catName, user: user._id, type: 'expense', isDefault: true },
                        { upsert: true, new: true }
                    )
                );
            }

            // Seed Incomes
            for (const catName of defaultIncomeCategories) {
                categoryPromises.push(
                    Category.findOneAndUpdate(
                        { name: catName, user: user._id, type: 'income' },
                        { name: catName, user: user._id, type: 'income', isDefault: true },
                        { upsert: true, new: true }
                    )
                );
            }

            await Promise.all(categoryPromises);

            user.areCategoriesSeeded = true;
            await user.save();
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.addCustomCategory = async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const user = await User.findById(req.user.id);
        if (user.customCategories.includes(category)) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        user.customCategories.push(category);
        await user.save();

        res.status(200).json({ success: true, message: 'Category added successfully', customCategories: user.customCategories });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to add category' });
    }
};

exports.renameCustomCategory = async (req, res) => {
    try {
        const { oldCategory, newCategory } = req.body;
        if (!oldCategory || !newCategory) {
            return res.status(400).json({ success: false, message: 'Both old and new category names are required' });
        }

        const user = await User.findById(req.user.id);
        const categoryIndex = user.customCategories.indexOf(oldCategory);

        if (categoryIndex === -1) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        if (user.customCategories.includes(newCategory)) {
            return res.status(400).json({ success: false, message: 'New category name already exists' });
        }

        user.customCategories[categoryIndex] = newCategory;
        await user.save();

        // Update all expenses with the old category name
        await Expense.updateMany(
            { user: req.user.id, category: oldCategory },
            { category: newCategory }
        );

        res.status(200).json({ success: true, message: 'Category renamed successfully', customCategories: user.customCategories });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to rename category' });
    }
};

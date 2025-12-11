const express = require('express');
const router = express.Router();
const splitwiseController = require('../controllers/splitwiseController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/auth-url', authMiddleware, splitwiseController.getAuthUrl);
router.post('/credentials', authMiddleware, splitwiseController.saveCredentials);
router.post('/oauth/callback', authMiddleware, splitwiseController.oauthCallback);
router.get('/expenses', authMiddleware, splitwiseController.getExpenses);
router.get('/groups', authMiddleware, splitwiseController.getGroups);
router.get('/group/:id', authMiddleware, splitwiseController.getGroup);
router.get('/friends', authMiddleware, splitwiseController.getFriends);
router.get('/current_user', authMiddleware, splitwiseController.getCurrentUser);

module.exports = router;

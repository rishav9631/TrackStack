const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protect all group routes

router.post('/create', groupController.createGroup);
router.post('/join', groupController.joinGroup);
router.get('/', groupController.getUserGroups);
router.get('/:groupId', groupController.getGroupDetails);

module.exports = router;

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, categoryController.getCategories);
router.post('/', authMiddleware, categoryController.addCategory);
router.put('/', authMiddleware, categoryController.renameCategory);
router.delete('/:category', authMiddleware, categoryController.deleteCategory);

module.exports = router;

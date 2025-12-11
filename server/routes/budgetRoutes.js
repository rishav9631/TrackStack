const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

const budgetCategoryController = require('../controllers/budgetCategoryController');

// Category Routes
router.get('/categories', budgetCategoryController.getBudgetCategories);
router.post('/categories', budgetCategoryController.addBudgetCategory);
router.put('/categories', budgetCategoryController.renameBudgetCategory);
router.delete('/categories/:category', budgetCategoryController.deleteBudgetCategory);

router.get('/', budgetController.getBudgets);
router.post('/', budgetController.setBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;

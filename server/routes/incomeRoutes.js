const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');

const incomeCategoryController = require('../controllers/incomeCategoryController');

// Category Routes
router.get('/categories', incomeCategoryController.getIncomeCategories);
router.post('/categories', incomeCategoryController.addIncomeCategory);
router.put('/categories', incomeCategoryController.renameIncomeCategory);
router.delete('/categories/:category', incomeCategoryController.deleteIncomeCategory);

router.get('/', incomeController.getIncomes);
router.post('/', incomeController.addIncome);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;

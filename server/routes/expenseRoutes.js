const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

const expenseCategoryController = require('../controllers/expenseCategoryController');

// Category Routes
router.get('/categories', expenseCategoryController.getExpenseCategories);
router.post('/categories', expenseCategoryController.addExpenseCategory);
router.put('/categories', expenseCategoryController.renameExpenseCategory);
router.delete('/categories/:category', expenseCategoryController.deleteExpenseCategory);

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.addExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);
router.delete('/', expenseController.deleteAllExpenses);
router.post('/report', expenseController.getExpenseReport);
router.post('/report/pdf', expenseController.getExpenseReportPdf);
router.post('/report/email-pdf', expenseController.emailExpenseReport);

module.exports = router;

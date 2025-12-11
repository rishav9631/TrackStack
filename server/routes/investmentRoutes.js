const express = require('express');
const router = express.Router();
const { addInvestment, getInvestments, deleteInvestment } = require('../controllers/investmentController');

router.post('/add', addInvestment);
router.get('/get', getInvestments);
router.delete('/delete/:id', deleteInvestment);

module.exports = router;

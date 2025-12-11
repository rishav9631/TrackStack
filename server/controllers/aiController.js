const axios = require('axios');
const Budget = require('../models/Budget');
const Income = require('../models/Income');
const Expense = require('../models/Expense');

const GEMINI_API_KEY_MAIN = 'AIzaSyCWgS2C2_tCfxEB5v7w1yLe6UzVcAirMVw';
const GEMINI_URL_MAIN = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function fetchAllFinanceData(userId) {
    const budgetsArray = await Budget.find({ user: userId });
    const budgets = budgetsArray.reduce((acc, b) => {
        acc[b.category] = b;
        return acc;
    }, {});

    const incomes = await Income.find({ user: userId }).sort({ date: -1 });
    const expenses = await Expense.find({ user: userId }).sort({ date: -1 });

    return { budgets, incomes, expenses };
}

exports.runGemini = async (req, res) => {
    try {
        const financeData = await fetchAllFinanceData(req.user.id);

        const description = req.body.description ||
            "Summarize my current income, categorized expenses, and budgets. List overspending categories and offer savings advice.";

        const geminiPrompt = `${description}\n\nData:\n${JSON.stringify(financeData)}`;

        const geminiRes = await axios.post(
            `${GEMINI_URL_MAIN}?key=${GEMINI_API_KEY_MAIN}`,
            {
                contents: [
                    { parts: [{ text: geminiPrompt }] }
                ]
            },
            {
                headers: { "Content-Type": "application/json" }
            }
        );

        res.json(geminiRes.data);
    } catch (err) {
        res.status(500).json({ error: err.message, details: err.response?.data });
    }
};

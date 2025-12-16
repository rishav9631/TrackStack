const PDFDocument = require('pdfkit');
const moment = require('moment');
const axios = require('axios');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');

/**
 * =============================================================================
 * CONFIGURATION
 * Centralizes layout and style settings for easy maintenance.
 * =============================================================================
 */
const LAYOUT_CONFIG = {
    MARGIN: 40,
    FONT_SIZES: {
        H1: 20,
        H2: 15,
        H3: 14,
        BODY: 12,
        SMALL: 11,
    },
    COLORS: {
        PRIMARY: 'black',
        SECONDARY: 'gray',
        SUCCESS: 'green',
        DANGER: 'red',
    },
    COLUMNS: {
        CATEGORY: 50,
        AMOUNT: 260,
        BUDGET: 360,
        STATUS: 460,
        END: 550,
    }
};

/**
 * =============================================================================
 * DATA PROCESSING & EXTERNAL SERVICES
 * Functions for processing data and interacting with external APIs.
 * =============================================================================
 */

async function fetchAllFinanceData(userId, startDate, endDate) {
    // Ensure dates are properly parsed
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const expenses = await Expense.find({
        user: userId,
        date: { $gte: start, $lte: end }
    }).lean();

    const incomes = await Income.find({
        user: userId,
        date: { $gte: start, $lte: end }
    }).lean();

    const budgetsDocs = await Budget.find({ user: userId }).lean();
    const budgets = {};
    budgetsDocs.forEach(b => {
        budgets[b.category] = { limit: b.limit };
    });

    return { budgets, incomes, expenses };
}

/**
 * Processes raw financial data to generate summaries and categorizations.
 * @param {object} financeData - The raw data containing budgets, incomes, and expenses.
 * @param {string} startDate - The start date for filtering.
 * @param {string} endDate - The end date for filtering.
 * @returns {object} A structured object with processed financial summaries.
 */
function processFinancialData(financeData, startDate, endDate) {
    const { budgets, incomes, expenses } = financeData;

    const filteredIncomes = incomes;
    const filteredExpenses = expenses;

    const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const expensesByCategory = {};
    filteredExpenses.forEach(e => {
        if (!expensesByCategory[e.category]) {
            expensesByCategory[e.category] = { total: 0, items: [] };
        }
        expensesByCategory[e.category].total += e.amount;
        expensesByCategory[e.category].items.push(e);
    });

    const overspentCategories = Object.entries(expensesByCategory)
        .filter(([category, { total }]) => budgets[category] && total > budgets[category].limit)
        .map(([category]) => category);

    return {
        startDate,
        endDate,
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        filteredIncomes,
        filteredExpenses,
        expensesByCategory,
        overspentCategories,
        budgets
    };
}

function formatCurrency(amount) {
    return `${Number(amount).toLocaleString('en-IN')}`;
}

/**
 * Fetches AI-powered insights from the Gemini API.
 * @param {object} data - The processed financial data.
 * @returns {Promise<string>} A string containing AI-generated advice.
 */
async function getAiInsights(data) {
    const prompt = `Summarize the following financial period. Total income was ${formatCurrency(data.totalIncome)} and total expenses were ${formatCurrency(data.totalExpenses)}. Highlight any overspending compared to budgets and provide actionable savings tips. Data: ${JSON.stringify({ budgets: data.budgets, expenses: data.filteredExpenses })}`;

    try {
        const GEMINI_URL = process.env.GEMINI_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY is missing.");
            return 'AI summary could not be generated (Missing API Key).';
        }

        const response = await axios.post(
            `${GEMINI_URL}?key=${GEMINI_API_KEY}`, { contents: [{ parts: [{ text: prompt }] }] }, { headers: { "Content-Type": "application/json" } }
        );
        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No AI summary available.';
    } catch (error) {
        console.error("Gemini API call failed:", error.message);
        return 'AI summary could not be generated at this time.';
    }
}

/**
 * =============================================================================
 * PDF GENERATION HELPERS
 * Functions dedicated to drawing specific parts of the PDF document.
 * =============================================================================
 */

function generateHeader(doc, data) {
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.H1).text("Detailed Expense Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.BODY).text(
        `Period: ${moment(data.startDate).format('LL')} to ${moment(data.endDate).format('LL')}`
    );
    doc.moveDown(2);
}

function generateSummary(doc, data) {
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text("Financial Summary", { underline: true });
    doc.moveDown();
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.BODY)
        .text(`Total Income: ${formatCurrency(data.totalIncome)}`)
        .text(`Total Expenses: ${formatCurrency(data.totalExpenses)}`)
        .text(`Net Savings: ${formatCurrency(data.netSavings)}`);
    doc.moveDown();

    if (data.overspentCategories.length > 0) {
        doc.fillColor(LAYOUT_CONFIG.COLORS.DANGER)
            .text(`Overspent Categories: ${data.overspentCategories.join(', ')}`);
    } else {
        doc.fillColor(LAYOUT_CONFIG.COLORS.SUCCESS)
            .text('No overspending detected. Well done!');
    }
    doc.fillColor(LAYOUT_CONFIG.COLORS.PRIMARY).moveDown(2);
}

function generateBreakdownTable(doc, data) {
    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text("Expense Breakdown by Category", { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const { CATEGORY, AMOUNT, BUDGET, STATUS, END } = LAYOUT_CONFIG.COLUMNS;

    doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.BODY)
        .text("Category", CATEGORY, tableTop)
        .text("Total Spent", AMOUNT, tableTop)
        .text("Budget", BUDGET, tableTop)
        .text("Status", STATUS, tableTop);
    doc.moveTo(CATEGORY, doc.y + 5).lineTo(END, doc.y + 5).stroke();
    doc.y += 15;

    Object.entries(data.expensesByCategory).forEach(([category, catData]) => {
        if (doc.y > doc.page.height - LAYOUT_CONFIG.MARGIN * 2) {
            doc.addPage();
        }
        const rowY = doc.y;
        const limit = data.budgets[category]?.limit;
        const status = limit ? (catData.total > limit ? 'Overspent' : 'Within Budget') : 'No Budget';

        let statusColor = LAYOUT_CONFIG.COLORS.PRIMARY;
        if (status === 'Overspent') statusColor = LAYOUT_CONFIG.COLORS.DANGER;
        if (status === 'Within Budget') statusColor = LAYOUT_CONFIG.COLORS.SUCCESS;

        doc.text(category, CATEGORY, rowY)
            .text(formatCurrency(catData.total), AMOUNT, rowY)
            .text(limit ? formatCurrency(limit) : "—", BUDGET, rowY)
            .fillColor(statusColor).text(status, STATUS, rowY).fillColor(LAYOUT_CONFIG.COLORS.PRIMARY);
        doc.y += 20;
    });
}

/**
 * Generates a list of transactions, sorted and grouped by date with visual gaps.
 * @param {PDFDocument} doc - The PDFKit document instance.
 * @param {string} title - The title for the section.
 * @param {Array} items - The array of transaction items to list.
 * @param {Function} formatter - A function that formats a single item into a string.
 */
function generateTransactionList(doc, title, items, formatter) {
    doc.addPage().fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text(title, { underline: true });
    doc.moveDown();

    let lastDate = null; // Keep track of the last date printed

    items.forEach(item => {
        if (doc.y > doc.page.height - LAYOUT_CONFIG.MARGIN) {
            doc.addPage();
            doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text(`${title} (continued)`, { underline: true }).moveDown();
            lastDate = null; // Reset on new page to avoid an initial gap
        }

        const currentDate = moment(item.date).format('YYYY-MM-DD');
        if (lastDate && lastDate !== currentDate) {
            doc.moveDown(0.75); // Add a visual gap between different dates
        }

        doc.fontSize(LAYOUT_CONFIG.FONT_SIZES.SMALL).text(formatter(item));
        doc.moveDown(0.5);
        lastDate = currentDate;
    });
}


function generateAiSection(doc, aiAdvice) {
    doc.addPage().fontSize(LAYOUT_CONFIG.FONT_SIZES.H2).text("AI Insights & Suggestions", { underline: true });
    doc.moveDown();
    doc.fillColor(LAYOUT_CONFIG.COLORS.SECONDARY)
        .fontSize(LAYOUT_CONFIG.FONT_SIZES.BODY)
        .text(aiAdvice, { align: 'left' });
    doc.fillColor(LAYOUT_CONFIG.COLORS.PRIMARY);
}

/**
 * =============================================================================
 * CONTROLLER FUNCTION
 * =============================================================================
 */
exports.generatePdfReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        // 1. Fetch and Process Data
        const rawFinanceData = await fetchAllFinanceData(req.user.id, startDate, endDate);
        const reportData = processFinancialData(rawFinanceData, startDate, endDate);

        // 2. Get AI Insights (can run in parallel with PDF setup)
        const aiAdvicePromise = getAiInsights(reportData);

        // 3. Set Up PDF Document and Headers
        const doc = new PDFDocument({ margin: LAYOUT_CONFIG.MARGIN, size: "A4" });
        const fileName = `Expense_Report_${moment(startDate).format('YYYY-MM-DD')}_to_${moment(endDate).format('YYYY-MM-DD')}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

        doc.pipe(res);

        // 4. Build PDF Content
        generateHeader(doc, reportData);
        generateSummary(doc, reportData);
        generateBreakdownTable(doc, reportData);

        const sortedIncomes = [...reportData.filteredIncomes].sort((a, b) => new Date(a.date) - new Date(b.date));
        generateTransactionList(doc, "All Income Records", sortedIncomes,
            (item) => `[${moment(item.date).format('DD MMM YYYY')}] ${item.source || 'Income'} - ${formatCurrency(item.amount)}`
        );

        const sortedExpenses = [...reportData.filteredExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
        generateTransactionList(doc, "All Expense Records", sortedExpenses,
            (item) => `[${moment(item.date).format('DD MMM YYYY')}] ${item.category}: ${item.description || ''} - ${formatCurrency(item.amount)}`
        );

        // 5. Add AI section once the promise resolves
        const aiAdvice = await aiAdvicePromise;
        generateAiSection(doc, aiAdvice);

        // 6. Finalize the PDF
        doc.end();

    } catch (err) {
        console.error("PDF generation error:", err);
        // Ensure a response is sent even on failure, without sending a broken PDF
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate PDF report." });
        }
    }
};

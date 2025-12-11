const Expense = require('../models/Expense');
const PDFDocument = require('pdfkit');
const mailSender = require('../utils/mailSender');
const { reportTemplate } = require('../utils/emailTemplates');
const User = require('../models/User');

exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
        res.json(expenses);
    } catch {
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

exports.addExpense = async (req, res) => {
    try {
        const { description, amount, category, date } = req.body;
        const expense = new Expense({
            user: req.user.id,
            description,
            amount,
            category,
            date
        });
        await expense.save();
        res.status(201).json(expense);
    } catch {
        res.status(500).json({ error: 'Failed to add expense' });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const updated = await Expense.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Expense not found' });
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Failed to update expense' });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const deleted = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!deleted) return res.status(404).json({ error: 'Expense not found' });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete expense' });
    }
};

exports.deleteAllExpenses = async (req, res) => {
    try {
        const result = await Expense.deleteMany({ user: req.user.id });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete all expenses' });
    }
};

exports.getExpenseReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const mongoose = require('mongoose');
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const expenses = await Expense.aggregate([
            {
                $match: {
                    user: userId,
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" },
                    expenses: { $push: "$$ROOT" }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate report', details: err.message });
    }
};

// Helper to generate PDF
const generatePdf = (expenses, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Title
        doc.fontSize(20).text('Expense Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
        doc.moveDown();

        // Table Header
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Category', 50, 150);
        doc.text('Total Amount', 300, 150, { align: 'right' });
        doc.moveDown();
        doc.moveTo(50, 165).lineTo(550, 165).stroke();
        doc.moveDown();

        // Table Rows
        let y = 180;
        let grandTotal = 0;
        doc.font('Helvetica');

        expenses.forEach(item => {
            doc.text(item._id, 50, y);
            doc.text(`INR ${item.totalAmount.toFixed(2)}`, 300, y, { align: 'right' });
            grandTotal += item.totalAmount;
            y += 20;
        });

        doc.moveDown();
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;
        doc.font('Helvetica-Bold');
        doc.text('Grand Total', 50, y);
        doc.text(`INR ${grandTotal.toFixed(2)}`, 300, y, { align: 'right' });

        doc.end();
    });
};

exports.getExpenseReportPdf = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const mongoose = require('mongoose');
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const expenses = await Expense.aggregate([
            {
                $match: {
                    user: userId,
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        const pdfBuffer = await generatePdf(expenses, startDate, endDate);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Expense_Report_${startDate}_to_${endDate}.pdf`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
    }
};

exports.emailExpenseReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const user = await User.findById(req.user.id);
        const mongoose = require('mongoose');
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const expenses = await Expense.aggregate([
            {
                $match: {
                    user: userId,
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        const pdfBuffer = await generatePdf(expenses, startDate, endDate);

        const emailBody = reportTemplate(user.name, startDate, endDate);

        await mailSender(
            user.email,
            `Expense Report: ${startDate} to ${endDate}`,
            emailBody,
            [
                {
                    filename: `Expense_Report_${startDate}_to_${endDate}.pdf`,
                    content: pdfBuffer
                }
            ]
        );

        res.json({ success: true, message: 'Report emailed successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to email report', details: err.message });
    }
};

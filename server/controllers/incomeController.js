const Income = require('../models/Income');

exports.getIncomes = async (req, res) => {
    try {
        const incomes = await Income.find({ user: req.user.id }).sort({ date: -1 });
        res.json(incomes);
    } catch {
        res.status(500).json({ error: 'Failed to fetch incomes' });
    }
};

exports.addIncome = async (req, res) => {
    try {
        const { source, amount, date } = req.body;
        const income = new Income({
            user: req.user.id,
            source,
            amount,
            date
        });
        await income.save();
        res.status(201).json(income);
    } catch {
        res.status(500).json({ error: 'Failed to add income' });
    }
};

exports.updateIncome = async (req, res) => {
    try {
        const updated = await Income.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Income not found' });
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Failed to update income' });
    }
};

exports.deleteIncome = async (req, res) => {
    try {
        const deleted = await Income.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!deleted) return res.status(404).json({ error: 'Income not found' });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete income' });
    }
};

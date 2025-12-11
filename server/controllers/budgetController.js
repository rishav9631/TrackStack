const Budget = require('../models/Budget');

exports.getBudgets = async (req, res) => {
    try {
        const budgetsArray = await Budget.find({ user: req.user.id });
        const budgets = budgetsArray.reduce((acc, b) => {
            acc[b.category] = b;
            return acc;
        }, {});
        res.json(budgets);
    } catch {
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
};

exports.setBudget = async (req, res) => {
    try {
        const { category, limit } = req.body;
        let budget = await Budget.findOne({ category, user: req.user.id });
        if (budget) {
            budget.limit = limit;
        } else {
            budget = new Budget({ user: req.user.id, category, limit });
        }
        await budget.save();
        res.status(201).json(budget);
    } catch {
        res.status(500).json({ error: 'Failed to set budget' });
    }
};

exports.updateBudget = async (req, res) => {
    try {
        const updated = await Budget.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Budget not found' });
        res.json(updated);
    } catch {
        res.status(500).json({ error: 'Failed to update budget' });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const deleted = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!deleted) return res.status(404).json({ error: 'Budget not found' });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete budget' });
    }
};

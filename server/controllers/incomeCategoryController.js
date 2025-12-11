const Category = require('../models/Category');
const Income = require('../models/Income');

exports.getIncomeCategories = async (req, res) => {
    try {
        const categories = await Category.find({ user: req.user.id, type: 'income' });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch income categories' });
    }
};

exports.addIncomeCategory = async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) return res.status(400).json({ success: false, message: 'Category name is required' });

        const existing = await Category.findOne({ name: category, user: req.user.id, type: 'income' });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        await Category.create({
            name: category,
            user: req.user.id,
            isDefault: false,
            type: 'income'
        });

        const allCategories = await Category.find({ user: req.user.id, type: 'income' });
        res.status(201).json({ success: true, message: 'Category added successfully', categories: allCategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to add category' });
    }
};

exports.renameIncomeCategory = async (req, res) => {
    try {
        const { oldCategory, newCategory } = req.body;
        if (!oldCategory || !newCategory) {
            return res.status(400).json({ success: false, message: 'Both old and new category names are required' });
        }

        const category = await Category.findOne({ name: oldCategory, user: req.user.id, type: 'income' });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const existing = await Category.findOne({ name: newCategory, user: req.user.id, type: 'income' });
        if (existing) {
            return res.status(400).json({ success: false, message: 'New category name already exists' });
        }

        category.name = newCategory;
        await category.save();

        // Update Incomes
        await Income.updateMany(
            { user: req.user.id, category: oldCategory },
            { category: newCategory }
        );

        const allCategories = await Category.find({ user: req.user.id, type: 'income' });
        res.status(200).json({ success: true, message: 'Category renamed successfully', categories: allCategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to rename category' });
    }
};

exports.deleteIncomeCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const deleted = await Category.findOneAndDelete({ name: category, user: req.user.id, type: 'income' });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const allCategories = await Category.find({ user: req.user.id, type: 'income' });
        res.status(200).json({ success: true, message: 'Category deleted successfully', categories: allCategories });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
};

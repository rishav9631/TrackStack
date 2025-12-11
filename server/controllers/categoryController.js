const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Income = require('../models/Income');

const defaultCategoriesList = ['Rent', 'Electricity', 'Maid', 'Groceries', 'Food', 'Entertainment', 'Loan Repayment', 'Miscellaneous'];

exports.getCategories = async (req, res) => {
    try {
        const type = req.query.type || 'expense';
        const categories = await Category.find({ user: req.user.id, type });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

exports.addCategory = async (req, res) => {
    try {
        const { category, type = 'expense' } = req.body;
        if (!category) return res.status(400).json({ success: false, message: 'Category name is required' });

        // Check if exists for user and type
        const existing = await Category.findOne({ name: category, user: req.user.id, type });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        const newCategory = await Category.create({
            name: category,
            user: req.user.id,
            isDefault: false,
            type
        });

        const allCategories = await Category.find({ user: req.user.id, type });

        res.status(201).json({ success: true, message: 'Category added successfully', categories: allCategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to add category' });
    }
};

exports.renameCategory = async (req, res) => {
    try {
        const { oldCategory, newCategory, type = 'expense' } = req.body;
        if (!oldCategory || !newCategory) {
            return res.status(400).json({ success: false, message: 'Both old and new category names are required' });
        }

        const category = await Category.findOne({ name: oldCategory, user: req.user.id, type });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Check if new name exists for the user and type
        const existing = await Category.findOne({ name: newCategory, user: req.user.id, type });
        if (existing) {
            return res.status(400).json({ success: false, message: 'New category name already exists' });
        }

        category.name = newCategory;
        await category.save();

        // Update expenses or incomes based on type
        if (type === 'expense') {
            await Expense.updateMany(
                { user: req.user.id, category: oldCategory },
                { category: newCategory }
            );
        } else if (type === 'income') {
            await Income.updateMany(
                { user: req.user.id, category: oldCategory },
                { category: newCategory }
            );
        }

        const allCategories = await Category.find({ user: req.user.id, type });

        res.status(200).json({ success: true, message: 'Category renamed successfully', categories: allCategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to rename category' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const type = req.query.type || 'expense';

        console.log(`Attempting to delete category: ${category} for user: ${req.user.id} type: ${type}`);

        if (!category) return res.status(400).json({ success: false, message: 'Category name is required' });

        const deleted = await Category.findOneAndDelete({ name: category, user: req.user.id, type });
        console.log(`Delete result:`, deleted);

        if (!deleted) {
            console.log('Category not found or user mismatch');
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const allCategories = await Category.find({ user: req.user.id, type });
        res.status(200).json({ success: true, message: 'Category deleted successfully', categories: allCategories });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
};

import React, { useState, useEffect } from 'react';
import { addExpense, updateExpense, deleteExpense, deleteAllExpenses as apiDeleteAllExpenses, getExpenseCategories, addExpenseCategory, renameExpenseCategory, deleteExpenseCategory } from '../services/api';
import toast from 'react-hot-toast';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const ExpenseTracker = ({ expenses, setExpenses }) => {
    const [expenseForm, setExpenseForm] = useState({
        description: '',
        amount: '',
        category: '', // Start empty or with first available
        date: new Date().toISOString().slice(0, 10),
    });
    const [editingExpense, setEditingExpense] = useState(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [showEditCategories, setShowEditCategories] = useState(false);
    const [editingCategoryName, setEditingCategoryName] = useState({ old: '', new: '' });
    const [categoryMode, setCategoryMode] = useState(null); // 'add' or 'edit'

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getExpenseCategories();
                const fetchedCategories = res.data.categories || [];
                setCategories(fetchedCategories);
                // Set default category for form if available and not set
                if (fetchedCategories.length > 0 && !expenseForm.category) {
                    setExpenseForm(prev => ({ ...prev, category: fetchedCategories[0].name }));
                }
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    const handleExpenseChange = (e) => setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });

    const handleCategoryChange = (e) => setExpenseForm({ ...expenseForm, category: e.target.value });

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const payload = {
            description: expenseForm.description,
            amount: parseFloat(expenseForm.amount),
            category: expenseForm.category,
            date: new Date(expenseForm.date).toISOString(),
        };
        const toastId = toast.loading('Adding expense...');
        try {
            setLoading(true);
            const res = await addExpense(payload);
            setExpenses((prev) => [...prev, res.data]);
            setExpenseForm({ description: '', amount: '', category: categories[0]?.name || '', date: new Date().toISOString().slice(0, 10) });
            toast.success('Expense added successfully', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to add expense', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        const payload = {
            description: expenseForm.description,
            amount: parseFloat(expenseForm.amount),
            category: expenseForm.category,
            date: new Date(expenseForm.date).toISOString(),
        };
        const toastId = toast.loading('Updating expense...');
        try {
            setLoading(true);
            const res = await updateExpense(editingExpense._id, payload);
            setExpenses((prev) => prev.map((exp) => (exp._id === res.data._id ? res.data : exp)));
            setEditingExpense(null);
            setExpenseForm({ description: '', amount: '', category: categories[0]?.name || '', date: new Date().toISOString().slice(0, 10) });
            toast.success('Expense updated successfully', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to update expense', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        const toastId = toast.loading('Deleting expense...');
        try {
            setLoading(true);
            await deleteExpense(id);
            setExpenses((prev) => prev.filter((exp) => exp._id !== id));
            toast.success('Expense deleted successfully', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete expense', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAllExpenses = async () => {
        if (window.confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) {
            const toastId = toast.loading('Deleting all expenses...');
            try {
                setLoading(true);
                await apiDeleteAllExpenses();
                setExpenses([]);
                toast.success('All expenses deleted successfully', { id: toastId });
            } catch (err) {
                console.error(err);
                toast.error('Failed to delete all expenses', { id: toastId });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddCustomCategory = async () => {
        if (!newCategory.trim()) return;
        const toastId = toast.loading('Adding category...');
        try {
            const res = await addExpenseCategory(newCategory);
            setCategories(res.data.categories);
            setNewCategory('');
            toast.success('Category added successfully', { id: toastId });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add category', { id: toastId });
        }
    };

    const handleRenameCategory = async () => {
        if (!editingCategoryName.new.trim() || editingCategoryName.new === editingCategoryName.old) {
            setEditingCategoryName({ old: '', new: '' });
            return;
        }
        const toastId = toast.loading('Renaming category...');
        try {
            const res = await renameExpenseCategory(editingCategoryName.old, editingCategoryName.new);
            setCategories(res.data.categories);

            // Update local expenses to reflect the name change immediately
            setExpenses(prev => prev.map(exp =>
                exp.category === editingCategoryName.old ? { ...exp, category: editingCategoryName.new } : exp
            ));

            if (expenseForm.category === editingCategoryName.old) {
                setExpenseForm({ ...expenseForm, category: editingCategoryName.new });
            }

            setEditingCategoryName({ old: '', new: '' });
            toast.success('Category renamed successfully', { id: toastId });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to rename category', { id: toastId });
        }
    };

    const handleDeleteCategory = async (categoryName) => {
        // if (!window.confirm(`Are you sure you want to delete category "${categoryName}"?`)) return;
        const toastId = toast.loading('Deleting category...');
        try {
            const res = await deleteExpenseCategory(categoryName);
            setCategories(res.data.categories);
            // If the deleted category was selected in the form, reset it
            if (expenseForm.category === categoryName) {
                setExpenseForm(prev => ({ ...prev, category: res.data.categories[0]?.name || '' }));
            }
            toast.success('Category deleted successfully', { id: toastId });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete category', { id: toastId });
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg relative">
                <button
                    onClick={() => {
                        setShowEditCategories(!showEditCategories);
                        setCategoryMode(null);
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                    title="Edit Categories"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                </button>

                <h2 className="text-lg font-semibold mb-4 text-white">{editingExpense ? 'Update Expense' : 'Add New Expense'}</h2>

                {showEditCategories && (
                    <div className="mb-6 bg-gray-900 p-4 rounded-xl border border-gray-700 relative">
                        <button
                            onClick={() => { setShowEditCategories(false); setCategoryMode(null); }}
                            className="absolute top-2 right-2 text-gray-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h3 className="text-white font-medium mb-3">Manage Categories</h3>

                        {!categoryMode && (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCategoryMode('add')}
                                    className="flex-1 bg-emerald-600 text-white p-3 rounded-lg hover:bg-emerald-700 transition-colors flex flex-col items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Add New Category
                                </button>
                                <button
                                    onClick={() => setCategoryMode('edit')}
                                    className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                    Edit / Delete
                                </button>
                            </div>
                        )}

                        {categoryMode === 'add' && (
                            <div>
                                <button onClick={() => setCategoryMode(null)} className="text-gray-400 hover:text-white mb-2 text-sm flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                    Back
                                </button>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="New Category Name"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="flex-1 p-2 rounded bg-gray-800 text-white text-sm border border-emerald-500"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomCategory}
                                        className="bg-emerald-500 text-white px-3 py-1 rounded hover:bg-emerald-600 text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}

                        {categoryMode === 'edit' && (
                            <div>
                                <button onClick={() => setCategoryMode(null)} className="text-gray-400 hover:text-white mb-2 text-sm flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                    Back
                                </button>
                                {categories.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No categories added yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {categories.map(cat => (
                                            <div key={cat._id} className="flex items-center gap-2">
                                                {editingCategoryName.old === cat.name ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={editingCategoryName.new}
                                                            onChange={(e) => setEditingCategoryName({ ...editingCategoryName, new: e.target.value })}
                                                            className="flex-1 p-2 rounded bg-gray-800 text-white text-sm border border-emerald-500"
                                                            autoFocus
                                                        />
                                                        <button onClick={handleRenameCategory} className="text-emerald-500 hover:text-emerald-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => setEditingCategoryName({ old: '', new: '' })} className="text-red-500 hover:text-red-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="flex-1 text-gray-300 text-sm">{cat.name}</span>
                                                        <button onClick={() => setEditingCategoryName({ old: cat.name, new: cat.name })} className="text-blue-400 hover:text-blue-300" title="Rename">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => handleDeleteCategory(cat.name)} className="text-red-400 hover:text-red-300" title="Delete">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense} className="space-y-4">
                    {expenseForm.category === 'Miscellaneous' && (
                        <input
                            type="text"
                            name="description"
                            placeholder="Description (Optional)"
                            value={expenseForm.description}
                            onChange={handleExpenseChange}
                            className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
                        />
                    )}
                    <input
                        type="number"
                        name="amount"
                        placeholder="Amount"
                        value={expenseForm.amount}
                        onChange={handleExpenseChange}
                        className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
                        required
                        min="0.01"
                        step="0.01"
                    />

                    <select
                        name="category"
                        value={expenseForm.category}
                        onChange={handleCategoryChange}
                        className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        name="date"
                        value={expenseForm.date}
                        onChange={handleExpenseChange}
                        className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                    <div className="flex gap-4 mt-4">
                        <button type="submit" className="flex-1 bg-emerald-500 text-white py-3 px-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors" disabled={loading}>
                            {loading ? 'Processing...' : (editingExpense ? 'Update Expense' : 'Add Expense')}
                        </button>
                        {editingExpense && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingExpense(null);
                                    setExpenseForm({ description: '', amount: '', category: 'Groceries', date: new Date().toISOString().slice(0, 10) });
                                }}
                                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
            {/*EXPENSES HISTORY */}
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-white flex justify-between items-center">
                    Expense History
                    <button
                        onClick={handleDeleteAllExpenses}
                        className="bg-red-600 text-white py-1.5 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        disabled={expenses.length === 0}
                        title="Delete all expenses"
                    >
                        Delete All Expenses
                    </button>
                </h2>
                <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                    {expenses
                        .slice()
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((expense) => (
                            <div key={expense._id} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{expense.description}</p>
                                    <p className="text-xs text-gray-400">
                                        {expense.category} - {new Date(expense.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-red-400 font-semibold">{formatCurrency(expense.amount)}</span>
                                    <button
                                        onClick={() => {
                                            setEditingExpense(expense);
                                            setExpenseForm({
                                                description: expense.description,
                                                amount: expense.amount,
                                                category: expense.category,
                                                date: new Date(expense.date).toISOString().slice(0, 10),
                                            });
                                        }}
                                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteExpense(expense._id)}
                                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default ExpenseTracker;

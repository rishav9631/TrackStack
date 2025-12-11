import React, { useState, useEffect } from 'react';
import { setBudget, updateBudget, deleteBudget, getBudgetCategories, addBudgetCategory, renameBudgetCategory, deleteBudgetCategory } from '../services/api';
import toast from 'react-hot-toast';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const Budgeting = ({ budgets, setBudgets }) => {
    const [budgetForm, setBudgetForm] = useState({ category: '', limit: '' });
    const [editingBudget, setEditingBudget] = useState(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [showEditCategories, setShowEditCategories] = useState(false);
    const [editingCategoryName, setEditingCategoryName] = useState({ old: '', new: '' });
    const [categoryMode, setCategoryMode] = useState(null); // 'add' or 'edit'

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getBudgetCategories();
                const fetchedCategories = res.data.categories || [];
                setCategories(fetchedCategories);
                if (fetchedCategories.length > 0 && !budgetForm.category) {
                    setBudgetForm(prev => ({ ...prev, category: fetchedCategories[0].name }));
                }
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (categories.length > 0 && !budgetForm.category) {
            setBudgetForm(prev => ({ ...prev, category: categories[0].name }));
        }
    }, [categories]);

    const handleBudgetChange = (e) => setBudgetForm({ ...budgetForm, [e.target.name]: e.target.value });

    const handleSetBudget = async (e) => {
        e.preventDefault();
        if (!budgetForm.category) {
            toast.error("Please select or add a category first.");
            return;
        }
        const payload = { category: budgetForm.category, limit: parseFloat(budgetForm.limit) };
        const toastId = toast.loading('Setting budget...');
        try {
            setLoading(true);
            const res = await setBudget(payload);
            setBudgets((prev) => ({ ...prev, [res.data.category]: res.data }));
            setBudgetForm({ category: categories[0]?.name || '', limit: '' });
            toast.success('Budget set successfully', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to set budget', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        const payload = { category: budgetForm.category, limit: parseFloat(budgetForm.limit) };
        const toastId = toast.loading('Updating budget...');
        try {
            setLoading(true);
            const res = await updateBudget(editingBudget._id, payload);
            setBudgets((prev) => ({ ...prev, [res.data.category]: res.data }));
            setEditingBudget(null);
            setBudgetForm({ category: categories[0]?.name || '', limit: '' });
            toast.success('Budget updated successfully', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to update budget', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBudget = async (id) => {
        const toastId = toast.loading('Deleting budget...');
        try {
            setLoading(true);
            await deleteBudget(id);
            setBudgets((prev) => {
                const categoryToDelete = Object.keys(prev).find(key => prev[key]._id === id);
                if (categoryToDelete) {
                    const newBudgets = { ...prev };
                    delete newBudgets[categoryToDelete];
                    return newBudgets;
                }
                return prev;
            });
            toast.success('Budget deleted successfully', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete budget', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomCategory = async () => {
        if (!newCategory.trim()) return;
        const toastId = toast.loading('Adding category...');
        try {
            const res = await addBudgetCategory(newCategory);
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
            const res = await renameBudgetCategory(editingCategoryName.old, editingCategoryName.new);
            setCategories(res.data.categories);

            // Update local budgets if category name changed
            setBudgets(prev => {
                const newBudgets = { ...prev };
                if (newBudgets[editingCategoryName.old]) {
                    newBudgets[editingCategoryName.new] = { ...newBudgets[editingCategoryName.old], category: editingCategoryName.new };
                    delete newBudgets[editingCategoryName.old];
                }
                return newBudgets;
            });

            if (budgetForm.category === editingCategoryName.old) {
                setBudgetForm({ ...budgetForm, category: editingCategoryName.new });
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
            const res = await deleteBudgetCategory(categoryName);
            setCategories(res.data.categories);

            // Remove budget for deleted category
            setBudgets(prev => {
                const newBudgets = { ...prev };
                delete newBudgets[categoryName];
                return newBudgets;
            });

            if (budgetForm.category === categoryName) {
                setBudgetForm(prev => ({ ...prev, category: res.data.categories[0]?.name || '' }));
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

                <h2 className="text-lg font-semibold mb-4 text-white">{editingBudget ? 'Update Budget' : 'Set Monthly Budget'}</h2>

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
                        <h3 className="text-white font-medium mb-3">Manage Budget Categories</h3>

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

                <form onSubmit={editingBudget ? handleUpdateBudget : handleSetBudget} className="space-y-4">
                    <select
                        name="category"
                        value={budgetForm.category}
                        onChange={handleBudgetChange}
                        className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
                        required
                    >
                        {categories.length === 0 && <option value="" disabled>No categories available</option>}
                        {categories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        name="limit"
                        placeholder="Budget Limit"
                        value={budgetForm.limit}
                        onChange={handleBudgetChange}
                        className="w-full p-3 rounded-lg bg-gray-900 text-white border-none focus:ring-2 focus:ring-emerald-500"
                        required
                        min="0.01"
                        step="0.01"
                    />
                    <div className="flex gap-4 mt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-purple-700 transition-colors"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (editingBudget ? 'Update Budget' : 'Set Budget')}
                        </button>
                        {editingBudget && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingBudget(null);
                                    setBudgetForm({ category: categories[0]?.name || '', limit: '' });
                                }}
                                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-white">Your Budgets</h2>
                <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                    {Object.keys(budgets).length > 0 ? (
                        Object.keys(budgets).map((category) => (
                            <div key={budgets[category]._id} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{category}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-purple-400 font-semibold">{formatCurrency(budgets[category].limit)}</span>
                                    <button
                                        onClick={() => {
                                            setEditingBudget(budgets[category]);
                                            setBudgetForm({ category: budgets[category].category, limit: budgets[category].limit });
                                        }}
                                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBudget(budgets[category]._id)}
                                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400">No budgets set. Use the form above to set one.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Budgeting;

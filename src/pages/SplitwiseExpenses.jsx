import React, { useState, useEffect } from 'react';
import { getExpenses, getAuthUrl, getCurrentUser, saveCredentials, getGroup, getGroups } from '../services/splitwiseService';
import { ArrowLeft, RefreshCw, ExternalLink, Key, DollarSign, TrendingUp, Calendar, Users, ChevronRight, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SplitwiseExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [hasCredentials, setHasCredentials] = useState(false);
    const [user, setUser] = useState(null);
    const [credentials, setCredentials] = useState({ consumerKey: '', consumerSecret: '' });

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        setLoading(true);
        try {
            const userData = await getCurrentUser();
            setHasCredentials(userData.hasCredentials);
            if (userData.isConnected) {
                setUser(userData.user);
                setIsConnected(true);
                fetchGroups();
            } else {
                setIsConnected(false);
                setLoading(false);
            }
        } catch (error) {
            console.log('Not connected to Splitwise or session expired');
            setIsConnected(false);
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await getGroups();
            setGroups(data.groups || []);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch groups');
            setLoading(false);
        }
    };

    const fetchGroupData = async (groupId) => {
        setLoading(true);
        try {
            const [expensesData, groupData] = await Promise.all([
                getExpenses(groupId),
                getGroup(groupId)
            ]);

            setExpenses(expensesData.expenses);
            setSelectedGroup(groupData.group);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch group data');
        } finally {
            setLoading(false);
        }
    };

    const handleGroupSelect = (group) => {
        fetchGroupData(group.id);
    };

    const handleBackToGroups = () => {
        setSelectedGroup(null);
        setExpenses([]);
        fetchGroups();
    };

    const handleConnect = async () => {
        try {
            const url = await getAuthUrl();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            if (error.response && error.response.data.missingCredentials) {
                setHasCredentials(false);
                toast.error('Please provide your API credentials first.');
            } else {
                toast.error('Failed to initiate connection');
            }
        }
    };

    const handleSaveCredentials = async (e) => {
        e.preventDefault();
        try {
            await saveCredentials(credentials);
            setHasCredentials(true);
            toast.success('Credentials saved! You can now connect.');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save credentials');
        }
    };

    // Calculate Summary Stats
    const calculateStats = () => {
        if (!user || !expenses.length) return { groupTotalSpent: 0, monthlyShare: 0, netBalance: 0 };

        let groupTotalSpent = 0;
        let monthlyShare = 0;
        let netBalance = 0;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate shares from expenses
        expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const isCurrentMonth = expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;

            if (isCurrentMonth) {
                groupTotalSpent += parseFloat(expense.cost);
            }

            const userExpense = expense.users.find(u => u.user_id === user.id);
            if (userExpense) {
                const owed = parseFloat(userExpense.owed_share);

                if (isCurrentMonth) {
                    monthlyShare += owed;
                }
            }
        });

        // Get accurate Net Balance from group data if available
        if (selectedGroup && selectedGroup.members) {
            const groupMember = selectedGroup.members.find(m => m.id === user.id);
            if (groupMember && groupMember.balance && groupMember.balance.length > 0) {
                const balanceObj = groupMember.balance.find(b => b.currency_code === user.default_currency) || groupMember.balance[0];
                if (balanceObj) {
                    netBalance = parseFloat(balanceObj.amount);
                }
            }
        }

        return {
            groupTotalSpent,
            monthlyShare,
            netBalance
        };
    };

    const stats = calculateStats();

    const formatCurrency = (amount, currencyCode) => {
        const code = currencyCode || user?.default_currency || 'INR';
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: code === 'USD' ? 'INR' : code,
                currencyDisplay: 'symbol'
            }).format(amount);
        } catch (e) {
            return `₹${amount.toFixed(2)}`;
        }
    };

    if (loading && !isConnected && hasCredentials) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center text-gray-400 hover:text-white transition-colors group">
                            <div className="p-2 bg-gray-800 rounded-full mr-3 group-hover:bg-gray-700 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Dashboard</span>
                        </Link>
                        {selectedGroup && (
                            <>
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                                <button onClick={handleBackToGroups} className="text-gray-400 hover:text-white transition-colors">
                                    Groups
                                </button>
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                                <span className="text-white font-medium">{selectedGroup.name}</span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {isConnected && selectedGroup && (
                            <button
                                onClick={() => fetchGroupData(selectedGroup.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all text-sm font-medium text-gray-300 hover:text-white border border-gray-700"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Sync
                            </button>
                        )}
                        {user && (
                            <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50">
                                {user.picture?.medium ? (
                                    <img src={user.picture.medium} alt="Profile" className="w-8 h-8 rounded-full border border-gray-600" />
                                ) : (
                                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {user.first_name?.[0]}
                                    </div>
                                )}
                                <span className="text-sm font-medium text-gray-300 hidden sm:block">{user.first_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                        {selectedGroup ? `${selectedGroup.name} Expenses` : 'Splitwise Groups'}
                    </h1>
                    <p className="text-gray-400">
                        {selectedGroup ? `Manage and track expenses for ${selectedGroup.name}` : 'Select a group to view expenses and stats.'}
                    </p>
                </div>

                {!hasCredentials ? (
                    <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl">
                        {/* ... Credentials Form (Same as before) ... */}
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                                <Key className="w-10 h-10 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">API Configuration</h2>
                            <p className="text-gray-400 leading-relaxed">
                                To connect Splitwise, you need to provide your own API credentials.
                                <br />
                                You can get these by registering an app at <a href="https://secure.splitwise.com/apps/new" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">Splitwise Developers</a>.
                            </p>
                        </div>
                        <form onSubmit={handleSaveCredentials} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300 ml-1">Consumer Key</label>
                                <input
                                    type="text"
                                    value={credentials.consumerKey}
                                    onChange={(e) => setCredentials({ ...credentials, consumerKey: e.target.value })}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-gray-600"
                                    placeholder="Enter your consumer key"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300 ml-1">Consumer Secret</label>
                                <input
                                    type="password"
                                    value={credentials.consumerSecret}
                                    onChange={(e) => setCredentials({ ...credentials, consumerSecret: e.target.value })}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-gray-600"
                                    placeholder="Enter your consumer secret"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
                            >
                                Save Credentials
                            </button>
                        </form>
                    </div>
                ) : !isConnected ? (
                    <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-3xl p-16 text-center shadow-2xl">
                        {/* ... Connect Button (Same as before) ... */}
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-6 transition-transform hover:rotate-12 duration-500">
                            <ExternalLink className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Connect to Splitwise</h2>
                        <p className="text-gray-400 mb-10 max-w-lg mx-auto text-lg">
                            Sync your expenses from Splitwise to track them alongside your personal finances.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={handleConnect}
                                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-emerald-900/20 transform hover:-translate-y-1"
                            >
                                Connect Account
                            </button>
                            <button
                                onClick={() => setHasCredentials(false)}
                                className="w-full sm:w-auto py-4 px-10 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                            >
                                Update Credentials
                            </button>
                        </div>
                    </div>
                ) : !selectedGroup ? (
                    // Group List View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                onClick={() => handleGroupSelect(group)}
                                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:bg-gray-700/50 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <LayoutGrid className="w-24 h-24 text-blue-500" />
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                                        {group.avatar?.medium ? (
                                            <img src={group.avatar.medium} alt={group.name} className="w-12 h-12 rounded-xl object-cover" />
                                        ) : (
                                            '👥'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{group.name}</h3>
                                        <p className="text-sm text-gray-400">{group.members.length} members</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                                    <span className="text-sm text-gray-400">Updated {new Date(group.updated_at).toLocaleDateString()}</span>
                                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Selected Group View (Stats + Expenses)
                    <div className="space-y-8 animate-fade-in">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TrendingUp className="w-24 h-24 text-emerald-500" />
                                </div>
                                <p className="text-gray-400 font-medium mb-1">Group Total Spent</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {formatCurrency(stats.groupTotalSpent, user?.default_currency)}
                                </h3>
                                <div className="mt-4 flex items-center text-emerald-400 text-sm">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    <span>Total group spending this month</span>
                                </div>
                            </div>

                            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Calendar className="w-24 h-24 text-purple-500" />
                                </div>
                                <p className="text-gray-400 font-medium mb-1">Group Monthly Share</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {formatCurrency(stats.monthlyShare, user?.default_currency)}
                                </h3>
                                <div className="mt-4 flex items-center text-purple-400 text-sm">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>{new Date().toLocaleString('default', { month: 'long' })} spending</span>
                                </div>
                            </div>

                            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign className="w-24 h-24 text-blue-500" />
                                </div>
                                <p className="text-gray-400 font-medium mb-1">Net Balance</p>
                                <h3 className={`text-3xl font-bold ${stats.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {stats.netBalance >= 0 ? '+' : ''}{formatCurrency(stats.netBalance, user?.default_currency)}
                                </h3>
                                <div className="mt-4 flex items-center text-blue-400 text-sm">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    <span>{stats.netBalance >= 0 ? 'You are owed' : 'You owe'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expenses List */}
                        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-3xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    Recent Activity
                                </h3>
                                <span className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                                    {expenses.length} transactions
                                </span>
                            </div>

                            {expenses.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <DollarSign className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <p className="text-gray-400 text-lg">No expenses found.</p>
                                    <p className="text-gray-500 text-sm mt-2">Add expenses in Splitwise to see them here.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700/50">
                                    {expenses.map((expense) => {
                                        const userExpense = expense.users.find(u => u.user_id === user?.id);
                                        const paidShare = parseFloat(userExpense?.paid_share || 0);
                                        const owedShare = parseFloat(userExpense?.owed_share || 0);
                                        const net = paidShare - owedShare;
                                        const isPayer = paidShare > 0;

                                        return (
                                            <div key={expense.id} className="p-6 hover:bg-gray-700/30 transition-colors group">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-gray-700">
                                                            {expense.category?.icon ? (
                                                                <img src={expense.category.icon} alt={expense.category.name} className="w-6 h-6 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                            ) : (
                                                                '💰'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">{expense.description}</h4>
                                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                                                                <span>{new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3" />
                                                                    {expense.group_id ? 'Group Expense' : 'Personal'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="text-sm text-gray-400">
                                                                {isPayer ? 'You paid' : 'Someone paid'}
                                                            </div>
                                                            <div className="font-bold text-white text-lg">
                                                                {formatCurrency(parseFloat(expense.cost), expense.currency_code)}
                                                            </div>
                                                            <div className={`text-xs font-medium px-2 py-1 rounded-full ${net > 0
                                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                                : net < 0
                                                                    ? 'bg-red-500/10 text-red-400'
                                                                    : 'bg-gray-500/10 text-gray-400'
                                                                }`}>
                                                                {net > 0
                                                                    ? `You lent ${formatCurrency(net, expense.currency_code)}`
                                                                    : net < 0
                                                                        ? `You borrowed ${formatCurrency(Math.abs(net), expense.currency_code)}`
                                                                        : 'Settled'
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SplitwiseExpenses;

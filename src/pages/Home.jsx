import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Dashboard from '../components/Dashboard';
import ExpenseTracker from '../components/ExpenseTracker';
import IncomeTracker from '../components/IncomeTracker';
import Budgeting from '../components/Budgeting';
import AdminDashboard from '../components/AdminDashboard';
import { getExpenses, getIncomes, getBudgets, getMe } from '../services/api';
import { Link } from 'react-router-dom';
import { TrendingUp, Divide, LogOut, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

const Home = ({ setAuth, initialTab = 'dashboard' }) => {
    const [expenses, setExpenses] = useState([]);
    const [income, setIncome] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // Date filters for dashboard
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));

    // Load all data on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Trigger user verification
                await getMe();

                const [expRes, incRes, budRes] = await Promise.all([
                    getExpenses(),
                    getIncomes(),
                    getBudgets(),
                ]);
                setExpenses(expRes.data);
                setIncome(incRes.data);
                setBudgets(budRes.data);
            } catch (err) {
                console.error(err);
                if (err.response && err.response.status === 401) {
                    setAuth(false);
                    localStorage.removeItem('token');
                    toast.error('Session expired. Please login again.');
                } else {
                    toast.error('Failed to load data.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [setAuth]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setAuth(false);
        toast.success('Logged out successfully');
    };

    // Calculations for dashboard & pie chart data
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalExpenses;

    const filteredExpenses = expenses.filter((item) => {
        const itemDate = new Date(item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
    });

    const getCategoryBreakdown = (data) => {
        const breakdown = data.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        return { breakdown, total };
    };

    const { breakdown: categoryBreakdown, total: totalFilteredExpenses } = getCategoryBreakdown(filteredExpenses);

    const getPieChartData = () => {
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50'];
        let cumulativePercentage = 0;
        return Object.keys(categoryBreakdown).map((category, index) => {
            const amount = categoryBreakdown[category];
            const percentage = totalFilteredExpenses > 0 ? (amount / totalFilteredExpenses) * 100 : 0;
            const color = colors[index % colors.length];
            const offset = 100 - cumulativePercentage;
            cumulativePercentage += percentage;
            return { category, amount, percentage, color, offset };
        });
    };

    const pieChartData = getPieChartData();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white bg-gray-950">
                <div className="text-xl font-medium animate-pulse flex items-center gap-3">
                    <Wallet className="w-8 h-8 text-emerald-400 animate-bounce" />
                    <span>Loading Money Manager...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen text-gray-200 bg-gray-950 flex flex-col">
            {/* Top Bar Header */}
            <header className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/90 px-6 py-4 flex items-center justify-between z-20">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                        <Wallet className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">StackTrack</h1>
                        <p className="text-xs text-gray-400">Personal Financial Management Suite</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="text-xs sm:text-sm bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 py-2 px-4 rounded-xl transition-all flex items-center gap-2 font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </header>

            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content Full-width Container */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-8 space-y-6">
                {activeTab === 'dashboard' && (
                    <Dashboard
                        totalIncome={totalIncome}
                        totalExpenses={totalExpenses}
                        balance={balance}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        pieChartData={pieChartData}
                        totalFilteredExpenses={totalFilteredExpenses}
                        budgets={budgets}
                        categoryBreakdown={categoryBreakdown}
                    />
                )}

                {activeTab === 'expenses' && (
                    <ExpenseTracker expenses={expenses} setExpenses={setExpenses} />
                )}

                {activeTab === 'income' && (
                    <IncomeTracker income={income} setIncome={setIncome} />
                )}

                {activeTab === 'budget' && (
                    <Budgeting budgets={budgets} setBudgets={setBudgets} />
                )}

                {activeTab === 'addons' && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in max-w-5xl mx-auto">
                        <Link to="/investments" className="group bg-gray-900/80 border border-gray-800 rounded-3xl p-8 hover:bg-gray-900 transition-all hover:scale-[1.02] shadow-2xl backdrop-blur-xl">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                                    <TrendingUp className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Investments</h3>
                                <p className="text-gray-400">Track real-time prices of Gold, Silver, Stocks, and Mutual Funds.</p>
                            </div>
                        </Link>

                        <Link to="/splitwise-expenses" className="group bg-gray-900/80 border border-gray-800 rounded-3xl p-8 hover:bg-gray-900 transition-all hover:scale-[1.02] shadow-2xl backdrop-blur-xl">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                                    <Divide className="w-12 h-12 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Splitwise</h3>
                                <p className="text-gray-400">Sync your shared expenses directly from Splitwise.</p>
                            </div>
                        </Link>
                    </div>
                )}

                {activeTab === 'admin' && (
                    <AdminDashboard />
                )}
            </main>
        </div>
    );
};

export default Home;

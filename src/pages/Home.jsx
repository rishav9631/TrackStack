import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Dashboard from '../components/Dashboard';
import ExpenseTracker from '../components/ExpenseTracker';
import IncomeTracker from '../components/IncomeTracker';
import Budgeting from '../components/Budgeting';
import { getExpenses, getIncomes, getBudgets, getMe } from '../services/api';
import { Link } from 'react-router-dom';
import { TrendingUp, Divide } from 'lucide-react';
import toast from 'react-hot-toast';

const Home = ({ setAuth }) => {
    const [expenses, setExpenses] = useState([]);
    const [income, setIncome] = useState([]);
    const [budgets, setBudgets] = useState({});
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);

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
                // Trigger user verification and seeding
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

    // Loader while loading
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white">
                <div className="text-xl font-medium animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-gray-200 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
                <header className="p-6 text-center relative">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Money Manager</h1>
                    <p className="text-gray-400 mt-2">Your Personal Financial Dashboard</p>
                    <button
                        onClick={handleLogout}
                        className="absolute top-6 right-6 text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors shadow-lg shadow-red-900/20"
                    >
                        Logout
                    </button>
                </header>

                <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

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
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        <Link to="/investments" className="group bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 transition-all hover:scale-[1.02] shadow-xl">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                                    <TrendingUp className="w-12 h-12 text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Investments</h3>
                                <p className="text-gray-400">Track real-time prices of Gold, Silver, Stocks, and Mutual Funds.</p>
                            </div>
                        </Link>

                        <Link to="/splitwise-expenses" className="group bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:bg-gray-800 transition-all hover:scale-[1.02] shadow-xl">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                                    <Divide className="w-12 h-12 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Splitwise</h3>
                                <p className="text-gray-400">Sync your expenses from Splitwise.</p>
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;

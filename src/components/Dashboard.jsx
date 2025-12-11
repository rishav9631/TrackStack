import React from 'react';
import AiGeneratedSummary from './AiGeneratedSummary';
import ExpenseReportSection from '../ExpenseReportSection';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const Dashboard = ({
    totalIncome,
    totalExpenses,
    balance,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pieChartData,
    totalFilteredExpenses,
    budgets,
    categoryBreakdown
}) => {
    return (
        <div className="p-6 space-y-8 ">

            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-around text-center gap-4">
                <div>
                    <h3 className="text-gray-400 text-sm font-semibold">Total Income</h3>
                    <p className="text-green-400 text-3xl font-bold mt-1">{formatCurrency(totalIncome)}</p>
                </div>
                <div>
                    <h3 className="text-gray-400 text-sm font-semibold">Total Expenses</h3>
                    <p className="text-red-400 text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
                </div>
                <div>
                    <h3 className="text-gray-400 text-sm font-semibold">Net Balance</h3>
                    <p className={`text-3xl font-bold mt-1 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(balance)}</p>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-white">Filter Expenses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-gray-400 text-sm font-medium mb-1">Start Date</label>
                        <input
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 rounded-lg  bg-gray-900 text-white font-bold  border-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-gray-400 text-sm font-medium mb-1">End Date</label>
                        <input
                            type="date"
                            id="end-date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-900 text-white font-bold border-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Spending Breakdown*/}
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1 w-full lg:w-auto">
                    <h2 className="text-lg font-semibold mb-4 text-white text-center">Spending Breakdown</h2>
                    {totalFilteredExpenses > 0 ? (
                        <div className="relative w-48 h-48 mx-auto">
                            <svg viewBox="0 0 36 36" className="w-full h-full">
                                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#2d3748" strokeWidth="3.8"></circle>
                                {pieChartData.map((data, index) => (
                                    <circle
                                        key={index}
                                        cx="18"
                                        cy="18"
                                        r="15.9155"
                                        fill="none"
                                        stroke={data.color}
                                        strokeWidth="3.8"
                                        strokeDasharray={`${data.percentage} ${100 - data.percentage}`}
                                        strokeDashoffset={data.offset}
                                        transform="rotate(-90 18 18)"
                                    />
                                ))}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-sm text-gray-400">Total</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-400">No expenses in this range.</p>
                    )}
                </div>
                <div className="flex-1 w-full lg:w-auto">
                    <h3 className="text-md font-medium text-white mb-2">Category Totals</h3>
                    <ul className="space-y-2">
                        {pieChartData.map((data, index) => (
                            <li key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
                                    <span className="text-gray-300 font-medium">{data.category}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-300">{formatCurrency(data.amount)} ({data.percentage.toFixed(1)}%)</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-white">Budget Overview</h2>
                {Object.keys(budgets).length > 0 ? (
                    Object.keys(budgets).map((category) => {
                        const budgetLimit = budgets[category].limit;
                        const spent = categoryBreakdown[category] || 0;
                        const progress = (spent / budgetLimit) * 100;
                        const progressColor = progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500';
                        return (
                            <div key={category} className="mb-4">
                                <div className="flex justify-between items-center text-sm font-medium text-gray-300 mb-1">
                                    <span>{category}</span>
                                    <span>{formatCurrency(spent)} / {formatCurrency(budgetLimit)}</span>
                                </div>
                                <div className="w-full bg-gray-900 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-center text-gray-400">No budgets set. Go to the Budget tab to set one.</p>
                )}
            </div>

            <div>
                {/* ...other dashboard cards/sections... */}

                {/* Insert the AI Generated Summary Section here */}
                <AiGeneratedSummary />

                {/* ...other dashboard cards/sections... */}
            </div>

            <div>
                {/* Expense Report Section */}
                <ExpenseReportSection />
            </div>


        </div>
    );
};

export default Dashboard;

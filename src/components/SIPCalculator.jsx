import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Info } from 'lucide-react';

const SIPCalculator = ({ onClose }) => {
    const [inputs, setInputs] = useState({
        monthly: 15000,
        rate: 12,
        time: 15,
        inflation: 6,
        stepUpType: 'percentage', // 'percentage' or 'amount'
        stepUpValue: 10
    });

    const [results, setResults] = useState({
        invested: 0,
        returns: 0,
        total: 0,
        adjusted: 0,
        yearlyData: []
    });

    const handleParamChange = (key, value) => {
        let val = value;
        if (key !== 'stepUpType') {
            val = parseFloat(value) || 0;
        }
        setInputs(prev => ({
            ...prev,
            [key]: val
        }));
    };

    const formatCurrency = (num) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(num);
    };

    useEffect(() => {
        const { monthly, rate: r, time: t, inflation, stepUpType, stepUpValue } = inputs;

        const i = r / 100 / 12;
        const inflationRate = inflation / 100;

        let currentBalance = 0;
        let totalInvested = 0;
        let currentMonthlyParams = monthly;
        const yearlyData = [];

        for (let year = 1; year <= t; year++) {
            // Apply Step Up from 2nd year onwards
            if (year > 1) {
                if (stepUpType === 'percentage') {
                    currentMonthlyParams += currentMonthlyParams * (stepUpValue / 100);
                } else {
                    currentMonthlyParams += stepUpValue;
                }
            }

            // Calculate for this year
            const months = 12;
            const yearlyInvestment = currentMonthlyParams * 12;
            totalInvested += yearlyInvestment;

            // FV of existing balance growing for 12 months
            const fvExisting = currentBalance * Math.pow(1 + i, months);

            // FV of new SIPs made during this year
            // Formula: P * [ (1+i)^n - 1 ] / i * (1+i)
            let fvNewSIPs;
            if (r === 0) {
                fvNewSIPs = yearlyInvestment;
            } else {
                fvNewSIPs = currentMonthlyParams * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
            }

            currentBalance = fvExisting + fvNewSIPs;

            // Inflation adjustment
            const realValue = currentBalance / Math.pow(1 + inflationRate, year);

            yearlyData.push({
                year,
                invested: totalInvested,
                balance: currentBalance,
                realValue: realValue,
                monthly: currentMonthlyParams
            });
        }

        setResults({
            invested: totalInvested,
            returns: currentBalance - totalInvested,
            total: currentBalance,
            adjusted: yearlyData[yearlyData.length - 1]?.realValue || 0,
            yearlyData
        });

    }, [inputs]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-5xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                            SIP Calculator
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Calculate returns with Step-Up & Inflation</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Inputs Column */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                <h3 className="text-lg font-bold text-white mb-5 pb-2 border-b border-gray-700">Configuration</h3>

                                {/* Monthly Investment */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-300">Monthly Investment</label>
                                        <div className="flex items-center">
                                            <span className="text-gray-500 mr-1">₹</span>
                                            <input
                                                type="number"
                                                value={inputs.monthly.toFixed(0)}
                                                onChange={(e) => handleParamChange('monthly', e.target.value)}
                                                className="w-24 text-right font-bold text-emerald-400 bg-transparent border-b border-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="500" max="100000" step="500"
                                        value={inputs.monthly}
                                        onChange={(e) => handleParamChange('monthly', e.target.value)}
                                        className="w-full accent-emerald-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Step Up */}
                                <div className="mb-6 bg-gray-900/40 p-3 rounded-lg border border-gray-700/50">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-sm font-medium text-gray-300">Yearly Step Up</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleParamChange('stepUpType', 'percentage')}
                                                className={`text-xs px-2 py-1 rounded ${inputs.stepUpType === 'percentage' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-gray-700 text-gray-400'}`}
                                            >
                                                %
                                            </button>
                                            <button
                                                onClick={() => handleParamChange('stepUpType', 'amount')}
                                                className={`text-xs px-2 py-1 rounded ${inputs.stepUpType === 'amount' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-gray-700 text-gray-400'}`}
                                            >
                                                ₹
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-gray-500">Increase by</span>
                                        <div className="flex items-center">
                                            {inputs.stepUpType === 'amount' && <span className="text-gray-500 mr-1">₹</span>}
                                            <input
                                                type="number"
                                                value={inputs.stepUpValue}
                                                onChange={(e) => handleParamChange('stepUpValue', e.target.value)}
                                                className="w-20 text-right font-bold text-emerald-400 bg-transparent border-b border-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                            />
                                            {inputs.stepUpType === 'percentage' && <span className="text-gray-500 ml-1">%</span>}
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={inputs.stepUpType === 'percentage' ? "50" : "10000"}
                                        step={inputs.stepUpType === 'percentage' ? "1" : "500"}
                                        value={inputs.stepUpValue}
                                        onChange={(e) => handleParamChange('stepUpValue', e.target.value)}
                                        className="w-full accent-emerald-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Return Rate */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-300">Expected Return</label>
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                value={inputs.rate}
                                                onChange={(e) => handleParamChange('rate', e.target.value)}
                                                className="w-16 text-right font-bold text-emerald-400 bg-transparent border-b border-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                            />
                                            <span className="text-gray-500 ml-1">%</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="30" step="0.5"
                                        value={inputs.rate}
                                        onChange={(e) => handleParamChange('rate', e.target.value)}
                                        className="w-full accent-emerald-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Time Period */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-300">Time Period</label>
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                value={inputs.time}
                                                onChange={(e) => handleParamChange('time', e.target.value)}
                                                className="w-16 text-right font-bold text-emerald-400 bg-transparent border-b border-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                            />
                                            <span className="text-gray-500 ml-1">Yr</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="40" step="1"
                                        value={inputs.time}
                                        onChange={(e) => handleParamChange('time', e.target.value)}
                                        className="w-full accent-emerald-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Inflation Rate */}
                                <div className="mb-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-300">Inflation Rate</label>
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                value={inputs.inflation}
                                                onChange={(e) => handleParamChange('inflation', e.target.value)}
                                                className="w-16 text-right font-bold text-purple-400 bg-transparent border-b border-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                            />
                                            <span className="text-gray-500 ml-1">%</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="15" step="0.5"
                                        value={inputs.inflation}
                                        onChange={(e) => handleParamChange('inflation', e.target.value)}
                                        className="w-full accent-purple-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex items-start gap-2 mt-3 text-xs text-gray-500 bg-gray-900/50 p-2 rounded">
                                        <Info className="w-4 h-4 text-purple-400 shrink-0" />
                                        <p>Adjusts the final value to show today's purchasing power.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Column */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total Invested</p>
                                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(results.invested)}</p>
                                </div>
                                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                                    <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Est. Returns</p>
                                    <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(results.returns)}</p>
                                </div>
                                <div className="bg-emerald-900/20 p-5 rounded-xl border border-emerald-500/30">
                                    <p className="text-xs uppercase tracking-wide text-emerald-400 font-semibold">Maturity Value</p>
                                    <p className="text-3xl font-bold text-emerald-300 mt-1">{formatCurrency(results.total)}</p>
                                </div>
                                <div className="bg-purple-900/20 p-5 rounded-xl border border-purple-500/30">
                                    <p className="text-xs uppercase tracking-wide text-purple-400 font-semibold">Inflation Adjusted</p>
                                    <p className="text-3xl font-bold text-purple-300 mt-1">{formatCurrency(results.adjusted)}</p>
                                    <p className="text-xs text-purple-400/70 mt-1">Real value in today's money</p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden flex flex-col h-[450px]">
                                <div className="p-4 bg-gray-800 border-b border-gray-700">
                                    <h3 className="font-bold text-gray-200">Yearly Breakdown</h3>
                                </div>
                                <div className="overflow-auto flex-grow custom-scrollbar">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">Year</th>
                                                <th className="px-4 py-3 text-emerald-400/80">Monthly SIP</th>
                                                <th className="px-4 py-3">Total Invested</th>
                                                <th className="px-4 py-3">Balance</th>
                                                <th className="px-4 py-3 text-purple-400">Real Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {results.yearlyData.map((row) => (
                                                <tr key={row.year} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-300">{row.year}</td>
                                                    <td className="px-4 py-3 text-emerald-400/80">{formatCurrency(row.monthly)}</td>
                                                    <td className="px-4 py-3 text-gray-500">{formatCurrency(row.invested)}</td>
                                                    <td className="px-4 py-3 font-semibold text-emerald-400">{formatCurrency(row.balance)}</td>
                                                    <td className="px-4 py-3 font-semibold text-purple-400">{formatCurrency(row.realValue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SIPCalculator;

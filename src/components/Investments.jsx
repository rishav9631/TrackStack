import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, TrendingUp, DollarSign, BarChart2, Layers, Plus, Edit2, X, Save, ArrowLeft, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { addInvestment, getInvestments } from '../services/api';
import SIPCalculator from './SIPCalculator';

const Investments = () => {
    const [metals, setMetals] = useState(null);
    const [currencies, setCurrencies] = useState({});
    const [mutualFunds, setMutualFunds] = useState([]);
    const [stock, setStock] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [activeMoverTab, setActiveMoverTab] = useState('largeCap');
    const [showCalculator, setShowCalculator] = useState(false);

    // Portfolio State
    const [holdings, setHoldings] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ quantity: '', invested: '' });

    // Mock Data for Indices and Movers
    const nifty50 = { price: 21456.70, change: 124.50, percent: 0.58 };

    const marketMovers = {
        largeCap: [
            { id: 'REL', name: 'Reliance Industries', price: 2560.40, change: 15.20, percent: 0.60 },
            { id: 'TCS', name: 'TCS', price: 3890.10, change: -20.50, percent: -0.52 },
            { id: 'HDFCBANK', name: 'HDFC Bank', price: 1650.75, change: 10.00, percent: 0.61 },
            { id: 'INFY', name: 'Infosys', price: 1540.30, change: 8.40, percent: 0.55 },
            { id: 'ICICIBANK', name: 'ICICI Bank', price: 1020.50, change: 12.10, percent: 1.20 }
        ],
        midCap: [
            { id: 'TATAPOWER', name: 'Tata Power', price: 340.20, change: 5.60, percent: 1.67 },
            { id: 'ZOMATO', name: 'Zomato', price: 145.50, change: 2.30, percent: 1.61 },
            { id: 'DLF', name: 'DLF', price: 780.40, change: -5.40, percent: -0.69 },
            { id: 'HAL', name: 'HAL', price: 2980.10, change: 45.20, percent: 1.54 },
            { id: 'VBL', name: 'Varun Beverages', price: 1250.60, change: 18.30, percent: 1.48 }
        ],
        smallCap: [
            { id: 'SUZLON', name: 'Suzlon Energy', price: 45.20, change: 1.10, percent: 2.49 },
            { id: 'IDEA', name: 'Vodafone Idea', price: 14.50, change: 0.20, percent: 1.40 },
            { id: 'JPPOWER', name: 'Jaiprakash Power', price: 18.30, change: 0.90, percent: 5.17 },
            { id: 'RENUKA', name: 'Shree Renuka Sugars', price: 48.70, change: -0.50, percent: -1.02 },
            { id: 'TRIDENT', name: 'Trident', price: 42.10, change: 0.60, percent: 1.45 }
        ]
    };

    const fetchUserInvestments = async () => {
        try {
            const res = await getInvestments();
            if (res.success) {
                const holdingsMap = {};
                res.data.forEach(inv => {
                    holdingsMap[inv.symbol] = {
                        quantity: inv.quantity,
                        invested: inv.investedAmount,
                        name: inv.name
                    };
                });
                setHoldings(holdingsMap);
            }
        } catch (error) {
            console.error('Error fetching investments:', error);
            toast.error('Failed to load portfolio');
        }
    };

    useEffect(() => {
        fetchUserInvestments();
    }, []);

    const handleEditClick = (id, currentHolding) => {
        setEditingId(id);
        setEditForm({
            quantity: currentHolding?.quantity || '',
            invested: currentHolding?.invested || ''
        });
    };

    const handleSaveHolding = async () => {
        if (!editingId) return;

        const quantity = parseFloat(editForm.quantity) || 0;
        const investedAmount = parseFloat(editForm.invested) || 0;

        // Determine category and name based on ID prefix or existing data
        let category = 'stock';
        let name = 'Unknown';

        if (editingId.startsWith('metal_')) {
            category = 'metal';
            name = editingId.replace('metal_', ''); // Or map to proper name
        } else if (editingId.startsWith('mf_')) {
            category = 'mutual_fund';
            // Find name from mutualFunds state if possible, or pass it in handleEditClick
            const mf = mutualFunds.find(m => `mf_${m.code}` === editingId);
            if (mf) name = mf.name;
        } else if (editingId.startsWith('stock_')) {
            category = 'stock';
            // Find name from marketMovers or stock state
            if (editingId === 'stock_IBM') name = 'IBM';
            else {
                // Search in movers
                Object.values(marketMovers).flat().forEach(m => {
                    if (`stock_${m.id}` === editingId) name = m.name;
                });
            }
        }

        try {
            const res = await addInvestment({
                symbol: editingId,
                name: name, // Ideally we should pass the name properly
                category,
                quantity,
                investedAmount
            });

            if (res.success) {
                setHoldings(prev => ({
                    ...prev,
                    [editingId]: {
                        quantity,
                        invested: investedAmount,
                        name
                    }
                }));
                setEditingId(null);
                toast.success('Portfolio updated');
            }
        } catch (error) {
            console.error('Error saving investment:', error);
            toast.error('Failed to save investment');
        }
    };

    const fetchMetals = async () => {
        try {
            // Note: This API requires an API key. Using a placeholder or public endpoint if available.
            // If this fails, we might need to use a different free source or mock data for demo.
            // For now, attempting the request as requested, but handling failure gracefully.
            const response = await axios.get('https://api.metalpriceapi.com/v1/latest?api_key=bd8512f77085a615d9794c624c5b19e1&base=USD&currencies=XAU,XAG,XPD,XPT,XCU,ZNC');
            if (response.data && response.data.success) {
                setMetals(response.data.rates);
            } else {
                // Mock data for demonstration if API key is missing/invalid
                console.warn('MetalPriceAPI failed or requires key. Using mock data.');
                setMetals({
                    'USDXAU': 2034.50, // Gold
                    'USDXAG': 22.45,   // Silver
                    'USDXPD': 980.10,  // Palladium
                    'USDXPT': 920.30,  // Platinum
                    'USDXCU': 3.85,    // Copper
                    'USDZNC': 1.15     // Zinc
                });
            }
        } catch (error) {
            console.error('Error fetching metals:', error);
            // Fallback to mock data
            setMetals({
                'USDXAU': 2034.50,
                'USDXAG': 22.45,
                'USDXPD': 980.10,  // Palladium
                'USDXPT': 920.30,  // Platinum
                'USDXCU': 3.85,    // Copper
                'USDZNC': 1.15     // Zinc
            });
        }
    };

    const fetchCurrency = async () => {
        const pairs = [
            { from: 'USD', to: 'INR', name: 'US Dollar' },
            { from: 'EUR', to: 'INR', name: 'Euro' },
            { from: 'GBP', to: 'INR', name: 'British Pound' },
            { from: 'SAR', to: 'INR', name: 'Saudi Riyal' }
        ];

        const newCurrencies = {};

        await Promise.all(pairs.map(async (pair) => {
            try {
                // Frankfurter doesn't support SAR, so we might need a fallback or different logic
                if (pair.from === 'SAR') {
                    // Mock/Fallback for SAR since free APIs often miss it
                    // Or try to fetch if supported. Frankfurter usually supports ECB rates.
                    // SAR is pegged to USD approx 3.75. So 1 USD = 3.75 SAR. 
                    // 1 SAR = 1/3.75 USD. INR = USD_Rate * (1/3.75).
                    // Let's try fetching, if fail, use calculation or mock.
                    try {
                        const res = await axios.get(`https://api.frankfurter.app/latest?from=${pair.from}&to=${pair.to}`);
                        newCurrencies[pair.from] = { rate: res.data.rates[pair.to], date: res.data.date, name: pair.name };
                    } catch (e) {
                        // Fallback for SAR
                        newCurrencies[pair.from] = { rate: 22.23, date: new Date().toISOString().split('T')[0], name: pair.name, isMock: true };
                    }
                } else {
                    const response = await axios.get(`https://api.frankfurter.app/latest?from=${pair.from}&to=${pair.to}`);
                    newCurrencies[pair.from] = { rate: response.data.rates[pair.to], date: response.data.date, name: pair.name };
                }
            } catch (error) {
                console.error(`Error fetching ${pair.from}:`, error);
                // Fallback values if API fails
                const mockRates = { 'USD': 83.50, 'EUR': 90.20, 'GBP': 105.40, 'SAR': 22.23 };
                newCurrencies[pair.from] = { rate: mockRates[pair.from], date: new Date().toISOString().split('T')[0], name: pair.name, isMock: true };
            }
        }));
        setCurrencies(newCurrencies);
    };

    const fetchMutualFunds = async () => {
        const schemes = [
            { code: '120503', name: 'SBI Bluechip Fund' },
            { code: '102885', name: 'HDFC Top 100 Fund' },
            { code: '118989', name: 'Nippon India Large Cap' }
        ];

        try {
            const promises = schemes.map(scheme =>
                axios.get(`https://api.mfapi.in/mf/${scheme.code}`)
            );
            const results = await Promise.all(promises);
            const mfData = results.map((res, index) => ({
                code: schemes[index].code,
                name: schemes[index].name,
                nav: parseFloat(res.data.data[0].nav),
                date: res.data.data[0].date,
                meta: res.data.meta
            }));
            setMutualFunds(mfData);
        } catch (error) {
            console.error('Error fetching mutual funds:', error);
        }
    };

    const fetchStock = async () => {
        try {
            // Using demo key 'demo' which works for IBM
            const response = await axios.get('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo');
            if (response.data['Global Quote']) {
                setStock(response.data['Global Quote']);
            }
        } catch (error) {
            console.error('Error fetching stock:', error);
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchMetals(),
            fetchCurrency(),
            fetchMutualFunds(),
            fetchStock()
        ]);
        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Helper to get current price for a symbol
    const getCurrentPrice = (id) => {
        if (id.startsWith('metal_')) {
            const metalId = id.replace('metal_', '');
            return metals ? metals[metalId] : 0;
        }
        if (id.startsWith('mf_')) {
            const mfCode = id.replace('mf_', '');
            const mf = mutualFunds.find(m => m.code === mfCode);
            return mf ? mf.nav : 0;
        }
        if (id === 'stock_IBM') {
            return stock ? parseFloat(stock['05. price']) : 0;
        }
        if (id.startsWith('stock_')) {
            // Search in market movers
            let price = 0;
            Object.values(marketMovers).flat().forEach(m => {
                if (`stock_${m.id}` === id) price = m.price;
            });
            return price;
        }
        return 0;
    };

    // Calculate Portfolio Totals
    const portfolioTotals = React.useMemo(() => {
        let totalInvested = 0;
        let totalCurrentValue = 0;

        Object.entries(holdings).forEach(([id, holding]) => {
            const price = getCurrentPrice(id);
            if (price > 0) {
                totalInvested += holding.invested;
                totalCurrentValue += (holding.quantity * price);
            }
        });

        const totalPnL = totalCurrentValue - totalInvested;
        const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

        return { totalInvested, totalCurrentValue, totalPnL, totalPnLPercent };
    }, [holdings, metals, mutualFunds, stock, marketMovers]);

    // Helper to calculate returns
    const calculateReturns = (id, currentPrice) => {
        const holding = holdings[id];
        if (!holding || !holding.quantity) return null;

        const currentValue = holding.quantity * currentPrice;
        const invested = holding.invested;
        const profitLoss = currentValue - invested;
        const percentage = invested > 0 ? (profitLoss / invested) * 100 : 0;

        return {
            currentValue,
            invested,
            profitLoss,
            percentage
        };
    };

    const PortfolioSection = ({ id, currentPrice, currencySymbol = '$' }) => {
        const stats = calculateReturns(id, currentPrice);

        if (!stats) return (
            <button
                onClick={() => handleEditClick(id, holdings[id])}
                className="mt-4 w-full py-2 border border-dashed border-gray-600 text-gray-400 rounded-xl hover:bg-gray-700/50 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 text-sm"
            >
                <Plus className="w-4 h-4" /> Add Holdings
            </button>
        );

        return (
            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Your Investment</span>
                    <button
                        onClick={() => handleEditClick(id, holdings[id])}
                        className="text-gray-500 hover:text-emerald-400 transition-colors"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <p className="text-gray-500 text-xs">Invested</p>
                        <p className="text-gray-300">{currencySymbol}{stats.invested.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 text-xs">Current Value</p>
                        <p className="font-bold text-white">{currencySymbol}{stats.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="col-span-2 mt-1 bg-gray-900/50 rounded-lg p-2 flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Returns</span>
                        <span className={`font-bold ${stats.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stats.profitLoss >= 0 ? '+' : ''}{currencySymbol}{stats.profitLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({stats.percentage.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const Card = ({ title, icon: Icon, children, className = "" }) => (
        <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col h-full ${className}`}>
            <div className="flex items-center gap-3 mb-4 border-b border-gray-700 pb-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-100">{title}</h3>
            </div>
            <div className="flex-grow">
                {children}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-8">
            {/* SIP Calculator Modal */}
            {showCalculator && (
                <SIPCalculator onClose={() => setShowCalculator(false)} />
            )}

            {/* Edit Modal */}
            {editingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Edit Holdings</h3>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"
                                    placeholder="e.g. 10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Total Invested Amount</label>
                                <input
                                    type="number"
                                    value={editForm.invested}
                                    onChange={(e) => setEditForm({ ...editForm, invested: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none"
                                    placeholder="e.g. 5000"
                                />
                            </div>
                            <button
                                onClick={handleSaveHolding}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 transition-colors"
                            >
                                <Save className="w-4 h-4" /> Save Portfolio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-emerald-400 mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </Link>
                        <h2 className="text-3xl font-bold text-white">Investments Portfolio</h2>
                        <p className="text-gray-400 mt-1">
                            Real-time market data and investment tracking
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCalculator(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-xl transition-colors"
                    >
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>SIP Calculator</span>
                    </button>
                    <button
                        onClick={fetchAllData}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh Data</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Nifty 50 Index Card */}
                    <Card title="Nifty 50" icon={Activity}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-gray-400 text-sm">Index Value</p>
                                    <p className="text-3xl font-bold text-white">
                                        {nifty50.price.toLocaleString()}
                                    </p>
                                </div>
                                <span className={`text-sm px-2 py-1 rounded ${nifty50.change >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                                    {nifty50.change >= 0 ? '+' : ''}{nifty50.change} ({nifty50.percent}%)
                                </span>
                            </div>
                            <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
                            </div>
                        </div>
                    </Card>

                    {/* Currency Card */}
                    {/* Currency Card */}
                    <Card title="Currency Exchange (to INR)" icon={DollarSign}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {['USD', 'EUR', 'GBP', 'SAR'].map(code => {
                                const curr = currencies[code];
                                return (
                                    <div key={code} className="bg-gray-900/40 p-3 rounded-xl border border-gray-700/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-400 text-xs">{curr?.name || code}</p>
                                                <p className="text-xl font-bold text-white">
                                                    ₹{curr?.rate?.toFixed(2) || '---'}
                                                </p>
                                            </div>
                                            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                                {code}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-[10px] text-gray-500 text-right">
                                            {curr?.date}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Stock Market Card (IBM) */}
                    <Card title="Stock Market (IBM)" icon={TrendingUp}>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Price</span>
                                <span className="text-xl font-bold text-white">${stock?.['05. price'] || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Change</span>
                                <span className={`${parseFloat(stock?.['09. change']) >= 0 ? 'text-emerald-400' : 'text-red-400'} font-medium`}>
                                    {stock?.['09. change']} ({stock?.['10. change percent']})
                                </span>
                            </div>
                            <PortfolioSection
                                id="stock_IBM"
                                currentPrice={parseFloat(stock?.['05. price'] || 0)}
                                currencySymbol="$"
                            />
                        </div>
                    </Card>

                    {/* Commodities Card */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { id: 'USDXAU', name: 'Gold', price: metals?.USDXAU },
                            { id: 'USDXAG', name: 'Silver', price: metals?.USDXAG },
                            { id: 'USDXCU', name: 'Copper', price: metals?.USDXCU },
                            { id: 'USDXPT', name: 'Platinum', price: metals?.USDXPT }
                        ].map((metal) => (
                            <div key={metal.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-5 shadow-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase">{metal.name}</p>
                                        <p className="text-xl font-bold text-white">${metal.price?.toFixed(2)}</p>
                                    </div>
                                    <Layers className="w-5 h-5 text-emerald-500/50" />
                                </div>
                                <PortfolioSection
                                    id={`metal_${metal.id}`}
                                    currentPrice={metal.price || 0}
                                    currencySymbol="$"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Market Movers Section */}
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Market Movers
                    </h3>
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
                        {/* Tabs */}
                        <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
                            {['largeCap', 'midCap', 'smallCap'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveMoverTab(tab)}
                                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeMoverTab === tab
                                        ? 'text-emerald-400'
                                        : 'text-gray-400 hover:text-gray-200'
                                        }`}
                                >
                                    {tab === 'largeCap' ? 'Large Cap' : tab === 'midCap' ? 'Mid Cap' : 'Small Cap'}
                                    {activeMoverTab === tab && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400 rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Movers List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {marketMovers[activeMoverTab].map((mover) => (
                                <div key={mover.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 hover:border-emerald-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-white">{mover.name}</h4>
                                            <p className="text-xs text-gray-500">NSE</p>
                                        </div>
                                        <div className={`text-right ${mover.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            <p className="font-bold">₹{mover.price.toLocaleString()}</p>
                                            <p className="text-xs">{mover.change >= 0 ? '+' : ''}{mover.change} ({mover.percent}%)</p>
                                        </div>
                                    </div>
                                    <PortfolioSection
                                        id={`stock_${mover.id}`}
                                        currentPrice={mover.price}
                                        currencySymbol="₹"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mutual Funds Section */}
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-emerald-400" />
                        Top Mutual Funds
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {mutualFunds.map((mf, index) => (
                            <div key={index} className="bg-gray-800/30 border border-gray-700 rounded-xl p-5 hover:bg-gray-800/50 transition-colors flex flex-col h-full">
                                <h4 className="font-semibold text-emerald-400 mb-1 truncate" title={mf.name}>
                                    {mf.name}
                                </h4>
                                <div className="flex justify-between items-end mt-4 mb-2">
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase">NAV</p>
                                        <p className="text-2xl font-bold text-white">₹{mf.nav}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">{mf.date}</span>
                                </div>
                                <div className="mt-auto">
                                    <PortfolioSection
                                        id={`mf_${mf.code}`}
                                        currentPrice={mf.nav}
                                        currencySymbol="₹"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center mt-12 text-gray-500 text-xs pb-24">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            </div>

            {/* Fixed Summary Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-md border-t border-gray-700 p-4 shadow-2xl z-40 animate-slide-up">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Activity className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Net Invested</p>
                            <p className="text-xl font-bold text-white">₹{portfolioTotals.totalInvested.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider text-right">Current Value</p>
                            <p className="text-xl font-bold text-white">₹{portfolioTotals.totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Net P&L</p>
                            <p className={`text-xl font-bold ${portfolioTotals.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {portfolioTotals.totalPnL >= 0 ? '+' : ''}₹{portfolioTotals.totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                <span className="text-sm ml-1">({portfolioTotals.totalPnLPercent.toFixed(2)}%)</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Investments;

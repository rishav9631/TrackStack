import React from 'react';

const Navbar = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="bg-gray-800 p-2">
            <ul className="flex justify-around text-sm sm:text-base font-semibold">
                <li>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`p-3 rounded-2xl transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                    >
                        Dashboard
                    </button>
                </li>
                <li>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`p-3 rounded-2xl transition-colors ${activeTab === 'expenses' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                    >
                        Expenses
                    </button>
                </li>
                <li>
                    <button
                        onClick={() => setActiveTab('income')}
                        className={`p-3 rounded-2xl transition-colors ${activeTab === 'income' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                    >
                        Income
                    </button>
                </li>
                <li>
                    <button
                        onClick={() => setActiveTab('budget')}
                        className={`p-3 rounded-2xl transition-colors ${activeTab === 'budget' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                    >
                        Budget
                    </button>
                </li>
                <li>
                    <button
                        onClick={() => setActiveTab('addons')}
                        className={`p-3 rounded-2xl transition-colors ${activeTab === 'addons' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                    >
                        Add-ons
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;

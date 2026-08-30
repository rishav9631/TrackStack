import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet, PieChart, Puzzle, ShieldCheck } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
    const navigate = useNavigate();

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        navigate(`/${tab}`);
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'expenses', label: 'Expenses', icon: Receipt },
        { id: 'income', label: 'Income', icon: Wallet },
        { id: 'budget', label: 'Budget', icon: PieChart },
        { id: 'addons', label: 'Add-ons', icon: Puzzle },
        { id: 'admin', label: 'Admin Panel', icon: ShieldCheck },
    ];

    return (
        <nav className="bg-gray-900/90 backdrop-blur-xl border-b border-gray-800/80 px-4 py-3 sticky top-0 z-30 shadow-lg">
            <ul className="flex items-center justify-start sm:justify-center overflow-x-auto gap-2 text-sm font-medium no-scrollbar">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <li key={item.id} className="flex-shrink-0">
                            <button
                                onClick={() => handleTabClick(item.id)}
                                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 ${
                                    isActive
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 font-semibold scale-[1.02]'
                                        : 'hover:bg-gray-800/80 text-gray-300 hover:text-white'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                <span>{item.label}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default Navbar;

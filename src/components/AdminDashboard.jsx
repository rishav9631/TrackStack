import React, { useState, useEffect } from 'react';
import {
    getAppConfigRaw,
    updateAppConfig,
    testMongoUri,
    seedMasterUser,
    removeSeededUsers,
    getSeededUsers,
} from '../services/api';
import toast from 'react-hot-toast';
import {
    Bot,
    Database,
    Save,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    Copy,
    RefreshCw,
    Globe,
    UserCheck,
    Trash2,
    PlusCircle,
    Sliders,
} from 'lucide-react';

const AdminDashboard = () => {
    const [config, setConfig] = useState({
        geminiApiKey: '',
        geminiApiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        gmailClientId: '',
        gmailClientSecret: '',
        gmailRefreshToken: '',
        mongoUri: '',
        mailHost: 'smtp.gmail.com',
        mailUser: '',
        mailPass: '',
        googleClientId: '',
        reactAppBaseUrl: 'https://track-stack-git-main-rishavs-projects-ae4e8857.vercel.app',
        splitwiseRedirectUri: 'https://track-stack-git-main-rishavs-projects-ae4e8857.vercel.app/callback',
        port: 5000,
    });

    const [masterForm, setMasterForm] = useState({
        name: 'Rishav Jha',
        email: 'rishavjha771@gmail.com',
        password: 'Rishav@771',
    });

    const [seededUsersList, setSeededUsersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testingMongo, setTestingMongo] = useState(false);
    const [seedingMaster, setSeedingMaster] = useState(false);
    const [removingSeeded, setRemovingSeeded] = useState(false);
    const [mongoTestStatus, setMongoTestStatus] = useState(null);

    // Reveal Toggles
    const [showReveals, setShowReveals] = useState({
        geminiApiKey: false,
        gmailClientSecret: false,
        gmailRefreshToken: false,
        mongoUri: false,
        mailPass: false,
        masterPassword: false,
    });

    useEffect(() => {
        fetchConfig();
        fetchSeededUsers();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await getAppConfigRaw();
            if (res.data && res.data.config) {
                setConfig((prev) => ({
                    ...prev,
                    ...res.data.config,
                }));
            }
        } catch (err) {
            console.error('Failed to fetch config', err);
            toast.error('Failed to fetch system configuration');
        } finally {
            setLoading(false);
        }
    };

    const fetchSeededUsers = async () => {
        try {
            const res = await getSeededUsers();
            if (res.data && res.data.users) {
                setSeededUsersList(res.data.users);
            }
        } catch (err) {
            console.error('Failed to fetch seeded users', err);
        }
    };

    const toggleReveal = (field) => {
        setShowReveals((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleMasterFormChange = (e) => {
        const { name, value } = e.target;
        setMasterForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async (e) => {
        e?.preventDefault();
        setSaving(true);
        try {
            const res = await updateAppConfig(config);
            if (res.data.success) {
                toast.success('Configuration saved successfully!');
                if (res.data.config) {
                    setConfig((prev) => ({ ...prev, ...res.data.config }));
                }
            } else {
                toast.error(res.data.message || 'Failed to save configuration');
            }
        } catch (err) {
            console.error('Save error', err);
            toast.error(err.response?.data?.message || 'Error updating configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleTestMongo = async () => {
        if (!config.mongoUri) {
            toast.error('Please enter a MongoDB URI first');
            return;
        }
        setTestingMongo(true);
        setMongoTestStatus(null);
        try {
            const res = await testMongoUri(config.mongoUri);
            if (res.data.success) {
                setMongoTestStatus({ success: true, message: res.data.message });
                toast.success('MongoDB connection successful!');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to connect to MongoDB';
            setMongoTestStatus({ success: false, message: msg });
            toast.error('MongoDB connection test failed');
        } finally {
            setTestingMongo(false);
        }
    };

    const handleSeedMaster = async (e) => {
        e?.preventDefault();
        if (!masterForm.email || !masterForm.password) {
            toast.error('Please provide email and password for master seeding');
            return;
        }
        setSeedingMaster(true);
        try {
            const res = await seedMasterUser(masterForm);
            if (res.data.success) {
                toast.success(res.data.message || 'Master user seeded successfully!');
                fetchSeededUsers();
            } else {
                toast.error(res.data.message || 'Failed to seed master user');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to seed master user');
        } finally {
            setSeedingMaster(false);
        }
    };

    const handleRemoveSeeded = async () => {
        if (!window.confirm('Are you sure you want to remove all seeded master accounts from MongoDB?')) {
            return;
        }
        setRemovingSeeded(true);
        try {
            const res = await removeSeededUsers();
            if (res.data.success) {
                toast.success(res.data.message || 'Seeded users removed!');
                fetchSeededUsers();
            } else {
                toast.error(res.data.message || 'Failed to remove seeded users');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error removing seeded users');
        } finally {
            setRemovingSeeded(false);
        }
    };

    const copyToClipboard = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`);
    };

    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400 min-h-[60vh]">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
                <p className="text-sm font-medium">Loading system configuration...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-8 space-y-8 animate-fade-in font-sans">
            {/* Top Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-950 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center space-x-4">
                    <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 shadow-inner">
                        <Sliders className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                            Admin Control Center
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Production API keys, OAuth integrations, database parameters, and master user seeding.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={fetchConfig}
                        disabled={loading}
                        className="px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700/80 text-sm font-medium flex items-center gap-2 transition-all shadow hover:text-white"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30 hover:scale-[1.02]"
                    >
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            {/* SECTION 1: Gemini API Configuration */}
            <div className="bg-[#0f1422]/90 border border-gray-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Gemini API Configuration</h2>
                            <p className="text-xs text-gray-400">API key and endpoint for AI features</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Gemini API Key */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-gray-300 tracking-wide">Gemini API Key</label>
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(config.geminiApiKey, 'Gemini API Key')}
                                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleReveal('geminiApiKey')}
                                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                                >
                                    {showReveals.geminiApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    {showReveals.geminiApiKey ? 'Hide' : 'Reveal'}
                                </button>
                            </div>
                        </div>
                        <input
                            type={showReveals.geminiApiKey ? 'text' : 'password'}
                            name="geminiApiKey"
                            value={config.geminiApiKey || ''}
                            onChange={handleChange}
                            placeholder="••••••••••••••••••••••••••••••••••••••••"
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                        />
                    </div>

                    {/* Gemini API URL */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 tracking-wide mb-2">Gemini API URL</label>
                        <input
                            type="text"
                            name="geminiApiUrl"
                            value={config.geminiApiUrl || ''}
                            onChange={handleChange}
                            placeholder="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-200 font-mono focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* SECTION 2: Gmail REST API Configuration */}
            <div className="bg-[#0f1422]/90 border border-gray-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-lg w-11 h-11">
                        G
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Gmail REST API Configuration</h2>
                            <p className="text-xs text-gray-400">Primary email provider (HTTPS port 443 — sends directly from your @gmail.com address)</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Gmail OAuth Client ID */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 tracking-wide mb-2">Gmail OAuth Client ID</label>
                        <input
                            type="text"
                            name="gmailClientId"
                            value={config.gmailClientId || ''}
                            onChange={handleChange}
                            placeholder="1059520152914-p4nficc5kire34jcbm3gm9sjv2sa6dkc.apps.googleusercontent.com"
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-gray-200 font-mono focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Gmail OAuth Client Secret */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-gray-300 tracking-wide">Gmail OAuth Client Secret</label>
                            <button
                                type="button"
                                onClick={() => toggleReveal('gmailClientSecret')}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                            >
                                {showReveals.gmailClientSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {showReveals.gmailClientSecret ? 'Hide' : 'Reveal'}
                            </button>
                        </div>
                        <input
                            type={showReveals.gmailClientSecret ? 'text' : 'password'}
                            name="gmailClientSecret"
                            value={config.gmailClientSecret || ''}
                            onChange={handleChange}
                            placeholder="••••••••••••••••••••••••••••••••"
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Gmail OAuth Refresh Token */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-gray-300 tracking-wide">Gmail OAuth Refresh Token</label>
                            <button
                                type="button"
                                onClick={() => toggleReveal('gmailRefreshToken')}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                            >
                                {showReveals.gmailRefreshToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {showReveals.gmailRefreshToken ? 'Hide' : 'Reveal'}
                            </button>
                        </div>
                        <input
                            type={showReveals.gmailRefreshToken ? 'text' : 'password'}
                            name="gmailRefreshToken"
                            value={config.gmailRefreshToken || ''}
                            onChange={handleChange}
                            placeholder="••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* SECTION 3: Master User & Database Seeding */}
            <div className="bg-[#0f1422]/90 border border-gray-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                        <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Master User & Database Seeding</h2>
                            <p className="text-xs text-gray-400">Seed or remove master credentials in MongoDB (flagged with isSeeded: true)</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSeedMaster} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Master Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={masterForm.name}
                            onChange={handleMasterFormChange}
                            placeholder="Rishav Jha"
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Master Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={masterForm.email}
                            onChange={handleMasterFormChange}
                            placeholder="rishavjha771@gmail.com"
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-gray-300">Master Password</label>
                            <button
                                type="button"
                                onClick={() => toggleReveal('masterPassword')}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                            >
                                {showReveals.masterPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                        </div>
                        <input
                            type={showReveals.masterPassword ? 'text' : 'password'}
                            name="password"
                            value={masterForm.password}
                            onChange={handleMasterFormChange}
                            placeholder="Rishav@771"
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={seedingMaster}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow"
                        >
                            <PlusCircle className="w-4 h-4" />
                            {seedingMaster ? 'Seeding Master User...' : 'Seed / Update Master User in DB'}
                        </button>

                        <button
                            type="button"
                            onClick={handleRemoveSeeded}
                            disabled={removingSeeded}
                            className="px-5 py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                            {removingSeeded ? 'Removing...' : 'Remove All Seeded Credentials'}
                        </button>
                    </div>
                </form>

                {/* Seeded Users List */}
                <div className="border-t border-gray-800/80 pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                        Currently Seeded Master Accounts in Database ({seededUsersList.length})
                    </h3>

                    {seededUsersList.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No seeded master users in database.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {seededUsersList.map((user) => (
                                <div key={user._id || user.email} className="bg-[#0a0d18] border border-gray-800 rounded-xl p-3 flex items-center justify-between">
                                    <div className="truncate">
                                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                                        <p className="text-xs text-emerald-400 font-mono truncate">{user.email}</p>
                                    </div>
                                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                                        isSeeded
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 4: MongoDB Database Connection */}
            <div className="bg-[#0f1422]/90 border border-gray-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                        <Database className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">MongoDB Cluster Connection</h2>
                            <p className="text-xs text-gray-400">Database connection string URI for MongoDB Atlas</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-300 tracking-wide">MongoDB URI (MONGO_URI)</label>
                        <button
                            type="button"
                            onClick={() => toggleReveal('mongoUri')}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                        >
                            {showReveals.mongoUri ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showReveals.mongoUri ? 'Hide' : 'Reveal'}
                        </button>
                    </div>
                    <input
                        type={showReveals.mongoUri ? 'text' : 'password'}
                        name="mongoUri"
                        value={config.mongoUri || ''}
                        onChange={handleChange}
                        placeholder="mongodb+srv://<username>:<password>@cluster0.wohhvgj.mongodb.net/ExpenseTrackerDB"
                        className="w-full bg-[#0a0d18] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
                    />

                    <div className="flex items-center justify-between pt-2">
                        <button
                            type="button"
                            onClick={handleTestMongo}
                            disabled={testingMongo}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-gray-700 transition-all"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${testingMongo ? 'animate-spin' : ''}`} />
                            {testingMongo ? 'Testing Connection...' : 'Test Mongo Connection'}
                        </button>

                        {mongoTestStatus && (
                            <div className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-xl border ${mongoTestStatus.success ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-red-950/60 text-red-300 border-red-500/40'}`}>
                                {mongoTestStatus.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                                <span>{mongoTestStatus.message}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 5: General Endpoints & Ports */}
            <div className="bg-[#0f1422]/90 border border-gray-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Endpoints & Server Configuration</h2>
                            <p className="text-xs text-gray-400">Frontend Base URL, OAuth Callbacks, and Port</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Frontend Base URL</label>
                        <input
                            type="text"
                            name="reactAppBaseUrl"
                            value={config.reactAppBaseUrl || ''}
                            onChange={handleChange}
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Splitwise Redirect URI</label>
                        <input
                            type="text"
                            name="splitwiseRedirectUri"
                            value={config.splitwiseRedirectUri || ''}
                            onChange={handleChange}
                            className="w-full bg-[#0a0d18] border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-teal-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

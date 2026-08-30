import React, { useState, useEffect } from 'react';
import { getAppConfigRaw, updateAppConfig, testMongoUri } from '../services/api';
import toast from 'react-hot-toast';
import { Database, Save, CheckCircle, XCircle, Eye, EyeOff, Copy, RefreshCw, Key, Shield, Mail, Globe } from 'lucide-react';

const AdminDashboard = () => {
    const [config, setConfig] = useState({
        mongoUri: '',
        mailHost: 'smtp.gmail.com',
        mailUser: '',
        mailPass: '',
        googleClientId: '',
        reactAppBaseUrl: 'http://localhost:3000',
        splitwiseRedirectUri: 'http://localhost:3000/callback',
        port: 5000,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testingMongo, setTestingMongo] = useState(false);
    const [mongoTestStatus, setMongoTestStatus] = useState(null); // { success: boolean, message: string }
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchConfig();
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig((prev) => ({
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

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    const setPlaceholderUri = () => {
        setConfig((prev) => ({
            ...prev,
            mongoUri: 'mongodb+srv://rishav771:QpZ1UtoB7JNvFffs@cluster0.wohhvgj.mongodb.net/ExpenseTrackerDB',
        }));
        toast('Applied active cluster URL preset', { icon: '⚡' });
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading admin configuration...
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-fade-in text-gray-200">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/40 via-gray-800/60 to-gray-900/60 border border-emerald-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            Admin Dashboard & DB Settings
                        </h2>
                        <p className="text-sm text-gray-300">
                            Configure dynamic database connection strings, environment parameters, and master access.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchConfig}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 text-sm flex items-center gap-2 transition-all shadow"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
                    >
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Master Credentials Notice */}
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="text-sm text-blue-200">
                        <span className="font-semibold text-blue-300">Master Credentials Configured:</span> Username:{' '}
                        <code className="bg-blue-900/60 px-2 py-0.5 rounded text-white font-mono">Rishav771</code> | Password:{' '}
                        <code className="bg-blue-900/60 px-2 py-0.5 rounded text-white font-mono">Rishav771</code>
                    </div>
                </div>
                <button
                    onClick={() => copyToClipboard('Rishav771', 'Master Password')}
                    className="text-xs bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-400/30 transition-colors"
                >
                    Copy Creds
                </button>
            </div>

            {/* MongoDB Connection Card */}
            <div className="bg-gray-800/60 border border-gray-700/80 rounded-2xl p-6 shadow-xl space-y-6 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-700 pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">MongoDB Connection URL</h3>
                            <p className="text-xs text-gray-400">
                                Real-time dynamic URI used for connecting to MongoDB database.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={setPlaceholderUri}
                        className="text-xs text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/80 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-colors self-start sm:self-auto"
                    >
                        Load Cluster0 Preset
                    </button>
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Mongo Connection String (MONGO_URI)
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="mongoUri"
                            value={config.mongoUri || ''}
                            onChange={handleChange}
                            placeholder="mongodb+srv://<username>:<password>@cluster0.wohhvgj.mongodb.net/ExpenseTrackerDB"
                            className="w-full bg-gray-900/90 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-24"
                        />
                        <div className="absolute right-2 top-2.5 flex items-center space-x-1">
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                                title={showPassword ? 'Hide URI' : 'Show URI'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => copyToClipboard(config.mongoUri, 'MongoDB URI')}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                                title="Copy URI"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Test Connection Button & Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                    <button
                        type="button"
                        onClick={handleTestMongo}
                        disabled={testingMongo}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all border border-gray-600"
                    >
                        <RefreshCw className={`w-4 h-4 ${testingMongo ? 'animate-spin' : ''}`} />
                        {testingMongo ? 'Testing Connection...' : 'Test Mongo Connection'}
                    </button>

                    {mongoTestStatus && (
                        <div
                            className={`flex items-center space-x-2 text-xs px-3 py-2 rounded-xl border ${
                                mongoTestStatus.success
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                    : 'bg-red-950/60 text-red-300 border-red-500/40'
                            }`}
                        >
                            {mongoTestStatus.success ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                            <span>{mongoTestStatus.message}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Other App Configurations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email / SMTP Configuration */}
                <div className="bg-gray-800/60 border border-gray-700/80 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-sm">
                    <div className="flex items-center space-x-3 border-b border-gray-700 pb-3">
                        <Mail className="w-5 h-5 text-purple-400" />
                        <h3 className="text-base font-semibold text-white">Email / SMTP Config</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">SMTP Host</label>
                            <input
                                type="text"
                                name="mailHost"
                                value={config.mailHost || ''}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">SMTP User Email</label>
                            <input
                                type="text"
                                name="mailUser"
                                value={config.mailUser || ''}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">SMTP App Password</label>
                            <input
                                type="password"
                                name="mailPass"
                                value={config.mailPass || ''}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Server & Client Endpoints */}
                <div className="bg-gray-800/60 border border-gray-700/80 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-sm">
                    <div className="flex items-center space-x-3 border-b border-gray-700 pb-3">
                        <Globe className="w-5 h-5 text-blue-400" />
                        <h3 className="text-base font-semibold text-white">Endpoints & Port</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Frontend Base URL</label>
                            <input
                                type="text"
                                name="reactAppBaseUrl"
                                value={config.reactAppBaseUrl || ''}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Splitwise Redirect URI</label>
                            <input
                                type="text"
                                name="splitwiseRedirectUri"
                                value={config.splitwiseRedirectUri || ''}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Server Port</label>
                            <input
                                type="number"
                                name="port"
                                value={config.port || 5000}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

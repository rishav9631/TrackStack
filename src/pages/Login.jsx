import React, { useState } from 'react';
import { login, googleLogin } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Login = ({ setAuth }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const { email, password } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Logging in...');
        try {
            const res = await login(formData);
            localStorage.setItem('token', res.data.token);
            setAuth(true);
            toast.success('Login successful', { id: toastId });
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed', { id: toastId });
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        const toastId = toast.loading('Logging in with Google...');
        try {
            const res = await googleLogin(credentialResponse.credential);
            localStorage.setItem('token', res.data.token);
            setAuth(true);
            toast.success('Google Login successful', { id: toastId });
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Google Login failed', { id: toastId });
            setError(err.response?.data?.message || 'Google Login failed');
        }
    };

    return (
        <div className="min-h-screen flex font-sans relative overflow-hidden">

            {/* Left Side - Container for the Card */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
                {/* The Card */}
                <div className="bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800/50">
                    <h2 className="text-3xl font-bold text-center mb-6 text-emerald-500">Login</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm font-medium">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                required
                                autoComplete="email"
                                className="w-full p-3 rounded-lg bg-gray-800/50 text-white border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors outline-none"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm font-medium">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                required
                                autoComplete="current-password"
                                className="w-full p-3 rounded-lg bg-gray-800/50 text-white border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors outline-none"
                                placeholder="Enter your password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-emerald-900/20"
                        >
                            Login
                        </button>
                    </form>

                    <div className="mt-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                setError('Google Login Failed');
                            }}
                            theme="filled_black"
                            shape="pill"
                            width="100%"
                        />
                    </div>

                    <p className="text-center mt-4 text-gray-400 text-sm">
                        <Link to="/forgot-password" className="text-emerald-500 hover:underline">
                            Forgot Password?
                        </Link>
                    </p>
                    <p className="text-center mt-2 text-gray-400 text-sm">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-emerald-500 hover:underline font-medium">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Hero Section (Transparent Background) */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center z-10">
                <div className="relative max-w-lg text-center p-12">
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                        Welcome to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Money Manager</span>
                    </h1>
                    <p className="text-xl text-gray-300 mb-8 drop-shadow-md">
                        Your personal finance companion. Track, save, and grow your wealth with ease.
                    </p>

                    {/* Floating Cards Decoration */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-emerald-500/20 rounded-2xl rotate-12 backdrop-blur-sm border border-emerald-500/20 animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-700"></div>
                </div>
            </div>
        </div>
    );
};

export default Login;

import React, { useState } from 'react';
import { register, googleLogin } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Signup = ({ setAuth }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const { name, email, password } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Registering...');
        try {
            const res = await register(formData);
            setMessage(res.data.message);
            setError('');
            toast.success('Registration successful. Please check your email.', { id: toastId });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            setMessage('');
            toast.error(err.response?.data?.message || 'Registration failed', { id: toastId });
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        const toastId = toast.loading('Signing up with Google...');
        try {
            const res = await googleLogin(credentialResponse.credential);
            localStorage.setItem('token', res.data.token);
            if (setAuth) setAuth(true);
            toast.success('Google Signup successful', { id: toastId });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Google Signup failed');
            toast.error(err.response?.data?.message || 'Google Signup failed', { id: toastId });
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-900 font-sans selection:bg-emerald-500/30 relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl"></div>
            </div>

            {/* Left Side - Container for the Card */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
                {/* The Card */}
                <div className="bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-800/50">
                    <h2 className="text-3xl font-bold text-center mb-6 text-emerald-500">Sign Up</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center mb-4">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 p-3 rounded-lg text-sm text-center mb-4">
                            {message}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm font-medium">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                required
                                autoComplete="name"
                                className="w-full p-3 rounded-lg bg-gray-800/50 text-white border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors outline-none"
                                placeholder="John Doe"
                            />
                        </div>
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
                                placeholder="name@example.com"
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
                                autoComplete="new-password"
                                className="w-full p-3 rounded-lg bg-gray-800/50 text-white border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors outline-none"
                                placeholder="Create a strong password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-emerald-900/20"
                        >
                            Sign Up
                        </button>
                    </form>

                    <div className="mt-6 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                setError('Google Signup Failed');
                            }}
                            theme="filled_black"
                            shape="pill"
                            width="100%"
                            text="signup_with"
                        />
                    </div>

                    <p className="text-center mt-4 text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-500 hover:underline font-medium">
                            Login
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Hero Section (Transparent Background) */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center z-10">
                <div className="relative max-w-lg text-center p-12">
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                        Start Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Journey</span>
                    </h1>
                    <p className="text-xl text-gray-300 mb-8 drop-shadow-md">
                        Create an account to start tracking expenses, setting budgets, and achieving your financial goals.
                    </p>

                    {/* Floating Cards Decoration */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/20 rounded-2xl rotate-12 backdrop-blur-sm border border-purple-500/20 animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl animate-pulse delay-700"></div>
                </div>
            </div>
        </div>
    );
};

export default Signup;

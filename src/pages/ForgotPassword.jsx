import React, { useState } from 'react';
import { forgotPassword, resetPassword } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Sending OTP...');
        try {
            await forgotPassword(email);
            setStep(2);
            setMessage('OTP sent to your email');
            setError('');
            toast.success('OTP sent to your email', { id: toastId });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
            toast.error(err.response?.data?.message || 'Failed to send OTP', { id: toastId });
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Resetting password...');
        try {
            await resetPassword({ email, otp, newPassword });
            setMessage('Password reset successfully');
            setError('');
            toast.success('Password reset successfully', { id: toastId });
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
            toast.error(err.response?.data?.message || 'Failed to reset password', { id: toastId });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-6 text-emerald-500">Reset Password</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                {message && <p className="text-green-500 text-center mb-4">{message}</p>}

                {step === 1 ? (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div>
                            <label className="block text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full p-3 rounded-lg bg-gray-800 text-white border-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Send OTP
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="block text-gray-400 mb-2">OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                className="w-full p-3 rounded-lg bg-gray-800 text-white border-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full p-3 rounded-lg bg-gray-800 text-white border-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Reset Password
                        </button>
                    </form>
                )}

                <p className="text-center mt-4 text-gray-400">
                    <Link to="/login" className="text-emerald-500 hover:underline">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;

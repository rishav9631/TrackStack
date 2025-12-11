import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('Verifying...');

    useEffect(() => {
        const verify = async () => {
            const toastId = toast.loading('Verifying email...');
            try {
                await verifyEmail(token);
                setStatus('Email verified successfully! You can now login.');
                toast.success('Email verified successfully!', { id: toastId });
            } catch (err) {
                setStatus('Verification failed. Invalid or expired token.');
                toast.error('Verification failed. Invalid or expired token.', { id: toastId });
            }
        };
        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
                <p className="mb-6 text-gray-300">{status}</p>
                <Link to="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-colors">
                    Go to Login
                </Link>
            </div>
        </div>
    );
};

export default VerifyEmail;

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { handleOAuthCallback } from '../services/splitwiseService';
import toast from 'react-hot-toast';

const SplitwiseCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(true);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            handleOAuthCallback(code)
                .then(() => {
                    toast.success('Connected to Splitwise successfully!');
                    navigate('/splitwise-expenses');
                })
                .catch((err) => {
                    console.error(err);
                    toast.error('Failed to connect to Splitwise.');
                    navigate('/splitwise-expenses');
                })
                .finally(() => {
                    setProcessing(false);
                });
        } else {
            navigate('/splitwise-expenses');
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Connecting to Splitwise...</h2>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
            </div>
        </div>
    );
};

export default SplitwiseCallback;

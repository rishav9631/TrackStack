import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Investments from './components/Investments';
import SplitwiseExpenses from './pages/SplitwiseExpenses';
import SplitwiseCallback from './pages/SplitwiseCallback';

import { Toaster } from 'react-hot-toast';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const setAuth = (boolean) => {
    setIsAuthenticated(boolean);
  };

  return (
    <div className="relative min-h-screen">
      {/* Global Background Decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <Router>
          <Toaster position="top-center" reverseOrder={false} />
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <Login setAuth={setAuth} /> : <Navigate to="/" />}
            />
            <Route
              path="/signup"
              element={!isAuthenticated ? <Signup /> : <Navigate to="/" />}
            />
            <Route
              path="/verify-email/:token"
              element={<VerifyEmail />}
            />
            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />
            <Route
              path="/"
              element={isAuthenticated ? <Home setAuth={setAuth} /> : <Navigate to="/login" />}
            />
            <Route
              path="/investments"
              element={isAuthenticated ? <Investments /> : <Navigate to="/login" />}
            />
            <Route
              path="/splitwise-expenses"
              element={isAuthenticated ? <SplitwiseExpenses /> : <Navigate to="/login" />}
            />
            <Route
              path="/callback"
              element={isAuthenticated ? <SplitwiseCallback /> : <Navigate to="/login" />}
            />
          </Routes>
        </Router>
      </div>
    </div>
  );
};

export default App;

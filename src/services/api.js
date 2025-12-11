import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: BASE_URL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const register = (userData) => api.post('/api/auth/register', userData);
export const verifyEmail = (token) => api.post('/api/auth/verify-email', { token });
export const login = (userData) => api.post('/api/auth/login', userData);
export const googleLogin = (credential) => api.post('/api/auth/google-login', { credential });
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (data) => api.post('/api/auth/reset-password', data);
export const getMe = () => api.get('/api/auth/me');
// Expense Categories
export const getExpenseCategories = () => api.get('/api/expenses/categories');
export const addExpenseCategory = (category) => api.post('/api/expenses/categories', { category });
export const renameExpenseCategory = (oldCategory, newCategory) => api.put('/api/expenses/categories', { oldCategory, newCategory });
export const deleteExpenseCategory = (category) => api.delete(`/api/expenses/categories/${category}`);

// Income Categories
export const getIncomeCategories = () => api.get('/api/incomes/categories');
export const addIncomeCategory = (category) => api.post('/api/incomes/categories', { category });
export const renameIncomeCategory = (oldCategory, newCategory) => api.put('/api/incomes/categories', { oldCategory, newCategory });
export const deleteIncomeCategory = (category) => api.delete(`/api/incomes/categories/${category}`);

// Budget Categories
export const getBudgetCategories = () => api.get('/api/budgets/categories');
export const addBudgetCategory = (category) => api.post('/api/budgets/categories', { category });
export const renameBudgetCategory = (oldCategory, newCategory) => api.put('/api/budgets/categories', { oldCategory, newCategory });
export const deleteBudgetCategory = (category) => api.delete(`/api/budgets/categories/${category}`);

export const getExpenses = () => api.get('/api/expenses');
export const addExpense = (data) => api.post('/api/expenses', data);
export const updateExpense = (id, data) => api.put(`/api/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/api/expenses/${id}`);
export const deleteAllExpenses = () => api.delete('/api/expenses');
export const getExpenseReport = (data) => api.post('/api/expenses/report', data);
export const getExpenseReportPdf = (data) => api.post('/api/expenses/report/pdf', data, { responseType: 'blob' });
export const emailExpenseReport = (data) => api.post('/api/expenses/report/email-pdf', data);

export const getIncomes = () => api.get('/api/incomes');
export const addIncome = (data) => api.post('/api/incomes', data);
export const updateIncome = (id, data) => api.put(`/api/incomes/${id}`, data);
export const deleteIncome = (id) => api.delete(`/api/incomes/${id}`);

export const getBudgets = () => api.get('/api/budgets');
export const setBudget = (data) => api.post('/api/budgets', data);
export const updateBudget = (id, data) => api.put(`/api/budgets/${id}`, data);
export const deleteBudget = (id) => api.delete(`/api/budgets/${id}`);

export const runGemini = (data) => api.post('/run-gemini', data);

// Investment APIs
export const addInvestment = async (investmentData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${BASE_URL}/api/investments/add`, investmentData, {
        headers: { 'x-auth-token': token },
    });
    return response.data;
};

export const getInvestments = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${BASE_URL}/api/investments/get`, {
        headers: { 'x-auth-token': token },
    });
    return response.data;
};

export const deleteInvestment = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${BASE_URL}/api/investments/delete/${id}`, {
        headers: { 'x-auth-token': token },
    });
    return response.data;
};

export default api;

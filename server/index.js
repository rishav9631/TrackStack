require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');

// Connect to MongoDB
connectDB();

const app = express();

// Comprehensive CORS setup
app.use(cors({
  origin: true, // Reflects the requesting origin (Vercel, localhost, etc.)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With', 'Accept'],
}));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors());

app.use(express.json());

// Ensure DB connection on incoming requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (_) {}
  next();
});

// Wake-up Ping (Public)
app.get('/api/start', (req, res) => {
  try {
    res.json({ message: 'Turning the Backend on' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to respond' });
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Protected Routes
app.use('/api/expenses', authMiddleware, require('./routes/expenseRoutes'));
app.use('/api/incomes', authMiddleware, require('./routes/incomeRoutes'));
app.use('/api/budgets', authMiddleware, require('./routes/budgetRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/run-gemini', authMiddleware, require('./routes/aiRoutes'));
app.use('/api/investments', authMiddleware, require('./routes/investmentRoutes'));
app.use('/api/splitwise', require('./routes/splitwiseRoutes'));
app.use('/api/config', require('./routes/configRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const mongoose = require('mongoose');
const dns = require('dns');
const bcrypt = require('bcryptjs');

// Configure DNS fallback for hosting providers (e.g. Render)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
  console.warn('Unable to set custom DNS servers:', err.message);
}

let isConnected = false;

const autoSeedMasterUsers = async () => {
  try {
    const User = require('../models/User');
    const hashedPassword = await bcrypt.hash('Rishav@771', 10);
    const emailsToSeed = ['rishavjha771@gmail.com', 'rishavkk771@gmail.com', 'rishav771@gmail.com'];

    for (const email of emailsToSeed) {
      let user = await User.findOne({ email });
      if (user) {
        if (!user.isVerified || user.name !== 'Rishav Jha') {
          user.isVerified = true;
          user.name = 'Rishav Jha';
          user.password = hashedPassword;
          await user.save();
        }
      } else {
        await User.create({
          name: 'Rishav Jha',
          email,
          password: hashedPassword,
          isVerified: true,
          authProvider: 'local',
          customCategories: ['Rent', 'Electricity', 'Maid', 'Groceries', 'Food', 'Entertainment', 'Loan Repayment', 'Miscellaneous'],
        });
        console.log(`[AutoSeed] Seeded master user: ${email}`);
      }
    }
  } catch (seedErr) {
    console.warn('[AutoSeed] Notice:', seedErr.message);
  }
};

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const defaultUri = "mongodb+srv://rishav771:QpZ1UtoB7JNvFffs@cluster0.wohhvgj.mongodb.net/ExpenseTrackerDB";
  const uri = (process.env.MONGO_URI && !process.env.MONGO_URI.includes('tzjm4zy'))
    ? process.env.MONGO_URI
    : defaultUri;

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto seed master users on connection
    autoSeedMasterUsers();
  } catch (error) {
    console.error(`Error Connecting to MongoDB: ${error.message}`);
  }
};

module.exports = connectDB;

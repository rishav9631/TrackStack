const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS fallback for hosting providers (e.g. Render)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
  console.warn('Unable to set custom DNS servers:', err.message);
}

let isConnected = false;

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
  } catch (error) {
    console.error(`Error Connecting to MongoDB: ${error.message}`);
  }
};

module.exports = connectDB;

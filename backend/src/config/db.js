const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coderank');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed - check MONGODB_URI in backend/.env');
    console.error(`Details: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

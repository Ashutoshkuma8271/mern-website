const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8+ no longer needs useNewUrlParser / useUnifiedTopology
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Make sure MongoDB is running locally:');
    console.error('     - Windows: Open Services and start "MongoDB Server"');
    console.error('     - Or run: mongod --dbpath ./data');
    console.error('  2. Or use MongoDB Atlas and update MONGODB_URI in backend/.env');
    process.exit(1);
  }
};

module.exports = connectDB;

require('dotenv').config();
console.log('Environment variables loaded');

const express = require('express');
console.log('Express loaded');

const connectDB = require('./config/db');
console.log('DB config loaded');

try {
  const app = express();
  console.log('Express app created successfully');
  
  app.get('/', (req, res) => {
    res.json({ status: 'test' });
  });
  
  console.log('Test server setup complete');
} catch (error) {
  console.error('Error creating app:', error);
}

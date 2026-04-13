require('dotenv').config();

try {
  const authRoutes = require('./models/routes/auth');
  console.log('Auth routes loaded successfully');
} catch (error) {
  console.error('Error loading auth routes:', error.message);
  console.error('Stack:', error.stack);
}

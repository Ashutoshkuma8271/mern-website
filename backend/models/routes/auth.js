const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, employeeId } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if employee ID already exists (if provided)
    if (employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({ message: 'Employee ID already exists' });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      department: department || 'General',
      employeeId: employeeId || null
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        employeeId: user.employeeId,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        employeeId: user.employeeId,
        role: user.role,
        faceRegistered: user.faceRegistered,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/register-face - Save face descriptor to user profile
router.post('/register-face', auth, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    const userId = req.user.id;

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({
        message: 'Invalid face descriptor. Must be an array of 128 numbers.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.faceDescriptor = faceDescriptor;
    user.faceRegistered = true;
    await user.save();

    res.json({
      message: 'Face registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        faceRegistered: user.faceRegistered,
      },
    });
  } catch (error) {
    console.error('Register face error:', error);
    res.status(500).json({ message: 'Server error during face registration' });
  }
});

// GET /api/auth/face-status - Check if face is registered
router.get('/face-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('faceRegistered faceDescriptor');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      faceRegistered: user.faceRegistered,
      hasFaceDescriptor: user.faceDescriptor && user.faceDescriptor.length > 0,
    });
  } catch (error) {
    console.error('Get face status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/all-faces - Get all registered face descriptors (for matching)
router.get('/all-faces', auth, async (req, res) => {
  try {
    // Check if user is admin or if it's for face matching purposes
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const faces = await User.find({
      faceRegistered: true,
      faceDescriptor: { $exists: true, $ne: [] }
    }).select('_id name email faceDescriptor');

    res.json({
      faces: faces.map(face => ({
        id: face._id,
        name: face.name,
        email: face.email,
        faceDescriptor: face.faceDescriptor,
      })),
      count: faces.length,
    });
  } catch (error) {
    console.error('Get all faces error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

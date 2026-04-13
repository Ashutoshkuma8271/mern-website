const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../User');
const Attendance = require('../Attendance');
const auth = require('../../middleware/auth');

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

// POST /api/auth/register-face - Save enhanced AI face descriptor to user profile
router.post('/register-face', auth, async (req, res) => {
  try {
    const { faceDescriptor, isEnhanced, faceShape, retinaConfidence } = req.body;
    const userId = req.user.id;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        message: 'Invalid face descriptor. Must be an array of numbers.'
      });
    }

    // Validate descriptor length based on type
    if (isEnhanced && faceDescriptor.length !== 256) {
      return res.status(400).json({
        message: 'Invalid enhanced face descriptor. Must be an array of 256 numbers.'
      });
    } else if (!isEnhanced && faceDescriptor.length !== 128) {
      return res.status(400).json({
        message: 'Invalid face descriptor. Must be an array of 128 numbers.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store enhanced AI features
    if (isEnhanced) {
      user.enhancedFaceDescriptor = faceDescriptor;
      user.faceDescriptor = faceDescriptor.slice(0, 128); // Store standard version as fallback
    } else {
      user.faceDescriptor = faceDescriptor;
    }

    if (faceShape) user.faceShape = faceShape;
    if (retinaConfidence) user.retinaConfidence = retinaConfidence;

    user.faceRegistered = true;
    await user.save();

    res.json({
      message: 'Advanced AI face registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        faceRegistered: user.faceRegistered,
        faceShape: user.faceShape,
        retinaConfidence: user.retinaConfidence,
        isEnhanced: !!user.enhancedFaceDescriptor.length,
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

// GET /api/auth/all-faces - Get all registered enhanced AI face descriptors (for matching)
router.get('/all-faces', auth, async (req, res) => {
  try {
    // Check if user is admin or if it's for face matching purposes
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const faces = await User.find({
      faceRegistered: true,
      $or: [
        { faceDescriptor: { $exists: true, $ne: [] } },
        { enhancedFaceDescriptor: { $exists: true, $ne: [] } }
      ]
    }).select('_id name email faceDescriptor enhancedFaceDescriptor faceShape retinaConfidence');

    res.json({
      faces: faces.map(face => ({
        id: face._id,
        name: face.name,
        email: face.email,
        faceDescriptor: face.enhancedFaceDescriptor.length > 0 ? face.enhancedFaceDescriptor : face.faceDescriptor,
        isEnhanced: face.enhancedFaceDescriptor.length > 0,
        faceShape: face.faceShape,
        retinaConfidence: face.retinaConfidence,
      })),
      count: faces.length,
    });
  } catch (error) {
    console.error('Get all faces error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/clear-face-data — remove face enrollment for current user
router.post('/clear-face-data', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        faceDescriptor: [],
        enhancedFaceDescriptor: [],
        faceRegistered: false,
        retinaConfidence: 0,
      },
      $unset: { faceShape: 1 },
    });
    res.json({ message: 'Face enrollment cleared. You can register again from Register Face.' });
  } catch (error) {
    console.error('Clear face data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/account — delete user, attendance, and face data (requires password)
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete your account' });
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    await Attendance.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

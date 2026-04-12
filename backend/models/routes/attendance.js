const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate Euclidean distance between face descriptors
const calculateFaceDistance = (descriptor1, descriptor2) => {
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
  }
  return Math.sqrt(sum);
};

// Helper function to find best face match
const findBestFaceMatch = (detectedDescriptor, registeredFaces) => {
  let bestMatch = null;
  let minDistance = Infinity;
  
  for (const face of registeredFaces) {
    if (face.faceDescriptor && face.faceDescriptor.length > 0) {
      const distance = calculateFaceDistance(detectedDescriptor, face.faceDescriptor);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = face;
      }
    }
  }
  
  // Convert distance to confidence (lower distance = higher confidence)
  const confidence = Math.max(0, 1 - (minDistance / 0.6)); // 0.6 is a typical threshold
  
  return { user: bestMatch, confidence, distance: minDistance };
};

// POST /api/attendance/check-in
router.post('/check-in', auth, async (req, res) => {
  try {
    const { faceDescriptor, confidence } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const existingAttendance = await Attendance.getTodayAttendance(userId);
    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ 
        message: 'Already checked in today',
        attendance: existingAttendance
      });
    }

    // If face descriptor provided, verify identity
    let verifiedUserId = userId;
    let finalConfidence = confidence || 1.0;
    
    if (faceDescriptor && faceDescriptor.length > 0) {
      // Get all registered faces for matching
      const registeredFaces = await User.find({ 
        faceRegistered: true,
        faceDescriptor: { $exists: true, $ne: [] }
      }).select('_id name email faceDescriptor');

      if (registeredFaces.length === 0) {
        return res.status(400).json({ 
          message: 'No registered faces found in the system' 
        });
      }

      const match = findBestFaceMatch(faceDescriptor, registeredFaces);
      
      if (match.confidence < 0.6) { // 60% confidence threshold
        return res.status(401).json({ 
          message: 'Face not recognized. Please try again or register your face.',
          confidence: match.confidence
        });
      }

      verifiedUserId = match.user._id;
      finalConfidence = match.confidence;
    }

    // Create or update attendance record
    let attendance = existingAttendance || new Attendance({
      userId: verifiedUserId,
      date: today,
    });

    attendance.checkIn = new Date();
    attendance.method = faceDescriptor ? 'facial' : 'manual';
    attendance.confidence = finalConfidence;

    await attendance.save();
    await attendance.populate('userId', 'name email employeeId department');

    res.status(201).json({
      message: 'Check-in successful',
      attendance,
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

// POST /api/attendance/check-out
router.post('/check-out', auth, async (req, res) => {
  try {
    const { faceDescriptor, confidence } = req.body;
    const userId = req.user.id;

    let attendance = await Attendance.getTodayAttendance(userId);
    
    if (!attendance) {
      return res.status(404).json({ 
        message: 'No check-in record found for today' 
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ 
        message: 'Already checked out today',
        attendance
      });
    }

    // If face descriptor provided, verify identity
    let finalConfidence = confidence || 1.0;
    
    if (faceDescriptor && faceDescriptor.length > 0) {
      const registeredFaces = await User.find({ 
        faceRegistered: true,
        faceDescriptor: { $exists: true, $ne: [] }
      }).select('_id name email faceDescriptor');

      const match = findBestFaceMatch(faceDescriptor, registeredFaces);
      
      if (match.confidence < 0.6) {
        return res.status(401).json({ 
          message: 'Face not recognized. Please try again.',
          confidence: match.confidence
        });
      }

      finalConfidence = match.confidence;
    }

    attendance.checkOut = new Date();
    attendance.method = faceDescriptor ? 'facial' : 'manual';
    attendance.confidence = finalConfidence;

    await attendance.save();
    await attendance.populate('userId', 'name email employeeId department');

    res.json({
      message: 'Check-out successful',
      attendance,
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error during check-out' });
  }
});

// GET /api/attendance/today
router.get('/today', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const attendance = await Attendance.getTodayAttendance(userId);
    
    if (!attendance) {
      return res.json({ 
        message: 'No attendance record for today',
        attendance: null
      });
    }

    res.json({ attendance });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;

    const attendance = await Attendance.getAttendanceHistory(userId, startDate, endDate);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = attendance.slice(startIndex, endIndex);

    res.json({
      attendance: paginatedResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(attendance.length / limit),
        totalRecords: attendance.length,
      },
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : currentDate.getFullYear();

    const stats = await Attendance.getAttendanceStats(userId, selectedYear, selectedMonth);
    
    // Format stats
    const formattedStats = {
      present: 0,
      late: 0,
      absent: 0,
      halfDay: 0,
      total: 0,
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.json({ stats: formattedStats });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/all (Admin only)
router.get('/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const attendance = await Attendance.getAllAttendance(startDate, endDate);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = attendance.slice(startIndex, endIndex);

    res.json({
      attendance: paginatedResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(attendance.length / limit),
        totalRecords: attendance.length,
      },
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

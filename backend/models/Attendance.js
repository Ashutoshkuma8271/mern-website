const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD format for easy querying
    required: true,
  },
  checkIn: {
    type: Date,
    default: null,
  },
  checkOut: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'half-day'],
    default: 'present',
  },
  method: {
    type: String,
    enum: ['facial', 'manual'],
    default: 'facial',
  },
  confidence: {
    type: Number,
    default: 0,
  },
  workHours: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index: one record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Pre-save middleware to determine status based on check-in time
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.isModified('checkIn')) {
    const checkInHour = this.checkIn.getHours();
    const checkInMinutes = this.checkIn.getMinutes();
    const totalMinutes = checkInHour * 60 + checkInMinutes;
    
    // Consider late if check-in is after 9:30 AM
    if (totalMinutes > 570) { // 9:30 AM = 9 * 60 + 30 = 570 minutes
      this.status = 'late';
    }
  }
  
  // Calculate work hours if both check-in and check-out are present
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    this.workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  
  next();
});

// Static method to get today's attendance for a user
attendanceSchema.statics.getTodayAttendance = function(userId) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return this.findOne({
    userId,
    date: today,
  }).populate('userId', 'name email employeeId department');
};

// Static method to get attendance history with date range
attendanceSchema.statics.getAttendanceHistory = function(userId, startDate, endDate) {
  const query = { userId };
  
  if (startDate && endDate) {
    query.date = {
      $gte: startDate,
      $lte: endDate,
    };
  }
  
  return this.find(query)
    .populate('userId', 'name email employeeId department')
    .sort({ date: -1 });
};

// Static method to get attendance statistics for a user in a month
attendanceSchema.statics.getAttendanceStats = function(userId, year, month) {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
};

// Static method to get all attendance records (admin)
attendanceSchema.statics.getAllAttendance = function(startDate, endDate) {
  const query = {};
  
  if (startDate && endDate) {
    query.date = {
      $gte: startDate,
      $lte: endDate,
    };
  }
  
  return this.find(query)
    .populate('userId', 'name email employeeId department')
    .sort({ date: -1, checkIn: -1 });
};

module.exports = mongoose.model('Attendance', attendanceSchema);

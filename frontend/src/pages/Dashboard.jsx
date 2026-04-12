import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState({ present: 0, late: 0, absent: 0, halfDay: 0, total: 0 });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [faceStatus, setFaceStatus] = useState({ faceRegistered: false, hasFaceDescriptor: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load today's attendance
        const todayResponse = await api.get('/attendance/today');
        setTodayAttendance(todayResponse.data.attendance);

        // Load monthly stats
        const currentDate = new Date();
        const statsResponse = await api.get(`/attendance/stats?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`);
        setMonthlyStats(statsResponse.data.stats);

        // Load recent attendance (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const historyResponse = await api.get(`/attendance/history?startDate=${sevenDaysAgo.toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`);
        setRecentAttendance(historyResponse.data.attendance.slice(0, 7));

        // Load face status
        const faceResponse = await api.get('/auth/face-status');
        setFaceStatus(faceResponse.data);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'present': return 'status-present';
      case 'late': return 'status-late';
      case 'absent': return 'status-absent';
      case 'half-day': return 'status-half-day';
      default: return 'status-no-record';
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="page-loader-spinner"></div>
        <p className="page-loader-text">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-inner">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Welcome back, <span className="dashboard-greeting-name">{user?.name}</span> 👋
          </h1>
          <p className="dashboard-subtitle">Here's your attendance overview and quick actions</p>
        </div>

        {/* Today's Status */}
        <div className="today-card">
          <h2 className="today-card-title">📅 Today's Status</h2>
          <div className="today-grid">
            <div className="today-item">
              <p className="today-item-label">Check-in</p>
              <p className="today-item-value">
                {todayAttendance?.checkIn
                  ? new Date(todayAttendance.checkIn).toLocaleTimeString()
                  : 'Not checked in'}
              </p>
            </div>
            <div className="today-item">
              <p className="today-item-label">Check-out</p>
              <p className="today-item-value">
                {todayAttendance?.checkOut
                  ? new Date(todayAttendance.checkOut).toLocaleTimeString()
                  : 'Not checked out'}
              </p>
            </div>
            <div className="today-item">
              <p className="today-item-label">Status</p>
              <span className={`status-badge ${todayAttendance ? getStatusClass(todayAttendance.status) : 'status-no-record'}`}>
                {todayAttendance?.status || 'No record'}
              </span>
            </div>
            <div className="today-item">
              <p className="today-item-label">Work Hours</p>
              <p className="today-item-value">
                {todayAttendance?.workHours ? `${todayAttendance.workHours}h` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Days</p>
            <p className="stat-value gradient">{monthlyStats.total}</p>
          </div>
          <div className="stat-card stat-success">
            <p className="stat-label" style={{ color: '#6ee7b7' }}>Present</p>
            <p className="stat-value text-success">{monthlyStats.present}</p>
          </div>
          <div className="stat-card stat-warning">
            <p className="stat-label" style={{ color: '#fcd34d' }}>Late</p>
            <p className="stat-value text-warning">{monthlyStats.late}</p>
          </div>
          <div className="stat-card stat-error">
            <p className="stat-label" style={{ color: '#fca5a5' }}>Absent</p>
            <p className="stat-value text-error">{monthlyStats.absent}</p>
          </div>
          <div className="stat-card stat-info">
            <p className="stat-label" style={{ color: '#93c5fd' }}>Half Day</p>
            <p className="stat-value text-info">{monthlyStats.halfDay || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="quick-actions-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <button
              onClick={() => navigate('/mark-attendance')}
              className="action-card action-card-green"
            >
              <div className="action-card-icon">⏰</div>
              <h3 className="action-card-title">Mark Attendance</h3>
              <p className="action-card-desc">Use facial recognition to check in/out</p>
            </button>

            {!faceStatus.faceRegistered ? (
              <button
                onClick={() => navigate('/face-register')}
                className="action-card action-card-purple"
              >
                <div className="action-card-icon">👤</div>
                <h3 className="action-card-title">Register Face</h3>
                <p className="action-card-desc">Register your face for automatic attendance</p>
              </button>
            ) : (
              <div className="action-card action-card-done">
                <div className="action-card-icon">✅</div>
                <h3 className="action-card-title">Face Registered</h3>
                <p className="action-card-desc">Your face is registered for recognition</p>
              </div>
            )}

            <button
              onClick={() => navigate('/attendance-history')}
              className="action-card action-card-pink"
            >
              <div className="action-card-icon">📊</div>
              <h3 className="action-card-title">View History</h3>
              <p className="action-card-desc">Check your attendance records and statistics</p>
            </button>
          </div>
        </div>

        {/* Recent Attendance Table */}
        <div className="data-table-wrapper">
          <div className="data-table-header">
            <h2 className="data-table-title">Recent Attendance (Last 7 Days)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="table-empty">
                      No recent attendance records
                    </td>
                  </tr>
                ) : (
                  recentAttendance.map((record) => (
                    <tr key={record._id}>
                      <td className="text-white">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td>
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td>
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>
                        {record.workHours ? `${record.workHours}h` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

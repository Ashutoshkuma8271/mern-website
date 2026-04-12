import { useState, useEffect } from 'react';
import api from '../api';

export default function AttendanceHistory() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, halfDay: 0, total: 0 });

  // Load attendance history
  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setLoading(true);
        setError('');

        const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
        const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-31`;

        const response = await api.get(`/attendance/history?startDate=${startDate}&endDate=${endDate}`);
        setAttendance(response.data.attendance);
      } catch (err) {
        console.error('Error loading attendance:', err);
        setError('Failed to load attendance history');
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [selectedMonth, selectedYear]);

  // Load attendance stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get(`/attendance/stats?month=${selectedMonth}&year=${selectedYear}`);
        setStats(response.data.stats);
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    };

    loadStats();
  }, [selectedMonth, selectedYear]);

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Check In', 'Check Out', 'Status', 'Method', 'Work Hours'],
      ...attendance.map(record => [
        record.date,
        record.checkIn ? new Date(record.checkIn).toLocaleString() : 'N/A',
        record.checkOut ? new Date(record.checkOut).toLocaleString() : 'N/A',
        record.status,
        record.method,
        record.workHours || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedYear}_${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get calendar days for the selected month
  const getCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Get attendance record for a specific date
  const getAttendanceForDate = (day) => {
    if (!day) return null;
    const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return attendance.find(record => record.date === dateStr);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'present': return 'status-present';
      case 'late': return 'status-late';
      case 'absent': return 'status-absent';
      case 'half-day': return 'status-half-day';
      default: return 'status-no-record';
    }
  };

  const getCalendarStatusClass = (status) => {
    switch (status) {
      case 'present': return 'status-present';
      case 'late': return 'status-late';
      case 'absent': return 'status-absent';
      case 'half-day': return 'status-half-day';
      default: return '';
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="page-loader">
        <div className="page-loader-spinner"></div>
        <p className="page-loader-text">Loading attendance history...</p>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-inner">
        <div className="page-header">
          <h1 className="page-title">Attendance History</h1>
          <p className="page-subtitle">View and export your attendance records</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Days</p>
            <p className="stat-value gradient">{stats.total}</p>
          </div>
          <div className="stat-card stat-success">
            <p className="stat-label" style={{ color: '#6ee7b7' }}>Present</p>
            <p className="stat-value text-success">{stats.present}</p>
          </div>
          <div className="stat-card stat-warning">
            <p className="stat-label" style={{ color: '#fcd34d' }}>Late</p>
            <p className="stat-value text-warning">{stats.late}</p>
          </div>
          <div className="stat-card stat-error">
            <p className="stat-label" style={{ color: '#fca5a5' }}>Absent</p>
            <p className="stat-value text-error">{stats.absent}</p>
          </div>
          <div className="stat-card stat-info">
            <p className="stat-label" style={{ color: '#93c5fd' }}>Half Day</p>
            <p className="stat-value text-info">{stats.halfDay || 0}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="history-controls">
          <div className="history-filters">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="filter-select"
              id="history-month-select"
            >
              {months.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="filter-select"
              id="history-year-select"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <div className="view-toggle">
              <button
                onClick={() => setViewMode('table')}
                className={`view-toggle-btn${viewMode === 'table' ? ' active' : ''}`}
                id="view-table-btn"
              >
                📋 Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`view-toggle-btn${viewMode === 'calendar' ? ' active' : ''}`}
                id="view-calendar-btn"
              >
                📅 Calendar
              </button>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            disabled={attendance.length === 0}
            className="btn btn-success btn-sm"
            id="export-csv-btn"
          >
            ⬇️ Export CSV
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="data-table-wrapper">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Work Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="table-empty">
                        No attendance records found for this period
                      </td>
                    </tr>
                  ) : (
                    attendance.map((record) => (
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
                          <span className={`method-badge ${record.method === 'facial' ? 'method-facial' : 'method-manual'}`}>
                            {record.method === 'facial' ? '👤 facial' : '✍️ manual'}
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
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="calendar-wrapper">
            <div className="calendar-grid">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-header-cell">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getCalendarDays().map((day, index) => {
                const attendanceRecord = getAttendanceForDate(day);
                const isToday = day === new Date().getDate() &&
                               selectedMonth === new Date().getMonth() + 1 &&
                               selectedYear === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={`calendar-cell${
                      !day ? '' :
                      isToday ? ' is-today' :
                      attendanceRecord ? ' has-data' : ''
                    }`}
                  >
                    {day && (
                      <>
                        <div className={`calendar-day-number${isToday ? ' today' : ''}`}>
                          {day}
                        </div>
                        {attendanceRecord && (
                          <span className={`calendar-status ${getCalendarStatusClass(attendanceRecord.status)}`}>
                            {attendanceRecord.status === 'present' ? 'P' :
                             attendanceRecord.status === 'late' ? 'L' :
                             attendanceRecord.status === 'absent' ? 'A' : 'H'}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-dot present"></div>
                <span>Present (P)</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot late"></div>
                <span>Late (L)</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot absent"></div>
                <span>Absent (A)</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot half-day"></div>
                <span>Half Day (H)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

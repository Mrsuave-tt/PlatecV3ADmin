import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAttendanceRecords, getAllUsers, getStudentsByTeacher } from '../services/firebase';

const AttendanceReport = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredAttendance, setFilteredAttendance] = useState([]);

  useEffect(() => {
    fetchData();
  }, [user, userData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let studentsResult;
      if (userData.role === 'admin') {
        studentsResult = await getAllUsers('student');
      } else if (userData.role === 'teacher') {
        studentsResult = await getStudentsByTeacher(user.uid);
      }

      if (studentsResult.success) {
        setStudents(studentsResult.data);
      }

      const attendanceResult = await getAttendanceRecords();
      if (attendanceResult.success) {
        // Filter based on role
        let filtered = attendanceResult.data;
        if (userData.role === 'teacher') {
          const studentIds = studentsResult.data.map(s => s.id);
          filtered = filtered.filter(a => studentIds.includes(a.studentId));
        }
        setAttendance(filtered);
        setFilteredAttendance(filtered);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let filtered = [...attendance];

    if (selectedStudent) {
      filtered = filtered.filter(a => a.studentId === selectedStudent);
    }

    if (startDate) {
      filtered = filtered.filter(a => a.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(a => a.date <= endDate);
    }

    setFilteredAttendance(filtered);
  };

  const handleReset = () => {
    setSelectedStudent('');
    setStartDate('');
    setEndDate('');
    setFilteredAttendance(attendance);
  };

  const getStats = () => {
    return {
      total: filteredAttendance.length,
      present: filteredAttendance.filter(a => a.status === 'present').length,
      absent: filteredAttendance.filter(a => a.status === 'absent').length,
      late: filteredAttendance.filter(a => a.status === 'late').length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading report...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>Attendance Report</h1>
          <p>{filteredAttendance.length} records</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div className="form-group">
            <label>Student</label>
            <select
              className="form-select"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">All Students</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <button className="btn btn-primary" onClick={handleFilter}>
            Apply Filters
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ marginLeft: '10px' }}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Records</p>
        </div>
        <div className="stat-card">
          <h3>{stats.present}</h3>
          <p>Present</p>
        </div>
        <div className="stat-card">
          <h3>{stats.absent}</h3>
          <p>Absent</p>
        </div>
        <div className="stat-card">
          <h3>{stats.late}</h3>
          <p>Late</p>
        </div>
      </div>

      {/* Report Table */}
      <div className="card">
        <h2>Attendance Records</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>
                  No records found
                </td>
              </tr>
            ) : (
              filteredAttendance.map(record => {
                const student = students.find(s => s.id === record.studentId);
                return (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{student ? student.name : 'Unknown'}</td>
                    <td>
                      <span className={`status-badge status-${record.status}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.notes || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceReport;

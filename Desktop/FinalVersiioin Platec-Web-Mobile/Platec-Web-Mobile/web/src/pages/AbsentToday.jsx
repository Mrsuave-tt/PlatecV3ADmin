import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getAttendanceRecords } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import HarvardNavigation from '../components/HarvardNavigation';

const AbsentToday = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResult, attendanceResult] = await Promise.all([
        getAllUsers(),
        getAttendanceRecords()
      ]);
      
      if (usersResult.success) setUsers(usersResult.data);
      if (attendanceResult.success) setAttendance(attendanceResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodayAbsentLate = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.filter(record => 
      record.date === today && (record.status === 'absent' || record.status === 'late')
    );
  };

  if (loading) {
    return (
      <>
        <HarvardNavigation />
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading attendance records...</p>
          </div>
        </div>
      </>
    );
  }

  const absentToday = getTodayAbsentLate();

  return (
    <>
      <HarvardNavigation />
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'var(--harvard-crimson)', fontSize: '2.5rem', marginBottom: '10px' }}>
            Absent/Late Today
          </h1>
          <p style={{ color: 'var(--harvard-muted)', fontSize: '1.1rem', fontStyle: 'italic' }}>
            Daily Attendance Report - {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: 'var(--harvard-crimson)' }}>
              Attendance Issues ({absentToday.length})
            </h2>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/admin')}
            >
              Back to Dashboard
            </button>
          </div>

          {absentToday.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--harvard-muted)', padding: '40px' }}>
              No students marked absent or late today
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Status</th>
                  <th>Time Marked</th>
                  <th>Marked By</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {absentToday.map(record => {
                  const student = users.find(u => u.id === record.studentId);
                  const markedBy = users.find(u => u.id === record.markedBy);
                  return (
                    <tr key={record.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--harvard-text)' }}>
                          {student ? student.name : 'Unknown'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', background: 'var(--harvard-light-gray)', padding: '4px 8px', borderRadius: '4px' }}>
                          {student ? student.id.slice(-6) : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${record.status}`}>
                          {record.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--harvard-crimson)', fontWeight: '500' }}>
                          {record.timestamp || new Date().toLocaleTimeString()}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge status-present">
                          {markedBy ? markedBy.name : 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontStyle: 'italic', color: 'var(--harvard-muted)' }}>
                          {record.reason || 'Not specified'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            // Could add functionality to contact parent/guardian
                            alert(`Contact parent for ${student?.name || 'student'}`);
                          }}
                        >
                          Contact
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default AbsentToday;

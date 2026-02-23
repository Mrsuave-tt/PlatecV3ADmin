import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, getStudentsByTeacher, getAttendanceRecords, markAttendance, createUser, getDepartments } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import HarvardNavigation from '../components/HarvardNavigation';

const TeacherDashboard = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [myDepartments, setMyDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [message, setMessage] = useState('');
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching data for teacher:', user.uid);

      // Get teacher's students
      const studentsResult = await getStudentsByTeacher(user.uid);
      console.log('📚 Students result:', studentsResult);

      let teacherStudentIds = [];
      if (studentsResult.success) {
        setStudents(studentsResult.data);
        teacherStudentIds = studentsResult.data.map(s => s.id);
        console.log(`✅ Found ${studentsResult.data.length} students`);
        console.log('🆔 Student IDs:', teacherStudentIds);
      } else {
        console.error('❌ Error fetching students:', studentsResult.error);
        setMessage(`Error fetching students: ${studentsResult.error}`);
      }

      // Get attendance records
      const attendanceResult = await getAttendanceRecords();
      if (attendanceResult.success) {
        const filteredAttendance = attendanceResult.data.filter(record =>
          teacherStudentIds.includes(record.studentId)
        );
        setAttendance(filteredAttendance);
      }

      // Get teacher's departments
      const deptResult = await getDepartments();
      if (deptResult.success) {
        const mine = deptResult.data.filter(d => (d.teacherIds || []).includes(user.uid));
        setMyDepartments(mine);
      }
    } catch (error) {
      console.error('❌ fetchData error:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    const result = await createUser(
      newStudent.email,
      newStudent.password,
      newStudent.name,
      'student',
      user.uid // Pass teacher's UID as createdBy
    );

    if (result.success) {
      setMessage('Student added successfully!');
      setNewStudent({ name: '', email: '', password: '' });
      setShowAddStudent(false);
      setTimeout(() => fetchData(), 1000);
    } else {
      setMessage(`Error: ${result.error}`);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();

    const result = await markAttendance(selectedStudent, attendanceStatus, user.uid);

    if (result.success) {
      setMessage('Attendance marked successfully!');
      setSelectedStudent('');
      setAttendanceStatus('present');
      setShowMarkAttendance(false);
      setTimeout(() => fetchData(), 1000);
    } else {
      setMessage(`Error: ${result.error}`);
    }
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      navigate('/login');
    }
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.filter(record => record.date === today);
  };

  const getAttendanceStats = () => {
    const todayAttendance = getTodayAttendance();
    return {
      total: todayAttendance.length,
      present: todayAttendance.filter(a => a.status === 'present').length,
      absent: todayAttendance.filter(a => a.status === 'absent').length,
      late: todayAttendance.filter(a => a.status === 'late').length
    };
  };

  if (!user) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = getAttendanceStats();

  return (
    <>
      <HarvardNavigation />
      <div className="container">
        <div style={{
          background: 'linear-gradient(135deg, #9B1B30 0%, #7a1427 100%)',
          borderRadius: '18px',
          padding: '32px 36px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(155,27,48,0.18)'
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Teacher Dashboard</p>
            <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: '800', marginBottom: '10px', letterSpacing: '-0.5px' }}>
              {userData?.name || 'Teacher'}
            </h1>
            {/* Department badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '16px' }}>🏛️</span>
              {myDepartments.length === 0 ? (
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontStyle: 'italic' }}>No department assigned yet</span>
              ) : (
                myDepartments.map(d => (
                  <span key={d.id} style={{
                    background: 'rgba(255,255,255,0.18)',
                    color: '#fff',
                    borderRadius: '20px',
                    padding: '4px 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(4px)'
                  }}>{d.name}</span>
                ))
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: '10px',
                padding: '10px 18px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
              }}
              onClick={() => navigate('/attendance-report')}
            >
              📋 Reports
            </button>
            <button
              style={{
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px',
                padding: '10px 18px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div className={message.includes('success') ? 'success-message' : 'error-message'}>
            {message}
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{students.length}</h3>
            <p>Total Students</p>
          </div>
          <div className="stat-card">
            <h3>{stats.present}</h3>
            <p>Present Today</p>
          </div>
          <div className="stat-card">
            <h3>{stats.absent}</h3>
            <p>Absent Today</p>
          </div>
          <div className="stat-card">
            <h3>{stats.late}</h3>
            <p>Late Today</p>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Today's Attendance</h2>
            <div>
              <button
                className="btn btn-success"
                onClick={() => setShowAddStudent(!showAddStudent)}
              >
                Add Student
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowMarkAttendance(!showMarkAttendance)}
                style={{ marginLeft: '10px' }}
              >
                Mark Attendance
              </button>
            </div>
          </div>

          {showAddStudent && (
            <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
              <h3>Add New Student</h3>
              <form onSubmit={handleAddStudent}>
                <div className="form-group">
                  <label>Student Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <button type="submit" className="btn btn-success">
                  Add Student
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => setShowAddStudent(false)}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {showMarkAttendance && (
            <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
              <h3>Mark Attendance</h3>
              <form onSubmit={handleMarkAttendance}>
                <div className="form-group">
                  <label>Select Student</label>
                  <select
                    className="form-select"
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Attendance Status</label>
                  <select
                    className="form-select"
                    value={attendanceStatus}
                    onChange={(e) => setAttendanceStatus(e.target.value)}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-success">
                  Mark Attendance
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ marginLeft: '10px' }}
                  onClick={() => setShowMarkAttendance(false)}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          <table className="table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {getTodayAttendance().length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>
                    No attendance records for today
                  </td>
                </tr>
              ) : (
                getTodayAttendance().map(record => {
                  const student = students.find(s => s.id === record.studentId);
                  return (
                    <tr key={record.id}>
                      <td>{student ? student.name : 'Unknown'}</td>
                      <td>{student ? student.email : 'Unknown'}</td>
                      <td>
                        <span className={`badge ${record.status === 'present' ? 'bg-success' :
                          record.status === 'absent' ? 'bg-danger' : 'bg-warning'
                          }`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.date}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;
